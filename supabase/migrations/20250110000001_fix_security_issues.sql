-- Migration: Fix Security Issues
-- Description: Add RLS policies and fix function security issues

-- =====================================================
-- Part 1: Fix Function Security (search_path issues)
-- =====================================================

-- Fix get_referral_balance
CREATE OR REPLACE FUNCTION get_referral_balance(p_user_id UUID)
RETURNS TABLE(
  total_earned_cents INTEGER,
  available_cents INTEGER,
  pending_cents INTEGER,
  paid_cents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount_cents), 0)::INTEGER as total_earned_cents,
    COALESCE(SUM(CASE WHEN status = 'available' THEN amount_cents ELSE 0 END), 0)::INTEGER as available_cents,
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0)::INTEGER as pending_cents,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0)::INTEGER as paid_cents
  FROM referral_earnings
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix mark_earnings_available
CREATE OR REPLACE FUNCTION mark_earnings_available()
RETURNS TRIGGER AS $$
BEGIN
  -- When a referral is confirmed, mark its earnings as available
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE referral_earnings
    SET status = 'available', updated_at = NOW()
    WHERE referral_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix update_club_member_count (if exists)
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE book_clubs
  SET member_count = (
    SELECT COUNT(*) FROM club_members WHERE club_id = COALESCE(NEW.club_id, OLD.club_id)
  )
  WHERE id = COALESCE(NEW.club_id, OLD.club_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix update_discussion_reply_count (if exists)
CREATE OR REPLACE FUNCTION update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE club_discussions
  SET reply_count = (
    SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = COALESCE(NEW.discussion_id, OLD.discussion_id)
  )
  WHERE id = COALESCE(NEW.discussion_id, OLD.discussion_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix update_critique_count (if exists)
CREATE OR REPLACE FUNCTION update_critique_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE critique_submissions
  SET critique_count = (
    SELECT COUNT(*) FROM critiques WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
  )
  WHERE id = COALESCE(NEW.submission_id, OLD.submission_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix update_event_participant_count (if exists)
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE club_events
  SET participant_count = (
    SELECT COUNT(*) FROM event_participants WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix update_script_page_count (if exists)
CREATE OR REPLACE FUNCTION update_script_page_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Approximate: 55 lines per page
  NEW.page_count = GREATEST(1, CEIL(COALESCE(NEW.line_count, 0) / 55.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix update_user_statistics (if exists)
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    total_scripts = (SELECT COUNT(*) FROM scripts WHERE owner_id = NEW.owner_id),
    total_words = (SELECT COALESCE(SUM(word_count), 0) FROM scripts WHERE owner_id = NEW.owner_id)
  WHERE id = NEW.owner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix update_character_counts (if exists)
CREATE OR REPLACE FUNCTION update_character_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scripts
  SET character_count = (
    SELECT COUNT(DISTINCT name) FROM script_elements WHERE script_id = NEW.script_id AND element_type = 'CHARACTER'
  )
  WHERE id = NEW.script_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix update_scripts_timestamp (if exists)
CREATE OR REPLACE FUNCTION update_scripts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scripts SET updated_at = NOW() WHERE id = NEW.script_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix calculate_writing_streak (if exists)
CREATE OR REPLACE FUNCTION calculate_writing_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  last_date DATE;
  current_check_date DATE := CURRENT_DATE;
BEGIN
  -- Get most recent writing date
  SELECT MAX(DATE(updated_at)) INTO last_date
  FROM scripts
  WHERE owner_id = p_user_id;

  IF last_date IS NULL THEN
    RETURN 0;
  END IF;

  -- Count consecutive days
  WHILE current_check_date >= last_date LOOP
    IF EXISTS (
      SELECT 1 FROM scripts
      WHERE owner_id = p_user_id AND DATE(updated_at) = current_check_date
    ) THEN
      streak := streak + 1;
      current_check_date := current_check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_application_statistics (if exists)
CREATE OR REPLACE FUNCTION update_application_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update job posting application count
  UPDATE job_postings
  SET application_count = (
    SELECT COUNT(*) FROM job_applications WHERE posting_id = COALESCE(NEW.posting_id, OLD.posting_id)
  )
  WHERE id = COALESCE(NEW.posting_id, OLD.posting_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- Part 2: Add Missing RLS Policies
-- =====================================================

-- Achievements
CREATE POLICY IF NOT EXISTS "Users can view all achievements"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert own achievements"
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Club Activity
CREATE POLICY IF NOT EXISTS "Club members can view activity"
  ON club_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = club_activity.club_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "System can create activity"
  ON club_activity FOR INSERT
  WITH CHECK (true);

-- Club Events
CREATE POLICY IF NOT EXISTS "Club members can view events"
  ON club_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = club_events.club_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Club admins can create events"
  ON club_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = club_events.club_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY IF NOT EXISTS "Club admins can update events"
  ON club_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = club_events.club_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY IF NOT EXISTS "Club admins can delete events"
  ON club_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = club_events.club_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Club Invitations
CREATE POLICY IF NOT EXISTS "Users can view own invitations"
  ON club_invitations FOR SELECT
  USING (auth.uid() = invited_user_id OR auth.uid() = inviter_id);

CREATE POLICY IF NOT EXISTS "Club admins can create invitations"
  ON club_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = club_invitations.club_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update own invitations"
  ON club_invitations FOR UPDATE
  USING (auth.uid() = invited_user_id);

CREATE POLICY IF NOT EXISTS "Inviters can delete invitations"
  ON club_invitations FOR DELETE
  USING (auth.uid() = inviter_id);

-- Critique Submissions
CREATE POLICY IF NOT EXISTS "Users can view all submissions"
  ON critique_submissions FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can create own submissions"
  ON critique_submissions FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "Authors can update own submissions"
  ON critique_submissions FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "Authors can delete own submissions"
  ON critique_submissions FOR DELETE
  USING (auth.uid() = author_id);

-- Critiques
CREATE POLICY IF NOT EXISTS "Users can view all critiques"
  ON critiques FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can create critiques"
  ON critiques FOR INSERT
  WITH CHECK (auth.uid() = critic_id);

CREATE POLICY IF NOT EXISTS "Critics can update own critiques"
  ON critiques FOR UPDATE
  USING (auth.uid() = critic_id);

CREATE POLICY IF NOT EXISTS "Critics can delete own critiques"
  ON critiques FOR DELETE
  USING (auth.uid() = critic_id);

-- Discussion Replies
CREATE POLICY IF NOT EXISTS "Club members can view replies"
  ON discussion_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_discussions cd
      JOIN club_members cm ON cm.club_id = cd.club_id
      WHERE cd.id = discussion_replies.discussion_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Club members can create replies"
  ON discussion_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_discussions cd
      JOIN club_members cm ON cm.club_id = cd.club_id
      WHERE cd.id = discussion_replies.discussion_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Authors can update own replies"
  ON discussion_replies FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "Authors can delete own replies"
  ON discussion_replies FOR DELETE
  USING (auth.uid() = author_id);

-- Event Participants
CREATE POLICY IF NOT EXISTS "Club members can view participants"
  ON event_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_events ce
      JOIN club_members cm ON cm.club_id = ce.club_id
      WHERE ce.id = event_participants.event_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can join events"
  ON event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own participation"
  ON event_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can leave events"
  ON event_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Reading Progress
CREATE POLICY IF NOT EXISTS "Users can view own progress"
  ON reading_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create own progress"
  ON reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own progress"
  ON reading_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own progress"
  ON reading_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Reading Schedules
CREATE POLICY IF NOT EXISTS "Club members can view schedules"
  ON reading_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = reading_schedules.club_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Club admins can create schedules"
  ON reading_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = reading_schedules.club_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY IF NOT EXISTS "Club admins can update schedules"
  ON reading_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = reading_schedules.club_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY IF NOT EXISTS "Club admins can delete schedules"
  ON reading_schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = reading_schedules.club_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- =====================================================
-- Part 3: Fix referral_earnings column name
-- =====================================================

-- The audit report shows field as `amount_cents` but webhook uses `amount`
-- Check if we need to rename or just ensure consistency

DO $$
BEGIN
  -- Check if amount_cents exists, if so, no action needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_earnings'
    AND column_name = 'amount_cents'
  ) THEN
    -- Column already named correctly
    RAISE NOTICE 'Column amount_cents already exists';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_earnings'
    AND column_name = 'amount'
  ) THEN
    -- Rename amount to amount_cents for consistency
    ALTER TABLE referral_earnings RENAME COLUMN amount TO amount_cents;
    RAISE NOTICE 'Renamed amount to amount_cents';
  END IF;
END $$;

-- Add missing columns to referral_earnings if they don't exist
ALTER TABLE referral_earnings
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred_id ON referral_earnings(referred_id);
