-- Fix overly permissive RLS policies on statistics tables
-- CRITICAL SECURITY FIX: Prevents unauthorized modification of user statistics

-- ============================================================================
-- 1. FIX USER_STATISTICS TABLE POLICIES
-- ============================================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view user statistics" ON user_statistics;
DROP POLICY IF EXISTS "Users can update own statistics" ON user_statistics;
DROP POLICY IF EXISTS "System can manage user statistics" ON user_statistics;

-- Create secure policies
-- Anyone can view statistics (read-only public data)
CREATE POLICY "Public can view user statistics"
  ON user_statistics FOR SELECT
  USING (true);

-- Only the system (via service role) can insert new statistics
CREATE POLICY "Service role can insert user statistics"
  ON user_statistics FOR INSERT
  WITH CHECK (
    -- This will only work when called via service role (admin client)
    -- Regular users won't be able to pass this check
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Only the system (via service role) can update statistics
CREATE POLICY "Service role can update user statistics"
  ON user_statistics FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- No one can delete statistics (audit trail preservation)
-- Statistics should be retained for historical analysis

-- ============================================================================
-- 2. FIX APPLICATION_STATISTICS TABLE POLICIES
-- ============================================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view application statistics" ON application_statistics;
DROP POLICY IF EXISTS "System can manage application statistics" ON application_statistics;

-- Create secure policies
-- Anyone can view application statistics (public homepage stats)
CREATE POLICY "Public can view application statistics"
  ON application_statistics FOR SELECT
  USING (true);

-- Only the system (via service role) can insert statistics
CREATE POLICY "Service role can insert application statistics"
  ON application_statistics FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Only the system (via service role) can update statistics
CREATE POLICY "Service role can update application statistics"
  ON application_statistics FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- ============================================================================
-- 3. FIX SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- Fix update_user_statistics function - add authentication check
CREATE OR REPLACE FUNCTION update_user_statistics(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- SECURITY: Only allow service role or the user themselves to update stats
  IF auth.jwt() ->> 'role' != 'service_role' AND auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update user statistics';
  END IF;

  INSERT INTO user_statistics (
    user_id,
    posts_count,
    published_posts_count,
    followers_count,
    following_count,
    likes_received_count,
    comments_received_count,
    manuscripts_count
  )
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

-- Fix update_application_statistics function - add authentication check
CREATE OR REPLACE FUNCTION update_application_statistics()
RETURNS void AS $$
BEGIN
  -- SECURITY: Only allow service role or admins to update app statistics
  IF auth.jwt() ->> 'role' != 'service_role' AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update application statistics';
  END IF;

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

-- Add comment explaining the security model
COMMENT ON TABLE user_statistics IS 'User statistics cache. Read-only for public, write-only for service role to prevent manipulation.';
COMMENT ON TABLE application_statistics IS 'Application-wide statistics for homepage. Read-only for public, write-only for service role and admins.';
COMMENT ON FUNCTION update_user_statistics IS 'Updates user statistics. SECURITY DEFINER with auth check - only service role or the user can update.';
COMMENT ON FUNCTION update_application_statistics IS 'Updates application statistics. SECURITY DEFINER with auth check - only service role or admins can update.';
