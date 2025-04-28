import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Select from '../../components/Select';

export function SchemaManager() {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({
    name: '',
    type: 'String',
    required: false
  });
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({
    fields: false,
    products: false,
    action: false
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUser(decodedToken);
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

  const handleAddField = async () => {
    try {
      setError('');
      setLoading(prev => ({ ...prev, action: true }));

      if (!newField.name.trim()) {
        setError('Field name is required');
        return;
      }

      if (products.length > 0) {
        const confirmed = window.confirm(
          'Warning: Adding a new field will affect all existing products. Continue?'
        );
        if (!confirmed) return;
      }

      await axios.post(
        `http://localhost:5000/api/inventory/field?company_name=${user?.company_name}`, 
        newField
      );
      fetchFields();
      setNewField({ name: '', type: 'String', required: false });
      setError('Field added successfully');
    } catch (error) {
      console.error('Error adding field:', error);
      setError(error.response?.data?.message || 'Error adding field');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDeleteField = async (fieldId, fieldName) => {
    try {
      setError('');
      setLoading(prev => ({ ...prev, action: true }));
      const defaultFields = ['name', 'category', 'brandName', 'price', 'stock', 'expiryDate', 'dateOfEntry'];
      
      if (products.length > 0 && defaultFields.includes(fieldName)) {
        setError('Cannot delete required default fields while products exist');
        return;
      }

      if (products.length > 0) {
        const confirmed = window.confirm(
          'Warning: Deleting this field will remove this data from all products. This action cannot be undone. Continue?'
        );
        if (!confirmed) return;
      }

      await axios.delete(
        `http://localhost:5000/api/inventory/field/${fieldId}?company_name=${user?.company_name}`
      );
      fetchFields();
      setError('Field deleted successfully');
    } catch (error) {
      console.error('Error deleting field:', error);
      setError(error.response?.data?.message || 'Error deleting field');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  return (
    <div>
      <h2>Schema Manager</h2>
      
      {products.length > 0 && (
        <div style={{ 
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '4px',
          border: '1px solid #ffeeba'
        }}>
          <strong>Warning:</strong> There are {products.length} existing products in the system. 
          Modifying the schema (adding or removing fields) at this point may cause data inconsistency. 
          Please be careful when making changes.
        </div>
      )}
      
      {error && (
        <div className={error.includes('success') ? 'success-message' : 'error-message'}>
          {error}
        </div>
      )}

      <div className="card">
        <h3>Add New Field</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Field Name:
            <Field
              type="text"
              placeholder="Field Name"
              value={newField.name}
              onChange={(e) => setNewField({...newField, name: e.target.value})}
              disabled={loading.action}
            />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Field Type:
            <Select
              value={newField.type}
              onChange={(e) => setNewField({...newField, type: e.target.value})}
              options={['String', 'Number', 'Date']}
              disabled={loading.action}
            />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Required:
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) => setNewField({...newField, required: e.target.checked})}
              disabled={loading.action}
            />
          </label>
        </div>
        <Button 
          label={loading.action ? "Adding..." : "Add Field"} 
          action={handleAddField}
          disabled={loading.action}
        />
      </div>

      <div className="card">
        <h3>Current Fields</h3>
        <div style={{ overflowX: 'auto' }}>
          {loading.fields ? (
            <p>Loading fields...</p>
          ) : fields.length === 0 ? (
            <p>No custom fields found. Add your first field above.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  {/* Using Set to remove duplicate field names */}
                  {Array.from(new Set(['Name', 'Type', 'Required', 'Action'])).map(header => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Using Set to remove duplicate fields */}
                {Array.from(new Set(fields.map(field => field.name))).map(fieldName => {
                  const field = fields.find(f => f.name === fieldName);
                  return (
                    <tr key={field._id}>
                      <td>{field.name}</td>
                      <td>{field.type}</td>
                      <td>{field.required ? 'Yes' : 'No'}</td>
                      <td className="action-buttons">
                        <Button 
                          label={loading.action ? "Deleting..." : "Delete"}
                          action={() => handleDeleteField(field._id, field.name)}
                          disabled={loading.action}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}