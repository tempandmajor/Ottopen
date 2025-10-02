-- Book Club Feature Tables
-- Creates tables for community book clubs, discussions, critiques, and events

-- ============================================================================
-- BOOK CLUBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS book_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  club_type VARCHAR(50) NOT NULL DEFAULT 'public' CHECK (club_type IN ('public', 'private', 'invite-only')),
  genre TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  banner_url TEXT,
  rules TEXT,
  welcome_message TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  max_members INTEGER, -- NULL for unlimited (premium feature)
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_book_clubs_created_by ON book_clubs(created_by);
CREATE INDEX idx_book_clubs_club_type ON book_clubs(club_type);
CREATE INDEX idx_book_clubs_genre ON book_clubs USING GIN(genre);
CREATE INDEX idx_book_clubs_tags ON book_clubs USING GIN(tags);

-- ============================================================================
-- CLUB MEMBERSHIP
-- ============================================================================

CREATE TABLE IF NOT EXISTS club_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned')),
  credits INTEGER DEFAULT 0, -- For critique exchange system
  reputation_score INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX idx_club_memberships_status ON club_memberships(status);

-- ============================================================================
-- READING SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS reading_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  chapters_per_week INTEGER DEFAULT 1,
  current_chapter INTEGER DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reading_schedules_club_id ON reading_schedules(club_id);
CREATE INDEX idx_reading_schedules_status ON reading_schedules(status);

-- ============================================================================
-- READING PROGRESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES reading_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(schedule_id, user_id, chapter_number)
);

CREATE INDEX idx_reading_progress_schedule_id ON reading_progress(schedule_id);
CREATE INDEX idx_reading_progress_user_id ON reading_progress(user_id);

-- ============================================================================
-- CLUB DISCUSSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS club_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned BOOLEAN DEFAULT false,
  locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_club_discussions_club_id ON club_discussions(club_id);
CREATE INDEX idx_club_discussions_author_id ON club_discussions(author_id);
CREATE INDEX idx_club_discussions_created_at ON club_discussions(created_at DESC);

-- ============================================================================
-- DISCUSSION REPLIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id UUID NOT NULL REFERENCES club_discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX idx_discussion_replies_author_id ON discussion_replies(author_id);

-- ============================================================================
-- CRITIQUE SUBMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS critique_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  submitter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  credits_cost INTEGER DEFAULT 1,
  min_critiques INTEGER DEFAULT 1,
  max_critiques INTEGER DEFAULT 5,
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed', 'cancelled')),
  critique_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_critique_submissions_club_id ON critique_submissions(club_id);
CREATE INDEX idx_critique_submissions_submitter_id ON critique_submissions(submitter_id);
CREATE INDEX idx_critique_submissions_status ON critique_submissions(status);

-- ============================================================================
-- CRITIQUES
-- ============================================================================

CREATE TABLE IF NOT EXISTS critiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES critique_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
  rating_plot INTEGER CHECK (rating_plot BETWEEN 1 AND 5),
  rating_characters INTEGER CHECK (rating_characters BETWEEN 1 AND 5),
  rating_prose INTEGER CHECK (rating_prose BETWEEN 1 AND 5),
  rating_pacing INTEGER CHECK (rating_pacing BETWEEN 1 AND 5),
  helpful_votes INTEGER DEFAULT 0,
  not_helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, reviewer_id)
);

CREATE INDEX idx_critiques_submission_id ON critiques(submission_id);
CREATE INDEX idx_critiques_reviewer_id ON critiques(reviewer_id);

-- ============================================================================
-- CLUB EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS club_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('reading', 'sprint', 'workshop', 'ama', 'challenge', 'social')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER,
  participant_count INTEGER DEFAULT 0,
  location_type VARCHAR(50) DEFAULT 'virtual' CHECK (location_type IN ('virtual', 'in-person', 'hybrid')),
  meeting_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_club_events_club_id ON club_events(club_id);
CREATE INDEX idx_club_events_start_time ON club_events(start_time);

-- ============================================================================
-- EVENT PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES club_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not-going')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);

-- ============================================================================
-- ACHIEVEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  club_id UUID REFERENCES book_clubs(id) ON DELETE SET NULL,
  metadata JSONB,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);

-- ============================================================================
-- CLUB INVITATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS club_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_club_invitations_club_id ON club_invitations(club_id);
CREATE INDEX idx_club_invitations_invitee_email ON club_invitations(invitee_email);
CREATE INDEX idx_club_invitations_status ON club_invitations(status);

-- ============================================================================
-- CLUB ACTIVITY FEED
-- ============================================================================

CREATE TABLE IF NOT EXISTS club_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_club_activity_club_id ON club_activity(club_id);
CREATE INDEX idx_club_activity_created_at ON club_activity(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update book club member count
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE book_clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE book_clubs SET member_count = member_count - 1 WHERE id = OLD.club_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active' THEN
    UPDATE book_clubs SET member_count = member_count - 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
    UPDATE book_clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_club_member_count
AFTER INSERT OR UPDATE OR DELETE ON club_memberships
FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

-- Update discussion reply count
CREATE OR REPLACE FUNCTION update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE club_discussions
    SET reply_count = reply_count + 1, last_reply_at = NEW.created_at
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE club_discussions
    SET reply_count = reply_count - 1
    WHERE id = OLD.discussion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discussion_reply_count
AFTER INSERT OR DELETE ON discussion_replies
FOR EACH ROW EXECUTE FUNCTION update_discussion_reply_count();

-- Update critique count
CREATE OR REPLACE FUNCTION update_critique_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE critique_submissions
    SET critique_count = critique_count + 1,
        status = CASE
          WHEN critique_count + 1 >= min_critiques THEN 'completed'
          ELSE status
        END
    WHERE id = NEW.submission_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE critique_submissions
    SET critique_count = critique_count - 1
    WHERE id = OLD.submission_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_critique_count
AFTER INSERT OR DELETE ON critiques
FOR EACH ROW EXECUTE FUNCTION update_critique_count();

-- Update event participant count
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'going' THEN
    UPDATE club_events SET participant_count = participant_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'going' THEN
    UPDATE club_events SET participant_count = participant_count - 1 WHERE id = OLD.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'going' AND NEW.status != 'going' THEN
    UPDATE club_events SET participant_count = participant_count - 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'going' AND NEW.status = 'going' THEN
    UPDATE club_events SET participant_count = participant_count + 1 WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_participant_count
AFTER INSERT OR UPDATE OR DELETE ON event_participants
FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_book_clubs_updated_at
BEFORE UPDATE ON book_clubs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_reading_schedules_updated_at
BEFORE UPDATE ON reading_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_club_discussions_updated_at
BEFORE UPDATE ON club_discussions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE book_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE critique_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE critiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_activity ENABLE ROW LEVEL SECURITY;

-- Public clubs visible to all
CREATE POLICY "Public clubs are viewable by everyone" ON book_clubs
FOR SELECT USING (club_type = 'public' OR auth.uid() IN (
  SELECT user_id FROM club_memberships WHERE club_id = id AND status = 'active'
));

-- Members can view their clubs
CREATE POLICY "Members can view club content" ON club_discussions
FOR SELECT USING (
  club_id IN (SELECT club_id FROM club_memberships WHERE user_id = auth.uid() AND status = 'active')
);

-- Users can manage their own memberships
CREATE POLICY "Users can manage their memberships" ON club_memberships
FOR ALL USING (user_id = auth.uid());

-- More RLS policies can be added as needed...
