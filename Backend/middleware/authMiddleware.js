const jwt = require('jsonwebtoken');
const dotenv=require('dotenv');
dotenv.config();

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header is present
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract token

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = decoded;
    console.log('middleware');
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or Expired Token' });
  }
};

// Admin middleware - checks if the user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

module.exports = { authMiddleware, admin };
