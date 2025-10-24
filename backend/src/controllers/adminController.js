const storage = require('../config/database');

// Get all events (admin)
exports.getAllEvents = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: storage.events
    });
  } catch (error) {
    next(error);
  }
};

// Get all pledges (admin)
exports.getAllPledges = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: storage.pledges
    });
  } catch (error) {
    next(error);
  }
};