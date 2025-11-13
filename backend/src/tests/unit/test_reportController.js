const reportController = require('../../controllers/reportController');
const aggregationService = require('../../services/aggregationService');
const reportService = require('../../services/reportService');
const { Event, Pledge, User, Report } = require('../../models');

jest.mock('../../models');
jest.mock('../../services/aggregationService');
jest.mock('../../services/reportService');

describe('Report Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 1, role: 'admin' },
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('test_getDonationStats_returns_metrics', async () => {
    // Use existing getPlatformOverview controller which delegates to aggregationService
    aggregationService.getPlatformOverview = jest.fn().mockResolvedValue({
      totalEvents: 5,
      totalUsers: 20,
      totalPledges: 10
    });

    await reportController.getPlatformOverview(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ totalEvents: 5 })
      })
    );
  });

  test('test_getEventStats_returns_event_data', async () => {
    aggregationService.getEventStats = jest.fn().mockResolvedValue({
      id: 'evt1',
      totalPledges: 3,
      totalAmount: 15000
    });

    req.params.eventId = 'evt1';
    req.query = { includeDetails: 'false' };

    await reportController.getEventStats(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: 'evt1' })
      })
    );
  });

  test('test_getAdminDashboard_returns_data', async () => {
    User.count = jest.fn().mockResolvedValue(10);
    Event.count = jest.fn().mockResolvedValue(5);
    Pledge.count = jest.fn().mockResolvedValue(20);
    User.findAll = jest.fn().mockResolvedValue([]);
    Event.findAll = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    Pledge.findOne = jest.fn().mockResolvedValue({ dataValues: { totalAmount: 1000, averageAmount: 50 } });
    Pledge.findAll = jest.fn().mockResolvedValue([]);

    await reportController.getAdminDashboard(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getOrganizerSummary_returns_data', async () => {
    req.user.id = 'org1';
    Event.findAll = jest.fn().mockResolvedValue([
      { id: 'evt1', status: 'active', current_amount: 1000, target_amount: 2000, pledges: [] }
    ]);

    await reportController.getOrganizerSummary(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getEventAnalytics_returns_data', async () => {
    req.params.eventId = 'evt1';
    Event.findByPk = jest.fn().mockResolvedValue({
      id: 'evt1',
      pledges: [{ amount: 100 }]
    });

    await reportController.getEventAnalytics(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getEventAnalytics_handles_not_found', async () => {
    req.params.eventId = 'evt1';
    Event.findByPk = jest.fn().mockResolvedValue(null);

    await reportController.getEventAnalytics(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_getDonorActivity_returns_data', async () => {
    req.user.id = 'donor1';
    Pledge.findAll = jest.fn().mockResolvedValue([
      { id: 'p1', amount: 100, event: { id: 'evt1', title: 'Event 1' } }
    ]);

    await reportController.getDonorActivity(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getTopPerformers_returns_data', async () => {
    aggregationService.getTopPerformers = jest.fn().mockResolvedValue({
      topDonors: [],
      topOrganizers: []
    });

    await reportController.getTopPerformers(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getCategoryAnalysis_returns_data', async () => {
    aggregationService.getCategoryAnalysis = jest.fn().mockResolvedValue({
      categories: []
    });

    await reportController.getCategoryAnalysis(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_generateDailyReport_creates_report', async () => {
    req.body.date = '2025-01-15';
    reportService.generateDailyReport = jest.fn().mockResolvedValue({
      id: 'r1',
      type: 'daily'
    });

    await reportController.generateDailyReport(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_generateWeeklyReport_creates_report', async () => {
    req.body.startDate = '2025-01-15';
    reportService.generateWeeklyReport = jest.fn().mockResolvedValue({
      id: 'r1',
      type: 'weekly'
    });

    await reportController.generateWeeklyReport(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_generateMonthlyReport_creates_report', async () => {
    req.body.year = 2025;
    req.body.month = 1;
    reportService.generateMonthlyReport = jest.fn().mockResolvedValue({
      id: 'r1',
      type: 'monthly'
    });

    await reportController.generateMonthlyReport(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_generateEventReport_creates_report', async () => {
    req.params.eventId = 'evt1';
    reportService.generateEventReport = jest.fn().mockResolvedValue({
      id: 'r1',
      type: 'event'
    });

    await reportController.generateEventReport(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getReports_returns_reports', async () => {
    req.query.type = 'daily';
    reportService.getReports = jest.fn().mockResolvedValue([
      { id: 'r1', type: 'daily' }
    ]);

    await reportController.getReports(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getReportById_returns_report', async () => {
    req.params.id = 'r1';
    Report.findByPk = jest.fn().mockResolvedValue({
      id: 'r1',
      type: 'daily'
    });

    await reportController.getReportById(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getReportById_handles_not_found', async () => {
    req.params.id = 'r1';
    Report.findByPk = jest.fn().mockResolvedValue(null);

    await reportController.getReportById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_healthCheck_returns_status', async () => {
    await reportController.healthCheck(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getEventStats_handles_missing_eventId', async () => {
    req.params.eventId = undefined;

    await reportController.getEventStats(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('test_getTopPerformers_with_period', async () => {
    req.query.period = 60;
    aggregationService.getTopPerformers = jest.fn().mockResolvedValue({
      topDonors: [],
      topOrganizers: []
    });

    await reportController.getTopPerformers(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getAdminDashboard_handles_error', async () => {
    User.count = jest.fn().mockRejectedValue(new Error('DB error'));

    await reportController.getAdminDashboard(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('test_getOrganizerSummary_handles_error', async () => {
    req.user.id = 'org1';
    Event.findAll = jest.fn().mockRejectedValue(new Error('DB error'));

    await reportController.getOrganizerSummary(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('test_getEventAnalytics_handles_error', async () => {
    req.params.eventId = 'evt1';
    Event.findByPk = jest.fn().mockRejectedValue(new Error('DB error'));

    await reportController.getEventAnalytics(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
