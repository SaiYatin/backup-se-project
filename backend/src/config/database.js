require('dotenv').config();
const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL || '';

const match = dbUrl.match(
  /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/
);

if (!match) {
  console.error('❌ DATABASE_URL format invalid or missing');
  process.exit(1);
}

const [_, user, password, host, port, database] = match;

const isTest = process.env.NODE_ENV === 'test';
const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

const sequelize = new Sequelize(database, user, password, {
  host,
  port,
  dialect: 'postgres',
  dialectOptions: !isTest && !isLocal
    ? { ssl: { require: true, rejectUnauthorized: false } } // ✅ Cloud/Supabase
    : {}, // ✅ Disable SSL for Jest/local
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log('✅ Database connection established successfully'))
  .catch((err) => console.error('❌ Database connection failed:', err));

module.exports = { sequelize };
