const authController = require('../../controllers/authController');
const { User } = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../../models');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('test_register_with_valid_data_creates_user', async () => {
    req.body = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test@123',
      role: 'donor'
    };

    User.findOne = jest.fn().mockResolvedValue(null);
    User.create = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'donor',
      toJSON: () => ({ id: 1, name: 'Test User', email: 'test@example.com', role: 'donor' })
    });
    bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');

    await authController.register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });

  test('test_login_with_valid_credentials_returns_token', async () => {
    req.body = {
      email: 'test@example.com',
      password: 'Test@123'
    };
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: 'donor',
      toJSON: () => ({ id:1, email: 'test@example.com', role: 'donor' })
    };

    User.findOne = jest.fn().mockResolvedValue(mockUser);
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    jwt.sign = jest.fn().mockReturnValue('valid.jwt.token');

    await authController.login(req, res, next);

    // Login controller responds with JSON (200 implicit), not res.status(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: expect.any(String)
        })
      })
    );
  });

  test('test_login_with_invalid_credentials_returns_401', async () => {
    req.body = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    User.findOne = jest.fn().mockResolvedValue(null);

    await authController.login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false
      })
    );
  });
});
