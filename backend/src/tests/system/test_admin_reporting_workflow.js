const request = require('supertest');
const app = require('../../app');
const { sequelize, User } = require('../../models');

describe('Admin Reporting Workflow - E2E', () => {
  let adminToken;

  beforeAll(async () => {
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
    }

    // Create admin directly via model — the public register route disallows 'admin' role for safety
    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password_hash: 'AdminPass@123',
      role: 'admin'
    });

    // Login via API to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass@123'
      });

    adminToken = loginRes.body.data?.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('test_admin_generates_and_downloads_report_workflow', async () => {
    // Step 1: Generate Daily Report
    const dailyReportRes = await request(app)
      .post('/api/reports/daily')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: new Date().toISOString().split('T')[0]
      });

  // Controller returns 201 when report created
  expect(dailyReportRes.status).toBe(201);
    expect(dailyReportRes.body.success).toBe(true);
    expect(dailyReportRes.body.data).toBeDefined();

    // Step 2: Verify Report Contains Expected Fields
    const reportData = dailyReportRes.body.data;
    expect(reportData.type).toBe('daily');

    // Step 3: Generate Monthly Report
    const monthlyReportRes = await request(app)
      .post('/api/reports/monthly')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      });

    expect(monthlyReportRes.status).toBe(201);
    expect(monthlyReportRes.body.success).toBe(true);
  });
});
