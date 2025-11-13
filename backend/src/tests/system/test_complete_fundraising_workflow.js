const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('Complete Fundraising Workflow - E2E', () => {
  let organizerToken;
  let donorToken;
  let eventId;

  beforeAll(async () => {
    // Ensure organizer-created events are auto-approved in tests
    const _prevAuto = process.env.AUTO_APPROVE;
    process.env.AUTO_APPROVE = 'true';

    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
    }
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

  test('test_user_creates_event_and_receives_pledges_workflow', async () => {
    // Step 1: Organizer Registration
    const orgRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Organizer Full Name',
        email: 'org@test.com',
        password: 'OrgPass@123',
        role: 'organizer'
      });

    expect(orgRegRes.status).toBe(201);

    // Step 2: Organizer Login
    const orgLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'org@test.com',
        password: 'OrgPass@123'
      });

    organizerToken = orgLoginRes.body.data.token;
    expect(organizerToken).toBeDefined();

    // Step 3: Create Event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'E2E Test Event',
        description: 'Complete workflow test - this description is intentionally long to pass validation',
        target_amount: 100000,
        category: 'Education',
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      });
    expect(eventRes.status).toBe(201);
    eventId = eventRes.body.data.id;

    // Step 4: Donor Registration
    const donorRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Donor Full Name',
        email: 'donor@test.com',
        password: 'DonorPass@123',
        role: 'donor'
      });

    expect(donorRegRes.status).toBe(201);

    // Step 5: Donor Login
    const donorLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'donor@test.com',
        password: 'DonorPass@123'
      });

    donorToken = donorLoginRes.body.data.token;
    expect(donorToken).toBeDefined();

    // Step 6: Create Pledge
    const pledgeRes = await request(app)
      .post('/api/pledges')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        event_id: eventId,
        amount: 25000,
        is_anonymous: false,
        message: 'Great cause!'
      });

    expect(pledgeRes.status).toBe(201);

    // Step 7: Verify Event Updated
    const verifyRes = await request(app)
      .get(`/api/events/${eventId}`);

    expect(verifyRes.status).toBe(200);
    const currentAmount = parseFloat(verifyRes.body.data.current_amount);
    expect(currentAmount).toBeGreaterThan(0);
    expect(currentAmount).toBeLessThanOrEqual(25000);
  });
});
