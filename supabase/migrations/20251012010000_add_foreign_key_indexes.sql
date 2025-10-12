-- Migration: Add indexes for foreign key columns to improve query performance
-- This addresses performance advisor warnings about unindexed foreign keys

-- High-traffic tables: messages, posts, submissions

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON public.messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_by ON public.messages(deleted_by);

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- Submissions table indexes
CREATE INDEX IF NOT EXISTS idx_submissions_manuscript_id ON public.submissions(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_submissions_viewed_by ON public.submissions(viewed_by);

-- Message edit history
CREATE INDEX IF NOT EXISTS idx_message_edit_history_edited_by ON public.message_edit_history(edited_by);

-- Payment transactions (critical for financial operations)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_from_user_id ON public.payment_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_to_user_id ON public.payment_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_milestone_id ON public.payment_transactions(milestone_id);

-- Jobs and contracts
CREATE INDEX IF NOT EXISTS idx_jobs_poster_id ON public.jobs(poster_id);
CREATE INDEX IF NOT EXISTS idx_job_contracts_application_id ON public.job_contracts(application_id);
CREATE INDEX IF NOT EXISTS idx_job_milestones_approved_by ON public.job_milestones(approved_by);
CREATE INDEX IF NOT EXISTS idx_job_disputes_milestone_id ON public.job_disputes(milestone_id);
CREATE INDEX IF NOT EXISTS idx_job_disputes_raised_by ON public.job_disputes(raised_by);
CREATE INDEX IF NOT EXISTS idx_job_disputes_resolved_by ON public.job_disputes(resolved_by);

-- Referral system
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_user_id ON public.referral_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_source_referral_id ON public.referral_credits(source_referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_milestones_user_id ON public.referral_milestones(user_id);

-- Club-related tables
CREATE INDEX IF NOT EXISTS idx_club_discussions_manuscript_id ON public.club_discussions(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_parent_reply_id ON public.discussion_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_achievements_club_id ON public.achievements(club_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_club_id ON public.user_badges(club_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_club_id ON public.credit_transactions(club_id);

-- Reading schedules
CREATE INDEX IF NOT EXISTS idx_reading_schedules_manuscript_id ON public.reading_schedules(manuscript_id);

-- Content moderation
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON public.content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reviewed_by ON public.content_reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_content_approval_queue_author_id ON public.content_approval_queue(author_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_queue_reviewed_by ON public.content_approval_queue(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_post_reports_reviewed_by ON public.post_reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_user_moderation_actions_moderator_id ON public.user_moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_actions_revoked_by ON public.user_moderation_actions(revoked_by);

-- DMCA and legal
CREATE INDEX IF NOT EXISTS idx_dmca_notices_reviewed_by ON public.dmca_notices(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_dmca_notices_counter_notice_id ON public.dmca_notices(counter_notice_id);
CREATE INDEX IF NOT EXISTS idx_dmca_counter_notices_reviewed_by ON public.dmca_counter_notices(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_dmca_taken_down_content_restored_by ON public.dmca_taken_down_content(restored_by);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_processed_by ON public.data_subject_requests(processed_by);

-- Script editor
CREATE INDEX IF NOT EXISTS idx_script_elements_character_id ON public.script_elements(character_id);
CREATE INDEX IF NOT EXISTS idx_script_elements_location_id ON public.script_elements(location_id);
CREATE INDEX IF NOT EXISTS idx_script_scenes_location_id ON public.script_scenes(location_id);
CREATE INDEX IF NOT EXISTS idx_script_notes_element_id ON public.script_notes(element_id);

-- Manuscripts and critiques
CREATE INDEX IF NOT EXISTS idx_critique_submissions_manuscript_id ON public.critique_submissions(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_agency_agreements_manuscript_id ON public.agency_agreements(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_agency_agreements_user_id ON public.agency_agreements(user_id);

-- Submission system
CREATE INDEX IF NOT EXISTS idx_submission_attachments_uploaded_by ON public.submission_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_submission_history_user_id ON public.submission_history(user_id);
