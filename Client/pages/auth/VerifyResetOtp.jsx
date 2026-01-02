import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from '../../src/config';
import { useToast } from "../../components/Toast";

export function VerifyResetOtp() {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(59); // Timer in seconds (1 min)
  const [email, setEmail] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (!storedEmail) {
      toast.error("No email found. Please start the reset process again.");
      navigate("/forgot-password");
    } else {
      setEmail(storedEmail);
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
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus to the next input
    if (element.value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (!email) {
        toast.error("No email found. Please start the reset process again.");
        navigate("/forgot-password");
        return;
      }

      const otpCode = otp.join("");
      if (otpCode.length !== 6) {
        toast.warning("Please enter a valid 6-digit OTP.");
        return;
      }

      const res = await axios.post(`${config.API_URL}/auth/verify-otp`, {
        email,
        otp: otpCode,
      });

      if (res.status >= 200 && res.status < 300) {
        const { resetToken } = res.data;
        localStorage.setItem("resetToken", resetToken);

        toast.success("OTP verified successfully!");
        navigate("/reset-password");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error(error.response?.data?.message || "Invalid OTP. Please try again.");
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
          Enter verification code sent to your email
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
              id={`otp-input-${index}`}
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
            onClick={handleVerifyOtp}
          >
            Verify OTP
          </button>
        </div>

        <div className="auth-footer" style={{ marginTop: '1.5rem', color: '#64748b' }}>
          End-to-end encrypted
        </div>
      </div>
    </div>
  );
}

export default VerifyResetOtp;
