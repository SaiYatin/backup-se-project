// ✅ backend/src/services/emailService.js - NEEDS IMPLEMENTATION
const { sendEmail } = require('../config/email');

exports.sendPledgeConfirmation = async (user, event, pledge) => {
  const html = `
    <h1>Thank you for your pledge!</h1>
    <p>Dear ${user.name},</p>
    <p>Your pledge of $${pledge.amount} to "${event.title}" has been confirmed.</p>
    <p>Thank you for making a difference!</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Pledge Confirmation',
    html
  });
};

exports.sendTargetReachedNotification = async (organizer, event) => {
  const html = `
    <h1>Congratulations!</h1>
    <p>Your event "${event.title}" has reached its funding target!</p>
    <p>Target: $${event.target_amount}</p>
    <p>Raised: $${event.current_amount}</p>
  `;

  await sendEmail({
    to: organizer.email,
    subject: 'Fundraising Target Reached!',
    html
  });
};