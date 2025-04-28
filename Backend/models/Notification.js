const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['delete', 'edit', 'stock', 'expiry'],
    required: true
  },
  productName: String,
  company_name: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Delete after 7 days
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;