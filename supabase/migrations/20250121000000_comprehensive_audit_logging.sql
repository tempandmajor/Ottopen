-- Comprehensive Audit Logging System

-- Audit Log Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor Information
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type VARCHAR(50) DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'admin', 'api', 'cron', 'webhook')),

  -- Action Details
  action VARCHAR(100) NOT NULL, -- e.g., 'user.created', 'manuscript.deleted', 'payment.processed'
  resource_type VARCHAR(100) NOT NULL, -- e.g., 'user', 'manuscript', 'payment'
  resource_id UUID,

  -- Change Details
  old_values JSONB, -- Previous state
  new_values JSONB, -- New state
  changes JSONB, -- Diff of changes

  -- Context
  description TEXT,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),

  -- Request Metadata
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100), -- For correlating related actions
  session_id VARCHAR(100),

  -- Additional Context
  metadata JSONB, -- Any additional context

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Events Table (Subset of audit logs for security-specific events)
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Details
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
    'login_success',
    'login_failed',
    'logout',
    'password_changed',
    'password_reset_requested',
    'password_reset_completed',
    'mfa_enabled',
    'mfa_disabled',
    'mfa_failed',
    'account_locked',
    'account_unlocked',
    'suspicious_activity',
    'unauthorized_access_attempt',
    'permission_denied',
    'token_created',
    'token_revoked',
    'api_key_created',
    'api_key_revoked'
  )),

  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event Context
  ip_address INET,
  user_agent TEXT,
  location_country VARCHAR(2), -- ISO country code
  location_city VARCHAR(100),

  -- Risk Assessment
  risk_score INTEGER, -- 0-100
  risk_factors TEXT[],

  -- Additional Details
  details JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Actions Table (Special logging for admin actions)
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Action Details
  action_type VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_resource_type VARCHAR(100),
  target_resource_id UUID,

  -- Action Context
  reason TEXT,
  details JSONB,

  -- Request Context
  ip_address INET,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Access Log (GDPR Article 30 requirement)
CREATE TABLE data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who accessed the data
  accessor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  accessor_type VARCHAR(50) DEFAULT 'user' CHECK (accessor_type IN ('user', 'admin', 'system', 'api')),

  -- What was accessed
  data_subject_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Whose data was accessed
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,

  -- Why it was accessed
  access_purpose VARCHAR(200),
  legal_basis VARCHAR(100) CHECK (legal_basis IN (
    'consent',
    'contract',
    'legal_obligation',
    'vital_interests',
    'public_task',
    'legitimate_interests'
  )),

  -- Access Details
  fields_accessed TEXT[], -- Which specific fields were accessed
  access_method VARCHAR(50), -- 'read', 'update', 'delete', 'export'

  -- Context
  ip_address INET,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Events Log
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Webhook Details
  webhook_type VARCHAR(100) NOT NULL, -- e.g., 'stripe.payment', 'github.push'
  event_type VARCHAR(100) NOT NULL,

  -- Request Details
  payload JSONB NOT NULL,
  headers JSONB,

  -- Processing
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Response
  response_status INTEGER,
  response_body TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX idx_security_events_risk ON security_events(risk_score DESC);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target_user ON admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);

CREATE INDEX idx_data_access_accessor ON data_access_log(accessor_id);
CREATE INDEX idx_data_access_subject ON data_access_log(data_subject_id);
CREATE INDEX idx_data_access_created ON data_access_log(created_at DESC);

CREATE INDEX idx_webhook_events_type ON webhook_events(webhook_type, event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);

-- RLS Policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own security events
CREATE POLICY "Users can view own security events"
  ON security_events FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all security events
CREATE POLICY "Admins can view all security events"
  ON security_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- System can insert security events
CREATE POLICY "System can insert security events"
  ON security_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for admin_actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin actions
CREATE POLICY "Admins can view admin actions"
  ON admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Only admins can insert admin actions
CREATE POLICY "Admins can insert admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- RLS Policies for data_access_log
ALTER TABLE data_access_log ENABLE ROW LEVEL SECURITY;

-- Users can view access logs for their own data
CREATE POLICY "Users can view own data access logs"
  ON data_access_log FOR SELECT
  USING (data_subject_id = auth.uid());

-- Admins can view all data access logs
CREATE POLICY "Admins can view all data access logs"
  ON data_access_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- System can insert data access logs
CREATE POLICY "System can insert data access logs"
  ON data_access_log FOR INSERT
  WITH CHECK (true);

-- RLS Policies for webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events
CREATE POLICY "Admins can view webhook events"
  ON webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Only admins and system can insert webhook events
CREATE POLICY "System can manage webhook events"
  ON webhook_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Helper Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_severity VARCHAR DEFAULT 'info',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    description,
    severity,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_description,
    p_severity,
    p_metadata
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := TG_TABLE_NAME || '.created';
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := TG_TABLE_NAME || '.updated';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := TG_TABLE_NAME || '.deleted';
    v_old_values := to_jsonb(OLD);
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_values,
    v_new_values
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_manuscripts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON manuscripts
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- View for Recent Audit Activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT
  al.id,
  al.user_id,
  u.display_name as user_name,
  u.email as user_email,
  al.action,
  al.resource_type,
  al.resource_id,
  al.severity,
  al.description,
  al.created_at
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 1000;

GRANT SELECT ON recent_audit_activity TO authenticated;

-- View for Security Dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT
  COUNT(*) FILTER (WHERE event_type LIKE '%failed%') as failed_login_attempts,
  COUNT(*) FILTER (WHERE event_type = 'suspicious_activity') as suspicious_activities,
  COUNT(*) FILTER (WHERE risk_score > 70) as high_risk_events,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as events_last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as events_last_hour,
  COUNT(DISTINCT user_id) as affected_users
FROM security_events
WHERE created_at > NOW() - INTERVAL '7 days';

GRANT SELECT ON security_dashboard TO authenticated;

-- View for Admin Activity Summary
CREATE OR REPLACE VIEW admin_activity_summary AS
SELECT
  aa.admin_id,
  u.display_name as admin_name,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE aa.created_at > NOW() - INTERVAL '24 hours') as actions_last_24h,
  COUNT(*) FILTER (WHERE aa.created_at > NOW() - INTERVAL '7 days') as actions_last_week,
  array_agg(DISTINCT action_type) as action_types,
  MAX(aa.created_at) as last_action_at
FROM admin_actions aa
LEFT JOIN users u ON u.id = aa.admin_id
GROUP BY aa.admin_id, u.display_name;

GRANT SELECT ON admin_activity_summary TO authenticated;
