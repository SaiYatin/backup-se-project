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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
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

      // Auth Routes
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/profile',
      'PUT  /api/auth/profile',

      // Event Routes
      'GET    /api/events',
      'GET    /api/events/:id',
      'POST   /api/events (organizer)',
      'GET    /api/events/my/events (organizer)',
      'PUT    /api/events/:id (organizer)',
      'DELETE /api/events/:id (organizer)',

      // Pledge Routes
      'POST   /api/pledges',
      'GET    /api/pledges',
      'GET    /api/pledges/my',
      'GET    /api/pledges/my-events (organizer)',
      'GET    /api/pledges/:id',
      'PUT    /api/pledges/:id/status (organizer)',

      // Admin Routes
      'GET    /api/admin/events',
      'GET    /api/admin/pledges',
      'GET    /api/admin/events/flagged',
      'PUT    /api/admin/events/:id/approve',
      'PUT    /api/admin/events/:id/reject',
      'PUT    /api/admin/events/:id/flag',

      // Report Routes
      'GET /api/reports/admin/dashboard (admin)',
      'GET /api/reports/organizer/summary (organizer)',
      'GET /api/reports/event/:id/analytics',
      'GET /api/reports/donor/activity'
    ]
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;