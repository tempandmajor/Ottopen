-- DMCA Takedown System

-- DMCA Notices Table
CREATE TABLE dmca_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complainant_name VARCHAR(255) NOT NULL,
  complainant_email VARCHAR(255) NOT NULL,
  complainant_address TEXT,
  complainant_phone VARCHAR(50),

  -- Content Information
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('manuscript', 'critique', 'comment', 'post', 'message', 'profile')),
  content_id UUID NOT NULL,
  content_url TEXT,

  -- Copyright Information
  copyrighted_work_description TEXT NOT NULL,
  original_work_location TEXT, -- URL or description of original work

  -- Infringement Details
  infringement_description TEXT NOT NULL,
  good_faith_statement TEXT NOT NULL,
  accuracy_statement TEXT NOT NULL,
  signature VARCHAR(255) NOT NULL,
  signature_date DATE NOT NULL,

  -- Processing
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'content_removed', 'counter_noticed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Content Owner
  content_owner_id UUID REFERENCES users(id),
  content_owner_notified_at TIMESTAMPTZ,

  -- Counter Notice
  counter_notice_id UUID REFERENCES dmca_counter_notices(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DMCA Counter Notices Table
CREATE TABLE dmca_counter_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dmca_notice_id UUID NOT NULL REFERENCES dmca_notices(id) ON DELETE CASCADE,

  -- User Information
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_address TEXT NOT NULL,
  user_phone VARCHAR(50),

  -- Counter Notice Details
  good_faith_statement TEXT NOT NULL,
  consent_to_jurisdiction TEXT NOT NULL,
  accuracy_statement TEXT NOT NULL,
  signature VARCHAR(255) NOT NULL,
  signature_date DATE NOT NULL,

  -- Processing
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'content_restored')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Timeline
  waiting_period_ends_at TIMESTAMPTZ, -- 10-14 business days

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Taken Down Content Log
CREATE TABLE dmca_taken_down_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dmca_notice_id UUID NOT NULL REFERENCES dmca_notices(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  content_backup JSONB NOT NULL, -- Backup of content before takedown
  taken_down_at TIMESTAMPTZ DEFAULT NOW(),
  restored_at TIMESTAMPTZ,
  restored_by UUID REFERENCES users(id),
  restoration_reason TEXT
);

-- Indexes
CREATE INDEX idx_dmca_notices_status ON dmca_notices(status);
CREATE INDEX idx_dmca_notices_content ON dmca_notices(content_type, content_id);
CREATE INDEX idx_dmca_notices_owner ON dmca_notices(content_owner_id);
CREATE INDEX idx_dmca_counter_notices_notice ON dmca_counter_notices(dmca_notice_id);
CREATE INDEX idx_dmca_counter_notices_user ON dmca_counter_notices(user_id);
CREATE INDEX idx_dmca_counter_notices_status ON dmca_counter_notices(status);
CREATE INDEX idx_dmca_taken_down_content_notice ON dmca_taken_down_content(dmca_notice_id);
CREATE INDEX idx_dmca_taken_down_content_content ON dmca_taken_down_content(content_type, content_id);

-- RLS Policies for dmca_notices
ALTER TABLE dmca_notices ENABLE ROW LEVEL SECURITY;

-- Public can submit DMCA notices
CREATE POLICY "Anyone can submit DMCA notices"
  ON dmca_notices FOR INSERT
  WITH CHECK (true);

-- Content owners can view notices about their content
CREATE POLICY "Content owners can view their notices"
  ON dmca_notices FOR SELECT
  USING (content_owner_id = auth.uid());

-- Admins can view all notices
CREATE POLICY "Admins can view all notices"
  ON dmca_notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Admins can update notices
CREATE POLICY "Admins can update notices"
  ON dmca_notices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- RLS Policies for dmca_counter_notices
ALTER TABLE dmca_counter_notices ENABLE ROW LEVEL SECURITY;

-- Users can submit counter notices for their content
CREATE POLICY "Users can submit counter notices"
  ON dmca_counter_notices FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can view their own counter notices
CREATE POLICY "Users can view own counter notices"
  ON dmca_counter_notices FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all counter notices
CREATE POLICY "Admins can view all counter notices"
  ON dmca_counter_notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Admins can update counter notices
CREATE POLICY "Admins can update counter notices"
  ON dmca_counter_notices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- RLS Policies for dmca_taken_down_content
ALTER TABLE dmca_taken_down_content ENABLE ROW LEVEL SECURITY;

-- Only admins can view taken down content
CREATE POLICY "Admins can view taken down content"
  ON dmca_taken_down_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Only admins can insert taken down content
CREATE POLICY "Admins can insert taken down content"
  ON dmca_taken_down_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Only admins can update taken down content
CREATE POLICY "Admins can update taken down content"
  ON dmca_taken_down_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Function to notify content owner of DMCA notice
CREATE OR REPLACE FUNCTION notify_content_owner_dmca()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the notice with notification timestamp
  NEW.content_owner_notified_at = NOW();

  -- TODO: Add email notification logic here or via external service

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify content owner when DMCA notice is approved
CREATE TRIGGER trigger_notify_content_owner_dmca
  BEFORE UPDATE ON dmca_notices
  FOR EACH ROW
  WHEN (OLD.status != 'approved' AND NEW.status = 'approved')
  EXECUTE FUNCTION notify_content_owner_dmca();

-- Function to set counter notice waiting period
CREATE OR REPLACE FUNCTION set_counter_notice_waiting_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Set waiting period to 14 business days from submission
  NEW.waiting_period_ends_at = NOW() + INTERVAL '14 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set waiting period on counter notice submission
CREATE TRIGGER trigger_set_counter_notice_waiting_period
  BEFORE INSERT ON dmca_counter_notices
  FOR EACH ROW
  EXECUTE FUNCTION set_counter_notice_waiting_period();

-- View for pending DMCA notices requiring action
CREATE OR REPLACE VIEW pending_dmca_actions AS
SELECT
  dn.id,
  dn.content_type,
  dn.content_id,
  dn.complainant_name,
  dn.status,
  dn.created_at,
  CASE
    WHEN dn.status = 'pending' THEN 'Review DMCA notice'
    WHEN dn.status = 'approved' AND dn.counter_notice_id IS NULL THEN 'Take down content'
    WHEN dcn.status = 'pending' THEN 'Review counter notice'
    WHEN dcn.status = 'approved' AND dcn.waiting_period_ends_at < NOW() THEN 'Restore content'
  END as action_required
FROM dmca_notices dn
LEFT JOIN dmca_counter_notices dcn ON dcn.dmca_notice_id = dn.id
WHERE dn.status IN ('pending', 'approved')
   OR dcn.status IN ('pending', 'approved');

GRANT SELECT ON pending_dmca_actions TO authenticated;

-- View for DMCA statistics
CREATE OR REPLACE VIEW dmca_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_notices,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_notices,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_notices,
  COUNT(*) FILTER (WHERE status = 'content_removed') as content_removed,
  COUNT(*) FILTER (WHERE status = 'counter_noticed') as counter_noticed,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as notices_this_month,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as notices_this_week
FROM dmca_notices;

GRANT SELECT ON dmca_stats TO authenticated;
