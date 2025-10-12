CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional index by created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_stripe_events_created_at ON public.stripe_events (created_at);
