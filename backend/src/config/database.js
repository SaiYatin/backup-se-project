const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? path.resolve(process.cwd(), '.env.test') : path.resolve(process.cwd(), '.env'),
});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const isLocal =
  process.env.DATABASE_URL.includes('localhost') || process.env.NODE_ENV === 'development';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging:
    process.env.NODE_ENV === 'development'
      ? (msg) => logger.debug(msg)
      : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || 10),
    min: parseInt(process.env.DB_POOL_MIN || 2),
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: isLocal
    ? {}
    : {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
  retry: { max: 3 },
});

// ✅ Only authenticate outside test mode
if (process.env.NODE_ENV !== 'test') {
  sequelize
    .authenticate()
    .then(() =>
      console.log('✅ Database connection established successfully')
    )
    .catch((err) =>
      console.error('❌ Unable to connect to database:', err.message)
    );
}

module.exports = { sequelize };
