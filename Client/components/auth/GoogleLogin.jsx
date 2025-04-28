import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from "../Button";

export default function GoogleLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a token in the URL (Google callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Store the token
      localStorage.setItem('token', token);
      
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Decode token to get user role
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
        
      // Redirect based on role
      if (decodedToken.role === 'Admin') {
        navigate('/dashboard');
      } else {
        navigate('/inventory/products');
      }
    }
  }, [navigate]);

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <>
      <Button label="Login with Google" action={handleGoogleLogin} />
    </>
  );
}