/**
 * Email Service
 * Handles all email notifications with proper error handling and logging
 * Includes: pledge confirmation, target reached, approval, rejection notifications
 */

const { sendEmail } = require('../config/email');
const logger = require('../utils/logger');

/**
 * Send pledge confirmation email to donor
 * @param {Object} user - User who made the pledge
 * @param {Object} event - Event details
 * @param {Object} pledge - Pledge details
 */
exports.sendPledgeConfirmation = async (user, event, pledge) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pledge Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .highlight { background-color: #e8f5e8; padding: 10px; border-left: 4px solid #4CAF50; margin: 10px 0; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Pledge! 🎉</h1>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            
            <p>We're delighted to confirm that your pledge has been successfully received!</p>
            
            <div class="highlight">
              <strong>Pledge Details:</strong><br>
              Amount: <strong>$${pledge.amount}</strong><br>
              Event: <strong>${event.title}</strong><br>
              Date: <strong>${new Date(pledge.created_at).toLocaleDateString()}</strong><br>
              Reference ID: <strong>#${pledge.id}</strong>
            </div>
            
            <p>Your generous contribution brings us one step closer to reaching our goal of $${event.target_amount}. 
            Current progress: $${event.current_amount} raised!</p>
            
            ${pledge.message ? `<p><em>Your message: "${pledge.message}"</em></p>` : ''}
            
            <p>You will receive updates on the event's progress, and we'll notify you when payment processing begins.</p>
            
            <p>Thank you for making a difference in our community!</p>
            
            <p>Best regards,<br>
            The Charity Fundraising Team</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at support@charityfundraiser.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: `Pledge Confirmation - ${event.title}`,
      html
    });

    logger.info(`Pledge confirmation email sent successfully to ${user.email} for event ${event.id}`);
  } catch (error) {
    logger.error(`Failed to send pledge confirmation email to ${user.email}:`, error);
    // Don't throw error to prevent breaking the pledge process
  }
};

/**
 * Send target reached notification to organizer
 * @param {Object} organizer - Event organizer
 * @param {Object} event - Event details
 */
exports.sendTargetReachedNotification = async (organizer, event) => {
  try {
    const progressPercentage = ((event.current_amount / event.target_amount) * 100).toFixed(1);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Target Reached!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .celebration { background-color: #fff3cd; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; }
          .stats { display: flex; justify-content: space-around; text-align: center; margin: 20px 0; }
          .stat { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations! Target Reached! 🎉</h1>
          </div>
          <div class="content">
            <p>Dear ${organizer.name},</p>
            
            <div class="celebration">
              <h2>Your fundraising event has reached its target!</h2>
              <p>We're thrilled to inform you that <strong>"${event.title}"</strong> has successfully reached its fundraising goal!</p>
            </div>
            
            <div class="stats">
              <div class="stat">
                <h3>Target Amount</h3>
                <p><strong>$${event.target_amount}</strong></p>
              </div>
              <div class="stat">
                <h3>Amount Raised</h3>
                <p><strong>$${event.current_amount}</strong></p>
              </div>
              <div class="stat">
                <h3>Progress</h3>
                <p><strong>${progressPercentage}%</strong></p>
              </div>
            </div>
            
            <p>This incredible achievement is a testament to your dedication and the generosity of your supporters. 
            Your cause has clearly resonated with the community!</p>
            
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Continue accepting pledges if you wish to exceed your target</li>
              <li>Plan your event execution with the secured funding</li>
              <li>Keep your supporters updated on the event progress</li>
              <li>Share impact stories once your event is complete</li>
            </ul>
            
            <p>Thank you for using our platform to make a positive impact. We're proud to be part of your success!</p>
            
            <p>Best regards,<br>
            The Charity Fundraising Team</p>
          </div>
          <div class="footer">
            <p>Continue managing your event at our platform dashboard</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: organizer.email,
      subject: `🎉 Target Reached! - ${event.title}`,
      html
    });

    logger.info(`Target reached notification sent successfully to organizer ${organizer.email} for event ${event.id}`);
  } catch (error) {
    logger.error(`Failed to send target reached notification to ${organizer.email}:`, error);
    // Don't throw error to prevent breaking the event update process
  }
};

/**
 * Send event approval notification to organizer
 * @param {Object} organizer - Event organizer
 * @param {Object} event - Event details
 * @param {string} approvalMessage - Optional approval message from admin
 */
