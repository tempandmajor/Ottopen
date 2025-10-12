-- Add Stripe-related columns to users table
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS stripe_customer_id text,
      ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
      ADD COLUMN IF NOT EXISTS stripe_connect_onboarded boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS subscription_status text,
      ADD COLUMN IF NOT EXISTS subscription_tier text,
      ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;

    -- Helpful indexes
    CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users (stripe_customer_id);
    CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_account_id ON public.users (stripe_connect_account_id);
  END IF;
END $$;
