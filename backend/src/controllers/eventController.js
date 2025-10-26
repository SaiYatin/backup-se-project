const { Event, User, Pledge } = require('../models');
const { auditLog } = require('../utils/logger');

// Create Event
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, target_amount, end_date, category } = req.body;

    // Create event with Sequelize
    const event = await Event.create({
      title,
      description,
      target_amount,
      end_date,
      category,
      organizer_id: req.user.id,
      status: 'pending', // Default status for admin approval
      current_amount: 0
    });

    // Include organizer info in response
    const eventWithOrganizer = await Event.findByPk(event.id, {
      include: [
        { 
          model: User, 
          as: 'organizer',
          attributes: ['id', 'name', 'email'] 
        }
      ]
    });

    // Log event creation
    auditLog.create('Event', event.id, req.user.id, {
      title: event.title,
      target_amount: event.target_amount,
      category: event.category
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: eventWithOrganizer
    });
  } catch (error) {
    next(error);
  }
};

// Get All Events
exports.getAllEvents = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    
    // Build filter conditions
    const whereClause = {};
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;

    // Fetch events with Sequelize
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

// Get Single Event
exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch event with related data
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

// Get Events by Organizer
exports.getMyEvents = async (req, res, next) => {
  try {
    // Get events created by logged-in user
    const events = await Event.findAll({
      where: { organizer_id: req.user.id },
      include: [
        {
          model: Pledge,
          as: 'pledges'
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

// Update Event (with ownership check)
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, target_amount, end_date, category } = req.body;

    // Find event
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Security check: Only organizer can update
    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own events'
      });
    }

    // Update event
    await event.update({
      title: title || event.title,
      description: description || event.description,
      target_amount: target_amount || event.target_amount,
      end_date: end_date || event.end_date,
      category: category || event.category
    });

    // Fetch updated event with relations
    const updatedEvent = await Event.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'organizer',
          attributes: ['id', 'name', 'email'] 
        }
      ]
    });

    // Log event update
    auditLog.update('Event', event.id, req.user.id, {
      title: title || event.title,
      target_amount: target_amount || event.target_amount,
      category: category || event.category
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

// Delete Event (with ownership check)
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find event
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Security check: Only organizer can delete
    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own events'
      });
    }

    // Log event deletion
    auditLog.delete('Event', event.id, req.user.id, {
      title: event.title,
      status: event.status
    });

    // Delete event
    await event.destroy();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};