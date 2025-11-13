const pledgeController = require('../../controllers/pledgeController');
const { Pledge, Event, User } = require('../../models');

jest.mock('../../models');

describe('Pledge Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('test_createPledge_with_valid_amount_succeeds', async () => {
    req.body = {
      event_id: 1,
      amount: 5000,
      message: 'Great cause'
    };

    const mockEvent = {
      id: 1,
      status: 'active',
      current_amount: 0,
      update: jest.fn().mockResolvedValue({})
    };

    Event.findByPk = jest.fn().mockResolvedValue(mockEvent);
    Pledge.create = jest.fn().mockResolvedValue({
      id: 1,
      event_id: 1,
      donor_id: 1,
      amount: 5000
    });
    Pledge.findByPk = jest.fn().mockResolvedValue({
      id: 1,
      event_id: 1,
      amount: 5000
    });

    await pledgeController.createPledge(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test('test_getAllPledges_returns_all_pledges_for_event', async () => {
    req.query.event_id = 1;

    Pledge.findAll = jest.fn().mockResolvedValue([
      { id: 1, event_id: 1, amount: 5000 },
      { id: 2, event_id: 1, amount: 3000 }
    ]);

    await pledgeController.getAllPledges(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 2,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 })
        ])
      })
    );
  });

  test('test_getPledgeById_returns_pledge_details', async () => {
    req.params.id = 1;

    Pledge.findByPk = jest.fn().mockResolvedValue({
      id: 1,
      event_id: 1,
      amount: 5000
    });

    await pledgeController.getPledgeById(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: 1 })
      })
    );
  });

  test('test_getMyPledges_returns_user_pledges', async () => {
    req.user.id = 1;
    Pledge.findAll = jest.fn().mockResolvedValue([
      { id: 1, donor_id: 1, amount: 1000 },
      { id: 2, donor_id: 1, amount: 2000 }
    ]);

    await pledgeController.getMyPledges(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getPledgesForMyEvents_returns_pledges', async () => {
    req.user.id = 1;
    Event.findAll = jest.fn().mockResolvedValue([
      { id: 1, organizer_id: 1, pledges: [{ id: 1, amount: 1000 }] }
    ]);

    await pledgeController.getPledgesForMyEvents(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_updatePledgeStatus_updates_status', async () => {
    req.params.id = 1;
    req.body = { status: 'completed' };
    req.user = { id: 1, role: 'organizer' };

    const mockEvent = {
      id: 1,
      organizer_id: 1
    };

    const mockPledge = {
      id: 1,
      event_id: 1,
      event: mockEvent,
      update: jest.fn().mockResolvedValue(true)
    };

    Pledge.findByPk = jest.fn()
      .mockResolvedValueOnce(mockPledge)
      .mockResolvedValueOnce({
        id: 1,
        event_id: 1,
        payment_status: 'completed',
        donor: { id: 1, name: 'Donor' },
        event: { id: 1, title: 'Event' }
      });

    await pledgeController.updatePledgeStatus(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('test_getPledgeById_handles_not_found', async () => {
    req.params.id = 1;
    Pledge.findByPk = jest.fn().mockResolvedValue(null);

    await pledgeController.getPledgeById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_createPledge_handles_event_not_found', async () => {
    req.body = { event_id: 1, amount: 1000 };
    Event.findByPk = jest.fn().mockResolvedValue(null);

    await pledgeController.createPledge(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_updatePledgeStatus_handles_not_found', async () => {
    req.params.id = 1;
    req.body = { status: 'completed' };
    Pledge.findByPk = jest.fn().mockResolvedValue(null);

    await pledgeController.updatePledgeStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('test_updatePledgeStatus_handles_unauthorized', async () => {
    req.params.id = 1;
    req.body = { status: 'completed' };
    req.user = { id: 2 };

    const mockPledge = {
      id: 1,
      event: { organizer_id: 1 }
    };

    Pledge.findByPk = jest.fn().mockResolvedValue(mockPledge);

    await pledgeController.updatePledgeStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('test_updatePledgeStatus_handles_invalid_status', async () => {
    req.params.id = 1;
    req.body = { status: 'invalid' };
    req.user = { id: 1 };

    const mockPledge = {
      id: 1,
      event: { organizer_id: 1 }
    };

    Pledge.findByPk = jest.fn().mockResolvedValue(mockPledge);

    await pledgeController.updatePledgeStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
