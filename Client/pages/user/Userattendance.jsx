import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../components/Toast';
import config from '../../src/config';
import './Userattendance.css';

export default function AttendanceManager() {
  const { formatMoney } = useCurrency();
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [myAttendanceData, setMyAttendanceData] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('mark');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [reportFilters, setReportFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    employeeId: '',
  });
  const [monthlyFilters, setMonthlyFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [reportData, setReportData] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { checkUserRole(); }, []);

  useEffect(() => {
    setSearchTerm(''); // Clear search when tab changes
    if (userRole) {
      if (userRole === 'Admin') fetchEmployees();
      else fetchMyAttendance();
    }
  }, [userRole, date, activeTab]);

  const checkUserRole = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decoded.role);
      setUserId(decoded._id);
      if (decoded.role === 'Employee') {
        setReportFilters(prev => ({ ...prev, employeeId: decoded._id }));
      }
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/user/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data);
      const defaultAttendance = {};
      response.data.forEach(emp => { defaultAttendance[emp._id] = 'present'; });
      setAttendanceData(defaultAttendance);
      setLoading(false);
      if (activeTab === 'view') handleViewAttendance();
      else if (activeTab === 'report') fetchAttendanceReport();
      else if (activeTab === 'monthly' && userRole === 'Admin') fetchMonthlySummary();
    } catch (err) {
      setMessage('Failed to fetch employees.');
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (activeTab === 'view') {
        const response = await axios.get(`${config.API_URL}/user/my-attendance?date=${date}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyAttendanceData(response.data);
      } else if (activeTab === 'report') {
        const { startDate, endDate } = reportFilters;
        const response = await axios.get(`${config.API_URL}/user/my-attendance-report?startDate=${startDate}&endDate=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReportData(response.data);
      }
      setLoading(false);
    } catch (err) {
      setMessage('Failed to fetch attendance data.');
      setLoading(false);
    }
  };

  const handleAttendanceChange = (userId, value) => {
    setAttendanceData(prev => ({ ...prev, [userId]: value }));
  };

  const handleSubmitAttendance = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const records = Object.entries(attendanceData).map(([userId, status]) => ({ userId, status }));
      await axios.post(`${config.API_URL}/user/mark-attendance`, { date, records }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Attendance submitted successfully!');
      setMessage('Attendance submitted successfully.');
    } catch (err) {
      toast.error('Failed to submit attendance.');
      setMessage('Failed to submit attendance.');
    }
    setLoading(false);
  };

  const handleViewAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/user/attendance?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const attendanceMap = {};
      response.data.forEach(record => { attendanceMap[record.userId] = record.status; });
      setAttendanceData(attendanceMap);
      setLoading(false);
    } catch (err) {
      setMessage('Failed to fetch attendance.');
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { startDate, endDate, employeeId } = reportFilters;
      let url = `${config.API_URL}/user/attendance-report?startDate=${startDate}&endDate=${endDate}`;
      if (employeeId) url += `&employeeId=${employeeId}`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setReportData(response.data);
      setLoading(false);
    } catch (err) {
      setMessage('Failed to fetch report.');
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { month, year } = monthlyFilters;
      const response = await axios.get(`${config.API_URL}/user/monthly-attendance?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMonthlySummary(response.data);
      setLoading(false);
    } catch (err) {
      setMessage('Failed to fetch summary.');
      setLoading(false);
    }
  };

  const exportAttendanceData = (format = 'csv') => {
    const headers = ['Employee', 'Present', 'Absent', 'Half Day', 'Leave', 'Attendance %'];
    const rows = reportData.map(d => [d.username, d.summary.present, d.summary.absent, d.summary.halfDay, d.summary.leave, d.summary.attendancePercentage.toFixed(2) + '%']);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report.${format}`;
    a.click();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMessage('');
    if (tab === 'monthly' && userRole === 'Admin') fetchMonthlySummary();
  };

  // formatCurrency replaced by global hook


  const getStatusClass = (status) => {
    if (!status) return '';
    const s = status.toLowerCase().replace('-', '_');
    if (s === 'present') return 'present';
    if (s === 'absent') return 'absent';
    if (s === 'late') return 'late';
    if (s === 'leave' || s === 'on_leave') return 'leave';
    if (s === 'half_day' || s === 'half-day') return 'half_day';
    return '';
  };

  // Calculate stats for Admin
  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendanceData).filter(s => s === 'late').length;

  // Filter employees by search term
  const filteredEmployees = employees.filter(emp =>
    emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter report data
  const filteredReportData = reportData.filter(userData =>
    userData.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userData.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter monthly summary
  const filteredMonthlySummary = monthlySummary.filter(s =>
    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="att-page">
      <div className="att-header">
        <h1>Attendance Manager</h1>
      </div>

      {/* Tabs */}
      <div className="att-tabs">
        {userRole === 'Admin' && (
          <button className={`att-tab ${activeTab === 'mark' ? 'active' : ''}`} onClick={() => handleTabChange('mark')}>
            Mark Attendance
          </button>
        )}
        <button className={`att-tab ${activeTab === 'view' ? 'active' : ''}`} onClick={() => handleTabChange('view')}>
          {userRole === 'Admin' ? 'View Attendance' : 'My Attendance'}
        </button>
        <button className={`att-tab ${activeTab === 'report' ? 'active' : ''}`} onClick={() => handleTabChange('report')}>
          {userRole === 'Admin' ? 'Reports' : 'My Report'}
        </button>
        {userRole === 'Admin' && (
          <button className={`att-tab ${activeTab === 'monthly' ? 'active' : ''}`} onClick={() => handleTabChange('monthly')}>
            Monthly Summary
          </button>
        )}
      </div>

      {message && <div className={`att-message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

      {loading && (
        <div className="att-loading">
          <div className="att-spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {/* MARK ATTENDANCE TAB */}
      {activeTab === 'mark' && userRole === 'Admin' && !loading && (
        <>
          <div className="att-date-picker">
            <label>Date:</label>
            <input type="date" className="att-date-input" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="att-stats">
            <div className="att-stat-card">
              <div className="att-stat-value blue">{employees.length}</div>
              <div className="att-stat-label">Total</div>
            </div>
            <div className="att-stat-card">
              <div className="att-stat-value green">{presentCount}</div>
              <div className="att-stat-label">Present</div>
            </div>
            <div className="att-stat-card">
              <div className="att-stat-value red">{absentCount}</div>
              <div className="att-stat-label">Absent</div>
            </div>
          </div>

          <div className="att-search">
            <div className="att-search-box">
              <i className="fas fa-search att-search-icon"></i>
              <input
                type="text"
                className="att-search-input"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button className="att-search-clear" onClick={() => setSearchTerm('')}>×</button>}
            </div>
          </div>

          <div className="att-table-container">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div className="att-employee-cell">
                        <div className="att-employee-avatar">{emp.username?.charAt(0).toUpperCase()}</div>
                        <span>{emp.username}</span>
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td>
                      <select
                        className={`att-status-select status-${attendanceData[emp._id] || 'present'}`}
                        value={attendanceData[emp._id] || 'present'}
                        onChange={(e) => handleAttendanceChange(emp._id, e.target.value)}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="half-day">Half Day</option>
                        <option value="leave">Leave</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


          <button className="att-submit-btn" onClick={handleSubmitAttendance} disabled={loading} style={{ marginTop: '1.5rem' }}>
            <i className="fas fa-check"></i> Submit Attendance
          </button>

        </>
      )}

      {/* VIEW ATTENDANCE TAB */}
      {activeTab === 'view' && !loading && (
        <>
          <div className="att-date-picker">
            <label>Date:</label>
            <input type="date" className="att-date-input" value={date} onChange={(e) => { setDate(e.target.value); setTimeout(() => userRole === 'Admin' ? handleViewAttendance() : fetchMyAttendance(), 100); }} max={new Date().toISOString().split('T')[0]} />
          </div>

          {userRole === 'Admin' && (
            <>
              <div className="att-search">
                <div className="att-search-box">
                  <i className="fas fa-search att-search-icon"></i>
                  <input
                    type="text"
                    className="att-search-input"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && <button className="att-search-clear" onClick={() => setSearchTerm('')}>×</button>}
                </div>
              </div>
              <div className="att-table-container">
                <table className="att-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(emp => (

                      <tr key={emp._id}>
                        <td>{emp.username}</td>
                        <td>{emp.email}</td>
                        <td><span className={`att-status ${getStatusClass(attendanceData[emp._id])}`}>{attendanceData[emp._id] || 'Not Marked'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {userRole === 'Employee' && myAttendanceData && (
            <div className="att-my-attendance">
              <h3>Your Attendance for {new Date(date).toLocaleDateString()}</h3>
              <span className={`att-status att-my-status ${getStatusClass(myAttendanceData.status)}`}>{myAttendanceData.status}</span>
            </div>
          )}
        </>
      )}


      {/* REPORTS TAB */}
      {activeTab === 'report' && !loading && (
        <>
          <div className="att-filters">
            <div className="att-filter-group">
              <label>Start Date</label>
              <input type="date" value={reportFilters.startDate} onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })} />
            </div>
            <div className="att-filter-group">
              <label>End Date</label>
              <input type="date" value={reportFilters.endDate} onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })} max={new Date().toISOString().split('T')[0]} />
            </div>
            {userRole === 'Admin' && (
              <div className="att-filter-group">
                <label>Employee</label>
                <select value={reportFilters.employeeId} onChange={(e) => setReportFilters({ ...reportFilters, employeeId: e.target.value })}>
                  <option value="">All Employees</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.username}</option>)}
                </select>
              </div>
            )}
            <button className="att-filter-btn" onClick={userRole === 'Admin' ? fetchAttendanceReport : fetchMyAttendance}>Generate</button>
          </div>

          {reportData.length > 0 && (
            <>
              {userRole === 'Admin' && (
                <div className="att-search">
                  <div className="att-search-box">
                    <i className="fas fa-search att-search-icon"></i>
                    <input
                      type="text"
                      className="att-search-input"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button className="att-search-clear" onClick={() => setSearchTerm('')}>×</button>}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="att-export-btn" onClick={() => exportAttendanceData('csv')}>
                  <i className="fas fa-download"></i> Export CSV
                </button>
                <div className="att-legend">
                  <span className="att-legend-item"><span className="att-dot present"></span> Present</span>
                  <span className="att-legend-item"><span className="att-dot absent"></span> Absent</span>
                  <span className="att-legend-item"><span className="att-dot late"></span> Late</span>
                  <span className="att-legend-item"><span className="att-dot leave"></span> Leave</span>
                </div>
              </div>

              {filteredReportData.map(userData => (
                <div className="att-report-card" key={userData.userId}>
                  <div className="att-report-header">
                    <div className="att-report-avatar">{userData.username?.charAt(0).toUpperCase()}</div>
                    <div className="att-report-info">
                      <h3>{userData.username}</h3>
                      <p>{userData.email}</p>
                    </div>
                    <div className="att-report-rate">
                      <span className="rate-value">{userData.summary.attendancePercentage.toFixed(0)}%</span>
                      <span className="rate-label">Attendance</span>
                    </div>
                  </div>

                  <div className="att-calendar-grid">
                    {userData.records && userData.records.map((record, idx) => {
                      const dateObj = new Date(record.date);
                      const day = dateObj.getDate();
                      return (
                        <div
                          key={idx}
                          className={`att-calendar-day ${getStatusClass(record.status)}`}
                          title={`${dateObj.toLocaleDateString()}: ${record.status}`}
                        >
                          <span className="day-num">{day}</span>
                          <span className="day-dot"></span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="att-report-summary">
                    <div className="att-report-stat">
                      <span className="stat-num green">{userData.summary.present}</span>
                      <span className="stat-label">Present</span>
                    </div>
                    <div className="att-report-stat">
                      <span className="stat-num red">{userData.summary.absent}</span>
                      <span className="stat-label">Absent</span>
                    </div>
                    <div className="att-report-stat">
                      <span className="stat-num orange">{userData.summary.halfDay}</span>
                      <span className="stat-label">Half Day</span>
                    </div>
                    <div className="att-report-stat">
                      <span className="stat-num blue">{userData.summary.leave}</span>
                      <span className="stat-label">Leave</span>
                    </div>
                    {userRole === 'Admin' && (
                      <>
                        <div className="att-report-stat">
                          <span className="stat-num">{formatMoney(userData.salary)}</span>
                          <span className="stat-label">Base Salary</span>
                        </div>
                        <div className="att-report-stat">
                          <span className="stat-num green">{formatMoney(userData.summary.adjustedSalary)}</span>
                          <span className="stat-label">Net Salary</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}


      {/* MONTHLY SUMMARY TAB */}
      {activeTab === 'monthly' && userRole === 'Admin' && !loading && (
        <>
          <div className="att-filters">
            <div className="att-filter-group">
              <label>Month</label>
              <select value={monthlyFilters.month} onChange={(e) => setMonthlyFilters({ ...monthlyFilters, month: e.target.value })}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="att-filter-group">
              <label>Year</label>
              <select value={monthlyFilters.year} onChange={(e) => setMonthlyFilters({ ...monthlyFilters, year: e.target.value })}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button className="att-filter-btn" onClick={fetchMonthlySummary}>Generate</button>
          </div>

          {monthlySummary.length > 0 && (
            <>
              <div className="att-search">
                <div className="att-search-box">
                  <i className="fas fa-search att-search-icon"></i>
                  <input
                    type="text"
                    className="att-search-input"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && <button className="att-search-clear" onClick={() => setSearchTerm('')}>×</button>}
                </div>
              </div>

              <div className="att-table-container">
                <table className="att-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Half</th>
                      <th>Leave</th>
                      <th>Attendance</th>
                      <th>Base Salary</th>
                      <th>Net Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonthlySummary.map(s => (
                      <tr key={s.employeeId}>
                        <td>{s.username}</td>
                        <td><span className="att-status present">{s.present}</span></td>
                        <td><span className="att-status absent">{s.absent}</span></td>
                        <td>{s.halfDay}</td>
                        <td>{s.leave}</td>
                        <td>{s.attendancePercentage}%</td>
                        <td>{formatMoney(s.baseSalary)}</td>
                        <td style={{ color: '#10b981', fontWeight: '600' }}>{formatMoney(s.adjustedSalary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button className="att-export-btn" onClick={() => exportAttendanceData('csv')}>Export CSV</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
