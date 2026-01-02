import { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useCurrency } from '../../context/CurrencyContext';
import config from '../../src/config';
import { saveAs } from 'file-saver';
import 'chart.js/auto';
import './Reports.css';
import './ReportsFixes.css';

// Icons
const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

// Sparkline SVG components for mini charts - simplified for better rendering
const SparklineUp = ({ color = '#3b82f6' }) => (
  <svg width="80" height="40" viewBox="0 0 80 40" style={{ display: 'block', minWidth: '80px' }}>
    <path
      d="M0,35 Q10,32 15,28 T30,22 T45,18 T60,12 T75,8 L80,5 L80,40 L0,40 Z"
      fill={color}
      fillOpacity="0.2"
    />
    <path
      d="M0,35 Q10,32 15,28 T30,22 T45,18 T60,12 T75,8 L80,5"
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
  </svg>
);

const SparklineDown = ({ color = '#ef4444' }) => (
  <svg width="80" height="40" viewBox="0 0 80 40" style={{ display: 'block', minWidth: '80px' }}>
    <path
      d="M0,10 Q10,12 20,18 T40,22 T60,28 T80,32 L80,40 L0,40 Z"
      fill={color}
      fillOpacity="0.2"
    />
    <path
      d="M0,10 Q10,12 20,18 T40,22 T60,28 T80,32"
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
  </svg>
);

const SparklineBar = ({ color = '#10b981' }) => (
  <svg width="80" height="40" viewBox="0 0 80 40" style={{ display: 'block', minWidth: '80px' }}>
    <rect x="2" y="25" width="8" height="15" fill={color} fillOpacity="0.6" rx="1" />
    <rect x="14" y="20" width="8" height="20" fill={color} fillOpacity="0.7" rx="1" />
    <rect x="26" y="15" width="8" height="25" fill={color} fillOpacity="0.8" rx="1" />
    <rect x="38" y="18" width="8" height="22" fill={color} fillOpacity="0.7" rx="1" />
    <rect x="50" y="10" width="8" height="30" fill={color} fillOpacity="0.9" rx="1" />
    <rect x="62" y="5" width="8" height="35" fill={color} rx="1" />
  </svg>
);

const SparklineWave = ({ color = '#f59e0b' }) => (
  <svg width="80" height="40" viewBox="0 0 80 40" style={{ display: 'block', minWidth: '80px' }}>
    <path
      d="M0,25 Q10,15 20,20 T40,18 T60,12 T80,8 L80,40 L0,40 Z"
      fill={color}
      fillOpacity="0.2"
    />
    <path
      d="M0,25 Q10,15 20,20 T40,18 T60,12 T80,8"
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
  </svg>
);

