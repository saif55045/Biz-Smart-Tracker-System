import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../../src/config';
import './Profile.css';

// Icon Components
const CameraIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

const SaveIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);

const UserIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const MailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

const PhoneIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const BuildingIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <path d="M9 22v-4h6v4"></path>
        <line x1="8" y1="6" x2="8" y2="6.01"></line>
        <line x1="16" y1="6" x2="16" y2="6.01"></line>
        <line x1="12" y1="6" x2="12" y2="6.01"></line>
        <line x1="8" y1="10" x2="8" y2="10.01"></line>
        <line x1="16" y1="10" x2="16" y2="10.01"></line>
        <line x1="12" y1="10" x2="12" y2="10.01"></line>
    </svg>
);

const MapPinIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const InfoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone_number: '',
        address: '',
        company_name: '',
        profilePicture: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${config.API_URL}/user/current-user`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const userData = response.data;
            console.log('Fetched user data:', userData);

            setUser(userData);
            setFormData({
                username: userData.username || '',
                email: userData.email || '',
                phone_number: userData.phone_number || '',
                address: userData.address || '',
                company_name: userData.company_name || '',
                profilePicture: userData.profilePicture || ''
            });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile. Please try again.');
            setLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5000000) {
                setError('Image too large (max 5MB)');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePicture: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${config.API_URL}/user/userupdate/${user._id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Profile updated successfully!');
            setUser(prev => ({ ...prev, ...formData }));
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-screen">Loading Profile...</div>;
    }

    if (!user) {
        return <div className="loading-screen">Error loading profile</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your account settings and preferences</p>
            </div>

            <div className="profile-content">
                {/* LEFT CARD: Identity */}
                <div className="glass-card identity-card">
                    <div className="avatar-container">
                        <div className="avatar-ring">
                            {formData.profilePicture ? (
                                <img
                                    src={formData.profilePicture}
                                    alt="Profile"
                                    className="avatar-image"
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {formData.username ? formData.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                            )}
                        </div>
                        <label htmlFor="avatar-upload" className="camera-button" title="Change Photo">
                            <CameraIcon />
                        </label>
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="user-info">
                        <h2 className="user-name">{formData.username || 'User'}</h2>
                        <span className="role-badge">{user.role || 'Member'}</span>

                        <div className="company-info">
                            <BuildingIcon />
                            <span>{formData.company_name || 'No Company'}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT CARD: Details */}
                <div className="glass-card details-card">
                    <div className="section-header">
                        <InfoIcon />
                        <h2>Personal Information</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {message && <div className="message success-message">{message}</div>}
                        {error && <div className="message error-message">{error}</div>}

                        <div className="form-grid">
                            {/* Username */}
                            <div className="form-group">
                                <label>
                                    <UserIcon />
                                    <span>Username</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Enter your username"
                                />
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label>
                                    <MailIcon />
                                    <span>Email Address</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                />
                            </div>

                            {/* Phone */}
                            <div className="form-group">
                                <label>
                                    <PhoneIcon />
                                    <span>Phone Number</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    placeholder="Enter your phone number"
                                />
                            </div>

                            {/* Company */}
                            <div className="form-group">
                                <label>
                                    <BuildingIcon />
                                    <span>Company Name</span>
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    placeholder="Enter company name"
                                />
                            </div>

                            {/* Address */}
                            <div className="form-group full-width">
                                <label>
                                    <MapPinIcon />
                                    <span>Address</span>
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter your full address"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="save-button" disabled={saving}>
                                {saving ? 'Saving...' : (
                                    <>
                                        <SaveIcon /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
