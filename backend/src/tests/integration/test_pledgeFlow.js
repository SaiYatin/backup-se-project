const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('Pledge Integration Tests', () => {
  let donorToken;
  let eventId;

  beforeAll(async () => {
    // Ensure organizer-created events are auto-approved in tests
    const _prevAuto = process.env.AUTO_APPROVE;
    process.env.AUTO_APPROVE = 'true';

    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
    }

    // Create organizer and event
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Organizer',
        email: 'organizer@test.com',
        password: 'Organizer@123',
        role: 'organizer'
      });

    const orgLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'organizer@test.com',
        password: 'Organizer@123'
      });

    const orgToken = orgLoginRes.body.data.token;

    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({
        title: 'Test Event for Pledges',
        description: 'This is a test event description long enough to pass validation checks',
        target_amount: 50000,
        category: 'Education',
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      });

    eventId = eventRes.body.data.id;

    // Create and login donor
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Donor',
        email: 'donor@test.com',
        password: 'Donor@123',
        role: 'donor'
      });

    const donorLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'donor@test.com',
        password: 'Donor@123'
      });

    donorToken = donorLoginRes.body.data.token;
  });

  afterAll(async () => {
    // Restore AUTO_APPROVE if modified
    if (typeof _prevAuto !== 'undefined') {
      process.env.AUTO_APPROVE = _prevAuto;
    } else {
      delete process.env.AUTO_APPROVE;
    }
    await sequelize.close();
  });

  test('test_create_pledge_updates_event_currentAmount', async () => {
    const pledgeData = {
      event_id: eventId,
      amount: 5000,
      is_anonymous: false
    };

    // Create pledge
    const pledgeRes = await request(app)
      .post('/api/pledges')
      .set('Authorization', `Bearer ${donorToken}`)
      .send(pledgeData);

    expect(pledgeRes.status).toBe(201);

    // Verify event currentAmount updated
    const eventRes = await request(app)
      .get(`/api/events/${eventId}`);

    const currentAmount = parseFloat(eventRes.body.data.current_amount);
    expect(currentAmount).toBeGreaterThanOrEqual(5000);
  });
});
