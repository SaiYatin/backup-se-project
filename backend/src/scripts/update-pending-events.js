/**
 * Script to update all pending events to active status
 * Run this to fix events created before AUTO_APPROVE was enabled
 */

const { Event } = require('../models');
const { sequelize } = require('../config/database');

async function updatePendingEventsToActive() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('\n📊 Checking for pending events...');
    
    // Find all pending events
    const pendingEvents = await Event.findAll({
      where: { status: 'pending' }
    });

    console.log(`Found ${pendingEvents.length} pending events`);

    if (pendingEvents.length === 0) {
      console.log('✅ No pending events to update');
      process.exit(0);
    }

    console.log('\n📝 Pending events:');
    pendingEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (ID: ${event.id})`);
    });

    console.log('\n🔄 Updating all pending events to active...');
    
    // Update all pending events to active
    const [updatedCount] = await Event.update(
      { status: 'active' },
      { where: { status: 'pending' } }
    );

    console.log(`\n✅ Updated ${updatedCount} events to active status`);

    // Verify the update
    const activeCount = await Event.count({ where: { status: 'active' } });
    console.log(`📊 Total active events now: ${activeCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating events:', error);
    process.exit(1);
  }
}

// Run the script
updatePendingEventsToActive();
