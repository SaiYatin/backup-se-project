const request = require('supertest');
const app = require('../../app');
const { User, sequelize } = require('../../models');

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('test_user_registration_and_login_flow', async () => {
    const userData = {
      name: 'Integration Test User',
      email: 'integration@test.com',
      password: 'IntegrationTest@123',
      role: 'donor'
    };

    // Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });

  test('test_authenticated_request_with_valid_token', async () => {
    const userData = {
      name: 'Auth Test User',
      email: 'auth@test.com',
      password: 'AuthTest@123',
      role: 'donor'
    };

    // Register user
    await request(app)
      .post('/api/auth/register')
      .send(userData);

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    const token = loginRes.body.data.token;

    // Use token in authenticated request
    const authRes = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.success).toBe(true);
  });
});
