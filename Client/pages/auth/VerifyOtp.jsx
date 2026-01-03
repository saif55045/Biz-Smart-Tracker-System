
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import config from '../../src/config';
import './Auth.css';
import { useToast } from '../../components/Toast';

export function VerifyOtp() {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [timer, setTimer] = useState(59); // Timer in seconds (1 min)
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('pendingSignup'));
    if (!storedUserData) {
      toast.error('No signup data found. Please signup again.');
      navigate('/signup');
    } else {
      setUserData(storedUserData);
    }

    // Countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs} `;
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus to the next input
    if (element.value && index < 5) {
      document.getElementById(`otp - input - ${index + 1} `).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp - input - ${index - 1} `).focus();
    }
  };

  const handleOtpSubmit = async () => {
    try {
      const otpCode = otp.join('');
      if (otpCode.length !== 6) {
        toast.warning('Please enter a valid 6-digit OTP.');
        return;
      }

      if (!userData) {
        toast.error('No signup data found. Please signup again.');
        navigate('/signup');
        return;
      }

      const verifyRes = await axios.post(`${config.API_URL}/auth/verify-otp`, {
        email: userData.email,
        otp: otpCode
      });

      if (verifyRes.status === 200) {
        // Only alert if preferred, or just rely on the next step
        const signupRes = await axios.post(`${config.API_URL}/auth/signup`, {
          email: userData.email,
          password: userData.password,
          company_name: userData.cname,
          username: userData.username,
          address: userData.address,
          phone_number: userData.phone,
          role: "Admin"
        });

        if (signupRes.status === 200) {
          toast.success('Signup successful!');
          localStorage.removeItem('pendingSignup');
          navigate('/login');
        }
      }
    } catch (error) {
      console.log('Error', error);
      if (error.response && error.response.data) {
        toast.error(`Error: ${error.response.data.error || 'Invalid OTP'} `);
      } else {
        toast.error('Invalid OTP or signup error. Please try again.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div className="auth-logo">
          <h1 className="auth-logo-text"><span>Biz</span>SmartTrack</h1>
        </div>

        <h2 className="auth-title">Verify OTP</h2>
        <p className="auth-subtitle">
          Enter the code sent to your email
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={(e) => e.target.select()}
              id={`otp - input - ${index} `}
              style={{
                width: '46px',
                height: '56px',
                textAlign: 'center',
                fontSize: '1.25rem',
                fontWeight: '600',
                borderRadius: '8px',
                border: '1px solid rgba(71, 85, 105, 0.3)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#f8fafc',
                outline: 'none',
                padding: 0
              }}
            />
          ))}
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Code expires in: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{formatTime(timer)}</span>
        </p>

        <div className="auth-button-group">
          <button
            className="auth-btn-primary"
            onClick={handleOtpSubmit}
            disabled={otp.join('').length !== 6}
            style={{ opacity: otp.join('').length !== 6 ? 0.7 : 1 }}
          >
            Verify & Complete Signup
          </button>
        </div>

        <div className="auth-footer" style={{ marginTop: '1.5rem', color: '#64748b' }}>
          End-to-end encrypted
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;