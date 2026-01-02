const Product = require('../models/Product');
const Sale = require('../models/Sale');
const User = require('../models/User');

//Time Filter: Profit & loss tracking over a time range
exports.getProfitLossData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { company_name } = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Start of day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    // Fetch products sold within the date range and filter by company
    const products = await Product.find({
      dateOfEntry: { $gte: start, $lte: end },
      company_name // Filter by company
    });

    const data = products.map((product) => ({
      name: product.name,
      profit: product.price * product.stock, // Example profit calculation
      loss: product.stock <= 5 ? product.price * product.stock * 0.1 : 0, // Example loss calculation
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching profit/loss data:', error);
    res.status(500).json({ error: error.message });
  }
};

//Stock Reports: Stock available/sold per product or category
exports.getStockData = async (req, res) => {
  try {
    const { groupBy } = req.query; // `groupBy` can be 'product' or 'category'
    const { company_name } = req.user;

    if (!groupBy || (groupBy !== 'product' && groupBy !== 'category')) {
      return res.status(400).json({ message: 'Invalid groupBy parameter. Use "product" or "category".' });
    }

    // Add match stage to filter by company
    const matchStage = { $match: { company_name } };

    // First add the match stage to filter by company
    const aggregationPipeline = [
      matchStage,
      ...(groupBy === 'product'
        ? [
          {
            $project: {
              name: 1,
              stock: 1,
              price: 1,
              value: { $multiply: ['$stock', '$price'] },
              sold: { $subtract: ['$initialStock', '$stock'] }, // Example: Calculate sold stock
            },
          },
        ]
        : [
          {
            $group: {
              _id: '$category',
              totalStock: { $sum: '$stock' },
              totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
              totalSold: { $sum: { $subtract: ['$initialStock', '$stock'] } }, // Example: Calculate sold stock
            },
          },
          {
            $project: {
              category: '$_id',
              totalStock: 1,
              totalValue: 1,
              totalSold: 1,
              _id: 0,
            },
          },
        ])
    ];

    const stockData = await Product.aggregate(aggregationPipeline);

    res.status(200).json(stockData);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: error.message });
  }
};


// Employee Reports: Fetch employee-related data
exports.getEmployeeData = async (req, res) => {
  try {
    const { company_name } = req.user;

    // Fetch employee data with additional useful metrics
    const employees = await User.find({ company_name, role: 'Employee' }, 'username email attendance experience salary');

    const employeeData = employees.map(employee => {
      const totalAttendance = employee.attendance.length;
      const presentDays = employee.attendance.filter(day => day.present).length;
      const absentDays = totalAttendance - presentDays;
      const attendanceRate = totalAttendance > 0 ? (presentDays / totalAttendance) * 100 : 0;

      return {
        username: employee.username,
        email: employee.email,
        experience: employee.experience,
        salary: employee.salary,
        totalAttendance,
        presentDays,
        absentDays,
        attendanceRate: attendanceRate.toFixed(2),
      };
    });

    res.status(200).json(employeeData);
  } catch (error) {
    console.error('Error fetching employee data:', error);
    res.status(500).json({ error: error.message });
  }
};

// Sales Analytics: Fetch sales-related data
exports.getSalesData = async (req, res) => {
  try {
    const { company_name } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Start of day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    // Fetch sales data for the company within the date range
    // Populate productId with name and category for filtering
    const sales = await Sale.find({
      company_name,
      saleDate: { $gte: start, $lte: end },
    }).populate('products.productId', 'name category').populate('customerId', 'name');

    // Map sales data to include detailed analytics
    const salesData = sales.map(sale => ({
      _id: sale._id,
      saleDate: sale.saleDate,
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount,
      remainingAmount: sale.remainingAmount,
      paymentStatus: sale.paymentStatus,
      customerName: sale.customerId ? sale.customerId.name : 'Walk-in',
      products: sale.products.map(product => ({
        productId: product.productId ? product.productId._id : null,
        productName: product.productId ? product.productId.name : 'Product Unavailable',
        category: product.productId ? product.productId.category : null,
        quantity: product.quantity,
        price: product.price,
        subtotal: product.subtotal,
      })),
      handledBy: sale.handledBy, // User who handled the sale
      notes: sale.notes,
    }));

    res.status(200).json(salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: error.message });
  }
};

// Daily Sales Summary Report
exports.getDailySalesSummary = async (req, res) => {
  try {
    const { company_name } = req.user;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    // Create date range for the specified day (start of day to end of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get sales for the specified date
    const sales = await Sale.find({
      company_name,
      saleDate: { $gte: startDate, $lte: endDate }
    }).populate('products.productId', 'name');

    // Calculate metrics
    const totalSalesCount = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Calculate number of unique transactions (by saleId)
    const transactions = new Set(sales.map(sale => sale._id.toString())).size;

    // Determine top-selling product
    const productSales = {};
    sales.forEach(sale => {
      sale.products.forEach(product => {
        const productId = product.productId._id.toString();
        const productName = product.productId.name;
        if (!productSales[productId]) {
          productSales[productId] = { name: productName, quantity: 0, revenue: 0 };
        }
        productSales[productId].quantity += product.quantity;
        productSales[productId].revenue += product.subtotal;
      });
    });

    // Find top-selling product by quantity
    let topSellingProduct = null;
    let maxQuantity = 0;

    for (const [productId, data] of Object.entries(productSales)) {
      if (data.quantity > maxQuantity) {
        maxQuantity = data.quantity;
        topSellingProduct = { id: productId, ...data };
      }
    }

    const result = {
      date: startDate,
      totalSalesCount,
      totalRevenue,
      transactions,
      topSellingProduct: topSellingProduct || { name: 'No products sold', quantity: 0, revenue: 0 }
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching daily sales summary:', error);
    res.status(500).json({ error: error.message });
  }
};

// Low Stock Alert Report
exports.getLowStockAlerts = async (req, res) => {
  try {
    const { company_name } = req.user;
    const { category, brand, threshold } = req.query;

    // Default threshold is 10 if not specified
    const stockThreshold = threshold ? parseInt(threshold) : 10;

    // Build query
    const query = {
      company_name,
      stock: { $lte: stockThreshold }
    };

    // Add optional filters if provided
    if (category) query.category = category;
    if (brand) query.brand = brand;

    // Find products below threshold
    const lowStockProducts = await Product.find(query).sort({ stock: 1 });

    res.status(200).json(lowStockProducts);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Total Sales Summary Report (All Time)
exports.getTotalSalesSummary = async (req, res) => {
  try {
    const { company_name } = req.user;

    const sales = await Sale.aggregate([
      { $match: { company_name } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalSalesCount: { $sum: 1 }
        }
      }
    ]);

    const result = sales.length > 0 ? sales[0] : { totalRevenue: 0, totalSalesCount: 0 };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching total sales summary:', error);
    res.status(500).json({ error: error.message });
  }
};

