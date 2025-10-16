-- Add event_id column to webhook_events table for idempotency
-- This prevents duplicate processing of webhook events

ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS event_id VARCHAR(255);

-- Create unique index to prevent duplicate event processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_unique_event
ON webhook_events(webhook_type, event_id)
WHERE event_id IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
ON webhook_events(event_id)
WHERE event_id IS NOT NULL;

-- Add comment explaining the column's purpose
COMMENT ON COLUMN webhook_events.event_id IS 'External event ID from webhook provider (e.g., Stripe event ID) for idempotency checks';
