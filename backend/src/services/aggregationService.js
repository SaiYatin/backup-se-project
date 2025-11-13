/**
 * Aggregation Service
 * Handles real-time data aggregation for reports and analytics
 * without saving to database
 */

const { User, Event, Pledge } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get platform overview (dashboard stats)
 * @returns {Object} Platform-wide statistics
 */
exports.getPlatformOverview = async () => {
  try {
    // Get counts for each entity
    const [
      totalUsers,
      totalEvents,
      totalPledges,
      activeEvents,
      completedEvents,
      pendingEvents
    ] = await Promise.all([
      User.count(),
      Event.count(),
      Pledge.count(),
      Event.count({ where: { status: 'active' } }),
      Event.count({ where: { status: 'completed' } }),
      Event.count({ where: { status: 'pending' } })
    ]);

    // Get user breakdown by role
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    // Get pledge statistics
    const pledgeStats = await Pledge.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount'],
        [sequelize.fn('MAX', sequelize.col('amount')), 'maxAmount'],
        [sequelize.fn('MIN', sequelize.col('amount')), 'minAmount']
      ],
      raw: true
    });

    // Calculate total raised and target across all events
    const eventFinancials = await Event.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('current_amount')), 'totalRaised'],
        [sequelize.fn('SUM', sequelize.col('target_amount')), 'totalTarget']
      ],
      raw: true
    });

    // Get payment status breakdown
    const paymentStatus = await Pledge.findAll({
      attributes: [
        'payment_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['payment_status'],
      raw: true
    });

    // Calculate success rate (completed events / total events that ended)
    const endedEvents = completedEvents + await Event.count({
      where: {
        end_date: { [Op.lt]: new Date() }
      }
    });
    const successRate = endedEvents > 0 
      ? ((completedEvents / endedEvents) * 100).toFixed(2) 
      : 0;

    return {
      totalUsers,
      totalEvents,
      totalPledges,
      activeEvents,
      completedEvents,
      pendingEvents,
      totalAmount: parseFloat(pledgeStats?.totalAmount) || 0,
      averagePledge: parseFloat(pledgeStats?.averageAmount) || 0,
      maxPledge: parseFloat(pledgeStats?.maxAmount) || 0,
      minPledge: parseFloat(pledgeStats?.minAmount) || 0,
      totalRaised: parseFloat(eventFinancials?.totalRaised) || 0,
      totalTarget: parseFloat(eventFinancials?.totalTarget) || 0,
      successRate: parseFloat(successRate),
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = parseInt(item.count);
        return acc;
      }, {}),
      paymentStatus: paymentStatus.reduce((acc, item) => {
        acc[item.payment_status] = {
          count: parseInt(item.count),
          total: parseFloat(item.total) || 0
        };
        return acc;
      }, {}),
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error getting platform overview:', error);
    throw new Error(`Failed to get platform overview: ${error.message}`);
  }
};

/**
 * Get top performers (donors and organizers)
 * @param {number} periodDays - Number of days to look back
 * @returns {Object} Top donors and organizers
 */
exports.getTopPerformers = async (periodDays = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Top donors by total amount
    const topDonors = await Pledge.findAll({
      attributes: [
        'donor_id',
        [sequelize.fn('COUNT', sequelize.col('Pledge.id')), 'pledgeCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalDonated']
      ],
      where: {
        created_at: { [Op.gte]: startDate },
        is_anonymous: false
      },
      include: [{
        model: User,
        as: 'donor',
        attributes: ['id', 'name', 'email']
      }],
      group: ['donor_id', 'donor.id', 'donor.name', 'donor.email'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
      limit: 10,
      subQuery: false
    });

    // Top organizers by amount raised
    const topOrganizers = await Event.findAll({
      attributes: [
        'organizer_id',
        [sequelize.fn('COUNT', sequelize.col('Event.id')), 'eventCount'],
        [sequelize.fn('SUM', sequelize.col('current_amount')), 'totalRaised']
      ],
      where: {
        created_at: { [Op.gte]: startDate }
      },
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email']
      }],
      group: ['organizer_id', 'organizer.id', 'organizer.name', 'organizer.email'],
      order: [[sequelize.fn('SUM', sequelize.col('current_amount')), 'DESC']],
      limit: 10,
      subQuery: false
    });

    // Most popular events (by pledge count)
    const topEvents = await Event.findAll({
      attributes: [
        'id',
        'title',
        'category',
        'current_amount',
        'target_amount',
        [sequelize.fn('COUNT', sequelize.col('pledges.id')), 'pledgeCount']
      ],
      include: [{
        model: Pledge,
        as: 'pledges',
        attributes: [],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        required: true
      }],
      group: ['Event.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('pledges.id')), 'DESC']],
      limit: 10,
      subQuery: false
    });

    return {
      period: `Last ${periodDays} days`,
      topDonors: topDonors.map(donor => ({
        id: donor.donor_id,
        name: donor.donor?.name || 'Unknown',
        email: donor.donor?.email,
        pledgeCount: parseInt(donor.dataValues.pledgeCount),
        totalDonated: parseFloat(donor.dataValues.totalDonated) || 0
      })),
      topOrganizers: topOrganizers.map(org => ({
        id: org.organizer_id,
        name: org.organizer?.name || 'Unknown',
        email: org.organizer?.email,
        eventCount: parseInt(org.dataValues.eventCount),
        totalRaised: parseFloat(org.dataValues.totalRaised) || 0
      })),
      topEvents: topEvents.map(event => ({
        id: event.id,
        title: event.title,
        category: event.category,
        currentAmount: parseFloat(event.current_amount) || 0,
        targetAmount: parseFloat(event.target_amount) || 0,
        pledgeCount: parseInt(event.dataValues.pledgeCount),
        progress: event.target_amount > 0 
          ? ((event.current_amount / event.target_amount) * 100).toFixed(2)
          : 0
      })),
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error getting top performers:', error);
    throw new Error(`Failed to get top performers: ${error.message}`);
  }
};

