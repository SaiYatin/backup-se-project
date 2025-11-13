const { Event } = require('../models');
const { auditLog } = require('../utils/logger');

/**
 * Check if event has reached its target and automatically update status to 'completed'
 * @param {string} eventId - The UUID of the event to check
 * @returns {Object} - { updated: boolean, event: Event, message: string }
 */
async function checkAndUpdateEventStatus(eventId) {
  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return {
        updated: false,
        event: null,
        message: 'Event not found'
      };
    }

    // Only check active events
    if (event.status !== 'active') {
      return {
        updated: false,
        event,
        message: 'Event is not active'
      };
    }

    // Parse DECIMAL fields to numbers for comparison
    const currentAmount = parseFloat(event.current_amount || 0);
    const targetAmount = parseFloat(event.target_amount || 0);

    // Check if target has been reached or exceeded
    if (currentAmount >= targetAmount) {
      // Update status to completed
      await event.update({ status: 'completed' });

      // Log the automatic status change
      auditLog.update?.('Event', event.id, 'system', {
        action: 'auto_completed',
        title: event.title,
        oldStatus: 'active',
        newStatus: 'completed',
        currentAmount,
        targetAmount,
        reason: 'Target amount reached'
      });

      console.log(`✅ Event auto-completed: ${event.title} (ID: ${event.id}) - Target reached: ${currentAmount}/${targetAmount}`);

      return {
        updated: true,
        event,
        message: `Event automatically completed - target of ${targetAmount} reached with ${currentAmount}`,
        currentAmount,
        targetAmount
      };
    }

    return {
      updated: false,
      event,
      message: 'Target not yet reached',
      currentAmount,
      targetAmount
    };
  } catch (error) {
    console.error('❌ Error in checkAndUpdateEventStatus:', error);
    throw error;
  }
}

/**
 * Check multiple events and update their status if target is reached
 * @param {Array<string>} eventIds - Array of event UUIDs to check
 * @returns {Array<Object>} - Array of update results
 */
async function checkMultipleEvents(eventIds) {
  const results = [];
  
  for (const eventId of eventIds) {
    try {
      const result = await checkAndUpdateEventStatus(eventId);
      results.push(result);
    } catch (error) {
      results.push({
        updated: false,
        event: null,
        message: `Error checking event ${eventId}: ${error.message}`
      });
    }
  }

  return results;
}

/**
 * Check all active events and update status for those that reached target
 * Useful for batch processing or scheduled tasks
 * @returns {Object} - Summary of updates
 */
async function checkAllActiveEvents() {
  try {
    const activeEvents = await Event.findAll({
      where: { status: 'active' }
    });

    let updatedCount = 0;
    const updatedEvents = [];

    for (const event of activeEvents) {
      const result = await checkAndUpdateEventStatus(event.id);
      if (result.updated) {
        updatedCount++;
        updatedEvents.push({
          id: event.id,
          title: event.title,
          currentAmount: result.currentAmount,
          targetAmount: result.targetAmount
        });
      }
    }

    console.log(`📊 Batch status check complete: ${updatedCount} events auto-completed out of ${activeEvents.length} active events`);

    return {
      totalChecked: activeEvents.length,
      updated: updatedCount,
      updatedEvents
    };
  } catch (error) {
    console.error('❌ Error in checkAllActiveEvents:', error);
    throw error;
  }
}

module.exports = {
  checkAndUpdateEventStatus,
  checkMultipleEvents,
  checkAllActiveEvents
};
