const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave'],
    required: true
  },
  company_name: {
    type: String,
    required: true
  },
  workHours: {
    type: Number,
    default: 8
  },
  notes: {
    type: String
  },
  checkinTime: {
    type: Date
  },
  checkoutTime: {
    type: Date
  }
}, { timestamps: true });

// Compound index to ensure uniqueness of attendance records
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Export model with explicit collection name 'attendances'
module.exports = mongoose.model('Attendance', AttendanceSchema, 'attendances');