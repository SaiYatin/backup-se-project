const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('Event Integration Tests', () => {
  let organizerToken;
  let eventId;

  beforeAll(async () => {
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
    }

    // Create and login organizer
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Organizer',
        email: 'organizer@test.com',
        password: 'Organizer@123',
        role: 'organizer'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'organizer@test.com',
        password: 'Organizer@123'
      });

    organizerToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('test_create_event_and_fetch_by_id', async () => {
    const eventData = {
      title: 'Integration Test Event',
      description: 'Test event for integration',
      target_amount: 50000,
      category: 'Education',
      end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Create event
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(eventData);

    expect(createRes.status).toBe(201);
    eventId = createRes.body.data.id;

    // Fetch event
    const fetchRes = await request(app)
      .get(`/api/events/${eventId}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.data.title).toBe(eventData.title);
  });

  test('test_update_event_and_verify_changes', async () => {
    const updateData = {
      title: 'Updated Event Title'
    };

    const updateRes = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(updateData);

    expect(updateRes.status).toBe(200);

    const verifyRes = await request(app)
      .get(`/api/events/${eventId}`);

    expect(verifyRes.body.data.title).toBe(updateData.title);
  });
});
