/**
 * Company Settings Model
 * 
 * PURPOSE: Stores company-wide settings including currency and deduction rules.
 * 
 * Each company (identified by company_name) has one settings document.
 */

const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
    company_name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Currency settings
    currency: {
        type: String,
        enum: ['PKR', 'INR', 'USD'],
        default: 'USD'
    },

    currencySymbol: {
        type: String,
        default: '$'
    },

    // Absence deduction settings
    absenceDeduction: {
        type: Number,
        default: 0,
        min: 0
    },

    halfDayDeduction: {
        type: Number,
        default: 0,
        min: 0
    },

    // Late deduction (optional)
    lateDeduction: {
        type: Number,
        default: 0,
        min: 0
    },

    // Other settings can be added here
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
companySettingsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Auto-set currency symbol based on currency
    const symbols = {
        'PKR': 'Rs.',
        'INR': '₹',
        'USD': '$'
    };
    this.currencySymbol = symbols[this.currency] || '$';

    next();
});

// Static method to get or create settings for a company
companySettingsSchema.statics.getOrCreate = async function (company_name) {
    let settings = await this.findOne({ company_name });

    if (!settings) {
        settings = await this.create({ company_name });
    }

    return settings;
};

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
