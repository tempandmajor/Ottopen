-- Migration: Stateful AI Conversations & Memory Store
-- Date: October 7, 2025
-- Purpose: Enable OpenAI Responses API, Claude Memory Tool, and context tracking

-- Table: ai_conversations
-- Tracks conversation IDs per script/user/provider for stateful AI
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'claude', 'deepseek', 'gemini')),
  conversation_id TEXT NOT NULL, -- Provider-specific conversation/session ID
  context_type TEXT CHECK (context_type IN ('character', 'plot', 'research', 'general', 'brainstorm')),

  -- Metadata
  total_tokens INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- JSON metadata for provider-specific data
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Ensure one conversation per script/provider/type combination
  UNIQUE(script_id, provider, context_type)
);

-- Table: ai_memory_store
-- Store persistent memory for Claude Memory Tool and context tracking
CREATE TABLE IF NOT EXISTS ai_memory_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,

  -- Memory classification
  memory_type TEXT NOT NULL CHECK (memory_type IN ('character', 'plot', 'world', 'research', 'style', 'fact')),

  -- Memory content
  content TEXT NOT NULL,
  summary TEXT, -- Optional short summary for quick reference

  -- Semantic search (optional - for future enhancement)
  -- embedding VECTOR(1536), -- Uncomment if using pgvector

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_at TIMESTAMPTZ DEFAULT NOW(), -- Track last access for cleanup

  -- TTL and cleanup
  expires_at TIMESTAMPTZ, -- Optional expiration

  -- JSON metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table: ai_cache_stats
-- Track caching performance for monitoring and optimization
CREATE TABLE IF NOT EXISTS ai_cache_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,

  -- Cache metrics
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  tokens_cached INTEGER DEFAULT 0,
  tokens_saved INTEGER DEFAULT 0,
  cost_saved_usd DECIMAL(10, 4) DEFAULT 0.00,

  -- Performance metrics
  avg_latency_ms INTEGER,
  requests_count INTEGER DEFAULT 0,

  -- Time window
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One row per script/user/provider/date
  UNIQUE(script_id, user_id, provider, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_script ON ai_conversations(script_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_provider ON ai_conversations(provider);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON ai_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_memory_conversation ON ai_memory_store(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_type ON ai_memory_store(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_memory_accessed ON ai_memory_store(accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cache_stats_script ON ai_cache_stats(script_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_stats_date ON ai_cache_stats(date DESC);

-- Row Level Security (RLS)
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own conversations
CREATE POLICY "Users can view their own AI conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies: Memory store (via conversation ownership)
CREATE POLICY "Users can view memory for their conversations"
  ON ai_memory_store FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_memory_store.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert memory for their conversations"
  ON ai_memory_store FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_memory_store.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update memory for their conversations"
  ON ai_memory_store FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_memory_store.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete memory for their conversations"
  ON ai_memory_store FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_memory_store.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- RLS Policies: Cache stats
CREATE POLICY "Users can view their own cache stats"
  ON ai_cache_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cache stats"
  ON ai_cache_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cache stats"
  ON ai_cache_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_ai_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_ai_conversations_timestamp
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversation_timestamp();

CREATE TRIGGER update_ai_memory_store_timestamp
  BEFORE UPDATE ON ai_memory_store
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_memory_timestamp();

-- Function: Cleanup old memories (run periodically via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_ai_memories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired memories
  WITH deleted AS (
    DELETE FROM ai_memory_store
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get conversation or create if not exists
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_script_id UUID,
  p_user_id UUID,
  p_provider TEXT,
  p_context_type TEXT DEFAULT 'general'
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_provider_conversation_id TEXT;
BEGIN
  -- Try to find existing conversation
  SELECT id, conversation_id INTO v_conversation_id, v_provider_conversation_id
  FROM ai_conversations
  WHERE script_id = p_script_id
    AND user_id = p_user_id
    AND provider = p_provider
    AND context_type = p_context_type;

  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    -- Generate provider-specific conversation ID
    v_provider_conversation_id := p_provider || '-' || p_script_id::TEXT || '-' || p_context_type || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;

    INSERT INTO ai_conversations (
      script_id,
      user_id,
      provider,
      conversation_id,
      context_type
    ) VALUES (
      p_script_id,
      p_user_id,
      p_provider,
      v_provider_conversation_id,
      p_context_type
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE ai_conversations IS 'Tracks stateful AI conversations per script/user/provider for OpenAI Responses API, Claude Memory Tool, etc.';
COMMENT ON TABLE ai_memory_store IS 'Persistent memory storage for Claude Memory Tool and cross-session context';
COMMENT ON TABLE ai_cache_stats IS 'Performance metrics for AI caching (DeepSeek, Gemini, OpenAI)';

COMMENT ON COLUMN ai_conversations.conversation_id IS 'Provider-specific conversation/session ID (e.g., OpenAI Responses API conversation_id)';
COMMENT ON COLUMN ai_conversations.context_type IS 'Type of conversation context (character, plot, research, etc.)';
COMMENT ON COLUMN ai_memory_store.memory_type IS 'Classification of memory (character, plot, world, research, style, fact)';
COMMENT ON COLUMN ai_cache_stats.tokens_saved IS 'Total tokens saved through caching (cost calculation)';
