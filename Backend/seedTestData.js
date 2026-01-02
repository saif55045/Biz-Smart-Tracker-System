/**
 * Database Seeder Script - Test Data Initialization
 * Creates comprehensive test data for a company to test the full web app
 * 
 * Usage: node seedTestData.js
 * 
 * This will create:
 * - 1 Admin user
 * - 5 Employees
 * - 50 Products across multiple categories
 * - 30 Customers
 * - 200+ Sales transactions (past 6 months)
 * - Attendance records for all employees (past 3 months)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Sale = require('./models/Sale');
const Attendance = require('./models/Attendance');

// Configuration
const COMPANY_NAME = 'TestCompany';
const ADMIN_EMAIL = 'admin@testcompany.com';
const ADMIN_PASSWORD = 'admin123';

// Connect to MongoDB
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/bizsmarttrack';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// Helper functions
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Product data by category
const productData = {
    Electronics: [
        { name: 'Premium SaaS Subscription', price: 154.99 },
        { name: 'Enterprise Analytics Package', price: 499.00 },
        { name: 'Advanced Reporting Add-on', price: 129.00 },
        { name: 'Standard Cloud Plan', price: 99.00 },
        { name: 'Custom Data Export Tool', price: 79.99 },
        { name: 'Wireless Bluetooth Headphones', price: 89.99 },
        { name: 'Smart Watch Pro', price: 299.99 },
        { name: 'Portable Power Bank 20000mAh', price: 49.99 },
        { name: 'USB-C Hub 7-in-1', price: 34.99 },
        { name: 'Mechanical Gaming Keyboard', price: 129.99 },
        { name: '4K Webcam', price: 79.99 },
        { name: 'Wireless Mouse', price: 29.99 },
        { name: 'LED Monitor 27"', price: 349.99 },
        { name: 'External SSD 1TB', price: 119.99 },
        { name: 'Noise Cancelling Earbuds', price: 199.99 },
    ],
    Clothing: [
        { name: 'Premium Cotton T-Shirt', price: 29.99 },
        { name: 'Classic Denim Jeans', price: 59.99 },
        { name: 'Business Casual Blazer', price: 149.99 },
        { name: 'Athletic Running Shoes', price: 89.99 },
        { name: 'Winter Jacket', price: 199.99 },
        { name: 'Formal Dress Shirt', price: 49.99 },
        { name: 'Casual Sneakers', price: 69.99 },
        { name: 'Wool Sweater', price: 79.99 },
        { name: 'Leather Belt', price: 39.99 },
        { name: 'Summer Dress', price: 64.99 },
    ],
    'Food & Beverages': [
        { name: 'Organic Coffee Beans 1kg', price: 24.99 },
        { name: 'Premium Green Tea Box', price: 18.99 },
        { name: 'Artisan Chocolate Bar', price: 8.99 },
        { name: 'Gourmet Olive Oil 500ml', price: 29.99 },
        { name: 'Protein Shake Mix', price: 45.99 },
        { name: 'Natural Honey Jar', price: 15.99 },
        { name: 'Mixed Nuts Premium', price: 22.99 },
        { name: 'Sparkling Water Pack', price: 12.99 },
        { name: 'Energy Drink 12-Pack', price: 19.99 },
        { name: 'Organic Snack Bars Box', price: 16.99 },
    ],
    'Home & Garden': [
        { name: 'Smart LED Bulb Set', price: 34.99 },
        { name: 'Indoor Plant Pot', price: 24.99 },
        { name: 'Scented Candle Collection', price: 29.99 },
        { name: 'Throw Pillow Set', price: 44.99 },
        { name: 'Wall Art Canvas', price: 59.99 },
        { name: 'Garden Tools Kit', price: 49.99 },
        { name: 'Kitchen Organizer Set', price: 39.99 },
        { name: 'Bedsheet Set Queen', price: 79.99 },
        { name: 'Bath Towel Set', price: 34.99 },
        { name: 'Area Rug 5x7', price: 149.99 },
    ],
    'Office Supplies': [
        { name: 'Notebook Pack 5pcs', price: 14.99 },
        { name: 'Pen Set Premium', price: 19.99 },
        { name: 'Desk Organizer', price: 29.99 },
        { name: 'Paper Clips Box', price: 4.99 },
        { name: 'Stapler Heavy Duty', price: 12.99 },
    ]
};

// Customer names
const customerNames = [
    'John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Wilson',
    'Sarah Brown', 'David Lee', 'Jennifer Martinez', 'Christopher Garcia', 'Amanda Rodriguez',
    'Daniel Anderson', 'Jessica Taylor', 'Matthew Thomas', 'Ashley Hernandez', 'Andrew Moore',
    'Stephanie Jackson', 'Joshua Martin', 'Nicole White', 'Ryan Lopez', 'Elizabeth Harris',
    'Brandon Clark', 'Megan Lewis', 'Justin Robinson', 'Samantha Walker', 'Kevin Hall',
    'Rachel Allen', 'Tyler Young', 'Lauren King', 'Jason Wright', 'Brittany Scott'
];

// Employee names
const employeeNames = [
    { name: 'Alice Johnson', experience: 3, salary: 55000 },
    { name: 'Bob Smith', experience: 5, salary: 65000 },
    { name: 'Carol Williams', experience: 2, salary: 48000 },
    { name: 'David Brown', experience: 4, salary: 62000 },
    { name: 'Eva Martinez', experience: 1, salary: 45000 }
];

// Main seeder function
const seedDatabase = async () => {
    try {
        console.log('\n🌱 Starting database seeding...\n');

        // Clear existing data for this company
        console.log('🗑️  Clearing existing data for', COMPANY_NAME, '...');
        await User.deleteMany({ company_name: COMPANY_NAME });
        await Product.deleteMany({ company_name: COMPANY_NAME });
        await Customer.deleteMany({ company_name: COMPANY_NAME });
        await Sale.deleteMany({ company_name: COMPANY_NAME });
        await Attendance.deleteMany({ company_name: COMPANY_NAME });
        console.log('✅ Existing data cleared\n');

        // Create Admin User
        console.log('👤 Creating Admin user...');
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        const admin = await User.create({
            username: 'TestAdmin',
            email: ADMIN_EMAIL,
            password: hashedPassword,
            company_name: COMPANY_NAME,
            role: 'Admin',
            address: '123 Business Street, Tech City, TC 12345',
            phone_number: '555-0100',
            experience: 10,
            salary: 100000
        });
        console.log(`✅ Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}\n`);

        // Create Employees
        console.log('👥 Creating Employees...');
        const employees = [];
        for (let i = 0; i < employeeNames.length; i++) {
            const emp = employeeNames[i];
            const employee = await User.create({
                username: emp.name.replace(' ', ''),
                email: `${emp.name.toLowerCase().replace(' ', '.')}@testcompany.com`,
                password: hashedPassword,
                company_name: COMPANY_NAME,
                role: 'Employee',
                address: `${100 + i} Worker Lane, Tech City, TC 12345`,
                phone_number: `555-01${String(i + 1).padStart(2, '0')}`,
                experience: emp.experience,
                salary: emp.salary
            });
            employees.push(employee);
            console.log(`   ✅ Employee: ${emp.name}`);
        }
        console.log(`✅ ${employees.length} Employees created\n`);

        // Create Products
        console.log('📦 Creating Products...');
        const products = [];
        for (const [category, items] of Object.entries(productData)) {
            for (const item of items) {
                const product = await Product.create({
                    name: item.name,
                    category: category,
                    brandName: pickRandom(['TechPro', 'ValueBrand', 'PremiumCo', 'EcoChoice', 'SmartLife']),
                    price: item.price,
                    stock: randomInt(50, 500),
                    expiryDate: category === 'Food & Beverages'
                        ? randomDate(new Date(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))
                        : null,
                    dateOfEntry: randomDate(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), new Date()),
                    company_name: COMPANY_NAME
                });
                products.push(product);
            }
            console.log(`   ✅ ${category}: ${items.length} products`);
        }
        console.log(`✅ ${products.length} Products created\n`);

        // Create Customers
        console.log('🧑‍🤝‍🧑 Creating Customers...');
        const customers = [];
        for (let i = 0; i < customerNames.length; i++) {
            const customer = await Customer.create({
                name: customerNames[i],
                phoneNumber: `555-${String(1000 + i)}`,
                email: `${customerNames[i].toLowerCase().replace(' ', '.')}@email.com`,
                address: `${200 + i} Customer Ave, Shopping District, SD ${10000 + i}`,
                company_name: COMPANY_NAME,
                notes: pickRandom(['Regular customer', 'VIP member', 'New customer', 'Wholesale buyer', ''])
            });
            customers.push(customer);
        }
        console.log(`✅ ${customers.length} Customers created\n`);

        // Create Sales (past 6 months)
        console.log('💰 Creating Sales transactions...');
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        let salesCount = 0;
        let totalRevenue = 0;

        // Generate 200+ sales over 6 months
        for (let i = 0; i < 220; i++) {
            const customer = pickRandom(customers);
            const employee = pickRandom(employees);
            const numProducts = randomInt(1, 4);
            const saleProducts = [];
            let totalAmount = 0;

            for (let j = 0; j < numProducts; j++) {
                const product = pickRandom(products);
                const quantity = randomInt(1, 5);
                const subtotal = product.price * quantity;
                saleProducts.push({
                    productId: product._id,
                    quantity: quantity,
                    price: product.price,
                    subtotal: subtotal
                });
                totalAmount += subtotal;
            }

            const saleDate = randomDate(sixMonthsAgo, new Date());
            const isPaid = Math.random() > 0.15; // 85% paid

            await Sale.create({
                customerId: customer._id,
                products: saleProducts,
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                paidAmount: isPaid ? parseFloat(totalAmount.toFixed(2)) : parseFloat((totalAmount * Math.random() * 0.5).toFixed(2)),
                paymentStatus: isPaid ? 'paid' : pickRandom(['partial', 'unpaid']),
                saleDate: saleDate,
                company_name: COMPANY_NAME,
                handledBy: employee._id,
                notes: pickRandom(['', 'Rush order', 'Bulk purchase', 'Gift wrapped', 'Special request'])
            });

            salesCount++;
            totalRevenue += totalAmount;
        }
        console.log(`✅ ${salesCount} Sales created (Total Revenue: $${totalRevenue.toFixed(2)})\n`);

        // Create Attendance (past 3 months)
        console.log('📅 Creating Attendance records...');
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        let attendanceCount = 0;
        const today = new Date();

        for (const employee of employees) {
            let currentDate = new Date(threeMonthsAgo);

            while (currentDate <= today) {
                // Skip weekends
                if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                    const status = Math.random() > 0.1 ? 'present' : pickRandom(['absent', 'half-day', 'leave']);
                    const workHours = status === 'present' ? randomInt(7, 9) : (status === 'half-day' ? 4 : 0);

                    try {
                        await Attendance.create({
                            userId: employee._id,
                            date: new Date(currentDate),
                            status: status,
                            company_name: COMPANY_NAME,
                            workHours: workHours,
                            checkinTime: status !== 'absent' ? new Date(currentDate.setHours(9, randomInt(0, 30), 0)) : null,
                            checkoutTime: status !== 'absent' ? new Date(currentDate.setHours(17 + (workHours - 8), randomInt(0, 30), 0)) : null,
                            notes: ''
                        });
                        attendanceCount++;
                    } catch (err) {
                        // Skip duplicate entries
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        console.log(`✅ ${attendanceCount} Attendance records created\n`);

        // Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('                    SEEDING COMPLETE!                   ');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`
    📊 Summary for "${COMPANY_NAME}":
    
    👤 Admin:       1 (${ADMIN_EMAIL})
    👥 Employees:   ${employees.length}
    📦 Products:    ${products.length}
    🧑‍🤝‍🧑 Customers:   ${customers.length}
    💰 Sales:       ${salesCount}
    📅 Attendance:  ${attendanceCount}
    
    💵 Total Revenue: $${totalRevenue.toFixed(2)}
    
    🔐 Login Credentials:
       Email:    ${ADMIN_EMAIL}
       Password: ${ADMIN_PASSWORD}
    `);
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Seeding Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('📤 Database connection closed');
        process.exit(0);
    }
};

// Run seeder
connectDB().then(seedDatabase);
