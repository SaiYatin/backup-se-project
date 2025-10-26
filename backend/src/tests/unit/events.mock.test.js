// Unit test for createEvent using mocked models (no DB required)
const request = require('supertest');

// Mock the models module before requiring the controller
jest.mock('../../models', () => {
  // Simple in-memory mocks for Event and User
  const Event = {
    create: jest.fn(async (data) => ({ id: 'mock-event-id', ...data })),
    findByPk: jest.fn(async (id, opts) => ({
      id,
      title: 'Mocked Event',
      description: 'Mocked',
      target_amount: '5000.00',
      current_amount: '0.00',
      status: 'pending',
      organizer_id: 'org-1',
      organizer: { id: 'org-1', name: 'Org', email: 'org@test' }
    }))
  };

  const User = {
    create: jest.fn()
  };

  const Pledge = {};

  return { Event, User, Pledge };
});

// Now require the controller (it will get the mocked models)
const eventController = require('../../controllers/eventController');

// Minimal express-like mocks for req/res
const makeReq = (body = {}, user = { id: 'org-1', role: 'organizer' }) => ({ body, user });
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eventController.createEvent (unit, mocked models)', () => {
  test('creates event and returns 201 with event data', async () => {
    const req = makeReq({
      title: 'Test Event',
      description: 'Description',
      target_amount: 5000,
      end_date: '2025-12-31',
      category: 'education'
    }, { id: 'org-1', role: 'organizer' });

    const res = makeRes();
    const next = jest.fn();

    await eventController.createEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.success).toBe(true);
    expect(jsonArg.data).toBeDefined();
    expect(jsonArg.data.title).toBe('Mocked Event');
  });
});
