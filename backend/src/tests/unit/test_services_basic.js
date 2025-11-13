const reportService = require('../../services/reportService');
const aggregationService = require('../../services/aggregationService');

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
    const overview = await aggregationService.getPlatformOverview();
    expect(overview).toBeTruthy();
    expect(overview).toHaveProperty('totalUsers');
    expect(typeof overview.totalUsers).toBe('number');
  });
});
