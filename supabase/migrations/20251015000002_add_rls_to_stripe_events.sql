-- Add RLS to stripe_events table
-- CRITICAL SECURITY FIX: Protects Stripe audit trail from unauthorized access

-- Enable RLS on stripe_events table
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view Stripe events (contains sensitive payment data)
CREATE POLICY "Admins can view stripe events"
  ON stripe_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Only the system (service role) can insert Stripe events
CREATE POLICY "Service role can insert stripe events"
  ON stripe_events FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- No one can update Stripe events (immutable audit trail)
-- No policy needed - updates will be blocked by default

-- No one can delete Stripe events (audit trail preservation)
-- No policy needed - deletes will be blocked by default

-- Add comment explaining the security model
COMMENT ON TABLE stripe_events IS 'Stripe webhook events audit trail. Immutable log - only admins can view, only service role can insert.';
