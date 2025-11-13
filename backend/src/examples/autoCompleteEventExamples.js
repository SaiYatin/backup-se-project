/**
 * Example Usage: Automatic Event Status Update Feature
 * 
 * This file demonstrates how the automatic event completion works
 * when pledges reach the target amount.
 */

const { checkAndUpdateEventStatus, checkAllActiveEvents } = require('../services/eventStatusService');
const { Event } = require('../models');

// ============================================
// Example 1: Automatic Status Update via Pledge
// ============================================
async function examplePledgeFlow() {
  console.log('\n=== Example 1: Automatic Status Update ===\n');

  // Scenario: Event needs $1000, currently has $800
  // User makes a pledge of $200, which completes the target
  
  const event = await Event.findByPk('event-uuid-here');
  console.log(`Event: ${event.title}`);
  console.log(`Target: $${event.target_amount}`);
  console.log(`Current: $${event.current_amount}`);
  console.log(`Status: ${event.status}`);
  
  // When pledge is created, this happens automatically in pledgeController:
  // 1. Update event amount
  await event.update({
    current_amount: parseFloat(event.current_amount) + 200
  });
  
  // 2. Check and update status automatically
  const statusCheck = await checkAndUpdateEventStatus(event.id);
  
  console.log(`\nStatus Check Result:`);
  console.log(`- Updated: ${statusCheck.updated}`);
  console.log(`- Message: ${statusCheck.message}`);
  console.log(`- Current: $${statusCheck.currentAmount}`);
  console.log(`- Target: $${statusCheck.targetAmount}`);
  
  if (statusCheck.updated) {
    console.log(`\n✅ Event automatically completed!`);
  }
}

// ============================================
// Example 2: Manual Status Check for Single Event
// ============================================
async function exampleManualCheck() {
  console.log('\n=== Example 2: Manual Status Check ===\n');

  const eventId = 'your-event-uuid';
  
  // Manually trigger status check (useful for admin actions)
  const result = await checkAndUpdateEventStatus(eventId);
  
  if (result.updated) {
    console.log(`✅ Event "${result.event.title}" has been marked as completed`);
    console.log(`   Raised: $${result.currentAmount} / $${result.targetAmount}`);
  } else {
    console.log(`ℹ️  Event not completed: ${result.message}`);
    if (result.currentAmount !== undefined) {
      const remaining = result.targetAmount - result.currentAmount;
      console.log(`   Still need: $${remaining}`);
    }
  }
}

// ============================================
// Example 3: Batch Check All Active Events
// ============================================
async function exampleBatchCheck() {
  console.log('\n=== Example 3: Batch Check All Events ===\n');

  // Check all active events (useful for scheduled tasks)
  const summary = await checkAllActiveEvents();
  
  console.log(`Total Active Events Checked: ${summary.totalChecked}`);
  console.log(`Events Auto-Completed: ${summary.updated}`);
  
  if (summary.updatedEvents.length > 0) {
    console.log('\nCompleted Events:');
    summary.updatedEvents.forEach(event => {
      console.log(`- ${event.title} (${event.currentAmount}/${event.targetAmount})`);
    });
  }
}

// ============================================
// Example 4: Using Event Model Methods
// ============================================
async function exampleModelMethods() {
  console.log('\n=== Example 4: Event Model Methods ===\n');

  const event = await Event.findByPk('event-uuid-here');
  
  // Check if target reached
  const targetReached = event.hasReachedTarget();
  console.log(`Target Reached: ${targetReached}`);
  
  // Get funding progress percentage
  const progress = event.getFundingProgress();
  console.log(`Funding Progress: ${progress}%`);
  
  // Auto-complete if eligible
  const wasCompleted = await event.autoCompleteIfTargetReached();
  if (wasCompleted) {
    console.log('✅ Event was automatically completed!');
  }
  
  // Display progress bar
  const progressBar = '█'.repeat(Math.floor(progress / 10)) + 
                      '░'.repeat(10 - Math.floor(progress / 10));
  console.log(`\nProgress: [${progressBar}] ${progress}%`);
}

