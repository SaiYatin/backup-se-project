// src/tests/setup-jest.js
jest.mock('nodemailer', () => {
  const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'mocked-message-id' });
  return {
    createTransport: jest.fn(() => ({
      sendMail: sendMailMock,
    })),
  };
});

jest.setTimeout(20000); // allow integration tests more time
