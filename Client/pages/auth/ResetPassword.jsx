import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../src/config";
import { useToast } from "../../components/Toast";

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const resetToken = localStorage.getItem("resetToken");
    if (!resetToken) {
      toast.error("Unauthorized access. Please verify OTP first.");
      navigate("/forgot-password");
    } else {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    try {
      const resetToken = localStorage.getItem("resetToken");

      await axios.put(`${config.API_URL}/auth/reset-password`, {
        resetToken,
        newPassword,
      });

      toast.success("Password reset successfully!");

      localStorage.removeItem("resetToken");
      localStorage.removeItem("resetEmail");

      navigate("/login");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(error.response?.data?.message || "Failed to reset password.");
    }
  };

  const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '380px', textAlign: 'center', color: 'white' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '380px' }}>
        <div className="auth-logo">
          <h1 className="auth-logo-text"><span>Biz</span>SmartTrack</h1>
        </div>

        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Create a new secure password</p>

        <div className="auth-form">
          <div className="auth-input-group">
            <span className="input-icon"><LockIcon /></span>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="auth-input-group">
            <span className="input-icon"><LockIcon /></span>
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="auth-button-group">
            <button className="auth-btn-primary" onClick={handleSubmit}>
              Reset Password
            </button>
            <button
              className="auth-btn-google"
              style={{ justifyContent: 'center' }}
              onClick={() => navigate("/login")}
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Secure password reset
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
