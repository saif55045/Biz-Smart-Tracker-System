const mongoose = require('mongoose');

const inventoryFieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // 'String', 'Number', 'Date'
  required: { type: Boolean, default: false },
  company_name: { type: String, required: true },
  isDeleted: { type: Boolean, default: false }, // To track if a default field has been deleted
  isDefault: { type: Boolean, default: false } // To identify if it's a default field
});

const InventoryField = mongoose.model('InventoryField', inventoryFieldSchema);

module.exports = InventoryField;
