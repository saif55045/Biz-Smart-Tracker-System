import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../src/config';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Select from '../../components/Select';
import './SchemaManager.css';

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
  const [companyName, setCompanyName] = useState('');

  // Default fields configuration
  const defaultFields = [
    { name: 'name', type: 'String', required: false },
    { name: 'category', type: 'String', required: false },
    { name: 'brandName', type: 'String', required: false },
    { name: 'price', type: 'Number', required: false },
    { name: 'stock', type: 'Number', required: false },
    { name: 'expiryDate', type: 'Date', required: false },
    { name: 'dateOfEntry', type: 'Date', required: false }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded token in SchemaManager:', decodedToken);
        setUser(decodedToken);
        if (decodedToken.company_name) {
          setCompanyName(decodedToken.company_name);
        } else {
          console.error('No company_name in token:', decodedToken);
          setError('Company name not found in session. Please try logging in again.');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Session error. Please try logging in again.');
      }
    } else {
      console.error('No token found in localStorage');
      setError('No session found. Please log in.');
    }
  }, []);

  useEffect(() => {
    if (companyName) {
      console.log('Fetching data with company name:', companyName);
      initializeFields();
      fetchProducts();
    }
  }, [companyName]);

  const initializeFields = async () => {
    if (!companyName) return;

    try {
      setLoading(prev => ({ ...prev, fields: true }));

      // Fetch existing fields including deleted ones
      const response = await axios.get(`${config.API_URL}/inventory/fields?company_name=${companyName}`);
      const existingFields = response.data;

      // Get all default fields that haven't been saved yet
      const fieldsToAdd = [];
      for (const defaultField of defaultFields) {
        const existingField = existingFields.find(f => f.name === defaultField.name);
        if (!existingField) {
          fieldsToAdd.push({
            ...defaultField,
            company_name: companyName,
            isDefault: true
          });
        }
      }

      // Add any missing default fields to the database
      if (fieldsToAdd.length > 0) {
        await Promise.all(fieldsToAdd.map(field =>
          axios.post(`${config.API_URL}/inventory/field?company_name=${companyName}`, field)
        ));
      }

      // Fetch all fields again to get the updated list
      await fetchFields();
    } catch (error) {
      console.error('Error initializing fields:', error);
      setError('Error initializing fields');
    } finally {
      setLoading(prev => ({ ...prev, fields: false }));
    }
  };

  const fetchFields = async () => {
    if (!companyName) {
      setError('Company name not found. Please try logging in again.');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, fields: true }));
      const response = await axios.get(`${config.API_URL}/inventory/fields?company_name=${companyName}`);
      // Filter out deleted fields
      const activeFields = response.data.filter(field => !field.isDeleted);
      setFields(activeFields);
      setError('');
    } catch (error) {
      console.error('Error fetching fields:', error);
      setError('Error fetching fields');
    } finally {
      setLoading(prev => ({ ...prev, fields: false }));
    }
  };

  const fetchProducts = async () => {
    if (!companyName) {
      setError('Company name not found. Please try logging in again.');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, products: true }));
      const response = await axios.get(`${config.API_URL}/products/products?company_name=${companyName}`);
      // Handle both old array format and new paginated format
      const data = Array.isArray(response.data) ? response.data : (response.data?.products || []);
      setProducts(data);
      setError('');
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error fetching products');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const handleAddField = async () => {
    if (!companyName) {
      setError('Company name not found. Please try logging in again.');
      return;
    }

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
        `${config.API_URL}/inventory/field?company_name=${companyName}`,
        newField
      );
      fetchFields();
      setNewField({ name: '', type: 'String', required: false });
      setError('Field added successfully');
    } catch (error) {
      console.error('Error adding field:', error);
      setError(error.response?.data?.error || error.message || 'Error adding field');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDeleteField = async (fieldId, fieldName) => {
    if (!companyName) {
      setError('Company name not found. Please try logging in again.');
      return;
    }

    try {
      setError('');
      setLoading(prev => ({ ...prev, action: true }));

      if (products.length > 0) {
        const confirmed = window.confirm(
          'Warning: Deleting this field will remove this data from all products. This action cannot be undone. Continue?'
        );
        if (!confirmed) {
          setLoading(prev => ({ ...prev, action: false }));
          return;
        }
      }

      // For both default and custom fields, mark as deleted in the database
      await axios.put(
        `${config.API_URL}/inventory/field/${fieldId}?company_name=${companyName}`,
        { isDeleted: true }
      );

      await fetchFields();
      setError('Field deleted successfully');
    } catch (error) {
      console.error('Error deleting field:', error);
      setError(error.response?.data?.error || error.message || 'Error deleting field');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleResetToDefault = async () => {
    if (!companyName) {
      setError('Company name not found. Please try logging in again.');
      return;
    }

    try {
      setError('');
      setLoading(prev => ({ ...prev, action: true }));

      const confirmed = window.confirm(
        'Warning: This will delete all custom fields and restore only the default fields. This action cannot be undone. Continue?'
      );
      if (!confirmed) {
        setLoading(prev => ({ ...prev, action: false }));
        return;
      }

      // Get all fields from database
      const response = await axios.get(`${config.API_URL}/inventory/fields?company_name=${companyName}`);
      const existingFields = response.data;

      // Mark all existing fields as deleted
      await Promise.all(existingFields.map(field =>
        axios.put(
          `${config.API_URL}/inventory/field/${field._id}?company_name=${companyName}`,
          { isDeleted: true }
        )
      ));

      // Add default fields as new entries
      await Promise.all(defaultFields.map(field =>
        axios.post(
          `${config.API_URL}/inventory/field?company_name=${companyName}`,
          {
            ...field,
            company_name: companyName,
            isDefault: true
          }
        )
      ));

      await fetchFields();
      setError('Successfully reset to default fields');
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      setError(error.response?.data?.error || error.message || 'Error resetting to defaults');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  return (
    <div className="schema-manager">
      <div className="schema-header">
        <div className="title-section">
          <h2 className="schema-manager-title">Schema Manager</h2>
          <p className="schema-description">
            Define and manage the fields for your product inventory
          </p>
        </div>
        <div className="stats-section">
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-table"></i>
            </div>
            <div className="stat-details">
              <span className="stat-label">Total Fields</span>
              <span className="stat-value">{fields.length}</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-box"></i>
            </div>
            <div className="stat-details">
              <span className="stat-label">Products</span>
              <span className="stat-value">{products.length}</span>
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <div className="notification-banner warning-banner">
          <div className="banner-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="banner-content">
            <h4>Warning: Schema Modification</h4>
            <p>There are <strong>{products.length} existing products</strong> in the system.
              Modifying the schema may cause data inconsistency. Please proceed with caution.</p>
          </div>
        </div>
      )}

      {error && (
        <div className={`notification-banner ${error.includes('success') ? 'success-banner' : 'error-banner'}`}>
          <div className="banner-icon">
            <i className={`fas ${error.includes('success') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          </div>
          <div className="banner-content">
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="schema-panels">
        <div className="panel add-field-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <i className="fas fa-plus-circle"></i>
              Add New Field
            </h3>
          </div>
          <div className="panel-body">
            <div className="form-group">
              <label>
                <i className="fas fa-tag"></i> Field Name
                <span className="required-indicator">*</span>
              </label>
              <Field
                type="text"
                placeholder="Enter field name (e.g. color, weight)"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                disabled={loading.action}
              />
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-code"></i> Field Type
              </label>
              <div className="type-selector">
                <div
                  className={`type-option ${newField.type === 'String' ? 'selected' : ''}`}
                  onClick={() => setNewField({ ...newField, type: 'String' })}
                >
                  <i className="fas fa-font"></i>
                  <span>Text</span>
                </div>
                <div
                  className={`type-option ${newField.type === 'Number' ? 'selected' : ''}`}
                  onClick={() => setNewField({ ...newField, type: 'Number' })}
                >
                  <i className="fas fa-hashtag"></i>
                  <span>Number</span>
                </div>
                <div
                  className={`type-option ${newField.type === 'Date' ? 'selected' : ''}`}
                  onClick={() => setNewField({ ...newField, type: 'Date' })}
                >
                  <i className="fas fa-calendar"></i>
                  <span>Date</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label><i className="fas fa-asterisk"></i> Required Field</label>
              <div className="toggle-container">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    disabled={loading.action}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">{newField.required ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="form-actions">
              <Button
                label={loading.action ? "Adding..." : "Add Field"}
                action={handleAddField}
                disabled={loading.action}
              />
            </div>
          </div>
        </div>

        <div className="panel fields-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <i className="fas fa-list"></i> Current Fields
            </h3>
            <Button
              label={loading.action ? "Resetting..." : "Reset to Default"}
              action={handleResetToDefault}
              disabled={loading.action}
              className="reset-button"
            />
          </div>
          <div className="panel-body">
            {loading.fields ? (
              <div className="loading-container">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading fields...</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-database"></i>
                <p>No fields found. Add your first field to get started.</p>
              </div>
            ) : (
              <>
                <div className="info-banner">
                  <i className="fas fa-info-circle"></i>
                  <p>Default fields are provided as suggestions. You can freely delete or modify them based on your needs.</p>
                </div>
                <div className="fields-table-container">
                  <table className="fields-table">
                    <thead>
                      <tr>
                        <th className="name-column">Name</th>
                        <th className="type-column">Type</th>
                        <th className="required-column">Required</th>
                        <th className="actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map(field => (
                        <tr key={field._id} className={field.isDefault ? 'default-field' : ''}>
                          <td className="name-column">
                            <span className="field-name">{field.name}</span>
                            {field.isDefault && <span className="default-badge">Default</span>}
                          </td>
                          <td className="type-column">
                            <span className={`type-badge type-${field.type.toLowerCase()}`}>
                              {field.type === 'String' && <i className="fas fa-font"></i>}
                              {field.type === 'Number' && <i className="fas fa-hashtag"></i>}
                              {field.type === 'Date' && <i className="fas fa-calendar"></i>}
                              {field.type}
                            </span>
                          </td>
                          <td className="required-column">
                            <span className={`required-badge ${field.required ? 'is-required' : 'not-required'}`}>
                              {field.required ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="actions-column">
                            <button
                              className="action-button delete-button"
                              onClick={() => handleDeleteField(field._id, field.name)}
                              disabled={loading.action}
                              title="Delete field"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
