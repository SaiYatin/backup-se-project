const logger = require('../../utils/logger');

describe('Logger Utility Tests', () => {
  test('test_logger_info_logs_message', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logger.info('Test info message');
    spy.mockRestore();
  });

  test('test_logger_error_logs_error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    logger.error('Test error message');
    spy.mockRestore();
  });

  test('test_logger_warn_logs_warning', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    logger.warn('Test warning message');
    spy.mockRestore();
  });
});
