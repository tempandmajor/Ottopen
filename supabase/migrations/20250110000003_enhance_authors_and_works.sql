-- Enhance Authors and Works pages functionality
-- Migration: Add genre, content type, and discovery fields

-- 1. Add content categorization to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_type TEXT
  CHECK (content_type IN ('screenplay', 'stage_play', 'book', 'short_story', 'poetry', 'article', 'essay'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS completion_status TEXT DEFAULT 'complete'
  CHECK (completion_status IN ('complete', 'wip', 'hiatus'));

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_posts_genre ON posts(genre) WHERE genre IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type) WHERE content_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_completion_status ON posts(completion_status);

-- 2. Add discovery and activity fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS open_for_collaboration BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accepting_beta_readers BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_genres TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS posts_last_30_days INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_post_engagement NUMERIC DEFAULT 0;

-- Add indexes for discovery
CREATE INDEX IF NOT EXISTS idx_users_open_for_collaboration ON users(open_for_collaboration) WHERE open_for_collaboration = true;
CREATE INDEX IF NOT EXISTS idx_users_accepting_beta_readers ON users(accepting_beta_readers) WHERE accepting_beta_readers = true;
CREATE INDEX IF NOT EXISTS idx_users_posts_last_30_days ON users(posts_last_30_days DESC);

-- 3. Create function to calculate trending score for posts
CREATE OR REPLACE FUNCTION calculate_trending_score(
  p_likes_count INTEGER,
  p_comments_count INTEGER,
  p_views_count INTEGER,
  p_created_at TIMESTAMPTZ
) RETURNS NUMERIC AS $$
DECLARE
  v_age_hours NUMERIC;
  v_engagement NUMERIC;
  v_velocity NUMERIC;
  v_recency_boost NUMERIC;
BEGIN
  -- Calculate age in hours
  v_age_hours := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600;

  -- Prevent division by zero
  IF v_age_hours < 1 THEN
    v_age_hours := 1;
  END IF;

  -- Calculate engagement (comments worth 2x likes)
  v_engagement := COALESCE(p_likes_count, 0) + (COALESCE(p_comments_count, 0) * 2) + (COALESCE(p_views_count, 0) * 0.1);

  -- Calculate velocity (engagement per hour)
  v_velocity := v_engagement / v_age_hours;

  -- Apply recency boost
  IF v_age_hours < 24 THEN
    v_recency_boost := 2.0;
  ELSIF v_age_hours < 72 THEN
    v_recency_boost := 1.5;
  ELSE
    v_recency_boost := 1.0;
  END IF;

  RETURN v_velocity * v_recency_boost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Create function to update user activity stats
CREATE OR REPLACE FUNCTION update_user_activity_stats()
RETURNS void AS $$
BEGIN
  -- Update posts_last_30_days for all users
  UPDATE users u
  SET posts_last_30_days = (
    SELECT COUNT(*)
    FROM posts p
    WHERE p.user_id = u.id
      AND p.created_at > NOW() - INTERVAL '30 days'
      AND p.published = true
  );

  -- Update avg_post_engagement for all users
  UPDATE users u
  SET avg_post_engagement = (
    SELECT COALESCE(AVG(COALESCE(p.likes_count, 0) + COALESCE(p.comments_count, 0)), 0)
    FROM posts p
    WHERE p.user_id = u.id
      AND p.published = true
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Create view for trending posts
CREATE OR REPLACE VIEW trending_posts AS
SELECT
  p.*,
  calculate_trending_score(
    p.likes_count,
    p.comments_count,
    p.views_count,
    p.created_at
  ) as trending_score
FROM posts_with_stats p
WHERE p.published = true
  AND p.created_at > NOW() - INTERVAL '7 days'
ORDER BY trending_score DESC;

-- 6. Create view for active authors
CREATE OR REPLACE VIEW active_authors AS
SELECT
  u.*,
  us.followers_count,
  us.published_posts_count as works,
  u.posts_last_30_days,
  u.avg_post_engagement
FROM users u
LEFT JOIN user_statistics us ON u.id = us.user_id
WHERE u.posts_last_30_days > 0
ORDER BY u.posts_last_30_days DESC, u.avg_post_engagement DESC;

-- Grant access to views
GRANT SELECT ON trending_posts TO authenticated, anon;
GRANT SELECT ON active_authors TO authenticated, anon;

-- 7. Set default values for existing posts
UPDATE posts
SET content_type = 'article'
WHERE content_type IS NULL;

UPDATE posts
SET completion_status = 'complete'
WHERE completion_status IS NULL;

-- 8. Calculate initial reading time for existing posts (rough estimate)
UPDATE posts
SET reading_time_minutes = GREATEST(1, ROUND(LENGTH(content) / 1000.0))
WHERE reading_time_minutes IS NULL;

-- 9. Run initial activity stats update
SELECT update_user_activity_stats();
