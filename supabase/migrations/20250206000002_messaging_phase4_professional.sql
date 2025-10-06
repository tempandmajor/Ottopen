-- =============================================
-- Messaging System - Phase 4 Professional Features
-- =============================================
-- Features: WebRTC signaling, message scheduling, E2E encryption metadata
-- Created: 2025-02-06

-- =============================================
-- 1. WEBRTC SIGNALING
-- =============================================

-- WebRTC call sessions
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_type VARCHAR(20) NOT NULL, -- 'audio', 'video', 'screen_share'
  status VARCHAR(20) DEFAULT 'ringing', -- 'ringing', 'active', 'ended', 'missed', 'rejected'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- in seconds
  metadata JSONB -- Additional call metadata
);

CREATE INDEX idx_call_sessions_conversation_id ON call_sessions(conversation_id);
CREATE INDEX idx_call_sessions_initiator_id ON call_sessions(initiator_id);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);

-- Call participants
CREATE TABLE IF NOT EXISTS call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'invited', -- 'invited', 'joined', 'left', 'rejected'

  UNIQUE(call_session_id, user_id)
);

CREATE INDEX idx_call_participants_session_id ON call_participants(call_session_id);
CREATE INDEX idx_call_participants_user_id ON call_participants(user_id);

-- WebRTC signaling messages (ICE candidates, SDP offers/answers)
CREATE TABLE IF NOT EXISTS webrtc_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for broadcast
  signal_type VARCHAR(50) NOT NULL, -- 'offer', 'answer', 'ice-candidate', 'renegotiate'
  signal_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed BOOLEAN DEFAULT false
);

CREATE INDEX idx_webrtc_signals_session_id ON webrtc_signals(call_session_id);
CREATE INDEX idx_webrtc_signals_receiver_id ON webrtc_signals(receiver_id) WHERE receiver_id IS NOT NULL;
CREATE INDEX idx_webrtc_signals_unprocessed ON webrtc_signals(call_session_id, receiver_id) WHERE processed = false;

-- Function to cleanup old WebRTC signals (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_webrtc_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM webrtc_signals
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. MESSAGE SCHEDULING
-- =============================================

-- Scheduled messages
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'cancelled', 'failed'
  sent_at TIMESTAMPTZ,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_messages_sender_id ON scheduled_messages(sender_id);
CREATE INDEX idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for);
CREATE INDEX idx_scheduled_messages_status ON scheduled_messages(status) WHERE status = 'pending';

-- Function to process scheduled messages (called by cron job or Edge Function)
CREATE OR REPLACE FUNCTION process_scheduled_messages()
RETURNS TABLE (
  scheduled_message_id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE scheduled_messages
  SET status = 'processing'
  WHERE status = 'pending'
    AND scheduled_for <= NOW()
  RETURNING id, scheduled_messages.conversation_id, scheduled_messages.sender_id, scheduled_messages.content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. END-TO-END ENCRYPTION METADATA
-- =============================================

-- Encryption keys (stores metadata, NOT actual keys)
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  key_fingerprint VARCHAR(255) UNIQUE NOT NULL,
  device_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_encryption_keys_user_id ON encryption_keys(user_id);
CREATE INDEX idx_encryption_keys_fingerprint ON encryption_keys(key_fingerprint);
CREATE INDEX idx_encryption_keys_active ON encryption_keys(user_id) WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());

-- Encrypted message metadata (actual encryption happens client-side)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS encryption_key_id UUID REFERENCES encryption_keys(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS encrypted_for_user_ids UUID[]; -- Array of user IDs who can decrypt

CREATE INDEX idx_messages_encrypted ON messages(is_encrypted) WHERE is_encrypted = true;

-- =============================================
-- 4. MESSAGE DELIVERY STATUS
-- =============================================

-- Message delivery tracking
CREATE TABLE IF NOT EXISTS message_delivery_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_delivery_status_message_id ON message_delivery_status(message_id);
CREATE INDEX idx_message_delivery_status_user_id ON message_delivery_status(user_id);

-- =============================================
-- 5. MESSAGE TEMPLATES
-- =============================================

-- Quick reply templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50), -- 'greeting', 'meeting', 'follow_up', 'custom'
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX idx_message_templates_category ON message_templates(category);

-- =============================================
-- 6. CONVERSATION SETTINGS
-- =============================================

-- Per-conversation settings
CREATE TABLE IF NOT EXISTS conversation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,
  notification_sound VARCHAR(50) DEFAULT 'default',
  auto_delete_after INTEGER, -- in hours
  custom_nickname VARCHAR(255),
  custom_wallpaper_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_settings_conversation_id ON conversation_settings(conversation_id);
