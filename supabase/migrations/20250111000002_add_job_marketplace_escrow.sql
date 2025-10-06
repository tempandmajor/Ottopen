-- Job Marketplace with Stripe Connect Escrow System
-- Supports milestone-based payments, ratings, and reviews

-- Add hourly rate and portfolio to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS writer_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS jobs_completed INTEGER DEFAULT 0;

-- Add Global Payouts support for countries without Stripe Connect
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_method TEXT; -- 'connect' or 'payout'
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_currency TEXT DEFAULT 'usd';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_bank_account_token TEXT; -- For Global Payouts

-- Create enum for payment status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('pending', 'held', 'released', 'refunded', 'cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestone_status_enum') THEN
        CREATE TYPE milestone_status_enum AS ENUM ('pending', 'in_progress', 'submitted', 'approved', 'rejected', 'paid');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status_enum') THEN
        CREATE TYPE dispute_status_enum AS ENUM ('open', 'under_review', 'resolved', 'closed');
    END IF;
END $$;

-- Job Contracts Table (tracks payment agreements)
CREATE TABLE IF NOT EXISTS job_contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  writer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Financial details
  total_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL, -- 10% of total
  stripe_fee DECIMAL(10,2), -- Calculated from Stripe
  writer_receives DECIMAL(10,2) NOT NULL, -- Amount writer gets after fees

  -- Payment tracking
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  payment_status payment_status_enum DEFAULT 'pending' NOT NULL,

  -- Contract details
  has_milestones BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT TRUE,
  auto_release_days INTEGER DEFAULT 7, -- Auto-release after N days of submission

  -- Timestamps
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Milestones Table (for milestone-based payments)
CREATE TABLE IF NOT EXISTS job_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES job_contracts(id) ON DELETE CASCADE NOT NULL,

  -- Milestone details
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  order_index INTEGER NOT NULL, -- Order of milestones

  -- Status tracking
  status milestone_status_enum DEFAULT 'pending' NOT NULL,

  -- Deliverables
  deliverable_url TEXT, -- Link to submitted work
  deliverable_notes TEXT,

  -- Approval/Rejection
  feedback TEXT,
  approved_by UUID REFERENCES users(id),

  -- Payment
  stripe_transfer_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reviews and Ratings Table
CREATE TABLE IF NOT EXISTS job_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES job_contracts(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Review details
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  -- Review categories (optional detailed ratings)
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),

  -- Review type
  is_writer_review BOOLEAN NOT NULL, -- true if reviewing writer, false if reviewing client

  -- Response
  response_text TEXT,
  response_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Ensure one review per person per contract
  UNIQUE(contract_id, reviewer_id)
);

-- Disputes Table
CREATE TABLE IF NOT EXISTS job_disputes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES job_contracts(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES job_milestones(id) ON DELETE SET NULL,

  -- Dispute details
  raised_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  dispute_reason TEXT NOT NULL,
  evidence_urls TEXT[], -- Array of evidence links

  status dispute_status_enum DEFAULT 'open' NOT NULL,

  -- Resolution
  resolution TEXT,
  resolved_by UUID REFERENCES users(id), -- Admin who resolved
  resolved_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Payment Transactions Log
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES job_contracts(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES job_milestones(id) ON DELETE SET NULL,

  -- Transaction details
  transaction_type TEXT NOT NULL, -- 'charge', 'hold', 'release', 'refund', 'fee'
  amount DECIMAL(10,2) NOT NULL,

  -- Stripe details
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  stripe_charge_id TEXT,

  -- Parties
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),

  -- Metadata
  description TEXT,
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_contracts_client ON job_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_job_contracts_writer ON job_contracts(writer_id);
CREATE INDEX IF NOT EXISTS idx_job_contracts_job ON job_contracts(job_id);
CREATE INDEX IF NOT EXISTS idx_job_contracts_status ON job_contracts(payment_status);

CREATE INDEX IF NOT EXISTS idx_milestones_contract ON job_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON job_milestones(status);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON job_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_contract ON job_reviews(contract_id);

CREATE INDEX IF NOT EXISTS idx_disputes_contract ON job_disputes(contract_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON job_disputes(status);

CREATE INDEX IF NOT EXISTS idx_transactions_contract ON payment_transactions(contract_id);

CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating) WHERE rating > 0;
CREATE INDEX IF NOT EXISTS idx_users_hourly_rate ON users(hourly_rate) WHERE hourly_rate IS NOT NULL;

-- RLS Policies

-- Job Contracts
ALTER TABLE job_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts" ON job_contracts
  FOR SELECT USING (
    auth.uid() = client_id OR
    auth.uid() = writer_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_type = 'platform_agent')
  );

