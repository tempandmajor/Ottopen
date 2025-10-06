-- GDPR/CCPA Compliance System

-- Data Subject Requests (DSR) Table
CREATE TABLE data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Requester Information
  requester_email VARCHAR(255) NOT NULL,
  requester_name VARCHAR(255),
  verification_token VARCHAR(255) UNIQUE,
  verified_at TIMESTAMPTZ,

  -- Request Details
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
    'access',           -- GDPR Article 15 / CCPA Right to Know
    'rectification',    -- GDPR Article 16
    'erasure',          -- GDPR Article 17 (Right to be Forgotten) / CCPA Right to Delete
    'portability',      -- GDPR Article 20 / CCPA Right to Data Portability
    'restriction',      -- GDPR Article 18
    'objection',        -- GDPR Article 21
    'opt_out_sale',     -- CCPA Right to Opt-Out
    'do_not_sell'       -- CCPA Do Not Sell
  )),
  request_details TEXT,
  regulation VARCHAR(20) CHECK (regulation IN ('GDPR', 'CCPA', 'BOTH')),

  -- Processing
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'verifying',
    'verified',
    'processing',
    'completed',
    'rejected',
    'cancelled'
  )),
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  processing_notes TEXT,

  -- Data Package (for access/portability requests)
  data_package_url TEXT,
  data_package_expires_at TIMESTAMPTZ,

  -- Timeline
  deadline_at TIMESTAMPTZ, -- 30 days for GDPR, 45 days for CCPA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent Management Table
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Consent Type
  consent_type VARCHAR(100) NOT NULL CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy',
    'marketing_emails',
    'analytics_cookies',
    'functional_cookies',
    'advertising_cookies',
    'third_party_sharing',
    'data_processing',
    'profiling'
  )),

  -- Consent Details
  granted BOOLEAN NOT NULL DEFAULT false,
  consent_text TEXT, -- The exact text user consented to
  consent_version VARCHAR(50), -- Version of policy/terms
  consent_method VARCHAR(50), -- 'explicit', 'implicit', 'opt_in', 'opt_out'

  -- IP and Device Info (for compliance proof)
  ip_address INET,
  user_agent TEXT,

  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, consent_type)
);

-- Data Retention Policies Table
CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type VARCHAR(100) NOT NULL UNIQUE,
  retention_period_days INTEGER NOT NULL,
  description TEXT,
  legal_basis TEXT,
  auto_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Processing Activities (GDPR Article 30 Record)
CREATE TABLE data_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis VARCHAR(100) NOT NULL CHECK (legal_basis IN (
    'consent',
    'contract',
    'legal_obligation',
    'vital_interests',
    'public_task',
    'legitimate_interests'
  )),
  data_categories TEXT[] NOT NULL, -- e.g., ['name', 'email', 'manuscripts']
  data_subjects TEXT[] NOT NULL,   -- e.g., ['users', 'customers', 'employees']
  recipients TEXT[],               -- Who receives the data
  third_country_transfers BOOLEAN DEFAULT false,
  safeguards TEXT,                 -- For international transfers
  retention_period VARCHAR(100),
  security_measures TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Privacy Policy Versions Table
CREATE TABLE privacy_policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Breach Log Table
CREATE TABLE data_breach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breach_date TIMESTAMPTZ NOT NULL,
  discovered_date TIMESTAMPTZ NOT NULL,
  breach_type VARCHAR(100) NOT NULL,
  affected_data_types TEXT[] NOT NULL,
  affected_users_count INTEGER,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,

  -- Actions Taken
  containment_measures TEXT,
  notification_required BOOLEAN DEFAULT false,
  authorities_notified_at TIMESTAMPTZ,
  users_notified_at TIMESTAMPTZ,

  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dsr_user_id ON data_subject_requests(user_id);
CREATE INDEX idx_dsr_status ON data_subject_requests(status);
CREATE INDEX idx_dsr_type ON data_subject_requests(request_type);
CREATE INDEX idx_dsr_deadline ON data_subject_requests(deadline_at);
CREATE INDEX idx_user_consents_user ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_granted ON user_consents(granted);
CREATE INDEX idx_data_breach_severity ON data_breach_log(severity);
CREATE INDEX idx_data_breach_resolved ON data_breach_log(resolved);

-- RLS Policies for data_subject_requests
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own requests
CREATE POLICY "Users can create own DSR"
  ON data_subject_requests FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Users can view their own requests
CREATE POLICY "Users can view own DSR"
  ON data_subject_requests FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all requests
CREATE POLICY "Admins can view all DSR"
  ON data_subject_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Admins can update requests
