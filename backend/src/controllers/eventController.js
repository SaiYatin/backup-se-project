const { Event, User, Pledge } = require('../models');
const { auditLog } = require('../utils/logger');
const { Op } = require('sequelize');

// Log environment for debugging
console.log("🚀 NODE_ENV =", process.env.NODE_ENV);

// ===============================
// ✅ CREATE EVENT (with approval workflow)
// ===============================
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, target_amount, end_date, category, image_url } = req.body;
    const userRole = req.user.role;

    // APPROVAL WORKFLOW:
    // - Admins create events that are immediately active
    // - Organizers create events that need approval (pending)
    // - In development, optionally make all events active for testing
    const eventStatus = userRole === 'admin' 
      ? 'active' 
      : (process.env.NODE_ENV === 'development' && process.env.AUTO_APPROVE === 'true')
        ? 'active'
        : 'pending';

    console.log(`🟢 Creating event with status: ${eventStatus} (role: ${userRole})`);

    const event = await Event.create({
      title,
      description,
      target_amount,
      end_date,
      category,
      image_url,
      organizer_id: req.user.id,
      status: eventStatus,
      current_amount: 0,
    });

    // ✅ Double-check DB update in case Sequelize overrides defaults
    if (event.status !== eventStatus) {
      await event.update({ status: eventStatus });
      console.log('✅ Forced status update after creation');
    }

    const eventWithOrganizer = await Event.findByPk(event.id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Audit log
    auditLog.create?.('Event', event.id, req.user.id, {
      title: event.title,
      status: eventStatus,
      role: userRole
    });

    const message = eventStatus === 'pending'
      ? 'Event created successfully! Waiting for admin approval.'
      : 'Event created and published successfully!';

    res.status(201).json({
      success: true,
      message,
      data: eventWithOrganizer,
    });
  } catch (error) {
    console.error('❌ Event creation failed:', error);
    next(error);
  }
};

// ===============================
// ✅ GET ALL EVENTS (with filters + search)
// ===============================
exports.getAllEvents = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    const userRole = req.user?.role;

    const whereClause = {};

    // Non-admins can see active and completed events (not pending/rejected)
    // Admins can see all events or filter by status
    if (userRole !== 'admin') {
      whereClause.status = { [Op.in]: ['active', 'completed'] };
    } else if (status) {
      whereClause.status = status;
    }

    if (category) whereClause.category = category;

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

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

// ===============================
// ✅ GET SINGLE EVENT BY ID
// ===============================
exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Pledge,
          as: 'pledges',
          include: [
            {
              model: User,
              as: 'donor',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// ✅ GET EVENTS CREATED BY ORGANIZER
// ===============================
exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: { organizer_id: req.user.id },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Pledge,
          as: 'pledges',
          include: [
            {
              model: User,
              as: 'donor',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Add pledge statistics
    const eventsWithStats = events.map(event => {
      const pledges = event.pledges || [];
      const pledgeCount = pledges.length;
      const currentAmount = pledges.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      return {
        ...event.toJSON(),
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

// ===============================
// ✅ UPDATE EVENT
// ===============================
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, target_amount, end_date, category, image_url } = req.body;
    const userRole = req.user.role;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check permissions
    if (event.organizer_id !== req.user.id && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own events'
      });
    }

    // If organizer updates an approved event, set back to pending
    // (Admin updates don't change status)
    const updateData = {
      title: title || event.title,
      description: description || event.description,
      target_amount: target_amount || event.target_amount,
      end_date: end_date || event.end_date,
      category: category || event.category
    };

    if (image_url !== undefined) {
      updateData.image_url = image_url;
    }

    // If organizer updates an active event, require re-approval
    if (userRole === 'organizer' && event.status === 'active') {
      updateData.status = 'pending';
      console.log('⚠️ Event updated by organizer - status reset to pending for re-approval');
    }

    await event.update(updateData);

    const updatedEvent = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    auditLog.update?.('Event', event.id, req.user.id, {
      title: updatedEvent.title,
      target_amount: updatedEvent.target_amount,
      category: updatedEvent.category,
      statusChange: updateData.status ? `active → pending` : 'no change'
    });

    const message = updateData.status === 'pending'
      ? 'Event updated successfully! Changes require admin re-approval.'
      : 'Event updated successfully';

    res.json({
      success: true,
      message,
      data: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// ✅ DELETE EVENT
// ===============================
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check permissions
    if (event.organizer_id !== req.user.id && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own events'
      });
    }

    auditLog.delete?.('Event', event.id, req.user.id, {
      title: event.title,
      status: event.status
    });

    await event.destroy();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// ✅ CLOSE EVENT (NEW - for organizers to manually close events)
// ===============================
exports.closeEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check permissions
    if (event.organizer_id !== req.user.id && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to close this event'
      });
    }

    // Update status to completed
    await event.update({ status: 'completed' });

    auditLog.update?.('Event', event.id, req.user.id, {
      action: 'closed',
      title: event.title,
      oldStatus: 'active',
      newStatus: 'completed'
    });

    console.log(`✅ Event closed: ${event.title} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Event closed successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};