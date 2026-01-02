const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const cache = require('../utils/cache');

// Get all customers for a company with PAGINATION
exports.getCustomers = async (req, res) => {
  try {
    const { company_name } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';

    // Cache key
    const cacheKey = `customers_${company_name}_p${page}_l${limit}_s${search}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    // Build query
    const query = { company_name };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Customer.countDocuments(query)
    ]);

    const response = {
      customers,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    cache.set(cacheKey, response, 120);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const { company_name } = req.user;
    const customer = await Customer.findOne({
      _id: req.params.id,
      company_name
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const { company_name } = req.user;

    // Validate that company_name exists
    if (!company_name) {
      return res.status(400).json({ message: 'Company name not found in user profile' });
    }

    const { name, phoneNumber, email, address, notes } = req.body;

    // Validate required fields
    if (!name || !phoneNumber) {
      return res.status(400).json({ message: 'Name and phone number are required' });
    }

    // Check if customer with same phone number already exists in this company
    const existingCustomer = await Customer.findOne({
      phoneNumber,
      company_name
    });

    if (existingCustomer) {
      return res.status(400).json({
        message: 'Customer with this phone number already exists'
      });
    }

    const customer = new Customer({
      name,
      phoneNumber,
      email,
      address,
      notes,
      company_name
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    // Send more detailed error information for debugging
    if (error.code === 11000) {
      res.status(400).json({
        message: 'Duplicate customer entry - phone number must be unique within this company',
        error: error.message
      });
    } else {
      res.status(500).json({
        message: 'Server error while creating customer',
        error: error.message
      });
    }
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    const { company_name } = req.user;
    const { name, phoneNumber, email, address, notes } = req.body;

    // Check if the customer exists and belongs to this company
    const customer = await Customer.findOne({
      _id: req.params.id,
      company_name
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // If phone number is changing, check for existing customers with new number
    if (phoneNumber !== customer.phoneNumber) {
      const existingCustomer = await Customer.findOne({
        phoneNumber,
        company_name,
        _id: { $ne: req.params.id }
      });

      if (existingCustomer) {
        return res.status(400).json({
          message: 'Another customer with this phone number already exists'
        });
      }
    }

    customer.name = name || customer.name;
    customer.phoneNumber = phoneNumber || customer.phoneNumber;
    customer.email = email !== undefined ? email : customer.email;
    customer.address = address !== undefined ? address : customer.address;
    customer.notes = notes !== undefined ? notes : customer.notes;

    await customer.save();
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { company_name } = req.user;

    // Check if customer exists and belongs to this company
    const customer = await Customer.findOne({
      _id: req.params.id,
      company_name
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer has any associated sales
    const sales = await Sale.findOne({ customerId: req.params.id });
    if (sales) {
      return res.status(400).json({
        message: 'Cannot delete customer with associated sales records'
      });
    }

    await Customer.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get purchase history for a customer
exports.getCustomerPurchaseHistory = async (req, res) => {
  try {
    const { company_name } = req.user;
    const customerId = req.params.id;

    // Verify customer exists and belongs to this company
    const customer = await Customer.findOne({ _id: customerId, company_name });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get sales with populated product details
    const sales = await Sale.find({ customerId, company_name })
      .populate('products.productId', 'productName brandName category price')
      .populate('handledBy', 'name')
      .sort({ saleDate: -1 });

    res.status(200).json(sales);
  } catch (error) {
    console.error('Error getting purchase history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};