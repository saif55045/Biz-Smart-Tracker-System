const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');

// Get notifications for a company
router.get('/notifications', notificationController.getNotifications);

// Create a new notification
router.post('/', notificationController.createNotification);

// Mark notification as read
router.put('/notifications/:id/read', notificationController.markAsRead);

// Delete notification
router.delete('/notifications/:id', notificationController.deleteNotification);

module.exports = router;