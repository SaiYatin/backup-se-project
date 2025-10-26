const { Event, Pledge, User } = require('../models');
const { auditLog } = require('../utils/logger');
// TODO: Import Madhav's email service when ready
// const emailService = require('../services/emailService');

// Get all events (admin view)
exports.getAllEvents = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;

    const events = await Event.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// Get all pledges (admin view)
exports.getAllPledges = async (req, res, next) => {
  try {
    const pledges = await Pledge.findAll({
      include: [
        {
          model: User,
          as: 'donor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'organizer_id']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: pledges.length,
      data: pledges
    });
  } catch (error) {
    next(error);
  }
};

// Get flagged events
exports.getFlaggedEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: { status: 'rejected' }, // Using 'rejected' as flagged
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// Approve event (Task 3)
exports.approveEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Update status to active
    await event.update({ status: 'active' });

    // Log event approval
    auditLog.approve('Event', event.id, req.user.id, {
      title: event.title,
      organizerId: event.organizer_id
    });

    // TODO: Send approval email via Madhav's service
    // await emailService.sendApprovalEmail({
    //   to: event.organizer.email,
    //   eventTitle: event.title,
    //   eventId: event.id
    // });

    res.json({
      success: true,
      message: 'Event approved successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// Reject event (Task 3)
exports.rejectEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Update status to rejected
    await event.update({ status: 'rejected' });

    // Log event rejection
    auditLog.reject('Event', event.id, req.user.id, {
      title: event.title,
      organizerId: event.organizer_id,
      reason: reason || 'Does not meet guidelines'
    });

    // TODO: Send rejection email via Madhav's service
    // await emailService.sendRejectionEmail({
    //   to: event.organizer.email,
    //   eventTitle: event.title,
    //   reason: reason || 'Does not meet guidelines'
    // });

    res.json({
      success: true,
      message: 'Event rejected',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// Flag event (Task 3)
exports.flagEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Update status to rejected (using as flagged)
    await event.update({ status: 'rejected' });

    // TODO: Send flag notification via Madhav's service
    // await emailService.sendFlagNotification({
    //   to: event.organizer.email,
    //   eventTitle: event.title,
    //   reason: reason || 'Flagged for review'
    // });

    res.json({
      success: true,
      message: 'Event flagged successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};