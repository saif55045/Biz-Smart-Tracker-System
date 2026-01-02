const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply authentication middleware to all report routes
router.get('/profit-loss', authMiddleware, reportController.getProfitLossData);
router.get('/stock-data', authMiddleware, reportController.getStockData);

// Add routes for employee-data and sales-data
router.get('/employee-data', authMiddleware, reportController.getEmployeeData);
router.get('/sales-data', authMiddleware, reportController.getSalesData);

// Add routes for new report types
router.get('/daily-sales-summary', authMiddleware, reportController.getDailySalesSummary);
router.get('/total-sales-summary', authMiddleware, reportController.getTotalSalesSummary);
router.get('/low-stock-alerts', authMiddleware, reportController.getLowStockAlerts);

module.exports = router;