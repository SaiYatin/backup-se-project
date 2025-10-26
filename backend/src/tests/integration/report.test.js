const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const app = require('../../app');
const { Event, User, Report } = require('../../models');
const { setupTestDatabase, cleanupTestDatabase } = require('./setup');

describe('Report System Tests', () => {
  let adminToken;
  let donorToken;
  let eventId;
  let reportId;
  let logPath;

  // Setup and teardown
  beforeAll(async () => {
    await setupTestDatabase();

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

    // Create and approve an event
    const eventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Test Event for Reports',
        description: 'Event for testing reports',
        target_amount: 50000,
        end_date: '2025-12-31',
        category: 'education'
      });
    activeEventId = eventResponse.body.data.id;

    // Approve the event
    await request(app)
      .put(`/api/admin/events/${activeEventId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Create some pledges
    await request(app)
      .post('/api/pledges')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        event_id: activeEventId,
        amount: 1000,
        message: 'First pledge'
      });

    await request(app)
      .post('/api/pledges')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        event_id: activeEventId,
        amount: 500,
        message: 'Second pledge'
      });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/reports/admin/dashboard', () => {
    test('Should get admin dashboard as admin', async () => {
      const response = await request(app)
        .get('/api/reports/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.totalUsers).toBeGreaterThan(0);
      expect(response.body.data.overview.totalEvents).toBeGreaterThan(0);
      expect(response.body.data.overview.totalPledges).toBeGreaterThan(0);
    });

    test('Should include user breakdown by role', async () => {
      const response = await request(app)
        .get('/api/reports/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.usersByRole).toBeDefined();
      expect(response.body.data.usersByRole).toBeInstanceOf(Array);
    });

    test('Should include events by status', async () => {
      const response = await request(app)
        .get('/api/reports/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.eventsByStatus).toBeDefined();
      expect(response.body.data.eventsByStatus).toBeInstanceOf(Array);
    });

    test('Should include top events', async () => {
      const response = await request(app)
        .get('/api/reports/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.topEvents).toBeDefined();
      expect(response.body.data.topEvents).toBeInstanceOf(Array);
    });

    test('Should include recent activity', async () => {
      const response = await request(app)
        .get('/api/reports/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.recentActivity).toBeDefined();
      expect(response.body.data.recentActivity).toBeInstanceOf(Array);
    });

    test('Should not allow non-admin to access', async () => {
      const response = await request(app)
        .get('/api/reports/admin/dashboard')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(403);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports/admin/dashboard');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reports/organizer/summary', () => {
    test('Should get organizer summary as organizer', async () => {
      const response = await request(app)
        .get('/api/reports/organizer/summary')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.totalEvents).toBeGreaterThan(0);
    });

    test('Should include event statistics', async () => {
      const response = await request(app)
        .get('/api/reports/organizer/summary')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.overview.totalRaised).toBeDefined();
      expect(response.body.data.overview.totalTarget).toBeDefined();
      expect(response.body.data.overview.totalPledges).toBeDefined();
    });

    test('Should include top performing events', async () => {
      const response = await request(app)
        .get('/api/reports/organizer/summary')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.topEvents).toBeDefined();
      expect(response.body.data.topEvents).toBeInstanceOf(Array);
    });

    test('Should include all events list', async () => {
      const response = await request(app)
        .get('/api/reports/organizer/summary')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.allEvents).toBeDefined();
      expect(response.body.data.allEvents).toBeInstanceOf(Array);
    });

    test('Should not allow non-organizer to access', async () => {
      const response = await request(app)
        .get('/api/reports/organizer/summary')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports/organizer/summary');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reports/event/:id/analytics', () => {
    test('Should get event analytics as organizer', async () => {
      const response = await request(app)
        .get(`/api/reports/event/${activeEventId}/analytics`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.event).toBeDefined();
      expect(response.body.data.analytics).toBeDefined();
    });

    test('Should include pledge statistics', async () => {
      const response = await request(app)
        .get(`/api/reports/event/${activeEventId}/analytics`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.analytics.totalPledges).toBeGreaterThan(0);
      expect(response.body.data.analytics.totalAmount).toBeGreaterThan(0);
      expect(response.body.data.analytics.progressPercentage).toBeDefined();
    });

    test('Should include pledge ranges', async () => {
      const response = await request(app)
        .get(`/api/reports/event/${activeEventId}/analytics`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.analytics.pledgeRanges).toBeDefined();
      expect(response.body.data.analytics.pledgeRanges).toHaveProperty('under100');
      expect(response.body.data.analytics.pledgeRanges).toHaveProperty('100-500');
    });

    test('Should include top donors', async () => {
      const response = await request(app)
        .get(`/api/reports/event/${activeEventId}/analytics`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.analytics.topDonors).toBeDefined();
      expect(response.body.data.analytics.topDonors).toBeInstanceOf(Array);
    });

    test('Should allow admin to view any event', async () => {
      const response = await request(app)
        .get(`/api/reports/event/${activeEventId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Should not allow other organizers to view', async () => {
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

      const response = await request(app)
        .get(`/api/reports/event/${activeEventId}/analytics`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });

    test('Should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/reports/event/${fakeId}/analytics`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(404);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get(`/api/reports/event/${activeEventId}/analytics`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reports/donor/activity', () => {
    test('Should get donor activity report', async () => {
      const response = await request(app)
        .get('/api/reports/donor/activity')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
    });

    test('Should include donation statistics', async () => {
      const response = await request(app)
        .get('/api/reports/donor/activity')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.overview.totalPledges).toBeGreaterThan(0);
      expect(response.body.data.overview.totalDonated).toBeGreaterThan(0);
      expect(response.body.data.overview.averageDonation).toBeDefined();
      expect(response.body.data.overview.averageDonation).toBeGreaterThan(0);
    });

    test('Should include donation history', async () => {
      const response = await request(app)
        .get('/api/reports/donor/activity')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.history).toBeDefined();
      expect(response.body.data.history).toBeInstanceOf(Array);
      expect(response.body.data.history.length).toBeGreaterThan(0);
    });

    test('Should not allow non-donors to access', async () => {
      const response = await request(app)
        .get('/api/reports/donor/activity')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(403);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports/donor/activity');

      expect(response.status).toBe(401);
    });
  });
});