CREATE POLICY "Clients and writers can update their contracts" ON job_contracts
  FOR UPDATE USING (
    auth.uid() = client_id OR auth.uid() = writer_id
  );

-- Milestones
ALTER TABLE job_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract parties can view milestones" ON job_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_contracts
      WHERE job_contracts.id = job_milestones.contract_id
      AND (job_contracts.client_id = auth.uid() OR job_contracts.writer_id = auth.uid())
    )
  );

CREATE POLICY "Writers can update milestone deliverables" ON job_milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM job_contracts
      WHERE job_contracts.id = job_milestones.contract_id
      AND job_contracts.writer_id = auth.uid()
    )
  );

-- Reviews
ALTER TABLE job_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON job_reviews
  FOR SELECT USING (true);

CREATE POLICY "Contract parties can create reviews" ON job_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM job_contracts
      WHERE job_contracts.id = job_reviews.contract_id
      AND (job_contracts.client_id = auth.uid() OR job_contracts.writer_id = auth.uid())
    )
  );

CREATE POLICY "Reviewees can respond to reviews" ON job_reviews
  FOR UPDATE USING (
    auth.uid() = reviewee_id
  );

-- Disputes
ALTER TABLE job_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract parties can view disputes" ON job_disputes
  FOR SELECT USING (
    auth.uid() = raised_by OR
    EXISTS (
      SELECT 1 FROM job_contracts
      WHERE job_contracts.id = job_disputes.contract_id
      AND (job_contracts.client_id = auth.uid() OR job_contracts.writer_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_type = 'platform_agent')
  );

CREATE POLICY "Contract parties can create disputes" ON job_disputes
  FOR INSERT WITH CHECK (
    auth.uid() = raised_by AND
    EXISTS (
      SELECT 1 FROM job_contracts
      WHERE job_contracts.id = job_disputes.contract_id
      AND (job_contracts.client_id = auth.uid() OR job_contracts.writer_id = auth.uid())
    )
  );

-- Payment Transactions (read-only for users)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transactions" ON payment_transactions
  FOR SELECT USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    EXISTS (
      SELECT 1 FROM job_contracts
      WHERE job_contracts.id = payment_transactions.contract_id
      AND (job_contracts.client_id = auth.uid() OR job_contracts.writer_id = auth.uid())
    )
  );

-- Function to update user ratings
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reviewee's rating
  UPDATE users
  SET
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM job_reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM job_reviews
      WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update ratings after review
DROP TRIGGER IF EXISTS update_rating_after_review ON job_reviews;
CREATE TRIGGER update_rating_after_review
  AFTER INSERT ON job_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- Function to update jobs completed count
CREATE OR REPLACE FUNCTION update_jobs_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'released' AND OLD.payment_status != 'released' THEN
    -- Increment writer's completed jobs
    UPDATE users
    SET jobs_completed = jobs_completed + 1
    WHERE id = NEW.writer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update completed jobs
DROP TRIGGER IF EXISTS update_completed_jobs ON job_contracts;
CREATE TRIGGER update_completed_jobs
  AFTER UPDATE ON job_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_completed();