export default function Reports() {
  const { formatMoney, symbol } = useCurrency();
  // Active tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Common state
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard tab state
  const [profitLossData, setProfitLossData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState('product');
  const [dateRangeType, setDateRangeType] = useState('month');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');

  // Report Builder state
  const [dataSource, setDataSource] = useState('sales');
  const [selectedMetrics, setSelectedMetrics] = useState(['count']);
  const [groupByField, setGroupByField] = useState('date');
  const [chartType, setChartType] = useState('bar');
  const [builderStartDate, setBuilderStartDate] = useState('');
  const [builderEndDate, setBuilderEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Dynamic data
  const [categories, setCategories] = useState([]);
  const [previousPeriodSales, setPreviousPeriodSales] = useState([]);
  const [productsData, setProductsData] = useState([]); // Store products for category lookup

  // Get token and company info on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setCompanyName(decodedToken.company_name);
      } catch (error) {
        console.error('Error decoding JWT token:', error);
      }
    }
    // Set default dates
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    setStartDate(lastMonth.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setBuilderStartDate(lastMonth.toISOString().split('T')[0]);
    setBuilderEndDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch data when dates change
  useEffect(() => {
    if (startDate && endDate && companyName && activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [startDate, endDate, activeTab, companyName]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Calculate previous period dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const periodLength = end - start;
      const prevEnd = new Date(start - 1);
      const prevStart = new Date(prevEnd - periodLength);

      // Fetch all dashboard data including previous period and products for categories
      const [profitRes, stockRes, salesRes, prevSalesRes, productsRes] = await Promise.all([
        axios.get(`${config.API_URL}/reports/profit-loss`, { params: { startDate, endDate }, headers }).catch(() => ({ data: [] })),
        axios.get(`${config.API_URL}/reports/stock-data`, { params: { groupBy }, headers }).catch(() => ({ data: [] })),
        axios.get(`${config.API_URL}/reports/sales-data`, { params: { startDate, endDate }, headers }).catch(() => ({ data: [] })),
        axios.get(`${config.API_URL}/reports/sales-data`, {
          params: { startDate: prevStart.toISOString().split('T')[0], endDate: prevEnd.toISOString().split('T')[0] },
          headers
        }).catch(() => ({ data: [] })),
        axios.get(`${config.API_URL}/products/products`, {
          params: { company_name: companyName },
          headers
        }).catch(() => ({ data: [] }))
      ]);

      setProfitLossData(profitRes.data || []);
      setStockData(stockRes.data || []);
      setSalesData(salesRes.data || []);
      setPreviousPeriodSales(prevSalesRes.data || []);

      // Store products and extract unique categories
      // Handle both old array format and new paginated format
      const productsResponse = productsRes.data;
      const products = Array.isArray(productsResponse)
        ? productsResponse
        : (productsResponse?.products || []);
      setProductsData(products);
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);

      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Date range preset helper
  const setDateRangePreset = (preset) => {
    const today = new Date();
    let start = new Date();

    switch (preset) {
      case 'today':
        start = today;
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      default:
        return;
    }

    setDateRangeType(preset);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // Create productId -> category lookup map
  const productCategoryMap = {};
  productsData.forEach(p => {
    if (p._id) productCategoryMap[p._id] = p.category;
  });

  // Get product IDs that match the selected category
  const categoryProductIds = categoryFilter
    ? productsData.filter(p => p.category === categoryFilter).map(p => p._id)
    : [];

  // Filter sales by category (if selected) - uses embedded category from API
  const filteredSalesData = categoryFilter
    ? salesData.filter(sale => {
      if (sale.products && Array.isArray(sale.products)) {
        // Check if any product in the sale matches the category
        const hasCategory = sale.products.some(p => {
          // Debug log to see what categories we're getting
          if (salesData.indexOf(sale) === 0 && sale.products.indexOf(p) === 0) {
            console.log('Product category:', p.category, 'Filter:', categoryFilter);
          }
          return p.category === categoryFilter;
        });
        return hasCategory;
      }
      return false;
    })
    : salesData;

  // Log filter results for debugging
  if (categoryFilter) {
    console.log('Category filter:', categoryFilter, 'Filtered sales count:', filteredSalesData.length, 'Total sales:', salesData.length);
  }

  const filteredPreviousSales = categoryFilter
    ? previousPeriodSales.filter(sale => {
      if (sale.products && Array.isArray(sale.products)) {
        return sale.products.some(p => p.category === categoryFilter);
      }
      return false;
    })
    : previousPeriodSales;

  // Filter products by category for top products chart
  const filteredStockData = categoryFilter
    ? productsData.filter(p => p.category === categoryFilter)
    : productsData;

  // Calculate current period stats (using filtered data)
  const totalRevenue = filteredSalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const totalSales = filteredSalesData.length;
  const productsSold = filteredSalesData.reduce((sum, sale) => {
    if (sale.products && Array.isArray(sale.products)) {
      return sum + sale.products.reduce((pSum, p) => pSum + (p.quantity || 1), 0);
    }
    return sum + (sale.quantity || 1);
  }, 0);
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Calculate previous period stats for comparison (using filtered data)
  const prevRevenue = filteredPreviousSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const prevSalesCount = filteredPreviousSales.length;
  const prevProductsSold = filteredPreviousSales.reduce((sum, sale) => {
    if (sale.products && Array.isArray(sale.products)) {
      return sum + sale.products.reduce((pSum, p) => pSum + (p.quantity || 1), 0);
    }
    return sum + (sale.quantity || 1);
  }, 0);
  const prevAvgOrder = prevSalesCount > 0 ? prevRevenue / prevSalesCount : 0;

  // Calculate percentage changes
  const calcPercentChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const revenueChange = calcPercentChange(totalRevenue, prevRevenue);
  const salesChange = calcPercentChange(totalSales, prevSalesCount);
  const productsChange = calcPercentChange(productsSold, prevProductsSold);
  const avgOrderChange = calcPercentChange(avgOrderValue, prevAvgOrder);

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8' } }
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  // Sales chart data (using filtered data for category filtering)
  // Aggregate sales by date for the chart
  const salesByDate = filteredSalesData.reduce((acc, sale) => {
    const date = new Date(sale.saleDate).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += sale.totalAmount || 0;
    return acc;
  }, {});

  // Sort dates chronologically
  const sortedDates = Object.keys(salesByDate).sort((a, b) => new Date(a) - new Date(b));

  // Sales chart data
  const salesChartData = {
    labels: sortedDates,
    datasets: [{
      label: 'Revenue',
      data: sortedDates.map(date => salesByDate[date]),
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  // Top products data (filtered by category if selected)
  const topProductsData = {
    labels: filteredStockData.slice(0, 5).map(p => p.name || p.category || 'Unknown'),
    datasets: [{
      label: categoryFilter ? `${categoryFilter} Stock` : 'Stock',
      data: filteredStockData.slice(0, 5).map(p => p.stock || p.totalStock || 0),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
    }]
  };

  // Export function
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  };

  // Report Builder functions
  const toggleMetric = (metric) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Process raw data based on selected metrics and groupBy field
  const processReportData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];

    // For sales data, apply grouping and metrics
    if (dataSource === 'sales') {
      const grouped = {};

      rawData.forEach(sale => {
        let key;
        const saleDate = new Date(sale.saleDate);

        switch (groupByField) {
          case 'date':
            key = saleDate.toLocaleDateString();
            break;
          case 'week':
            const weekStart = new Date(saleDate);
            weekStart.setDate(saleDate.getDate() - saleDate.getDay());
            key = `Week of ${weekStart.toLocaleDateString()}`;
            break;
          case 'month':
            key = `${saleDate.toLocaleString('default', { month: 'short' })} ${saleDate.getFullYear()}`;
            break;
          case 'category':
            key = sale.products?.[0]?.category || 'Uncategorized';
            break;
          case 'product':
            key = sale.products?.[0]?.productName || 'Unknown';
            break;
          default:
            key = saleDate.toLocaleDateString();
        }

        if (!grouped[key]) {
          grouped[key] = { name: key, values: [], _sortKey: saleDate.getTime() };
        }
        grouped[key].values.push(sale.totalAmount || 0);
      });

      // Sort by date (most recent first for non-date groupings, chronological for date-based)
      const sortedGroups = Object.values(grouped).sort((a, b) => {
        if (['date', 'week', 'month'].includes(groupByField)) {
          return a._sortKey - b._sortKey; // Chronological
        }
        return b.values.reduce((x, y) => x + y, 0) - a.values.reduce((x, y) => x + y, 0); // By total
      });

      // Apply selected metrics
      return sortedGroups.map(group => {
        const result = { name: group.name };

        if (selectedMetrics.includes('count')) {
          result.count = group.values.length;
        }
        if (selectedMetrics.includes('sum')) {
          result.sum = parseFloat(group.values.reduce((a, b) => a + b, 0).toFixed(2));
        }
        if (selectedMetrics.includes('average')) {
          result.average = group.values.length > 0
            ? parseFloat((group.values.reduce((a, b) => a + b, 0) / group.values.length).toFixed(2))
            : 0;
        }
        if (selectedMetrics.includes('min')) {
          result.min = group.values.length > 0 ? Math.min(...group.values) : 0;
        }
        if (selectedMetrics.includes('max')) {
          result.max = group.values.length > 0 ? Math.max(...group.values) : 0;
        }

        return result;
      });
    }

    // For products, apply metrics if grouped by category
    if (dataSource === 'products' && groupByField === 'category') {
      return rawData.map(item => {
        const result = { name: item.category || 'Uncategorized' };
        if (selectedMetrics.includes('count')) result.count = 1;
        if (selectedMetrics.includes('sum')) result.sum = item.totalStock || 0;
        if (selectedMetrics.includes('average')) result.average = item.totalStock || 0;
        if (selectedMetrics.includes('min')) result.min = item.totalStock || 0;
        if (selectedMetrics.includes('max')) result.max = item.totalStock || 0;
        return result;
      });
    }

    // For employees, calculate metrics from salary
    if (dataSource === 'employees') {
      const salaries = rawData.map(e => e.salary || 0);
      const result = { name: 'All Employees' };
      if (selectedMetrics.includes('count')) result.count = rawData.length;
      if (selectedMetrics.includes('sum')) result.sum = salaries.reduce((a, b) => a + b, 0);
      if (selectedMetrics.includes('average')) result.average = salaries.length > 0 ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;
      if (selectedMetrics.includes('min')) result.min = salaries.length > 0 ? Math.min(...salaries) : 0;
      if (selectedMetrics.includes('max')) result.max = salaries.length > 0 ? Math.max(...salaries) : 0;

      // Return individual employee data with metrics applied
      return rawData.map(emp => ({
        name: emp.username || 'Unknown',
        count: 1,
        sum: emp.salary || 0,
        average: emp.salary || 0,
        min: emp.salary || 0,
        max: emp.salary || 0,
        attendanceRate: emp.attendanceRate || 0
      }));
    }

    // For other data sources, return as-is with basic structure
    return rawData.map((item, i) => ({
      name: item.name || item.username || item.customerName || `Item ${i + 1}`,
      count: 1,
      sum: item.totalAmount || item.stock || item.salary || 0,
      ...item
    }));
  };

  const generateReport = async () => {
    setLoading(true);
    setReportGenerated(false);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      let endpoint = '';
      let params = { startDate: builderStartDate, endDate: builderEndDate };

      switch (dataSource) {
        case 'sales':
          endpoint = `${config.API_URL}/reports/sales-data`;
          break;
        case 'products':
          endpoint = `${config.API_URL}/reports/stock-data`;
          // groupBy must be 'product' or 'category', default to 'product'
          params.groupBy = groupByField === 'category' ? 'category' : 'product';
          break;
        case 'customers':
          endpoint = `${config.API_URL}/customers/`;
          break;
        case 'employees':
          endpoint = `${config.API_URL}/reports/employee-data`;
          break;
        case 'attendance':
          // attendance-report requires startDate and endDate (already in params)
          endpoint = `${config.API_URL}/user/attendance-report`;
          break;
        default:
          endpoint = `${config.API_URL}/reports/sales-data`;
      }

      const response = await axios.get(endpoint, { headers, params });
      const processed = processReportData(response.data || []);
      setReportData(processed);
      setReportGenerated(true);
      setError('');
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const clearBuilder = () => {
    setDataSource('sales');
    setSelectedMetrics(['count']);
    setGroupByField('date');
    setChartType('bar');
    setReportData(null);
    setReportGenerated(false);
  };

  // Generate chart for report builder
  const getReportChartData = () => {
    if (!reportData || reportData.length === 0) return null;

    const labels = reportData.slice(0, 15).map((item) => item.name || 'Unknown');

    // Use the first selected metric for chart values, fallback to count
    const primaryMetric = selectedMetrics[0] || 'count';
    const values = reportData.slice(0, 15).map(item => {
      // For attendance data with summary
      if (dataSource === 'attendance' && item.summary) {
        return item.summary.attendancePercentage || 0;
      }
      // Use the selected metric if available
      if (item[primaryMetric] !== undefined) {
        return item[primaryMetric];
      }
      // Fallback to common fields
      return item.totalAmount || item.stock || item.salary || item.count || 0;
    });

    // Set appropriate label based on selected metric
    const metricLabels = {
      count: 'Count',
      sum: `Total (${symbol})`,
      average: `Average (${symbol})`,
      min: `Minimum (${symbol})`,
      max: `Maximum (${symbol})`
    };
    let chartLabel = metricLabels[primaryMetric] || dataSource.charAt(0).toUpperCase() + dataSource.slice(1);
    if (dataSource === 'attendance') {
      chartLabel = 'Attendance Rate (%)';
    }

    return {
      labels,
      datasets: [{
        label: chartLabel,
        data: values,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7', '#f43f5e', '#22c55e', '#eab308'],
        borderColor: '#3b82f6',
        borderWidth: 1
      }]
    };
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <div className="reports-title-section">
          <h1>Reports & Analytics</h1>
          <p>Track business performance and build custom reports</p>
        </div>
        <div className="reports-actions">
          <button className="export-btn" onClick={() => exportToCSV(salesData, 'sales_report.csv')}>
            <DownloadIcon /> Export
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="message error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

      {/* Tabs */}
      <div className="reports-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          Report Builder
        </button>
      </div>

      {/* ========== DASHBOARD TAB ========== */}
      {activeTab === 'dashboard' && (
        <>
          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-group">
              <span className="filter-label">Date range</span>
              <div className="date-range-btns">
                <button
                  className={`date-range-btn ${dateRangeType === 'today' ? 'active' : ''}`}
                  onClick={() => setDateRangePreset('today')}
                >Today</button>
                <button
                  className={`date-range-btn ${dateRangeType === 'week' ? 'active' : ''}`}
                  onClick={() => setDateRangePreset('week')}
                >This Week</button>
                <button
                  className={`date-range-btn ${dateRangeType === 'month' ? 'active' : ''}`}
                  onClick={() => setDateRangePreset('month')}
                >This Month</button>
                <button
                  className={`date-range-btn ${dateRangeType === 'custom' ? 'active' : ''}`}
                  onClick={() => setDateRangeType('custom')}
                >Custom</button>
                {dateRangeType === 'custom' && (
                  <div className="custom-date-inputs">
                    <input
                      type="date"
                      className="custom-date-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="date-separator">to</span>
                    <input
                      type="date"
                      className="custom-date-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label">Category</span>
              <select
                className="category-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">Export Format</span>
              <div className="export-btns">
                <button
                  className={`export-format-btn ${exportFormat === 'pdf' ? 'active' : ''}`}
                  onClick={() => setExportFormat('pdf')}
                >PDF</button>
                <button
                  className={`export-format-btn ${exportFormat === 'excel' ? 'active' : ''}`}
                  onClick={() => setExportFormat('excel')}
                >Excel</button>
                <button
                  className={`export-format-btn ${exportFormat === 'csv' ? 'active' : ''}`}
                  onClick={() => { setExportFormat('csv'); exportToCSV(salesData, 'report.csv'); }}
                >CSV</button>
              </div>
            </div>
          </div>

          {/* Stats Row - Enhanced with mini charts and % change */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <span className="stat-label">Total Revenue</span>
                  <i className="fas fa-chart-line" style={{ color: '#3b82f6' }}></i>
                </div>
                <span className="stat-value" style={{ color: '#3b82f6' }}>{formatMoney(totalRevenue)}</span>
                <div className="stat-footer">
                  <span className={`stat-change ${parseFloat(revenueChange) >= 0 ? 'up' : 'down'}`}>
                    {parseFloat(revenueChange) >= 0 ? '↑' : '↓'} {parseFloat(revenueChange) >= 0 ? '+' : ''}{revenueChange}%
                  </span>
                  <span className="stat-period">from last period</span>
                </div>
              </div>
              <SparklineUp color="#3b82f6" />
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <span className="stat-label">Total Sales</span>
                  <i className="fas fa-shopping-bag" style={{ color: '#10b981' }}></i>
                </div>
                <span className="stat-value">{totalSales.toLocaleString()}</span>
                <div className="stat-footer">
                  <span className={`stat-change ${parseFloat(salesChange) >= 0 ? 'up' : 'down'}`}>
                    {parseFloat(salesChange) >= 0 ? '↑' : '↓'} {parseFloat(salesChange) >= 0 ? '+' : ''}{salesChange}%
                  </span>
                  <span className="stat-period">from last period</span>
                </div>
              </div>
              <SparklineBar color="#10b981" />
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <span className="stat-label">Products Sold</span>
                  <i className="fas fa-box" style={{ color: '#ef4444' }}></i>
                </div>
                <span className="stat-value">{productsSold.toLocaleString()}</span>
                <div className="stat-footer">
                  <span className={`stat-change ${parseFloat(productsChange) >= 0 ? 'up' : 'down'}`}>
                    {parseFloat(productsChange) >= 0 ? '↑' : '↓'} {parseFloat(productsChange) >= 0 ? '+' : ''}{productsChange}%
                  </span>
                  <span className="stat-period">from last period</span>
                </div>
              </div>
              <SparklineDown color="#ef4444" />
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <span className="stat-label">Average Order Value</span>
                  <i className="fas fa-dollar-sign" style={{ color: '#f59e0b' }}></i>
                </div>
                <span className="stat-value" style={{ color: '#f59e0b' }}>{formatMoney(avgOrderValue)}</span>
                <div className="stat-footer">
                  <span className={`stat-change ${parseFloat(avgOrderChange) >= 0 ? 'up' : 'down'}`}>
                    {parseFloat(avgOrderChange) >= 0 ? '↑' : '↓'} {parseFloat(avgOrderChange) >= 0 ? '+' : ''}{avgOrderChange}%
                  </span>
                  <span className="stat-period">from last period</span>
                </div>
              </div>
              <SparklineWave color="#f59e0b" />
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Sales Overview</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ padding: '0.4rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#f8fafc', fontSize: '0.8rem' }}
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ padding: '0.4rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#f8fafc', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
              <div className="chart-body">
                {salesData.length > 0 ? (
                  <Line data={salesChartData} options={chartOptions} />
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-chart-area"></i>
                    <p>No sales data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Top Products</h3>
              </div>
              <div className="chart-body">
                {stockData.length > 0 ? (
                  <Bar data={topProductsData} options={{ ...chartOptions, indexAxis: 'y' }} />
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-box"></i>
                    <p>No product data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="transactions-card">
            <div className="transactions-header">
              <h3>Recent Transactions</h3>
            </div>
            {filteredSalesData.length > 0 ? (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredSalesData].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)).slice(0, 5).map((sale, index) => (
                    <tr key={sale._id || index}>
                      <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                      <td>{sale.customerName || 'Walk-in'}</td>
                      <td>{sale.productName || 'Multiple Items'}</td>
                      <td>{formatMoney(sale.totalAmount)}</td>
                      <td><span className="status-badge completed">Completed</span></td>
                    </tr>
                  ))}

                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <i className="fas fa-receipt"></i>
                <p>No transactions found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========== REPORT BUILDER TAB ========== */}
      {activeTab === 'builder' && (
        <div className="report-builder">
          <div className="builder-panel">
            <div className="builder-header">
              <i className="fas fa-magic"></i>
              <h2>Custom Report Builder</h2>
            </div>
            <div className="builder-body">
              {/* Step 1: Data Source */}
              <div className="builder-step">
                <div className="step-label">
                  <span className="step-number">1</span>
                  Select Data Source
                </div>
                <div className="data-sources">
                  {['sales', 'products', 'customers', 'employees', 'attendance'].map(source => (
                    <div
                      key={source}
                      className={`source-card ${dataSource === source ? 'selected' : ''}`}
                      onClick={() => setDataSource(source)}
                    >
                      <i className={`fas fa-${source === 'sales' ? 'shopping-cart' : source === 'products' ? 'box' : source === 'customers' ? 'users' : source === 'employees' ? 'briefcase' : 'calendar'}`}></i>
                      <span>{source.charAt(0).toUpperCase() + source.slice(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Metrics */}
              <div className="builder-step">
                <div className="step-label">
                  <span className="step-number">2</span>
                  Choose Metrics
                </div>
                <div className="metric-chips">
                  {['count', 'sum', 'average', 'min', 'max'].map(metric => (
                    <div
                      key={metric}
                      className={`metric-chip ${selectedMetrics.includes(metric) ? 'selected' : ''}`}
                      onClick={() => toggleMetric(metric)}
                    >
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Group By */}
              <div className="builder-step">
                <div className="step-label">
                  <span className="step-number">3</span>
                  Group By
                </div>
                <select
                  className="builder-select"
                  value={groupByField}
                  onChange={(e) => setGroupByField(e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="date">Date (Day)</option>
                  <option value="week">Date (Week)</option>
                  <option value="month">Date (Month)</option>
                  <option value="category">Category</option>
                  <option value="product">Product</option>
                </select>
              </div>

              {/* Step 4: Date Range */}
              <div className="builder-step">
                <div className="step-label">
                  <span className="step-number">4</span>
                  Date Range
                </div>
                <div className="date-range-inputs">
                  <div className="date-input-group">
                    <label>From</label>
                    <input
                      type="date"
                      value={builderStartDate}
                      onChange={(e) => setBuilderStartDate(e.target.value)}
                    />
                  </div>
                  <div className="date-input-group">
                    <label>To</label>
                    <input
                      type="date"
                      value={builderEndDate}
                      onChange={(e) => setBuilderEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Step 5: Chart Type */}
              <div className="builder-step">
                <div className="step-label">
                  <span className="step-number">5</span>
                  Visualization
                </div>
                <div className="chart-types">
                  {[
                    { type: 'bar', icon: 'chart-bar', label: 'Bar' },
                    { type: 'line', icon: 'chart-line', label: 'Line' },
                    { type: 'pie', icon: 'chart-pie', label: 'Pie' },
                    { type: 'table', icon: 'table', label: 'Table' }
                  ].map(({ type, icon, label }) => (
                    <div
                      key={type}
                      className={`chart-type-btn ${chartType === type ? 'selected' : ''}`}
                      onClick={() => setChartType(type)}
                    >
                      <i className={`fas fa-${icon}`}></i>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="builder-actions">
              <button className="btn-clear" onClick={clearBuilder}>Clear</button>
              <button className="btn-generate" onClick={generateReport} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="preview-panel">
            <div className="preview-header">
              <h3>Report Preview</h3>
            </div>
            <div className="preview-body">
              {reportGenerated && reportData && reportData.length > 0 ? (
                <>
                  {chartType === 'bar' && <Bar data={getReportChartData()} options={chartOptions} />}
                  {chartType === 'line' && <Line data={getReportChartData()} options={chartOptions} />}
                  {chartType === 'pie' && <Pie data={getReportChartData()} options={{ ...chartOptions, scales: {} }} />}
                  {chartType === 'table' && (
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                      <table className="transactions-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            {Object.keys(reportData[0]).slice(0, 4).map(key => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.slice(0, 5).map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).slice(0, 4).map((val, j) => (
                                <td key={j}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="preview-placeholder">
                  <i className="fas fa-chart-area"></i>
                  <p>Configure your report and click Generate to see preview</p>
                </div>
              )}
            </div>
            <div className="preview-actions">
              <button
                className="btn-download-pdf"
                onClick={() => window.print()}
                disabled={!reportGenerated}
              >
                <i className="fas fa-file-pdf"></i> Download PDF
              </button>
              <button
                className="btn-export-csv"
                onClick={() => exportToCSV(reportData, `${dataSource}_report.csv`)}
                disabled={!reportGenerated}
              >
                <i className="fas fa-file-csv"></i> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}