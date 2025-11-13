const { Event } = require('../models');
const { auditLog } = require('../utils/logger');

/**
 * Check if event has reached its target or expired, and automatically update status to 'completed'
 * @param {string} eventId - The UUID of the event to check
 * @returns {Object} - { updated: boolean, event: Event, message: string, reason?: string }
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

    // Check if event end date has passed
    const now = new Date();
    const endDate = event.end_date ? new Date(event.end_date) : null;
    const hasExpired = endDate && now > endDate;

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
        reason: 'target_reached',
        currentAmount,
        targetAmount
      };
    }

    // Check if event has expired (end date passed)
    if (hasExpired) {
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
        endDate: event.end_date,
        reason: 'Event end date passed'
      });

      console.log(`⏰ Event auto-completed: ${event.title} (ID: ${event.id}) - End date passed: ${event.end_date}`);

      return {
        updated: true,
        event,
        message: `Event automatically completed - end date passed on ${event.end_date}`,
        reason: 'time_expired',
        currentAmount,
        targetAmount,
        endDate: event.end_date
      };
    }

    return {
      updated: false,
      event,
      message: 'Target not yet reached and event not expired',
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
 * Check all active events and update status for those that reached target or expired
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
          reason: result.reason,
          currentAmount: result.currentAmount,
          targetAmount: result.targetAmount,
          endDate: result.endDate
        });
      }
    }

    console.log(`📊 Batch status check complete: ${updatedCount} events auto-completed out of ${activeEvents.length} active events`);
    console.log(`   - Target reached: ${updatedEvents.filter(e => e.reason === 'target_reached').length}`);
    console.log(`   - Time expired: ${updatedEvents.filter(e => e.reason === 'time_expired').length}`);

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
