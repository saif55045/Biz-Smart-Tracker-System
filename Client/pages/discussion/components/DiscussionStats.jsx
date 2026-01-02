import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../../src/config';

function DiscussionStats() {
  const [stats, setStats] = useState({
    totalDiscussions: 0,
    totalReplies: 0,
    activeUsers: 0,
    topCategories: [],
    trendingTags: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) return;

        if (!token) return;

        const response = await axios.get(`${config.API_URL}/discussions/stats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setStats(response.data);
      } catch (error) {
        console.error('Error fetching discussion stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="discussion-stats-container">
        <h3>Discussion Statistics</h3>
        <div className="loading-indicator">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="discussion-stats-container">
      <h3>Discussion Statistics</h3>

      <div className="stats-card">
        <div className="stat-item">
          <div className="stat-icon-wrapper discussion-icon">
            <i className="fas fa-comments"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{stats.totalDiscussions}</div>
            <div className="stat-label">Discussions</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon-wrapper replies-icon">
            <i className="fas fa-reply-all"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{stats.totalReplies}</div>
            <div className="stat-label">Replies</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon-wrapper users-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{stats.activeUsers}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
      </div>

      {stats.topCategories && stats.topCategories.length > 0 && (
        <div className="stats-section">
          <h4>Top Categories</h4>
          <ul className="stats-list">
            {stats.topCategories.map((category, index) => (
              <li key={index} className="stat-list-item">
                <span className="stat-list-name">{category.name}</span>
                <span className="stat-list-count">{category.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats.trendingTags && stats.trendingTags.length > 0 && (
        <div className="stats-section">
          <h4>Trending Tags</h4>
          <div className="stats-tags">
            {stats.trendingTags.map((tag, index) => (
              <span key={index} className="stats-tag">
                {tag.name} <span className="tag-count">{tag.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscussionStats;