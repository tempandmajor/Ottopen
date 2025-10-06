-- Search Enhancement Features Migration
-- Adds: full-text search, saved searches, search analytics, trending searches

-- ============================================================================
-- ENABLE EXTENSIONS FOR FULL-TEXT SEARCH
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Trigram similarity for fuzzy matching
CREATE EXTENSION IF NOT EXISTS unaccent; -- Accent insensitivity

-- ============================================================================
-- ADD SEARCH VECTORS FOR FULL-TEXT SEARCH
-- ============================================================================

-- Add search vector columns to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for fast full-text search on posts
CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN(search_vector);

-- Create index for trigram similarity search on posts
CREATE INDEX IF NOT EXISTS posts_title_trgm_idx ON posts USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS posts_content_trgm_idx ON posts USING GIN(content gin_trgm_ops);

-- Add search vector columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for fast full-text search on users
CREATE INDEX IF NOT EXISTS users_search_idx ON users USING GIN(search_vector);

-- Create index for trigram similarity search on users
CREATE INDEX IF NOT EXISTS users_name_trgm_idx ON users USING GIN(display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_username_trgm_idx ON users USING GIN(username gin_trgm_ops);

-- ============================================================================
-- FUNCTIONS TO UPDATE SEARCH VECTORS
-- ============================================================================

-- Function to update posts search vector
CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.excerpt, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.genre, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for posts search vector
DROP TRIGGER IF EXISTS update_posts_search_vector_trigger ON posts;
CREATE TRIGGER update_posts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_search_vector();

-- Function to update users search vector
CREATE OR REPLACE FUNCTION update_users_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.username, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.specialty, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users search vector
DROP TRIGGER IF EXISTS update_users_search_vector_trigger ON users;
CREATE TRIGGER update_users_search_vector_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_search_vector();

-- Backfill search vectors for existing posts
UPDATE posts SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(genre, '')), 'D')
WHERE search_vector IS NULL;

-- Backfill search vectors for existing users
UPDATE users SET search_vector =
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(username, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(bio, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(specialty, '')), 'D')
WHERE search_vector IS NULL;

-- ============================================================================
-- SAVED SEARCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB,
  notify_new_results BOOLEAN DEFAULT false,
  last_result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);

-- ============================================================================
-- SEARCH ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  results_count INTEGER,
  clicked_result_id UUID,
  clicked_result_type TEXT,
  session_id UUID,
  search_duration_ms INTEGER,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_session ON search_analytics(session_id);

