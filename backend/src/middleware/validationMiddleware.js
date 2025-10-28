// ✅ backend/src/middleware/validationMiddleware.js
// SIMPLIFIED VERSION FOR DEVELOPMENT

const Joi = require('joi');
const logger = require('../utils/logger');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));

      logger.warn('Validation error:', errors);

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    // SIMPLIFIED: Just require 6+ characters for development
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters'
      }),
    role: Joi.string().valid('donor', 'organizer').default('donor')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createEvent: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(20).max(5000).required(),
    target_amount: Joi.number().min(100).required(),
    category: Joi.string().max(50).optional(),
    image_url: Joi.string().uri().optional(),
    end_date: Joi.date().greater('now').optional()
  }),

  submitPledge: Joi.object({
    event_id: Joi.string().uuid().required(),
    amount: Joi.number().min(10).required(),
    is_anonymous: Joi.boolean().default(false),
    message: Joi.string().max(500).optional()
  })
};

module.exports = { validate, schemas };

// ===================================================================
// PRODUCTION VERSION (comment out the above and use this instead)
// ===================================================================
/*
const schemas = {
  register: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
      }),
    role: Joi.string().valid('donor', 'organizer').default('donor')
  }),
  // ... rest of schemas
};
*/