const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(checkRole('admin'));

// View all data
router.get('/events', adminController.getAllEvents);
router.get('/pledges', adminController.getAllPledges);
router.get('/events/flagged', adminController.getFlaggedEvents);

// Event approval/rejection (Task 3)
router.put('/events/:id/approve', adminController.approveEvent);
router.put('/events/:id/reject', adminController.rejectEvent);
router.put('/events/:id/flag', adminController.flagEvent);

module.exports = router;