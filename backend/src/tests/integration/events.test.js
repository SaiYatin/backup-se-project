// tests/events.test.js
const request = require('supertest');
const app = require('../app');
const { setupTestDatabase, cleanupTestDatabase, createTestUser, createTestEvent } = require('./setup');

describe('Event Tests', () => {
  let organizerToken;
  let organizerId;
  let donorToken;
  let donorId;
  let adminToken;
  let adminId;
  let testEventId;

  // Setup and teardown
  beforeAll(async () => {
    await setupTestDatabase();

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
    donorId = donorResponse.body.data.user.id;

    // Create admin
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminResponse.body.data.token;
    adminId = adminResponse.body.data.user.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/events', () => {
    test('Should create event as organizer', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Test Charity Event',
          description: 'This is a test event for charity fundraising',
          target_amount: 50000,
          end_date: '2025-12-31',
          category: 'education'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Charity Event');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.organizer).toBeDefined();

      testEventId = response.body.data.id; // Save for later tests
    });

    test('Should not create event without authentication', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({
          title: 'Unauthorized Event',
          description: 'This should fail',
          target_amount: 10000,
          end_date: '2025-12-31',
          category: 'health'
        });

      expect(response.status).toBe(401);
    });

    test('Should not create event as donor', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          title: 'Donor Event',
          description: 'Donor should not be able to create',
          target_amount: 10000,
          end_date: '2025-12-31',
          category: 'health'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/events', () => {
    test('Should get all events (public)', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    test('Should filter events by status', async () => {
      const response = await request(app)
        .get('/api/events?status=pending');

      expect(response.status).toBe(200);
      expect(response.body.data.every(e => e.status === 'pending')).toBe(true);
    });

    test('Should filter events by category', async () => {
      const response = await request(app)
        .get('/api/events?category=education');

      expect(response.status).toBe(200);
      expect(response.body.data.every(e => e.category === 'education')).toBe(true);
    });
  });

  describe('GET /api/events/:id', () => {
    test('Should get single event by ID', async () => {
      const response = await request(app)
        .get(`/api/events/${testEventId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testEventId);
      expect(response.body.data.organizer).toBeDefined();
    });

    test('Should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/events/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Event not found');
    });
  });

  describe('GET /api/events/my/events', () => {
    test('Should get organizer\'s own events', async () => {
      const response = await request(app)
        .get('/api/events/my/events')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every(e => e.organizer_id === organizerId)).toBe(true);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/events/my/events');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/events/:id', () => {
    test('Should update own event as organizer', async () => {
      const response = await request(app)
        .put(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Updated Event Title',
          target_amount: 60000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Event Title');
      expect(response.body.data.target_amount).toBe('60000.00');
    });

    test('Should not update someone else\'s event', async () => {
      // Create another organizer
      const otherOrgResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other Organizer',
          email: 'other@test.com',
          password: 'password123',
          role: 'organizer'
        });
      const otherToken = otherOrgResponse.body.data.token;

      // Try to update first organizer's event
      const response = await request(app)
        .put(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Hacked Title'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('only update your own');
    });

    test('Should not update without authentication', async () => {
      const response = await request(app)
        .put(`/api/events/${testEventId}`)
        .send({
          title: 'Unauthorized Update'
        });

      expect(response.status).toBe(401);
    });

    test('Should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/events/${fakeId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Update Non-existent'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/events/:id', () => {
    let eventToDelete;

    beforeAll(async () => {
      // Create an event to delete
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Event to Delete',
          description: 'This event will be deleted in tests',
          target_amount: 10000,
          end_date: '2025-12-31',
          category: 'health'
        });
      eventToDelete = response.body.data.id;
    });

    test('Should delete own event as organizer', async () => {
      const response = await request(app)
        .delete(`/api/events/${eventToDelete}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify it's actually deleted
      const getResponse = await request(app)
        .get(`/api/events/${eventToDelete}`);
      expect(getResponse.status).toBe(404);
    });

    test('Should not delete someone else\'s event', async () => {
      // Create another organizer and event
      const otherOrgResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Organizer',
          email: 'another@test.com',
          password: 'password123',
          role: 'organizer'
        });
      const otherToken = otherOrgResponse.body.data.token;

      const eventResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Protected Event',
          description: 'Cannot be deleted by others',
          target_amount: 10000,
          end_date: '2025-12-31',
          category: 'health'
        });
      const protectedEventId = eventResponse.body.data.id;

      // Try to delete with first organizer's token
      const response = await request(app)
        .delete(`/api/events/${protectedEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('only delete your own');
    });

    test('Should not delete without authentication', async () => {
      const response = await request(app)
        .delete(`/api/events/${testEventId}`);

      expect(response.status).toBe(401);
    });
  });
});