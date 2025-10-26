/**
 * Unit tests for Report Service
 * Tests report generation functions with database mocking
 */

const reportService = require('../../src/services/reportService');
const { User, Event, Pledge, Report } = require('../../src/models');
const { sequelize } = require('../../src/config/database');
const logger = require('../../src/utils/logger');

// Mock dependencies
jest.mock('../../src/models');
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger');

describe('Report Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    sequelize.query = jest.fn();
    sequelize.QueryTypes = { SELECT: 'SELECT' };
    
    User.count = jest.fn();
    Event.count = jest.fn();
    Event.findAll = jest.fn();
    Event.findByPk = jest.fn();
    Pledge.count = jest.fn();
    Pledge.sum = jest.fn();
    Pledge.findAll = jest.fn();
    Pledge.findOne = jest.fn();
    Report.create = jest.fn();
    Report.findAll = jest.fn();
    Report.findByPk = jest.fn();
    Report.destroy = jest.fn();
  });

  describe('generateDailyReport', () => {
    const testDate = new Date('2024-01-15');
    const generatedBy = 123;

    beforeEach(() => {
      // Mock daily statistics
      User.count.mockResolvedValue(5);
      Event.count.mockResolvedValue(3);
      Pledge.count.mockResolvedValueOnce(12).mockResolvedValueOnce(8);
      Pledge.sum.mockResolvedValue(2500);

      // Mock hourly breakdown query
      sequelize.query.mockResolvedValueOnce([
        { hour: 9, pledge_count: 3, total_amount: 500 },
        { hour: 14, pledge_count: 5, total_amount: 1200 },
        { hour: 18, pledge_count: 4, total_amount: 800 }
      ]);

      // Mock top events query
      Event.findAll.mockResolvedValue([
        {
          id: 1,
          title: 'Event 1',
          current_amount: 1500,
          target_amount: 3000,
          pledges: [{ amount: 100 }, { amount: 200 }]
        }
      ]);

      // Mock user activity query
      sequelize.query.mockResolvedValueOnce([
        { role: 'donor', active_users: 15, actions_taken: 25 },
        { role: 'organizer', active_users: 3, actions_taken: 8 }
      ]);

      // Mock report creation
      Report.create.mockResolvedValue({
        id: 456,
        type: 'daily',
        title: 'Daily Report - 2024-01-15',
        status: 'completed',
        created_at: new Date()
      });
    });

    it('should generate daily report successfully', async () => {
      const result = await reportService.generateDailyReport(testDate, generatedBy);

      expect(result).toBeDefined();
      expect(result.type).toBe('daily');
      expect(result.title).toBe('Daily Report - 2024-01-15');

      expect(Report.create).toHaveBeenCalledWith({
        type: 'daily',
        title: 'Daily Report - 2024-01-15',
        start_date: expect.any(Date),
        end_date: expect.any(Date),
        data: expect.objectContaining({
          period: expect.objectContaining({
            type: 'daily',
            date: '2024-01-15'
          }),
          summary: expect.objectContaining({
            new_users: 5,
            new_events: 3,
            new_pledges: 12,
            total_pledged: 2500
          })
        }),
        status: 'completed',
        generated_by: generatedBy
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Daily report generated successfully')
      );
    });

    it('should handle invalid date', async () => {
      const invalidDate = new Date('invalid');

      await expect(reportService.generateDailyReport(invalidDate, generatedBy))
        .rejects.toThrow('Failed to generate daily report');

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      User.count.mockRejectedValue(new Error('Database connection failed'));

      await expect(reportService.generateDailyReport(testDate, generatedBy))
        .rejects.toThrow('Failed to generate daily report');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error generating daily report'),
        expect.any(Error)
      );
    });

    it('should include hourly breakdown in report data', async () => {
      const result = await reportService.generateDailyReport(testDate, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      expect(reportData.analytics.hourly_activity).toEqual([
        { hour: 9, pledge_count: 3, total_amount: 500 },
        { hour: 14, pledge_count: 5, total_amount: 1200 },
        { hour: 18, pledge_count: 4, total_amount: 800 }
      ]);
    });
  });

  describe('generateWeeklyReport', () => {
    const startDate = new Date('2024-01-15');
    const generatedBy = 123;

    beforeEach(() => {
      // Mock weekly statistics
      User.count.mockResolvedValue(15);
      Event.count.mockResolvedValue(8);
      Pledge.count.mockResolvedValue(45);
      Pledge.sum.mockResolvedValue(12500);
      Pledge.findOne.mockResolvedValue({
        dataValues: { avg_amount: 277.78 }
      });

      // Mock daily breakdown query
      sequelize.query.mockResolvedValueOnce([
        { date: '2024-01-15', unique_donors: 5, pledge_count: 8, total_amount: 2000, avg_amount: 250 },
        { date: '2024-01-16', unique_donors: 7, pledge_count: 12, total_amount: 3200, avg_amount: 266.67 }
      ]);

      // Mock event metrics query
      sequelize.query.mockResolvedValueOnce([
        {
          id: 1,
          title: 'Top Event',
          category: 'Education',
          target_amount: 5000,
          current_amount: 3500,
          pledge_count: 15,
          unique_donors: 12,
          week_pledged: 1500,
          progress_percentage: 70
        }
      ]);

      // Mock category performance query
      sequelize.query.mockResolvedValueOnce([
        {
          category: 'Education',
          event_count: 3,
          pledge_count: 25,
          total_pledged: 7500,
          avg_pledge_amount: 300
        }
      ]);

      // Mock user engagement query
      sequelize.query.mockResolvedValueOnce([
        { metric: 'new_users', count: 15 },
        { metric: 'active_donors', count: 45 },
        { metric: 'active_organizers', count: 8 }
      ]);

      Report.create.mockResolvedValue({
        id: 789,
        type: 'weekly',
        title: 'Weekly Report - Week of 2024-01-15',
        status: 'completed'
      });
    });

    it('should generate weekly report successfully', async () => {
      const result = await reportService.generateWeeklyReport(startDate, generatedBy);

      expect(result).toBeDefined();
      expect(result.type).toBe('weekly');

      const reportCall = Report.create.mock.calls[0][0];
      expect(reportCall.data.period.type).toBe('weekly');
      expect(reportCall.data.summary.new_users).toBe(15);
      expect(reportCall.data.summary.total_pledged).toBe(12500);
    });

    it('should include daily breakdown', async () => {
      await reportService.generateWeeklyReport(startDate, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      expect(reportData.analytics.daily_breakdown).toHaveLength(2);
      expect(reportData.analytics.daily_breakdown[0]).toEqual({
        date: '2024-01-15',
        unique_donors: 5,
        pledge_count: 8,
        total_amount: 2000,
        avg_amount: 250
      });
    });

    it('should include user engagement metrics', async () => {
      await reportService.generateWeeklyReport(startDate, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      expect(reportData.analytics.user_engagement).toEqual({
        new_users: 15,
        active_donors: 45,
        active_organizers: 8
      });
    });
  });

  describe('generateMonthlyReport', () => {
    const year = 2024;
    const month = 1; // January
    const generatedBy = 123;

    beforeEach(() => {
      // Mock monthly statistics
      User.count.mockResolvedValue(50);
      Event.count.mockResolvedValueOnce(20).mockResolvedValueOnce(15);
      Pledge.count.mockResolvedValueOnce(150).mockResolvedValueOnce(120);
      Pledge.sum.mockResolvedValueOnce(45000).mockResolvedValueOnce(38000);

      // Mock previous month statistics for growth calculation
      User.count.mockResolvedValueOnce(40);
      Event.count.mockResolvedValueOnce(18);
      Pledge.sum.mockResolvedValueOnce(40000);

      // Mock weekly breakdown
      sequelize.query.mockResolvedValueOnce([
        { week_number: 1, pledge_count: 35, total_amount: 10000, unique_donors: 25, events_with_pledges: 8 },
        { week_number: 2, pledge_count: 40, total_amount: 12000, unique_donors: 30, events_with_pledges: 10 }
      ]);

      // Mock top performers
      sequelize.query.mockResolvedValueOnce([
        { type: 'donors', id: 1, name: 'John Doe', pledge_count: 5, total_donated: 2500 },
        { type: 'organizers', id: 2, name: 'Jane Smith', event_count: 3, total_raised: 15000 }
      ]);

      // Mock category trends
      sequelize.query.mockResolvedValueOnce([
        {
          category: 'Education',
          total_events: 8,
          completed_events: 6,
          total_pledges: 60,
          total_pledged: 18000,
          avg_pledge_amount: 300,
          successfully_raised: 15000
        }
      ]);

      Report.create.mockResolvedValue({
        id: 999,
        type: 'monthly',
        title: 'Monthly Report - January 2024',
        status: 'completed'
      });
    });

    it('should generate monthly report successfully', async () => {
      const result = await reportService.generateMonthlyReport(year, month, generatedBy);

      expect(result).toBeDefined();
      expect(result.type).toBe('monthly');

      const reportCall = Report.create.mock.calls[0][0];
      expect(reportCall.data.period.type).toBe('monthly');
      expect(reportCall.data.period.year).toBe(2024);
      expect(reportCall.data.period.month).toBe(1);
      expect(reportCall.data.period.month_name).toBe('January');
    });

    it('should calculate growth rates correctly', async () => {
      await reportService.generateMonthlyReport(year, month, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      expect(reportData.growth_analysis.user_growth).toBe('25.00'); // (50-40)/40 * 100
      expect(reportData.growth_analysis.event_growth).toBe('11.11'); // (20-18)/18 * 100
      expect(reportData.growth_analysis.pledge_growth).toBe('12.50'); // (45000-40000)/40000 * 100
    });

    it('should handle year and month validation', async () => {
      await expect(reportService.generateMonthlyReport(2019, month, generatedBy))
        .rejects.toThrow();

      await expect(reportService.generateMonthlyReport(year, 13, generatedBy))
        .rejects.toThrow();
    });

    it('should include category performance analysis', async () => {
      await reportService.generateMonthlyReport(year, month, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      expect(reportData.analytics.category_performance).toHaveLength(1);
      expect(reportData.analytics.category_performance[0]).toMatchObject({
        category: 'Education',
        total_events: 8,
        completed_events: 6,
        completion_rate: '75.00',
        total_pledged: 18000
      });
    });
  });

  describe('generateEventReport', () => {
    const eventId = 123;
    const generatedBy = 456;

    const mockEvent = {
      id: 123,
      title: 'Test Event',
      description: 'Test Description',
      category: 'Education',
      status: 'active',
      target_amount: 5000,
      current_amount: 3000,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-15'),
      organizer: {
        id: 789,
        name: 'Event Organizer',
        email: 'organizer@example.com',
        role: 'organizer'
      },
      pledges: [
        {
          id: 1,
          amount: 500,
          donor_id: 101,
          is_anonymous: false,
          message: 'Great cause!',
          payment_status: 'completed',
          created_at: new Date('2024-01-02'),
          donor: { id: 101, name: 'Donor 1', email: 'donor1@example.com' }
        },
        {
          id: 2,
          amount: 1000,
          donor_id: 102,
          is_anonymous: true,
          message: null,
          payment_status: 'pending',
          created_at: new Date('2024-01-05'),
          donor: { id: 102, name: 'Donor 2', email: 'donor2@example.com' }
        }
      ]
    };

    beforeEach(() => {
      Event.findByPk.mockResolvedValue(mockEvent);

      // Mock pledge timeline query
      sequelize.query.mockResolvedValue([
        { date: '2024-01-02', pledge_count: 1, daily_amount: 500, unique_donors: 1 },
        { date: '2024-01-05', pledge_count: 1, daily_amount: 1000, unique_donors: 1 }
      ]);

      Report.create.mockResolvedValue({
        id: 111,
        type: 'event',
        title: 'Event Report - Test Event',
        status: 'completed'
      });
    });

    it('should generate event report successfully', async () => {
      const result = await reportService.generateEventReport(eventId, generatedBy);

      expect(Event.findByPk).toHaveBeenCalledWith(eventId, expect.any(Object));
      expect(result).toBeDefined();
      expect(result.type).toBe('event');

      const reportCall = Report.create.mock.calls[0][0];
      expect(reportCall.data.event.id).toBe(123);
      expect(reportCall.data.event.title).toBe('Test Event');
    });

    it('should calculate event metrics correctly', async () => {
      await reportService.generateEventReport(eventId, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      expect(reportData.summary.total_pledges).toBe(2);
      expect(reportData.summary.unique_donors).toBe(2);
      expect(reportData.summary.total_amount).toBe(1500);
      expect(reportData.summary.average_pledge).toBe(750);
      expect(reportData.summary.progress_percentage).toBe('30.00'); // 1500/5000 * 100
      expect(reportData.summary.target_reached).toBe(false);
    });

    it('should handle anonymous pledges correctly', async () => {
      await reportService.generateEventReport(eventId, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      expect(reportData.summary.anonymous_pledges).toBe(1);
      expect(reportData.summary.anonymous_total).toBe(1000);

      const detailedPledges = reportData.detailed_pledges;
      expect(detailedPledges[0].donor_name).toBe('Donor 1');
      expect(detailedPledges[1].donor_name).toBe('Anonymous');
    });

    it('should calculate milestone tracking', async () => {
      await reportService.generateEventReport(eventId, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      // With target 5000 and current 1500, no milestones should be reached
      expect(reportData.analytics.milestones).toHaveLength(0);
    });

    it('should handle event not found', async () => {
      Event.findByPk.mockResolvedValue(null);

      await expect(reportService.generateEventReport(eventId, generatedBy))
        .rejects.toThrow('Event not found');
    });

    it('should calculate cumulative amounts in timeline', async () => {
      await reportService.generateEventReport(eventId, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      const timeline = reportData.analytics.pledge_timeline;
      
      expect(timeline[0].cumulative_amount).toBe(500);
      expect(timeline[1].cumulative_amount).toBe(1500);
    });

    it('should group pledges by amount ranges', async () => {
      await reportService.generateEventReport(eventId, generatedBy);

      const reportData = Report.create.mock.calls[0][0].data;
      const distribution = reportData.analytics.amount_distribution;
      
      expect(distribution.under_50).toBe(0);
      expect(distribution['500_1000']).toBe(1); // 500 pledge
      expect(distribution.over_1000).toBe(1); // 1000 pledge
    });
  });

  describe('getReports', () => {
    beforeEach(() => {
      Report.findAll.mockResolvedValue([
        {
          id: 1,
          type: 'daily',
          status: 'completed',
          created_at: new Date('2024-01-01')
        },
        {
          id: 2,
          type: 'weekly',
          status: 'completed',
          created_at: new Date('2024-01-08')
        }
      ]);
    });

    it('should retrieve reports with default filters', async () => {
      const result = await reportService.getReports();

      expect(Report.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['created_at', 'DESC']],
        limit: 20,
        offset: 0,
        include: expect.any(Array)
      });

      expect(result).toHaveLength(2);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        type: 'daily',
        status: 'completed',
        limit: 10,
        offset: 5,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      await reportService.getReports(filters);

      expect(Report.findAll).toHaveBeenCalledWith({
        where: {
          type: 'daily',
          status: 'completed',
          created_at: {
            [expect.anything()]: [new Date('2024-01-01'), new Date('2024-01-31')]
          }
        },
        order: [['created_at', 'DESC']],
        limit: 10,
        offset: 5,
        include: expect.any(Array)
      });
    });

    it('should handle database errors', async () => {
      Report.findAll.mockRejectedValue(new Error('Database error'));

      await expect(reportService.getReports())
        .rejects.toThrow('Failed to retrieve reports');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('cleanupOldReports', () => {
    it('should delete old reports successfully', async () => {
      Report.destroy.mockResolvedValue(5);

      const result = await reportService.cleanupOldReports(90);

      expect(Report.destroy).toHaveBeenCalledWith({
        where: {
          created_at: {
            [expect.anything()]: expect.any(Date)
          }
        }
      });

      expect(result).toBe(5);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 5 old reports')
      );
    });

    it('should handle cleanup errors', async () => {
      Report.destroy.mockRejectedValue(new Error('Cleanup failed'));

      await expect(reportService.cleanupOldReports(90))
        .rejects.toThrow('Failed to cleanup old reports');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Module Exports', () => {
    it('should export all required functions', () => {
      expect(typeof reportService.generateDailyReport).toBe('function');
      expect(typeof reportService.generateWeeklyReport).toBe('function');
      expect(typeof reportService.generateMonthlyReport).toBe('function');
      expect(typeof reportService.generateEventReport).toBe('function');
      expect(typeof reportService.getReports).toBe('function');
      expect(typeof reportService.cleanupOldReports).toBe('function');
    });
  });
});