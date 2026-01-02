const Expense = require('../models/Expense');
const User = require('../models/User');

// Add a new expense
exports.addExpense = async (req, res) => {
    try {
        const { title, amount, category, date, description, recipient, paymentMethod } = req.body;

        // Authorization check - only Admin can add expenses
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Only Admins can add expenses.' });
        }

        const newExpense = new Expense({
            title,
            amount,
            category,
            date: date || Date.now(),
            description,
            recipient,
            paymentMethod,
            company_name: req.user.company_name
        });

        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Error adding expense', error: error.message });
    }
};

// Get all expenses with filters
exports.getExpenses = async (req, res) => {
    try {
        const { startDate, endDate, category, limit } = req.query;

        // Authorization check
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied.' });
        }

        let query = { company_name: req.user.company_name };

        // Date filtering
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Category filtering
        if (category && category !== 'All') {
            query.category = category;
        }

        let expensesQuery = Expense.find(query).sort({ date: -1 });

        if (limit) {
            expensesQuery = expensesQuery.limit(parseInt(limit));
        }

        const expenses = await expensesQuery;

        // Calculate total
        const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        res.status(200).json({ expenses, total });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
};

// Pay Salary
exports.paySalary = async (req, res) => {
    try {
        const { employeeId, amount, year, month, date } = req.body;

        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const salaryDate = date ? new Date(date) : new Date();

        // Create expense record for salary
        const salaryExpense = new Expense({
            title: `Salary Payment - ${employee.username}`,
            amount,
            category: 'Salary',
            date: salaryDate,
            description: `Salary payment for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
            recipient: employee.username,
            recipientId: employee._id,
            company_name: req.user.company_name,
            status: 'Paid'
        });

        await salaryExpense.save();
        res.status(201).json({ message: 'Salary paid successfully', expense: salaryExpense });
    } catch (error) {
        console.error('Error paying salary:', error);
        res.status(500).json({ message: 'Error processing salary payment' });
    }
};

// Get Dashboard Expense Stats
exports.getExpenseStats = async (req, res) => {
    try {
        const { company_name } = req.user;

        // Get total expenses by category
        const expensesByCategory = await Expense.aggregate([
            { $match: { company_name } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);

        // Get expenses for the last 7 days for chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyExpenses = await Expense.aggregate([
            {
                $match: {
                    company_name,
                    date: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get expenses for the last 6 months for chart
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const expensesByMonth = await Expense.aggregate([
            {
                $match: {
                    company_name,
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Monthly totals for current year
        const currentYear = new Date().getFullYear();
        const yearlyExpenses = await Expense.aggregate([
            {
                $match: {
                    company_name,
                    date: {
                        $gte: new Date(currentYear, 0, 1),
                        $lte: new Date(currentYear, 11, 31)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            byCategory: expensesByCategory,
            monthlyChart: yearlyExpenses,
            dailyChart: dailyExpenses,
            recent: expensesByMonth
        });

    } catch (error) {
        console.error('Error fetching expense stats:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};
