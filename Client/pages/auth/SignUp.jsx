import { useState } from "react";
import Field from "../../components/Field";
import Button from "../../components/Button";
import axios from 'axios';
import GoogleLogin from "../../components/auth/GoogleLogin";
import { useNavigate } from "react-router-dom";  
export function SignUp() {
    const navigate = useNavigate();
    const [user,setUser]=useState({
        email:"",
        password:"",
        cname:"",
        loginSuccess:null,
        username:"",
        address:"",
        phone:"",
        cpassword:""

      });
    const handleUserSignUp = (event) => {
        setUser((prevUser)=>({...prevUser,[event.target.name]:event.target.value}));
    }
    const handleAction = async () => {
        if (user.password !== user.cpassword) {
          alert("Passwords do not match!");
          return;
        }
    
        try {
          const res = await axios.post('http://localhost:5000/api/auth/send-otp', {
            email: user.email
          });
    
          if (res.status >= 200 && res.status < 300) {
            // Save user data temporarily in localStorage
            localStorage.setItem('pendingSignup', JSON.stringify(user));
            // Navigate to verify OTP page
            navigate('/verify-otp');
          }
        } catch (error) {
          console.log('Error', error);
          alert('Failed to send OTP. Please try again.');
        }
    }
    const handleLogin=()=>{
      navigate('/login');
    }
    return (
        <div className="auth-page">
            <Field type="text" placeholder="Username" value={user.username} onChange={handleUserSignUp} name="username"/>
            <Field type="text" placeholder="Email" value={user.email} onChange={handleUserSignUp} name="email"/>
            <Field type="password" placeholder="Password" value={user.password} onChange={handleUserSignUp} name="password"/>
            <Field type="password" placeholder="Confirm Password" value={user.cpassword} onChange={handleUserSignUp} name="cpassword"/>
            <Field type="text" placeholder="Company Name" value={user.cname} onChange={handleUserSignUp} name="cname"/>
            <Field type="text" placeholder="Phone Number" value={user.phone} onChange={handleUserSignUp} name="phone"/>
            <Field type="text" placeholder="Address" value={user.address} onChange={handleUserSignUp} name="address"/>
            
            <Button label="SignUp" action={handleAction} />
            <Button label="Login" action={handleLogin} />
            <GoogleLogin/>
            {user.loginSuccess!=null && (user.loginSuccess?<h2 style={{ color: 'green' }}>Login Successful!</h2>:<h2 style={{ color: 'red' }}>Login Failure!</h2>)}
        </div>
    )
}