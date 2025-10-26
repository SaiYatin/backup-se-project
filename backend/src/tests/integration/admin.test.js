// tests/admin.test.js
const request = require('supertest');
const app = require('../app');
const { setupTestDatabase, cleanupTestDatabase } = require('./setup');

describe('Admin Tests', () => {
  let adminToken;
  let adminId;
  let organizerToken;
  let organizerId;
  let donorToken;
  let testEventId;

  // Setup and teardown
  beforeAll(async () => {
    await setupTestDatabase();

    // Create admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminResponse.body.data.token;
    adminId = adminResponse.body.data.user.id;

    // Create organizer
    const orgResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Organizer',
        email: 'organizer@test.com',
        password: 'password123',
        role: 'organizer'
      });
    organizerToken = orgResponse.body.data.token;
    organizerId = orgResponse.body.data.user.id;

    // Create donor
    const donorResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Donor',
        email: 'donor@test.com',
        password: 'password123',
        role: 'donor'
      });
    donorToken = donorResponse.body.data.token;

    // Create a test event
    const eventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Event for Admin Testing',
        description: 'This event will be used for admin approval testing',
        target_amount: 25000,
        end_date: '2025-12-31',
        category: 'education'
      });
    testEventId = eventResponse.body.data.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/admin/events', () => {
    test('Should get all events as admin', async () => {
      const response = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    test('Should filter events by status', async () => {
      const response = await request(app)
        .get('/api/admin/events?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(e => e.status === 'pending')).toBe(true);
    });

    test('Should not allow non-admin to access', async () => {
      const response = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(403);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/events');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/pledges', () => {
    test('Should get all pledges as admin', async () => {
      const response = await request(app)
        .get('/api/admin/pledges')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Should not allow non-admin to access', async () => {
      const response = await request(app)
        .get('/api/admin/pledges')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/admin/events/:id/approve', () => {
    test('Should approve event as admin', async () => {
      const response = await request(app)
        .put(`/api/admin/events/${testEventId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('approved');
    });

    test('Should reject event as admin', async () => {
      const eventResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Event for Rejection',
          description: 'This will be rejected',
          target_amount: 15000,
          end_date: '2025-12-31',
          category: 'health'
        });

      const newEventId = eventResponse.body.data.id;

      const response = await request(app)
        .put(`/api/admin/events/${newEventId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Insufficient documentation' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
    });

    test('Should flag event as admin', async () => {
      const response = await request(app)
        .put(`/api/admin/events/${testEventId}/flagged`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Suspicious activity' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('flagged');
    });

    test('Should not allow non-admin to approve', async () => {
      const response = await request(app)
        .put(`/api/admin/events/${testEventId}/approve`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(403);
    });
  });
});
