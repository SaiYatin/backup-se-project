const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ✅ Fixed incorrect function name (createTransporter → createTransport)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility to send email
const sendMail = async (options) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      ...options,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`);
    throw error;
  }
};

module.exports = { transporter, sendMail };
