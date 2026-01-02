import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../../src/config';
import { useToast } from '../../components/Toast';

export function CompleteSignup() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState({
    address: '',
    phone_number: '',
    company_name: '',
    password: '',
    cpassword: ""
  });

  const [companyNameStatus, setCompanyNameStatus] = useState({
    isChecking: false,
    isAvailable: null,
    message: "",
    suggestions: []
  });

  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));

    if (name === 'company_name') {
      if (debounceTimer) clearTimeout(debounceTimer);

      if (value.trim() === '') {
        setCompanyNameStatus({
          isChecking: false,
          isAvailable: null,
          message: "",
          suggestions: []
        });
        return;
      }

      setCompanyNameStatus(prev => ({ ...prev, isChecking: true }));

      const timer = setTimeout(() => {
        checkCompanyNameAvailability(value);
      }, 600);

      setDebounceTimer(timer);
    }
  };

  const checkCompanyNameAvailability = async (companyName) => {
    try {
      const res = await axios.post(`${config.API_URL}/auth/check-company-name`, {
        company_name: companyName,
        role: "Admin"
      });

      setCompanyNameStatus({
        isChecking: false,
        isAvailable: res.data.available,
        message: res.data.message,
        suggestions: res.data.suggestions || []
      });
    } catch (error) {
      console.error('Error checking company name:', error);
      setCompanyNameStatus({
        isChecking: false,
        isAvailable: false,
        message: "Error checking company name",
        suggestions: []
      });
    }
  };

  const selectSuggestion = (suggestion) => {
    setData(prev => ({ ...prev, company_name: suggestion }));
    setCompanyNameStatus(prev => ({
      ...prev,
      isAvailable: true,
      message: "Company name is available",
      suggestions: []
    }));
  };

  const handleSubmit = async () => {
    if (!data.address || !data.phone_number || !data.company_name || !data.password || !data.cpassword) {
      toast.warning("Please fill in all fields");
      return;
    }

    if (data.password !== data.cpassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (companyNameStatus.isAvailable === null && data.company_name.length > 0) {
      await checkCompanyNameAvailability(data.company_name);
      toast.info("Checking company name availability. Please try again in a moment.");
      return;
    }

    if (companyNameStatus.isAvailable === false) {
      toast.warning("Please choose an available company name.");
      return;
    }

    try {
      await axios.put(`${config.API_URL}/auth/complete-signup`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Profile updated successfully! Redirecting...');
      window.location.href = '/inventory/products';
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update.');
    }
  };

  // SVG Icons
  const LockIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
  const BuildingIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"></path></svg>;
  const PhoneIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
  const MapPinIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '400px' }}>
        <div className="auth-logo">
          <h1 className="auth-logo-text"><span>Biz</span>SmartTrack</h1>
        </div>

        <h2 className="auth-title">Complete Setup</h2>
        <p className="auth-subtitle">Finalize your business account</p>

        <div className="auth-form">
          {/* Company Name */}
          <div className="auth-input-group">
            <span className="input-icon"><BuildingIcon /></span>
            <input
              type="text" placeholder="Company Name" value={data.company_name} onChange={handleChange} name="company_name"
              style={{ borderColor: companyNameStatus.isAvailable === true ? 'rgba(16, 185, 129, 0.5)' : companyNameStatus.isAvailable === false ? 'rgba(239, 68, 68, 0.5)' : undefined }}
            />
          </div>
          {/* Company Status */}
          {data.company_name.length > 0 && (
            <div style={{ fontSize: '0.75rem', marginTop: '-0.375rem', color: companyNameStatus.isChecking ? '#64748b' : companyNameStatus.isAvailable ? '#10b981' : '#ef4444' }}>
              {companyNameStatus.isChecking ? 'Checking...' : companyNameStatus.message}
            </div>
          )}
          {/* Suggestions */}
          {companyNameStatus.isAvailable === false && companyNameStatus.suggestions.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {companyNameStatus.suggestions.map((s, i) => (
                <button key={i} onClick={() => selectSuggestion(s)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', color: '#60a5fa', fontSize: '0.7rem', cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
          )}

          {/* Phone */}
          <div className="auth-input-group">
            <span className="input-icon"><PhoneIcon /></span>
            <input type="text" placeholder="Phone Number" value={data.phone_number} onChange={handleChange} name="phone_number" />
          </div>

          {/* Address */}
          <div className="auth-input-group">
            <span className="input-icon"><MapPinIcon /></span>
            <input type="text" placeholder="Address" value={data.address} onChange={handleChange} name="address" />
          </div>

          {/* Passwords */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className="auth-input-group">
              <span className="input-icon"><LockIcon /></span>
              <input type="password" placeholder="Password" value={data.password} onChange={handleChange} name="password" />
            </div>
            <div className="auth-input-group">
              <span className="input-icon"><LockIcon /></span>
              <input type="password" placeholder="Confirm" value={data.cpassword} onChange={handleChange} name="cpassword" />
            </div>
          </div>

          <div className="auth-button-group">
            <button className="auth-btn-primary" onClick={handleSubmit}>
              Complete Signup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}