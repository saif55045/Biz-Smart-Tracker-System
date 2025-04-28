import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/EventService';
import './Dashboard.css';

export function Dashboard() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded token in Dashboard:', decodedToken);
        
        if (!decodedToken.company_name) {
          setError('Company name not found in session. Please try logging in again.');
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        setUser(decodedToken);
        fetchNotifications(decodedToken.company_name);

        // Listen for notification updates using our custom EventService
        const unsubscribe = eventService.on('notificationUpdate', () => {
          console.log('Notification update event received');
          fetchNotifications(decodedToken.company_name);
        });

        return () => {
          // Clean up subscription
          unsubscribe();
        };
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Session error. Please try logging in again.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (user?.company_name) {
      const interval = setInterval(() => {
        fetchNotifications(user.company_name);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async (company_name) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching notifications for company:', company_name);
      const response = await axios.get(`http://localhost:5000/api/notifications/notifications`, {
        params: { company_name }
      });
      console.log('Notifications received:', response.data);
      setNotifications(response.data);

      // Check for expired products
      const today = new Date();
      const productsResponse = await axios.get('http://localhost:5000/api/products/products', {
        params: { company_name }
      });
      
      const expiredProducts = productsResponse.data.filter(product => 
        product.expiryDate && new Date(product.expiryDate) <= today
      );

      if (expiredProducts.length > 0) {
        // Create expiry notifications if they don't exist
        for (const product of expiredProducts) {
          await axios.post('http://localhost:5000/api/notifications', {
            message: `Product expired: ${product.name} expired on ${new Date(product.expiryDate).toLocaleDateString()}`,
            type: 'expiry',
            productName: product.name,
            company_name: company_name
          });
        }
        // Fetch notifications again to include new expiry notifications
        const updatedResponse = await axios.get(`http://localhost:5000/api/notifications/notifications`, {
          params: { company_name }
        });
        setNotifications(updatedResponse.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/notifications/${id}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read.');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/notifications/${id}`);
      setNotifications(notifications.filter(notif => notif._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification.');
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'stock':
        return '#ff9800';
      case 'expiry':
        return '#f44336';
      case 'edit':
        return '#2196f3';
      case 'delete':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const refreshNotifications = () => {
    if (user?.company_name) {
      fetchNotifications(user.company_name);
    } else {
      setError('Unable to refresh: Company name not found');
    }
  };

  if (!user) {
    return <div className="dashboard-container">Loading user information...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.email}</h1>
        <p>Company: {user.company_name}</p>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="notification-panel">
        <div className="notification-header">
          <h2>Notifications</h2>
          <button 
            onClick={refreshNotifications}
            className="refresh-button"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {loading && notifications.length === 0 ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p>No new notifications</p>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                style={{ borderLeft: `4px solid ${getNotificationColor(notification.type)}` }}
              >
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <small>{new Date(notification.createdAt).toLocaleString()}</small>
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <button 
                      onClick={() => markAsRead(notification._id)}
                      className="mark-read-btn"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notification._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}