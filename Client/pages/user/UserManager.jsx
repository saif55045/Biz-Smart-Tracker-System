import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../../context/CurrencyContext';
import config from '../../src/config';
import './UserManager.css';

// Icons
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export function UserManager() {
  const { formatMoney, symbol } = useCurrency();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    address: '',
    phone_number: '',
    experience: 0,
    salary: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    initComponent();
  }, []);

  const initComponent = async () => {
    await fetchCurrentAdmin();
  };

  useEffect(() => {
    if (currentAdmin) {
      fetchUsers();
    }
  }, [currentAdmin]);

  const fetchCurrentAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in');
        return;
      }

      const response = await axios.get(`${config.API_URL}/user/current-user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentAdmin(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching current user:', err);
      setError('Failed to fetch your account information');
      return null;
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in');
        return;
      }

      const response = await axios.get(`${config.API_URL}/user/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const employees = response.data.filter(user => user.role === 'Employee');
      setUsers(employees);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      address: '',
      phone_number: '',
      experience: 0,
      salary: 0
    });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      address: user.address || '',
      phone_number: user.phone_number || '',
      experience: user.experience || 0,
      salary: user.salary || 0
    });
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      address: '',
      phone_number: '',
      experience: 0,
      salary: 0
    });
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      if (!formData.username || !formData.email) {
        setError('Username and Email are required');
        setLoading(false);
        return;
      }

      if (!editUser && !formData.password) {
        setError('Password is required for new employee');
        setLoading(false);
        return;
      }

      if (editUser) {
        // Update existing user
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        updateData.company_name = currentAdmin.company_name;
        updateData.role = 'Employee';

        await axios.put(
          `${config.API_URL}/user/userupdate/${editUser._id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers(prev => prev.map(u =>
          u._id === editUser._id ? { ...u, ...updateData } : u
        ));
        setSuccess('Employee updated successfully');
      } else {
        // Create new user
        const newUserData = {
          ...formData,
          company_name: currentAdmin.company_name,
          role: 'Employee'
        };

        const response = await axios.post(
          `${config.API_URL}/user/newuser`,
          newUserData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.user) {
          setUsers(prev => [...prev, response.data.user]);
        }
        setSuccess('Employee created successfully');
      }

      closeModal();
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${config.API_URL}/user/userdelete/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(prev => prev.filter(u => u._id !== userId));
      setSuccess('Employee deleted successfully');
    } catch (err) {
      setError('Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="employee-management">
      {/* Header */}
      <div className="em-header">
        <div className="em-title-section">
          <h1>Employee Management</h1>
          <p>Manage your team members and their roles</p>
        </div>
        <button className="add-employee-btn" onClick={openAddModal}>
          <PlusIcon /> Add Employee
        </button>
      </div>

      {/* Messages */}
      {error && <div className="em-message error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
      {success && <div className="em-message success"><i className="fas fa-check-circle"></i> {success}</div>}

      {/* Stats */}
      <div className="em-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Employees</span>
            <span className="stat-value">{users.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-details">
            <span className="stat-label">Active</span>
            <span className="stat-value">{users.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <i className="fas fa-building"></i>
          </div>
          <div className="stat-details">
            <span className="stat-label">Company</span>
            <span className="stat-value" style={{ fontSize: '1rem' }}>{currentAdmin?.company_name || '-'}</span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="em-main-panel">
        <div className="em-panel-header">
          <div className="em-search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading && !users.length ? (
          <div className="em-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading employees...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="em-empty-state">
            <i className="fas fa-users"></i>
            <p>No employees found. Click "Add Employee" to get started.</p>
          </div>
        ) : (
          <div className="em-table-wrapper">
            <table className="em-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Experience</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="employee-info">
                        <div className="employee-avatar">{getInitials(user.username)}</div>
                        <span className="employee-name">{user.username}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone_number || '-'}</td>
                    <td>{user.experience || 0} yrs</td>
                    <td>{formatMoney(user.salary)}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="action-btn edit"
                          onClick={() => openEditModal(user)}
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(user._id)}
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredUsers.length > 0 && (
          <div className="em-pagination">
            <span className="em-pagination-info">Showing {filteredUsers.length} employees</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="em-modal-overlay" onClick={closeModal}>
          <div className="em-modal" onClick={(e) => e.stopPropagation()}>
            <div className="em-modal-header">
              <h2>{editUser ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="em-modal-close" onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>
            <div className="em-modal-body">
              <div className="em-form-group">
                <label><UserIcon /> Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                />
              </div>
              <div className="em-form-group">
                <label><MailIcon /> Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                />
              </div>
              {!editUser && (
                <div className="em-form-group">
                  <label><LockIcon /> Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                  />
                </div>
              )}
              <div className="em-form-group">
                <label><PhoneIcon /> Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="em-form-group">
                <label><MapPinIcon /> Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="em-form-group">
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
                <div className="em-form-group">
                  <label>Salary ({symbol})</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="em-modal-actions">
              <button className="em-btn-cancel" onClick={closeModal}>Cancel</button>
              <button
                className="em-btn-submit"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editUser ? 'Update Employee' : 'Add Employee')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
