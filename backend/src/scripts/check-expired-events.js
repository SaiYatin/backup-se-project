/**
 * Script to check and complete expired events
 * Run this periodically to automatically mark events as completed when their end_date has passed
 */

const { sequelize } = require('../config/database');
const { checkAllActiveEvents } = require('../services/eventStatusService');

async function checkExpiredEvents() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('\n🔍 Checking for expired or completed events...');
    
    // Check all active events
    const result = await checkAllActiveEvents();

    console.log('\n📊 Summary:');
    console.log(`   Total active events checked: ${result.totalChecked}`);
    console.log(`   Events auto-completed: ${result.updated}`);
    
    if (result.updated > 0) {
      console.log('\n✅ Updated events:');
      result.updatedEvents.forEach((event, index) => {
        const reasonEmoji = event.reason === 'target_reached' ? '🎯' : '⏰';
        const reasonText = event.reason === 'target_reached' 
          ? `Target reached (${event.currentAmount}/${event.targetAmount})`
          : `End date passed (${event.endDate})`;
        
        console.log(`   ${index + 1}. ${reasonEmoji} ${event.title}`);
        console.log(`      Reason: ${reasonText}`);
      });
    } else {
      console.log('\n✅ No events need to be auto-completed');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking expired events:', error);
    process.exit(1);
  }
}

// Run the script
checkExpiredEvents();
