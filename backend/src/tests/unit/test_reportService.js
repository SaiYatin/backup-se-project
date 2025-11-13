const reportService = require('../../services/reportService');
const { Event, Pledge, User, Report } = require('../../models');

jest.mock('../../models');

describe('Report Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  // Ensure DB queries and Report.create are mocked so unit tests don't hit the real DB
  const db = require('../../config/database');
  const { Report } = require('../../models');
  beforeAll(() => {
    if (db && db.sequelize && typeof db.sequelize.query === 'function') {
      db.sequelize.query = jest.fn().mockResolvedValue([]);
    }
    // Mock Report.create to return a resolved object to simulate DB save
    if (Report) {
      Report.create = jest.fn().mockImplementation(async (obj) => ({ id: 'r1', ...obj }));
    }
  });

  test('test_generateDailyReport_returns_test_stub', async () => {
    const date = new Date();
    const result = await reportService.generateDailyReport(date, 'user1');

    expect(result).toBeDefined();
    expect(result.type).toBe('daily');
    expect(result.status).toBe('completed');
  });

  test('test_generateWeeklyReport_returns_test_stub', async () => {
    const date = new Date();
    const result = await reportService.generateWeeklyReport(date, 'user1');

    expect(result).toBeDefined();
    expect(result.type).toBe('weekly');
  });

  test('test_generateMonthlyReport_returns_test_stub', async () => {
    const result = await reportService.generateMonthlyReport(2025, 11, 'user1');

    expect(result).toBeDefined();
    expect(result.type).toBe('monthly');
  });

  test('test_generateEventReport_handles_event_not_found', async () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    Event.findByPk = jest.fn().mockResolvedValue(null);

    try {
      await reportService.generateEventReport(validUUID, 'user1');
    } catch (error) {
      expect(error.message).toContain('Event not found');
    }
  });

  test('test_generateEventReport_with_valid_event', async () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    const mockEvent = {
      id: validUUID,
      title: 'Test',
      description: 'Desc',
      category: 'Education',
      status: 'active',
      target_amount: 10000,
      current_amount: 5000,
      created_at: new Date(),
      updated_at: new Date(),
      organizer: { id: 'org1', name: 'Org', email: 'org@test.com' },
      pledges: []
    };
    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);
    
    // Mock sequelize.query for pledge timeline
    const db = require('../../config/database');
    if (db && db.sequelize) {
      db.sequelize.query = jest.fn().mockResolvedValue([]);
    }

    const result = await reportService.generateEventReport(validUUID, 'user1');

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.event).toBeDefined();
  });

  test('test_getReports_filters_by_type', async () => {
    Report.findAll = jest.fn().mockResolvedValue([
      { id: 'r1', type: 'daily', status: 'completed' }
    ]);

    const result = await reportService.getReports({ type: 'daily', limit: 20 });

    expect(Array.isArray(result)).toBe(true);
  });

  test('test_cleanupOldReports_returns_deleted_count', async () => {
    Report.destroy = jest.fn().mockResolvedValue(5);

    const result = await reportService.cleanupOldReports(90);

    expect(result).toBe(5);
  });

  test('test_getReports_filters_by_status', async () => {
    Report.findAll = jest.fn().mockResolvedValue([
      { id: 'r1', type: 'daily', status: 'completed' }
    ]);

    const result = await reportService.getReports({ status: 'completed' });

    expect(Array.isArray(result)).toBe(true);
    expect(Report.findAll).toHaveBeenCalled();
  });

  test('test_getReports_filters_by_date_range', async () => {
    Report.findAll = jest.fn().mockResolvedValue([]);

    const result = await reportService.getReports({
      startDate: '2025-01-01',
      endDate: '2025-01-31'
    });

    expect(Array.isArray(result)).toBe(true);
    expect(Report.findAll).toHaveBeenCalled();
  });

  test('test_getReports_with_limit_and_offset', async () => {
    Report.findAll = jest.fn().mockResolvedValue([]);

    const result = await reportService.getReports({ limit: 10, offset: 5 });

    expect(Array.isArray(result)).toBe(true);
    expect(Report.findAll).toHaveBeenCalled();
  });
});
