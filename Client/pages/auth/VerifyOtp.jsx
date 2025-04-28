import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Field from '../../components/Field';
import Button from '../../components/Button';

export function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('pendingSignup'));
    console.log(storedUserData);
    if (!storedUserData) {
      alert('No signup data found. Please signup again.');
      navigate('/signup');
    } else {
      setUserData(storedUserData);
    }
  }, [navigate]);

  const handleOtpSubmit = async () => {
    try {
      if (!userData) {
        alert('No signup data found. Please signup again.');
        navigate('/signup');
        return;
      }

      const verifyRes = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email: userData.email,
        otp
      });

      if (verifyRes.status >= 200 && verifyRes.status < 300) {
        // OTP Verified, now complete signup
        const signupRes = await axios.post('http://localhost:5000/api/auth/signup', {
          email: userData.email,
          password: userData.password,
          company_name: userData.cname,
          username: userData.username,
          address: userData.address,
          phone_number: userData.phone,
          role: "Admin"
        });

        if (signupRes.status >= 200 && signupRes.status < 300) {
          alert('Signup successful!');
          localStorage.removeItem('pendingSignup');
          navigate('/login');
        }
      }
    } catch (error) {
      console.log('Error', error);
      alert('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <h2>Verify OTP</h2>
      <Field type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} name="otp" />
      <Button label="Verify OTP" action={handleOtpSubmit} />
    </div>
  );
}