-- ============================================================================
-- SEARCH SUGGESTIONS CACHE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_suggestions (
  prefix TEXT PRIMARY KEY,
  suggestions JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_suggestions_updated ON search_suggestions(updated_at DESC);

-- ============================================================================
-- TRENDING SEARCHES MATERIALIZED VIEW
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_searches AS
SELECT
  query,
  COUNT(*) as search_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(results_count) as avg_results,
  MAX(created_at) as last_searched
FROM search_analytics
WHERE created_at > NOW() - INTERVAL '7 days'
  AND query IS NOT NULL
  AND LENGTH(query) >= 2
GROUP BY query
HAVING COUNT(*) >= 3
ORDER BY search_count DESC
LIMIT 20;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_searches_query ON trending_searches(query);

-- ============================================================================
-- SEARCH FUNCTIONS
-- ============================================================================

-- Function to search posts with full-text search
CREATE OR REPLACE FUNCTION search_posts_fulltext(
  search_query TEXT,
  search_limit INTEGER DEFAULT 20,
  search_offset INTEGER DEFAULT 0,
  filter_genre TEXT DEFAULT NULL,
  filter_content_type TEXT DEFAULT NULL,
  filter_published BOOLEAN DEFAULT NULL,
  min_reading_time INTEGER DEFAULT NULL,
  max_reading_time INTEGER DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance'
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  genre TEXT,
  content_type TEXT,
  published BOOLEAN,
  reading_time_minutes INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  reshares_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  relevance_rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.title,
    p.content,
    p.excerpt,
    p.genre,
    p.content_type,
    p.published,
    p.reading_time_minutes,
    p.likes_count,
    p.comments_count,
    p.reshares_count,
    p.created_at,
    ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as relevance_rank
  FROM posts p
  WHERE
    p.search_vector @@ plainto_tsquery('english', search_query)
    AND (filter_genre IS NULL OR p.genre = filter_genre)
    AND (filter_content_type IS NULL OR p.content_type = filter_content_type)
    AND (filter_published IS NULL OR p.published = filter_published)
    AND (min_reading_time IS NULL OR p.reading_time_minutes >= min_reading_time)
    AND (max_reading_time IS NULL OR p.reading_time_minutes <= max_reading_time)
  ORDER BY
    CASE
      WHEN sort_by = 'relevance' THEN ts_rank(p.search_vector, plainto_tsquery('english', search_query))
      ELSE 0
    END DESC,
    CASE WHEN sort_by = 'recent' THEN p.created_at END DESC,
    CASE
      WHEN sort_by = 'popular' THEN (p.likes_count + p.comments_count * 2 + p.reshares_count * 3)
      ELSE 0
    END DESC,
    CASE WHEN sort_by = 'alphabetical' THEN p.title END ASC
  LIMIT search_limit
  OFFSET search_offset;
END;
$$;

-- Function to search users with full-text search
CREATE OR REPLACE FUNCTION search_users_fulltext(
  search_query TEXT,
  search_limit INTEGER DEFAULT 20,
  search_offset INTEGER DEFAULT 0,
  filter_account_type TEXT DEFAULT NULL,
  filter_verified BOOLEAN DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance'
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  display_name TEXT,
  username TEXT,
  bio TEXT,
  specialty TEXT,
  avatar_url TEXT,
  account_type TEXT,
  verification_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  relevance_rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.display_name,
    u.username,
    u.bio,
    u.specialty,
    u.avatar_url,
    u.account_type,
    u.verification_status,
    u.created_at,
    ts_rank(u.search_vector, plainto_tsquery('english', search_query)) as relevance_rank
  FROM users u
  WHERE
    u.search_vector @@ plainto_tsquery('english', search_query)
    AND (filter_account_type IS NULL OR u.account_type = filter_account_type)
    AND (filter_verified IS NULL OR (filter_verified = true AND u.verification_status = 'verified'))
  ORDER BY
    CASE
      WHEN sort_by = 'relevance' THEN ts_rank(u.search_vector, plainto_tsquery('english', search_query))
      ELSE 0
    END DESC,
    CASE WHEN sort_by = 'recent' THEN u.created_at END DESC,
    CASE WHEN sort_by = 'alphabetical' THEN u.display_name END ASC
  LIMIT search_limit
  OFFSET search_offset;
END;
$$;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_prefix TEXT,
  suggestion_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  suggestion_text TEXT,
  suggestion_type TEXT,
  search_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Get popular searches that match prefix
  SELECT
    sa.query as suggestion_text,
    'popular'::TEXT as suggestion_type,
    COUNT(*)::INTEGER as search_count
  FROM search_analytics sa
  WHERE
    sa.query ILIKE search_prefix || '%'
    AND sa.created_at > NOW() - INTERVAL '30 days'
  GROUP BY sa.query
  ORDER BY COUNT(*) DESC
  LIMIT suggestion_limit;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Saved Searches RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved searches" ON saved_searches;
CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create saved searches" ON saved_searches;
CREATE POLICY "Users can create saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved searches" ON saved_searches;
CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved searches" ON saved_searches;
CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Search Analytics RLS (read-only for users, write for all)
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create search analytics" ON search_analytics;
CREATE POLICY "Anyone can create search analytics"
  ON search_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own search analytics" ON search_analytics;
CREATE POLICY "Users can view own search analytics"
  ON search_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Search Suggestions (public read, system write)
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view search suggestions" ON search_suggestions;
CREATE POLICY "Anyone can view search suggestions"
  ON search_suggestions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON saved_searches TO authenticated;
GRANT SELECT, INSERT ON search_analytics TO authenticated;
GRANT SELECT ON search_suggestions TO authenticated;
GRANT SELECT ON trending_searches TO authenticated;

-- ============================================================================
-- FUNCTIONS TO REFRESH MATERIALIZED VIEWS
-- ============================================================================

-- Function to refresh trending searches
CREATE OR REPLACE FUNCTION refresh_trending_searches()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_searches;
END;
$$;
