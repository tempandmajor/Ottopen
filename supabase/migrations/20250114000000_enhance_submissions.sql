-- ============================================================================
-- SUBMISSIONS ENHANCEMENT MIGRATION
-- Adds file uploads, advanced status tracking, analytics, and more
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE EXISTING TABLES
-- ============================================================================

-- Enhance submissions table with new fields
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS submission_number SERIAL,
  ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('urgent', 'high', 'normal', 'low')),
  ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS internal_rating INTEGER CHECK (internal_rating >= 1 AND internal_rating <= 10),
  ADD COLUMN IF NOT EXISTS market_potential TEXT CHECK (market_potential IN ('high', 'medium', 'low', 'unknown')),
  ADD COLUMN IF NOT EXISTS development_needed TEXT[],
  ADD COLUMN IF NOT EXISTS comparable_submissions UUID[],
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawn_reason TEXT,
  ADD COLUMN IF NOT EXISTS offer_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS offer_terms TEXT,
  ADD COLUMN IF NOT EXISTS contract_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;

-- Update status field to include new statuses
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check
  CHECK (status IN (
    'draft', 'pending', 'under_review', 'shortlisted',
    'offer_pending', 'accepted', 'contract_sent', 'signed',
    'rejected', 'withdrawn', 'revise_resubmit'
  ));

-- Enhance manuscripts table with file storage and metadata
ALTER TABLE manuscripts
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_manuscript_id UUID REFERENCES manuscripts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS word_count INTEGER,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS content_warnings TEXT[],
  ADD COLUMN IF NOT EXISTS previous_publications TEXT[],
  ADD COLUMN IF NOT EXISTS awards TEXT[],
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================================================
-- 2. CREATE NEW TABLES
-- ============================================================================

-- Submission templates for quick form filling
CREATE TABLE IF NOT EXISTS submission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  genre TEXT,
  is_public BOOLEAN DEFAULT false,
  template_data JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission history for audit trail
