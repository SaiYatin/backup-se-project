/**
 * Report Service
 * Handles generation of daily, weekly, monthly, and event-specific reports
 * with comprehensive data aggregation and analysis
 */

const { User, Event, Pledge, Report } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Generate a daily report
 * @param {Date} date - Date for the report
 * @param {number} generatedBy - User ID who generated the report
 * @returns {Object} Generated report object
 */
exports.generateDailyReport = async (date, generatedBy) => {
  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get daily statistics
    const dailyStats = await Promise.all([
      // New users registered
      User.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        }
      }),
      
      // New events created
      Event.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        }
      }),
      
      // New pledges made
      Pledge.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        }
      }),
      
      // Total amount pledged
      Pledge.sum('amount', {
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        }
      }),
      
      // Events that reached target
      Event.count({
        where: {
          status: 'completed',
          updated_at: {
            [Op.between]: [startDate, endDate]
          }
        }
      }),
      
      // Payment completions
      Pledge.count({
        where: {
          payment_status: 'completed',
          updated_at: {
            [Op.between]: [startDate, endDate]
          }
        }
      })
    ]);

    // Get hourly breakdown of pledge activity
    const hourlyPledges = await sequelize.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as pledge_count,
        SUM(amount) as total_amount
      FROM pledges 
      WHERE created_at BETWEEN :startDate AND :endDate
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `, {
      replacements: { startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });

    // Get top events by pledges received
    const topEvents = await Event.findAll({
      include: [{
        model: Pledge,
        as: 'pledges',
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        required: true
      }],
      limit: 5,
      order: [[sequelize.literal('(SELECT COUNT(*) FROM pledges WHERE pledges.event_id = Event.id AND pledges.created_at BETWEEN \'' + startDate.toISOString() + '\' AND \'' + endDate.toISOString() + '\')'), 'DESC']]
    });

    // Get user activity breakdown
    const userActivity = await sequelize.query(`
      SELECT 
        u.role,
        COUNT(DISTINCT u.id) as active_users,
        COUNT(p.id) as actions_taken
      FROM users u
      LEFT JOIN pledges p ON u.id = p.donor_id AND p.created_at BETWEEN :startDate AND :endDate
      LEFT JOIN events e ON u.id = e.organizer_id AND e.created_at BETWEEN :startDate AND :endDate
      WHERE u.last_login >= :startDate OR p.id IS NOT NULL OR e.id IS NOT NULL
      GROUP BY u.role
    `, {
      replacements: { startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });

    const reportData = {
      period: {
        type: 'daily',
        date: startDate.toISOString().split('T')[0],
        start_date: startDate,
        end_date: endDate
      },
      summary: {
        new_users: dailyStats[0] || 0,
        new_events: dailyStats[1] || 0,
        new_pledges: dailyStats[2] || 0,
        total_pledged: parseFloat(dailyStats[3]) || 0,
        events_completed: dailyStats[4] || 0,
        payments_completed: dailyStats[5] || 0
      },
      analytics: {
        hourly_activity: hourlyPledges.map(h => ({
          hour: parseInt(h.hour),
          pledge_count: parseInt(h.pledge_count),
          total_amount: parseFloat(h.total_amount) || 0
        })),
        top_events: topEvents.map(event => ({
          id: event.id,
          title: event.title,
          daily_pledges: event.pledges.length,
          daily_amount: event.pledges.reduce((sum, p) => sum + parseFloat(p.amount), 0),
          total_raised: parseFloat(event.current_amount) || 0,
          target_amount: parseFloat(event.target_amount) || 0
        })),
        user_activity: userActivity
      },
      generated_at: new Date(),
      generated_by: generatedBy
    };

    // Save report to database
    const report = await Report.create({
      type: 'daily',
      title: `Daily Report - ${startDate.toISOString().split('T')[0]}`,
      start_date: startDate,
      end_date: endDate,
      data: reportData,
      status: 'completed',
      generated_by: generatedBy
    });

    logger.info(`Daily report generated successfully for ${startDate.toISOString().split('T')[0]}`);
    return report;

  } catch (error) {
    logger.error('Error generating daily report:', error);
    throw new Error(`Failed to generate daily report: ${error.message}`);
  }
};

/**
 * Generate a weekly report
 * @param {Date} startDate - Start date of the week
 * @param {number} generatedBy - User ID who generated the report
 * @returns {Object} Generated report object
 */
exports.generateWeeklyReport = async (startDate, generatedBy) => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // Get weekly statistics
    const weeklyStats = await Promise.all([
      // New users
      User.count({
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // New events
      Event.count({
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // Total pledges
      Pledge.count({
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // Total amount pledged
      Pledge.sum('amount', {
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // Average pledge amount
      Pledge.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('amount')), 'avg_amount']],
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        }
      })
    ]);

    // Get daily breakdown for the week
    const dailyBreakdown = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT CASE WHEN donor_id IS NOT NULL THEN donor_id END) as unique_donors,
        COUNT(*) as pledge_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM pledges 
      WHERE created_at BETWEEN :start AND :end
      GROUP BY DATE(created_at)
      ORDER BY date
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    // Get event performance metrics
    const eventMetrics = await sequelize.query(`
      SELECT 
        e.id,
        e.title,
        e.category,
        e.target_amount,
        e.current_amount,
        COUNT(p.id) as pledge_count,
        COUNT(DISTINCT p.donor_id) as unique_donors,
        COALESCE(SUM(p.amount), 0) as week_pledged,
        (e.current_amount / e.target_amount * 100) as progress_percentage
      FROM events e
      LEFT JOIN pledges p ON e.id = p.event_id AND p.created_at BETWEEN :start AND :end
      WHERE e.status IN ('active', 'completed')
      GROUP BY e.id, e.title, e.category, e.target_amount, e.current_amount
      HAVING COUNT(p.id) > 0
      ORDER BY week_pledged DESC
      LIMIT 10
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    // Get category performance
    const categoryPerformance = await sequelize.query(`
      SELECT 
        e.category,
        COUNT(DISTINCT e.id) as event_count,
        COUNT(p.id) as pledge_count,
        SUM(p.amount) as total_pledged,
        AVG(p.amount) as avg_pledge_amount
      FROM events e
      JOIN pledges p ON e.id = p.event_id
      WHERE p.created_at BETWEEN :start AND :end
      GROUP BY e.category
      ORDER BY total_pledged DESC
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    // Get user engagement metrics
    const userEngagement = await sequelize.query(`
      SELECT 
        'new_users' as metric,
        COUNT(*) as count
      FROM users 
      WHERE created_at BETWEEN :start AND :end
      
      UNION ALL
      
      SELECT 
        'active_donors' as metric,
        COUNT(DISTINCT donor_id) as count
      FROM pledges 
      WHERE created_at BETWEEN :start AND :end
      
      UNION ALL
      
      SELECT 
        'active_organizers' as metric,
        COUNT(DISTINCT organizer_id) as count
      FROM events 
      WHERE created_at BETWEEN :start AND :end
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    const reportData = {
      period: {
        type: 'weekly',
        start_date: start,
        end_date: end,
        week_of: start.toISOString().split('T')[0]
      },
      summary: {
        new_users: weeklyStats[0] || 0,
        new_events: weeklyStats[1] || 0,
        total_pledges: weeklyStats[2] || 0,
        total_pledged: parseFloat(weeklyStats[3]) || 0,
        average_pledge: parseFloat(weeklyStats[4]?.dataValues?.avg_amount) || 0
      },
      analytics: {
        daily_breakdown: dailyBreakdown.map(day => ({
          date: day.date,
          unique_donors: parseInt(day.unique_donors) || 0,
          pledge_count: parseInt(day.pledge_count) || 0,
          total_amount: parseFloat(day.total_amount) || 0,
          avg_amount: parseFloat(day.avg_amount) || 0
        })),
        top_performing_events: eventMetrics.map(event => ({
          id: event.id,
          title: event.title,
          category: event.category,
          target_amount: parseFloat(event.target_amount),
          current_amount: parseFloat(event.current_amount),
          week_pledged: parseFloat(event.week_pledged),
          pledge_count: parseInt(event.pledge_count),
          unique_donors: parseInt(event.unique_donors),
          progress_percentage: parseFloat(event.progress_percentage) || 0
        })),
        category_performance: categoryPerformance.map(cat => ({
          category: cat.category,
          event_count: parseInt(cat.event_count),
          pledge_count: parseInt(cat.pledge_count),
          total_pledged: parseFloat(cat.total_pledged),
          avg_pledge_amount: parseFloat(cat.avg_pledge_amount)
        })),
        user_engagement: userEngagement.reduce((acc, item) => {
          acc[item.metric] = parseInt(item.count);
          return acc;
        }, {})
      },
      generated_at: new Date(),
      generated_by: generatedBy
    };

    // Save report to database
    const report = await Report.create({
      type: 'weekly',
      title: `Weekly Report - Week of ${start.toISOString().split('T')[0]}`,
      start_date: start,
      end_date: end,
      data: reportData,
      status: 'completed',
      generated_by: generatedBy
    });

    logger.info(`Weekly report generated successfully for week of ${start.toISOString().split('T')[0]}`);
    return report;

  } catch (error) {
    logger.error('Error generating weekly report:', error);
    throw new Error(`Failed to generate weekly report: ${error.message}`);
  }
};

