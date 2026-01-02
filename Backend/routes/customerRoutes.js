const express = require('express');
const router = express.Router();
const customerController = require('../controller/customerController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// Customer CRUD routes
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

// Customer purchase history
router.get('/:id/purchases', customerController.getCustomerPurchaseHistory);

module.exports = router;