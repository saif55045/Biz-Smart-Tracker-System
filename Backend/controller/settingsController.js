/**
 * Settings Controller
 * 
 * Handles company settings for currency and deductions.
 */

const CompanySettings = require('../models/CompanySettings');

// Get settings for a company
exports.getSettings = async (req, res) => {
    try {
        const { company_name } = req.user;

        if (!company_name) {
            return res.status(400).json({ error: 'Company name required' });
        }

        const settings = await CompanySettings.getOrCreate(company_name);
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update settings for a company
exports.updateSettings = async (req, res) => {
    try {
        const { company_name } = req.user;
        const { currency, absenceDeduction, halfDayDeduction, lateDeduction } = req.body;

        if (!company_name) {
            return res.status(400).json({ error: 'Company name required' });
        }

        // Currency symbol mapping
        const symbols = {
            'PKR': 'Rs.',
            'INR': '₹',
            'USD': '$'
        };

        const updateData = {};

        if (currency && ['PKR', 'INR', 'USD'].includes(currency)) {
            updateData.currency = currency;
            updateData.currencySymbol = symbols[currency];
        }

        if (absenceDeduction !== undefined) {
            updateData.absenceDeduction = Math.max(0, Number(absenceDeduction));
        }

        if (halfDayDeduction !== undefined) {
            updateData.halfDayDeduction = Math.max(0, Number(halfDayDeduction));
        }

        if (lateDeduction !== undefined) {
            updateData.lateDeduction = Math.max(0, Number(lateDeduction));
        }

        updateData.updatedAt = Date.now();

        const settings = await CompanySettings.findOneAndUpdate(
            { company_name },
            { $set: updateData },
            { new: true, upsert: true }
        );

        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
