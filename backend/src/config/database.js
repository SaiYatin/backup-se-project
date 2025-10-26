const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sequelize = new Sequelize('postgres', 'postgres', 'postgres', {
  host: 'postgres',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: process.env.DB_POOL_MAX || 10,
    min: process.env.DB_POOL_MIN || 2,
    acquire: 30000,
    idle: 10000,
    evict: 10000
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