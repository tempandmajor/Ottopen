-- =============================================
-- Messaging System - Phase 2 Core Features
-- =============================================
-- Features: Message reactions, editing/deletion, media attachments, threading
-- Created: 2025-02-06

-- =============================================
-- 1. MESSAGE REACTIONS
-- =============================================

-- Message reactions table (emoji reactions)
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL, -- Unicode emoji
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate reactions from same user with same emoji on same message
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- =============================================
-- 2. MESSAGE EDITING & DELETION
-- =============================================

-- Add columns to messages table for editing/deletion
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Message edit history
CREATE TABLE IF NOT EXISTS message_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_edit_history_message_id ON message_edit_history(message_id);

-- =============================================
-- 3. MEDIA ATTACHMENTS
-- =============================================

-- Message media attachments
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL, -- 'image', 'video', 'audio', 'document', 'voice'
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),
  thumbnail_url TEXT, -- for images/videos
  duration INTEGER, -- for audio/video in seconds
  metadata JSONB, -- Additional file metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_file_type ON message_attachments(file_type);

-- =============================================
-- 4. MESSAGE THREADING
-- =============================================

-- Add threading columns to messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'parent_message_id') THEN
    ALTER TABLE messages ADD COLUMN parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'thread_id') THEN
    ALTER TABLE messages ADD COLUMN thread_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'reply_count') THEN
    ALTER TABLE messages ADD COLUMN reply_count INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

-- Function to update reply count
CREATE OR REPLACE FUNCTION update_message_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a reply to another message
  IF NEW.parent_message_id IS NOT NULL THEN
    -- Update the parent message reply count
    UPDATE messages
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_message_id;

    -- Set the thread_id to the parent's thread_id (or parent_id if parent is root)
    NEW.thread_id := COALESCE(
      (SELECT thread_id FROM messages WHERE id = NEW.parent_message_id),
      NEW.parent_message_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reply count when new reply is created
DROP TRIGGER IF EXISTS trigger_update_reply_count ON messages;
CREATE TRIGGER trigger_update_reply_count
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_reply_count();

-- =============================================
-- 5. MARKDOWN SUPPORT
-- =============================================

-- Add markdown support flag to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_markdown BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS formatted_content TEXT; -- Rendered HTML (sanitized)

-- =============================================
-- 6. RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Message Reactions Policies
CREATE POLICY "Users can view reactions on their messages"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_reactions.message_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions to conversation messages"
  ON message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own reactions"
  ON message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Message Edit History Policies
CREATE POLICY "Users can view edit history of their conversation messages"
  ON message_edit_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_edit_history.message_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create edit history for their messages"
  ON message_edit_history FOR INSERT
  WITH CHECK (edited_by = auth.uid());

-- Message Attachments Policies
CREATE POLICY "Users can view attachments in their conversations"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_attachments.message_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can add attachments to their messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id
      AND m.sender_id = auth.uid()
    )
  );

-- =============================================
-- 7. FUNCTIONS & VIEWS
-- =============================================

-- Get message with reactions and attachments
CREATE OR REPLACE VIEW messages_with_metadata AS
SELECT
  m.*,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', mr.id,
        'emoji', mr.emoji,
        'user_id', mr.user_id,
        'created_at', mr.created_at
      )
    ) FILTER (WHERE mr.id IS NOT NULL),
    '[]'
  ) as reactions,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ma.id,
        'file_name', ma.file_name,
        'file_url', ma.file_url,
        'file_type', ma.file_type,
        'file_size', ma.file_size,
        'mime_type', ma.mime_type,
        'thumbnail_url', ma.thumbnail_url,
        'duration', ma.duration
      )
    ) FILTER (WHERE ma.id IS NOT NULL),
    '[]'
  ) as attachments,
  (SELECT COUNT(*) FROM messages WHERE parent_message_id = m.id) as reply_count
FROM messages m
LEFT JOIN message_reactions mr ON m.id = mr.message_id
LEFT JOIN message_attachments ma ON m.id = ma.message_id
GROUP BY m.id;

-- =============================================
-- 8. STORAGE BUCKETS
-- =============================================

-- Create storage bucket for message attachments (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message attachments
CREATE POLICY "Users can upload attachments to their conversations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view attachments in their conversations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-attachments'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM message_attachments ma
        JOIN messages m ON ma.message_id = m.id
        JOIN conversations c ON m.conversation_id = c.id
        WHERE ma.file_url LIKE '%' || name || '%'
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete their own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- 9. INDEXES FOR PERFORMANCE
-- =============================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_thread_created
  ON messages(thread_id, created_at ASC)
  WHERE thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_deleted
  ON messages(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMENT ON TABLE message_reactions IS 'Phase 2: Emoji reactions to messages';
COMMENT ON TABLE message_edit_history IS 'Phase 2: Track message edit history';
COMMENT ON TABLE message_attachments IS 'Phase 2: Media attachments for messages';
COMMENT ON COLUMN messages.parent_message_id IS 'Phase 2: Message threading support';
