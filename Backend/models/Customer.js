const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  company_name: {
    type: String,
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Compound index for unique customers within a company
CustomerSchema.index({ phoneNumber: 1, company_name: 1 }, { unique: true });

module.exports = mongoose.model('Customer', CustomerSchema);