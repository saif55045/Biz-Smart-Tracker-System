const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Salary', 'Rent', 'Utilities', 'Inventory', 'Equipment', 'Marketing', 'Other'],
        default: 'Other'
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    },
    recipient: {
        type: String // Name of person paid (employee name for salaries)
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Link to User model if it's a salary payment
    },
    company_name: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'Cash'
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending'],
        default: 'Paid'
    }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
