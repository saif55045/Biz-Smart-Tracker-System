import Field from '../../components/Field';
import Button from '../../components/Button';
import { useState } from 'react';
import axios from 'axios';
import GoogleLogin from '../../components/auth/GoogleLogin';
import { useNavigate } from 'react-router-dom';

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
      const res = await axios.post('http://localhost:5000/api/auth/signin', {
        company_name: user.cname,
        email: user.email,
        password: user.password
      });

      if (res.status >= 200 && res.status < 300) {
        setUser((prevUser) => ({ ...prevUser, loginSuccess: true }));
        
        // Store the token
        const token = res.data.token;
        localStorage.setItem('token', token);
        
        // Decode token to get user role
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        
        // Redirect based on role
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
  
  return (
    <div className="auth-page">
      <Field type="text" placeholder="Company Name" value={user.cname} onChange={handleUserLogin} name="cname" />
      <Field type="text" placeholder="Email" value={user.email} onChange={handleUserLogin} name="email" />
      <Field type="password" placeholder="Password" value={user.password} onChange={handleUserLogin} name="password" />
      <a href="/forgot-password">Forget Password?</a>
      <br />
      <Button label="Login" action={handleAction} />
      <Button label="Sign Up" action={handleSignUp} />
      <GoogleLogin/>

      {user.loginSuccess !== null && (user.loginSuccess ? <h2 style={{ color: 'green' }}>Redirecting...</h2> : <h2 style={{ color: 'red' }}>Login Failed! Please check your credentials.</h2>)}
    </div>
  );
}
