import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import config from '../../src/config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import eventService from '../../services/EventService';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// --- Icons ---
const BellIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>);
const UserCircleIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>);
const CheckCircleIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
const ShoppingCartIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>);
const UsersIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);
const BoxIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>);
const ChartIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>);
const UserTieIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const TrashIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const CheckIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>);

export function Dashboard() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const { formatMoney, symbol } = useCurrency();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (!decodedToken.company_name) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        // Initial set from token
        setUser(decodedToken);

        // Fetch full user details (including profile pic)
        axios.get(`${config.API_URL}/user/current-user`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          setUser(res.data);
        }).catch(err => console.error("Error fetching user details", err));

        fetchNotifications(decodedToken.company_name);

        const unsubscribe = eventService.on('notificationUpdate', () => {
          fetchNotifications(decodedToken.company_name);
        });
        return () => unsubscribe();
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchNotifications = async (company_name) => {
    try {
      setLoading(true);
      setLoading(true);
      const response = await axios.get(`${config.API_URL}/notifications/notifications`, {
        params: { company_name }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    e.stopPropagation();
    try {
      await axios.put(`${config.API_URL}/notifications/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    e.stopPropagation();
    try {
      await axios.delete(`${config.API_URL}/notifications/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistically update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // Ideally backend should have an endpoint for this, implementing loop for now
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await axios.put(`${config.API_URL}/notifications/notifications/${n._id}/read`);
      }
    } catch (error) {
      console.error("Error marking all read", error);
    }
  }

  // --- Chart Data State ---
  const [salesData, setSalesData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [salesRange, setSalesRange] = useState('week'); // 'week', 'month', 'year'
  const [stats, setStats] = useState({
    sales: 0,
    inventory: 0,
    inventoryValue: 0,
    lowStock: 0,
    employees: 0
  });

  useEffect(() => {
    if (user?.company_name) {
      fetchDashboardData();
    }
  }, [user, salesRange]); // Refetch when range changes

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const now = today.toISOString();
      let startDate = new Date();

      if (salesRange === 'week') {
        startDate.setDate(today.getDate() - 6);
      } else if (salesRange === 'month') {
        startDate.setDate(today.getDate() - 29);
      } else if (salesRange === 'year') {
        startDate.setFullYear(today.getFullYear() - 1);
        startDate.setDate(1); // Start from beginning of the month for year view consistency
      }

      const token = localStorage.getItem('token');
      const requestConfig = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Parallel requests for dashboard stats
      // Only fetch generic stats if this is the initial load or we want to refresh everything.
      // For optimization we could split this, but for now we fetch all.
      const [totalSales, lowStock, employees, stock, expenseStats] = await Promise.all([
        axios.get(`${config.API_URL}/reports/total-sales-summary`, requestConfig),
        axios.get(`${config.API_URL}/reports/low-stock-alerts?threshold=10`, requestConfig),
        axios.get(`${config.API_URL}/reports/employee-data`, requestConfig),
        axios.get(`${config.API_URL}/reports/stock-data?groupBy=category`, requestConfig),
        axios.get(`${config.API_URL}/expenses/stats`, requestConfig)
      ]);

      // Calculate total stock items and value
      const totalInventory = stock.data.reduce((acc, cat) => acc + cat.totalStock, 0);
      const inventoryValue = stock.data.reduce((acc, cat) => acc + (cat.totalValue || 0), 0);

      setStats({
        sales: totalSales.data.totalRevenue || 0,
        inventory: totalInventory || 0,
        inventoryValue: inventoryValue || 0,
        lowStock: lowStock.data.length || 0,
        employees: employees.data.length || 0,
        expenses: expenseStats.data.monthlyChart || []
      });

      setStockData(stock.data);

      setStockData(stock.data);

      const salesHistory = await axios.get(`${config.API_URL}/reports/sales-data`, {
        params: { startDate: startDate.toISOString(), endDate: now },
        headers: { Authorization: `Bearer ${token}` }
      });

      processSalesChart(salesHistory.data, expenseStats.data.dailyChart || [], salesRange);

    } catch (err) {
      console.error("Error fetching dashboard stats", err);
      if (err.response && err.response.status === 401) {
        navigate('/login');
      }
    }
  };

  const processSalesChart = (salesData, expenseData, range) => {
    const labels = [];
    const revenueMap = {};
    const expenseMap = {};
    const today = new Date();

    if (range === 'year') {
      // Monthly aggregation
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        const label = months[d.getMonth()];
        labels.push(label);
        revenueMap[key] = 0;
        expenseMap[key] = 0;
      }

      salesData.forEach(sale => {
        const d = new Date(sale.saleDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (revenueMap[key] !== undefined) {
          revenueMap[key] += sale.totalAmount;
        }
      });
      // Expenses might be daily, need to aggregate by month
      if (expenseData) {
        expenseData.forEach(exp => {
          // exp._id is YYYY-MM-DD
          const datePart = exp._id.substring(0, 7); // YYYY-MM
          if (expenseMap[datePart] !== undefined) {
            expenseMap[datePart] += exp.total;
          }
        });
      }

    } else {
      // Daily aggregation (Week: 7 days, Month: 30 days)
      const dataPoints = range === 'month' ? 30 : 7;
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = dataPoints - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
        let label = '';
        if (range === 'month') {
          label = `${d.getDate()}/${d.getMonth() + 1}`; // DD/MM
        } else {
          label = days[d.getDay()]; // Day Name
        }
        labels.push(label);
        revenueMap[key] = 0;
        expenseMap[key] = 0;
      }

      salesData.forEach(sale => {
        const key = new Date(sale.saleDate).toISOString().split('T')[0];
        if (revenueMap[key] !== undefined) {
          revenueMap[key] += sale.totalAmount;
        }
      });

      if (expenseData) {
        expenseData.forEach(exp => {
          if (expenseMap[exp._id] !== undefined) {
            expenseMap[exp._id] = exp.total;
          }
        });
      }
    }

    setSalesData({
      labels: labels,
      values: Object.values(revenueMap),
      expenses: Object.values(expenseMap)
    });
  };


  // --- Chart Config ---

  const lineChartData = {
    labels: salesData.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: `Sales (${symbol})`,
        data: salesData.values || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: `Expenses (${symbol})`,
        data: salesData.expenses || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointDash: [5, 5]
      }
    ],

  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 6 }
      },
      title: { display: false }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      }
    }
  };

  // Doughnut Data from Stock Category
  // We need colors for categories.
  const doughnutColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  const doughnutData = {
    labels: stockData.map(d => d.category || 'Uncategorized'),
    datasets: [
      {
        data: stockData.map(d => d.totalStock),
        backgroundColor: stockData.map((_, i) => doughnutColors[i % doughnutColors.length]),
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 8 }
      }
    },
    cutout: '70%',
  };

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="dashboard-container">
      {/* --- Header --- */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, <span className="user-name">{user.name}</span></h1>
          <p className="company-name">{user.company_name} - Admin Dashboard</p>
        </div>

        <div className="header-right">
          <div className="date-display">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className="notification-bell-container" ref={notificationRef}>
            <button
              className={`notification-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <BellIcon />
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="notifications-dropdown glass-panel">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button className="mark-all-btn" onClick={markAllAsRead}>Mark all read</button>
                  )}
                </div>
                <div className="dropdown-content">
                  {notifications.length === 0 ? (
                    <div className="empty-state">
                      <CheckCircleIcon />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif._id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                        <div className="notif-content">
                          <p className="notif-message">{notif.message}</p>
                          <span className="notif-time">{new Date(notif.createdAt).toLocaleTimeString()} {new Date(notif.createdAt).toLocaleDateString()}</span>
                          <div className="notif-actions">
                            {!notif.read && (
                              <button className="btn-xs action-btn mark-read-btn" onClick={(e) => markAsRead(notif._id, e)}>
                                <CheckIcon /> Mark Read
                              </button>
                            )}
                            <button className="btn-xs action-btn delete-btn" onClick={(e) => deleteNotification(notif._id, e)}>
                              <TrashIcon /> Delete
                            </button>
                          </div>


                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            className="user-profile"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer', position: 'relative' }}
            title="Go to Profile"
          >
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border)'
                }}
              />
            ) : (
              <UserCircleIcon />
            )}
          </div>
        </div>
      </div>

      {/* --- Stats Row --- */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <ShoppingCartIcon />
          </div>
          <div className="stat-info">
            <h3>Total Sales</h3>
            <p>{formatMoney(stats.sales)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <BoxIcon />
          </div>
          <div className="stat-info">
            <h3>Inventory Value</h3>
            <p>{formatMoney(stats.inventoryValue)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="stat-info">
            <h3>Low Stock</h3>
            <p>{stats.lowStock}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
            <UsersIcon />
          </div>
          <div className="stat-info">
            <h3>Employees</h3>
            <p>{stats.employees}</p>
          </div>
        </div>
      </div>

      {/* --- Charts Section --- */}
      <div className="charts-container">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Sales Overview</h3>
            <div className="chart-actions">
              <select value={salesRange} onChange={(e) => setSalesRange(e.target.value)}>
                <option value="week">This Week</option>
                <option value="month">Last Month</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Inventory Distribution</h3>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* --- Quick Actions (Bottom) --- */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <div className="action-card" onClick={() => navigate('/inventory/products')}>
            <BoxIcon />
            <span>Add Product</span>
          </div>
          <div className="action-card" onClick={() => navigate('/selling')}>
            <ShoppingCartIcon />
            <span>New Sale</span>
          </div>
          <div className="action-card" onClick={() => navigate('/users')}>
            <UsersIcon />
            <span>Manage Users</span>
          </div>
          <div className="action-card" onClick={() => navigate('/reports')}>
            <ChartIcon />
            <span>View Reports</span>
          </div>
          <div className="action-card" onClick={() => navigate('/customers')}>
            <UserTieIcon />
            <span>Customers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
