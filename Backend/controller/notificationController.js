const Notification = require('../models/Notification');
const Product = require('../models/Product');

// Create notification
exports.createNotification = async (req, res) => {
  try {
    console.log('Creating notification:', req.body);
    const notification = new Notification(req.body);
    await notification.save();
    console.log('Notification created successfully:', notification);
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get notifications for a company
exports.getNotifications = async (req, res) => {
  try {
    const { company_name } = req.query;
    console.log('Fetching notifications for company:', company_name);
    const notifications = await Notification.find({ company_name })
      .sort({ createdAt: -1 })
      .limit(50);
    console.log('Found notifications:', notifications.length);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
};

// Check for low stock and expired products
exports.checkProductStatus = async () => {
  try {
    console.log('Checking product status...');
    const products = await Product.find();
    const today = new Date();
    let notificationsCreated = 0;
    
    for (const product of products) {
      // Check low stock
      if (product.stock <= 5) {
        console.log(`Low stock detected for ${product.name}: ${product.stock} units`);
        await Notification.create({
          message: `Low stock alert: ${product.name} has only ${product.stock} units remaining`,
          type: 'stock',
          productName: product.name,
          company_name: product.company_name
        });
        notificationsCreated++;
      }

      // Check expiry
      if (product.expiryDate && new Date(product.expiryDate) <= today) {
        console.log(`Expired product detected: ${product.name}`);
        await Notification.create({
          message: `Product expired: ${product.name} has expired on ${new Date(product.expiryDate).toLocaleDateString()}`,
          type: 'expiry',
          productName: product.name,
          company_name: product.company_name
        });
        notificationsCreated++;
      }
    }
    console.log(`Product status check complete. Created ${notificationsCreated} notifications.`);
  } catch (error) {
    console.error('Error checking product status:', error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
};