/**
 * Email Service
 * Handles all email notifications with proper error handling and logging.
 * Includes: generic sendEmail, pledge confirmation, target reached, event approval/rejection,
 * payment reminders, and weekly digest.
 */

const { sendMail } = require('../config/email'); // ✅ use sendMail from config/email.js
const logger = require('../utils/logger');

/**
 * ✅ Generic sendEmail() function
 * - Matches Jest test expectations.
 * - Wraps sendMail() for flexibility and centralized error handling.
 */
async function sendEmail(to, subject, html) {
  if (!to || !subject || !html) {
    throw new Error('Invalid input');
  }

  try {
    await sendMail({ to, subject, html });
    logger.info(`Email sent successfully to ${to} with subject "${subject}"`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Send pledge confirmation email to donor
 */
async function sendPledgeConfirmation(user, event, pledge) {
  try {
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h2>Thank you for your pledge, ${user.name}!</h2>
        <p>We’ve successfully received your pledge of <strong>$${pledge.amount}</strong> for "${event.title}".</p>
        <p>Your contribution helps us reach our goal of <strong>$${event.target_amount}</strong>.</p>
        <p>Reference ID: <strong>#${pledge.id}</strong></p>
        <p>Best regards,<br>The Charity Fundraising Team</p>
      </body></html>
    `;

    await sendEmail(user.email, `Pledge Confirmation - ${event.title}`, html);
    logger.info(`Pledge confirmation email sent successfully to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to send pledge confirmation email to ${user.email}:`, error);
  }
}

/**
 * Send target reached notification to organizer
 */
async function sendTargetReachedNotification(organizer, event) {
  try {
    const progressPercentage = ((event.current_amount / event.target_amount) * 100).toFixed(1);
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h2>🎉 Target Reached!</h2>
        <p>Dear ${organizer.name},</p>
        <p>Your event <strong>"${event.title}"</strong> has reached its target of $${event.target_amount}!</p>
        <p>Total Raised: <strong>$${event.current_amount}</strong> (${progressPercentage}%)</p>
        <p>Thank you for making a difference!</p>
      </body></html>
    `;

    await sendEmail(organizer.email, `🎉 Target Reached! - ${event.title}`, html);
    logger.info(`Target reached notification sent successfully to ${organizer.email}`);
  } catch (error) {
    logger.error(`Failed to send target reached email to ${organizer.email}:`, error);
  }
}

/**
 * Send event approval notification to organizer
 */
async function sendEventApproval(organizer, event, approvalMessage = '') {
  try {
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h2>✅ Event Approved!</h2>
        <p>Dear ${organizer.name},</p>
        <p>Your event <strong>"${event.title}"</strong> has been approved and is now live.</p>
        ${approvalMessage ? `<blockquote>${approvalMessage}</blockquote>` : ''}
        <p>Start sharing your event to receive pledges!</p>
      </body></html>
    `;

    await sendEmail(organizer.email, `Event Approved - ${event.title}`, html);
    logger.info(`Event approval email sent successfully to ${organizer.email}`);
  } catch (error) {
    logger.error(`Failed to send event approval email to ${organizer.email}:`, error);
  }
}

/**
 * Send event rejection notification to organizer
 */
async function sendEventRejection(organizer, event, rejectionReason = '') {
  try {
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h2>⚠️ Event Review Update</h2>
        <p>Dear ${organizer.name},</p>
        <p>Unfortunately, your event <strong>"${event.title}"</strong> could not be approved at this time.</p>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
        <p>Please review the feedback, make changes, and resubmit.</p>
      </body></html>
    `;

    await sendEmail(organizer.email, `Event Review Update - ${event.title}`, html);
    logger.info(`Event rejection email sent successfully to ${organizer.email}`);
  } catch (error) {
    logger.error(`Failed to send event rejection email to ${organizer.email}:`, error);
  }
}

/**
 * Send pledge payment reminder to donor
 */
async function sendPaymentReminder(user, event, pledge) {
  try {
    const daysOverdue = Math.floor((new Date() - new Date(pledge.created_at)) / (1000 * 60 * 60 * 24));
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h2>⏰ Payment Reminder</h2>
        <p>Dear ${user.name},</p>
        <p>Your pledge of $${pledge.amount} for <strong>${event.title}</strong> is still pending (${daysOverdue} days overdue).</p>
        <p>Please complete your payment soon to support the cause!</p>
      </body></html>
    `;

    await sendEmail(user.email, `Payment Reminder - ${event.title}`, html);
    logger.info(`Payment reminder email sent to ${user.email} for pledge ${pledge.id}`);
  } catch (error) {
    logger.error(`Failed to send payment reminder email to ${user.email}:`, error);
  }
}

/**
 * Send weekly digest to users
 */
async function sendWeeklyDigest(user, digestData) {
  try {
    const { newEvents = [], updatedEvents = [], totalRaised = 0, activeEvents = 0 } = digestData;
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h2>📊 Weekly Digest</h2>
        <p>Hello ${user.name},</p>
        <p>New events: ${newEvents.length} | Active: ${activeEvents} | Total Raised: $${totalRaised}</p>
      </body></html>
    `;

    await sendEmail(user.email, '📊 Your Weekly Charity Digest', html);
    logger.info(`Weekly digest email sent successfully to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to send weekly digest email to ${user.email}:`, error);
  }
}

// ✅ Export all functions for app and tests
module.exports = {
  sendEmail, // required by Jest tests
  sendPledgeConfirmation,
  sendTargetReachedNotification,
  sendEventApproval,
  sendEventRejection,
  sendPaymentReminder,
  sendWeeklyDigest,
};
