import { useState, useEffect } from "react";
import Field from "../../components/Field";
import Button from "../../components/Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const resetToken = localStorage.getItem('resetToken');
    if (!resetToken) {
      // No token? Redirect to forgot password
      alert("Unauthorized access. Please verify OTP first.");
      navigate('/forgot-password');
    }
  }, [navigate]);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const resetToken = localStorage.getItem('resetToken');

      await axios.put("http://localhost:5000/api/auth/reset-password", {
        resetToken,
        newPassword,
      });

      alert("Password reset successfully!");

      // Clear temp data
      localStorage.removeItem('resetToken');
      localStorage.removeItem('resetEmail');

      navigate('/login');
    } catch (error) {
      console.error("Error resetting password:", error);
      alert(error.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="auth-page">
      <h2>Reset Password</h2>
      <Field
        type="password"
        placeholder="Enter New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        name="newPassword"
      />
      <Field
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        name="confirmPassword"
      />
      <Button label="Reset Password" action={handleSubmit} />
    </div>
  );
}
