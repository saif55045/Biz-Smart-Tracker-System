const User = require('../models/User');
const Attendance = require('../models/Attendance');
const CompanySettings = require('../models/CompanySettings');
const mongoose = require('mongoose');

// Mark attendance for employees
exports.markAttendance = async (req, res) => {
  const { date, records } = req.body;
  const { company_name } = req.user;

  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Invalid request format. Date and records are required.' });
  }

  try {
    const targetDate = new Date(date);

    const bulkOps = [];

    for (const record of records) {
      const { userId, status, notes, checkinTime, checkoutTime, workHours } = record;

      // Verify the user belongs to the company
      const user = await User.findOne({ _id: userId, company_name });
      if (!user) {
        continue;
      }

      // Use findOneAndUpdate with upsert for efficiency
      bulkOps.push({
        updateOne: {
          filter: {
            userId,
            date: {
              $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
              $lt: new Date(targetDate.setHours(23, 59, 59, 999))
            },
            company_name
          },
          update: {
            $set: {
              status,
              notes,
              checkinTime: checkinTime || undefined,
              checkoutTime: checkoutTime || undefined,
              workHours: workHours || 8
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    return res.status(200).json({ message: 'Attendance marked successfully.' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({ message: 'Server error while marking attendance.' });
  }
};

// Get all employees for attendance marking
exports.getAllEmployees = async (req, res) => {
  try {
    const { company_name } = req.user;
    const users = await User.find({ company_name, role: 'Employee' }, 'name username email salary');
    res.status(200).json(users);

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
};

// View attendance for a specific date
exports.viewAttendance = async (req, res) => {
  console.log('attendence view called');
  const { date } = req.query;
  const { company_name } = req.user;

  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }

  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)); const attendanceRecords = await Attendance.find({
      company_name,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'name username email');
    console.log('attendanceRecords', attendanceRecords);
    // Get all employees
    const allEmployees = await User.find({ company_name, role: 'Employee' }, 'name username email');

    // Format response to include all employees (even those without attendance)
    const formattedRecords = allEmployees.map(employee => {
      const record = attendanceRecords.find(
        att => att.userId && att.userId._id.toString() === employee._id.toString()
      );
      return {
        userId: employee._id,
        name: employee.name || employee.username, // Use username if name is not available
        username: employee.username,
        email: employee.email,
        status: record ? record.status : 'absent',
        checkinTime: record ? record.checkinTime : null,
        checkoutTime: record ? record.checkoutTime : null,
        notes: record ? record.notes : null,
        recordId: record ? record._id : null
      };
    });

    res.status(200).json(formattedRecords);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ message: 'Failed to fetch attendance.' });
  }
};

// Get attendance report for a date range
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const { company_name } = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    const query = {
      company_name,
      date: { $gte: start, $lte: end }
    };

    // Filter by userId if provided
    if (userId) {
      query.userId = mongoose.Types.ObjectId(userId);
    }    // Fetch attendance records
    const records = await Attendance.find(query)
      .populate('userId', 'name username email salary')
      .sort({ date: 1 });

    // Group records by user
    const userMap = {};
    records.forEach(record => {
      const user = record.userId;
      if (!user) return;

      const userId = user._id.toString(); if (!userMap[userId]) {
        userMap[userId] = {
          userId: userId,
          name: user.name || user.username, // Use username as fallback if name is not available
          username: user.username,
          email: user.email,
          salary: user.salary,
          records: [],
          summary: {
            present: 0,
            absent: 0,
            halfDay: 0,
            leave: 0,
            totalDays: 0,
            attendancePercentage: 0,
            adjustedSalary: 0
          }
        };
      }

      userMap[userId].records.push({
        date: record.date,
        status: record.status,
        notes: record.notes
      });

      // Update summary stats
      userMap[userId].summary.totalDays++;

      switch (record.status) {
        case 'present':
          userMap[userId].summary.present++;
          break;
        case 'absent':
          userMap[userId].summary.absent++;
          break;
        case 'half-day':
          userMap[userId].summary.halfDay++;
          break;
        case 'leave':
          userMap[userId].summary.leave++;
          break;
      }
    });

    // Get company settings for deduction amounts
    const settings = await CompanySettings.getOrCreate(company_name);
    const absenceDeduction = settings.absenceDeduction || 0;
    const halfDayDeduction = settings.halfDayDeduction || 0;
    const lateDeduction = settings.lateDeduction || 0;

    // Calculate attendance percentage and adjusted salary
    Object.values(userMap).forEach(userData => {
      const effectivePresent =
        userData.summary.present +
        (userData.summary.halfDay * 0.5) +
        userData.summary.leave;

      userData.summary.attendancePercentage =
        userData.summary.totalDays > 0
          ? (effectivePresent / userData.summary.totalDays) * 100
          : 0;

      // Calculate adjusted salary using configured deductions
      const monthlySalary = userData.salary || 0;
      const lateCount = userData.records ? userData.records.filter(r => r.status === 'late').length : 0;
      const deductions = (userData.summary.absent * absenceDeduction) + (userData.summary.halfDay * halfDayDeduction) + (lateCount * lateDeduction);
      userData.summary.adjustedSalary = Math.max(0, monthlySalary - deductions);
    });

    res.status(200).json(Object.values(userMap));
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ message: 'Server error while generating report.' });
  }
};

