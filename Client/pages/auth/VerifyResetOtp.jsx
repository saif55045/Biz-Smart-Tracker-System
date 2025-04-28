import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Field from "../../components/Field";
import Button from "../../components/Button";
import axios from "axios";

export function VerifyResetOtp() {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (!storedEmail) {
      alert("No email found. Please start the reset process again.");
      navigate("/forgot-password");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  const handleVerifyOtp = async () => {
    try {
      if (!email) {
        alert("No email found. Please start the reset process again.");
        navigate("/forgot-password");
        return;
      }

      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });

      if (res.status >= 200 && res.status < 300) {
        // ✅ Save resetToken
        const { resetToken } = res.data;
        localStorage.setItem('resetToken', resetToken);

        alert("OTP verified successfully!");
        navigate("/reset-password");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert(error.response?.data?.message || "Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <h2>Verify OTP for Password Reset</h2>
      <Field
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        name="otp"
      />
      <Button label="Verify OTP" action={handleVerifyOtp} />
    </div>
  );
}
