-- Version Control & Revision Tracking Migration
-- Enables tracking changes, versions, and collaborative editing

-- Script versions table
CREATE TABLE IF NOT EXISTS script_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name VARCHAR(255),
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content_snapshot JSONB NOT NULL, -- Full script content at this version
  parent_version_id UUID REFERENCES script_versions(id),
  is_locked BOOLEAN DEFAULT false,
  UNIQUE(script_id, version_number)
);

-- Revision marks table (color-coded script changes)
CREATE TABLE IF NOT EXISTS script_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  element_id UUID NOT NULL REFERENCES script_elements(id) ON DELETE CASCADE,
  revision_color VARCHAR(20) NOT NULL, -- white, blue, pink, yellow, green, goldenrod, buff, salmon, cherry
  revision_date DATE NOT NULL,
  revision_description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Change log for audit trail
CREATE TABLE IF NOT EXISTS script_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version_id UUID REFERENCES script_versions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  change_type VARCHAR(50) NOT NULL, -- insert, update, delete, reorder
  element_type VARCHAR(50),
  element_id UUID,
  before_content TEXT,
  after_content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaborative editing sessions
CREATE TABLE IF NOT EXISTS editing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cursor_position INTEGER,
  current_element_id UUID REFERENCES script_elements(id),
  is_active BOOLEAN DEFAULT true
);

-- Comments and notes on script elements
CREATE TABLE IF NOT EXISTS script_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  element_id UUID REFERENCES script_elements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment_text TEXT NOT NULL,
  comment_type VARCHAR(50) DEFAULT 'general', -- general, suggestion, question, note
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE script_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE editing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for version control
CREATE POLICY "Users can view versions of their scripts" ON script_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_versions.script_id AND scripts.user_id = auth.uid())
);

CREATE POLICY "Users can create versions of their scripts" ON script_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_versions.script_id AND scripts.user_id = auth.uid())
);

CREATE POLICY "Users can view revisions of their scripts" ON script_revisions FOR SELECT USING (
  EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_revisions.script_id AND scripts.user_id = auth.uid())
);

CREATE POLICY "Users can manage revisions of their scripts" ON script_revisions FOR ALL USING (
  EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_revisions.script_id AND scripts.user_id = auth.uid())
);

CREATE POLICY "Users can view change logs of their scripts" ON script_change_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_change_log.script_id AND scripts.user_id = auth.uid())
);

CREATE POLICY "Users can create change logs for their scripts" ON script_change_log FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_change_log.script_id AND scripts.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own editing sessions" ON editing_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view editing sessions on their scripts" ON editing_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM scripts WHERE scripts.id = editing_sessions.script_id AND scripts.user_id = auth.uid())
);

CREATE POLICY "Users can view comments on their scripts" ON script_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_comments.script_id AND scripts.user_id = auth.uid())
);

CREATE POLICY "Users can create comments on their scripts" ON script_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_comments.script_id AND scripts.user_id = auth.uid())
);

CREATE POLICY "Users can update their own comments" ON script_comments FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_script_versions_script ON script_versions(script_id);
CREATE INDEX IF NOT EXISTS idx_script_revisions_script ON script_revisions(script_id);
CREATE INDEX IF NOT EXISTS idx_script_revisions_element ON script_revisions(element_id);
CREATE INDEX IF NOT EXISTS idx_change_log_script ON script_change_log(script_id);
CREATE INDEX IF NOT EXISTS idx_editing_sessions_script ON editing_sessions(script_id);
CREATE INDEX IF NOT EXISTS idx_editing_sessions_active ON editing_sessions(script_id, is_active);
CREATE INDEX IF NOT EXISTS idx_script_comments_script ON script_comments(script_id);
CREATE INDEX IF NOT EXISTS idx_script_comments_element ON script_comments(element_id);

-- Function to auto-create version on significant changes
CREATE OR REPLACE FUNCTION auto_create_version()
RETURNS TRIGGER AS $$
DECLARE
  last_version INTEGER;
BEGIN
  -- Get the last version number
  SELECT COALESCE(MAX(version_number), 0) INTO last_version
  FROM script_versions
  WHERE script_id = NEW.script_id;

  -- Create new version if this is a major change
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.content IS DISTINCT FROM NEW.content)) THEN
    INSERT INTO script_versions (script_id, version_number, version_name, created_by, content_snapshot)
    SELECT 
      NEW.script_id,
      last_version + 1,
      'Auto-saved version',
      auth.uid(),
      jsonb_build_object(
        'script_id', NEW.script_id,
        'timestamp', NOW(),
        'trigger', TG_OP
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-versioning (optional - can be enabled per script)
-- CREATE TRIGGER auto_version_script_elements
-- AFTER UPDATE OR DELETE ON script_elements
-- FOR EACH ROW EXECUTE FUNCTION auto_create_version();