// Get monthly attendance summary for all employees
exports.getMonthlyAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { company_name } = req.user;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Create date range for the month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);    // Get all employees
    const employees = await User.find({ company_name, role: 'Employee' }, 'name username email salary');

    // Get attendance records for the month
    const attendanceRecords = await Attendance.find({
      company_name,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate number of working days in the month
    const workingDays = getWorkingDaysInMonth(parseInt(year), parseInt(month) - 1);

    // Get company settings for deduction amounts (fetch once, not per employee)
    const settings = await CompanySettings.getOrCreate(company_name);
    const absenceDeduction = settings.absenceDeduction || 0;
    const halfDayDeduction = settings.halfDayDeduction || 0;
    const lateDeduction = settings.lateDeduction || 0;

    // Prepare the monthly summary for each employee
    const monthlySummary = employees.map(employee => {
      // Filter records for this employee
      const employeeRecords = attendanceRecords.filter(
        record => record.userId && record.userId.toString() === employee._id.toString()
      );

      // Count different attendance statuses
      const present = employeeRecords.filter(r => r.status === 'present').length;
      const absent = employeeRecords.filter(r => r.status === 'absent').length;
      const halfDay = employeeRecords.filter(r => r.status === 'half-day').length;
      const leave = employeeRecords.filter(r => r.status === 'leave').length;

      // Calculate attendance percentage
      const effectivePresent = present + (halfDay * 0.5) + leave;
      const attendancePercentage = (employeeRecords.length > 0)
        ? (effectivePresent / workingDays) * 100
        : 0;

      // Calculate salary adjustments using configured deductions
      const monthlySalary = employee.salary || 0;
      const lateCount = employeeRecords.filter(r => r.status === 'late').length;
      const deductions = (absent * absenceDeduction) + (halfDay * halfDayDeduction) + (lateCount * lateDeduction);
      const adjustedSalary = Math.max(0, monthlySalary - deductions); return {
        employeeId: employee._id,
        name: employee.name || employee.username, // Use username if name is not available
        username: employee.username,
        email: employee.email,
        baseSalary: monthlySalary,
        present,
        absent,
        halfDay,
        leave,
        unrecorded: workingDays - (present + absent + halfDay + leave),
        attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
        deductions: parseFloat(deductions.toFixed(2)),
        adjustedSalary: parseFloat(adjustedSalary.toFixed(2)),
        workingDays
      };
    });

    res.status(200).json(monthlySummary);
  } catch (error) {
    console.error('Error generating monthly attendance summary:', error);
    res.status(500).json({ message: 'Server error while generating monthly summary.' });
  }
};

