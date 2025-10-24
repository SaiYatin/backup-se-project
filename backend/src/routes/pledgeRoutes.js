const express = require('express');
const router = express.Router();
const pledgeController = require('../controllers/pledgeController');
const authenticate = require('../middleware/authMiddleware');

router.post('/', authenticate, pledgeController.submitPledge);
router.get('/event/:eventId', pledgeController.getPledgesForEvent);
router.get('/my', authenticate, pledgeController.getMyPledges);

module.exports = router;