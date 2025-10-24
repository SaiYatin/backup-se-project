const User = require('./User');
const Event = require('./Event');
const Pledge = require('./Pledge');

// User -> Events (one-to-many)
User.hasMany(Event, { foreignKey: 'organizer_id', as: 'events' });
Event.belongsTo(User, { foreignKey: 'organizer_id', as: 'organizer' });

// User -> Pledges (one-to-many)
User.hasMany(Pledge, { foreignKey: 'donor_id', as: 'pledges' });
Pledge.belongsTo(User, { foreignKey: 'donor_id', as: 'donor' });

// Event -> Pledges (one-to-many)
Event.hasMany(Pledge, { foreignKey: 'event_id', as: 'pledges' });
Pledge.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

module.exports = {
  User,
  Event,
  Pledge
};