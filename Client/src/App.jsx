import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/landing/LandingPage';
import { Login } from '../pages/auth/Login';
import { SignUp } from '../pages/auth/SignUp';
import { CompleteSignup } from '../pages/auth/CompleteSignUp';
import { VerifyOtp } from '../pages/auth/VerifyOtp';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { VerifyResetOtp } from '../pages/auth/VerifyResetOtp';
import { ResetPassword } from '../pages/auth/ResetPassword';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Dashboard & Reports
import { Dashboard } from '../pages/dashboard/Dashboard';
import Reports from '../pages/dashboard/Reports';

// Inventory Management
import { SchemaManager } from '../pages/inventory/SchemaManager';
import { ProductManager } from '../pages/inventory/ProductManager';
import Selling from '../pages/inventory/selling';

// User Management
import { UserManager } from '../pages/user/UserManager';
import AttendanceManager from '../pages/user/Userattendance';
import Profile from '../pages/user/Profile';

// Customer & Invoice
import CustomerManager from '../pages/customer/CustomerManager';
import InvoiceView from '../pages/invoice/InvoiceView';

// Discussion Module
import { DiscussionBoard } from '../pages/discussion/DiscussionBoard';
import { DiscussionDetail } from '../pages/discussion/DiscussionDetail';
import { CreateDiscussion } from '../pages/discussion/CreateDiscussion';

// Expenses
import ExpenseManager from '../pages/expenses/ExpenseManager';

// Settings
import CompanySettings from '../pages/settings/CompanySettings';

// Context Providers
import { CurrencyProvider } from '../context/CurrencyContext';

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <CurrencyProvider>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/complete-signup" element={<CompleteSignup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Reports Route */}
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Selling Route */}
          <Route path="/selling" element={
            <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
              <Layout>
                <Selling />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Invoice Route */}
          <Route path="/invoice/:invoiceId" element={
            <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
              <Layout>
                <InvoiceView />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Customer Management Route */}
          <Route path="/customers" element={
            <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
              <Layout>
                <CustomerManager />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Dashboard Route */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout>
                <UserManager />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
              <Layout>
                <AttendanceManager />
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

          {/* Discussion Routes */}
          <Route path="/discussion" element={
            <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
              <Layout>
                <DiscussionBoard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/discussion/create" element={
            <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
              <Layout>
                <CreateDiscussion />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/discussion/:id" element={
            <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
              <Layout>
                <DiscussionDetail />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Expense Manager Route */}
          <Route path="/expenses" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout>
                <ExpenseManager />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Profile Route */}
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Settings Route */}
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout>
                <CompanySettings />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </CurrencyProvider>
    </BrowserRouter>
  );
}

export default App;
