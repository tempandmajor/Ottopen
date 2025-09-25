-- Add missing features to support real functionality
-- Migration: Add Writing Goals, Streaks, User Stats, and enhanced User profiles

-- Add location and other missing fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Create writing goals table
CREATE TABLE IF NOT EXISTS writing_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL, -- 'daily_words', 'weekly_words', 'monthly_posts', 'reading_books', etc.
  target_value INTEGER NOT NULL DEFAULT 0,
  current_value INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'words', -- 'words', 'posts', 'books', 'pages'
  period TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'yearly'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create writing sessions table for tracking streaks and progress
CREATE TABLE IF NOT EXISTS writing_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  words_written INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 0,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user statistics table for caching computed stats
CREATE TABLE IF NOT EXISTS user_statistics (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  posts_count INTEGER DEFAULT 0,
  published_posts_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_received_count INTEGER DEFAULT 0,
  comments_received_count INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  total_words_written INTEGER DEFAULT 0,
  manuscripts_count INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create application statistics table for homepage stats
CREATE TABLE IF NOT EXISTS application_statistics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stat_key TEXT UNIQUE NOT NULL,
  stat_value INTEGER NOT NULL DEFAULT 0,
  stat_description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create post views table to track actual views instead of using likes
CREATE TABLE IF NOT EXISTS post_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be null for anonymous views
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id, viewed_at::DATE) -- One view per user per post per day
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_writing_goals_user_id ON writing_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_goals_goal_type ON writing_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_writing_goals_is_active ON writing_goals(is_active);

