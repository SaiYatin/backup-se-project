const reportService = require('../../services/reportService');
const aggregationService = require('../../services/aggregationService');
const { User, Event, Pledge } = require('../../models');

jest.mock('../../models');

describe('Basic Services smoke tests', () => {
  test('generateDaily/Weekly/Monthly return report-like objects in test env', async () => {
    const today = new Date();
    const daily = await reportService.generateDailyReport(today, 'tester');
    expect(daily).toHaveProperty('type');
    expect(daily.type).toBe('daily');

    const weekly = await reportService.generateWeeklyReport(today, 'tester');
    expect(weekly).toHaveProperty('type');
    expect(weekly.type).toBe('weekly');

    const monthly = await reportService.generateMonthlyReport(today.getFullYear(), today.getMonth() + 1, 'tester');
    expect(monthly).toHaveProperty('type');
    expect(monthly.type).toBe('monthly');
  });

  test('aggregationService.getPlatformOverview returns an object with totals', async () => {
    // Mock database calls
    User.count = jest.fn().mockResolvedValue(10);
    Event.count = jest.fn()
      .mockResolvedValueOnce(5)  // totalEvents
      .mockResolvedValueOnce(3)  // activeEvents
      .mockResolvedValueOnce(1)  // completedEvents
      .mockResolvedValueOnce(1)  // pendingEvents
      .mockResolvedValueOnce(2); // endedEvents (for success rate)
    Pledge.count = jest.fn().mockResolvedValue(20);
    User.findAll = jest.fn().mockResolvedValue([
      { role: 'donor', count: 8 },
      { role: 'organizer', count: 2 }
    ]);
    Pledge.findOne = jest.fn().mockResolvedValue({
      totalAmount: 5000,
      averageAmount: 250,
      maxAmount: 1000,
      minAmount: 50
    });
    Event.findOne = jest.fn().mockResolvedValue({
      totalRaised: 5000,
      totalTarget: 10000
    });
    Pledge.findAll = jest.fn().mockResolvedValue([
      { payment_status: 'completed', count: 15, total: 4000 },
      { payment_status: 'pending', count: 5, total: 1000 }
    ]);
    
    const overview = await aggregationService.getPlatformOverview();
    expect(overview).toBeTruthy();
    expect(overview).toHaveProperty('totalUsers');
    expect(typeof overview.totalUsers).toBe('number');
  });
});
