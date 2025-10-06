-- Feed Enhancement Features Migration
-- Adds: comments, reshares, bookmarks, user moderation

-- ============================================================================
-- COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ============================================================================
-- COMMENT LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- ============================================================================
-- RESHARES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reshares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT, -- Quote post comment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Prevent duplicate reshares
);

CREATE INDEX IF NOT EXISTS idx_reshares_post_id ON reshares(post_id);
CREATE INDEX IF NOT EXISTS idx_reshares_user_id ON reshares(user_id);
CREATE INDEX IF NOT EXISTS idx_reshares_created_at ON reshares(created_at DESC);

-- ============================================================================
-- BOOKMARKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Prevent duplicate bookmarks
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- ============================================================================
-- USER BLOCKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id) -- Cannot block yourself
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- ============================================================================
-- USER MUTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_mutes (
  muter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (muter_id, muted_id),
  CHECK (muter_id != muted_id) -- Cannot mute yourself
);

CREATE INDEX IF NOT EXISTS idx_user_mutes_muter ON user_mutes(muter_id);
CREATE INDEX IF NOT EXISTS idx_user_mutes_muted ON user_mutes(muted_id);

-- ============================================================================
-- ADD RESHARES COUNT TO POSTS
-- ============================================================================
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS reshares_count INTEGER DEFAULT 0;

-- ============================================================================
-- FUNCTIONS FOR MAINTAINING COUNTS
-- ============================================================================

-- Function to update comment count on posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment count
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Function to update likes count on comments
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment likes count
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- Function to update reshares count on posts
CREATE OR REPLACE FUNCTION update_post_reshares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET reshares_count = reshares_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET reshares_count = GREATEST(0, reshares_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reshares count
DROP TRIGGER IF EXISTS trigger_update_post_reshares_count ON reshares;
CREATE TRIGGER trigger_update_post_reshares_count
  AFTER INSERT OR DELETE ON reshares
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reshares_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comment Likes RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment likes are viewable by everyone"
  ON comment_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like comments"
  ON comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reshares RLS
ALTER TABLE reshares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reshares are viewable by everyone"
  ON reshares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reshares"
  ON reshares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reshares"
  ON reshares FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Bookmarks RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Blocks RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON user_blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks"
  ON user_blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- User Mutes RLS
ALTER TABLE user_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mutes"
  ON user_mutes FOR SELECT
  TO authenticated
  USING (auth.uid() = muter_id);

CREATE POLICY "Users can create mutes"
  ON user_mutes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = muter_id);

CREATE POLICY "Users can delete own mutes"
  ON user_mutes FOR DELETE
  TO authenticated
  USING (auth.uid() = muter_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON comment_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON reshares TO authenticated;
GRANT SELECT, INSERT, DELETE ON bookmarks TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_blocks TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_mutes TO authenticated;
