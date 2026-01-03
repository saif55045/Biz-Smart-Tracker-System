const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const connectDB = require('./config/db');

// Custom MongoDB sanitization function (replaces express-mongo-sanitize which has compatibility issues)
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    // Skip keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      continue; // Remove dangerous keys
    }
    sanitized[key] = typeof obj[key] === 'object' ? sanitizeObject(obj[key]) : obj[key];
  }
  return sanitized;
};

const mongoSanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.params) req.params = sanitizeObject(req.params);
  // Note: req.query is read-only in newer Express, so we skip it
  // Query params are typically less dangerous as they go through URL encoding
  next();
};
require('./config/passport'); // load passport config
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryFieldRoutes = require('./routes/inventoryFieldRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const customerRoutes = require('./routes/customerRoutes');
const salesRoutes = require('./routes/salesRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const { checkProductStatus } = require('./controller/notificationController');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
connectDB();
const Port = process.env.PORT || 5000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Trust proxy - Required for Render/Heroku/Vercel deployments
// This allows express-rate-limit to correctly identify users behind a proxy
app.set('trust proxy', 1);

// Helmet: Sets various HTTP headers for security
// - X-XSS-Protection: Prevents reflected XSS attacks
// - X-Frame-Options: Prevents clickjacking
// - X-Content-Type-Options: Prevents MIME sniffing
app.use(helmet());

// Compression: Reduces response size by 70-90%
app.use(compression());

// Body Parser with size limit (prevents large payload attacks)
app.use(express.json({ limit: '10mb' }));

// MongoDB Sanitize: Prevents NoSQL injection attacks
// Uses custom function since express-mongo-sanitize has compatibility issues with newer Express
app.use(mongoSanitize);

// CORS: Restrict which origins can access your API
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// ============================================
// RATE LIMITING (Only for unauthenticated requests)
// ============================================

// Rate limiter ONLY for authentication endpoints (brute-force protection)
// Logged-in users are NOT rate limited for accessibility
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 login attempts per 15 minutes per IP
  message: { error: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Only apply rate limiting to authentication routes (not logged-in users)

// Apply strict limiter to auth-sensitive routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', otpRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryFieldRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settings', settingsRoutes);

// Check product status every hour
setInterval(checkProductStatus, 1000 * 60 * 60);

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO connection and event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join discussion room
  socket.on('join_discussion', (discussionId) => {
    socket.join(`discussion_${discussionId}`);
    console.log(`User joined discussion: ${discussionId}`);
  });

  // Leave discussion room
  socket.on('leave_discussion', (discussionId) => {
    socket.leave(`discussion_${discussionId}`);
    console.log(`User left discussion: ${discussionId}`);
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to our routes
app.set('io', io);

server.listen(Port, () => {
  console.log(`Server is Running on Port ${Port}`);
});