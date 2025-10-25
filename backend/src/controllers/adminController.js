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

// ✅ Add to adminController.js
exports.approveEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    event.status = 'active';
    await event.save();

    // Send notification to organizer
    const organizer = await User.findByPk(event.organizer_id);
    await emailService.sendEventApproved(organizer, event);

    res.json({
      success: true,
      message: 'Event approved',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectEvent = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    event.status = 'rejected';
    await event.save();

    // Send notification to organizer
    const organizer = await User.findByPk(event.organizer_id);
    await emailService.sendEventRejected(organizer, event, reason);

    res.json({
      success: true,
      message: 'Event rejected',
      data: event
    });
  } catch (error) {
    next(error);
  }
};