// Export attendance data as CSV
exports.exportAttendance = async (req, res) => {
  try {
    const { format, startDate, endDate, employeeId } = req.query;
    const { company_name } = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const query = {
      company_name,
      date: { $gte: start, $lte: end }
    };

    if (employeeId) {
      query.userId = mongoose.Types.ObjectId(employeeId);
    } const records = await Attendance.find(query)
      .populate('userId', 'name username email salary')
      .sort({ date: 1 });

    if (format === 'csv') {
      // Generate CSV content      const csvHeader = 'Employee ID,Employee Name,Email,Date,Status,Notes\n';
      const csvRows = records.map(record => {
        const user = record.userId || { username: 'Unknown', email: 'unknown' };
        return `${user._id || ''},${user.username || ''},${user.email || ''},${formatDate(record.date)},${record.status || ''},${(record.notes || '').replace(/,/g, ';')}`;
      });

      const csvContent = csvHeader + csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${formatDate(start)}_to_${formatDate(end)}.csv`);
      return res.status(200).send(csvContent);
    } else {
      // Return JSON by default
      return res.status(200).json(records);
    }
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ message: 'Server error while exporting attendance data.' });
  }
};

// Get employee's own attendance (for Employee role)
exports.viewMyAttendance = async (req, res) => {
  const { date } = req.query;
  // Use req.user.id instead of req.user._id because the JWT token contains 'id' not '_id'
  const { id, company_name } = req.user;

  console.log('viewMyAttendance called with user ID:', id);
  console.log('User object from request:', req.user);

  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }

  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Convert string ID to ObjectId if needed
    let userId = id;
    if (mongoose.Types.ObjectId.isValid(id)) {
      userId = new mongoose.Types.ObjectId(id);
    }

    // Find the employee's own attendance record
    const attendanceRecord = await Attendance.findOne({
      company_name,
      userId: userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log('Looking for user with ID:', userId);

    // Try more flexible query to find the user
    const employee = await User.findOne({ _id: userId });
    console.log('Employee found:', employee);

    if (!employee) {
      console.log('User DB query returned null/undefined');
      return res.status(404).json({ message: 'Employee not found.' });
    }
    const formattedRecord = {
      userId: employee._id,
      name: employee.username, // Always use username
      username: employee.username,
      email: employee.email,
      status: attendanceRecord ? attendanceRecord.status : 'Not marked',
      checkinTime: attendanceRecord ? attendanceRecord.checkinTime : null,
      checkoutTime: attendanceRecord ? attendanceRecord.checkoutTime : null,
      notes: attendanceRecord ? attendanceRecord.notes : null,
      recordId: attendanceRecord ? attendanceRecord._id : null
    };

    res.status(200).json(formattedRecord);
  } catch (err) {
    console.error('Error fetching employee attendance:', err);
    res.status(500).json({ message: 'Failed to fetch attendance.' });
  }
};

// Get employee's own attendance report (for Employee role)
exports.getMyAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { id, company_name } = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    // Convert string ID to ObjectId if needed
    let userId = id;
    if (mongoose.Types.ObjectId.isValid(id)) {
      userId = new mongoose.Types.ObjectId(id);
    }

    // Fetch the employee's attendance records
    const records = await Attendance.find({
      company_name,
      userId: userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Get the employee information
    const employee = await User.findOne({ _id: userId }, 'name email salary');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    // Create the response format similar to getAttendanceReport
    const userData = {
      userId: employee._id.toString(),
      name: employee.username, // Always use username
      username: employee.username,
      email: employee.email,
      salary: employee.salary,
      records: records.map(record => ({
        date: record.date,
        status: record.status,
        notes: record.notes
      })),
      summary: {
        present: 0,
        absent: 0,
        halfDay: 0,
        leave: 0,
        totalDays: records.length,
        attendancePercentage: 0,
        adjustedSalary: 0
      }
    };

    // Update summary stats
    records.forEach(record => {
      switch (record.status) {
        case 'present':
          userData.summary.present++;
          break;
        case 'absent':
          userData.summary.absent++;
          break;
        case 'half-day':
          userData.summary.halfDay++;
          break;
        case 'leave':
          userData.summary.leave++;
          break;
      }
    });

    // Calculate attendance percentage and adjusted salary
    const effectivePresent =
      userData.summary.present +
      (userData.summary.halfDay * 0.5) +
      userData.summary.leave;

    userData.summary.attendancePercentage =
      userData.summary.totalDays > 0
        ? (effectivePresent / userData.summary.totalDays) * 100
        : 0;

    // Get company settings for deduction amounts
    const settings = await CompanySettings.getOrCreate(company_name);
    const absenceDeduction = settings.absenceDeduction || 0;
    const halfDayDeduction = settings.halfDayDeduction || 0;
    const lateDeduction = settings.lateDeduction || 0;

    // Calculate adjusted salary using configured deductions
    const monthlySalary = employee.salary || 0;
    const lateCount = records.filter(r => r.status === 'late').length;
    const deductions = (userData.summary.absent * absenceDeduction) + (userData.summary.halfDay * halfDayDeduction) + (lateCount * lateDeduction);
    userData.summary.adjustedSalary = Math.max(0, monthlySalary - deductions);

    res.status(200).json([userData]); // Return as array for frontend compatibility
  } catch (error) {
    console.error('Error generating employee attendance report:', error);
    res.status(500).json({ message: 'Server error while generating report.' });
  }
};

// Helper function to calculate working days in a month (excluding weekends)
function getWorkingDaysInMonth(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let count = 0;

  for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    // Count if not Saturday (6) or Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }

  return count;
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}