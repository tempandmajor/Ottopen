DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean DEFAULT false;
  END IF;
END $$;
