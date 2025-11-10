// ✅ Fixed path issue and mock
const helpers = require('../../utils/helpers');

// Mock logger to avoid actual logging during tests
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should format currency correctly', () => {
    const result = helpers.formatCurrency(1000);
    expect(result).toBe('₹1,000.00');
  });

  test('should generate random string of given length', () => {
    const str = helpers.randomString(8);
    expect(str).toHaveLength(8);
  });
});
