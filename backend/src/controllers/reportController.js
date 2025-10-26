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

const reportService = require('../services/reportService');
const aggregationService = require('../services/aggregationService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Report Controller
 * Handles all report-related endpoints with proper role-based access control
 */

/**
 * Generate a daily report
 * @route POST /api/reports/daily
 * @access Admin only
 */
const generateDailyReport = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date } = req.body;
    const reportDate = date ? new Date(date) : new Date();
    
    // Validate date
    if (isNaN(reportDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const report = await reportService.generateDailyReport(reportDate, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Daily report generated successfully',
      data: {
        id: report.id,
        type: report.type,
        title: report.title,
        status: report.status,
        created_at: report.created_at,
        data: report.data
      }
    });

  } catch (error) {
    logger.error('Error in generateDailyReport controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate daily report'
    });
  }
};

/**
 * Generate a weekly report
 * @route POST /api/reports/weekly
 * @access Admin only
 */
const generateWeeklyReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { start_date } = req.body;
    const startDate = start_date ? new Date(start_date) : new Date();
    
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }

    const report = await reportService.generateWeeklyReport(startDate, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Weekly report generated successfully',
      data: {
        id: report.id,
        type: report.type,
        title: report.title,
        status: report.status,
        created_at: report.created_at,
        data: report.data
      }
    });

  } catch (error) {
    logger.error('Error in generateWeeklyReport controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate weekly report'
    });
  }
};

/**
 * Generate a monthly report
 * @route POST /api/reports/monthly
 * @access Admin only
 */
const generateMonthlyReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { year, month } = req.body;
    const currentDate = new Date();
    const reportYear = year || currentDate.getFullYear();
    const reportMonth = month || currentDate.getMonth() + 1;

    // Validate year and month
    if (reportYear < 2020 || reportYear > currentDate.getFullYear() + 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year'
      });
    }

    if (reportMonth < 1 || reportMonth > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month (must be 1-12)'
      });
    }

    const report = await reportService.generateMonthlyReport(reportYear, reportMonth, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Monthly report generated successfully',
      data: {
        id: report.id,
        type: report.type,
        title: report.title,
        status: report.status,
        created_at: report.created_at,
        data: report.data
      }
    });

  } catch (error) {
    logger.error('Error in generateMonthlyReport controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate monthly report'
    });
  }
};

/**
 * Generate an event-specific report
 * @route POST /api/reports/event/:eventId
 * @access Admin, or Organizer (for their own events)
 */
const generateEventReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // TODO: Add authorization check for organizers to only access their own events
    const report = await reportService.generateEventReport(eventId, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Event report generated successfully',
      data: {
        id: report.id,
        type: report.type,
        title: report.title,
        status: report.status,
        created_at: report.created_at,
        data: report.data
      }
    });

  } catch (error) {
    logger.error('Error in generateEventReport controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate event report'
    });
  }
};

/**
 * Get all reports with filtering
 * @route GET /api/reports
 * @access Admin only
 */
const getReports = async (req, res) => {
  try {
    const {
      type,
      status,
      limit = 20,
      offset = 0,
      start_date,
      end_date
    } = req.query;

    const filters = {
      type,
      status,
      limit: Math.min(parseInt(limit), 100), // Max 100 records
      offset: parseInt(offset),
      startDate: start_date,
      endDate: end_date
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const reports = await reportService.getReports(filters);

    res.json({
      success: true,
      message: 'Reports retrieved successfully',
      data: reports,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: reports.length
      }
    });

  } catch (error) {
    logger.error('Error in getReports controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve reports'
    });
  }
};

/**
 * Get a specific report by ID
 * @route GET /api/reports/:reportId
 * @access Admin only
 */
const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const Report = require('../models/Report');
    const report = await Report.findByPk(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report retrieved successfully',
      data: report
    });

  } catch (error) {
    logger.error('Error in getReportById controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve report'
    });
  }
};

/**
 * Get platform overview (dashboard stats)
 * @route GET /api/reports/overview
 * @access Admin only
 */
const getPlatformOverview = async (req, res) => {
  try {
    const overview = await aggregationService.getPlatformOverview();

    res.json({
      success: true,
      message: 'Platform overview retrieved successfully',
      data: overview
    });

  } catch (error) {
    logger.error('Error in getPlatformOverview controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve platform overview'
    });
  }
};

/**
 * Get top performers data
 * @route GET /api/reports/top-performers
 * @access Admin only
 */
