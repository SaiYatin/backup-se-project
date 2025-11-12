// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
  console.log('🧪 Using in-memory SQLite for tests');
} else {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  });

  sequelize
    .authenticate()
    .then(() => console.log('✅ Connected to Supabase successfully'))
    .catch((err) => console.error('❌ Database connection failed:', err));
}

module.exports = { sequelize };
