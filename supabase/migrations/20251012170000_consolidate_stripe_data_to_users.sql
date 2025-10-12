-- Consolidate Stripe data from profiles to users table
-- This migration ensures all Stripe-related data lives in the users table

DO $$
BEGIN
  -- First, ensure the users table has all necessary Stripe columns (should already exist from previous migration)
  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS stripe_customer_id text,
    ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
    ADD COLUMN IF NOT EXISTS stripe_connect_onboarded boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS subscription_status text,
    ADD COLUMN IF NOT EXISTS subscription_tier text,
    ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;

  -- Copy stripe_customer_id from profiles to users if profiles table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='profiles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_customer_id'
  ) THEN
    -- Update users table with stripe_customer_id from profiles where it exists
    UPDATE public.users u
    SET stripe_customer_id = p.stripe_customer_id
    FROM public.profiles p
    WHERE u.id = p.id
      AND p.stripe_customer_id IS NOT NULL
      AND (u.stripe_customer_id IS NULL OR u.stripe_customer_id = '');

    -- Log the migration
    RAISE NOTICE 'Migrated stripe_customer_id from profiles to users table';
  END IF;

  -- Create indexes if they don't exist
  CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users (stripe_customer_id);
  CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_account_id ON public.users (stripe_connect_account_id);
  CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users (subscription_status);

END $$;
