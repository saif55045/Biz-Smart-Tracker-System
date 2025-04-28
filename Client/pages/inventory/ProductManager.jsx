import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '../../components/Button';
import Field from '../../components/Field';
import eventService from '../../services/EventService';

export function ProductManager() {
  const [products, setProducts] = useState([]);
  const [fields, setFields] = useState([]);
  const [newProduct, setNewProduct] = useState({});
  const [userRole, setUserRole] = useState('Employee');
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState({
    fields: false,
    products: false,
    action: false
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded token in ProductManager:', decodedToken);
        setUserRole(decodedToken.role);
        // Initialize newProduct with company_name from token
        if (decodedToken.company_name) {
          setNewProduct({ company_name: decodedToken.company_name });
        } else {
          setError('Company name not found in session. Please try logging in again.');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Session error. Please try logging in again.');
      }
    }
    fetchFields();
    fetchProducts();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(prev => ({ ...prev, fields: true }));
      const response = await axios.get('http://localhost:5000/api/inventory/fields');
      setFields(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching fields:', error);
      setError('Error fetching fields');
    } finally {
      setLoading(prev => ({ ...prev, fields: false }));
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const response = await axios.get('http://localhost:5000/api/products/products');
      setProducts(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error fetching products');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const handleInputChange = (fieldName, value) => {
    setNewProduct(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const validateProduct = (product) => {
    const requiredFields = ['name', 'category', 'brandName', 'price', 'stock', 'company_name'];
    for (const field of requiredFields) {
      if (!product[field]) {
        throw new Error(`${field} is required`);
      }
    }

    if (product.price) {
      product.price = Number(product.price);
    }
    if (product.stock) {
      product.stock = Number(product.stock);
    }

    if (product.expiryDate) {
      product.expiryDate = new Date(product.expiryDate);
    }
    if (product.dateOfEntry) {
      product.dateOfEntry = new Date();
    }

    return product;
  };

  const notifyNotificationUpdate = () => {
    eventService.emit('notificationUpdate');
  };

  const handleAddProduct = async () => {
    try {
      setError('');
      setLoading(prev => ({ ...prev, action: true }));
      const productData = {
        ...newProduct,
        dateOfEntry: new Date()
      };
      const validatedProduct = validateProduct(productData);
      console.log('Sending product data:', validatedProduct); // Debug log
      const response = await axios.post('http://localhost:5000/api/products/newproduct', validatedProduct);
      
      if (response.status === 201) {
        fetchProducts();
        // Reset form but keep company_name
        setNewProduct(prev => ({ company_name: prev.company_name }));
        setError('Product added successfully');
        notifyNotificationUpdate(); // Notify of new notification
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError(error.response?.data?.error || error.message || 'Error adding product');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleEditClick = (product) => {
    const formattedProduct = {
      ...product,
      expiryDate: formatDateForInput(product.expiryDate),
      dateOfEntry: formatDateForInput(product.dateOfEntry)
    };
    setEditingProduct(product);
    setNewProduct(formattedProduct);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    // Reset form but keep company_name
    setNewProduct(prev => ({ company_name: prev.company_name }));
  };

  const handleUpdateProduct = async () => {
    try {
      setError('');
      setLoading(prev => ({ ...prev, action: true }));
      const validatedProduct = validateProduct(newProduct);
      
      if (editingProduct && editingProduct._id) {
        console.log('Updating product with data:', validatedProduct); // Debug log
        const response = await axios.put(
          `http://localhost:5000/api/products/updateproduct/${editingProduct._id}`, 
          validatedProduct
        );
        
        if (response.status >= 200 && response.status < 300) {
          fetchProducts();
          // Reset form but keep company_name
          setNewProduct(prev => ({ company_name: prev.company_name }));
          setEditingProduct(null);
          setError('Product updated successfully');
          notifyNotificationUpdate(); // Notify of new notification
        }
      } else {
        setError('Error: No product ID found for update');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.response?.data?.error || error.message || 'Error updating product');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      setError('');
      setLoading(prev => ({ ...prev, action: true }));
      const response = await axios.delete(`http://localhost:5000/api/products/deleteproduct/${productId}`);
      if (response.status === 200) {
        fetchProducts();
        setError('Product deleted successfully');
        notifyNotificationUpdate(); // Notify of new notification
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.response?.data?.error || 'Error deleting product');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  return (
    <div>
      <h2>Product Manager</h2>
      
      {error && (
        <div style={{ 
          color: error.includes('success') ? 'green' : 'red',
          padding: '10px',
          margin: '10px 0',
          backgroundColor: error.includes('success') ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      
      <div className="card">
        <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
        {loading.fields ? (
          <p>Loading fields...</p>
        ) : (
          // Using Set to remove duplicate fields
          Array.from(new Set(fields.map(field => field.name))).map(fieldName => {
            const field = fields.find(f => f.name === fieldName);
            return (
              <div key={field._id} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  {field.name}:
                  <Field
                    type={field.type === 'Number' ? 'number' : 
                          field.type === 'Date' ? 'date' : 'text'}
                    placeholder={field.name}
                    value={
                      field.type === 'Date' && newProduct[field.name]
                        ? formatDateForInput(newProduct[field.name])
                        : newProduct[field.name] || ''
                    }
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    name={field.name}
                    disabled={loading.action}
                  />
                </label>
              </div>
            );
          })
        )}
        {editingProduct ? (
          <div className="button-group">
            <Button 
              label={loading.action ? "Updating..." : "Update Product"} 
              action={handleUpdateProduct}
              disabled={loading.action}
            />
            <Button 
              label="Cancel" 
              action={handleCancelEdit}
              disabled={loading.action}
            />
          </div>
        ) : (
          <Button 
            label={loading.action ? "Adding..." : "Add Product"} 
            action={handleAddProduct}
            disabled={loading.action}
          />
        )}
      </div>

      <div className="card">
        <h3>Products List</h3>
        <div style={{ overflowX: 'auto' }}>
          {loading.products ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p>No products found. Add your first product above.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  {/* Using Set to remove duplicate columns and ensure all field names are shown */}
                  {Array.from(new Set(fields.map(field => field.name))).map(fieldName => (
                    <th key={fieldName}>{fieldName}</th>
                  ))}
                  {userRole === 'Admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    {Array.from(new Set(fields.map(field => field.name))).map(fieldName => {
                      const field = fields.find(f => f.name === fieldName);
                      return (
                        <td key={fieldName}>
                          {field.type === 'Date' 
                            ? formatDateForDisplay(product[fieldName])
                            : product[fieldName]
                          }
                        </td>
                      );
                    })}
                    {userRole === 'Admin' && (
                      <td className="action-buttons">
                        <Button 
                          label="Edit" 
                          action={() => handleEditClick(product)}
                          disabled={loading.action}
                        />
                        <Button 
                          label="Delete" 
                          action={() => handleDeleteProduct(product._id)}
                          disabled={loading.action}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}