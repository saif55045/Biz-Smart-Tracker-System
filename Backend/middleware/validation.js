/**
 * Input Validation Middleware
 * 
 * PURPOSE: Validates and sanitizes all incoming request data
 * before it reaches your controllers.
 * 
 * WHY IT MATTERS:
 * - Prevents malformed data from crashing your server
 * - Enforces password strength policies
 * - Catches invalid input early (better error messages)
 * - Reduces attack surface for injection attacks
 */

const Joi = require('joi');

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Signup Schema
 * - username: 3-30 chars, alphanumeric with underscores
 * - email: valid email format
 * - password: min 8 chars, must have uppercase, lowercase, number
 * - company_name: 2-50 chars
 * - phone_number: 10-15 digits only
 * - role: must be 'Admin' or 'Employee'
 */
const signupSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .pattern(/^[a-zA-Z0-9_ ]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Username can only contain letters, numbers, underscores, and spaces'
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address'
        }),
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        }),
    company_name: Joi.string()
        .min(2)
        .max(50)
        .required(),
    address: Joi.string()
        .min(0)
        .max(200)
        .allow('')
        .optional(),
    phone_number: Joi.string()
        .max(20)
        .allow('')
        .optional()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),
    role: Joi.string()
        .valid('Admin', 'Employee')
        .required()
});

/**
 * Login Schema
 */
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    company_name: Joi.string().required()
});

/**
 * Reset Password Schema
 */
const resetPasswordSchema = Joi.object({
    resetToken: Joi.string().required(),
    newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
            'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
        })
});

/**
 * Product Schema
 */
const productSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    category: Joi.string().max(50).allow(''),
    brandName: Joi.string().max(50).allow(''),
    price: Joi.number().min(0).required(),
    stock: Joi.number().integer().min(0).required(),
    expiryDate: Joi.date().allow(null),
    dateOfEntry: Joi.date().default(Date.now)
}).unknown(true); // Allow additional dynamic fields

/**
 * Customer Schema
 */
const customerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().allow(''),
    phoneNumber: Joi.string().pattern(/^\d{10,15}$/).required(),
    address: Joi.string().max(300).allow('')
});

/**
 * Sale Schema
 */
const saleSchema = Joi.object({
    customerId: Joi.string().required(),
    products: Joi.array().items(
        Joi.object({
            productId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required()
        })
    ).min(1).required(),
    paidAmount: Joi.number().min(0).required(),
    saleDate: Joi.date().default(Date.now)
});

/**
 * Expense Schema
 */
const expenseSchema = Joi.object({
    description: Joi.string().min(3).max(200).required(),
    amount: Joi.number().min(0).required(),
    category: Joi.string().required(),
    date: Joi.date().default(Date.now)
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

/**
 * Creates a validation middleware for any schema
 * @param {Joi.Schema} schema - The Joi schema to validate against
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors, not just the first
            stripUnknown: false // Don't remove unknown fields
        });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({
                error: 'Validation Error',
                messages: errorMessages
            });
        }

        // Replace body with validated/sanitized values
        req.body = value;
        next();
    };
};

module.exports = {
    // Schemas (for reference)
    signupSchema,
    loginSchema,
    resetPasswordSchema,
    productSchema,
    customerSchema,
    saleSchema,
    expenseSchema,

    // Middleware factory
    validate
};
