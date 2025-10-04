-- Performance and Security Fixes Migration
-- Date: 2025-01-11
-- Description: Add indexes, constraints, and stored procedures for critical fixes

-- ============================================================================
-- 1. ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Referrals indexes (SEC-006, PERF-002)
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id
  ON referrals(referred_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status
  ON referrals(referrer_id, status)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_referrals_status
  ON referrals(status)
  WHERE status IN ('pending', 'confirmed');

-- Referral earnings indexes (PERF-001, PERF-002)
CREATE INDEX IF NOT EXISTS idx_referral_earnings_user_status
  ON referral_earnings(user_id, status)
  WHERE status IN ('available', 'pending');

CREATE INDEX IF NOT EXISTS idx_referral_earnings_referral_id
  ON referral_earnings(referral_id);

-- Payout requests indexes
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_status
  ON payout_requests(user_id, status)
  WHERE status IN ('pending', 'processing', 'completed');

-- Scripts indexes (PERF-002)
CREATE INDEX IF NOT EXISTS idx_scripts_user_updated
  ON scripts(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_scripts_user_created
  ON scripts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scripts_published
  ON scripts(published, created_at DESC)
  WHERE published = true;

-- Posts indexes (PERF-002, PERF-008)
CREATE INDEX IF NOT EXISTS idx_posts_published_created
  ON posts(published, created_at DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_posts_user_id
  ON posts(user_id, created_at DESC);

-- Full-text search index for posts (PERF-008)
CREATE INDEX IF NOT EXISTS idx_posts_fts
  ON posts USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Messages indexes (PERF-002)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON messages(sender_id, created_at DESC);

-- Jobs/Opportunities indexes (PERF-002)
CREATE INDEX IF NOT EXISTS idx_jobs_active_created
  ON jobs(is_active, created_at DESC)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_jobs_category_active
  ON jobs(category, is_active)
  WHERE is_active = true;

-- Script collaborators indexes
CREATE INDEX IF NOT EXISTS idx_script_collaborators_script_user
  ON script_collaborators(script_id, user_id, status)
  WHERE status = 'active';

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_manuscript_id
  ON submissions(manuscript_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_publisher_id
  ON submissions(publisher_id, status);

-- ============================================================================
-- 2. ADD SECURITY CONSTRAINTS
-- ============================================================================

-- Unique constraint on referrals.referred_id to prevent race condition (SEC-006)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referrals_referred_id_unique'
  ) THEN
    ALTER TABLE referrals
      ADD CONSTRAINT referrals_referred_id_unique UNIQUE (referred_id);
  END IF;
END $$;

-- Check constraints for monetary amounts
DO $$
BEGIN
  -- Referral earnings must be positive
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_referral_earnings_amount_positive'
  ) THEN
    ALTER TABLE referral_earnings
      ADD CONSTRAINT check_referral_earnings_amount_positive
      CHECK (amount_cents >= 0);
  END IF;

  -- Payout requests minimum $1.00
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_payout_amount_minimum'
  ) THEN
    ALTER TABLE payout_requests
      ADD CONSTRAINT check_payout_amount_minimum
      CHECK (amount_cents >= 100);
  END IF;

  -- Referral credit amount positive
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_referral_credit_positive'
  ) THEN
    ALTER TABLE referrals
      ADD CONSTRAINT check_referral_credit_positive
      CHECK (credit_amount >= 0);
  END IF;
END $$;

-- ============================================================================
-- 3. CREATE STORED PROCEDURE FOR ATOMIC PAYOUT TRANSACTION (SEC-007)
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_payout_transaction(
  p_payout_id UUID,
  p_transfer_id TEXT,
  p_amount_cents INT,
  p_user_id UUID
) RETURNS TABLE(
  success BOOLEAN,
  earnings_updated INT
) AS $$
DECLARE
  v_earnings_count INT;
  v_total_paid INT := 0;
  v_remaining INT := p_amount_cents;
BEGIN
  -- Start transaction
  -- Update payout request status
  UPDATE payout_requests
  SET
    status = 'completed',
    stripe_transfer_id = p_transfer_id,
    completed_at = NOW()
  WHERE id = p_payout_id
    AND user_id = p_user_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout request not found or already completed';
  END IF;

  -- Mark earnings as paid (batch update for performance)
  -- Process earnings in order, stopping when amount is reached
  WITH earnings_to_pay AS (
    SELECT
      id,
      amount_cents,
      SUM(amount_cents) OVER (ORDER BY created_at) AS cumulative_amount
    FROM referral_earnings
    WHERE user_id = p_user_id
      AND status = 'available'
      AND amount_cents <= v_remaining
    ORDER BY created_at
  ),
  paid_earnings AS (
    SELECT id
    FROM earnings_to_pay
    WHERE cumulative_amount <= p_amount_cents
  )
  UPDATE referral_earnings
  SET
    status = 'paid',
    paid_at = NOW(),
    stripe_transfer_id = p_transfer_id
  WHERE id IN (SELECT id FROM paid_earnings);

  GET DIAGNOSTICS v_earnings_count = ROW_COUNT;

  -- Return results
  RETURN QUERY SELECT true, v_earnings_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE HELPER FUNCTION FOR SCRIPT ACCESS CHECK (SEC-005)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_script_access(
  p_script_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN := false;
BEGIN
  -- Check if user is owner
  SELECT EXISTS(
    SELECT 1 FROM scripts
    WHERE id = p_script_id
      AND user_id = p_user_id
  ) INTO v_has_access;

  IF v_has_access THEN
    RETURN true;
  END IF;

  -- Check if user is an active collaborator
  SELECT EXISTS(
    SELECT 1 FROM script_collaborators
    WHERE script_id = p_script_id
      AND user_id = p_user_id
      AND status = 'active'
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. IMPROVE SEARCH WITH FULL-TEXT SEARCH FUNCTION (SEC-003, PERF-008)
-- ============================================================================

CREATE OR REPLACE FUNCTION search_posts_fts(
  p_query TEXT,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
) RETURNS TABLE(
  id UUID,
  title TEXT,
  content TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.content,
    p.user_id,
    p.created_at,
    ts_rank(
      to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')),
      plainto_tsquery('english', p_query)
    ) AS rank
  FROM posts p
  WHERE p.published = true
    AND to_tsvector('english', p.title || ' ' || COALESCE(p.content, ''))
        @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. ADD AUDIT LOGGING TABLE (Optional but recommended)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs(resource_type, resource_id, created_at DESC);

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY ON AUDIT LOGS
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- System can insert audit logs (via service role)
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Analyze tables to update statistics for query planner
ANALYZE referrals;
ANALYZE referral_earnings;
ANALYZE payout_requests;
ANALYZE scripts;
ANALYZE posts;
ANALYZE messages;
ANALYZE jobs;
ANALYZE script_collaborators;
ANALYZE submissions;
