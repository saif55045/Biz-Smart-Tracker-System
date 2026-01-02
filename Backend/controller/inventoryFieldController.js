const InventoryField = require('../models/InventoryField');
const Notification = require('../models/Notification');

// Add new field
exports.addField = async (req, res) => {
  try {
    const { company_name } = req.query;
    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Check for duplicate field name (case insensitive) within the same company
    const existingField = await InventoryField.findOne({
      name: { $regex: new RegExp('^' + req.body.name + '$', 'i') },
      company_name,
      isDeleted: false
    });

    if (existingField) {
      return res.status(400).json({ error: 'A field with this name already exists in your company' });
    }

    const field = new InventoryField({
      ...req.body,
      company_name
    });
    const saved = await field.save();

    // Create notification for new field
    const notification = await Notification.create({
      message: `New schema field added: ${field.name} (${field.type})`,
      type: 'edit',
      productName: 'Schema',
      company_name
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
    const { company_name } = req.query;
    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const fields = await InventoryField.find({ company_name })
      .collation({ locale: 'en', strength: 2 });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update field (for marking as deleted)
exports.updateField = async (req, res) => {
  try {
    const { company_name } = req.query;
    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const field = await InventoryField.findOneAndUpdate(
      { _id: req.params.id, company_name },
      { $set: req.body },
      { new: true }
    );

    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    // Create notification for field update
    await Notification.create({
      message: `Schema field ${req.body.isDeleted ? 'deleted' : 'updated'}: ${field.name}`,
      type: req.body.isDeleted ? 'delete' : 'edit',
      productName: 'Schema',
      company_name
    });

    res.json(field);
  } catch (err) {
    console.error('Error updating field:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete field (hard delete - not used anymore, keeping for reference)
exports.deleteField = async (req, res) => {
  try {
    const { company_name } = req.query;
    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const field = await InventoryField.findOne({ 
      _id: req.params.id,
      company_name 
    });
    
    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    await InventoryField.findOneAndUpdate(
      { _id: req.params.id, company_name },
      { $set: { isDeleted: true } }
    );

    // Create notification for deleted field
    const notification = await Notification.create({
      message: `Schema field deleted: ${field.name}`,
      type: 'delete',
      productName: 'Schema',
      company_name
    });

    console.log('Created notification for deleted field:', notification);
    res.json({ message: 'Field deleted successfully' });
  } catch (err) {
    console.error('Error deleting field:', err);
    res.status(500).json({ error: err.message });
  }
};
