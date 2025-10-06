-- Book Clubs Enhancements Migration
-- Adds notifications, badges, credits tracking, sprints, and reporting

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Writing Sprints
CREATE TABLE IF NOT EXISTS writing_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming',
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint Participants
CREATE TABLE IF NOT EXISTS sprint_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES writing_sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_count INTEGER DEFAULT 0,
  final_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sprint_id, user_id)
);

-- Content Reports
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club Activity Feed
CREATE TABLE IF NOT EXISTS club_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  activity_type VARCHAR(50) NOT NULL,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Following
CREATE TABLE IF NOT EXISTS member_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Badges
CREATE POLICY "Users can view all badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "System can create badges" ON user_badges FOR INSERT WITH CHECK (true);

-- Credit Transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create transactions" ON credit_transactions FOR INSERT WITH CHECK (true);

-- Writing Sprints
CREATE POLICY "Users can view sprints in their clubs" ON writing_sprints FOR SELECT USING (
  EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = writing_sprints.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.status = 'active')
);
CREATE POLICY "Members can create sprints" ON writing_sprints FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_id AND club_memberships.user_id = auth.uid() AND club_memberships.status = 'active')
);

-- Sprint Participants
CREATE POLICY "Users can view sprint participants" ON sprint_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM writing_sprints WHERE writing_sprints.id = sprint_participants.sprint_id)
);
CREATE POLICY "Users can join sprints" ON sprint_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON sprint_participants FOR UPDATE USING (auth.uid() = user_id);

-- Reports
CREATE POLICY "Users can create reports" ON content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Moderators can view reports" ON content_reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM club_memberships 
    WHERE club_memberships.user_id = auth.uid() 
    AND (club_memberships.role = 'owner' OR club_memberships.role = 'moderator')
  )
);

-- Activity Feed
CREATE POLICY "Users can view activity in their clubs" ON club_activity FOR SELECT USING (
  EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_activity.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.status = 'active')
);
CREATE POLICY "System can create activity" ON club_activity FOR INSERT WITH CHECK (true);

-- Member Follows
CREATE POLICY "Users can view all follows" ON member_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON member_follows FOR ALL USING (auth.uid() = follower_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_writing_sprints_club ON writing_sprints(club_id, start_time);
CREATE INDEX IF NOT EXISTS idx_sprint_participants_sprint ON sprint_participants(sprint_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_activity_club ON club_activity(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_follows_follower ON member_follows(follower_id);

-- Functions

-- Create activity on new discussion
CREATE OR REPLACE FUNCTION create_discussion_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_activity (club_id, user_id, activity_type, content)
  VALUES (
    NEW.club_id,
    NEW.author_id,
    'discussion_created',
    jsonb_build_object('discussion_id', NEW.id, 'title', NEW.title)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER discussion_activity_trigger
AFTER INSERT ON club_discussions
FOR EACH ROW EXECUTE FUNCTION create_discussion_activity();

-- Award badge for first critique
CREATE OR REPLACE FUNCTION check_first_critique_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_badges 
    WHERE user_id = NEW.reviewer_id 
    AND badge_type = 'first_critique'
  ) THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (
      NEW.reviewer_id,
      'first_critique',
      'First Critique',
      'Gave your first critique to a fellow writer'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER first_critique_badge_trigger
AFTER INSERT ON critiques
FOR EACH ROW EXECUTE FUNCTION check_first_critique_badge();
