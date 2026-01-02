import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../../context/CurrencyContext';
import config from '../../src/config';
import Button from '../../components/Button';
import Field from '../../components/Field';
import eventService from '../../services/EventService';
import './Product.css';

export function ProductManager() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [fields, setFields] = useState([]);
  const [newProduct, setNewProduct] = useState({});
  const [userRole, setUserRole] = useState('Employee');
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [loading, setLoading] = useState({
    fields: false,
    products: false,
    action: false
  });
  const [companyName, setCompanyName] = useState('');

  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0
  });

  const { formatMoney } = useCurrency();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
        if (decodedToken.company_name) {
          setCompanyName(decodedToken.company_name);
          setNewProduct({ company_name: decodedToken.company_name });
        } else {
          setError('Company name not found. Please log in again.');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Session error. Please log in again.');
      }
    }
  }, []);

  const defaultFields = [
    { name: 'name', type: 'String', required: true },
    { name: 'category', type: 'String', required: true },
    { name: 'brandName', type: 'String', required: true },
    { name: 'price', type: 'Number', required: true },
    { name: 'stock', type: 'Number', required: true },
    { name: 'expiryDate', type: 'Date', required: false },
  ];

  useEffect(() => {
    if (companyName) {
      fetchFields();
      fetchProducts();
    }
  }, [companyName]);

  useEffect(() => {
    const filtered = products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brandName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    setFilteredProducts(filtered);

    // Calculate stats
    setStats({
      totalProducts: products.length,
      lowStock: products.filter(p => p.stock <= 5).length
    });
  }, [searchTerm, categoryFilter, products]);

  const fetchFields = async () => {
    try {
      setLoading(prev => ({ ...prev, fields: true }));
      const response = await axios.get(`${config.API_URL}/inventory/fields?company_name=${companyName}`);
      const dbFields = response.data;
      const allFields = [];

      defaultFields.forEach(defaultField => {
        const dbField = dbFields.find(f => f.name === defaultField.name);
        if (!dbField || !dbField.isDeleted) {
          allFields.push(defaultField);
        }
      });

      const activeCustomFields = dbFields.filter(field => !field.isDeleted);
      activeCustomFields.forEach(field => {
        if (!allFields.find(f => f.name === field.name)) {
          allFields.push(field);
        }
      });

      setFields(allFields);
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(prev => ({ ...prev, fields: false }));
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const response = await axios.get(`${config.API_URL}/products/products?company_name=${companyName}`);
      // Handle both old array format and new paginated format
      const data = Array.isArray(response.data) ? response.data : (response.data?.products || []);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const handleInputChange = (fieldName, value) => {
    setNewProduct(prev => ({ ...prev, [fieldName]: value }));
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const validateProduct = (product) => {
    const requiredFields = ['name', 'category', 'brandName', 'price', 'stock'];
    for (const field of requiredFields) {
      if (!product[field]) throw new Error(`${field} is required`);
    }
    return {
      ...product,
      price: Number(product.price),
      stock: Number(product.stock),
      expiryDate: product.expiryDate ? new Date(product.expiryDate) : null
    };
  };

  const handleAddProduct = async () => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const validated = validateProduct({ ...newProduct, company_name: companyName });
      await axios.post(`${config.API_URL}/products/newproduct`, validated);
      fetchProducts();
      setNewProduct({ company_name: companyName });
      setShowModal(false);
      eventService.emit('notificationUpdate');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setNewProduct({ ...product, expiryDate: formatDateForInput(product.expiryDate) });
    setShowModal(true);
  };

  const handleUpdateProduct = async () => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const validated = validateProduct({ ...newProduct, company_name: companyName });
      await axios.put(`${config.API_URL}/products/updateproduct/${editingProduct._id}?company_name=${companyName}`, validated);
      fetchProducts();
      handleCancelModal();
      eventService.emit('notificationUpdate');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setLoading(prev => ({ ...prev, action: true }));
      await axios.delete(`${config.API_URL}/products/deleteproduct/${productId}?company_name=${companyName}`);
      fetchProducts();
      eventService.emit('notificationUpdate');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setNewProduct({ company_name: companyName });
    setError('');
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <div className="product-manager-container">
      {/* Stats Header */}
      <div className="product-stats-header">
        <div className="product-stat-card">
          <div className="stat-icon-wrapper blue">
            <i className="fas fa-boxes"></i>
          </div>
          <div className="stat-info">
            <h3>Total Products</h3>
            <div className="stat-value">{stats.totalProducts}</div>
          </div>
        </div>
        <div className="product-stat-card">
          <div className="stat-icon-wrapper red">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-info">
            <h3>Low Stock</h3>
            <div className="stat-value">{stats.lowStock}</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="product-action-bar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by name or brand..."
            className="product-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="product-search-input"
            style={{ flex: '0 0 160px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <button className="add-product-btn" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Add New Product
        </button>
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {loading.products ? (
          <p>Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p>No products found matching your search.</p>
        ) : (
          filteredProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-category-tag">{product.category}</div>
              <h3 className="product-name">{product.name}</h3>
              <p className="product-brand">{product.brandName}</p>

              <div className="product-price-section">
                <div className="product-price">{formatMoney(product.price)}</div>
                <div className={`stock-badge ${product.stock <= 5 ? 'low' : 'high'}`}>
                  <i className={`fas ${product.stock <= 5 ? 'fa-battery-quarter' : 'fa-battery-full'}`}></i>
                  {product.stock} Units
                </div>
              </div>

              {userRole === 'Admin' && (
                <div className="product-actions-overlay">
                  <button className="action-btn edit" onClick={() => handleEditClick(product)}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button className="action-btn delete" onClick={() => handleDeleteProduct(product._id)}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modern Integrated Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{
            width: '90%', maxWidth: '500px', padding: '2rem',
            background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#f1f5f9' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            {error && <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {fields.map(field => (
                <div key={field.name} style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    {field.name}
                  </label>
                  <Field
                    type={field.type === 'Number' ? 'number' : field.type === 'Date' ? 'date' : 'text'}
                    placeholder={`Enter ${field.name}`}
                    value={newProduct[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <Button
                label={editingProduct ? "Update Product" : "Add Product"}
                action={editingProduct ? handleUpdateProduct : handleAddProduct}
                disabled={loading.action}
                style={{ flex: 2 }}
              />
              <Button
                label="Cancel"
                action={handleCancelModal}
                style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
