const Product = require('../models/Product');
const Notification = require('../models/Notification');
const cache = require('../utils/cache');

// CREATE a product
exports.createProduct = async (req, res) => {
  try {
    if (!req.body.company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const product = new Product(req.body);
    const saved = await product.save();

    // Invalidate product cache for this company
    cache.delPattern(`products_${req.body.company_name}*`);

    // Create notification for new product
    await Notification.create({
      message: `New product added: ${product.name}`,
      type: 'edit',
      productName: product.name,
      company_name: product.company_name
    });

    // Check for low stock and create notification if needed
    if (product.stock <= 5) {
      await Notification.create({
        message: `Low stock alert: ${product.name} has only ${product.stock} units remaining`,
        type: 'stock',
        productName: product.name,
        company_name: product.company_name
      });
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ error: err.message });
  }
};

// READ all products with PAGINATION and CACHING
exports.getAllProducts = async (req, res) => {
  try {
    const company_name = req.query.company_name;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default 50, can be overridden
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'dateOfEntry';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Build cache key based on query params
    const cacheKey = `products_${company_name}_p${page}_l${limit}_s${search}_c${category}`;

    // Check cache first (2 minute TTL)
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Build query
    const query = { company_name };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(), // .lean() for faster read-only queries
      Product.countDocuments(query)
    ]);

    const response = {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    // Cache the result for 2 minutes
    cache.set(cacheKey, response, 120);

    res.json(response);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
};

// READ single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { company_name } = req.query;
    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const product = await Product.findOne({ _id: req.params.id, company_name });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE product by ID
exports.updateProduct = async (req, res) => {
  try {
    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const oldProduct = await Product.findOne({ _id: req.params.id, company_name });
    if (!oldProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Updating product, old data:', oldProduct);
    console.log('New data:', req.body);

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, company_name },
      { $set: req.body },
      { new: true }
    );

    // Check for stock changes
    if (oldProduct.stock !== req.body.stock) {
      // Create notification if stock is low
      if (req.body.stock <= 5) {
        await Notification.create({
          message: `Low stock alert: ${updatedProduct.name} has only ${req.body.stock} units remaining`,
          type: 'stock',
          productName: updatedProduct.name,
          company_name: updatedProduct.company_name
        });
        console.log('Created low stock notification');
      }
    }

    // Create notification for product update
    await Notification.create({
      message: `Product updated: ${updatedProduct.name}`,
      type: 'edit',
      productName: updatedProduct.name,
      company_name: updatedProduct.company_name
    });
    console.log('Created product update notification');

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ error: err.message });
  }
};

// DELETE product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const { company_name } = req.query;
    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const product = await Product.findOne({ _id: req.params.id, company_name });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findOneAndDelete({ _id: req.params.id, company_name });

    // Create notification for product deletion
    await Notification.create({
      message: `Product deleted: ${product.name}`,
      type: 'delete',
      productName: product.name,
      company_name: product.company_name
    });
    console.log('Created product deletion notification');

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE multiple stocks at once (for selling page checkout)
exports.updateMultipleStocks = async (req, res) => {
  try {
    const { items } = req.body;
    console.log('Request body:', req.body);
    console.log('User from request:', req.user);

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: 'Invalid request format. Expected an array of items.'
      });
    }

    // Get the company name from the JWT token (from auth middleware)
    const company_name = req.query.company_name || req.body.company_name || req.user?.company_name;
    console.log('Company name determined:', company_name);

    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required. Please provide it in the request.' });
    }

    const results = [];
    const failedUpdates = [];

    // Process each item in the request
    for (const item of items) {
      const { productId, quantity } = item;
      console.log(`Processing product: ${productId}, quantity: ${quantity}`);

      if (!productId || !quantity) {
        failedUpdates.push({
          productId,
          reason: 'Missing productId or quantity'
        });
        continue;
      }

      try {
        // Find the product
        const product = await Product.findOne({ _id: productId, company_name });

        if (!product) {
          console.log(`Product not found: ${productId} for company ${company_name}`);
          failedUpdates.push({
            productId,
            reason: 'Product not found'
          });
          continue;
        }

        console.log(`Found product: ${product.name}, current stock: ${product.stock}`);

        // Check if there's enough stock
        if (product.stock < quantity) {
          failedUpdates.push({
            productId,
            productName: product.name,
            reason: 'Insufficient stock',
            availableStock: product.stock,
            requestedQuantity: quantity
          });
          continue;
        }

        // Update the stock
        const newStock = product.stock - quantity;
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: productId, company_name },
          { $set: { stock: newStock } },
          { new: true }
        );

        console.log(`Updated product stock: ${product.name}, new stock: ${newStock}`);

        // Create a notification for low stock if needed
        if (newStock <= 5) {
          await Notification.create({
            message: `Low stock alert: ${product.name} has only ${newStock} units remaining`,
            type: 'stock',
            productName: product.name,
            company_name
          });
          console.log(`Created low stock notification for ${product.name}`);
        }

        // Add to successful results
        results.push({
          productId,
          productName: product.name,
          oldStock: product.stock,
          newStock,
          quantitySold: quantity
        });

      } catch (error) {
        console.error(`Error updating product ${productId}:`, error);
        failedUpdates.push({
          productId,
          reason: error.message
        });
      }
    }

    // Create a sale summary notification
    if (results.length > 0) {
      const productNames = results.map(r => r.productName).join(', ');
      await Notification.create({
        message: `Sale completed: ${results.length} products sold (${productNames})`,
        type: 'sale',
        productName: 'Multiple',
        company_name
      });
      console.log('Created sale summary notification');
    }

    // Return appropriate response based on results
    if (failedUpdates.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All products updated successfully',
        results
      });
    } else if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update any products',
        failedUpdates
      });
    } else {
      return res.status(207).json({
        success: 'partial',
        message: 'Some products updated successfully, but others failed',
        results,
        failedUpdates
      });
    }

  } catch (err) {
    console.error('Error in updateMultipleStocks:', err);
    res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
