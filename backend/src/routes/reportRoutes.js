const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const { body, param, query } = require('express-validator');

// Validation middleware for report generation
const validateDailyReport = [
  body('date').optional().isISO8601().withMessage('Date must be in valid ISO format'),
];

const validateWeeklyReport = [
  body('start_date').optional().isISO8601().withMessage('Start date must be in valid ISO format'),
];

const validateMonthlyReport = [
  body('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
];

const validateEventId = [
  param('eventId').isInt().withMessage('Event ID must be a valid integer'),
];

const validateReportId = [
  param('reportId').isInt().withMessage('Report ID must be a valid integer'),
];

const validateReportQuery = [
  query('type').optional().isIn(['daily', 'weekly', 'monthly', 'event']).withMessage('Type must be daily, weekly, monthly, or event'),
  query('status').optional().isIn(['pending', 'completed', 'failed']).withMessage('Status must be pending, completed, or failed'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
  query('start_date').optional().isISO8601().withMessage('Start date must be in valid ISO format'),
  query('end_date').optional().isISO8601().withMessage('End date must be in valid ISO format'),
];

// Legacy admin reports (maintain backward compatibility)
router.get('/admin/dashboard', 
  authenticate, 
  checkRole('admin'), 
  reportController.getAdminDashboard
);

// Organizer reports (require organizer role)
router.get('/organizer/summary', 
  authenticate, 
  checkRole('organizer'), 
  reportController.getOrganizerSummary
);

// Event analytics (organizer or admin only)
router.get('/event/:id/analytics', 
  authenticate, 
  reportController.getEventAnalytics
);

// Donor activity (any authenticated user can see their own)
router.get('/donor/activity', 
  authenticate, 
  reportController.getDonorActivity
);

// === NEW REPORT SYSTEM ROUTES ===

// Generate Reports (Admin only)
router.post('/daily', 
  authenticate, 
  checkRole('admin'), 
  validateDailyReport,
  reportController.generateDailyReport
);

router.post('/weekly', 
  authenticate, 
  checkRole('admin'), 
  validateWeeklyReport,
  reportController.generateWeeklyReport
);

router.post('/monthly', 
  authenticate, 
  checkRole('admin'), 
  validateMonthlyReport,
  reportController.generateMonthlyReport
);

router.post('/event/:eventId', 
  authenticate, 
  validateEventId,
  reportController.generateEventReport
);

// Get Reports (Admin only)
router.get('/', 
  authenticate, 
  checkRole('admin'), 
  validateReportQuery,
  reportController.getReports
);

router.get('/:reportId', 
  authenticate, 
  checkRole('admin'), 
  validateReportId,
  reportController.getReportById
);

// Download Report (Admin only)
router.get('/:reportId/download', 
  authenticate, 
  checkRole('admin'), 
  validateReportId,
  reportController.downloadReport
);

// Platform Analytics & Dashboard Data (Admin only)
router.get('/analytics/overview', 
  authenticate, 
  checkRole('admin'), 
  reportController.getPlatformOverview
);

router.get('/analytics/top-performers', 
  authenticate, 
  checkRole('admin'), 
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days'),
  reportController.getTopPerformers
);

router.get('/analytics/category-analysis', 
  authenticate, 
  checkRole('admin'), 
  reportController.getCategoryAnalysis
);

// Event Statistics (Admin or Event Organizer)
router.get('/events/:eventId/stats', 
  authenticate, 
  validateEventId,
  query('includeDetails').optional().isBoolean().withMessage('includeDetails must be a boolean'),
  reportController.getEventStats
);

// Report Management (Admin only)
router.delete('/cleanup', 
  authenticate, 
  checkRole('admin'), 
  query('days_old').optional().isInt({ min: 30 }).withMessage('days_old must be at least 30'),
  reportController.cleanupReports
);

// Health Check Endpoint
router.get('/health', reportController.healthCheck || ((req, res) => {
  res.json({
    success: true,
    message: 'Reports service is healthy',
    timestamp: new Date().toISOString()
  });
}));

// Error handling middleware for this router
router.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (error.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  }
  
  // Log unexpected errors
  console.error('Report route error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error in reports service'
  });
});

module.exports = router;