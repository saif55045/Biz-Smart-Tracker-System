import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/Button';
import Field from '../../components/Field';
import { useToast } from '../../components/Toast';
import { useCurrency } from '../../context/CurrencyContext';
import config from '../../src/config';
import './CustomerManager.css';

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [customerPurchases, setCustomerPurchases] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    address: '',
    notes: ''
  });
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { formatMoney } = useCurrency();
  const token = localStorage.getItem('token');
  const [companyName, setCompanyName] = useState('');
  const [totalLifetimeValue, setTotalLifetimeValue] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setCompanyName(decodedToken.company_name);
      } catch (error) {
        console.error('Error decoding JWT token:', error);
      }
    }
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add') openAddModal();
  }, [location]);

  useEffect(() => {
    if (companyName) fetchCustomers();
  }, [companyName]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`${config.API_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const responseData = await response.json();
        // Handle both old array format and new paginated format
        const data = Array.isArray(responseData) ? responseData : (responseData?.customers || []);
        setCustomers(data);
        // Fetch aggregate stats from all sales
        fetchAggregateStats();
      } else {
        setError('Failed to load customers');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch aggregate sales stats
  const fetchAggregateStats = async () => {
    try {
      const response = await fetch(`${config.API_URL}/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const sales = await response.json();
        const totalValue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        const outstanding = sales.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);
        setTotalLifetimeValue(totalValue);
        setTotalOutstanding(outstanding);
      }
    } catch (error) {
      console.error('Error fetching sales stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setFormData({ name: '', phoneNumber: '', email: '', address: '', notes: '' });
    setIsEditing(false);
    setShowAddModal(true);
  };

  const openEditModal = (customer) => {
    setFormData({
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setCurrentCustomer(customer);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setCurrentCustomer(null);
    const params = new URLSearchParams(location.search);
    const returnUrl = params.get('returnUrl');
    if (returnUrl) navigate(returnUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const customerData = { ...formData, company_name: companyName };
      let url = `${config.API_URL}/customers`;
      let method = 'POST';

      if (isEditing) {
        url = `${config.API_URL}/customers/${currentCustomer._id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(customerData)
      });

      const data = await response.json();
      if (response.ok) {
        fetchCustomers();
        closeModal();
      } else {
        setError(data.message || 'Failed to save customer');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const response = await fetch(`${config.API_URL}/customers/${customerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) fetchCustomers();
      if (response.ok) fetchCustomers();
      else toast.error('Failed to delete customer');
    } catch (error) {
      toast.error('Error deleting customer');
    }
  };

  const viewCustomerDetails = async (customer) => {
    setViewingCustomer(customer);
    try {
      const response = await fetch(`${config.API_URL}/customers/${customer._id}/purchases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomerPurchases(data);
      } else {
        setCustomerPurchases([]);
      }
    } catch (error) {
      setCustomerPurchases([]);
    }
  };

  const closeCustomerDetails = () => {
    setViewingCustomer(null);
    setCustomerPurchases([]);
  };

  const createNewSale = (customerId) => {
    navigate(`/selling?customerId=${customerId}`);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phoneNumber.includes(searchTerm)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Calculate statistics
  const totalCustomers = customers.length;
  const lifetimeValue = customerPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const outstandingBalance = customerPurchases.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

  return (
    <div className="cust-page">
      {/* Header */}
      <div className="cust-header">
        <h1>Customer Management</h1>
        <button className="cust-add-btn" onClick={openAddModal}>
          <i className="fas fa-plus"></i> Add Customer
        </button>
      </div>

      {error && <div className="cust-error">{error}</div>}

      {/* Statistics */}
      <div className="cust-stats">
        <div className="cust-stat-card">
          <div className="cust-stat-icon blue"><i className="fas fa-users"></i></div>
          <div>
            <div className="cust-stat-value">{totalCustomers}</div>
            <div className="cust-stat-label">Total Customers</div>
          </div>
        </div>
        <div className="cust-stat-card">
          <div className="cust-stat-icon green"><i className="fas fa-dollar-sign"></i></div>
          <div>
            <div className="cust-stat-value">{formatMoney(totalLifetimeValue)}</div>
            <div className="cust-stat-label">Total Sales Value</div>
          </div>
        </div>
        <div className="cust-stat-card">
          <div className="cust-stat-icon orange"><i className="fas fa-exclamation-triangle"></i></div>
          <div>
            <div className="cust-stat-value">{formatMoney(totalOutstanding)}</div>
            <div className="cust-stat-label">Outstanding Balance</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="cust-search">
        <div className="cust-search-box">
          <i className="fas fa-search cust-search-icon"></i>
          <input
            type="text"
            className="cust-search-input"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="cust-search-clear" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
      </div>

      {/* Customer Cards */}
      {isLoading ? (
        <div className="cust-loading">
          <div className="cust-spinner"></div>
          <p>Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="cust-empty">
          <p>No customers found</p>
          <Button onClick={openAddModal}>Add Your First Customer</Button>
        </div>
      ) : (
        <>
          <p className="cust-count">Showing {filteredCustomers.length} of {customers.length} customers</p>
          <div className="cust-grid">
            {filteredCustomers.map(customer => (
              <div className="cust-card" key={customer._id}>
                <div className="cust-card-header">
                  <div className="cust-avatar">{customer.name.charAt(0).toUpperCase()}</div>
                  <div className="cust-card-info">
                    <h3>{customer.name}</h3>
                    <p>{customer.phoneNumber}</p>
                  </div>
                </div>
                <div className="cust-card-details">
                  {customer.email && <p><i className="fas fa-envelope"></i> {customer.email}</p>}
                  {customer.address && <p><i className="fas fa-map-marker-alt"></i> {customer.address}</p>}
                </div>
                <div className="cust-card-actions">
                  <button className="cust-action-btn view" onClick={() => viewCustomerDetails(customer)}>
                    <i className="fas fa-eye"></i> View
                  </button>
                  <button className="cust-action-btn edit" onClick={() => openEditModal(customer)}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button className="cust-action-btn sale" onClick={() => createNewSale(customer._id)}>
                    <i className="fas fa-cart-plus"></i> Sale
                  </button>
                  <button className="cust-action-btn delete" onClick={() => handleDelete(customer._id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="cust-modal-bg">
          <div className="cust-modal">
            <div className="cust-modal-header">
              <h2>{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="cust-modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="cust-modal-body">
                <Field label="Customer Name" type="text" name="name" placeholder="Enter name" value={formData.name} onChange={handleInputChange} required />
                <Field label="Phone Number" type="text" name="phoneNumber" placeholder="Enter phone" value={formData.phoneNumber} onChange={handleInputChange} required />
                <Field label="Email" type="email" name="email" placeholder="Enter email (optional)" value={formData.email} onChange={handleInputChange} />
                <Field label="Address" type="text" name="address" placeholder="Enter address (optional)" value={formData.address} onChange={handleInputChange} />
                <Field label="Notes" type="textarea" name="notes" placeholder="Additional notes" value={formData.notes} onChange={handleInputChange} rows={3} />
              </div>
              <div className="cust-modal-actions">
                <Button type="submit">{isEditing ? 'Update' : 'Save'}</Button>
                <Button type="button" onClick={closeModal} secondary>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {viewingCustomer && (
        <div className="cust-modal-bg">
          <div className="cust-modal cust-details-modal">
            <div className="cust-modal-header">
              <h2>Customer Details</h2>
              <button className="cust-modal-close" onClick={closeCustomerDetails}>×</button>
            </div>
            <div className="cust-modal-body">
              <div className="cust-profile">
                <div className="cust-profile-avatar">{viewingCustomer.name.charAt(0).toUpperCase()}</div>
                <div className="cust-profile-info">
                  <h3>{viewingCustomer.name}</h3>
                  <p>Customer since {new Date(viewingCustomer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="cust-info-grid">
                <div className="cust-info-item">
                  <label>Phone</label>
                  <span>{viewingCustomer.phoneNumber}</span>
                </div>
                <div className="cust-info-item">
                  <label>Email</label>
                  <span>{viewingCustomer.email || '-'}</span>
                </div>
                <div className="cust-info-item">
                  <label>Address</label>
                  <span>{viewingCustomer.address || '-'}</span>
                </div>
                <div className="cust-info-item">
                  <label>Notes</label>
                  <span>{viewingCustomer.notes || '-'}</span>
                </div>
              </div>

              <div className="cust-profile-actions">
                <Button onClick={() => { closeCustomerDetails(); openEditModal(viewingCustomer); }} secondary>
                  <i className="fas fa-edit"></i> Edit
                </Button>
                <Button onClick={() => createNewSale(viewingCustomer._id)}>
                  <i className="fas fa-cart-plus"></i> New Sale
                </Button>
              </div>

              <div className="cust-purchases">
                <h3>Purchase History</h3>
                {customerPurchases.length === 0 ? (
                  <div className="cust-no-purchases">
                    <p>No purchases yet</p>
                    <Button onClick={() => createNewSale(viewingCustomer._id)}>Create First Sale</Button>
                  </div>
                ) : (
                  <>
                    <div className="cust-purchase-stats">
                      <div className="cust-purchase-stat">
                        <div className="value">{customerPurchases.length}</div>
                        <div className="label">Orders</div>
                      </div>
                      <div className="cust-purchase-stat">
                        <div className="value">{formatMoney(customerPurchases.reduce((s, p) => s + p.totalAmount, 0))}</div>
                        <div className="label">Total Value</div>
                      </div>
                      <div className="cust-purchase-stat">
                        <div className="value">{formatMoney(customerPurchases.reduce((s, p) => s + p.remainingAmount, 0))}</div>
                        <div className="label">Outstanding</div>
                      </div>
                    </div>
                    <table className="cust-purchases-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerPurchases.map(purchase => (
                          <tr key={purchase._id}>
                            <td>{formatDate(purchase.saleDate)}</td>
                            <td>{formatMoney(purchase.totalAmount)}</td>
                            <td>
                              <span className={`cust-status ${purchase.paymentStatus}`}>
                                {purchase.paymentStatus === 'paid' ? 'Paid' : purchase.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="cust-invoice-btn"
                                onClick={() => { closeCustomerDetails(); navigate(`/invoice/${purchase._id}`); }}
                              >
                                View Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;