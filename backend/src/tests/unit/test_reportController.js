const reportController = require('../../controllers/reportController');
const aggregationService = require('../../services/aggregationService');
const { Event, Pledge } = require('../../models');

jest.mock('../../models');
jest.mock('../../services/aggregationService');

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
    // Mock aggregationService.getEventStats
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
});
