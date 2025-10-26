const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// Protected routes - Organizer only
router.post('/', authenticate, checkRole('organizer', 'admin'), eventController.createEvent);
router.get('/my/events', authenticate, checkRole('organizer'), eventController.getMyEvents);
router.put('/:id', authenticate, checkRole('organizer'), eventController.updateEvent);
router.delete('/:id', authenticate, checkRole('organizer'), eventController.deleteEvent);

module.exports = router;