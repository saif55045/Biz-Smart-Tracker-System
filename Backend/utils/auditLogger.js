/**
 * Audit Logger Utility
 * 
 * PURPOSE: Provides a simple interface to log security events
 * 
 * USAGE:
 *   const { auditLog } = require('./utils/auditLogger');
 *   await auditLog.loginSuccess(req, user);
 *   await auditLog.loginFailed(req, email, reason);
 */

const AuditLog = require('../models/AuditLog');

// Extract client IP from request (handles proxies)
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.ip ||
        'unknown';
};

// Extract user agent
const getUserAgent = (req) => {
    return req.headers['user-agent'] || 'unknown';
};

/**
 * Core logging function
 */
const log = async (action, severity, req, details = {}) => {
    try {
        const logEntry = new AuditLog({
            action,
            severity,
            userId: req.user?.id || details.userId,
            userEmail: req.user?.email || details.email,
            company_name: req.user?.company_name || details.company_name,
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req),
            requestPath: req.originalUrl || req.path,
            details
        });

        await logEntry.save();

        // Also log to console for development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[AUDIT] ${severity}: ${action}`, {
                user: req.user?.email || details.email,
                ip: getClientIP(req)
            });
        }
    } catch (error) {
        // Don't let audit logging failures break the app
        console.error('Audit log error:', error.message);
    }
};

/**
 * Audit Logger API
 */
const auditLog = {
    // Authentication events
    loginSuccess: (req, user) => log('LOGIN_SUCCESS', 'INFO', req, {
        userId: user._id,
        email: user.email,
        company_name: user.company_name
    }),

    loginFailed: (req, email, reason) => log('LOGIN_FAILED', 'WARNING', req, {
        email,
        reason
    }),

    logout: (req) => log('LOGOUT', 'INFO', req),

    signup: (req, user) => log('SIGNUP', 'INFO', req, {
        userId: user._id,
        email: user.email,
        company_name: user.company_name
    }),

    // Password events
    passwordResetRequest: (req, email) => log('PASSWORD_RESET_REQUEST', 'INFO', req, { email }),

    passwordResetComplete: (req, email) => log('PASSWORD_RESET_COMPLETE', 'INFO', req, { email }),

    passwordChange: (req) => log('PASSWORD_CHANGE', 'INFO', req),

    // Security violations
    csrfViolation: (req) => log('CSRF_VIOLATION', 'ERROR', req, {
        expectedToken: req.headers['x-csrf-token'] ? 'present' : 'missing'
    }),

    rateLimitExceeded: (req) => log('RATE_LIMIT_EXCEEDED', 'WARNING', req),

    unauthorizedAccess: (req, resource) => log('UNAUTHORIZED_ACCESS', 'ERROR', req, {
        attemptedResource: resource
    }),

    // Account events
    accountLocked: (req, email, reason) => log('ACCOUNT_LOCKED', 'CRITICAL', req, {
        email,
        reason
    }),

    roleChange: (req, targetUser, oldRole, newRole) => log('ROLE_CHANGE', 'WARNING', req, {
        targetUserId: targetUser._id,
        targetEmail: targetUser.email,
        oldRole,
        newRole
    }),

    // Data events
    dataExport: (req, dataType) => log('DATA_EXPORT', 'INFO', req, { dataType }),

    dataDelete: (req, dataType, recordId) => log('DATA_DELETE', 'WARNING', req, {
        dataType,
        recordId
    }),

    // Generic logging
    custom: (action, severity, req, details) => log(action, severity, req, details)
};

module.exports = { auditLog, getClientIP };
