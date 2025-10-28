const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse DATABASE_URL for local setup
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    // Remove SSL for local development
    // ssl: false
  },
  retry: {
    max: 3
  }
});

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully');
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err.message);
  });

module.exports = { sequelize };