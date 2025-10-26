const { Pledge, Event, User } = require('../models');
const { auditLog } = require('../utils/logger');
// Create Pledge
exports.createPledge = async (req, res, next) => {
  try {
    const { event_id, amount, message } = req.body;

    // Check if event exists and is approved
    const event = await Event.findByPk(event_id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Cannot pledge to inactive events'
      });
    }

    // Ensure numeric arithmetic for DECIMAL fields
    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid pledge amount' });
    }

    // Create pledge with Sequelize
    const pledge = await Pledge.create({
      event_id,
      donor_id: req.user.id,
      amount: numericAmount,
      message: message || '',
      payment_status: 'pending'
    });

    // Update event's current_amount (parse DECIMAL strings to numbers)
    await event.update({
      current_amount: parseFloat(event.current_amount || 0) + numericAmount
    });

    // Fetch pledge with related data
    const pledgeWithDetails = await Pledge.findByPk(pledge.id, {
      include: [
        {
          model: User,
          as: 'donor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'target_amount', 'current_amount']
        }
      ]
    });

    // Log pledge creation
    auditLog.create('Pledge', pledge.id, req.user.id, {
      event_id: event.id,
      amount: amount,
      payment_status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Pledge created successfully',
      data: pledgeWithDetails
    });
  } catch (error) {
    next(error);
  }
};

// Get All Pledges (Admin or specific filters)
exports.getAllPledges = async (req, res, next) => {
  try {
  const { event_id, status } = req.query;

    // Build filter conditions
    const whereClause = {};
  if (event_id) whereClause.event_id = event_id;
  if (status) whereClause.payment_status = status;

    // Fetch pledges with Sequelize
    const pledges = await Pledge.findAll({
      where: whereClause,
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

// Get Single Pledge
exports.getPledgeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch pledge with related data
    const pledge = await Pledge.findByPk(id, {
      include: [
        {
          model: User,
          as: 'donor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Event,
          as: 'event',
          include: [
            {
              model: User,
              as: 'organizer',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!pledge) {
      return res.status(404).json({
        success: false,
        error: 'Pledge not found'
      });
    }

    res.json({
      success: true,
      data: pledge
    });
  } catch (error) {
    next(error);
  }
};

// Get My Pledges (for logged-in donor)
exports.getMyPledges = async (req, res, next) => {
  try {
    // Get pledges made by logged-in user
    const pledges = await Pledge.findAll({
      where: { donor_id: req.user.id },
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'target_amount', 'current_amount', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

  // Calculate total pledged amount (parse DECIMAL strings)
  const totalPledged = pledges.reduce((sum, pledge) => sum + parseFloat(pledge.amount || 0), 0);

    res.json({
      success: true,
      count: pledges.length,
      totalPledged,
      data: pledges
    });
  } catch (error) {
    next(error);
  }
};

// Get Pledges for My Events (for organizers)
exports.getPledgesForMyEvents = async (req, res, next) => {
  try {
    // Get all events organized by the logged-in user
    const myEvents = await Event.findAll({
      where: { organizer_id: req.user.id },
      attributes: ['id']
    });

    const eventIds = myEvents.map(event => event.id);

    // Get all pledges for those events
    const pledges = await Pledge.findAll({
      where: { 
        event_id: eventIds 
      },
      include: [
        {
          model: User,
          as: 'donor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'target_amount', 'current_amount']
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

// Update Pledge Status (for organizers to mark as fulfilled)
exports.updatePledgeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Find pledge with event info
    const pledge = await Pledge.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'event'
        }
      ]
    });

    if (!pledge) {
      return res.status(404).json({
        success: false,
        error: 'Pledge not found'
      });
    }

    // Security check: Only event organizer can update pledge status
    if (pledge.event.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the event organizer can update pledge status'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, completed, or failed'
      });
    }

    // Update pledge status
    await pledge.update({ payment_status: status });

    // Fetch updated pledge with details
    const updatedPledge = await Pledge.findByPk(id, {
      include: [
        {
          model: User,
          as: 'donor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Pledge status updated successfully',
      data: updatedPledge
    });
  } catch (error) {
    next(error);
  }
};