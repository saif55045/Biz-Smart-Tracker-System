const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

// Connect to the database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
};

// Sample product data
const products = [
  {
    name: 'Product A',
    category: 'Electronics',
    brandName: 'Brand X',
    price: 100,
    stock: 50,
    expiryDate: new Date('2025-12-31'),
    dateOfEntry: new Date('2023-01-01'),
  },
  {
    name: 'Product B',
    category: 'Groceries',
    brandName: 'Brand Y',
    price: 20,
    stock: 200,
    expiryDate: new Date('2024-06-30'),
    dateOfEntry: new Date('2023-01-01'),
  },
  {
    name: 'Product C',
    category: 'Clothing',
    brandName: 'Brand Z',
    price: 50,
    stock: 100,
    expiryDate: null,
    dateOfEntry: new Date('2023-01-01'),
  },
];

// Insert sample data into the database
const seedProducts = async () => {
  try {
    await Product.deleteMany(); // Clear existing products
    console.log('Existing products cleared');

    await Product.insertMany(products);
    console.log('Sample products inserted successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

// Run the seed script
const runSeeder = async () => {
  await connectDB();
  await seedProducts();
};

runSeeder();