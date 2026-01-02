// BizSmartTrack Logo Component
// A stylized "B" with an upward arrow representing growth and smart tracking

export const Logo = ({ size = 40, showText = true, className = "" }) => {
    return (
        <div className={`logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>

                {/* Stylized B shape */}
                <path
                    d="M12 8h20c8 0 14 4 14 12 0 5-3 9-8 11 6 2 10 7 10 13 0 9-7 14-16 14H12V8z"
                    stroke="url(#logoGradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Inner curves of B */}
                <path
                    d="M20 16h10c4 0 7 2 7 6s-3 6-7 6H20V16z"
                    stroke="url(#logoGradient)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M20 34h12c5 0 8 3 8 7s-3 7-8 7H20V34z"
                    stroke="url(#logoGradient)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Upward arrow representing growth */}
                <path
                    d="M38 28L50 12M50 12L56 12M50 12L50 20"
                    stroke="url(#logoGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Small arrow detail */}
                <path
                    d="M44 22L50 14"
                    stroke="url(#logoGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>

            {showText && (
                <span style={{
                    fontSize: size * 0.5,
                    fontWeight: 700,
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    letterSpacing: '-0.02em'
                }}>
                    <span style={{
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>Biz</span>
                    <span style={{ color: '#f8fafc' }}>SmartTrack</span>
                </span>
            )}
        </div>
    );
};

// Icon-only version for favicons, small spaces
export const LogoIcon = ({ size = 32 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="logoIconGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>

        {/* Stylized B shape */}
        <path
            d="M12 8h20c8 0 14 4 14 12 0 5-3 9-8 11 6 2 10 7 10 13 0 9-7 14-16 14H12V8z"
            stroke="url(#logoIconGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        {/* Inner curves of B */}
        <path
            d="M20 16h10c4 0 7 2 7 6s-3 6-7 6H20V16z"
            stroke="url(#logoIconGradient)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M20 34h12c5 0 8 3 8 7s-3 7-8 7H20V34z"
            stroke="url(#logoIconGradient)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        {/* Upward arrow */}
        <path
            d="M38 28L50 12M50 12L56 12M50 12L50 20"
            stroke="url(#logoIconGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M44 22L50 14"
            stroke="url(#logoIconGradient)"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

export default Logo;
