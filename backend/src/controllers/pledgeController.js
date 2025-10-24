const storage = require('../config/database');
const { v4: uuidv4 } = require('crypto');

// Submit pledge
exports.submitPledge = async (req, res, next) => {
  try {
    const { eventId, amount, isAnonymous, message } = req.body;

    // Check if event exists
    const event = storage.events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const pledge = {
      id: uuidv4(),
      eventId,
      userId: req.user.id,
      userName: req.user.name,
      amount: parseFloat(amount),
      isAnonymous: isAnonymous || false,
      message,
      createdAt: new Date().toISOString()
    };

    storage.pledges.push(pledge);

    // Update event current amount
    event.currentAmount = (event.currentAmount || 0) + pledge.amount;

    res.status(201).json({
      success: true,
      message: 'Pledge submitted successfully',
      data: pledge
    });
  } catch (error) {
    next(error);
  }
};

// Get pledges for event
exports.getPledgesForEvent = async (req, res, next) => {
  try {
    const pledges = storage.pledges.filter(p => p.eventId === req.params.eventId);

    res.json({
      success: true,
      data: pledges
    });
  } catch (error) {
    next(error);
  }
};

// Get my pledges
exports.getMyPledges = async (req, res, next) => {
  try {
    const pledges = storage.pledges.filter(p => p.userId === req.user.id);

    res.json({
      success: true,
      data: pledges
    });
  } catch (error) {
    next(error);
  }
};