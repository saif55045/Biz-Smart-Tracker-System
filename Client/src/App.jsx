import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { SignUp } from '../pages/auth/SignUp';
import { CompleteSignup } from '../pages/auth/CompleteSignUp';
import { VerifyOtp } from '../pages/auth/VerifyOtp';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { VerifyResetOtp } from '../pages/auth/VerifyResetOtp';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { SchemaManager } from '../pages/inventory/SchemaManager';
import { ProductManager } from '../pages/inventory/ProductManager';
import { Dashboard } from '../pages/dashboard/Dashboard';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import "./App.css"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/complete-signup" element={<CompleteSignup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Dashboard Route */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Inventory Routes - with Layout */}
        <Route path="/inventory">
          <Route index element={<Navigate to="/inventory/products" replace />} />
          
          <Route path="schema" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout>
                <SchemaManager />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="products" element={
            <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
              <Layout>
                <ProductManager />
              </Layout>
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
