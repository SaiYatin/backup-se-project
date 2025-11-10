const logger = require('../../utils/logger');

describe('Logger Utility', () => {
  it('should call logger.info()', () => {
    const spy = jest.spyOn(logger, 'info');
    logger.info('This is a test log');
    expect(spy).toHaveBeenCalledWith('This is a test log');
  });

  it('should call logger.error()', () => {
    const spy = jest.spyOn(logger, 'error');
    logger.error('This is an error');
    expect(spy).toHaveBeenCalledWith('This is an error');
  });
});
