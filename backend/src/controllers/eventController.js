const storage = require('../config/database');
const { v4: uuidv4 } = require('crypto');

// Get all events
exports.getAllEvents = async (req, res, next) => {
  try {
    const events = storage.events.map(event => {
      const organizer = storage.users.find(u => u.id === event.organizerId);
      return {
        ...event,
        organizerName: organizer ? organizer.name : 'Unknown'
      };
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// Get event by ID
exports.getEventById = async (req, res, next) => {
  try {
    const event = storage.events.find(e => e.id === req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const organizer = storage.users.find(u => u.id === event.organizerId);
    
    res.json({
      success: true,
      data: {
        ...event,
        organizerName: organizer ? organizer.name : 'Unknown'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create event
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, targetAmount, category, endDate, image } = req.body;

    const event = {
      id: uuidv4(),
      organizerId: req.user.id,
      title,
      description,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      category,
      endDate,
      image,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    storage.events.push(event);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// Search events
exports.searchEvents = async (req, res, next) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    
    const filteredEvents = storage.events.filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query)
    );

    res.json({
      success: true,
      data: filteredEvents
    });
  } catch (error) {
    next(error);
  }
};