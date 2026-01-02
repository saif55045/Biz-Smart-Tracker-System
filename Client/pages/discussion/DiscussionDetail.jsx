import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import io from 'socket.io-client';
import config from '../../src/config';
import { useToast } from '../../components/Toast';
import './Discussion.css';

const SOCKET_URL = config.SOCKET_URL;
let socket;


export function DiscussionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [discussion, setDiscussion] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    socket = io(SOCKET_URL);

    // Join this discussion's room
    socket.emit('join_discussion', id);

    socket.on('new_reply', ({ discussionId, reply }) => {
      if (discussionId === id) {
        setDiscussion(prevDiscussion => ({
          ...prevDiscussion,
          replies: [...prevDiscussion.replies, reply],
          updatedAt: new Date().toISOString()
        }));
      }
    });

    socket.on('update_discussion', (updatedDiscussion) => {
      if (updatedDiscussion._id === id) {
        setDiscussion(updatedDiscussion);
      }
    });

    socket.on('update_likes', ({ discussionId, likes }) => {
      if (discussionId === id) {
        setDiscussion(prevDiscussion => ({
          ...prevDiscussion,
          likes: likes
        }));
      }
    });

    socket.on('update_reply_likes', ({ discussionId, replyId, likes }) => {
      if (discussionId === id) {
        setDiscussion(prevDiscussion => {
          const updatedReplies = prevDiscussion.replies.map(reply =>
            reply._id === replyId ? { ...reply, likes } : reply
          );

          return {
            ...prevDiscussion,
            replies: updatedReplies
          };
        });
      }
    });

    return () => {
      // Leave the room when component unmounts
      socket.emit('leave_discussion', id);
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${config.API_URL}/user/current-user`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${config.API_URL}/discussions/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setDiscussion(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching discussion:', err);
        setError('Failed to load discussion. It may have been deleted or you do not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussion();
  }, [id, navigate]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!replyContent.trim()) return;

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${config.API_URL}/discussions/${id}/replies`,
        { content: replyContent },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setReplyContent('');
      // The socket will handle updating the UI
    } catch (err) {
      console.error('Error posting reply:', err);
      toast.error('Failed to post reply. Please try again.');
    }
  };

  const handleLikeDiscussion = async () => {
    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${config.API_URL}/discussions/${id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // The socket will handle updating the UI
    } catch (err) {
      console.error('Error liking discussion:', err);
      toast.error('Failed to like discussion. Please try again.');
    }
  };

  const handleLikeReply = async (replyId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${config.API_URL}/discussions/${id}/replies/${replyId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // The socket will handle updating the UI
    } catch (err) {
      console.error('Error liking reply:', err);
      toast.error('Failed to like reply. Please try again.');
    }
  };

  const handleEdit = () => {
    navigate(`/discussion/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${config.API_URL}/discussions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      navigate('/discussion');
    } catch (err) {
      console.error('Error deleting discussion:', err);
      toast.error('Failed to delete discussion. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return <div className="loading-indicator">Loading discussion...</div>;
  }

  if (error || !discussion) {
    return (
      <div className="error-message">
        <p>{error || 'Discussion not found'}</p>
        <Link to="/discussion" className="back-link">Back to Discussions</Link>
      </div>
    );
  }

  const isAuthor = currentUser && discussion.author._id === currentUser._id;
  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div className="discussion-board-container">
      <Link to="/discussion" className="back-link">
        <i className="fas fa-arrow-left"></i> Back to Discussions
      </Link>
      <div className="discussion-detail">
        <div className="discussion-detail-header">
          <h1 className="discussion-detail-title">{discussion.title}</h1>

          <div className="discussion-detail-meta">
            <div>
              <strong>{discussion.author.company_name}</strong> • Posted {formatDate(discussion.createdAt)}
              {discussion.createdAt !== discussion.updatedAt && (
                <span> • Updated {formatDate(discussion.updatedAt)}</span>
              )}
            </div>
            <div className="discussion-detail-stats">
              <span className="discussion-stat" title="Views">
                <i className="fas fa-eye"></i> {discussion.views || 0}
              </span>
              <span className={`discussion-category category-${discussion.category.toLowerCase().replace(' ', '-')}`}>
                {discussion.category}
              </span>
            </div>
          </div>
        </div>

        <div className="discussion-content">
          {discussion.content}
        </div>

        {discussion.tags && discussion.tags.length > 0 && (
          <div className="discussion-tags">
            {discussion.tags.map((tag, index) => (
              <span key={index} className="discussion-tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="discussion-actions">
          <button
            className={`like-button ${currentUser && discussion.likes && Array.isArray(discussion.likes) && discussion.likes.includes(currentUser._id) ? 'active' : ''}`}
            onClick={handleLikeDiscussion}
          >
            <i className="fas fa-heart"></i> {discussion.likes ? discussion.likes.length : 0}
          </button>

          {isAuthor && (
            <div>
              <button className="edit-button" onClick={handleEdit}>Edit</button>
              <button className="delete-button" onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>

        <div className="reply-section">
          <h2 className="reply-count">{discussion.replies.length} {discussion.replies.length === 1 ? 'Reply' : 'Replies'}</h2>

          <form className="reply-form" onSubmit={handleReplySubmit}>
            <textarea
              placeholder="Add your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              required
            />
            <button type="submit">Submit Reply</button>
          </form>

          {discussion.replies.map((reply) => (
            <div key={reply._id} className="reply-item">
              <div className="reply-item-header">
                <span className="reply-author">{reply.user.company_name}</span>
                <span className="reply-date">{formatDate(reply.createdAt)}</span>
              </div>

              <div className="reply-content">
                {reply.content}
              </div>

              <div className="reply-actions">
                <button
                  className={`like-button ${currentUser && reply.likes && Array.isArray(reply.likes) && reply.likes.includes(currentUser._id) ? 'active' : ''}`}
                  onClick={() => handleLikeReply(reply._id)}
                >
                  <i className="fas fa-heart"></i> {reply.likes ? reply.likes.length : 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}