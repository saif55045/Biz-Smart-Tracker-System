const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  company_name: {
    type: String,
    required: true,
    // No uniqueness constraint here, allowing multiple users with the same company_name
  },
  address: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'Employee'],
  },

  // Only For Employees
  attendance: [
    {
      date: { type: Date, required: true },
      present: { type: Boolean, required: true },
    }
  ],

  experience: {
    type: Number, // in years
    default: 0,
  },

  salary: {
    type: Number,
    default: 0,
  },

  profilePicture: {
    type: String, // Base64 string
    default: ''
  }
});

// Add a compound index for unique admin-company_name combination
// This allows multiple employees with the same company_name but only one admin
userSchema.index({ company_name: 1, role: 1 }, {
  unique: true,
  partialFilterExpression: { role: 'Admin' }  // Only apply uniqueness to Admin role
});

const User = mongoose.model('User', userSchema);
module.exports = User;
