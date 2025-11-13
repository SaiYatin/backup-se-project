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
        },
        {
          model: Pledge,
          as: 'pledges'
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Add pledge statistics to each event
    const eventsWithStats = events.map(event => {
      const pledges = event.pledges || [];
      const pledgeCount = pledges.length;
      const currentAmount = pledges.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const eventData = event.toJSON();
      return {
        ...eventData,
        pledgeCount,
        current_amount: currentAmount
      };
    });

    res.json({
      success: true,
      count: eventsWithStats.length,
      data: eventsWithStats
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
      where: { status: 'flagged' }, // Look for 'flagged' status
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

// Approve event (FR-012: Admin approve/reject events)
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

    // Check if already active
    if (event.status === 'active') {
      return res.json({
        success: true,
        message: 'Event is already active',
        data: event
      });
    }

    // Update status to active
    await event.update({ status: 'active' });

    // Log event approval
    auditLog.approve?.('Event', event.id, req.user.id, {
      title: event.title,
      organizerId: event.organizer_id,
      organizerName: event.organizer?.name
    });

    console.log(`✅ Event approved: "${event.title}" by admin ${req.user.id}`);

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
    console.error('❌ Approve event error:', error);
    next(error);
  }
};

// Reject event (FR-012: Admin approve/reject events)
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
    auditLog.reject?.('Event', event.id, req.user.id, {
      title: event.title,
      organizerId: event.organizer_id,
      organizerName: event.organizer?.name,
      reason: reason || 'Does not meet guidelines'
    });

    console.log(`❌ Event rejected: "${event.title}" by admin ${req.user.id}`);
    if (reason) {
      console.log(`   Reason: ${reason}`);
    }

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
    console.error('❌ Reject event error:', error);
    next(error);
  }
};

// Flag event for review (FR-012 related)
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

    // Update status to flagged (for admin review)
    await event.update({ status: 'flagged' });

    // Log event flagging
    auditLog.update?.('Event', event.id, req.user.id, {
      action: 'flagged',
      title: event.title,
      reason: reason || 'Flagged for review',
      organizerId: event.organizer_id
    });

    console.log(`🚩 Event flagged: "${event.title}" by admin ${req.user.id}`);
    if (reason) {
      console.log(`   Reason: ${reason}`);
    }

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
    console.error('❌ Flag event error:', error);
    next(error);
  }
};