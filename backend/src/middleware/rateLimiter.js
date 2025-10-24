const rateLimit = require('express-rate-limit');

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// Moderate limiter for pledge submissions
const pledgeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 pledges per hour
  message: 'Too many pledge submissions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  pledgeLimiter
};