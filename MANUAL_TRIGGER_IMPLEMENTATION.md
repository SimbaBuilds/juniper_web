# Manual Trigger Implementation Guide

This guide explains how to implement manual trigger functionality in the frontend UI for Juniper automations.

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Edge Functions](#edge-functions)
4. [API Endpoints](#api-endpoints)
5. [Trigger Flows by Automation Type](#trigger-flows-by-automation-type)
6. [Frontend Implementation Steps](#frontend-implementation-steps)
7. [Error Handling](#error-handling)

---

## Overview

Juniper automations support 5 trigger types:
- **webhook** - Triggered by external service webhooks
- **polling** - Triggered by periodic data polling from services
- **schedule_once** - Triggered once at a specific time
- **schedule_recurring** - Triggered on a recurring schedule
- **manual** - Triggered directly by user action

Manual triggering from the UI allows users to test or immediately run any automation regardless of its trigger type.

---

## Database Schema

All automation-related tables live in the **`automations` schema** (not the default `public` schema).

### Key Tables

#### `automations.automation_records`
Stores automation definitions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner of the automation |
| `name` | text | Human-readable name |
| `trigger_type` | text | One of: webhook, polling, schedule_once, schedule_recurring, manual |
| `trigger_config` | jsonb | Configuration for the trigger (see below) |
| `actions` | jsonb[] | Array of declarative actions to execute |
| `active` | boolean | Whether automation is enabled |
| `variables` | jsonb | User-defined variables for templates |
| `next_poll_at` | timestamp | (Polling only) When next poll is due |
| `last_poll_cursor` | text | (Polling only) Cursor for change detection |
| `polling_interval_minutes` | integer | (Polling only) Minutes between polls |

**trigger_config for polling:**
```json
{
  "service": "Oura",
  "source_tool": "oura_get_daily_sleep",
  "event_type": "sleep_data_updated",
  "tool_params": {
    "start_date": "{{yesterday}}",
    "end_date": "{{today}}"
  }
}
```

#### `automations.automation_events`
Queue of events waiting to be processed.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `service_name` | text | Service that generated the event (lowercase) |
| `event_type` | text | Type of event |
| `event_id` | text | Unique identifier for deduplication |
| `event_data` | jsonb | Payload data from the event |
| `processed` | boolean | Whether event has been processed |
| `processed_at` | timestamp | When event was processed |
| `retry_count` | integer | Number of processing attempts |
| `created_at` | timestamp | When event was created |

#### `automations.automation_execution_logs`
Execution history for auditing and debugging.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `automation_id` | uuid | Which automation ran |
| `user_id` | uuid | Owner |
| `trigger_data` | jsonb | Data that triggered the execution |
| `result` | jsonb | Execution result |
| `error` | text | Error message if failed |
| `duration_ms` | integer | Execution time |
| `created_at` | timestamp | When execution started |

---

## Edge Functions

Three Supabase Edge Functions handle automation execution:

### 1. scheduler-runner
Handles scheduled polls and scheduled automations.

**Base URL:** `{SUPABASE_URL}/functions/v1/scheduler-runner`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/polling` | POST | Run polling for all due automations |
| `/run` | POST | Run scheduled automations for an interval |
| `/trigger` | POST | Manually trigger a specific scheduled automation |

### 2. event-processor
Processes events from the queue and matches them to automations.

**Base URL:** `{SUPABASE_URL}/functions/v1/event-processor`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/batch` | POST | Process a batch of pending events |
| `/user` | POST | Process events for a specific user |
| `/stats` | GET | Get event processing statistics |

### 3. script-executor
Executes automation actions (both declarative and legacy script-based).

**Base URL:** `{SUPABASE_URL}/functions/v1/script-executor`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/manual` | POST | Execute automation manually |
| `/scheduled` | POST | Execute scheduled automation (internal) |
| `/event` | POST | Execute event-triggered automation (internal) |

---

## API Endpoints

### Authentication

All endpoints require authentication via the `Authorization` header:
- **User Auth:** `Bearer {user_jwt_token}`
- **Service Auth:** `Bearer {SUPABASE_SERVICE_ROLE_KEY}` (for internal calls)

### Endpoint Details

#### 1. Trigger Polling for an Automation

Polls the source service and creates events for new data.

```http
POST {SUPABASE_URL}/functions/v1/scheduler-runner/polling
Authorization: Bearer {service_role_key}
Content-Type: application/json

{
  "category": "health"  // Optional: filter by category (health, email, calendar, messaging, productivity, documents)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Scheduled polling completed",
    "category": "health",
    "timestamp": "2025-01-15T10:00:00Z",
    "total_polls": 3,
    "successful_polls": 3,
    "failed_polls": 0,
    "total_items_found": 5,
    "total_events_created": 2,
    "automations_polled": [
      {"id": "uuid", "name": "Sleep Monitor", "service": "Oura"}
    ]
  }
}
```

#### 2. Process Pending Events

Processes events from the queue and executes matching automations.

```http
POST {SUPABASE_URL}/functions/v1/event-processor/batch
Authorization: Bearer {service_role_key}
Content-Type: application/json

{
  "batch_size": 10  // Optional, default 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Batch processing completed",
    "total_events": 5,
    "successful": 5,
    "failed": 0,
    "batch_size": 10
  }
}
```

#### 3. Process Events for Specific User

Useful for manual triggers - processes only that user's events.

```http
POST {SUPABASE_URL}/functions/v1/event-processor/user
Authorization: Bearer {service_role_key}
Content-Type: application/json

{
  "user_id": "uuid",
  "service_name": "oura"  // Optional: filter by service
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User events processed",
    "user_id": "uuid",
    "total_events": 3,
    "successful": 3,
    "failed": 0
  }
}
```

#### 4. Execute Automation Directly

Bypasses event queue - executes automation immediately with provided trigger data.

```http
POST {SUPABASE_URL}/functions/v1/script-executor/manual
Authorization: Bearer {user_jwt_token}
Content-Type: application/json

{
  "automation_id": "uuid",
  "trigger_data": {
    "score": 85,
    "day": "2025-01-15",
    "deep_sleep": 120
  },
  "test_mode": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "status": "completed",
      "actions_executed": 2,
      "actions_failed": 0,
      "action_results": [...]
    },
    "execution_time_ms": 1234,
    "execution_type": "declarative",
    "test_mode": false
  },
  "execution_id": "uuid"
}
```

#### 5. Get Event Statistics

Check how many events are pending.

```http
GET {SUPABASE_URL}/functions/v1/event-processor/stats
Authorization: Bearer {service_role_key}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_events": 150,
    "pending_events": 5,
    "processed_events": 145,
    "timestamp": "2025-01-15T10:00:00Z"
  }
}
```

---

## Trigger Flows by Automation Type

### Polling Automations (trigger_type: "polling")

Polling automations require a two-step process:

```
┌──────────────────────────────────────────────────────────────────────┐
│                     POLLING AUTOMATION FLOW                          │
└──────────────────────────────────────────────────────────────────────┘

