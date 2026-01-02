const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'unpaid'],
    default: 'unpaid'
  },
  paymentHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true
    },
    note: {
      type: String
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  saleDate: {
    type: Date,
    default: Date.now
  },
  company_name: {
    type: String,
    required: true
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Virtual to calculate subtotals
SaleSchema.pre('save', function (next) {
  // Set payment status based on paid amount
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
    this.remainingAmount = 0;
    this.paidAmount = this.totalAmount; // Ensure no overpayment
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partial';
    this.remainingAmount = this.totalAmount - this.paidAmount;
  } else {
    this.paymentStatus = 'unpaid';
    this.remainingAmount = this.totalAmount;
  }
  next();
});

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================

// Index for filtering sales by company (most common query)
SaleSchema.index({ company_name: 1 });

// Compound index for company + date range queries (reports, dashboard)
SaleSchema.index({ company_name: 1, saleDate: -1 });

// Index for payment status queries (finding unpaid sales)
SaleSchema.index({ company_name: 1, paymentStatus: 1 });

// Index for customer lookup
SaleSchema.index({ customerId: 1 });

module.exports = mongoose.model('Sale', SaleSchema);