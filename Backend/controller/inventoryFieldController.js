const InventoryField = require('../models/InventoryField');
const Notification = require('../models/Notification');

// Add new field
exports.addField = async (req, res) => {
  try {
    // Check for duplicate field name (case insensitive)
    const existingField = await InventoryField.findOne({
      name: { $regex: new RegExp('^' + req.body.name + '$', 'i') }
    });

    if (existingField) {
      return res.status(400).json({ error: 'A field with this name already exists' });
    }

    const field = new InventoryField(req.body);
    const saved = await field.save();

    // Create notification for new field
    const notification = await Notification.create({
      message: `New schema field added: ${field.name} (${field.type})`,
      type: 'edit',
      productName: 'Schema',
      company_name: req.query.company_name // Get from query params
    });

    console.log('Created notification for new field:', notification);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error adding field:', err);
    res.status(400).json({ error: err.message });
  }
};

// Get all fields
exports.getAllFields = async (req, res) => {
  try {
    const fields = await InventoryField.find().collation({ locale: 'en', strength: 2 });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a field
exports.deleteField = async (req, res) => {
  try {
    const field = await InventoryField.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    await InventoryField.findByIdAndDelete(req.params.id);

    // Create notification for deleted field
    const notification = await Notification.create({
      message: `Schema field deleted: ${field.name}`,
      type: 'delete',
      productName: 'Schema',
      company_name: req.query.company_name // Get from query params
    });

    console.log('Created notification for deleted field:', notification);
    res.json({ message: 'Field deleted successfully' });
  } catch (err) {
    console.error('Error deleting field:', err);
    res.status(500).json({ error: err.message });
  }
};
