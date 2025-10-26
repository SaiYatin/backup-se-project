// tests/setup.js
const { sequelize } = require('../config/database');
const { User, Event, Pledge } = require('../models');

// Setup function to reset database before tests
const setupTestDatabase = async () => {
  try {
    // Force sync will drop and recreate tables
    await sequelize.sync({ force: true });
    console.log('✅ Test database reset successfully');
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  }
};

// Cleanup function after tests
const cleanupTestDatabase = async () => {
  try {
    await sequelize.close();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('❌ Error closing test database:', error);
  }
};

// Helper function to create a test user
const createTestUser = async (userData = {}) => {
  const defaultData = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password_hash: 'password123',
    role: 'donor'
  };

  return await User.create({ ...defaultData, ...userData });
};

// Helper function to create a test event
const createTestEvent = async (organizerId, eventData = {}) => {
  const defaultData = {
    title: 'Test Event',
    description: 'This is a test event for testing purposes',
    target_amount: 10000,
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    category: 'education',
    status: 'pending'
  };

  return await Event.create({
    ...defaultData,
    ...eventData,
    organizer_id: organizerId
  });
};

// Helper function to create a test pledge
const createTestPledge = async (eventId, donorId, pledgeData = {}) => {
  const defaultData = {
    amount: 100,
    message: 'Test pledge',
    payment_status: 'pending'
  };

  return await Pledge.create({
    ...defaultData,
    ...pledgeData,
    event_id: eventId,
    donor_id: donorId
  });
};

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
  createTestUser,
  createTestEvent,
  createTestPledge
};