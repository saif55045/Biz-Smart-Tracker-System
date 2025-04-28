import { useState } from 'react';
import axios from 'axios';
import Field from '../../components/Field';
import Button from '../../components/Button';
export function CompleteSignup() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const [data, setData] = useState({
    address: '',
    phone_number: '',
    company_name: '',
    password:'',
    cpassword:""
  });

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if(data.password!==data.cpassword){
        alert("Passwords do not match!");
        return;
    }
    try {
      await axios.put('http://localhost:5000/api/auth/complete-signup', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('Profile updated successfully! Redirecting...');
      window.location.href = '/inventory/products';
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update.');
    }
  };

  return (
    <div className="auth-page">
      <Field type="text" placeholder="Company Name" value={data.company_name} onChange={handleChange} name="company_name" />
      <Field type="text" placeholder="Phone Number" value={data.phone_number} onChange={handleChange} name="phone_number" />
      <Field type="text" placeholder="Address" value={data.address} onChange={handleChange} name="address" />
      <Field type="password" placeholder="Password" value={data.password} onChange={handleChange} name="password" />
      <Field type="password" placeholder="Confirm Password" value={data.cpassword} onChange={handleChange} name="cpassword"/>
      <Button label="Login" action={handleSubmit} />
    </div>
  );
}
