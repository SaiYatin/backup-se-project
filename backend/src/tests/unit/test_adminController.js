const adminController = require('../../controllers/adminController');
const { Event, Pledge, User } = require('../../models');

jest.mock('../../models');

describe('Admin Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'admin1', role: 'admin' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('test_getAllEvents_returns_events', async () => {
    const mockEvents = [
      {
        id: 'evt1',
        title: 'Event 1',
        toJSON: () => ({ id: 'evt1', title: 'Event 1' }),
        pledges: [{ amount: 100 }]
      }
    ];
    Event.findAll = jest.fn().mockResolvedValue(mockEvents);

    await adminController.getAllEvents(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getAllEvents_filters_by_status', async () => {
    req.query.status = 'active';
    Event.findAll = jest.fn().mockResolvedValue([]);

    await adminController.getAllEvents(req, res, next);

    expect(Event.findAll).toHaveBeenCalled();
  });

  test('test_getAllPledges_returns_pledges', async () => {
    Pledge.findAll = jest.fn().mockResolvedValue([{ id: 'p1' }]);

    await adminController.getAllPledges(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getFlaggedEvents_returns_flagged', async () => {
    Event.findAll = jest.fn().mockResolvedValue([]);

    await adminController.getFlaggedEvents(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_approveEvent_approves_event', async () => {
    req.params.id = 'evt1';
    const mockEvent = {
      id: 'evt1',
      status: 'pending',
      organizer: { id: 'org1', name: 'Org' },
      update: jest.fn().mockResolvedValue(true)
    };
    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await adminController.approveEvent(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_approveEvent_handles_not_found', async () => {
    req.params.id = 'evt1';
    Event.findByPk = jest.fn().mockResolvedValue(null);

    await adminController.approveEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_approveEvent_already_active', async () => {
    req.params.id = 'evt1';
    const mockEvent = {
      id: 'evt1',
      status: 'active',
      organizer: { id: 'org1' }
    };
    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await adminController.approveEvent(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_rejectEvent_rejects_event', async () => {
    req.params.id = 'evt1';
    req.body.reason = 'Test reason';
    const mockEvent = {
      id: 'evt1',
      organizer: { id: 'org1', name: 'Org' },
      update: jest.fn().mockResolvedValue(true)
    };
    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await adminController.rejectEvent(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_rejectEvent_handles_not_found', async () => {
    req.params.id = 'evt1';
    Event.findByPk = jest.fn().mockResolvedValue(null);

    await adminController.rejectEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_flagEvent_flags_event', async () => {
    req.params.id = 'evt1';
    req.body.reason = 'Test reason';
    const mockEvent = {
      id: 'evt1',
      organizer: { id: 'org1', name: 'Org' },
      update: jest.fn().mockResolvedValue(true)
    };
    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await adminController.flagEvent(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_flagEvent_handles_not_found', async () => {
    req.params.id = 'evt1';
    Event.findByPk = jest.fn().mockResolvedValue(null);

    await adminController.flagEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_getAllEvents_without_status_filter', async () => {
    req.query = {};
    Event.findAll = jest.fn().mockResolvedValue([
      {
        id: 'evt1',
        toJSON: () => ({ id: 'evt1' }),
        pledges: []
      }
    ]);

    await adminController.getAllEvents(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getAllEvents_handles_error', async () => {
    Event.findAll = jest.fn().mockRejectedValue(new Error('DB error'));

    await adminController.getAllEvents(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('test_getAllPledges_handles_error', async () => {
    Pledge.findAll = jest.fn().mockRejectedValue(new Error('DB error'));

    await adminController.getAllPledges(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