// ============================================
// Example 5: Real-World Scenario - Multiple Pledges
// ============================================
async function exampleMultiplePledges() {
  console.log('\n=== Example 5: Multiple Pledges Scenario ===\n');

  const eventId = 'event-uuid-here';
  const pledges = [
    { amount: 100, donor: 'Alice' },
    { amount: 250, donor: 'Bob' },
    { amount: 400, donor: 'Charlie' },
    { amount: 250, donor: 'Diana' }  // This one completes the target
  ];
  
  console.log('Processing pledges for event...\n');
  
  for (const pledge of pledges) {
    // Simulate pledge creation and amount update
    console.log(`${pledge.donor} pledges $${pledge.amount}`);
    
    // After updating the event amount, check status
    const statusCheck = await checkAndUpdateEventStatus(eventId);
    
    if (statusCheck.updated) {
      console.log(`🎉 TARGET REACHED! Event completed by ${pledge.donor}'s pledge!`);
      console.log(`   Final: $${statusCheck.currentAmount} / $${statusCheck.targetAmount}`);
      break;
    } else {
      console.log(`   Progress: $${statusCheck.currentAmount} / $${statusCheck.targetAmount}`);
    }
  }
}

// ============================================
// Example 6: Error Handling
// ============================================
async function exampleErrorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');

  try {
    // Check non-existent event
    const result = await checkAndUpdateEventStatus('non-existent-id');
    console.log(`Result: ${result.message}`);
    
    // Check completed event
    const completedEvent = await Event.findOne({ where: { status: 'completed' } });
    if (completedEvent) {
      const result2 = await checkAndUpdateEventStatus(completedEvent.id);
      console.log(`Completed Event Check: ${result2.message}`);
    }
    
    // Check pending event
    const pendingEvent = await Event.findOne({ where: { status: 'pending' } });
    if (pendingEvent) {
      const result3 = await checkAndUpdateEventStatus(pendingEvent.id);
      console.log(`Pending Event Check: ${result3.message}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// Example 7: Integration with API Response
// ============================================
function exampleAPIResponse() {
  console.log('\n=== Example 7: API Response Format ===\n');

  // Example successful response when target is reached
  const successResponse = {
    success: true,
    message: "Pledge created successfully - Congratulations! The event \"Clean Ocean Initiative\" has reached its target and is now completed! 🎉",
    data: {
      id: "pledge-uuid",
      amount: "500.00",
      payment_status: "pending",
      event: {
        id: "event-uuid",
        title: "Clean Ocean Initiative",
        target_amount: "5000.00",
        current_amount: "5000.00",
        status: "completed"  // Automatically updated!
      }
    },
    eventStatusUpdated: true  // Flag indicating status was changed
  };
  
  console.log(JSON.stringify(successResponse, null, 2));
  
  // Example response when target not reached
  console.log('\n--- When target not reached ---\n');
  
  const normalResponse = {
    success: true,
    message: "Pledge created successfully",
    data: {
      id: "pledge-uuid-2",
      amount: "200.00",
      payment_status: "pending",
      event: {
        id: "event-uuid",
        title: "Clean Ocean Initiative",
        target_amount: "5000.00",
        current_amount: "3200.00",
        status: "active"  // Still active
      }
    },
    eventStatusUpdated: false  // No status change
  };
  
  console.log(JSON.stringify(normalResponse, null, 2));
}

// ============================================
// Run Examples (for testing purposes)
// ============================================
if (require.main === module) {
  // Uncomment to run examples:
  // exampleAPIResponse();
  // exampleManualCheck().catch(console.error);
  // exampleBatchCheck().catch(console.error);
  // exampleModelMethods().catch(console.error);
}

module.exports = {
  examplePledgeFlow,
  exampleManualCheck,
  exampleBatchCheck,
  exampleModelMethods,
  exampleMultiplePledges,
  exampleErrorHandling,
  exampleAPIResponse
};
