const { Event, User, Pledge } = require('../models');
const { auditLog } = require('../utils/logger');
const { Op } = require('sequelize');

// Log environment for debugging
console.log("🚀 NODE_ENV =", process.env.NODE_ENV);

// ===============================
// ✅ CREATE EVENT
// ===============================
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, target_amount, end_date, category } = req.body;

    // Force all dev-mode events to be active
    const eventStatus =
      process.env.NODE_ENV === 'development' ? 'active' : 'pending';

    console.log('🟢 Creating event with status:', eventStatus);

    const event = await Event.create({
      title,
      description,
      target_amount,
      end_date,
      category,
      organizer_id: req.user.id,
      status: eventStatus, // explicitly set BEFORE DB default
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

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
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

    const whereClause = {};
    if (status) whereClause.status = status;
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
      include: [{ model: Pledge, as: 'pledges' }],
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
// ✅ UPDATE EVENT
// ===============================
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, target_amount, end_date, category } = req.body;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own events'
      });
    }

    await event.update({
      title: title || event.title,
      description: description || event.description,
      target_amount: target_amount || event.target_amount,
      end_date: end_date || event.end_date,
      category: category || event.category
    });

    const updatedEvent = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    auditLog.update('Event', event.id, req.user.id, {
      title: updatedEvent.title,
      target_amount: updatedEvent.target_amount,
      category: updatedEvent.category
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
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

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own events'
      });
    }

    auditLog.delete('Event', event.id, req.user.id, {
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
