import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

import config from '../../src/config';
import DiscussionFilter from './components/DiscussionFilter';
import DiscussionList from './components/DiscussionList';
import DiscussionStats from './components/DiscussionStats';
import './Discussion.css';

const SOCKET_URL = config.SOCKET_URL;
let socket;

export function DiscussionBoard() {
  const navigate = useNavigate();

  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    category: 'All',
    sort: 'recent',
    search: '',
    tags: [],
    timeRange: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  // Fetch current user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${config.API_URL}/user/current-user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  const isAdmin = currentUser?.role === 'Admin';

  // Initialize socket connection
  useEffect(() => {
    try {
      socket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Socket connected successfully');
        setSocketConnected(true);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setSocketConnected(false);
      });

      socket.on('new_discussion', (newDiscussion) => {
        setDiscussions(prev => [newDiscussion, ...prev]);
      });

      socket.on('update_discussion', (updatedDiscussion) => {
        setDiscussions(prev =>
          prev.map(discussion =>
            discussion._id === updatedDiscussion._id ? updatedDiscussion : discussion
          )
        );
      });

      socket.on('delete_discussion', ({ id }) => {
        setDiscussions(prev =>
          prev.filter(discussion => discussion._id !== id)
        );
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    } catch (err) {
      console.error('Error setting up socket connection:', err);
      setSocketConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscussions();
  }, [filters, pagination.currentPage]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      // Build query string with filters and pagination
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All') {
        params.append('category', filters.category);
      }

      // Convert sortBy values from the filter to sort values for the API
      if (filters.sortBy) {
        let sortValue;
        switch (filters.sortBy) {
          case 'newest':
            sortValue = 'recent';
            break;
          case 'oldest':
            sortValue = 'oldest';
            break;
          case 'mostLiked':
            sortValue = 'popular';
            break;
          case 'mostReplies':
            sortValue = 'mostReplies';
            break;
          case 'mostViewed':
            sortValue = 'mostViewed';
            break;
          default:
            sortValue = 'recent';
        }
        params.append('sort', sortValue);
      } else if (filters.sort) {
        params.append('sort', filters.sort);
      }

      // Add search query if present
      if (filters.searchQuery) {
        params.append('search', filters.searchQuery);
      } else if (filters.search) {
        params.append('search', filters.search);
      }

      // Add time range filter if not 'all'
      if (filters.timeRange && filters.timeRange !== 'all') {
        params.append('timeRange', filters.timeRange);
      }

      // Add tags filter if present
      if (filters.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }

      // Add pagination parameters
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.limit);

      console.log('Fetching discussions with params:', params.toString());

      const response = await axios.get(
        `${config.API_URL}/discussions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Discussions data received:', response.data);

      if (response.data && response.data.discussions) {
        setDiscussions(response.data.discussions);
        setPagination({
          ...pagination,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || 1
        });
        setError(null);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Received invalid data format from the server.');
      }
    } catch (err) {
      console.error('Error fetching discussions:', err);
      setError(`Failed to load discussions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setFilters(prev => ({ ...prev, ...newFilter }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleCreateDiscussion = () => {
    navigate('/discussion/create');
  };

  return (
    <div className="discussion-board-container">
      <div className="discussion-board-header">
        <div className="header-content">
          <div>
            <h1>Shopkeeper Discussion Board</h1>
            <p>Connect with other shop owners, share insights, and discuss business challenges</p>
          </div>
          <Link
            to="/discussion/create"
            className="create-discussion-btn"
            style={{ textDecoration: 'none' }}
          >
            <i className="fas fa-plus"></i> Start a New Discussion
          </Link>
        </div>
      </div>

      {!socketConnected && (
        <div className="socket-warning">
          Real-time updates might not be available. Some features may be limited.
        </div>
      )}

      <div className="discussion-board-layout">
        <div className="discussion-sidebar">
          <div className="filter-container">
            <DiscussionFilter filters={filters} onFilterChange={handleFilterChange} />
          </div>
          <div className="stats-container">
            <DiscussionStats />
          </div>
        </div>

        <div className="discussion-main">
          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading discussions...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button
                onClick={fetchDiscussions}
                className="retry-button"
              >
                Retry
              </button>
            </div>
          ) : discussions.length === 0 ? (
            <div className="no-discussions">
              <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-discussion-forum-4100760-3430078.png" alt="Empty discussions" style={{ maxWidth: '200px', opacity: '0.7' }} />
              <h3>No discussions found</h3>
              <p>Be the first to start a discussion!</p>
              <Link
                to="/discussion/create"
                className="start-discussion-btn"
                style={{ textDecoration: 'none' }}
              >
                Start a Discussion
              </Link>
            </div>
          ) : (
            <DiscussionList
              discussions={discussions}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}