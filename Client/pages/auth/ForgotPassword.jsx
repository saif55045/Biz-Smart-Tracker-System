import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../../src/config';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ success: null, message: '' });

  const handleAction = async () => {
    if (!email) {
      setStatus({ success: false, message: 'Please enter your email.' });
      return;
    }

    try {
      const res = await axios.post(`${config.API_URL}/auth/forget-password-otp`, { email });

      // Check status from response if available, or just assume success if no error thrown
      if (res.status >= 200 && res.status < 300) {
        setStatus({ success: true, message: 'OTP sent! Redirecting...' });
        localStorage.setItem('resetEmail', email);
        setTimeout(() => navigate('/verify-reset-otp'), 1500);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setStatus({ success: false, message: error.response?.data?.message || 'Failed to send OTP.' });
    }
  };

  const MailIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
  );

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '380px' }}>
        <div className="auth-logo">
          <h1 className="auth-logo-text"><span>Biz</span>SmartTrack</h1>
        </div>

        <h2 className="auth-title">Forgot Password?</h2>
        <p className="auth-subtitle">Enter your email to receive an OTP</p>

        <div className="auth-form">
          <div className="auth-input-group">
            <span className="input-icon"><MailIcon /></span>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-button-group">
            <button className="auth-btn-primary" onClick={handleAction}>
              Send OTP
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Remember password? <a href="/login">Sign In</a>
        </div>

        {status.success !== null && (
          <div className={status.success ? "success-message" : "error-message"}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
