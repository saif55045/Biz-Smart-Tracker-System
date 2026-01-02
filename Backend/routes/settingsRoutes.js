/**
 * Settings Routes
 * 
 * API endpoints for company settings (currency, deductions).
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controller/settingsController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All settings routes require authentication
router.use(authMiddleware);

// GET /api/settings - Get company settings
router.get('/', settingsController.getSettings);

// PUT /api/settings - Update company settings (Admin only)
router.put('/', settingsController.updateSettings);

module.exports = router;
