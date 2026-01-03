import { useState, useRef } from "react";
import axios from 'axios';
import config from '../../src/config';
import './Auth.css';
import GoogleLogin from "../../components/auth/GoogleLogin";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Toast";

export function SignUp() {
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState({
        email: "",
        password: "",
        cname: "",
        loginSuccess: null,
        username: "",
        address: "",
        phone: "",
        cpassword: "",
        role: "Admin"
    });

    const [companyNameStatus, setCompanyNameStatus] = useState({
        isChecking: false,
        isAvailable: null,
        message: "",
        suggestions: []
    });

    const [debounceTimer, setDebounceTimer] = useState(null);
    // Assuming setStep is meant to be a state setter for a loading indicator,
    // but it's not defined in the original code.
    // For now, I'll define a dummy one or assume it's a typo for setCompanyNameStatus.isChecking.
    // Given the instruction, I'll add it as is, but it will cause an error if not defined elsewhere.
    // Let's assume it's a typo and should be related to companyNameStatus.isChecking.
    // However, the instruction explicitly says `setStep('loading');`.
    // I will add a placeholder state for `step` to make it syntactically correct.
    const [step, setStep] = useState('');


    const handleUserSignUp = (event) => {
        const { name, value } = event.target;
        setUser((prevUser) => ({ ...prevUser, [name]: value }));

        if (name === 'cname') {
            if (debounceTimer) clearTimeout(debounceTimer);
            if (value.trim() === '') {
                setCompanyNameStatus({ isChecking: false, isAvailable: null, message: "", suggestions: [] });
                return;
            }
            setCompanyNameStatus(prev => ({ ...prev, isChecking: true }));
            const timer = setTimeout(() => checkCompanyNameAvailability(value), 600);
            setDebounceTimer(timer);
        }
    };

    const checkCompanyNameAvailability = async (companyName) => {
        setStep('loading'); // Added as per instruction
        try {
            const response = await fetch(`${config.API_URL}/auth/check-company-name`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_name: companyName, role: "Admin" })
            });
            const data = await response.json();
            setCompanyNameStatus({
                isChecking: false,
                isAvailable: data.available,
                message: data.message,
                suggestions: data.suggestions || []
            });
        } catch (error) {
            setCompanyNameStatus({ isChecking: false, isAvailable: false, message: "Error checking", suggestions: [] });
        }
    };

    const selectSuggestion = (suggestion) => {
        setUser(prev => ({ ...prev, cname: suggestion }));
        setCompanyNameStatus(prev => ({ ...prev, isAvailable: true, message: "Available", suggestions: [] }));
    };

    const handleAction = async () => {
        if (!user.username || !user.email || !user.password || !user.cpassword || !user.cname) {
            toast.warning("Please fill in all required fields");
            return;
        }
        if (user.password !== user.cpassword) {
            toast.error("Passwords do not match!");
            return;
        }
        // Password strength validation (must match backend)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (user.password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        if (!passwordRegex.test(user.password)) {
            toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
            return;
        }
        if (companyNameStatus.isAvailable === false) {
            toast.warning("Please choose an available company name.");
            return;
        }

        try {
            const res = await axios.post(`${config.API_URL}/auth/send-otp`, { email: user.email });
            if (res.status >= 200 && res.status < 300) {
                localStorage.setItem('pendingSignup', JSON.stringify(user));
                navigate('/verify-otp');
            }
        } catch (error) {
            toast.error('Failed to send OTP. Please try again.');
        }
    };

    // SVG Icons
    const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    const MailIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
    const LockIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    const BuildingIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" /></svg>;
    const PhoneIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    const MapPinIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '400px' }}>
                <div className="auth-logo">
                    <h1 className="auth-logo-text"><span>Biz</span>SmartTrack</h1>
                </div>

                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Register your business to get started</p>

                <div className="auth-form">
                    {/* Username */}
                    <div className="auth-input-group">
                        <span className="input-icon"><UserIcon /></span>
                        <input type="text" placeholder="Username" value={user.username} onChange={handleUserSignUp} name="username" />
                    </div>

                    {/* Email */}
                    <div className="auth-input-group">
                        <span className="input-icon"><MailIcon /></span>
                        <input type="email" placeholder="Email Address" value={user.email} onChange={handleUserSignUp} name="email" />
                    </div>

                    {/* Company Name */}
                    <div className="auth-input-group">
                        <span className="input-icon"><BuildingIcon /></span>
                        <input
                            type="text" placeholder="Company Name" value={user.cname} onChange={handleUserSignUp} name="cname"
                            style={{ borderColor: companyNameStatus.isAvailable === true ? 'rgba(16, 185, 129, 0.5)' : companyNameStatus.isAvailable === false ? 'rgba(239, 68, 68, 0.5)' : undefined }}
                        />
                    </div>

                    {/* Company Status */}
                    {user.cname.length > 0 && (
                        <div style={{ fontSize: '0.75rem', marginTop: '-0.375rem', color: companyNameStatus.isChecking ? '#64748b' : companyNameStatus.isAvailable ? '#10b981' : '#ef4444' }}>
                            {companyNameStatus.isChecking ? 'Checking...' : companyNameStatus.message}
                        </div>
                    )}

                    {/* Suggestions */}
                    {companyNameStatus.isAvailable === false && companyNameStatus.suggestions.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {companyNameStatus.suggestions.map((s, i) => (
                                <button key={i} onClick={() => selectSuggestion(s)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', color: '#60a5fa', fontSize: '0.7rem', cursor: 'pointer' }}>{s}</button>
                            ))}
                        </div>
                    )}

                    {/* Phone */}
                    <div className="auth-input-group">
                        <span className="input-icon"><PhoneIcon /></span>
                        <input type="text" placeholder="Phone Number" value={user.phone} onChange={handleUserSignUp} name="phone" />
                    </div>

                    {/* Address */}
                    <div className="auth-input-group">
                        <span className="input-icon"><MapPinIcon /></span>
                        <input type="text" placeholder="Address" value={user.address} onChange={handleUserSignUp} name="address" />
                    </div>

                    {/* Password Row - Two columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="auth-input-group">
                            <span className="input-icon"><LockIcon /></span>
                            <input type="password" placeholder="Password" value={user.password} onChange={handleUserSignUp} name="password" />
                        </div>
                        <div className="auth-input-group">
                            <span className="input-icon"><LockIcon /></span>
                            <input type="password" placeholder="Confirm" value={user.cpassword} onChange={handleUserSignUp} name="cpassword" />
                        </div>
                    </div>

                    <div className="auth-button-group">
                        <button className="auth-btn-primary" onClick={handleAction}>Create Account</button>
                        <div className="auth-divider">or</div>
                        <GoogleLogin />
                    </div>
                </div>

                <div className="auth-footer">
                    Already have an account? <a href="#" onClick={() => navigate('/login')}>Sign In</a>
                </div>

                {user.loginSuccess != null && (
                    <div className={user.loginSuccess ? "success-message" : "error-message"}>
                        {user.loginSuccess ? "Registration Successful!" : "Registration Failed!"}
                    </div>
                )}
            </div>
        </div>
    );
}