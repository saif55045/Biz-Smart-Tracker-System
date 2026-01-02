/**
 * Audit Log Model
 * 
 * PURPOSE: Stores security-relevant events for monitoring and forensics.
 * 
 * WHY IT MATTERS:
 * - Track unauthorized access attempts
 * - Compliance requirements (GDPR, SOC2)
 * - Debugging security incidents
 * - User activity monitoring
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    // Event type
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'LOGOUT',
            'PASSWORD_CHANGE',
            'PASSWORD_RESET_REQUEST',
            'PASSWORD_RESET_COMPLETE',
            'SIGNUP',
            'ACCOUNT_LOCKED',
            'CSRF_VIOLATION',
            'RATE_LIMIT_EXCEEDED',
            'UNAUTHORIZED_ACCESS',
            'ROLE_CHANGE',
            'DATA_EXPORT',
            'DATA_DELETE',
            'SETTINGS_CHANGE'
        ],
        index: true
    },

    // Severity level
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        default: 'INFO'
    },

    // User who performed the action (if known)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },

    userEmail: {
        type: String
    },

    // Company context
    company_name: {
        type: String,
        index: true
    },

    // Request details
    ipAddress: {
        type: String
    },

    userAgent: {
        type: String
    },

    // Additional context
    details: {
        type: mongoose.Schema.Types.Mixed
    },

    // Request path that triggered the event
    requestPath: {
        type: String
    },

    // Timestamp (indexed via TTL index below)
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient queries
auditLogSchema.index({ company_name: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index - automatically delete logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