CREATE INDEX IF NOT EXISTS idx_writing_sessions_user_id ON writing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_sessions_session_date ON writing_sessions(session_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_statistics_followers_count ON user_statistics(followers_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_statistics_posts_count ON user_statistics(published_posts_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_statistics_current_streak ON user_statistics(current_streak_days DESC);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON post_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_statistics_stat_key ON application_statistics(stat_key);

-- Add updated_at trigger for new tables
CREATE TRIGGER update_writing_goals_updated_at BEFORE UPDATE ON writing_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_statistics_updated_at BEFORE UPDATE ON application_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for new tables
ALTER TABLE writing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables

-- Writing goals policies
CREATE POLICY "Users can view own writing goals" ON writing_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own writing goals" ON writing_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own writing goals" ON writing_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own writing goals" ON writing_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Writing sessions policies
CREATE POLICY "Users can view own writing sessions" ON writing_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own writing sessions" ON writing_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own writing sessions" ON writing_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own writing sessions" ON writing_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- User statistics policies
CREATE POLICY "Anyone can view user statistics" ON user_statistics
  FOR SELECT USING (true);

CREATE POLICY "Users can update own statistics" ON user_statistics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage user statistics" ON user_statistics
  FOR ALL USING (true);

-- Application statistics policies
CREATE POLICY "Anyone can view application statistics" ON application_statistics
  FOR SELECT USING (true);

CREATE POLICY "System can manage application statistics" ON application_statistics
  FOR ALL USING (true);

-- Post views policies
CREATE POLICY "Users can view own post views" ON post_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create post views" ON post_views
  FOR INSERT WITH CHECK (true);

-- Create function to update user statistics
CREATE OR REPLACE FUNCTION update_user_statistics(target_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO user_statistics (user_id, posts_count, published_posts_count, followers_count, following_count, likes_received_count, comments_received_count, manuscripts_count)
  VALUES (
    target_user_id,
    (SELECT COUNT(*) FROM posts WHERE user_id = target_user_id),
    (SELECT COUNT(*) FROM posts WHERE user_id = target_user_id AND published = true),
    (SELECT COUNT(*) FROM follows WHERE following_id = target_user_id),
    (SELECT COUNT(*) FROM follows WHERE follower_id = target_user_id),
    (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = target_user_id),
    (SELECT COUNT(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = target_user_id),
    (SELECT COUNT(*) FROM manuscripts WHERE user_id = target_user_id)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    posts_count = EXCLUDED.posts_count,
    published_posts_count = EXCLUDED.published_posts_count,
    followers_count = EXCLUDED.followers_count,
    following_count = EXCLUDED.following_count,
    likes_received_count = EXCLUDED.likes_received_count,
    comments_received_count = EXCLUDED.comments_received_count,
    manuscripts_count = EXCLUDED.manuscripts_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate writing streak
CREATE OR REPLACE FUNCTION calculate_writing_streak(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_activity BOOLEAN;
BEGIN
  -- Check each day backwards from today
  WHILE check_date >= CURRENT_DATE - INTERVAL '365 days' LOOP
    -- Check if user has any writing activity on this date
    SELECT EXISTS(
      SELECT 1 FROM writing_sessions
      WHERE user_id = target_user_id
      AND session_date = check_date
      AND words_written > 0
    ) OR EXISTS(
      SELECT 1 FROM posts
      WHERE user_id = target_user_id
      AND created_at::DATE = check_date
    ) INTO has_activity;

    IF has_activity THEN
      current_streak := current_streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update application statistics
CREATE OR REPLACE FUNCTION update_application_statistics()
RETURNS void AS $$
BEGIN
  -- Update active writers count
  INSERT INTO application_statistics (stat_key, stat_value, stat_description)
  VALUES ('active_writers', (
    SELECT COUNT(DISTINCT user_id)
    FROM posts
    WHERE created_at >= NOW() - INTERVAL '30 days'
  ), 'Writers who posted in the last 30 days')
  ON CONFLICT (stat_key) DO UPDATE SET
    stat_value = EXCLUDED.stat_value,
    updated_at = NOW();

  -- Update stories shared count
  INSERT INTO application_statistics (stat_key, stat_value, stat_description)
  VALUES ('stories_shared', (
    SELECT COUNT(*) FROM posts WHERE published = true
  ), 'Total published posts')
  ON CONFLICT (stat_key) DO UPDATE SET
    stat_value = EXCLUDED.stat_value,
    updated_at = NOW();

  -- Update published manuscripts count
  INSERT INTO application_statistics (stat_key, stat_value, stat_description)
  VALUES ('published_works', (
    SELECT COUNT(*) FROM manuscripts WHERE status = 'represented'
  ), 'Manuscripts that found representation')
  ON CONFLICT (stat_key) DO UPDATE SET
    stat_value = EXCLUDED.stat_value,
    updated_at = NOW();

  -- Update total users count
  INSERT INTO application_statistics (stat_key, stat_value, stat_description)
  VALUES ('total_users', (
    SELECT COUNT(*) FROM users
  ), 'Total registered users')
  ON CONFLICT (stat_key) DO UPDATE SET
    stat_value = EXCLUDED.stat_value,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated view for posts with real view counts
CREATE OR REPLACE VIEW posts_with_stats AS
SELECT
  p.*,
  u.display_name,
  u.username,
  u.avatar_url,
  COALESCE(l.likes_count, 0) as likes_count,
  COALESCE(c.comments_count, 0) as comments_count,
  COALESCE(v.views_count, 0) as views_count
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN (
  SELECT post_id, COUNT(*) as likes_count
  FROM likes
  GROUP BY post_id
) l ON p.id = l.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as comments_count
  FROM comments
  GROUP BY post_id
) c ON p.id = c.post_id
LEFT JOIN (
  SELECT post_id, COUNT(DISTINCT COALESCE(user_id::TEXT, ip_address::TEXT)) as views_count
  FROM post_views
  GROUP BY post_id
) v ON p.id = v.post_id;

-- Insert initial application statistics
INSERT INTO application_statistics (stat_key, stat_value, stat_description)
VALUES
  ('active_writers', 0, 'Writers who posted in the last 30 days'),
  ('stories_shared', 0, 'Total published posts'),
  ('published_works', 0, 'Manuscripts that found representation'),
  ('total_users', 0, 'Total registered users')
ON CONFLICT (stat_key) DO NOTHING;

-- Initial statistics update
SELECT update_application_statistics();