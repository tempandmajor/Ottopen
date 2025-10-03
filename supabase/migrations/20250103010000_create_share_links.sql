-- Create script_share_links table for shareable collaboration links
CREATE TABLE IF NOT EXISTS script_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'comment')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0
);

-- Create index on token for fast lookups
CREATE INDEX idx_share_links_token ON script_share_links(token);
CREATE INDEX idx_share_links_script_id ON script_share_links(script_id);

-- Enable RLS
ALTER TABLE script_share_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view share links for their scripts"
  ON script_share_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_share_links.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create share links for their scripts"
  ON script_share_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_share_links.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete share links for their scripts"
  ON script_share_links
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_share_links.script_id
      AND scripts.user_id = auth.uid()
    )
  );

-- Create table for tracking realtime presence
CREATE TABLE IF NOT EXISTS script_presence (
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  color TEXT NOT NULL,
  cursor_element_id TEXT,
  cursor_position INTEGER,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (script_id, user_id)
);

-- Create index for fast presence lookups
CREATE INDEX idx_presence_script_id ON script_presence(script_id);
CREATE INDEX idx_presence_last_active ON script_presence(last_active);

-- Enable RLS
ALTER TABLE script_presence ENABLE ROW LEVEL SECURITY;

-- Policies - anyone with access to the script can see presence
CREATE POLICY "Users can view presence for scripts they can access"
  ON script_presence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_presence.script_id
      AND (
        scripts.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM script_collaborators
          WHERE script_collaborators.script_id = scripts.id
          AND script_collaborators.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own presence"
  ON script_presence
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to clean up stale presence (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM script_presence
  WHERE last_active < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Create a scheduled job to clean up stale presence every minute
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('cleanup-stale-presence', '* * * * *', 'SELECT cleanup_stale_presence()');
