const { sequelize } = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const Pledge = require('./Pledge');
const Report = require('./Report');

// ✅ Define Relationships

// User -> Events (One user can organize many events)
User.hasMany(Event, {
  foreignKey: 'organizer_id',
  as: 'organizedEvents'
});

Event.belongsTo(User, {
  foreignKey: 'organizer_id',
  as: 'organizer'
});

// User -> Pledges (One user can make many pledges)
User.hasMany(Pledge, {
  foreignKey: 'donor_id',
  as: 'pledges'
});

Pledge.belongsTo(User, {
  foreignKey: 'donor_id',
  as: 'donor'
});

// Event -> Pledges (One event can have many pledges)
Event.hasMany(Pledge, {
  foreignKey: 'event_id',
  as: 'pledges'
});

Pledge.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event'
});

// Event -> Reports (One event can have many reports)
Event.hasMany(Report, {
  foreignKey: 'event_id',
  as: 'reports'
});

Report.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event'
});

// User -> Reports (reporter and resolver relationships)
User.hasMany(Report, {
  foreignKey: 'reporter_id',
  as: 'reportsReported'
});

Report.belongsTo(User, {
  foreignKey: 'reporter_id',
  as: 'reporter'
});

User.hasMany(Report, {
  foreignKey: 'resolver_id',
  as: 'reportsResolved'
});

Report.belongsTo(User, {
  foreignKey: 'resolver_id',
  as: 'resolver'
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Event,
  Pledge,
  Report
};