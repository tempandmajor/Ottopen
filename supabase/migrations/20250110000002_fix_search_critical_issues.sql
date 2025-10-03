-- Fix critical search issues
-- Migration: Create user_public_profiles view and add search indexes

-- 1. Create user_public_profiles view that searchUsers() expects
CREATE OR REPLACE VIEW user_public_profiles AS
SELECT
  id,
  display_name,
  username,
  bio,
  specialty,
  avatar_url,
  location,
  website_url,
  twitter_handle,
  linkedin_url,
  account_type,
  account_tier,
  verification_status,
  created_at,
  updated_at
FROM users;

-- Grant access to the view
GRANT SELECT ON user_public_profiles TO authenticated, anon;

-- 2. Add indexes for better search performance
-- Enable pg_trgm extension for similarity/fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes for faster ILIKE searches
CREATE INDEX IF NOT EXISTS idx_users_display_name_trgm
ON users USING GIN (display_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_username_trgm
ON users USING GIN (username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_bio_trgm
ON users USING GIN (bio gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_posts_title_trgm
ON posts USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_posts_content_trgm
ON posts USING GIN (content gin_trgm_ops);

-- 3. Add composite search index for users
CREATE INDEX IF NOT EXISTS idx_users_search_composite
ON users USING GIN (
  (COALESCE(display_name, '') || ' ' || COALESCE(username, '') || ' ' || COALESCE(bio, '')) gin_trgm_ops
);

-- 4. Add composite search index for posts
CREATE INDEX IF NOT EXISTS idx_posts_search_composite
ON posts USING GIN (
  (COALESCE(title, '') || ' ' || COALESCE(content, '')) gin_trgm_ops
);

-- 5. Add search analytics table for tracking searches
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_result_id UUID,
  clicked_result_type TEXT CHECK (clicked_result_type IN ('author', 'work', 'post')),
  searched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for search analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_searched_at ON search_analytics(searched_at DESC);

-- Enable RLS on search_analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for search_analytics
CREATE POLICY "Users can create own search analytics" ON search_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own search analytics" ON search_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all search analytics" ON search_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE)
  );