/**
 * Get category analysis
 * @returns {Object} Statistics by category
 */
exports.getCategoryAnalysis = async () => {
  try {
    const categoryStats = await Event.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('Event.id')), 'eventCount'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'active\' THEN 1 END')), 'activeCount'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'completed\' THEN 1 END')), 'completedCount'],
        [sequelize.fn('SUM', sequelize.col('Event.current_amount')), 'totalRaised'],
        [sequelize.fn('SUM', sequelize.col('Event.target_amount')), 'totalTarget'],
        [sequelize.fn('AVG', sequelize.col('Event.current_amount')), 'avgRaised'],
        [sequelize.fn('COUNT', sequelize.col('pledges.id')), 'totalPledges']
      ],
      include: [{
        model: Pledge,
        as: 'pledges',
        attributes: [],
        required: false
      }],
      group: ['Event.category'],
      raw: true
    });

    // Calculate additional metrics
    const enrichedStats = categoryStats.map(cat => {
      const eventCount = parseInt(cat.eventCount) || 0;
      const activeCount = parseInt(cat.activeCount) || 0;
      const completedCount = parseInt(cat.completedCount) || 0;
      const totalRaised = parseFloat(cat.totalRaised) || 0;
      const totalTarget = parseFloat(cat.totalTarget) || 0;
      const avgRaised = parseFloat(cat.avgRaised) || 0;
      const totalPledges = parseInt(cat.totalPledges) || 0;

      return {
        category: cat.category,
        eventCount,
        activeCount,
        completedCount,
        totalRaised,
        totalTarget,
        avgRaised,
        totalPledges,
        completionRate: eventCount > 0 
          ? ((completedCount / eventCount) * 100).toFixed(2)
          : 0,
        avgPledgesPerEvent: eventCount > 0
          ? (totalPledges / eventCount).toFixed(2)
          : 0,
        fundingPercentage: totalTarget > 0
          ? ((totalRaised / totalTarget) * 100).toFixed(2)
          : 0
      };
    });

    // Sort by total raised
    enrichedStats.sort((a, b) => b.totalRaised - a.totalRaised);

    return {
      categories: enrichedStats,
      totalCategories: enrichedStats.length,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error getting category analysis:', error);
    throw new Error(`Failed to get category analysis: ${error.message}`);
  }
};

/**
 * Get event statistics
 * @param {number} eventId - Event ID
 * @param {boolean} includeDetails - Whether to include detailed pledge data
 * @returns {Object} Event statistics
 */
