const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const attendanceController = require('../controller/attendanceController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// Get current logged-in user
router.get('/current-user', authMiddleware, userController.getCurrentUser);

// CRUD routes for users
router.post('/newuser', authMiddleware, admin, userController.createUser);
router.get('/user', authMiddleware, userController.getAllUsers);
router.put('/userupdate/:id', authMiddleware, admin, userController.updateUser);
router.delete('/userdelete/:id', authMiddleware, admin, userController.deleteUser);

// Basic attendance routes
router.post('/mark-attendance', authMiddleware, attendanceController.markAttendance);
router.get('/attendance', authMiddleware, attendanceController.viewAttendance);
router.get('/my-attendance', authMiddleware, attendanceController.viewMyAttendance);
router.get('/my-attendance-report', authMiddleware, attendanceController.getMyAttendanceReport);

// Enhanced attendance reporting routes
router.get('/employees', authMiddleware, attendanceController.getAllEmployees);
router.get('/attendance-report', authMiddleware, attendanceController.getAttendanceReport);
router.get('/monthly-attendance', authMiddleware, admin, attendanceController.getMonthlyAttendanceSummary);
router.get('/export-attendance', authMiddleware, attendanceController.exportAttendance);

module.exports = router;