// tests/pledge.test.js
const request = require('supertest');
const app = require('../app');
const { setupTestDatabase, cleanupTestDatabase } = require('./setup');

describe('Pledge Tests', () => {
  let donorToken;
  let donorId;
  let organizerToken;
  let organizerId;
  let adminToken;
  let activeEventId;
  let pendingEventId;
  let testPledgeId;

  // Setup and teardown
  beforeAll(async () => {
    await setupTestDatabase();

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

    // Create admin
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminResponse.body.data.token;

    // Create a pending event
    const pendingEventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Pending Event',
        description: 'This event is pending approval',
        target_amount: 20000,
        end_date: '2025-12-31',
        category: 'education'
      });
    pendingEventId = pendingEventResponse.body.data.id;

    // Create and approve an active event
    const activeEventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Active Event',
        description: 'This event is active and accepting pledges',
        target_amount: 30000,
        end_date: '2025-12-31',
        category: 'health'
      });
    activeEventId = activeEventResponse.body.data.id;

    // Approve the event
    await request(app)
      .put(`/api/admin/events/${activeEventId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/pledges', () => {
    test('Should create pledge for active event', async () => {
      const response = await request(app)
        .post('/api/pledges')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          event_id: activeEventId,
          amount: 500,
          message: 'Happy to support this cause!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe('500.00');
      expect(response.body.data.donor).toBeDefined();
      expect(response.body.data.event).toBeDefined();

      testPledgeId = response.body.data.id; // Save for later tests
    });

    test('Should not create pledge without authentication', async () => {
      const response = await request(app)
        .post('/api/pledges')
        .send({
          event_id: activeEventId,
          amount: 100
        });

      expect(response.status).toBe(401);
    });

    test('Should not create pledge for inactive event', async () => {
      const response = await request(app)
        .post('/api/pledges')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          event_id: pendingEventId,
          amount: 100
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('inactive');
    });

    test('Should not create pledge for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post('/api/pledges')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          event_id: fakeId,
          amount: 100
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Event not found');
    });

    test('Should create pledge with optional message', async () => {
      const response = await request(app)
        .post('/api/pledges')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          event_id: activeEventId,
          amount: 250
        });

      expect(response.status).toBe(201);
      expect(response.body.data.message).toBeDefined();
    });
  });

  describe('GET /api/pledges', () => {
    test('Should get all pledges (authenticated)', async () => {
      const response = await request(app)
        .get('/api/pledges')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Should filter pledges by event_id', async () => {
      const response = await request(app)
        .get(`/api/pledges?event_id=${activeEventId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.event_id === activeEventId)).toBe(true);
    });

    test('Should filter pledges by status', async () => {
      const response = await request(app)
        .get('/api/pledges?status=pending')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.payment_status === 'pending')).toBe(true);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/pledges');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pledges/:id', () => {
    test('Should get single pledge by ID', async () => {
      const response = await request(app)
        .get(`/api/pledges/${testPledgeId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPledgeId);
      expect(response.body.data.donor).toBeDefined();
      expect(response.body.data.event).toBeDefined();
    });

    test('Should return 404 for non-existent pledge', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/pledges/${fakeId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Pledge not found');
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get(`/api/pledges/${testPledgeId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pledges/my', () => {
    test('Should get donor\'s own pledges', async () => {
      const response = await request(app)
        .get('/api/pledges/my')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.totalPledged).toBeDefined();
      expect(response.body.data.every(p => p.donor_id === donorId)).toBe(true);
    });

    test('Should calculate total pledged amount', async () => {
      const response = await request(app)
        .get('/api/pledges/my')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.totalPledged).toBe('number');
      expect(response.body.totalPledged).toBeGreaterThan(0);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/pledges/my');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pledges/my-events', () => {
    test('Should get pledges for organizer\'s events', async () => {
      const response = await request(app)
        .get('/api/pledges/my-events')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Should require organizer role', async () => {
      const response = await request(app)
        .get('/api/pledges/my-events')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/pledges/my-events');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/pledges/:id/status', () => {
    test('Should update pledge status as event organizer', async () => {
      const response = await request(app)
        .put(`/api/pledges/${testPledgeId}/status`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment_status).toBe('completed');
    });

    test('Should not allow non-organizer to update status', async () => {
      const response = await request(app)
        .put(`/api/pledges/${testPledgeId}/status`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(403);
    });

    test('Should validate status values', async () => {
      const response = await request(app)
        .put(`/api/pledges/${testPledgeId}/status`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          status: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status');
    });

    test('Should return 404 for non-existent pledge', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/pledges/${fakeId}/status`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(404);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .put(`/api/pledges/${testPledgeId}/status`)
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(401);
    });
  });
});