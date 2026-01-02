const express = require('express');
const router = express.Router();
const fieldController = require('../controller/inventoryFieldController');

router.post('/field', fieldController.addField);
router.get('/fields', fieldController.getAllFields);
router.put('/field/:id', fieldController.updateField);
router.delete('/field/:id', fieldController.deleteField);

module.exports = router;
