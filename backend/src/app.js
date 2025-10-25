const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const pledgeRoutes = require('./routes/pledgeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
// ✅ Enhance rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
  standardHeaders: true, // Add this
  legacyHeaders: false,  // Add this
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later'
    });
  }
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/pledges', pledgeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
// ✅ Better 404 handler
app.use('*', (req, res) => {
  logger.warn('404 Not Found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      // Health
      'GET /api/health',

      // Auth
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET  /api/auth/me',
      'POST /api/auth/refresh-token',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'GET  /api/auth/verify-email',

      // Events
      'GET    /api/events',
      'POST   /api/events',
      'GET    /api/events/:id',
      'PUT    /api/events/:id',
      'DELETE /api/events/:id',
      'GET    /api/events/:id/pledges',
      'GET    /api/events/categories',
      'GET    /api/events/search',

      // Pledges
      'POST   /api/pledges',
      'GET    /api/pledges',
      'GET    /api/pledges/:id',
      'PUT    /api/pledges/:id',
      'DELETE /api/pledges/:id',

      // Admin
      'GET    /api/admin/users',
      'GET    /api/admin/users/:id',
      'PUT    /api/admin/users/:id',
      'DELETE /api/admin/users/:id',
      'GET    /api/admin/events',
      'PUT    /api/admin/events/:id',
      'DELETE /api/admin/events/:id',
      'GET    /api/admin/stats',

      // Reports
      'GET /api/reports/donations',
      'GET /api/reports/events',
      'GET /api/reports/users',
      'GET /api/reports/monthly'
    ]
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;