const errorHandler = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

jest.mock('../../utils/logger');

describe('Error Handler Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/api/test',
      method: 'GET'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('test_handles_sequelize_validation_error', () => {
    const error = {
      name: 'SequelizeValidationError',
      errors: [
        { path: 'email', message: 'Invalid email' }
      ]
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  test('test_handles_sequelize_unique_constraint_error', () => {
    const error = {
      name: 'SequelizeUniqueConstraintError',
      errors: [
        { path: 'email', message: 'email must be unique' }
      ]
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  test('test_handles_jwt_error', () => {
    const error = {
      name: 'JsonWebTokenError'
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
  });

  test('test_handles_token_expired_error', () => {
    const error = {
      name: 'TokenExpiredError'
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
  });

  test('test_handles_default_error', () => {
    const error = {
      message: 'Test error',
      statusCode: 500
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });

  test('test_handles_error_without_message', () => {
    const error = {};

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });
});

