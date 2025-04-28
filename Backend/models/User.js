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
    unique: true,
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
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
