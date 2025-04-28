const mongoose = require('mongoose');

const inventoryFieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // 'String', 'Number', 'Date'
  required: { type: Boolean, default: false }
});

const InventoryField = mongoose.model('InventoryField', inventoryFieldSchema);

module.exports = InventoryField;
