const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: process.env.DB_POOL_MAX || 10,      // Increased from 5
    min: process.env.DB_POOL_MIN || 2,       // Increased from 0
    acquire: 30000,
    idle: 10000,
    evict: 10000                             // Add this
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  retry: {
    max: 3
  }
});

module.exports = { sequelize };