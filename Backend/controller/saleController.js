const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Get all sales for a company
exports.getSales = async (req, res) => {
  try {
    const { company_name } = req.user;
    let { startDate, endDate } = req.query;

    const query = { company_name };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) {
        query.saleDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.saleDate.$lte = new Date(endDate);
      }
    }

    const sales = await Sale.find(query)
      .populate('customerId', 'name phoneNumber')
      .populate('handledBy', 'name')
      .sort({ saleDate: -1 });

    res.status(200).json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const { company_name } = req.user;

    const sale = await Sale.findOne({
      _id: req.params.id,
      company_name
    })
      .populate('customerId', 'name phoneNumber email')
      .populate('handledBy', 'name')
      .populate('products.productId', 'name brandName category');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.status(200).json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new sale
exports.createSale = async (req, res) => {
  try {
    const { company_name } = req.user;
    const { customerId, products, paidAmount, saleDate } = req.body;

    // Verify customer exists and belongs to this company
    const customer = await Customer.findOne({ _id: customerId, company_name });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate products and calculate total
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Products list cannot be empty' });
    }

    let totalAmount = 0;
    const productsWithDetails = [];

    // Process each product
    for (const item of products) {
      const { productId, quantity } = item;

      // Verify product exists and belongs to this company
      const product = await Product.findOne({ _id: productId, company_name });
      if (!product) {
        return res.status(404).json({
          message: `Product with ID ${productId} not found`
        });
      }

      // Check stock availability
      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.productName}. Available: ${product.stock}`
        });
      }

      // Calculate subtotal for this item
      const itemPrice = product.price;
      const subtotal = itemPrice * quantity;

      // Add to total
      totalAmount += subtotal;

      // Add product details
      productsWithDetails.push({
        productId,
        quantity,
        price: itemPrice,
        subtotal
      });

      // Update stock
      product.stock -= quantity;
      await product.save();
    }

    // Validate payment amount
    if (paidAmount < 0 || paidAmount > totalAmount) {
      return res.status(400).json({
        message: 'Paid amount must be between 0 and total amount'
      });
    }

    // Calculate remaining amount
    const remainingAmount = totalAmount - paidAmount;

    // Create the sale record
    const sale = new Sale({
      customerId,
      products: productsWithDetails,
      totalAmount,
      paidAmount,
      remainingAmount,
      saleDate: saleDate || Date.now(),
      company_name,
      handledBy: req.user.id
    });

    await sale.save();
    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a sale payment
exports.updateSalePayment = async (req, res) => {
  try {
    const { company_name, id: userId } = req.user;
    const { amount, note } = req.body;

    // Find the sale
    const sale = await Sale.findOne({
      _id: req.params.id,
      company_name
    });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Validate payment amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    // Check if payment exceeds remaining balance
    if (amount > sale.remainingAmount) {
      return res.status(400).json({
        message: 'Payment amount cannot exceed the remaining balance'
      });
    }

    // Update payment details
    const newPaidAmount = sale.paidAmount + parseFloat(amount);
    const newRemainingAmount = sale.totalAmount - newPaidAmount;

    // Add to payment history
    sale.paymentHistory.push({
      date: new Date(),
      amount: parseFloat(amount),
      note: note || '',
      recordedBy: userId
    });

    // Update payment totals
    sale.paidAmount = newPaidAmount;
    sale.remainingAmount = newRemainingAmount;

    // Update payment status
    if (newPaidAmount >= sale.totalAmount) {
      sale.paymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      sale.paymentStatus = 'partial';
    } else {
      sale.paymentStatus = 'unpaid';
    }

    await sale.save();

    // Populate relevant fields for response - using proper approach for Mongoose
    const populatedSale = await Sale.findById(sale._id)
      .populate('customerId', 'name phoneNumber email')
      .populate('handledBy', 'name')
      .populate('products.productId', 'name brandName category')
      .populate('paymentHistory.recordedBy', 'name');

    res.status(200).json(populatedSale);
  } catch (error) {
    console.error('Error updating sale payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a sale (typically only for voiding recent transactions)
exports.deleteSale = async (req, res) => {
  try {
    const { company_name } = req.user;

    // Find the sale
    const sale = await Sale.findOne({
      _id: req.params.id,
      company_name
    });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Only allow deletion of recent sales (e.g., within 24 hours)
    const saleTime = new Date(sale.saleDate).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceSale = (currentTime - saleTime) / (1000 * 60 * 60);

    if (hoursSinceSale > 24 && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Sales older than 24 hours can only be deleted by an admin'
      });
    }

    // Restore product stock
    for (const item of sale.products) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Delete the sale
    await Sale.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Sale deleted and inventory restored' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Server error' });
  }
};