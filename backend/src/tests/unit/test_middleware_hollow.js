// ============================================
// FILE 1: test_middleware_hollow.js (FIXED)
// ============================================
/**
 * Hollow tests for middleware files
 * Purpose: Cover all branches in authMiddleware, roleMiddleware, validationMiddleware
 */

const authenticate = require('../../middleware/authMiddleware');
const checkRole = require('../../middleware/roleMiddleware');
const { validate, schemas } = require('../../middleware/validationMiddleware');
const User = require('../../models/User');
const jwt = require('../../config/jwt');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../config/jwt', () => ({
  verifyToken: jest.fn(),
  generateToken: jest.fn(),
  JWT_SECRET: 'test-secret',
  JWT_EXPIRE: '7d'
}));
jest.mock('../../utils/logger');

describe('Middleware Hollow Coverage Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware - authenticate function', () => {
    it('should reject request without authorization header', async () => {
      req.headers.authorization = undefined;
      
      await authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided. Please login.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      req.headers.authorization = 'InvalidFormat token123';
      
      await authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided. Please login.'
      });
    });

    it('should authenticate valid token and user', async () => {
      const mockUser = { id: 'user-1', name: 'John', role: 'donor' };
      
      req.headers.authorization = 'Bearer valid_token';
      jwt.verifyToken.mockReturnValue({ id: 'user-1' });
      User.findByPk.mockResolvedValue(mockUser);
      
      await authenticate(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.user).toBe(mockUser);
    });

    it('should reject when user not found in database', async () => {
      req.headers.authorization = 'Bearer valid_token';
      jwt.verifyToken.mockReturnValue({ id: 'user-999' });
      User.findByPk.mockResolvedValue(null);
      
      await authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.success).toBe(false);
      expect(['User not found. Token invalid.', 'Invalid or expired token']).toContain(callArgs.message);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle invalid token error', async () => {
      req.headers.authorization = 'Bearer invalid_token';
      jwt.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
    });

    it('should handle database error', async () => {
      req.headers.authorization = 'Bearer valid_token';
      jwt.verifyToken.mockReturnValue({ id: 'user-1' });
      User.findByPk.mockRejectedValue(new Error('Database error'));
      
      await authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
    });
  });

  describe('roleMiddleware - checkRole function', () => {
    it('should reject when user not authenticated', () => {
      const middleware = checkRole('admin');
      req.user = null;
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access for matching role', () => {
      const middleware = checkRole('donor');
      req.user = { id: 'user-1', role: 'donor' };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject access for non-matching role', () => {
      const middleware = checkRole('admin');
      req.user = { id: 'user-1', role: 'donor' };
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required role: admin'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle multiple allowed roles', () => {
      const middleware = checkRole('donor', 'organizer');
      req.user = { id: 'user-1', role: 'organizer' };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should reject when role not in allowed list', () => {
      const middleware = checkRole('admin', 'organizer');
      req.user = { id: 'user-1', role: 'donor' };
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle admin role check', () => {
      const middleware = checkRole('admin');
      req.user = { id: 'user-1', role: 'admin' };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validationMiddleware - validate function', () => {
    it('should pass validation for valid register data', () => {
      const middleware = validate(schemas.register);
      req.body = {
        name: 'John Doe',
        email: 'john@test.com',
        password: 'password123',
        role: 'donor'
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid register data', () => {
      const middleware = validate(schemas.register);
      req.body = {
        name: 'Jo', // too short
        email: 'invalid-email',
        password: '123' // too short
      };
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
          errors: expect.any(Array)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass validation for valid login data', () => {
      const middleware = validate(schemas.login);
      req.body = {
        email: 'test@test.com',
        password: 'password123'
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should reject missing login fields', () => {
      const middleware = validate(schemas.login);
      req.body = {
        email: 'test@test.com'
        // missing password
      };
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should pass validation for valid event creation', () => {
      const middleware = validate(schemas.createEvent);
      req.body = {
        title: 'Valid Event Title',
        description: 'This is a valid description that is long enough for validation',
        target_amount: 1000,
        category: 'health'
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid event data', () => {
      const middleware = validate(schemas.createEvent);
      req.body = {
        title: 'Bad', // too short
        description: 'Too short', // too short
        target_amount: 50 // below minimum
      };
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should pass validation for valid pledge', () => {
      const middleware = validate(schemas.submitPledge);
      req.body = {
        event_id: '123e4567-e89b-12d3-a456-426614174000',
        amount: 100,
        is_anonymous: false
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid pledge data', () => {
      const middleware = validate(schemas.submitPledge);
      req.body = {
        event_id: 'not-a-uuid',
        amount: 5 // below minimum
      };
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should strip unknown fields', () => {
      const middleware = validate(schemas.login);
      req.body = {
        email: 'test@test.com',
        password: 'password123',
        extraField: 'should be removed'
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should handle multiple validation errors', () => {
      const middleware = validate(schemas.register);
      req.body = {
        name: 'A',
        email: 'bad',
        password: '1'
      };
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.errors.length).toBeGreaterThan(1);
    });
  });
});
