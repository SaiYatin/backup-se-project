const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Custom format for audit events
const auditFormat = winston.format((info) => {
  if (info.audit) {
    return {
      ...info,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: 'fundraising-portal',
      host: require('os').hostname(),
    };
  }
  return info;
});

// Create separate logger for audit events
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    auditFormat(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'audit.log'),
      level: 'info'
    })
  ]
});

// Ensure log directory exists to avoid ENOENT errors when using File transports
try {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  // If directory creation fails, at least continue so logger can attempt console logging
  // Keep a minimal console warning (don't throw to avoid crashing on startup)
  // eslint-disable-next-line no-console
  console.warn('Could not create logs directory:', err.message);
}

// Main application logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'fundraising-portal' },
  transports: [
    new winston.transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join('logs', 'combined.log') })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  );
  
  logger.add(new winston.transports.Console({ format: consoleFormat }));
  auditLogger.add(new winston.transports.Console({ format: consoleFormat }));
}

// Stream for Morgan
logger.stream = {
  write: (message) => logger.info(message.trim())
};

// Audit logging functions
const auditLog = {
  create: (model, id, userId, details = {}) => {
    auditLogger.info({
      audit: true,
      action: 'CREATE',
      model,
      resourceId: id,
      userId,
      details
    });
  },
  
  update: (model, id, userId, details = {}) => {
    auditLogger.info({
      audit: true,
      action: 'UPDATE',
      model,
      resourceId: id,
      userId,
      details
    });
  },
  
  delete: (model, id, userId, details = {}) => {
    auditLogger.info({
      audit: true,
      action: 'DELETE',
      model,
      resourceId: id,
      userId,
      details
    });
  },
  
  approve: (model, id, userId, details = {}) => {
    auditLogger.info({
      audit: true,
      action: 'APPROVE',
      model,
      resourceId: id,
      userId,
      details
    });
  },
  
  reject: (model, id, userId, details = {}) => {
    auditLogger.info({
      audit: true,
      action: 'REJECT',
      model,
      resourceId: id,
      userId,
      details
    });
  }
};

// Attach audit helpers and export the logger instance
logger.auditLog = auditLog;
module.exports = logger;
