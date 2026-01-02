import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCurrency } from "../../context/CurrencyContext";
import config from '../../src/config';
import Button from "../../components/Button";
import "./Selling.css";

export default function Selling() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalBill, setTotalBill] = useState(0);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const customerSearchRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatMoney } = useCurrency();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (decodedToken.company_name) {
          setCompanyName(decodedToken.company_name);
        } else {
          setError('Company name not found. Please log in again.');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Session error. Please log in again.');
      }
    }

    const customerId = searchParams.get('customerId');
    if (customerId) {
      fetchCustomerById(customerId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (companyName) {
      fetchProducts();
      fetchCustomers();
    }
  }, [companyName]);

  useEffect(() => {
    if (showCustomerSearch && customerSearchRef.current) {
      customerSearchRef.current.focus();
    }
  }, [showCustomerSearch]);

  useEffect(() => {
    const filtered = customers.filter(
      (c) => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || c.phoneNumber.includes(customerSearchTerm)
    );
    setFilteredCustomers(filtered);
  }, [customerSearchTerm, customers]);

  useEffect(() => {
    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  useEffect(() => {
    const total = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
    setTotalBill(total);
    if (!showPaymentModal) setPaymentAmount(total.toFixed(2));
  }, [selectedItems]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both old array format and new paginated format
      const data = Array.isArray(response.data) ? response.data : (response.data?.customers || []);
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCustomerById = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCustomer(response.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/products/products?company_name=${companyName}`);
      // Handle both old array format and new paginated format
      const data = Array.isArray(response.data) ? response.data : (response.data?.products || []);
      setProducts(data);
    } catch (error) {
      setError(`Failed to fetch products: ${error.message}`);
    }
  };

  const addItemToCart = (product) => {
    if (product.stock <= 0) {
      setError(`${product.name} is out of stock!`);
      return;
    }

    const existingIndex = selectedItems.findIndex(item => item.product._id === product._id);
    if (existingIndex !== -1) {
      const updated = [...selectedItems];
      if (updated[existingIndex].quantity + 1 > product.stock) {
        setError(`Cannot add more. Only ${product.stock} units in stock.`);
        return;
      }
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * product.price;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1, subtotal: product.price }]);
    }
    setError("");
  };

  const updateQuantity = (index, delta) => {
    const updated = [...selectedItems];
    const item = updated[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    if (newQty > item.product.stock) {
      setError(`Only ${item.product.stock} units available.`);
      return;
    }

    item.quantity = newQty;
    item.subtotal = newQty * item.product.price;
    setSelectedItems(updated);
    setError("");
  };

  const removeItem = (index) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const createNewCustomer = () => {
    navigate('/customers?action=add');
  };

  const handlePaymentInput = (e) => {
    setPaymentAmount(e.target.value);
  };

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      setError("Please select a customer first.");
      setShowPaymentModal(false);
      setShowCustomerSearch(true);
      return;
    }

    const paidAmount = parseFloat(paymentAmount) || 0;
    if (paidAmount <= 0) {
      setError("Payment amount required.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const itemsForUpdate = selectedItems.map(i => ({ productId: i.product._id, quantity: i.quantity }));
      const saleItems = selectedItems.map(i => ({
        productId: i.product._id,
        quantity: i.quantity,
        price: i.product.price,
        subtotal: i.subtotal
      }));

      await axios.put(`${config.API_URL}/products/updatemultiplestocks`,
        { items: itemsForUpdate, company_name: companyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const saleResponse = await axios.post(`${config.API_URL}/sales`, {
        customerId: selectedCustomer._id,
        products: saleItems,
        totalAmount: totalBill,
        paidAmount: paidAmount,
        remainingAmount: totalBill - paidAmount,
        paymentStatus: paidAmount >= totalBill ? 'paid' : 'partial',
      }, { headers: { Authorization: `Bearer ${token}` } });

      navigate(`/invoice/${saleResponse.data._id}`);
    } catch (error) {
      setError(error.response?.data?.error || "Transaction failed.");
    }
  };

  return (
    <div className="selling-container">
      {/* Catalog Area */}
      <div className="catalog-section">
        <div className="pos-search-bar">
          <input
            type="text"
            className="pos-input"
            placeholder="Search products by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="catalog-grid">
          {filteredProducts.map(product => (
            <div
              key={product._id}
              className="pos-product-card"
              onClick={() => addItemToCart(product)}
            >
              <div className="pos-product-name">{product.name}</div>
              <div className="pos-product-brand">{product.brandName}</div>
              <div className="pos-product-footer">
                <div className="pos-product-price">{formatMoney(product.price)}</div>
                <div className={`pos-stock-tag ${product.stock <= 5 ? 'low' : ''}`}>
                  {product.stock} units
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Sidebar */}
      <div className="checkout-section">
        <div className="checkout-header">
          <h3 style={{ marginBottom: '0.5rem' }}>Active Sale</h3>
          {selectedCustomer ? (
            <div className="customer-info-box">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{selectedCustomer.name}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{selectedCustomer.phoneNumber}</div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button className="pos-input" onClick={() => setShowCustomerSearch(true)}>
              <i className="fas fa-user-plus"></i> Select Customer
            </button>
          )}
        </div>

        <div className="cart-items-list">
          {selectedItems.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.5 }}>
              <i className="fas fa-shopping-cart" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
              <p>Your cart is empty</p>
            </div>
          ) : (
            selectedItems.map((item, index) => (
              <div key={index} className="cart-item">
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.product.name}</div>
                  <div className="cart-item-price">{formatMoney(item.product.price)} / unit</div>
                </div>
                <div className="cart-qty-controls">
                  <button className="qty-btn" onClick={() => updateQuantity(index, -1)}>−</button>
                  <span style={{ width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(index, 1)}>+</button>
                </div>
                <div className="cart-item-total">{formatMoney(item.subtotal)}</div>
                <button className="remove-item-btn" onClick={() => removeItem(index)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="checkout-footer">
          {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
          <div className="total-row">
            <span className="total-label">Total Amount</span>
            <span className="total-amount">{formatMoney(totalBill)}</span>
          </div>
          <button
            className="complete-sale-btn"
            disabled={selectedItems.length === 0}
            onClick={() => setShowPaymentModal(true)}
          >
            Go to Payment
          </button>
        </div>
      </div>

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="pos-modal-overlay">
          <div className="pos-modal" style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Select Customer</h2>
            <input
              ref={customerSearchRef}
              type="text"
              className="pos-input"
              style={{ width: '100%', marginBottom: '1rem' }}
              placeholder="Search by name or phone..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
            />

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>No customers found</div>
              ) : (
                filteredCustomers.map(c => (
                  <div
                    key={c._id}
                    className="cart-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{c.phoneNumber}</div>
                    </div>
                    <i className="fas fa-chevron-right" style={{ opacity: 0.3 }}></i>
                  </div>
                )
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <Button label="New Customer" action={createNewCustomer} style={{ flex: 1 }} />
              <Button
                label="Close"
                action={() => setShowCustomerSearch(false)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal">
            <h2 style={{ marginBottom: '1.5rem' }}>Checkout & Payment</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Payment Received
              </label>
              <input
                type="number"
                className="pos-input"
                style={{ width: '100%', fontSize: '1.5rem', textAlign: 'center' }}
                value={paymentAmount}
                onChange={handlePaymentInput}
              />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Total Bill</span>
                <span style={{ fontWeight: 700 }}>{formatMoney(totalBill)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa' }}>
                <span>Remaining/Credit</span>
                <span style={{ fontWeight: 700 }}>
                  {formatMoney(Math.max(0, totalBill - (parseFloat(paymentAmount) || 0)))}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button label="Complete Sale" action={handleCheckout} style={{ flex: 2 }} />
              <Button
                label="Cancel"
                action={() => setShowPaymentModal(false)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
