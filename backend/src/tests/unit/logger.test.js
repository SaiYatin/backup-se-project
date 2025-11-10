const logger = require('../../utils/logger');

describe('Logger Utility', () => {
  test('should have info and error methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  test('should log info message', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('This is a test log');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