/**
 * Generate a monthly report
 * @param {number} year - Year for the report
 * @param {number} month - Month for the report (1-12)
 * @param {number} generatedBy - User ID who generated the report
 * @returns {Object} Generated report object
 */
exports.generateMonthlyReport = async (year, month, generatedBy) => {
  try {
    const start = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
    const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

    // Get monthly statistics
    const monthlyStats = await Promise.all([
      // New users
      User.count({
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // New events
      Event.count({
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // Events completed this month
      Event.count({
        where: {
          status: 'completed',
          updated_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // Total pledges
      Pledge.count({
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // Total amount pledged
      Pledge.sum('amount', {
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // Successful payments
      Pledge.count({
        where: {
          payment_status: 'completed',
          updated_at: {
            [Op.between]: [start, end]
          }
        }
      }),
      
      // Total payment amount
      Pledge.sum('amount', {
        where: {
          payment_status: 'completed',
          updated_at: {
            [Op.between]: [start, end]
          }
        }
      })
    ]);

    // Get weekly breakdown for the month
    const weeklyBreakdown = await sequelize.query(`
      SELECT 
        WEEK(created_at, 1) as week_number,
        COUNT(*) as pledge_count,
        SUM(amount) as total_amount,
        COUNT(DISTINCT donor_id) as unique_donors,
        COUNT(DISTINCT event_id) as events_with_pledges
      FROM pledges 
      WHERE created_at BETWEEN :start AND :end
      GROUP BY WEEK(created_at, 1)
      ORDER BY week_number
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    // Get top performers of the month
    const topPerformers = await sequelize.query(`
      SELECT 
        'donors' as type,
        u.id,
        u.name,
        u.email,
        COUNT(p.id) as pledge_count,
        SUM(p.amount) as total_donated
      FROM users u
      JOIN pledges p ON u.id = p.donor_id
      WHERE p.created_at BETWEEN :start AND :end
      GROUP BY u.id, u.name, u.email
      ORDER BY total_donated DESC
      LIMIT 5
      
      UNION ALL
      
      SELECT 
        'organizers' as type,
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT e.id) as event_count,
        SUM(COALESCE(e.current_amount, 0)) as total_raised
      FROM users u
      JOIN events e ON u.id = e.organizer_id
      WHERE e.created_at BETWEEN :start AND :end
      GROUP BY u.id, u.name, u.email
      ORDER BY total_raised DESC
      LIMIT 5
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    // Get category trends
    const categoryTrends = await sequelize.query(`
      SELECT 
        e.category,
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_events,
        COUNT(p.id) as total_pledges,
        SUM(p.amount) as total_pledged,
        AVG(p.amount) as avg_pledge_amount,
        SUM(CASE WHEN e.status = 'completed' THEN e.current_amount ELSE 0 END) as successfully_raised
      FROM events e
      LEFT JOIN pledges p ON e.id = p.event_id AND p.created_at BETWEEN :start AND :end
      WHERE e.created_at BETWEEN :start AND :end
      GROUP BY e.category
      ORDER BY total_pledged DESC
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate growth rates compared to previous month
    const prevMonthStart = new Date(year, month - 2, 1);
    const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
    
    const prevMonthStats = await Promise.all([
      User.count({
        where: {
          created_at: {
            [Op.between]: [prevMonthStart, prevMonthEnd]
          }
        }
      }),
      Event.count({
        where: {
          created_at: {
            [Op.between]: [prevMonthStart, prevMonthEnd]
          }
        }
      }),
      Pledge.sum('amount', {
        where: {
          created_at: {
            [Op.between]: [prevMonthStart, prevMonthEnd]
          }
        }
      })
    ]);

    const calculateGrowthRate = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(2);
    };

    const reportData = {
      period: {
        type: 'monthly',
        year: year,
        month: month,
        month_name: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
        start_date: start,
        end_date: end
      },
      summary: {
        new_users: monthlyStats[0] || 0,
        new_events: monthlyStats[1] || 0,
        completed_events: monthlyStats[2] || 0,
        total_pledges: monthlyStats[3] || 0,
        total_pledged: parseFloat(monthlyStats[4]) || 0,
        successful_payments: monthlyStats[5] || 0,
        total_paid: parseFloat(monthlyStats[6]) || 0,
        success_rate: monthlyStats[3] > 0 ? ((monthlyStats[5] / monthlyStats[3]) * 100).toFixed(2) : 0
      },
      growth_analysis: {
        user_growth: calculateGrowthRate(monthlyStats[0], prevMonthStats[0]),
        event_growth: calculateGrowthRate(monthlyStats[1], prevMonthStats[1]),
        pledge_growth: calculateGrowthRate(parseFloat(monthlyStats[4]) || 0, parseFloat(prevMonthStats[2]) || 0)
      },
      analytics: {
        weekly_breakdown: weeklyBreakdown.map(week => ({
          week_number: parseInt(week.week_number),
          pledge_count: parseInt(week.pledge_count),
          total_amount: parseFloat(week.total_amount) || 0,
          unique_donors: parseInt(week.unique_donors),
          events_with_pledges: parseInt(week.events_with_pledges)
        })),
        top_donors: topPerformers.filter(p => p.type === 'donors').map(donor => ({
          id: donor.id,
          name: donor.name,
          pledge_count: parseInt(donor.pledge_count),
          total_donated: parseFloat(donor.total_donated)
        })),
        top_organizers: topPerformers.filter(p => p.type === 'organizers').map(org => ({
          id: org.id,
          name: org.name,
          event_count: parseInt(org.event_count),
          total_raised: parseFloat(org.total_raised)
        })),
        category_performance: categoryTrends.map(cat => ({
          category: cat.category,
          total_events: parseInt(cat.total_events),
          completed_events: parseInt(cat.completed_events),
          completion_rate: cat.total_events > 0 ? ((cat.completed_events / cat.total_events) * 100).toFixed(2) : 0,
          total_pledges: parseInt(cat.total_pledges),
          total_pledged: parseFloat(cat.total_pledged) || 0,
          avg_pledge_amount: parseFloat(cat.avg_pledge_amount) || 0,
          successfully_raised: parseFloat(cat.successfully_raised) || 0
        }))
      },
      generated_at: new Date(),
      generated_by: generatedBy
    };

    // Save report to database
    const report = await Report.create({
      type: 'monthly',
      title: `Monthly Report - ${reportData.period.month_name} ${year}`,
      start_date: start,
      end_date: end,
      data: reportData,
      status: 'completed',
      generated_by: generatedBy
    });

    logger.info(`Monthly report generated successfully for ${reportData.period.month_name} ${year}`);
    return report;

  } catch (error) {
    logger.error('Error generating monthly report:', error);
    throw new Error(`Failed to generate monthly report: ${error.message}`);
  }
};

/**
 * Generate an event-specific report
 * @param {number} eventId - Event ID
 * @param {number} generatedBy - User ID who generated the report
 * @returns {Object} Generated report object
 */
exports.generateEventReport = async (eventId, generatedBy) => {
  try {
    // Get event details with all related data
    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Pledge,
          as: 'pledges',
          include: [{
            model: User,
            as: 'donor',
            attributes: ['id', 'name', 'email']
          }]
        }
      ]
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const pledges = event.pledges || [];
    
    // Calculate basic metrics
    const totalPledges = pledges.length;
    const totalAmount = pledges.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const averagePledge = totalPledges > 0 ? totalAmount / totalPledges : 0;
    const uniqueDonors = new Set(pledges.map(p => p.donor_id)).size;
    const targetAmount = parseFloat(event.target_amount) || 0;
    const progressPercentage = targetAmount > 0 ? (totalAmount / targetAmount) * 100 : 0;

    // Pledge timeline (daily breakdown)
    const pledgeTimeline = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as pledge_count,
        SUM(amount) as daily_amount,
        COUNT(DISTINCT donor_id) as unique_donors
      FROM pledges 
      WHERE event_id = :eventId
      GROUP BY DATE(created_at)
      ORDER BY date
    `, {
      replacements: { eventId },
      type: sequelize.QueryTypes.SELECT
    });

    // Pledge amount distribution
    const amountRanges = {
      'under_50': pledges.filter(p => p.amount < 50).length,
      '50_100': pledges.filter(p => p.amount >= 50 && p.amount < 100).length,
      '100_250': pledges.filter(p => p.amount >= 100 && p.amount < 250).length,
      '250_500': pledges.filter(p => p.amount >= 250 && p.amount < 500).length,
      '500_1000': pledges.filter(p => p.amount >= 500 && p.amount < 1000).length,
      'over_1000': pledges.filter(p => p.amount >= 1000).length
    };

    // Payment status breakdown
    const paymentStatus = {
      pending: pledges.filter(p => p.payment_status === 'pending').length,
      processing: pledges.filter(p => p.payment_status === 'processing').length,
      completed: pledges.filter(p => p.payment_status === 'completed').length,
      failed: pledges.filter(p => p.payment_status === 'failed').length
    };

    // Top contributors
    const topContributors = pledges
      .filter(p => !p.is_anonymous)
      .reduce((acc, pledge) => {
        const donorId = pledge.donor_id;
        if (!acc[donorId]) {
          acc[donorId] = {
            donor: pledge.donor,
            total_amount: 0,
            pledge_count: 0,
            first_pledge: pledge.created_at,
            latest_pledge: pledge.created_at
          };
        }
        acc[donorId].total_amount += parseFloat(pledge.amount);
        acc[donorId].pledge_count += 1;
        if (new Date(pledge.created_at) < new Date(acc[donorId].first_pledge)) {
          acc[donorId].first_pledge = pledge.created_at;
        }
        if (new Date(pledge.created_at) > new Date(acc[donorId].latest_pledge)) {
          acc[donorId].latest_pledge = pledge.created_at;
        }
        return acc;
      }, {});

    const sortedContributors = Object.values(topContributors)
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);

    // Anonymous contributions
    const anonymousPledges = pledges.filter(p => p.is_anonymous);
    const anonymousTotal = anonymousPledges.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Milestone tracking
    const milestones = [];
    const quarterTarget = targetAmount / 4;
    const halfTarget = targetAmount / 2;
    const threeQuarterTarget = (targetAmount * 3) / 4;

    let runningTotal = 0;
    const sortedPledges = pledges.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    for (const pledge of sortedPledges) {
      runningTotal += parseFloat(pledge.amount);
      
      if (runningTotal >= quarterTarget && !milestones.find(m => m.type === '25%')) {
        milestones.push({
          type: '25%',
          amount: quarterTarget,
          achieved_at: pledge.created_at,
          pledge_number: sortedPledges.indexOf(pledge) + 1
        });
      }
      if (runningTotal >= halfTarget && !milestones.find(m => m.type === '50%')) {
        milestones.push({
          type: '50%',
          amount: halfTarget,
          achieved_at: pledge.created_at,
          pledge_number: sortedPledges.indexOf(pledge) + 1
        });
      }
      if (runningTotal >= threeQuarterTarget && !milestones.find(m => m.type === '75%')) {
        milestones.push({
          type: '75%',
          amount: threeQuarterTarget,
          achieved_at: pledge.created_at,
          pledge_number: sortedPledges.indexOf(pledge) + 1
        });
      }
      if (runningTotal >= targetAmount && !milestones.find(m => m.type === '100%')) {
        milestones.push({
          type: '100%',
          amount: targetAmount,
          achieved_at: pledge.created_at,
          pledge_number: sortedPledges.indexOf(pledge) + 1
        });
        break;
      }
    }

    const reportData = {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        status: event.status,
        target_amount: targetAmount,
        current_amount: parseFloat(event.current_amount) || 0,
        created_at: event.created_at,
        updated_at: event.updated_at,
        organizer: event.organizer
      },
      summary: {
        total_pledges: totalPledges,
        unique_donors: uniqueDonors,
        total_amount: totalAmount,
        average_pledge: averagePledge,
        progress_percentage: progressPercentage.toFixed(2),
        target_reached: progressPercentage >= 100,
        anonymous_pledges: anonymousPledges.length,
        anonymous_total: anonymousTotal
      },
      analytics: {
        pledge_timeline: pledgeTimeline.map(day => ({
          date: day.date,
          pledge_count: parseInt(day.pledge_count),
          daily_amount: parseFloat(day.daily_amount),
          unique_donors: parseInt(day.unique_donors),
          cumulative_amount: 0 // Will be calculated in post-processing
        })),
        amount_distribution: amountRanges,
        payment_status: paymentStatus,
        top_contributors: sortedContributors.map(contributor => ({
          donor_name: contributor.donor?.name || 'Unknown',
          total_amount: contributor.total_amount,
          pledge_count: contributor.pledge_count,
          first_pledge: contributor.first_pledge,
          latest_pledge: contributor.latest_pledge
        })),
        milestones: milestones
      },
      detailed_pledges: pledges.map(pledge => ({
        id: pledge.id,
        amount: parseFloat(pledge.amount),
        donor_name: pledge.is_anonymous ? 'Anonymous' : pledge.donor?.name || 'Unknown',
        message: pledge.message,
        payment_status: pledge.payment_status,
        created_at: pledge.created_at,
        is_anonymous: pledge.is_anonymous
      })),
      generated_at: new Date(),
      generated_by: generatedBy
    };

    // Calculate cumulative amounts for timeline
    let cumulative = 0;
    reportData.analytics.pledge_timeline = reportData.analytics.pledge_timeline.map(day => {
      cumulative += day.daily_amount;
      return { ...day, cumulative_amount: cumulative };
    });

    // Save report to database
    const report = await Report.create({
      type: 'event',
      title: `Event Report - ${event.title}`,
      start_date: event.created_at,
      end_date: new Date(),
      data: reportData,
      status: 'completed',
      generated_by: generatedBy,
      event_id: eventId
    });

    logger.info(`Event report generated successfully for event ${eventId}`);
    return report;

  } catch (error) {
    logger.error(`Error generating event report for event ${eventId}:`, error);
    throw new Error(`Failed to generate event report: ${error.message}`);
  }
};

/**
 * Get reports with filtering
 * @param {Object} filters - Filter options
 * @returns {Array} List of reports
 */
exports.getReports = async (filters = {}) => {
  try {
    const whereClause = {};
    
    if (filters.type) {
      whereClause.type = filters.type;
    }
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    
    if (filters.startDate && filters.endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)]
      };
    }

    const reports = await Report.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      include: [{
        model: User,
        as: 'generator',
        attributes: ['id', 'name', 'email']
      }]
    });

    return reports;
  } catch (error) {
    logger.error('Error retrieving reports:', error);
    throw new Error(`Failed to retrieve reports: ${error.message}`);
  }
};

/**
 * Clean up old reports
 * @param {number} daysOld - Number of days old to consider for deletion
 * @returns {number} Number of deleted reports
 */
exports.cleanupOldReports = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deletedCount = await Report.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${deletedCount} old reports older than ${daysOld} days`);
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old reports:', error);
    throw new Error(`Failed to cleanup old reports: ${error.message}`);
  }
};

module.exports = {
  generateDailyReport: exports.generateDailyReport,
  generateWeeklyReport: exports.generateWeeklyReport,
  generateMonthlyReport: exports.generateMonthlyReport,
  generateEventReport: exports.generateEventReport,
  getReports: exports.getReports,
  cleanupOldReports: exports.cleanupOldReports
};