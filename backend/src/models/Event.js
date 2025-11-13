const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [5, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [20, 5000]
    }
  },
  target_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 100
    }
  },
  current_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  category: {
    type: DataTypes.STRING(50)
  },
  image_url: {
    type: DataTypes.STRING(500)
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'completed', 'rejected'),
    defaultValue: 'pending'
  },
  start_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATE
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'events',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance method to check if target has been reached
Event.prototype.hasReachedTarget = function() {
  const currentAmount = parseFloat(this.current_amount || 0);
  const targetAmount = parseFloat(this.target_amount || 0);
  return currentAmount >= targetAmount;
};

// Instance method to check if event has expired (end date passed)
Event.prototype.hasExpired = function() {
  if (!this.end_date) return false;
  const now = new Date();
  const endDate = new Date(this.end_date);
  return now > endDate;
};

// Instance method to get funding progress percentage
Event.prototype.getFundingProgress = function() {
  const currentAmount = parseFloat(this.current_amount || 0);
  const targetAmount = parseFloat(this.target_amount || 0);
  
  if (targetAmount === 0) return 0;
  return Math.round((currentAmount / targetAmount) * 100);
};

// Instance method to automatically complete event if target reached or expired
Event.prototype.autoCompleteIfTargetReached = async function() {
  if (this.status === 'active' && this.hasReachedTarget()) {
    await this.update({ status: 'completed' });
    console.log(`✅ Event "${this.title}" auto-completed - target reached`);
    return true;
  }
  return false;
};

// Instance method to automatically complete event if time expired
Event.prototype.autoCompleteIfExpired = async function() {
  if (this.status === 'active' && this.hasExpired()) {
    await this.update({ status: 'completed' });
    console.log(`⏰ Event "${this.title}" auto-completed - time expired`);
    return true;
  }
  return false;
};

module.exports = Event;