CREATE INDEX idx_conversation_settings_user_id ON conversation_settings(user_id);

-- =============================================
-- 7. MESSAGE MENTIONS
-- =============================================

-- User mentions in messages (for group chats)
CREATE TABLE IF NOT EXISTS message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(message_id, mentioned_user_id)
);

CREATE INDEX idx_message_mentions_message_id ON message_mentions(message_id);
CREATE INDEX idx_message_mentions_user_id ON message_mentions(mentioned_user_id);

-- =============================================
-- 8. AUTO-DELETE MESSAGES
-- =============================================

-- Add auto-delete timestamp to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMPTZ;

CREATE INDEX idx_messages_auto_delete ON messages(auto_delete_at) WHERE auto_delete_at IS NOT NULL;

-- Function to delete expired messages (called by cron)
CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages
  WHERE auto_delete_at IS NOT NULL
    AND auto_delete_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. RLS POLICIES
-- =============================================

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_delivery_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;

-- Call Sessions Policies
CREATE POLICY "Users can view call sessions in their conversations"
  ON call_sessions FOR SELECT
  USING (
    initiator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM call_participants cp
      WHERE cp.call_session_id = call_sessions.id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create call sessions"
  ON call_sessions FOR INSERT
  WITH CHECK (initiator_id = auth.uid());

CREATE POLICY "Call initiators can update sessions"
  ON call_sessions FOR UPDATE
  USING (initiator_id = auth.uid());

-- WebRTC Signals Policies
CREATE POLICY "Users can view signals for their calls"
  ON webrtc_signals FOR SELECT
  USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR (receiver_id IS NULL AND EXISTS (
      SELECT 1 FROM call_participants cp
      WHERE cp.call_session_id = webrtc_signals.call_session_id
      AND cp.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can send WebRTC signals"
  ON webrtc_signals FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received signals"
  ON webrtc_signals FOR UPDATE
  USING (receiver_id = auth.uid() OR sender_id = auth.uid());

-- Scheduled Messages Policies
CREATE POLICY "Users can view their scheduled messages"
  ON scheduled_messages FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "Users can create scheduled messages"
  ON scheduled_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their scheduled messages"
  ON scheduled_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their scheduled messages"
  ON scheduled_messages FOR DELETE
  USING (sender_id = auth.uid());

-- Encryption Keys Policies
CREATE POLICY "Users can view their own encryption keys"
  ON encryption_keys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own encryption keys"
  ON encryption_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own encryption keys"
  ON encryption_keys FOR UPDATE
  USING (user_id = auth.uid());

-- Message Templates Policies
CREATE POLICY "Users can manage their own templates"
  ON message_templates FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Conversation Settings Policies
CREATE POLICY "Users can manage their conversation settings"
  ON conversation_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Message Mentions Policies
CREATE POLICY "Users can view mentions in their conversations"
  ON message_mentions FOR SELECT
  USING (
    mentioned_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_mentions.message_id
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

CREATE POLICY "Users can create mentions in their messages"
  ON message_mentions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id
      AND m.sender_id = auth.uid()
    )
  );

-- =============================================
-- 10. HELPER FUNCTIONS
-- =============================================

-- Get active call for conversation
CREATE OR REPLACE FUNCTION get_active_call(conversation_id_param UUID)
RETURNS TABLE (
  call_id UUID,
  call_type VARCHAR(20),
  initiator_id UUID,
  started_at TIMESTAMPTZ,
  participant_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id as call_id,
    cs.call_type,
    cs.initiator_id,
    cs.started_at,
    COUNT(DISTINCT cp.user_id) as participant_count
  FROM call_sessions cs
  LEFT JOIN call_participants cp ON cs.id = cp.call_session_id
  WHERE cs.conversation_id = conversation_id_param
    AND cs.status = 'active'
  GROUP BY cs.id, cs.call_type, cs.initiator_id, cs.started_at
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMENT ON TABLE call_sessions IS 'Phase 4: WebRTC call session management';
COMMENT ON TABLE webrtc_signals IS 'Phase 4: WebRTC signaling (ICE, SDP)';
COMMENT ON TABLE scheduled_messages IS 'Phase 4: Message scheduling';
COMMENT ON TABLE encryption_keys IS 'Phase 4: E2E encryption key metadata';
COMMENT ON TABLE message_templates IS 'Phase 4: Quick reply templates';
