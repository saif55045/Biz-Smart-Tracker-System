/**
 * CSRF Protection Middleware
 * 
 * PURPOSE: Prevents Cross-Site Request Forgery attacks by requiring
 * a server-generated token with each state-changing request.
 * 
 * HOW IT WORKS:
 * 1. Server generates a random token on login
 * 2. Token is sent to client in response
 * 3. Client includes token in X-CSRF-Token header
 * 4. Server validates token on POST/PUT/DELETE requests
 * 
 * WHY JWT ISN'T ENOUGH:
 * - JWT in localStorage is accessible to JavaScript
 * - If an XSS vulnerability exists, attacker can read JWT
 * - CSRF token adds an extra layer of protection
 */

const crypto = require('crypto');
const { auditLog } = require('../utils/auditLogger');

// In-memory token store (use Redis in production for multi-server)
const tokenStore = new Map();

// Token expiration time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Generate a new CSRF token for a user session
 */
const generateToken = (userId) => {
    const token = crypto.randomBytes(32).toString('hex');
    tokenStore.set(token, {
        userId,
        createdAt: Date.now()
    });
    return token;
};

/**
 * Validate a CSRF token
 */
const validateToken = (token, userId) => {
    const stored = tokenStore.get(token);

    if (!stored) return false;

    // Check if token belongs to this user
    if (stored.userId !== userId) return false;

    // Check if token is expired
    if (Date.now() - stored.createdAt > TOKEN_EXPIRY) {
        tokenStore.delete(token);
        return false;
    }

    return true;
};

/**
 * Invalidate a token (on logout)
 */
const invalidateToken = (token) => {
    tokenStore.delete(token);
};

/**
 * Clean up expired tokens periodically
 */
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenStore.entries()) {
        if (now - data.createdAt > TOKEN_EXPIRY) {
            tokenStore.delete(token);
        }
    }
}, 15 * 60 * 1000); // Run every 15 minutes

/**
 * CSRF Protection Middleware
 * Use this on routes that modify data (POST, PUT, DELETE)
 */
const csrfProtection = async (req, res, next) => {
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip for authentication routes (token doesn't exist yet)
    const skipRoutes = ['/api/auth/signin', '/api/auth/signup', '/api/auth/verify-otp', '/api/auth/reset-password'];
    if (skipRoutes.some(route => req.originalUrl.includes(route))) {
        return next();
    }

    const token = req.headers['x-csrf-token'];
    const userId = req.user?.id;

    // If user is authenticated, validate CSRF token
    if (userId) {
        if (!token) {
            await auditLog.csrfViolation(req);
            return res.status(403).json({
                error: 'CSRF token missing',
                message: 'Security token required for this request'
            });
        }

        if (!validateToken(token, userId)) {
            await auditLog.csrfViolation(req);
            return res.status(403).json({
                error: 'Invalid CSRF token',
                message: 'Security token is invalid or expired'
            });
        }
    }

    next();
};

/**
 * Middleware to generate and attach CSRF token to response
 * Call this after successful authentication
 */
const attachCsrfToken = (req, res, next) => {
    if (req.user?.id) {
        const token = generateToken(req.user.id);
        res.setHeader('X-CSRF-Token', token);
    }
    next();
};

module.exports = {
    csrfProtection,
    attachCsrfToken,
    generateToken,
    validateToken,
    invalidateToken
};
