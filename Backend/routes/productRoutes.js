const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');
const { authMiddleware } = require('../middleware/authMiddleware');

// CRUD routes
router.post('/newproduct', productController.createProduct);
router.get('/products', productController.getAllProducts);
router.get('/product/:id', productController.getProductById);
router.put('/updateproduct/:id', productController.updateProduct);
router.delete('/deleteproduct/:id', productController.deleteProduct);

// Bulk update route for selling page checkout
router.put('/updatemultiplestocks', authMiddleware, productController.updateMultipleStocks);

module.exports = router;
