const { checkAndUpdateEventStatus, checkAllActiveEvents } = require('../../services/eventStatusService');
const { Event } = require('../../models');

// Mock the models
jest.mock('../../models', () => ({
  Event: {
    findByPk: jest.fn(),
    findAll: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  auditLog: {
    update: jest.fn()
  }
}));

describe('Event Status Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAndUpdateEventStatus', () => {
    it('should update event status to completed when target is reached', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        status: 'active',
        current_amount: '1000.00',
        target_amount: '1000.00',
        update: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      const result = await checkAndUpdateEventStatus('event-1');

      expect(result.updated).toBe(true);
      expect(mockEvent.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(result.message).toContain('Event automatically completed');
    });

    it('should update event status when current amount exceeds target', async () => {
      const mockEvent = {
        id: 'event-2',
        title: 'Test Event 2',
        status: 'active',
        current_amount: '1500.00',
        target_amount: '1000.00',
        update: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      const result = await checkAndUpdateEventStatus('event-2');

      expect(result.updated).toBe(true);
      expect(mockEvent.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(result.currentAmount).toBe(1500);
      expect(result.targetAmount).toBe(1000);
    });

    it('should not update status when target is not reached', async () => {
      const mockEvent = {
        id: 'event-3',
        title: 'Test Event 3',
        status: 'active',
        current_amount: '500.00',
        target_amount: '1000.00',
        update: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      const result = await checkAndUpdateEventStatus('event-3');

      expect(result.updated).toBe(false);
      expect(mockEvent.update).not.toHaveBeenCalled();
      expect(result.message).toBe('Target not yet reached');
    });

    it('should not update status for non-active events', async () => {
      const mockEvent = {
        id: 'event-4',
        title: 'Test Event 4',
        status: 'pending',
        current_amount: '1000.00',
        target_amount: '1000.00',
        update: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      const result = await checkAndUpdateEventStatus('event-4');

      expect(result.updated).toBe(false);
      expect(mockEvent.update).not.toHaveBeenCalled();
      expect(result.message).toBe('Event is not active');
    });

    it('should return error when event is not found', async () => {
      Event.findByPk.mockResolvedValue(null);

      const result = await checkAndUpdateEventStatus('non-existent-id');

      expect(result.updated).toBe(false);
      expect(result.event).toBe(null);
      expect(result.message).toBe('Event not found');
    });

    it('should handle zero current amount correctly', async () => {
      const mockEvent = {
        id: 'event-5',
        title: 'Test Event 5',
        status: 'active',
        current_amount: '0.00',
        target_amount: '1000.00',
        update: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      const result = await checkAndUpdateEventStatus('event-5');

      expect(result.updated).toBe(false);
      expect(result.currentAmount).toBe(0);
      expect(result.targetAmount).toBe(1000);
    });

    it('should handle null current amount as zero', async () => {
      const mockEvent = {
        id: 'event-6',
        title: 'Test Event 6',
        status: 'active',
        current_amount: null,
        target_amount: '1000.00',
        update: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      const result = await checkAndUpdateEventStatus('event-6');

      expect(result.updated).toBe(false);
      expect(result.currentAmount).toBe(0);
    });
  });

  describe('checkAllActiveEvents', () => {
    it('should check all active events and update those that reached target', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          status: 'active',
          current_amount: '1000.00',
          target_amount: '1000.00',
          update: jest.fn().mockResolvedValue(true)
        },
        {
          id: 'event-2',
          title: 'Event 2',
          status: 'active',
          current_amount: '500.00',
          target_amount: '1000.00',
          update: jest.fn()
        },
        {
          id: 'event-3',
          title: 'Event 3',
          status: 'active',
          current_amount: '2000.00',
          target_amount: '1500.00',
          update: jest.fn().mockResolvedValue(true)
        }
      ];

      Event.findAll.mockResolvedValue(mockEvents);
      Event.findByPk
        .mockResolvedValueOnce(mockEvents[0])
        .mockResolvedValueOnce(mockEvents[1])
        .mockResolvedValueOnce(mockEvents[2]);

      const result = await checkAllActiveEvents();

      expect(result.totalChecked).toBe(3);
      expect(result.updated).toBe(2);
      expect(result.updatedEvents).toHaveLength(2);
      expect(mockEvents[0].update).toHaveBeenCalledWith({ status: 'completed' });
      expect(mockEvents[1].update).not.toHaveBeenCalled();
      expect(mockEvents[2].update).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('should handle empty active events list', async () => {
      Event.findAll.mockResolvedValue([]);

      const result = await checkAllActiveEvents();

      expect(result.totalChecked).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.updatedEvents).toHaveLength(0);
    });
  });

  describe('Event Model Instance Methods', () => {
    it('hasReachedTarget should return true when target is reached', () => {
      const event = {
        current_amount: '1000.00',
        target_amount: '1000.00'
      };

      const Event = require('../../models/Event');
      const result = Event.prototype.hasReachedTarget.call(event);

      expect(result).toBe(true);
    });

    it('hasReachedTarget should return false when target is not reached', () => {
      const event = {
        current_amount: '500.00',
        target_amount: '1000.00'
      };

      const Event = require('../../models/Event');
      const result = Event.prototype.hasReachedTarget.call(event);

      expect(result).toBe(false);
    });

    it('getFundingProgress should calculate correct percentage', () => {
      const event = {
        current_amount: '750.00',
        target_amount: '1000.00'
      };

      const Event = require('../../models/Event');
      const result = Event.prototype.getFundingProgress.call(event);

      expect(result).toBe(75);
    });

    it('getFundingProgress should return 0 for zero target', () => {
      const event = {
        current_amount: '100.00',
        target_amount: '0.00'
      };

      const Event = require('../../models/Event');
      const result = Event.prototype.getFundingProgress.call(event);

      expect(result).toBe(0);
    });
  });
});
