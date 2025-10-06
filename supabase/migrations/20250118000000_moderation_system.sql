-- Moderation System for Book Clubs

-- Content Reports Table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('discussion', 'reply', 'critique', 'review', 'comment', 'user', 'message')),
  content_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'off_topic', 'plagiarism', 'other')),
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Moderation Actions (Bans/Mutes)
CREATE TABLE IF NOT EXISTS user_moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('ban', 'mute', 'warning', 'timeout')),
  reason TEXT NOT NULL,
  duration_minutes INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id)
);

-- Moderation Log (Audit Trail)
CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES users(id),
  club_id UUID REFERENCES book_clubs(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Approval Queue (for clubs with pre-approval required)
CREATE TABLE IF NOT EXISTS content_approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  content_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_club_id ON content_reports(club_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_actions_user ON user_moderation_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_actions_club ON user_moderation_actions(club_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_expires ON user_moderation_actions(user_id, expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moderation_log_moderator ON moderation_log(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_club ON moderation_log(club_id);
CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON content_approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_approval_queue_club ON content_approval_queue(club_id);

-- RLS Policies for content_reports
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
  ON content_reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Moderators can view club reports"
  ON content_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = content_reports.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
      AND cm.status = 'active'
    )
  );

CREATE POLICY "Moderators can update reports"
  ON content_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = content_reports.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
      AND cm.status = 'active'
    )
  );

-- RLS Policies for user_moderation_actions
ALTER TABLE user_moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can create actions"
  ON user_moderation_actions FOR INSERT
  WITH CHECK (
    moderator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = user_moderation_actions.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
      AND cm.status = 'active'
    )
  );

CREATE POLICY "Moderators can view club actions"
  ON user_moderation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = user_moderation_actions.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
      AND cm.status = 'active'
    )
  );

CREATE POLICY "Users can view own actions"
  ON user_moderation_actions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Moderators can revoke actions"
  ON user_moderation_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = user_moderation_actions.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
      AND cm.status = 'active'
    )
  );

-- RLS Policies for moderation_log
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can create log entries"
  ON moderation_log FOR INSERT
  WITH CHECK (moderator_id = auth.uid());

CREATE POLICY "Moderators can view club logs"
  ON moderation_log FOR SELECT
  USING (
    club_id IS NULL OR
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = moderation_log.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
      AND cm.status = 'active'
    )
  );

-- RLS Policies for content_approval_queue
ALTER TABLE content_approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can view own submissions"
  ON content_approval_queue FOR SELECT
  USING (author_id = auth.uid());

CREATE POLICY "Moderators can view pending content"
  ON content_approval_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = content_approval_queue.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
      AND cm.status = 'active'
    )
  );

CREATE POLICY "Moderators can review content"
  ON content_approval_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = content_approval_queue.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
      AND cm.status = 'active'
    )
  );

-- Function to check if moderation action is active
CREATE OR REPLACE FUNCTION is_moderation_action_active(action_row user_moderation_actions)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN action_row.revoked_at IS NULL
    AND (action_row.expires_at IS NULL OR action_row.expires_at > NOW());
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to log moderation actions
CREATE OR REPLACE FUNCTION log_moderation_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO moderation_log (
    moderator_id,
    club_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    NEW.moderator_id,
    NEW.club_id,
    TG_ARGV[0],
    TG_ARGV[1],
    NEW.user_id,
    jsonb_build_object(
      'action_type', NEW.action_type,
      'reason', NEW.reason,
      'duration_minutes', NEW.duration_minutes
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for moderation actions
CREATE TRIGGER trigger_log_moderation_action
  AFTER INSERT ON user_moderation_actions
  FOR EACH ROW
  EXECUTE FUNCTION log_moderation_action('moderation_action', 'user');

-- View for moderation statistics
CREATE OR REPLACE VIEW moderation_stats AS
SELECT
  club_id,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
  COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_reports,
  COUNT(DISTINCT reporter_id) as unique_reporters,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as reports_this_week,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as reports_this_month
FROM content_reports
GROUP BY club_id;

GRANT SELECT ON moderation_stats TO authenticated;

-- View for active moderation actions
CREATE OR REPLACE VIEW active_moderation_actions AS
SELECT
  uma.*,
  u.display_name as user_name,
  u.username as user_username,
  m.display_name as moderator_name,
  is_moderation_action_active(uma) as is_active
FROM user_moderation_actions uma
JOIN users u ON u.id = uma.user_id
JOIN users m ON m.id = uma.moderator_id
WHERE uma.revoked_at IS NULL
  AND (uma.expires_at IS NULL OR uma.expires_at > NOW());

GRANT SELECT ON active_moderation_actions TO authenticated;
