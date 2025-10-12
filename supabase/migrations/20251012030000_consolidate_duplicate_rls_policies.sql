-- Migration: Consolidate duplicate permissive RLS policies
-- This addresses performance advisor warnings about multiple permissive policies on the same table

-- ==============================================================================
-- APPLICATION_STATISTICS - has both "System can manage" (ALL) and specific SELECT
-- The ALL policy covers SELECT, so the separate SELECT policy is redundant
-- ==============================================================================
DROP POLICY IF EXISTS "Anyone can view application statistics" ON public.application_statistics;

-- ==============================================================================
-- AUDIT_LOGS - has 2 SELECT policies (own logs + admin view all)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- CLUB_ACTIVITY - has 2 SELECT policies that may overlap
-- Consolidate into one policy that allows viewing if user is a member
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view activity in their clubs" ON public.club_activity;
DROP POLICY IF EXISTS "Club members can view activity" ON public.club_activity;

CREATE POLICY "Club members can view activity" ON public.club_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_activity.club_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- ==============================================================================
-- COMMENTS - has duplicate INSERT policies
-- ==============================================================================
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
-- Keep "Authenticated users can create comments"

-- ==============================================================================
-- COMMENTS - has duplicate SELECT policies
-- ==============================================================================
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
-- Keep "Anyone can view comments on published posts"

-- ==============================================================================
-- CONTENT_APPROVAL_QUEUE - has 2 SELECT policies (moderators + authors own)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- CONTENT_REPORTS - has 2 SELECT policies (moderators + users own)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- DATA_ACCESS_LOG - has 2 SELECT policies (admins all + users own)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- DATA_PROCESSING_ACTIVITIES - has both ALL and SELECT
-- The ALL policy covers SELECT, so the separate SELECT policy is redundant
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view processing activities" ON public.data_processing_activities;

-- ==============================================================================
-- DATA_RETENTION_POLICIES - has both ALL and SELECT
-- The ALL policy covers SELECT, so the separate SELECT policy is redundant
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view retention policies" ON public.data_retention_policies;

-- ==============================================================================
-- DATA_SUBJECT_REQUESTS - has 2 SELECT policies (users own + admins all)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- DMCA_COUNTER_NOTICES - has 2 SELECT policies (admins all + users own)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- DMCA_NOTICES - has 2 SELECT policies (content owners + admins)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- EVENT_RSVPS - has both ALL and SELECT
-- The ALL policy covers SELECT, so the separate SELECT policy is redundant
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view event rsvps" ON public.event_rsvps;

-- ==============================================================================
-- MEMBER_FOLLOWS - has both ALL and SELECT
-- The ALL policy covers SELECT, so the separate SELECT policy is redundant
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view all follows" ON public.member_follows;

-- ==============================================================================
-- NOTIFICATIONS - has duplicate SELECT and UPDATE policies
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
-- Keep "Users can view their own notifications" and "Users can update their own notifications"

-- ==============================================================================
-- POST_REPORTS - has 2 SELECT policies (admins all + users own)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- POSTS - has 2 DELETE policies (own posts + admins any)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- PRIVACY_POLICY_VERSIONS - has both ALL and SELECT
-- The ALL policy covers SELECT, so the separate SELECT policy is redundant
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view privacy policies" ON public.privacy_policy_versions;

-- ==============================================================================
-- SECURITY_EVENTS - has 2 SELECT policies (users own + admins all)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- USER_CONSENTS - has both ALL and SELECT
-- The ALL policy covers SELECT, so the separate SELECT policy is redundant
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can view all consents" ON public.user_consents;

-- ==============================================================================
-- USER_MODERATION_ACTIONS - has 2 SELECT policies (moderators + users own)
-- These are NOT duplicates - they serve different purposes (keep as is)
-- ==============================================================================

-- ==============================================================================
-- USER_STATISTICS - has 3 policies with potential overlap
-- Consolidate: ALL covers everything, and separate UPDATE is redundant
-- ==============================================================================
DROP POLICY IF EXISTS "Anyone can view user statistics" ON public.user_statistics;
DROP POLICY IF EXISTS "Users can update own statistics" ON public.user_statistics;
-- Keep "System can manage user statistics" (ALL)

-- ==============================================================================
-- WEBHOOK_EVENTS - has both ALL and SELECT
-- The ALL policy covers SELECT, so the separate SELECT policy is redundant
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can view webhook events" ON public.webhook_events;
