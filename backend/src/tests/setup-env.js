// Load main environment variables for tests
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

process.env.NODE_ENV = 'test';
process.env.PORT = 5001;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_123';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';