exports.sendEventApproval = async (organizer, event, approvalMessage = '') => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Event Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .approval { background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .event-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Event Approved!</h1>
          </div>
          <div class="content">
            <p>Dear ${organizer.name},</p>
            
            <div class="approval">
              <h2>Great news! Your event has been approved!</h2>
              <p>Your fundraising event <strong>"${event.title}"</strong> has been reviewed and approved by our moderation team.</p>
            </div>
            
            <div class="event-details">
              <h3>Event Details:</h3>
              <p><strong>Title:</strong> ${event.title}</p>
              <p><strong>Target Amount:</strong> $${event.target_amount}</p>
              <p><strong>Category:</strong> ${event.category || 'General'}</p>
              <p><strong>Status:</strong> Active and accepting pledges</p>
            </div>
            
            ${approvalMessage ? `
              <div class="approval">
                <h3>Message from Admin:</h3>
                <p><em>"${approvalMessage}"</em></p>
              </div>
            ` : ''}
            
            <p><strong>Your event is now live and ready to receive pledges!</strong></p>
            
            <p>Here's what you can do next:</p>
            <ul>
              <li>Share your event link with potential supporters</li>
              <li>Monitor pledge activity through your dashboard</li>
              <li>Engage with your supporters and provide updates</li>
              <li>Thank donors and keep them informed of progress</li>
            </ul>
            
            <p>We wish you great success with your fundraising efforts!</p>
            
            <p>Best regards,<br>
            The Charity Fundraising Team</p>
          </div>
          <div class="footer">
            <p>Access your event dashboard to start managing pledges</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: organizer.email,
      subject: `Event Approved - ${event.title}`,
      html
    });

    logger.info(`Event approval email sent successfully to organizer ${organizer.email} for event ${event.id}`);
  } catch (error) {
    logger.error(`Failed to send event approval email to ${organizer.email}:`, error);
    // Don't throw error to prevent breaking the approval process
  }
};

/**
 * Send event rejection notification to organizer
 * @param {Object} organizer - Event organizer
 * @param {Object} event - Event details
 * @param {string} rejectionReason - Reason for rejection
 */
exports.sendEventRejection = async (organizer, event, rejectionReason = '') => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Event Review Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .rejection { background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0; }
          .guidance { background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 15px 0; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Event Review Update</h1>
          </div>
          <div class="content">
            <p>Dear ${organizer.name},</p>
            
            <div class="rejection">
              <h2>Event Review Decision</h2>
              <p>We regret to inform you that your event <strong>"${event.title}"</strong> could not be approved at this time.</p>
            </div>
            
            ${rejectionReason ? `
              <div class="rejection">
                <h3>Reason for Review Decision:</h3>
                <p>${rejectionReason}</p>
              </div>
            ` : ''}
            
            <div class="guidance">
              <h3>Next Steps:</h3>
              <p>Don't worry! You can address the concerns and resubmit your event. Here's what you can do:</p>
              <ul>
                <li>Review our community guidelines and terms of service</li>
                <li>Make necessary adjustments to your event description or details</li>
                <li>Ensure all required information is complete and accurate</li>
                <li>Resubmit your event for another review</li>
              </ul>
            </div>
            
            <p>We encourage you to make the suggested improvements and try again. Our goal is to help you succeed while maintaining the quality and safety of our platform.</p>
            
            <p>If you have any questions about this decision or need clarification on our guidelines, please don't hesitate to contact our support team.</p>
            
            <p>Thank you for your understanding.</p>
            
            <p>Best regards,<br>
            The Charity Fundraising Team</p>
          </div>
          <div class="footer">
            <p>Contact us at support@charityfundraiser.com if you need assistance</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: organizer.email,
      subject: `Event Review Update - ${event.title}`,
      html
    });

    logger.info(`Event rejection email sent successfully to organizer ${organizer.email} for event ${event.id}`);
  } catch (error) {
    logger.error(`Failed to send event rejection email to ${organizer.email}:`, error);
    // Don't throw error to prevent breaking the rejection process
  }
};

/**
 * Send pledge payment reminder to donor
 * @param {Object} user - User who made the pledge
 * @param {Object} event - Event details
 * @param {Object} pledge - Pledge details
 */
