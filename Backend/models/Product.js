const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String },
  category: { type: String },
  brandName: { type: String },
  price: { type: Number, min: 0 },
  stock: { type: Number, min: 0 },
  expiryDate: { type: Date },
  dateOfEntry: { type: Date, default: Date.now },
  company_name: { type: String, required: true }
}, { strict: false }); // <--- important!

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================
// Indexes speed up queries by creating a searchable data structure
// Without indexes: MongoDB scans ALL documents (slow at scale)
// With indexes: MongoDB uses B-tree lookup (fast even with millions of records)

// Index for filtering products by company (most common query)
productSchema.index({ company_name: 1 });

// Compound index for filtering by company + category (reports/filters)
productSchema.index({ company_name: 1, category: 1 });

// Index for low-stock alerts (stock queries)
productSchema.index({ company_name: 1, stock: 1 });

// Index for expiry date queries (expiring products alerts)
productSchema.index({ company_name: 1, expiryDate: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