Step 1: Trigger Poll
    ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
    │   Frontend  │────▶│ scheduler-runner │────▶│  FastAPI Tool   │
    │  "Run Now"  │     │    /polling      │     │   Execution     │
    └─────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ automation_events│
                                                │   (new events)   │
                                                └─────────────────┘

Step 2: Process Events (after short delay)
    ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
    │   Frontend  │────▶│  event-processor │────▶│ script-executor │
    │  "Process"  │     │    /user         │     │    /event       │
    └─────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  Actions Run    │
                                                │ (Slack, Email)  │
                                                └─────────────────┘
```

**Frontend Implementation:**
```typescript
async function triggerPollingAutomation(automationId: string, userId: string) {
  // Step 1: Trigger the poll
  const pollResponse = await fetch(`${SUPABASE_URL}/functions/v1/scheduler-runner/polling`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({}) // Poll all due automations
  });

  const pollResult = await pollResponse.json();
  console.log('Poll result:', pollResult.data.total_events_created, 'events created');

  // Step 2: Wait briefly for events to populate
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

  // Step 3: Process events for this user
  const processResponse = await fetch(`${SUPABASE_URL}/functions/v1/event-processor/user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: userId })
  });

  const processResult = await processResponse.json();
  console.log('Process result:', processResult.data.successful, 'events processed');

  return processResult;
}
```

### Scheduled Automations (trigger_type: "schedule_once" or "schedule_recurring")

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SCHEDULED AUTOMATION FLOW                         │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
    │   Frontend  │────▶│  script-executor │────▶│  Actions Run    │
    │  "Run Now"  │     │    /manual       │     │ (Slack, Email)  │
    └─────────────┘     └──────────────────┘     └─────────────────┘
```

**Frontend Implementation:**
```typescript
async function triggerScheduledAutomation(automationId: string, userToken: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/script-executor/manual`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      automation_id: automationId,
      trigger_data: {
        trigger_type: 'manual',
        triggered_at: new Date().toISOString()
      },
      test_mode: false
    })
  });

  return await response.json();
}
```

### Webhook Automations (trigger_type: "webhook")

Same as scheduled - direct execution:

```typescript
async function triggerWebhookAutomation(automationId: string, userToken: string, mockWebhookData: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/script-executor/manual`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      automation_id: automationId,
      trigger_data: {
        trigger_type: 'manual',
        ...mockWebhookData  // Include mock webhook payload for testing
      },
      test_mode: false
    })
  });

  return await response.json();
}
```

### Manual Automations (trigger_type: "manual")

Direct execution - same pattern as scheduled:

```typescript
async function triggerManualAutomation(automationId: string, userToken: string, inputData: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/script-executor/manual`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      automation_id: automationId,
      trigger_data: inputData,
      test_mode: false
    })
  });

  return await response.json();
}
```

---

## Frontend Implementation Steps

### 1. Unified Trigger Function

```typescript
interface TriggerResult {
  success: boolean;
  message: string;
  executionId?: string;
  eventsProcessed?: number;
  error?: string;
}

async function triggerAutomation(
  automation: {
    id: string;
    user_id: string;
    trigger_type: string;
    trigger_config: any;
  },
  userToken: string,
  triggerData?: any
): Promise<TriggerResult> {

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Polling automations need two-step process
    if (automation.trigger_type === 'polling') {
      // Step 1: Trigger poll
      const pollRes = await fetch(`${SUPABASE_URL}/functions/v1/scheduler-runner/polling`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!pollRes.ok) {
        throw new Error(`Polling failed: ${await pollRes.text()}`);
      }

      const pollResult = await pollRes.json();

      // Step 2: Wait for events
      await new Promise(r => setTimeout(r, 2000));

      // Step 3: Process user events
      const processRes = await fetch(`${SUPABASE_URL}/functions/v1/event-processor/user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: automation.user_id })
      });

      if (!processRes.ok) {
        throw new Error(`Event processing failed: ${await processRes.text()}`);
      }

      const processResult = await processRes.json();

      return {
        success: true,
        message: `Polled ${pollResult.data.total_items_found} items, processed ${processResult.data.successful} events`,
        eventsProcessed: processResult.data.successful
      };

    } else {
      // All other types: direct execution
      const response = await fetch(`${SUPABASE_URL}/functions/v1/script-executor/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          automation_id: automation.id,
          trigger_data: triggerData || {
            trigger_type: 'manual',
            triggered_at: new Date().toISOString()
          },
          test_mode: false
        })
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${await response.text()}`);
      }

      const result = await response.json();

      return {
        success: result.success,
        message: `Executed ${result.data.result?.actions_executed || 0} actions`,
        executionId: result.execution_id
      };
    }

  } catch (error) {
    return {
      success: false,
      message: 'Trigger failed',
      error: error.message
    };
  }
}
```

### 2. UI Component Example (React)

```tsx
function AutomationTriggerButton({ automation, userToken }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTrigger = async () => {
    setLoading(true);
    setResult(null);

    try {
      const result = await triggerAutomation(automation, userToken);
      setResult(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleTrigger}
        disabled={loading}
      >
        {loading ? 'Running...' : 'Run Now'}
      </button>

      {result && (
        <div className={result.success ? 'success' : 'error'}>
          {result.message}
          {result.error && <p>{result.error}</p>}
        </div>
      )}
    </div>
  );
}
```

### 3. Checking Execution Status

Query the execution logs to show run history:

```typescript
async function getExecutionHistory(automationId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .schema('automations')
    .from('automation_execution_logs')
    .select('id, created_at, result, error, duration_ms')
    .eq('automation_id', automationId)
    .order('created_at', { ascending: false })
    .limit(10);

  return data;
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Automation not found or access denied` | Invalid ID or user doesn't own automation | Verify automation_id and user has access |
| `No service credentials available` | User hasn't connected required service | Prompt user to connect service in settings |
| `Token expired` | OAuth token needs refresh | System auto-refreshes; retry if fails |
| `Tool execution failed` | External API error | Check service status, retry later |
| `No matching automations found` | Event doesn't match any automation filters | Check trigger_config.filters |

### Retry Logic

For transient failures, implement exponential backoff:

```typescript
async function triggerWithRetry(automation, userToken, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await triggerAutomation(automation, userToken);

    if (result.success) return result;

    // Don't retry on user errors
    if (result.error?.includes('not found') || result.error?.includes('access denied')) {
      return result;
    }

    // Exponential backoff
    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
  }

  return { success: false, message: 'Max retries exceeded' };
}
```

---

## Quick Reference

| Automation Type | Endpoint | Needs Event Processing? |
|-----------------|----------|-------------------------|
| polling | scheduler-runner/polling → event-processor/user | Yes |
| webhook | script-executor/manual | No |
| schedule_once | script-executor/manual | No |
| schedule_recurring | script-executor/manual | No |
| manual | script-executor/manual | No |

**Environment Variables Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for internal calls

---

## Appendix: Trigger Data Structure

When manually triggering, provide trigger_data that matches what the automation expects:

### Polling Automation (e.g., Oura Sleep)
```json
{
  "score": 85,
  "day": "2025-01-15",
  "deep_sleep": 120,
  "rem_sleep": 90,
  "total_sleep": 480
}
```

### Webhook Automation (e.g., Slack Message)
```json
{
  "event_type": "message",
  "channel": "C123456",
  "user": "U789012",
  "text": "Hello world",
  "ts": "1234567890.123456"
}
```

### Scheduled Automation
```json
{
  "trigger_type": "manual",
  "triggered_at": "2025-01-15T10:00:00Z",
  "scheduled_time": "2025-01-15T10:00:00Z"
}
```

The `trigger_data` fields are available in action templates as `{{trigger_data.field_name}}`.
