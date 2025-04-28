import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Layout.css';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState('Employee');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decodedToken.role);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout-container">
      <button 
        className="toggle-button"
        onClick={toggleSidebar}
      >
        ☰
      </button>

      <div className={`layout-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h2 className="layout-logo">Biz Smart Tracker</h2>
        <nav className="layout-nav">
          {userRole === 'Admin' && (
            <>
              <button 
                className={`nav-button ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`nav-button ${isActive('/inventory/schema') ? 'active' : ''}`}
                onClick={() => navigate('/inventory/schema')}
              >
                Schema Manager
              </button>
            </>
          )}
          <button 
            className={`nav-button ${isActive('/inventory/products') ? 'active' : ''}`}
            onClick={() => navigate('/inventory/products')}
          >
            Product Manager
          </button>
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </div>

      <div className="layout-content">
        {children}
      </div>

      {isSidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}