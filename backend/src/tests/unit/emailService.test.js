jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const { sendEmail } = require('../../services/emailService');

describe('Email Service', () => {
  test('sendEmail() should throw error for invalid inputs', async () => {
    await expect(sendEmail('', '', '')).rejects.toThrow();
  });

  test('sendEmail() should handle valid inputs (mocked)', async () => {
    const result = await sendEmail('test@example.com', 'Subject', 'Hello world');
    expect(result).toBeDefined();
  });
});
