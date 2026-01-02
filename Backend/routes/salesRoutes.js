const express = require('express');
const router = express.Router();
const saleController = require('../controller/saleController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// Sale CRUD routes
router.get('/', saleController.getSales);
router.get('/:id', saleController.getSaleById);
router.post('/', saleController.createSale);
router.put('/:id/payment', saleController.updateSalePayment);
router.delete('/:id', saleController.deleteSale);

module.exports = router;