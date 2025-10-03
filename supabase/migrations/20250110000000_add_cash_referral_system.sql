-- Migration: Add Cash Referral System with Stripe Connect
-- Description: Extends referral system to support cash payouts via Stripe Connect

-- Add Stripe Connect account ID to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Create referral earnings table (for cash tracking)
CREATE TABLE IF NOT EXISTS referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL, -- Amount in cents (e.g., 200 = $2.00)
  currency TEXT DEFAULT 'usd' NOT NULL,
  status TEXT CHECK (status IN ('pending', 'available', 'paid', 'failed')) DEFAULT 'pending' NOT NULL,
  paid_at TIMESTAMPTZ,
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd' NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending' NOT NULL,
  stripe_payout_id TEXT,
  failure_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_earnings_user_id ON referral_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_status ON referral_earnings(status);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referral_id ON referral_earnings(referral_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_users_stripe_connect ON users(stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;

-- Enable RLS
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_earnings
CREATE POLICY "Users can view own earnings"
  ON referral_earnings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create earnings"
  ON referral_earnings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update earnings"
  ON referral_earnings FOR UPDATE
  USING (true);

-- RLS Policies for payout_requests
CREATE POLICY "Users can view own payout requests"
  ON payout_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payout requests"
  ON payout_requests FOR UPDATE
  USING (true);

-- Function to calculate available balance for a user
CREATE OR REPLACE FUNCTION get_referral_balance(p_user_id UUID)
RETURNS TABLE(
  total_earned_cents INTEGER,
  available_cents INTEGER,
  pending_cents INTEGER,
  paid_cents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount_cents), 0)::INTEGER as total_earned_cents,
    COALESCE(SUM(CASE WHEN status = 'available' THEN amount_cents ELSE 0 END), 0)::INTEGER as available_cents,
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0)::INTEGER as pending_cents,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0)::INTEGER as paid_cents
  FROM referral_earnings
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically mark earnings as available when referral is confirmed
CREATE OR REPLACE FUNCTION mark_earnings_available()
RETURNS TRIGGER AS $$
BEGIN
  -- When a referral is confirmed, mark its earnings as available
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE referral_earnings
    SET status = 'available', updated_at = NOW()
    WHERE referral_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic earnings availability
DROP TRIGGER IF EXISTS trigger_mark_earnings_available ON referrals;
CREATE TRIGGER trigger_mark_earnings_available
  AFTER UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION mark_earnings_available();

-- Add updated_at trigger for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_referral_earnings_updated_at ON referral_earnings;
CREATE TRIGGER update_referral_earnings_updated_at
  BEFORE UPDATE ON referral_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payout_requests_updated_at ON payout_requests;
CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
