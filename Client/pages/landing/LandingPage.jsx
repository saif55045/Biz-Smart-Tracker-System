import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export function LandingPage() {
    const navigate = useNavigate();

    const handleLogin = () => navigate('/login');
    const handleSignup = () => navigate('/signup');

    // SVG Icons
    const RocketIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    );

    const ChartIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
    );

    const PackageIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16.5 9.4-9-5.19" />
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" y1="22" x2="12" y2="12" />
        </svg>
    );

    const UsersIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );

    const CreditCardIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    );

    const TrendingUpIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );

    const FileTextIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );

    const MessageCircleIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    );

    const CheckIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );

    const StarIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );

    const ArrowRightIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    );

    const DollarIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="landing-nav-container">
                    <div className="landing-logo">
                        <span className="logo-biz">Biz</span>SmartTrack
                    </div>
                    <div className="landing-nav-links">
                        <a href="#features">Features</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#testimonials">Testimonials</a>
                    </div>
                    <div className="landing-nav-actions">
                        <button className="btn-ghost" onClick={handleLogin}>Login</button>
                        <button className="btn-primary" onClick={handleSignup}>Get Started</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-glow"></div>
                <div className="hero-content">
                    <div className="hero-badge"><RocketIcon /> The #1 Business Management Platform</div>
                    <h1 className="hero-title">
                        Manage Your Business <br />
                        <span className="gradient-text">Smarter & Faster</span>
                    </h1>
                    <p className="hero-subtitle">
                        All-in-one platform for inventory, employees, sales, and analytics.
                        Streamline operations and boost productivity with powerful insights.
                    </p>
                    <div className="hero-cta">
                        <button className="btn-primary-large" onClick={handleSignup}>
                            Start Free Trial
                            <ArrowRightIcon />
                        </button>
                        <button className="btn-secondary-large" onClick={handleLogin}>
                            Watch Demo
                        </button>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-number">10K+</span>
                            <span className="stat-label">Active Users</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">99.9%</span>
                            <span className="stat-label">Uptime</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">4.9 <StarIcon /></span>
                            <span className="stat-label">Rating</span>
                        </div>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="dashboard-preview">
                        <div className="preview-header">
                            <div className="preview-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <span className="preview-title">Dashboard Overview</span>
                        </div>
                        <div className="preview-content">
                            <div className="preview-card">
                                <span className="card-icon"><DollarIcon /></span>
                                <span className="card-value">$48,590</span>
                                <span className="card-label">Revenue</span>
                            </div>
                            <div className="preview-card">
                                <span className="card-icon"><PackageIcon /></span>
                                <span className="card-value">1,247</span>
                                <span className="card-label">Products</span>
                            </div>
                            <div className="preview-card">
                                <span className="card-icon"><UsersIcon /></span>
                                <span className="card-value">89</span>
                                <span className="card-label">Employees</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section" id="features">
                <div className="section-header">
                    <span className="section-badge">Features</span>
                    <h2 className="section-title">Everything You Need to Succeed</h2>
                    <p className="section-subtitle">Powerful tools designed for modern businesses</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><PackageIcon /></div>
                        <h3>Inventory Management</h3>
                        <p>Track stock levels, manage products, and automate reordering with real-time updates.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><UsersIcon /></div>
                        <h3>Employee Management</h3>
                        <p>Manage attendance, roles, and performance with our comprehensive HR tools.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><CreditCardIcon /></div>
                        <h3>Point of Sale</h3>
                        <p>Fast checkout, multiple payment methods, and seamless customer experience.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><TrendingUpIcon /></div>
                        <h3>Analytics Dashboard</h3>
                        <p>Real-time insights, custom reports, and data-driven decision making.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><FileTextIcon /></div>
                        <h3>Invoice Generator</h3>
                        <p>Create professional invoices, track payments, and manage customer billing.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><MessageCircleIcon /></div>
                        <h3>Team Collaboration</h3>
                        <p>Built-in discussion boards and messaging for seamless team communication.</p>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section" id="pricing">
                <div className="section-header">
                    <span className="section-badge">Pricing</span>
                    <h2 className="section-title">Simple, Transparent Pricing</h2>
                    <p className="section-subtitle">No hidden fees. Cancel anytime.</p>
                </div>
                <div className="pricing-grid">
                    <div className="pricing-card">
                        <div className="pricing-header">
                            <h3>Starter</h3>
                            <div className="pricing-amount">
                                <span className="currency">$</span>
                                <span className="price">29</span>
                                <span className="period">/month</span>
                            </div>
                        </div>
                        <ul className="pricing-features">
                            <li><CheckIcon /> Up to 5 team members</li>
                            <li><CheckIcon /> 1,000 products</li>
                            <li><CheckIcon /> Basic analytics</li>
                            <li><CheckIcon /> Email support</li>
                        </ul>
                        <button className="btn-outline" onClick={handleSignup}>Get Started</button>
                    </div>
                    <div className="pricing-card featured">
                        <div className="popular-badge">Most Popular</div>
                        <div className="pricing-header">
                            <h3>Professional</h3>
                            <div className="pricing-amount">
                                <span className="currency">$</span>
                                <span className="price">79</span>
                                <span className="period">/month</span>
                            </div>
                        </div>
                        <ul className="pricing-features">
                            <li><CheckIcon /> Up to 25 team members</li>
                            <li><CheckIcon /> Unlimited products</li>
                            <li><CheckIcon /> Advanced analytics</li>
                            <li><CheckIcon /> Priority support</li>
                            <li><CheckIcon /> Custom reports</li>
                        </ul>
                        <button className="btn-primary" onClick={handleSignup}>Get Started</button>
                    </div>
                    <div className="pricing-card">
                        <div className="pricing-header">
                            <h3>Enterprise</h3>
                            <div className="pricing-amount">
                                <span className="currency">$</span>
                                <span className="price">199</span>
                                <span className="period">/month</span>
                            </div>
                        </div>
                        <ul className="pricing-features">
                            <li><CheckIcon /> Unlimited team members</li>
                            <li><CheckIcon /> Unlimited everything</li>
                            <li><CheckIcon /> Dedicated account manager</li>
                            <li><CheckIcon /> 24/7 phone support</li>
                            <li><CheckIcon /> Custom integrations</li>
                        </ul>
                        <button className="btn-outline" onClick={handleSignup}>Contact Sales</button>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section" id="testimonials">
                <div className="section-header">
                    <span className="section-badge">Testimonials</span>
                    <h2 className="section-title">Loved by Businesses Worldwide</h2>
                </div>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <p className="testimonial-text">"BizSmartTrack transformed how we manage our retail store. The inventory tracking alone saved us hours every week."</p>
                        <div className="testimonial-author">
                            <div className="author-avatar">JD</div>
                            <div className="author-info">
                                <span className="author-name">John Doe</span>
                                <span className="author-role">CEO, RetailMax</span>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <p className="testimonial-text">"The analytics dashboard gives us insights we never had before. It's like having a business consultant 24/7."</p>
                        <div className="testimonial-author">
                            <div className="author-avatar">SM</div>
                            <div className="author-info">
                                <span className="author-name">Sarah Miller</span>
                                <span className="author-role">Owner, TechShop</span>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <p className="testimonial-text">"Employee management has never been easier. Attendance tracking and payroll integration is seamless."</p>
                        <div className="testimonial-author">
                            <div className="author-avatar">MJ</div>
                            <div className="author-info">
                                <span className="author-name">Mike Johnson</span>
                                <span className="author-role">HR Manager, BigCorp</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Transform Your Business?</h2>
                    <p>Join thousands of businesses already using BizSmartTrack</p>
                    <button className="btn-primary-large" onClick={handleSignup}>
                        Start Your Free Trial
                        <ArrowRightIcon />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="landing-logo">
                            <span className="logo-biz">Biz</span>SmartTrack
                        </div>
                        <p>Empowering businesses with smart management solutions.</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#pricing">Pricing</a>
                            <a href="#">Integrations</a>
                        </div>
                        <div className="footer-column">
                            <h4>Company</h4>
                            <a href="#">About Us</a>
                            <a href="#">Careers</a>
                            <a href="#">Contact</a>
                        </div>
                        <div className="footer-column">
                            <h4>Legal</h4>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 BizSmartTrack. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
