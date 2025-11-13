# Event Auto-Completion Feature

## Overview

Events are now automatically marked as **completed** when either of these conditions is met:

1. **Target Reached**: The event's current pledged amount reaches or exceeds the target amount
2. **Time Expired**: The event's end date has passed

This ensures events stay up-to-date without manual intervention.

## How It Works

### Automatic Checks

The system checks event status in two scenarios:

1. **On Pledge Creation**: Every time a pledge is made, the system checks if the event should be completed
2. **Manual/Scheduled Check**: Run the `npm run check-expired` script to batch-check all active events

### Priority

If both conditions are met (target reached AND time expired), the system prioritizes **target_reached** as the completion reason.

## Implementation Details

### Service: `eventStatusService.js`

The `checkAndUpdateEventStatus()` function now:
- Checks if the target amount is reached
- Checks if the end_date has passed
- Updates event status to 'completed' if either condition is true
- Logs the reason for completion (target_reached or time_expired)

```javascript
const { checkAndUpdateEventStatus } = require('./services/eventStatusService');

// Check single event
const result = await checkAndUpdateEventStatus(eventId);
// result.updated === true if event was completed
// result.reason === 'target_reached' or 'time_expired'

// Check all active events
const { checkAllActiveEvents } = require('./services/eventStatusService');
const summary = await checkAllActiveEvents();
// summary.updated === count of completed events
// summary.updatedEvents === array of completed events with reasons
```

### Model: `Event.js`

New instance methods:

```javascript
// Check if event end date has passed
event.hasExpired(); // returns boolean

// Auto-complete if expired
await event.autoCompleteIfExpired(); // returns boolean
```

## Usage

### Maintenance Script

Run periodically to check for expired events:

```bash
cd backend
npm run check-expired
```

**Output Example:**
```
🔄 Connecting to database...
✅ Database connected

🔍 Checking for expired or completed events...
📊 Batch status check complete: 2 events auto-completed out of 5 active events
   - Target reached: 1
   - Time expired: 1

📊 Summary:
   Total active events checked: 5
   Events auto-completed: 2

✅ Updated events:
   1. 🎯 Summer Charity Drive
      Reason: Target reached (5000/5000)
   2. ⏰ Winter Fundraiser
      Reason: End date passed (2025-11-10)
```

### Recommended Setup

Set up a cron job or scheduled task to run the script periodically:

**Linux/Mac (crontab):**
```bash
# Run every hour
0 * * * * cd /path/to/backend && npm run check-expired >> /var/log/event-check.log 2>&1

# Run daily at 2 AM
0 2 * * * cd /path/to/backend && npm run check-expired >> /var/log/event-check.log 2>&1
```

**Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 2:00 AM)
4. Action: Start a program
   - Program: `npm`
   - Arguments: `run check-expired`
   - Start in: `D:\path\to\backend`

### API Response

When a pledge triggers event completion:

```json
{
  "success": true,
  "message": "Pledge created successfully - Congratulations! The event 'Summer Drive' has reached its target and is now completed! 🎉",
  "data": { /* pledge details */ },
  "eventStatusUpdated": true,
  "completionReason": "target_reached"
}
```

Or for time expiration:

```json
{
  "success": true,
  "message": "Pledge created successfully - The event 'Winter Event' has ended (time expired) and is now completed.",
  "data": { /* pledge details */ },
  "eventStatusUpdated": true,
  "completionReason": "time_expired"
}
```

## Testing

Run the unit tests:

```bash
npm run test:unit -- eventStatusService.test.js
```

Tests cover:
- ✅ Target reached completion
- ✅ Time expired completion
- ✅ Priority when both conditions met
- ✅ No update when neither condition met
- ✅ Batch processing
- ✅ Model helper methods

## Benefits

1. **Automatic**: No manual intervention needed to close expired events
2. **Accurate**: Event status always reflects current state
3. **Transparent**: Clear logging and reason tracking
4. **Flexible**: Works on-demand (via pledges) or scheduled (via script)
5. **Tested**: Comprehensive unit tests ensure reliability

## Database Changes

No schema changes required! The feature uses existing fields:
- `status` (enum: 'pending', 'active', 'completed', 'rejected')
- `end_date` (DATE)
- `current_amount` (DECIMAL)
- `target_amount` (DECIMAL)
