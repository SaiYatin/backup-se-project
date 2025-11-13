const aggregationService = require('../../services/aggregationService');
const { User, Event, Pledge } = require('../../models');

jest.mock('../../models');

describe('Aggregation Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('test_getPlatformOverview_returns_stats', async () => {
    User.count = jest.fn().mockResolvedValue(10);
    Event.count = jest.fn().mockResolvedValue(5);
    Pledge.count = jest.fn().mockResolvedValue(20);
    User.findAll = jest.fn().mockResolvedValue([{ role: 'donor', count: 10 }]);
    Pledge.findOne = jest.fn().mockResolvedValue({
      totalAmount: 5000,
      averageAmount: 250,
      maxAmount: 1000,
      minAmount: 100
    });
    Event.findOne = jest.fn().mockResolvedValue({
      totalRaised: 5000,
      totalTarget: 10000
    });
    Pledge.findAll = jest.fn().mockResolvedValue([]);

    const result = await aggregationService.getPlatformOverview();

    expect(result).toBeDefined();
    expect(result.totalUsers).toBe(10);
    expect(result.totalEvents).toBe(5);
  });

  test('test_getTopPerformers_returns_donors_and_organizers', async () => {
    Pledge.findAll = jest.fn().mockResolvedValue([
      {
        donor_id: 1,
        donor: { id: 1, name: 'John', email: 'john@test.com' },
        dataValues: { pledgeCount: 5, totalDonated: 2500 }
      }
    ]);
    Event.findAll = jest.fn().mockResolvedValue([
      {
        organizer_id: 2,
        organizer: { id: 2, name: 'Jane', email: 'jane@test.com' },
        dataValues: { eventCount: 2, totalRaised: 5000 }
      }
    ]);

    const result = await aggregationService.getTopPerformers(30);

    expect(result).toBeDefined();
    expect(result.topDonors).toBeDefined();
    expect(result.topOrganizers).toBeDefined();
  });

  test('test_getCategoryAnalysis_returns_category_stats', async () => {
    Event.findAll = jest.fn().mockResolvedValue([
      {
        category: 'Education',
        eventCount: 3,
        activeCount: 2,
        completedCount: 1,
        totalRaised: 15000,
        totalTarget: 20000,
        avgRaised: 5000,
        totalPledges: 30
      }
    ]);

    const result = await aggregationService.getCategoryAnalysis();

    expect(result).toBeDefined();
    expect(result.categories).toBeDefined();
  });

  test('test_getEventStats_returns_event_data', async () => {
    Event.findByPk = jest.fn().mockResolvedValue({
      id: 'evt1',
      title: 'Test Event',
      description: 'Test',
      category: 'Education',
      status: 'active',
      target_amount: 10000,
      current_amount: 5000,
      created_at: new Date(),
      end_date: new Date(),
      organizer: { id: 1, name: 'Org', email: 'org@test.com' }
    });
    Pledge.findAll = jest.fn().mockResolvedValue([
      { amount: 1000, payment_status: 'completed' }
    ]);
    Pledge.count = jest.fn().mockResolvedValue(5);

    const result = await aggregationService.getEventStats('evt1', false);

    expect(result).toBeDefined();
    expect(result.event).toBeDefined();
  });

  test('test_getGrowthMetrics_returns_comparison', async () => {
    User.count = jest.fn().mockResolvedValue(5);
    Event.count = jest.fn().mockResolvedValue(2);
    Pledge.count = jest.fn().mockResolvedValue(10);
    Pledge.sum = jest.fn().mockResolvedValue(5000);

    const result = await aggregationService.getGrowthMetrics(30);

    expect(result).toBeDefined();
    expect(result.current).toBeDefined();
    expect(result.growth).toBeDefined();
  });
});