const getTopPerformers = async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const periodDays = Math.min(parseInt(period), 365); // Max 1 year

    const topPerformers = await aggregationService.getTopPerformers(periodDays);

    res.json({
      success: true,
      message: 'Top performers data retrieved successfully',
      data: topPerformers
    });

  } catch (error) {
    logger.error('Error in getTopPerformers controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve top performers data'
    });
  }
};

/**
 * Get category analysis
 * @route GET /api/reports/category-analysis
 * @access Admin only
 */
const getCategoryAnalysis = async (req, res) => {
  try {
    const categoryAnalysis = await aggregationService.getCategoryAnalysis();

    res.json({
      success: true,
      message: 'Category analysis retrieved successfully',
      data: categoryAnalysis
    });

  } catch (error) {
    logger.error('Error in getCategoryAnalysis controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve category analysis'
    });
  }
};

/**
 * Get event statistics for a specific event
 * @route GET /api/reports/events/:eventId/stats
 * @access Admin, or Organizer (for their own events)
 */
const getEventStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { includeDetails = false } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    const eventStats = await aggregationService.getEventStats(eventId, includeDetails === 'true');

    res.json({
      success: true,
      message: 'Event statistics retrieved successfully',
      data: eventStats
    });

  } catch (error) {
    logger.error('Error in getEventStats controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve event statistics'
    });
  }
};

/**
 * Download report as JSON
 * @route GET /api/reports/:reportId/download
 * @access Admin only
 */
const downloadReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const Report = require('../models/Report');
    const report = await Report.findByPk(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const filename = `${report.type}-report-${report.start_date.toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(report.data);

  } catch (error) {
    logger.error('Error in downloadReport controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download report'
    });
  }
};

/**
 * Delete old reports (cleanup)
 * @route DELETE /api/reports/cleanup
 * @access Admin only
 */
const cleanupReports = async (req, res) => {
  try {
    const { days_old = 90 } = req.query;
    const daysOld = Math.max(parseInt(days_old), 30); // Minimum 30 days

    const deletedCount = await reportService.cleanupOldReports(daysOld);

    res.json({
      success: true,
      message: `Successfully cleaned up ${deletedCount} old reports`,
      data: { deletedCount, daysOld }
    });

  } catch (error) {
    logger.error('Error in cleanupReports controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cleanup reports'
    });
  }
};

/**
 * Health check endpoint for monitoring
 * @route GET /api/health or /api/reports/health
 * @access Public
 */
const healthCheck = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connectivity
    const dbStatus = await testDatabaseConnection();
    
    // Test aggregation service
    const aggregationStatus = await testAggregationService();
    
    // Test email service (optional)
    const emailStatus = await testEmailService();
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      response_time_ms: responseTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbStatus,
        aggregation: aggregationStatus,
        email: emailStatus
      },
      system: {
        memory: process.memoryUsage(),
        platform: process.platform,
        node_version: process.version
      }
    };

    // Determine overall health status
    const allServicesHealthy = Object.values(healthData.services).every(
      service => service.status === 'healthy'
    );

    if (!allServicesHealthy) {
      healthData.status = 'degraded';
      return res.status(503).json(healthData);
    }

    res.json(healthData);

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    });
  }
};

/**
 * Test database connection
 */
const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    
    // Test a simple query
    const userCount = await User.count();
    
    return {
      status: 'healthy',
      message: 'Database connection successful',
      response_time_ms: Date.now() - Date.now(),
      total_users: userCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message
    };
  }
};

/**
 * Test aggregation service
 */
const testAggregationService = async () => {
  try {
    // Test basic aggregation functionality
    const overview = await aggregationService.getPlatformOverview();
    
    return {
      status: 'healthy',
      message: 'Aggregation service operational',
      sample_data: {
        total_events: overview.totalEvents || 0,
        total_users: overview.totalUsers || 0
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Aggregation service failed',
      error: error.message
    };
  }
};

/**
 * Test email service (basic check)
 */
const testEmailService = async () => {
  try {
    // This is a basic check - just verify the service is importable
    // In production, you might want to send a test email
    const emailService = require('../services/emailService');
    
    return {
      status: 'healthy',
      message: 'Email service loaded successfully'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Email service unavailable',
      error: error.message
    };
  }
};

module.exports = {
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  generateEventReport,
  getReports,
  getReportById,
  getPlatformOverview,
  getTopPerformers,
  getCategoryAnalysis,
  getEventStats,
  downloadReport,
  cleanupReports,
  healthCheck,
  
  // Legacy exports for backward compatibility
  getAdminDashboard: exports.getAdminDashboard,
  getOrganizerSummary: exports.getOrganizerSummary,
  getEventAnalytics: exports.getEventAnalytics,
  getDonorActivity: exports.getDonorActivity
};