exports.sendPaymentReminder = async (user, event, pledge) => {
  try {
    const daysOverdue = Math.floor((new Date() - new Date(pledge.created_at)) / (1000 * 60 * 60 * 24));
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .reminder { background-color: #fff3cd; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; }
          .pledge-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            
            <div class="reminder">
              <h2>Friendly Reminder: Payment Pending</h2>
              <p>We hope this message finds you well. This is a gentle reminder about your pending pledge payment.</p>
            </div>
            
            <div class="pledge-info">
              <h3>Pledge Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Pledge Amount:</strong> $${pledge.amount}</p>
              <p><strong>Pledge Date:</strong> ${new Date(pledge.created_at).toLocaleDateString()}</p>
              <p><strong>Reference ID:</strong> #${pledge.id}</p>
              <p><strong>Status:</strong> Payment Pending</p>
            </div>
            
            <p>Your support means a lot to the organizer and beneficiaries of this cause. To complete your contribution, please process your payment at your earliest convenience.</p>
            
            <p>The event currently has $${event.current_amount} raised toward its goal of $${event.target_amount}. Your pledge brings us closer to making a real impact!</p>
            
            <p>If you have any questions about payment processing or need assistance, please don't hesitate to reach out to our support team.</p>
            
            <p>Thank you for your continued support!</p>
            
            <p>Best regards,<br>
            The Charity Fundraising Team</p>
          </div>
          <div class="footer">
            <p>Complete your payment through your account dashboard</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: `Payment Reminder - ${event.title}`,
      html
    });

    logger.info(`Payment reminder email sent successfully to ${user.email} for pledge ${pledge.id}`);
  } catch (error) {
    logger.error(`Failed to send payment reminder email to ${user.email}:`, error);
    // Don't throw error to prevent breaking the reminder process
  }
};

/**
 * Send weekly digest to users
 * @param {Object} user - User to send digest to
 * @param {Object} digestData - Weekly digest data
 */
exports.sendWeeklyDigest = async (user, digestData) => {
  try {
    const { newEvents, updatedEvents, totalRaised, activeEvents } = digestData;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Digest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9C27B0; color: white; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .digest-section { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .stats { display: flex; justify-content: space-around; text-align: center; margin: 20px 0; }
          .stat { background: #e1bee7; padding: 10px; border-radius: 5px; color: #4A148C; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Your Weekly Digest</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            
            <p>Here's your weekly summary of activities on our charity fundraising platform:</p>
            
            <div class="stats">
              <div class="stat">
                <h3>${newEvents || 0}</h3>
                <p>New Events</p>
              </div>
              <div class="stat">
                <h3>${activeEvents || 0}</h3>
                <p>Active Events</p>
              </div>
              <div class="stat">
                <h3>$${totalRaised || 0}</h3>
                <p>Total Raised</p>
              </div>
            </div>
            
            ${newEvents && newEvents.length > 0 ? `
              <div class="digest-section">
                <h3>🆕 New Events This Week</h3>
                ${newEvents.slice(0, 3).map(event => `
                  <p><strong>${event.title}</strong> - Target: $${event.target_amount}</p>
                `).join('')}
              </div>
            ` : ''}
            
            ${updatedEvents && updatedEvents.length > 0 ? `
              <div class="digest-section">
                <h3>📈 Recent Updates</h3>
                ${updatedEvents.slice(0, 3).map(event => `
                  <p><strong>${event.title}</strong> - Progress: ${((event.current_amount / event.target_amount) * 100).toFixed(1)}%</p>
                `).join('')}
              </div>
            ` : ''}
            
            <div class="digest-section">
              <h3>🎯 How You Can Help</h3>
              <ul>
                <li>Explore new events and make a pledge</li>
                <li>Share events with your network</li>
                <li>Create your own fundraising event</li>
                <li>Follow up on your existing pledges</li>
              </ul>
            </div>
            
            <p>Thank you for being part of our community and making a positive impact!</p>
            
            <p>Best regards,<br>
            The Charity Fundraising Team</p>
          </div>
          <div class="footer">
            <p>Visit our platform to explore more opportunities to make a difference</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: '📊 Your Weekly Charity Platform Digest',
      html
    });

    logger.info(`Weekly digest email sent successfully to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to send weekly digest email to ${user.email}:`, error);
    // Don't throw error to prevent breaking the digest process
  }
};

module.exports = {
  sendPledgeConfirmation: exports.sendPledgeConfirmation,
  sendTargetReachedNotification: exports.sendTargetReachedNotification,
  sendEventApproval: exports.sendEventApproval,
  sendEventRejection: exports.sendEventRejection,
  sendPaymentReminder: exports.sendPaymentReminder,
  sendWeeklyDigest: exports.sendWeeklyDigest
};