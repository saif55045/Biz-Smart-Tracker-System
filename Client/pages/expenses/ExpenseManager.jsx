import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../../context/CurrencyContext';
import config from '../../src/config';
import './ExpenseManager.css';

const ExpenseManager = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);

    // Filter States
    const [filterDate, setFilterDate] = useState({ start: '', end: '' });
    const [filterCategory, setFilterCategory] = useState('All');

    // Salary States
    const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
    const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
    const [salaryData, setSalaryData] = useState([]);

    // New Expense Form State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0],
        description: '',
        recipient: '',
        paymentMethod: 'Cash'
    });

    const categories = ['Rent', 'Utilities', 'Inventory', 'Equipment', 'Marketing', 'Other'];
    const { formatMoney } = useCurrency();

    // Use formatMoney directly instead of local formatCurrency
    const formatCurrency = (amount) => formatMoney(amount);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'salaries') {
            fetchSalaryData();
        }
    }, [activeTab, salaryMonth, salaryYear]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch Expenses
            const expensesRes = await axios.get(`${config.API_URL}/expenses/all`, { headers });
            setExpenses(expensesRes.data.expenses);

            // Fetch Employees for Salary
            const employeesRes = await axios.get(`${config.API_URL}/user/employees`, { headers });
            setEmployees(employeesRes.data);

            // Fetch Stats
            const statsRes = await axios.get(`${config.API_URL}/expenses/stats`, { headers });
            setDashboardStats(statsRes.data);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalaryData = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.API_URL}/user/monthly-attendance?month=${salaryMonth}&year=${salaryYear}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSalaryData(response.data);
        } catch (error) {
            console.error('Error fetching salary data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${config.API_URL}/expenses/add`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAddModal(false);
            setFormData({
                title: '',
                amount: '',
                category: 'Other',
                date: new Date().toISOString().split('T')[0],
                description: '',
                recipient: '',
                paymentMethod: 'Cash'
            });
            fetchInitialData();
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handlePaySalary = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            await axios.post(`${config.API_URL}/expenses/pay-salary`, {
                employeeId: selectedEmployee._id,
                amount: formData.amount,
                date: formData.date,
                year: new Date(formData.date).getFullYear(),
                month: new Date(formData.date).getMonth() + 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowPayModal(false);
            fetchInitialData();
        } catch (error) {
            console.error('Error paying salary:', error);
        }
    };

    // formatCurrency replaced by hook


    // Filtered Expenses
    const filteredExpenses = expenses.filter(exp => {
        const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
        const expDate = new Date(exp.date);
        const afterStart = !filterDate.start || expDate >= new Date(filterDate.start);
        const beforeEnd = !filterDate.end || expDate <= new Date(filterDate.end);
        return matchesCategory && afterStart && beforeEnd;
    });

    return (
        <div className="expense-manager">
            <div className="emp-header">
                <h1>Financial Manager</h1>
                <p>Track expenses, salaries, and company spending</p>
            </div>

            <div className="att-tabs">
                <button className={`att-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Overview</button>
                <button className={`att-tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>Expenses & Transactions</button>
                <button className={`att-tab ${activeTab === 'salaries' ? 'active' : ''}`} onClick={() => setActiveTab('salaries')}>Salaries</button>
            </div>

            {activeTab === 'dashboard' && dashboardStats && (
                <div className="exp-dashboard">
                    <div className="stats-grid">
                        {dashboardStats.byCategory.map(cat => (
                            <div className="stat-card" key={cat._id}>
                                <h3>{cat._id}</h3>
                                <p className="expense-amount">{formatCurrency(cat.total)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Simple Chart Visualization can go here later */}
                    <div className="recent-activity">
                        <h3>Recent Activity</h3>
                        <div className="activity-list">
                            {expenses.slice(0, 5).map(exp => (
                                <div className="activity-item" key={exp._id}>
                                    <div className="activity-icon">{exp.category[0]}</div>
                                    <div className="activity-info">
                                        <h4>{exp.title}</h4>
                                        <p>{new Date(exp.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="activity-amount red">
                                        -{formatCurrency(exp.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'expenses' && (
                <div className="exp-list-view">
                    <div className="exp-actions">
                        <div className="exp-filters">
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                                <option value="All">All Categories</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="Salary">Salary</option>
                            </select>
                            <input type="date" value={filterDate.start} onChange={(e) => setFilterDate({ ...filterDate, start: e.target.value })} />
                            <input type="date" value={filterDate.end} onChange={(e) => setFilterDate({ ...filterDate, end: e.target.value })} />
                        </div>
                        <button className="att-submit-btn" onClick={() => setShowAddModal(true)}>+ Add Expense</button>
                    </div>

                    <div className="att-table-container">
                        <table className="att-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Recipient</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(exp => (
                                    <tr key={exp._id}>
                                        <td>{new Date(exp.date).toLocaleDateString()}</td>
                                        <td>{exp.title}</td>
                                        <td><span className={`exp-badge ${exp.category.toLowerCase()}`}>{exp.category}</span></td>
                                        <td>{exp.recipient || '-'}</td>
                                        <td className="red">{formatCurrency(exp.amount)}</td>
                                        <td>{exp.paymentMethod}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'salaries' && (
                <div className="salary-view">
                    <div className="exp-filters" style={{ marginBottom: '1rem' }}>
                        <select value={salaryMonth} onChange={(e) => setSalaryMonth(parseInt(e.target.value))}>
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select value={salaryYear} onChange={(e) => setSalaryYear(parseInt(e.target.value))}>
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="att-table-container">
                        <table className="att-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Base Salary</th>
                                    <th>Deductions</th>
                                    <th>Net Salary</th>
                                    <th>Status</th>
                                    <th id="action">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaryData.map(data => (
                                    <tr key={data.employeeId}>
                                        <td>
                                            <div className="att-employee-cell">
                                                <div className="att-employee-avatar">{data.username?.[0]}</div>
                                                <span>{data.username}</span>
                                            </div>
                                        </td>
                                        <td>{formatMoney(data.baseSalary)}</td>
                                        <td className="red">-{formatMoney(data.baseSalary - data.adjustedSalary)}</td>
                                        <td><strong style={{ color: '#10b981', fontSize: '1.1em' }}>{formatMoney(data.adjustedSalary)}</strong></td>
                                        <td>
                                            <span className="att-status present">{data.attendancePercentage}% Att.</span>
                                        </td>
                                        <td>
                                            <button className="att-submit-btn small" onClick={() => {
                                                setSelectedEmployee({ _id: data.employeeId, username: data.username });
                                                setFormData({
                                                    ...formData,
                                                    amount: data.adjustedSalary,
                                                    recipient: data.username,
                                                    date: new Date(salaryYear, salaryMonth - 1, new Date().getDate()).toISOString().split('T')[0]
                                                });
                                                setShowPayModal(true);
                                            }}>Pay Salary</button>
                                        </td>
                                    </tr>
                                ))}
                                {salaryData.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No attendance data found for this month</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}



            {/* Add Expense Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Expense</h2>
                        <form onSubmit={handleAddExpense}>
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Amount</label>
                                <input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="att-submit-btn">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pay Salary Modal */}
            {showPayModal && selectedEmployee && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Pay Salary: {selectedEmployee.username}</h2>
                        <form onSubmit={handlePaySalary}>
                            <div className="form-group">
                                <label>Amount (Net Salary)</label>
                                <input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label>Payment Date</label>
                                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowPayModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="att-submit-btn">Confirm Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );

};

export default ExpenseManager;
