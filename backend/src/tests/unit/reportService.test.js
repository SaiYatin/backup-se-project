jest.mock('../../../models', () => ({
  Report: {
    findAll: jest.fn(() => Promise.resolve([{ id: 1, title: 'Mock Report' }]))
  },
}));
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
const { getReports } = require('../../../services/reportService');

describe('Report Service', () => {
  test('getReports() should return mock data', async () => {
    const reports = await getReports();
    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0]).toHaveProperty('title');
  });
});
