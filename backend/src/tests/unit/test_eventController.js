const eventController = require('../../controllers/eventController');
const { Event, User, Pledge } = require('../../models');

jest.mock('../../models');

describe('Event Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 1, role: 'organizer' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('test_createEvent_with_valid_data_succeeds', async () => {
    req.body = {
      title: 'Test Event',
      description: 'This is a longer description that meets minimum length requirements for the event',
      target_amount: 10000,
      category: 'Education',
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const mockEvent = {
      id: 1,
      ...req.body,
      organizer_id: 1,
      status: 'pending',
      toJSON: function() { return this; }
    };

    Event.create = jest.fn().mockResolvedValue(mockEvent);
    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await eventController.createEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.any(Object)
      })
    );
  });

  test('test_getEventById_returns_event_data', async () => {
    req.params.id = 1;

    Event.findByPk = jest.fn().mockResolvedValue({
      id: 1,
      title: 'Test Event',
      target_amount: 10000,
      current_amount: 5000,
      toJSON: function() { return this; }
    });

    await eventController.getEventById(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: 1 })
      })
    );
  });

  test('test_updateEvent_with_valid_data_succeeds', async () => {
    req.params.id = 1;
    req.body = { title: 'Updated Event Title' };

    const mockEvent = {
      id: 1,
      title: 'Old Title',
      organizer_id: 1,
      update: jest.fn().mockResolvedValue({
        id: 1,
        title: 'Updated Event Title'
      }),
      toJSON: function() { return { id: this.id, title: this.title }; }
    };

    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await eventController.updateEvent(req, res, next);

    expect(mockEvent.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });

  test('test_getAllEvents_returns_events_list', async () => {
    Event.findAll = jest.fn().mockResolvedValue([
      { id: 1, title: 'Event 1', status: 'active' },
      { id: 2, title: 'Event 2', status: 'pending' }
    ]);

    await eventController.getAllEvents(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 })
        ])
      })
    );
  });

  test('test_deleteEvent_removes_event', async () => {
    req.params.id = 1;

    const mockEvent = {
      id: 1,
      organizer_id: 1,
      destroy: jest.fn().mockResolvedValue(true)
    };

    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await eventController.deleteEvent(req, res, next);

    expect(mockEvent.destroy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });

  test('test_getMyEvents_returns_organizer_events', async () => {
    req.user.id = 1;
    Event.findAll = jest.fn().mockResolvedValue([
      { 
        id: 1, 
        title: 'My Event 1', 
        organizer_id: 1,
        toJSON: () => ({ id: 1, title: 'My Event 1', organizer_id: 1 })
      },
      { 
        id: 2, 
        title: 'My Event 2', 
        organizer_id: 1,
        toJSON: () => ({ id: 2, title: 'My Event 2', organizer_id: 1 })
      }
    ]);

    await eventController.getMyEvents(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_closeEvent_closes_event', async () => {
    req.params.id = 1;
    const mockEvent = {
      id: 1,
      organizer_id: 1,
      status: 'active',
      update: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ id: 1, status: 'completed' })
    };

    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await eventController.closeEvent(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getEventById_handles_not_found', async () => {
    req.params.id = 1;
    Event.findByPk = jest.fn().mockResolvedValue(null);

    await eventController.getEventById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_updateEvent_handles_not_found', async () => {
    req.params.id = 1;
    req.body = { title: 'Updated' };
    Event.findByPk = jest.fn().mockResolvedValue(null);

    await eventController.updateEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_deleteEvent_handles_not_found', async () => {
    req.params.id = 1;
    Event.findByPk = jest.fn().mockResolvedValue(null);

    await eventController.deleteEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_updateEvent_handles_unauthorized', async () => {
    req.params.id = 1;
    req.body = { title: 'Updated' };
    req.user.id = 2;

    const mockEvent = {
      id: 1,
      organizer_id: 1
    };

    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await eventController.updateEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('test_closeEvent_handles_not_found', async () => {
    req.params.id = 1;
    Event.findByPk = jest.fn().mockResolvedValue(null);

    await eventController.closeEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_closeEvent_handles_unauthorized', async () => {
    req.params.id = 1;
    req.user.id = 2;

    const mockEvent = {
      id: 1,
      organizer_id: 1
    };

    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

    await eventController.closeEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
