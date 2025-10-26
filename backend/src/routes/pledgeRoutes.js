const express = require('express');
const router = express.Router();
const pledgeController = require('../controllers/pledgeController');
const authenticate = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// All pledge routes require authentication
router.post('/', authenticate, pledgeController.createPledge);
router.get('/', authenticate, pledgeController.getAllPledges);
router.get('/my', authenticate, pledgeController.getMyPledges);
router.get('/my-events', authenticate, checkRole('organizer'), pledgeController.getPledgesForMyEvents);
router.get('/:id', authenticate, pledgeController.getPledgeById);
router.put('/:id/status', authenticate, checkRole('organizer'), pledgeController.updatePledgeStatus);

module.exports = router;