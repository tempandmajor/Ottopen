-- =============================================
-- Messaging System - Phase 3 Advanced Features
-- =============================================
-- Features: Group conversations, message search, voice messages, typing indicators
-- Created: 2025-02-06

-- =============================================
-- 1. GROUP CONVERSATIONS
-- =============================================

-- Add group conversation support
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS group_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_description TEXT;

-- Conversation participants (for group chats)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  muted_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_active ON conversation_participants(conversation_id, is_active) WHERE is_active = true;

-- =============================================
-- 2. FULL-TEXT MESSAGE SEARCH
-- =============================================

-- Add full-text search to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create full-text search index
CREATE INDEX idx_messages_search_vector ON messages USING gin(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector
DROP TRIGGER IF EXISTS trigger_update_message_search_vector ON messages;
CREATE TRIGGER trigger_update_message_search_vector
  BEFORE INSERT OR UPDATE OF content ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_search_vector();

-- Update existing messages with search vectors
UPDATE messages SET search_vector = to_tsvector('english', COALESCE(content, ''))
WHERE search_vector IS NULL;

-- Search function
CREATE OR REPLACE FUNCTION search_messages(
  search_query TEXT,
  user_id_param UUID,
  limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.created_at,
    ts_rank(m.search_vector, to_tsquery('english', search_query)) AS rank
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE
    (c.user1_id = user_id_param OR c.user2_id = user_id_param
     OR EXISTS (
       SELECT 1 FROM conversation_participants cp
       WHERE cp.conversation_id = c.id
       AND cp.user_id = user_id_param
       AND cp.is_active = true
     ))
    AND m.search_vector @@ to_tsquery('english', search_query)
    AND m.deleted_at IS NULL
  ORDER BY rank DESC, m.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. VOICE MESSAGES
-- =============================================

-- Voice message metadata table
CREATE TABLE IF NOT EXISTS voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE UNIQUE,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  waveform_data JSONB, -- Waveform visualization data
  transcript TEXT, -- AI-generated transcript
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_messages_message_id ON voice_messages(message_id);

-- Add voice message type to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text'; -- 'text', 'voice', 'system'

-- =============================================
-- 4. TYPING INDICATORS
-- =============================================

-- Typing indicators (ephemeral, can also use Supabase realtime presence)
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);

-- Function to clean up old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. MESSAGE PINNING
-- =============================================

-- Pinned messages in conversations
CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(conversation_id, message_id)
);

CREATE INDEX idx_pinned_messages_conversation_id ON pinned_messages(conversation_id);
CREATE INDEX idx_pinned_messages_message_id ON pinned_messages(message_id);

-- =============================================
-- 6. MESSAGE FORWARDING
-- =============================================

-- Track forwarded messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS forwarded_from_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forwarded_from_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

CREATE INDEX idx_messages_forwarded_from ON messages(forwarded_from_message_id) WHERE forwarded_from_message_id IS NOT NULL;

-- =============================================
-- 7. READ RECEIPTS (Enhanced)
-- =============================================

-- Enhanced read receipts for group conversations
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX idx_message_read_receipts_user_id ON message_read_receipts(user_id);

-- =============================================
-- 8. RLS POLICIES
-- =============================================

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Conversation Participants Policies
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

CREATE POLICY "Admins can add participants to group conversations"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN conversations c ON cp.conversation_id = c.id
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.role IN ('admin', 'moderator')
      AND c.is_group = true
    )
  );

CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Voice Messages Policies
CREATE POLICY "Users can view voice messages in their conversations"
  ON voice_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = voice_messages.message_id
      AND (
        c.user1_id = auth.uid() OR c.user2_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.user_id = auth.uid()
          AND cp.is_active = true
        )
      )
    )
  );

CREATE POLICY "Users can create voice messages"
  ON voice_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id
      AND m.sender_id = auth.uid()
    )
  );

-- Typing Indicators Policies
CREATE POLICY "Users can view typing indicators in their conversations"
  ON typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = typing_indicators.conversation_id
      AND (
        c.user1_id = auth.uid() OR c.user2_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.user_id = auth.uid()
          AND cp.is_active = true
        )
      )
    )
  );

CREATE POLICY "Users can set their own typing indicators"
  ON typing_indicators FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pinned Messages Policies
CREATE POLICY "Users can view pinned messages in their conversations"
  ON pinned_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = pinned_messages.conversation_id
      AND (
        c.user1_id = auth.uid() OR c.user2_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.user_id = auth.uid()
          AND cp.is_active = true
        )
      )
    )
  );

CREATE POLICY "Admins can pin/unpin messages"
  ON pinned_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = pinned_messages.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    pinned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = pinned_messages.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.role IN ('admin', 'moderator')
    )
  );

-- Read Receipts Policies
CREATE POLICY "Users can view read receipts in their conversations"
  ON message_read_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_read_receipts.message_id
      AND (
        c.user1_id = auth.uid() OR c.user2_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.user_id = auth.uid()
          AND cp.is_active = true
        )
      )
    )
  );

CREATE POLICY "Users can create their own read receipts"
  ON message_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- 9. HELPER FUNCTIONS
-- =============================================

-- Get user's group conversations
CREATE OR REPLACE FUNCTION get_user_group_conversations(user_id_param UUID)
RETURNS TABLE (
  conversation_id UUID,
  group_name VARCHAR(255),
  group_avatar_url TEXT,
  group_description TEXT,
  participant_count BIGINT,
  unread_count BIGINT,
  last_message_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as conversation_id,
    c.group_name,
    c.group_avatar_url,
    c.group_description,
    COUNT(DISTINCT cp.user_id) as participant_count,
    COUNT(m.id) FILTER (WHERE m.sender_id != user_id_param AND m.read = false) as unread_count,
    MAX(m.created_at) as last_message_at
  FROM conversations c
  JOIN conversation_participants cp ON c.id = cp.conversation_id
  LEFT JOIN messages m ON c.id = m.conversation_id
  WHERE c.is_group = true
    AND EXISTS (
      SELECT 1 FROM conversation_participants my_cp
      WHERE my_cp.conversation_id = c.id
      AND my_cp.user_id = user_id_param
      AND my_cp.is_active = true
    )
  GROUP BY c.id, c.group_name, c.group_avatar_url, c.group_description
  ORDER BY last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMENT ON TABLE conversation_participants IS 'Phase 3: Group conversation participants';
COMMENT ON TABLE voice_messages IS 'Phase 3: Voice message metadata';
COMMENT ON TABLE typing_indicators IS 'Phase 3: Real-time typing indicators';
COMMENT ON TABLE pinned_messages IS 'Phase 3: Pinned messages in conversations';
COMMENT ON FUNCTION search_messages IS 'Phase 3: Full-text search across messages';