CREATE POLICY "Admins can update DSR"
  ON data_subject_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- RLS Policies for user_consents
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Users can manage their own consents
CREATE POLICY "Users can manage own consents"
  ON user_consents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all consents
CREATE POLICY "Admins can view all consents"
  ON user_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- RLS Policies for data_retention_policies
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Anyone can view retention policies (transparency)
CREATE POLICY "Public can view retention policies"
  ON data_retention_policies FOR SELECT
  USING (true);

-- Only admins can manage retention policies
CREATE POLICY "Admins can manage retention policies"
  ON data_retention_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- RLS Policies for data_processing_activities
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;

-- Anyone can view processing activities (GDPR transparency)
CREATE POLICY "Public can view processing activities"
  ON data_processing_activities FOR SELECT
  USING (true);

-- Only admins can manage processing activities
CREATE POLICY "Admins can manage processing activities"
  ON data_processing_activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- RLS Policies for privacy_policy_versions
ALTER TABLE privacy_policy_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can view privacy policies
CREATE POLICY "Public can view privacy policies"
  ON privacy_policy_versions FOR SELECT
  USING (true);

-- Only admins can manage privacy policies
CREATE POLICY "Admins can manage privacy policies"
  ON privacy_policy_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- RLS Policies for data_breach_log
ALTER TABLE data_breach_log ENABLE ROW LEVEL SECURITY;

-- Only admins can access breach log
CREATE POLICY "Admins can manage breach log"
  ON data_breach_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Function to set DSR deadline based on regulation
CREATE OR REPLACE FUNCTION set_dsr_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- GDPR: 30 days, CCPA: 45 days
  IF NEW.regulation = 'GDPR' THEN
    NEW.deadline_at = NEW.created_at + INTERVAL '30 days';
  ELSIF NEW.regulation = 'CCPA' THEN
    NEW.deadline_at = NEW.created_at + INTERVAL '45 days';
  ELSE
    NEW.deadline_at = NEW.created_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set DSR deadline
CREATE TRIGGER trigger_set_dsr_deadline
  BEFORE INSERT ON data_subject_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_dsr_deadline();

-- Function to auto-delete expired data based on retention policies
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
DECLARE
  policy RECORD;
BEGIN
  FOR policy IN SELECT * FROM data_retention_policies WHERE auto_delete = true
  LOOP
    -- This is a placeholder - actual deletion logic would be implemented per data type
    -- Example: DELETE FROM messages WHERE created_at < NOW() - INTERVAL '1 day' * policy.retention_period_days;

    RAISE NOTICE 'Would delete data of type % older than % days', policy.data_type, policy.retention_period_days;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- View for DSR dashboard
CREATE OR REPLACE VIEW dsr_dashboard AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_requests,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
  COUNT(*) FILTER (WHERE deadline_at < NOW() AND status NOT IN ('completed', 'rejected', 'cancelled')) as overdue_requests,
  COUNT(*) FILTER (WHERE request_type = 'erasure') as deletion_requests,
  COUNT(*) FILTER (WHERE request_type = 'access') as access_requests,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as requests_this_month
FROM data_subject_requests;

GRANT SELECT ON dsr_dashboard TO authenticated;

-- View for consent overview
CREATE OR REPLACE VIEW consent_overview AS
SELECT
  consent_type,
  COUNT(*) FILTER (WHERE granted = true) as granted_count,
  COUNT(*) FILTER (WHERE granted = false) as revoked_count,
  COUNT(*) as total_users
FROM user_consents
GROUP BY consent_type;

GRANT SELECT ON consent_overview TO authenticated;

-- Insert default retention policies
INSERT INTO data_retention_policies (data_type, retention_period_days, description, legal_basis, auto_delete) VALUES
('user_account_inactive', 1095, 'Inactive user accounts (3 years)', 'Legitimate interest in data accuracy', true),
('messages', 365, 'Direct messages between users (1 year)', 'Contract performance', false),
('manuscripts_deleted', 30, 'Deleted manuscripts (30 days grace period)', 'User request fulfillment', true),
('audit_logs', 2555, 'Security and audit logs (7 years)', 'Legal obligation', false),
('analytics_data', 730, 'Analytics and usage data (2 years)', 'Legitimate interest in service improvement', true),
('payment_records', 2555, 'Payment and transaction records (7 years)', 'Legal obligation (tax law)', false);

-- Insert default privacy policy version
INSERT INTO privacy_policy_versions (version, content, effective_date, is_current) VALUES
('1.0', 'Privacy Policy Content Here - To be replaced with actual policy', CURRENT_DATE, true);
