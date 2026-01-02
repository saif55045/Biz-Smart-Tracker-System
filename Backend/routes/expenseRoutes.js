const express = require('express');
const router = express.Router();
const expenseController = require('../controller/expenseController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Base path: /api/expenses

router.post('/add', authMiddleware, expenseController.addExpense);
router.get('/all', authMiddleware, expenseController.getExpenses);
router.post('/pay-salary', authMiddleware, expenseController.paySalary);
router.get('/stats', authMiddleware, expenseController.getExpenseStats);

module.exports = router;
