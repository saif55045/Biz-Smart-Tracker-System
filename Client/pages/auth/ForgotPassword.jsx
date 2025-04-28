import { useState } from "react";
import Field from "../../components/Field";
import Button from "../../components/Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/forget-password-otp", { email });
      localStorage.setItem('resetEmail', email);
      alert("OTP sent to your email!");
      navigate('/verify-reset-otp');
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert(error.response?.data?.message || "Failed to send OTP.");
    }
  };

  return (
    <div className="auth-page">
      <h2>Forgot Password</h2>
      <Field
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        name="email"
      />
      <Button label="Send OTP" action={handleSubmit} />
    </div>
  );
}