CREATE TABLE IF NOT EXISTS submission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File attachments for manuscripts
CREATE TABLE IF NOT EXISTS submission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  attachment_type TEXT CHECK (attachment_type IN ('manuscript', 'synopsis', 'cover_letter', 'sample_pages', 'treatment', 'other')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Submission analytics aggregates
CREATE TABLE IF NOT EXISTS submission_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_submissions INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  avg_response_time_days DECIMAL(10,2),
  acceptance_rate DECIMAL(5,2),
  genres_submitted JSONB,
  types_submitted JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_on_status_change BOOLEAN DEFAULT true,
  email_on_feedback BOOLEAN DEFAULT true,
  email_on_deadline BOOLEAN DEFAULT true,
  email_digest_frequency TEXT DEFAULT 'daily' CHECK (email_digest_frequency IN ('instant', 'daily', 'weekly', 'never')),
  in_app_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewer ON submissions(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_priority ON submissions(priority_level);
CREATE INDEX IF NOT EXISTS idx_submissions_deadline ON submissions(response_deadline);
CREATE INDEX IF NOT EXISTS idx_submissions_rating ON submissions(internal_rating);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_number ON submissions(submission_number);

-- Manuscripts indexes
CREATE INDEX IF NOT EXISTS idx_manuscripts_user ON manuscripts(user_id);
CREATE INDEX IF NOT EXISTS idx_manuscripts_parent ON manuscripts(parent_manuscript_id);
CREATE INDEX IF NOT EXISTS idx_manuscripts_type ON manuscripts(type);
CREATE INDEX IF NOT EXISTS idx_manuscripts_genre ON manuscripts(genre);
CREATE INDEX IF NOT EXISTS idx_manuscripts_search ON manuscripts USING gin(search_vector);

-- Other tables indexes
CREATE INDEX IF NOT EXISTS idx_submission_history_submission ON submission_history(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_history_created ON submission_history(created_at);
CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission ON submission_attachments(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_attachments_manuscript ON submission_attachments(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_submission_analytics_user ON submission_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_templates_user ON submission_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_templates_public ON submission_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;

-- ============================================================================
-- 4. FULL-TEXT SEARCH FUNCTIONS
-- ============================================================================

-- Function to update manuscript search vector
CREATE OR REPLACE FUNCTION update_manuscript_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.logline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.synopsis, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.genre, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
DROP TRIGGER IF EXISTS manuscripts_search_vector_update ON manuscripts;
CREATE TRIGGER manuscripts_search_vector_update
  BEFORE INSERT OR UPDATE ON manuscripts
  FOR EACH ROW EXECUTE FUNCTION update_manuscript_search_vector();

-- ============================================================================
-- 5. ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to calculate submission analytics
CREATE OR REPLACE FUNCTION calculate_submission_analytics(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_submissions BIGINT,
  accepted_count BIGINT,
  rejected_count BIGINT,
  pending_count BIGINT,
  avg_response_days NUMERIC,
  acceptance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_submissions,
    COUNT(*) FILTER (WHERE s.status IN ('accepted', 'signed'))::BIGINT as accepted_count,
    COUNT(*) FILTER (WHERE s.status = 'rejected')::BIGINT as rejected_count,
    COUNT(*) FILTER (WHERE s.status IN ('pending', 'under_review'))::BIGINT as pending_count,
    AVG(EXTRACT(DAY FROM (s.reviewed_at - s.created_at)))::NUMERIC as avg_response_days,
    (COUNT(*) FILTER (WHERE s.status IN ('accepted', 'signed'))::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0) * 100)::NUMERIC as acceptance_rate
  FROM submissions s
  WHERE s.submitter_id = p_user_id
    AND s.created_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get submission trends
CREATE OR REPLACE FUNCTION get_submission_trends(
  p_user_id UUID,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  month TEXT,
  submission_count BIGINT,
  accepted_count BIGINT,
  rejected_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', s.created_at), 'YYYY-MM') as month,
    COUNT(*)::BIGINT as submission_count,
    COUNT(*) FILTER (WHERE s.status IN ('accepted', 'signed'))::BIGINT as accepted_count,
    COUNT(*) FILTER (WHERE s.status = 'rejected')::BIGINT as rejected_count
  FROM submissions s
  WHERE s.submitter_id = p_user_id
    AND s.created_at >= NOW() - (p_months || ' months')::INTERVAL
  GROUP BY DATE_TRUNC('month', s.created_at)
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Trigger to track submission history on status changes
CREATE OR REPLACE FUNCTION log_submission_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO submission_history (submission_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, NEW.reviewer_id, 'status_change', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_submission_status_change ON submissions;
CREATE TRIGGER track_submission_status_change
  AFTER UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION log_submission_status_change();

-- Trigger to set response deadline on submission
CREATE OR REPLACE FUNCTION set_submission_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    NEW.response_deadline := NEW.created_at + INTERVAL '42 days'; -- 6 weeks
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_submission_deadline_trigger ON submissions;
CREATE TRIGGER set_submission_deadline_trigger
  BEFORE INSERT ON submissions
  FOR EACH ROW EXECUTE FUNCTION set_submission_deadline();

-- Trigger to create notification on status change
CREATE OR REPLACE FUNCTION create_status_change_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.submitter_id,
      'status_change',
      'Submission Status Updated',
      'Your submission status changed to: ' || NEW.status,
      '/submissions',
      jsonb_build_object('submission_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_status_notification ON submissions;
CREATE TRIGGER create_status_notification
  AFTER UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION create_status_change_notification();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE submission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Submission templates policies
CREATE POLICY "Users can view their own templates and public templates"
  ON submission_templates FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create their own templates"
  ON submission_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON submission_templates FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON submission_templates FOR DELETE
  USING (user_id = auth.uid());

-- Submission history policies
CREATE POLICY "Users can view history of their submissions"
  ON submission_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_history.submission_id
      AND s.submitter_id = auth.uid()
    )
  );

-- Submission attachments policies
CREATE POLICY "Users can view attachments of their submissions"
  ON submission_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_attachments.submission_id
      AND s.submitter_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attachments for their submissions"
  ON submission_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_attachments.submission_id
      AND s.submitter_id = auth.uid()
    )
  );

-- Submission analytics policies
CREATE POLICY "Users can view their own analytics"
  ON submission_analytics FOR SELECT
  USING (user_id = auth.uid());

-- Notification preferences policies
CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- 8. DEFAULT DATA
-- ============================================================================

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np WHERE np.user_id = users.id
);

-- Create public submission templates
INSERT INTO submission_templates (user_id, name, type, genre, is_public, template_data) VALUES
(
  (SELECT id FROM users LIMIT 1), -- Use first admin user
  'Feature Screenplay - Thriller',
  'screenplay',
  'Thriller',
  true,
  '{"title": "UNTITLED THRILLER", "logline": "When [PROTAGONIST] discovers [INCITING INCIDENT], they must [GOAL] before [STAKES].", "synopsis": "Act I:\n[Setup and normal world]\n\nAct II:\n[Rising action and complications]\n\nAct III:\n[Climax and resolution]", "targetAudience": "Adults 18-54", "comparableWorks": "THE BOURNE IDENTITY meets JOHN WICK"}'::jsonb
),
(
  (SELECT id FROM users LIMIT 1),
  'TV Pilot - Drama',
  'tv_pilot',
  'Drama',
  true,
  '{"title": "UNTITLED PILOT", "logline": "In a world where [SETTING], [PROTAGONIST] must navigate [CENTRAL CONFLICT].", "synopsis": "Series Premise:\n[Overall concept and world]\n\nPilot Episode:\n[Episode story arc]\n\nSeries Potential:\n[Future episodes and seasons]", "targetAudience": "Adults 25-54", "comparableWorks": "BREAKING BAD meets THE SOPRANOS"}'::jsonb
),
(
  (SELECT id FROM users LIMIT 1),
  'Novel - Fiction',
  'book',
  'Literary Fiction',
  true,
  '{"title": "UNTITLED NOVEL", "logline": "A [CHARACTER DESCRIPTION] discovers [INCITING INCIDENT] and embarks on [JOURNEY].", "synopsis": "Part One:\n[Beginning and setup]\n\nPart Two:\n[Middle and development]\n\nPart Three:\n[Climax and resolution]", "targetAudience": "Adult Fiction Readers", "comparableWorks": "THE GOLDFINCH meets NEVER LET ME GO", "queryLetter": "Dear Agent,\n\nI am seeking representation for my [WORD COUNT]-word [GENRE] novel, [TITLE].\n\n[Hook paragraph]\n\n[Story paragraph]\n\n[About the author]\n\nThank you for your consideration."}'::jsonb
);

-- ============================================================================
-- 9. MATERIALIZED VIEWS
-- ============================================================================

-- Materialized view for submission statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS submission_stats AS
SELECT
  s.submitter_id as user_id,
  COUNT(*) as total_submissions,
  COUNT(*) FILTER (WHERE s.status IN ('accepted', 'signed')) as accepted_count,
  COUNT(*) FILTER (WHERE s.status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE s.status IN ('pending', 'under_review')) as pending_count,
  AVG(EXTRACT(DAY FROM (s.reviewed_at - s.created_at))) as avg_response_days,
  (COUNT(*) FILTER (WHERE s.status IN ('accepted', 'signed'))::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0) * 100) as acceptance_rate,
  MAX(s.created_at) as last_submission_date
FROM submissions s
GROUP BY s.submitter_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_submission_stats_user ON submission_stats(user_id);

-- Function to refresh stats
CREATE OR REPLACE FUNCTION refresh_submission_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY submission_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Update search vectors for existing manuscripts
UPDATE manuscripts SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(logline, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(synopsis, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(genre, '')), 'D')
WHERE search_vector IS NULL;

-- Refresh materialized view
SELECT refresh_submission_stats();
