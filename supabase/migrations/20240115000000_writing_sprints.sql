-- Writing Sprints System for Book Clubs

-- Writing Sprints table
CREATE TABLE IF NOT EXISTS writing_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ GENERATED ALWAYS AS (start_time + (duration_minutes || ' minutes')::INTERVAL) STORED,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  max_participants INTEGER,
  word_count_goal INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint Participants table
CREATE TABLE IF NOT EXISTS sprint_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES writing_sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starting_word_count INTEGER DEFAULT 0,
  current_word_count INTEGER DEFAULT 0,
  final_word_count INTEGER,
  words_written INTEGER GENERATED ALWAYS AS (COALESCE(final_word_count, current_word_count) - starting_word_count) STORED,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(sprint_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_writing_sprints_club_id ON writing_sprints(club_id);
CREATE INDEX IF NOT EXISTS idx_writing_sprints_status ON writing_sprints(status);
CREATE INDEX IF NOT EXISTS idx_writing_sprints_start_time ON writing_sprints(start_time);
CREATE INDEX IF NOT EXISTS idx_sprint_participants_sprint_id ON sprint_participants(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_participants_user_id ON sprint_participants(user_id);

-- RLS Policies for writing_sprints
ALTER TABLE writing_sprints ENABLE ROW LEVEL SECURITY;

-- Anyone can view sprints in clubs they're a member of
CREATE POLICY "Members can view club sprints"
  ON writing_sprints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_id = writing_sprints.club_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Members can create sprints
CREATE POLICY "Members can create sprints"
  ON writing_sprints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_id = writing_sprints.club_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
    AND created_by_id = auth.uid()
  );

-- Creators and moderators can update sprints
CREATE POLICY "Creators and moderators can update sprints"
  ON writing_sprints FOR UPDATE
  USING (
    created_by_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_id = writing_sprints.club_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'moderator')
      AND status = 'active'
    )
  );

-- Creators and moderators can delete sprints
CREATE POLICY "Creators and moderators can delete sprints"
  ON writing_sprints FOR DELETE
  USING (
    created_by_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_id = writing_sprints.club_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'moderator')
      AND status = 'active'
    )
  );

-- RLS Policies for sprint_participants
ALTER TABLE sprint_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can view participants in sprints they can see
CREATE POLICY "Members can view sprint participants"
  ON sprint_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM writing_sprints ws
      JOIN club_memberships cm ON cm.club_id = ws.club_id
      WHERE ws.id = sprint_participants.sprint_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
    )
  );

-- Users can join sprints
CREATE POLICY "Users can join sprints"
  ON sprint_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM writing_sprints ws
      JOIN club_memberships cm ON cm.club_id = ws.club_id
      WHERE ws.id = sprint_participants.sprint_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
      AND ws.status IN ('scheduled', 'active')
    )
    AND user_id = auth.uid()
  );

-- Users can update their own participation
CREATE POLICY "Users can update their participation"
  ON sprint_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Users can leave sprints they've joined
CREATE POLICY "Users can leave sprints"
  ON sprint_participants FOR DELETE
  USING (user_id = auth.uid());

-- Function to auto-update sprint status based on time
CREATE OR REPLACE FUNCTION update_sprint_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark sprint as active when start time is reached
  IF NEW.start_time <= NOW() AND NEW.end_time > NOW() AND NEW.status = 'scheduled' THEN
    NEW.status := 'active';
  END IF;

  -- Mark sprint as completed when end time is reached
  IF NEW.end_time <= NOW() AND NEW.status IN ('scheduled', 'active') THEN
    NEW.status := 'completed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update sprint status
CREATE TRIGGER trigger_update_sprint_status
  BEFORE UPDATE ON writing_sprints
  FOR EACH ROW
  EXECUTE FUNCTION update_sprint_status();

-- Function to finalize participant word count when sprint completes
CREATE OR REPLACE FUNCTION finalize_sprint_participant()
RETURNS TRIGGER AS $$
BEGIN
  -- When sprint completes, set final_word_count if not already set
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE sprint_participants
    SET
      final_word_count = COALESCE(final_word_count, current_word_count),
      completed_at = NOW()
    WHERE sprint_id = NEW.id
    AND final_word_count IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to finalize participants when sprint completes
CREATE TRIGGER trigger_finalize_sprint_participant
  AFTER UPDATE ON writing_sprints
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION finalize_sprint_participant();

-- View for sprint leaderboard with user details
CREATE OR REPLACE VIEW sprint_leaderboard AS
SELECT
  sp.sprint_id,
  sp.user_id,
  p.name,
  p.avatar_url,
  sp.starting_word_count,
  sp.current_word_count,
  sp.final_word_count,
  sp.words_written,
  sp.joined_at,
  sp.completed_at,
  RANK() OVER (PARTITION BY sp.sprint_id ORDER BY sp.words_written DESC) as rank
FROM sprint_participants sp
JOIN profiles p ON p.id = sp.user_id
ORDER BY sp.sprint_id, sp.words_written DESC;

-- Grant access to the view
GRANT SELECT ON sprint_leaderboard TO authenticated;
