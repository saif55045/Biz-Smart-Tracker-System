const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');

// CRUD routes
router.post('/newproduct', productController.createProduct);
router.get('/products', productController.getAllProducts);
router.get('/product/:id', productController.getProductById);
router.put('/updateproduct/:id', productController.updateProduct);
router.delete('/deleteproduct/:id', productController.deleteProduct);

module.exports = router;
