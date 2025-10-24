const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

router.get('/events', authenticate, checkRole('admin'), adminController.getAllEvents);
router.get('/pledges', authenticate, checkRole('admin'), adminController.getAllPledges);

module.exports = router;