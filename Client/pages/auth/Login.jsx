import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import config from '../../src/config';
import './Auth.css';
import GoogleLogin from '../../components/auth/GoogleLogin';

export function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    email: "",
    password: "",
    cname: "",
    loginSuccess: null
  });

  const handleUserLogin = (e) => {
    setUser((prevUser => ({ ...prevUser, [e.target.name]: e.target.value })));
  }

  const handleAction = async () => {
    try {
      const response = await fetch(`${config.API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: user.cname,
          email: user.email,
          password: user.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser((prevUser) => ({ ...prevUser, loginSuccess: true }));

        const token = data.token;
        localStorage.setItem('token', token);

        const decodedToken = JSON.parse(atob(token.split('.')[1]));

        if (decodedToken.role === 'Admin') {
          navigate('/dashboard');
        } else {
          navigate('/inventory/products');
        }
      }
    } catch (error) {
      console.log('Error:', error);
      setUser((prevUser) => ({ ...prevUser, loginSuccess: false }));
    }
  };

  const handleSignUp = () => {
    navigate('/signup');
  }

  // SVG Icons
  const BuildingIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <path d="M9 22v-4h6v4"></path>
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"></path>
    </svg>
  );

  const MailIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
  );

  const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <h1 className="auth-logo-text"><span>Biz</span>SmartTrack</h1>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue to your account</p>

        <div className="auth-form">
          <div className="auth-input-group">
            <span className="input-icon"><BuildingIcon /></span>
            <input
              type="text"
              placeholder="Company Name"
              value={user.cname}
              onChange={handleUserLogin}
              name="cname"
            />
          </div>

          <div className="auth-input-group">
            <span className="input-icon"><MailIcon /></span>
            <input
              type="email"
              placeholder="Email Address"
              value={user.email}
              onChange={handleUserLogin}
              name="email"
            />
          </div>

          <div className="auth-input-group">
            <span className="input-icon"><LockIcon /></span>
            <input
              type="password"
              placeholder="Password"
              value={user.password}
              onChange={handleUserLogin}
              name="password"
            />
          </div>

          <div className="auth-options">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <a href="/forgot-password">Forgot Password?</a>
          </div>

          <div className="auth-button-group">
            <button className="auth-btn-primary" onClick={handleAction}>
              Sign In
            </button>

            <div className="auth-divider">or</div>

            <GoogleLogin className="auth-btn-google" />
          </div>
        </div>

        <div className="auth-footer">
          New here? <a href="#" onClick={handleSignUp}>Create account</a>
        </div>

        {user.loginSuccess !== null && (
          <div className={user.loginSuccess ? "success-message" : "error-message"}>
            {user.loginSuccess ? "Login Successful! Redirecting..." : "Invalid credentials. Please try again."}
          </div>
        )}
      </div>
    </div>
  );
}
