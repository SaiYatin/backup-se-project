const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  event_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  reporter_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('FRAUD', 'INAPPROPRIATE', 'SCAM', 'OTHER'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 1000]
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'),
    defaultValue: 'PENDING'
  },
  evidence_urls: {
    type: DataTypes.ARRAY(DataTypes.STRING(500)),
    defaultValue: []
  },
  resolution_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  resolver_id: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolved_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'reports',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['event_id', 'status']
    },
    {
      fields: ['reporter_id']
    }
  ]
});

// Associations will be defined in index.js
// Report.belongsTo(Event)
// Report.belongsTo(User, { as: 'reporter' })
// Report.belongsTo(User, { as: 'resolver' })

module.exports = Report;
