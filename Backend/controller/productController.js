const Product = require('../models/Product');
const Notification = require('../models/Notification');

// CREATE a product
exports.createProduct = async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    const product = new Product(req.body);
    const saved = await product.save();
    
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
      console.log('Created low stock notification');
    }

    console.log('Product created successfully with notification');
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ error: err.message });
  }
};

// READ all products
exports.getAllProducts = async (req, res) => {
  try {
    // Get company_name from query params or token
    const company_name = req.query.company_name;
    console.log('Fetching products for company:', company_name);
    
    const query = company_name ? { company_name } : {};
    const products = await Product.find(query);
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
};

// READ single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
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
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Updating product, old data:', oldProduct);
    console.log('New data:', req.body);

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
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
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

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
