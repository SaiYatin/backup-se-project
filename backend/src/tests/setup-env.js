// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = 5001;
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/fundraising_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_123';
process.env.JWT_EXPIRE = '1h';