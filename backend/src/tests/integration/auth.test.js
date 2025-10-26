// tests/auth.test.js
const request = require('supertest');
const app = require('../app');
const { setupTestDatabase, cleanupTestDatabase } = require('./setup');

describe('Authentication Tests', () => {
  // Setup and teardown
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/auth/register', () => {
    test('Should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'donor'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.data.user.password_hash).toBeUndefined(); // Should not return password
    });

    test('Should not register with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          role: 'donor'
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password456',
          role: 'donor'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });

    test('Should register organizer role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Organizer User',
          email: 'organizer@example.com',
          password: 'password123',
          role: 'organizer'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('organizer');
    });

    test('Should default to donor role if not specified', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Default User',
          email: 'default@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('donor');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login Test User',
          email: 'logintest@example.com',
          password: 'password123',
          role: 'donor'
        });
    });

    test('Should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('logintest@example.com');
    });

    test('Should fail login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('Should fail login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;

    beforeAll(async () => {
      // Create and login a user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Profile Test User',
          email: 'profiletest@example.com',
          password: 'password123',
          role: 'donor'
        });

      authToken = response.body.data.token;
    });

    test('Should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('profiletest@example.com');
      expect(response.body.data.password_hash).toBeUndefined();
    });

    test('Should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });

    test('Should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Update Test User',
          email: 'updatetest@example.com',
          password: 'password123',
          role: 'donor'
        });

      authToken = response.body.data.token;
    });

    test('Should update user name', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    test('Should update user email', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('newemail@example.com');
    });

    test('Should not update to existing email', async () => {
      // Create another user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'existing@example.com',
          password: 'password123',
          role: 'donor'
        });

      // Try to update to that email
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'existing@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already in use');
    });
  });
});