exports.getEventStats = async (eventId, includeDetails = false) => {
  try {
    const event = await Event.findByPk(eventId, {
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Get pledge statistics
    const pledgeStats = await Pledge.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'average'],
        [sequelize.fn('MAX', sequelize.col('amount')), 'max'],
        [sequelize.fn('MIN', sequelize.col('amount')), 'min'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_anonymous = true THEN 1 END')), 'anonymousCount']
      ],
      where: { event_id: eventId },
      raw: true
    });

    const stats = pledgeStats[0] || {};
    const pledgeCount = parseInt(stats.count) || 0;
    const totalAmount = parseFloat(stats.total) || 0;
    const avgAmount = parseFloat(stats.average) || 0;
    const maxAmount = parseFloat(stats.max) || 0;
    const minAmount = parseFloat(stats.min) || 0;
    const anonymousCount = parseInt(stats.anonymousCount) || 0;

    // Get unique donors count
    const uniqueDonors = await Pledge.count({
      distinct: true,
      col: 'donor_id',
      where: { event_id: eventId }
    });

    // Get payment status breakdown
    const paymentBreakdown = await Pledge.findAll({
      attributes: [
        'payment_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      where: { event_id: eventId },
      group: ['payment_status'],
      raw: true
    });

    // Calculate progress
    const targetAmount = parseFloat(event.target_amount) || 0;
    const progressPercentage = targetAmount > 0
      ? ((totalAmount / targetAmount) * 100).toFixed(2)
      : 0;

    // Calculate days active
    const createdDate = new Date(event.created_at);
    const endDate = new Date(event.end_date);
    const today = new Date();
    const daysActive = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.floor((endDate - today) / (1000 * 60 * 60 * 24)));

    const result = {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        status: event.status,
        targetAmount,
        currentAmount: parseFloat(event.current_amount) || 0,
        createdAt: event.created_at,
        endDate: event.end_date,
        daysActive,
        daysRemaining,
        organizer: event.organizer
      },
      pledgeStats: {
        count: pledgeCount,
        total: totalAmount,
        average: avgAmount,
        max: maxAmount,
        min: minAmount,
        anonymousCount,
        uniqueDonors,
        progressPercentage: parseFloat(progressPercentage)
      },
      paymentBreakdown: paymentBreakdown.reduce((acc, item) => {
        acc[item.payment_status] = {
          count: parseInt(item.count),
          total: parseFloat(item.total) || 0
        };
        return acc;
      }, {}),
      timestamp: new Date()
    };

    // Include detailed pledges if requested
    if (includeDetails) {
      const pledges = await Pledge.findAll({
        where: { event_id: eventId },
        include: [{
          model: User,
          as: 'donor',
          attributes: ['id', 'name', 'email']
        }],
        order: [['created_at', 'DESC']]
      });

      result.pledges = pledges.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        donorName: p.is_anonymous ? 'Anonymous' : p.donor?.name || 'Unknown',
        message: p.message,
        paymentStatus: p.payment_status,
        createdAt: p.created_at,
        isAnonymous: p.is_anonymous
      }));
    }

    return result;
  } catch (error) {
    logger.error(`Error getting event stats for event ${eventId}:`, error);
    throw new Error(`Failed to get event statistics: ${error.message}`);
  }
};

/**
 * Get growth metrics (comparing periods)
 * @param {number} days - Number of days for current period
 * @returns {Object} Growth comparison
 */
exports.getGrowthMetrics = async (days = 30) => {
  try {
    const now = new Date();
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(now.getDate() - days);
    
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(currentPeriodStart.getDate() - days);

    // Current period stats
    const [currentUsers, currentEvents, currentPledges, currentAmount] = await Promise.all([
      User.count({ where: { created_at: { [Op.gte]: currentPeriodStart } } }),
      Event.count({ where: { created_at: { [Op.gte]: currentPeriodStart } } }),
      Pledge.count({ where: { created_at: { [Op.gte]: currentPeriodStart } } }),
      Pledge.sum('amount', { where: { created_at: { [Op.gte]: currentPeriodStart } } })
    ]);

    // Previous period stats
    const [previousUsers, previousEvents, previousPledges, previousAmount] = await Promise.all([
      User.count({ 
        where: { 
          created_at: { 
            [Op.between]: [previousPeriodStart, currentPeriodStart] 
          } 
        } 
      }),
      Event.count({ 
        where: { 
          created_at: { 
            [Op.between]: [previousPeriodStart, currentPeriodStart] 
          } 
        } 
      }),
      Pledge.count({ 
        where: { 
          created_at: { 
            [Op.between]: [previousPeriodStart, currentPeriodStart] 
          } 
        } 
      }),
      Pledge.sum('amount', { 
        where: { 
          created_at: { 
            [Op.between]: [previousPeriodStart, currentPeriodStart] 
          } 
        } 
      })
    ]);

    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(2);
    };

    return {
      period: `Last ${days} days`,
      current: {
        users: currentUsers,
        events: currentEvents,
        pledges: currentPledges,
        amount: parseFloat(currentAmount) || 0
      },
      previous: {
        users: previousUsers,
        events: previousEvents,
        pledges: previousPledges,
        amount: parseFloat(previousAmount) || 0
      },
      growth: {
        users: parseFloat(calculateGrowth(currentUsers, previousUsers)),
        events: parseFloat(calculateGrowth(currentEvents, previousEvents)),
        pledges: parseFloat(calculateGrowth(currentPledges, previousPledges)),
        amount: parseFloat(calculateGrowth(
          parseFloat(currentAmount) || 0, 
          parseFloat(previousAmount) || 0
        ))
      },
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error getting growth metrics:', error);
    throw new Error(`Failed to get growth metrics: ${error.message}`);
  }
};

module.exports = {
  getPlatformOverview: exports.getPlatformOverview,
  getTopPerformers: exports.getTopPerformers,
  getCategoryAnalysis: exports.getCategoryAnalysis,
  getEventStats: exports.getEventStats,
  getGrowthMetrics: exports.getGrowthMetrics
};