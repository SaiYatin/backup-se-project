/**
 * Unit tests for Email Service
 * Tests all email notification functions with mocking
 */

const emailService = require('../../src/services/emailService');
const { sendEmail } = require('../../src/config/email');
const logger = require('../../src/utils/logger');

// Mock dependencies
jest.mock('../../src/config/email');
jest.mock('../../src/utils/logger');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPledgeConfirmation', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const mockEvent = {
      title: 'Help Build School Library',
      target_amount: 5000,
      current_amount: 2500
    };

    const mockPledge = {
      id: 123,
      amount: 100,
      created_at: new Date('2024-01-15'),
      message: 'Happy to help!'
    };

    it('should send pledge confirmation email successfully', async () => {
      sendEmail.mockResolvedValue(true);

      await emailService.sendPledgeConfirmation(mockUser, mockEvent, mockPledge);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Pledge Confirmation - Help Build School Library',
        html: expect.stringContaining('Thank You for Your Pledge!')
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Pledge confirmation email sent successfully')
      );
    });

    it('should include pledge details in email', async () => {
      sendEmail.mockResolvedValue(true);

      await emailService.sendPledgeConfirmation(mockUser, mockEvent, mockPledge);

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('John Doe');
      expect(emailCall.html).toContain('$100');
      expect(emailCall.html).toContain('Help Build School Library');
      expect(emailCall.html).toContain('#123');
      expect(emailCall.html).toContain('Happy to help!');
    });

    it('should handle email sending failure gracefully', async () => {
      const error = new Error('SMTP connection failed');
      sendEmail.mockRejectedValue(error);

      // Should not throw error
      await expect(emailService.sendPledgeConfirmation(mockUser, mockEvent, mockPledge))
        .resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send pledge confirmation email'),
        error
      );
    });

    it('should handle missing pledge message', async () => {
      sendEmail.mockResolvedValue(true);
      const pledgeWithoutMessage = { ...mockPledge, message: null };

      await emailService.sendPledgeConfirmation(mockUser, mockEvent, pledgeWithoutMessage);

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).not.toContain('Your message:');
    });
  });

  describe('sendTargetReachedNotification', () => {
    const mockOrganizer = {
      name: 'Jane Smith',
      email: 'jane@example.com'
    };

    const mockEvent = {
      id: 456,
      title: 'Community Garden Project',
      target_amount: 10000,
      current_amount: 10500
    };

    it('should send target reached notification successfully', async () => {
      sendEmail.mockResolvedValue(true);

      await emailService.sendTargetReachedNotification(mockOrganizer, mockEvent);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith({
        to: 'jane@example.com',
        subject: '🎉 Target Reached! - Community Garden Project',
        html: expect.stringContaining('Congratulations! Target Reached!')
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Target reached notification sent successfully')
      );
    });

    it('should include progress percentage in email', async () => {
      sendEmail.mockResolvedValue(true);

      await emailService.sendTargetReachedNotification(mockOrganizer, mockEvent);

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Jane Smith');
      expect(emailCall.html).toContain('$10,000');
      expect(emailCall.html).toContain('$10,500');
      expect(emailCall.html).toContain('105.0%');
    });

    it('should handle email sending failure gracefully', async () => {
      const error = new Error('Invalid email address');
      sendEmail.mockRejectedValue(error);

      await expect(emailService.sendTargetReachedNotification(mockOrganizer, mockEvent))
        .resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send target reached notification'),
        error
      );
    });
  });

  describe('sendEventApproval', () => {
    const mockOrganizer = {
      name: 'Bob Wilson',
      email: 'bob@example.com'
    };

    const mockEvent = {
      id: 789,
      title: 'Youth Sports Equipment',
      target_amount: 7500,
      category: 'Sports',
      created_at: new Date('2024-01-10'),
      updated_at: new Date('2024-01-15')
    };

    it('should send approval email without admin message', async () => {
      sendEmail.mockResolvedValue(true);

      await emailService.sendEventApproval(mockOrganizer, mockEvent);

      expect(sendEmail).toHaveBeenCalledWith({
        to: 'bob@example.com',
        subject: 'Event Approved - Youth Sports Equipment',
        html: expect.stringContaining('Event Approved!')
      });

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).not.toContain('Message from Admin:');
    });

    it('should include admin message when provided', async () => {
      sendEmail.mockResolvedValue(true);
      const approvalMessage = 'Great cause! We\'re excited to support this initiative.';

      await emailService.sendEventApproval(mockOrganizer, mockEvent, approvalMessage);

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Message from Admin:');
      expect(emailCall.html).toContain(approvalMessage);
    });

    it('should include event details in approval email', async () => {
      sendEmail.mockResolvedValue(true);

      await emailService.sendEventApproval(mockOrganizer, mockEvent);

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Bob Wilson');
      expect(emailCall.html).toContain('Youth Sports Equipment');
      expect(emailCall.html).toContain('$7,500');
      expect(emailCall.html).toContain('Sports');
    });
  });

  describe('sendEventRejection', () => {
    const mockOrganizer = {
      name: 'Alice Johnson',
      email: 'alice@example.com'
    };

    const mockEvent = {
      id: 101,
      title: 'Questionable Fundraiser'
    };

    it('should send rejection email with reason', async () => {
      sendEmail.mockResolvedValue(true);
      const rejectionReason = 'Event description does not meet our community guidelines.';

      await emailService.sendEventRejection(mockOrganizer, mockEvent, rejectionReason);

      expect(sendEmail).toHaveBeenCalledWith({
        to: 'alice@example.com',
        subject: 'Event Review Update - Questionable Fundraiser',
        html: expect.stringContaining('Event Review Update')
      });

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain(rejectionReason);
    });

    it('should handle rejection without specific reason', async () => {
      sendEmail.mockResolvedValue(true);

      await emailService.sendEventRejection(mockOrganizer, mockEvent);

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('could not be approved');
      expect(emailCall.html).not.toContain('Reason for Review Decision:');
    });
  });

  describe('sendPaymentReminder', () => {
    const mockUser = {
      name: 'Chris Brown',
      email: 'chris@example.com'
    };

    const mockEvent = {
      title: 'Emergency Relief Fund',
      target_amount: 15000,
      current_amount: 8500
    };

    const mockPledge = {
      id: 456,
      amount: 250,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    };

    it('should send payment reminder successfully', async () => {
      sendEmail.mockResolvedValue(true);

      await emailService.sendPaymentReminder(mockUser, mockEvent, mockPledge);

      expect(sendEmail).toHaveBeenCalledWith({
        to: 'chris@example.com',
        subject: 'Payment Reminder - Emergency Relief Fund',
        html: expect.stringContaining('Payment Reminder')
      });

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Chris Brown');
      expect(emailCall.html).toContain('$250');
      expect(emailCall.html).toContain('#456');
      expect(emailCall.html).toContain('Payment Pending');
    });
  });

  describe('sendWeeklyDigest', () => {
    const mockUser = {
      name: 'David Miller',
      email: 'david@example.com'
    };

    const mockDigestData = {
      newEvents: [
        { title: 'New Event 1', target_amount: 5000 },
        { title: 'New Event 2', target_amount: 3000 }
      ],
      updatedEvents: [
        { title: 'Updated Event 1', current_amount: 2500, target_amount: 5000 }
      ],
      totalRaised: 125000,
      activeEvents: 25
    };

    it('should send weekly digest successfully', async () => {
      sendEmail.mockResolvedValue(true);

      await emailService.sendWeeklyDigest(mockUser, mockDigestData);

      expect(sendEmail).toHaveBeenCalledWith({
        to: 'david@example.com',
        subject: '📊 Your Weekly Charity Platform Digest',
        html: expect.stringContaining('Your Weekly Digest')
      });

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('David Miller');
      expect(emailCall.html).toContain('New Event 1');
      expect(emailCall.html).toContain('$125000');
      expect(emailCall.html).toContain('25');
    });

    it('should handle empty digest data', async () => {
      sendEmail.mockResolvedValue(true);
      const emptyDigest = {
        newEvents: [],
        updatedEvents: [],
        totalRaised: 0,
        activeEvents: 0
      };

      await emailService.sendWeeklyDigest(mockUser, emptyDigest);

      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('0');
    });
  });

  describe('Error Handling', () => {
    it('should never throw errors from email functions', async () => {
      sendEmail.mockRejectedValue(new Error('Network failure'));

      const mockUser = { name: 'Test', email: 'test@example.com' };
      const mockEvent = { title: 'Test Event', target_amount: 1000 };
      const mockPledge = { id: 1, amount: 100, created_at: new Date() };

      // All email functions should handle errors gracefully
      await expect(emailService.sendPledgeConfirmation(mockUser, mockEvent, mockPledge))
        .resolves.toBeUndefined();
      
      await expect(emailService.sendTargetReachedNotification(mockUser, mockEvent))
        .resolves.toBeUndefined();
      
      await expect(emailService.sendEventApproval(mockUser, mockEvent))
        .resolves.toBeUndefined();
      
      await expect(emailService.sendEventRejection(mockUser, mockEvent))
        .resolves.toBeUndefined();
      
      await expect(emailService.sendPaymentReminder(mockUser, mockEvent, mockPledge))
        .resolves.toBeUndefined();
      
      await expect(emailService.sendWeeklyDigest(mockUser, {}))
        .resolves.toBeUndefined();

      // Verify all errors were logged
      expect(logger.error).toHaveBeenCalledTimes(6);
    });
  });

  describe('Module Exports', () => {
    it('should export all required functions', () => {
      expect(typeof emailService.sendPledgeConfirmation).toBe('function');
      expect(typeof emailService.sendTargetReachedNotification).toBe('function');
      expect(typeof emailService.sendEventApproval).toBe('function');
      expect(typeof emailService.sendEventRejection).toBe('function');
      expect(typeof emailService.sendPaymentReminder).toBe('function');
      expect(typeof emailService.sendWeeklyDigest).toBe('function');
    });
  });
});