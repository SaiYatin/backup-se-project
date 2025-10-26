const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// Admin reports (require admin role)
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

module.exports = router;