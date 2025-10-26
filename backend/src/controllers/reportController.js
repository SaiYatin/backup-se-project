const { User, Event, Pledge, Report } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { auditLog } = require('../utils/logger');

// Admin Dashboard - Overall platform statistics
exports.getAdminDashboard = async (req, res, next) => {
  try {
    // Total counts
    const totalUsers = await User.count();
    const totalEvents = await Event.count();
    const totalPledges = await Pledge.count();

    // Breakdown by role
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    // Events by status
    const eventsByStatus = await Event.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Total pledged amount
    const pledgeStats = await Pledge.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount']
      ]
    });

    // Top 5 events by pledges
    const topEvents = await Event.findAll({
      attributes: [
        'id',
        'title',
        'current_amount',
        'target_amount',
        'status'
      ],
      order: [['current_amount', 'DESC']],
      limit: 5,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['name', 'email']
        }
      ]
    });

    // Recent activity (last 10 pledges)
    const recentPledges = await Pledge.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'donor',
          attributes: ['name']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['title']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalEvents,
          totalPledges,
          totalPledgedAmount: pledgeStats?.dataValues.totalAmount || 0,
          averagePledgeAmount: pledgeStats?.dataValues.averageAmount || 0
        },
        usersByRole,
        eventsByStatus,
        topEvents,
        recentActivity: recentPledges
      }
    });
  } catch (error) {
    next(error);
  }
};

// Organizer Summary - Stats for logged-in organizer
exports.getOrganizerSummary = async (req, res, next) => {
  try {
    const organizerId = req.user.id;

    // Get organizer's events
    const events = await Event.findAll({
      where: { organizer_id: organizerId },
      include: [
        {
          model: Pledge,
          as: 'pledges'
        }
      ]
    });

    // Calculate stats
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'active').length;
    const completedEvents = events.filter(e => e.status === 'completed').length;
    
    let totalRaised = 0;
    let totalTarget = 0;
    let totalPledges = 0;

    events.forEach(event => {
      totalRaised += parseFloat(event.current_amount || 0);
      totalTarget += parseFloat(event.target_amount || 0);
      totalPledges += event.pledges?.length || 0;
    });

    // Top performing events
    const topEvents = events
      .sort((a, b) => parseFloat(b.current_amount || 0) - parseFloat(a.current_amount || 0))
      .slice(0, 5)
      .map(e => {
        const raised = parseFloat(e.current_amount || 0);
        const target = parseFloat(e.target_amount || 0);
        const percentage = target > 0 ? ((raised / target) * 100).toFixed(2) : '0.00';
        return {
          id: e.id,
          title: e.title,
          raised,
          target,
          percentage,
          pledgeCount: e.pledges?.length || 0
        };
      });

    res.json({
      success: true,
      data: {
        overview: {
          totalEvents,
          activeEvents,
          completedEvents,
          totalRaised,
          totalTarget,
          totalPledges,
          averageRaised: totalEvents > 0 ? (totalRaised / totalEvents).toFixed(2) : 0
        },
        topEvents,
        allEvents: events.map(e => ({
          id: e.id,
          title: e.title,
          status: e.status,
          current_amount: e.current_amount,
          target_amount: e.target_amount,
          pledgeCount: e.pledges?.length || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Event Analytics - Detailed stats for a specific event
exports.getEventAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find event with all pledges
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

    // Check permissions (only organizer or admin can view)
    if (req.user.role !== 'admin' && event.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this event analytics'
      });
    }

    // Calculate analytics
    const pledges = event.pledges || [];
    const totalPledges = pledges.length;
  const totalAmount = pledges.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const averagePledge = totalPledges > 0 ? (totalAmount / totalPledges).toFixed(2) : '0.00';
  const targetAmount = parseFloat(event.target_amount || 0);
  const progressPercentage = targetAmount > 0 ? ((totalAmount / targetAmount) * 100).toFixed(2) : '0.00';

    // Pledge amount distribution
    const pledgeRanges = {
      under100: pledges.filter(p => p.amount < 100).length,
      '100-500': pledges.filter(p => p.amount >= 100 && p.amount < 500).length,
      '500-1000': pledges.filter(p => p.amount >= 500 && p.amount < 1000).length,
      over1000: pledges.filter(p => p.amount >= 1000).length
    };

    // Top donors
    const topDonors = pledges
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(p => ({
        donor: p.is_anonymous ? 'Anonymous' : p.donor?.name,
        amount: p.amount,
        date: p.created_at
      }));

    // Payment status breakdown
    const pledgesByStatus = await Pledge.findAll({
      where: { event_id: id },
      attributes: [
        'payment_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['payment_status']
    });

    res.json({
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          status: event.status,
          target_amount: event.target_amount,
          current_amount: event.current_amount,
          organizer: event.organizer
        },
        analytics: {
          totalPledges,
          totalAmount,
          averagePledge,
          progressPercentage,
          pledgeRanges,
          pledgesByStatus,
          topDonors
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Donor Activity Report - For logged-in donor
exports.getDonorActivity = async (req, res, next) => {
  try {
    const donorId = req.user.id;

    // Get all pledges by this donor
    const pledges = await Pledge.findAll({
      where: { donor_id: donorId },
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'status', 'target_amount', 'current_amount']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calculate stats
    const totalPledges = pledges.length;
    const totalDonated = pledges.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const averageDonation = totalPledges > 0 ? (totalDonated / totalPledges).toFixed(2) : 0;

    // Pledges by status
    const pledgesByStatus = {
      pending: pledges.filter(p => p.payment_status === 'pending').length,
      completed: pledges.filter(p => p.payment_status === 'completed').length,
      failed: pledges.filter(p => p.payment_status === 'failed').length
    };

    // Events supported
    const uniqueEvents = [...new Set(pledges.map(p => p.event_id))].length;

    res.json({
      success: true,
      data: {
        overview: {
          totalPledges,
          totalDonated,
          averageDonation,
          eventsSupported: uniqueEvents,
          pledgesByStatus
        },
        pledges: pledges.map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.payment_status,
          message: p.message,
          date: p.created_at,
          event: p.event
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};