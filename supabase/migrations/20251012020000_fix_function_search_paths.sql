-- Migration: Fix mutable search_path in functions
-- This addresses security advisor warnings about functions without explicit search_path

-- Set search_path for all flagged functions (using correct signatures from database)
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_moderation_action_active(user_moderation_actions) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_comment_likes_count() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_post_reshares_count() SET search_path = pg_catalog, public;
ALTER FUNCTION public.log_moderation_action() SET search_path = pg_catalog, public;
ALTER FUNCTION public.notify_content_owner_dmca() SET search_path = pg_catalog, public;
ALTER FUNCTION public.set_counter_notice_waiting_period() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_club_member_count() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_discussion_reply_count() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_critique_count() SET search_path = pg_catalog, public;
ALTER FUNCTION public.set_dsr_deadline() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_event_participant_count() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_script_page_count() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_user_statistics(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_character_counts() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_scripts_timestamp() SET search_path = pg_catalog, public;
ALTER FUNCTION public.can_view_profile(uuid, uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_writing_streak(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_application_statistics() SET search_path = pg_catalog, public;
ALTER FUNCTION public.complete_payout_transaction(uuid, text, integer, uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.cleanup_expired_data() SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_user_stats(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.check_script_access(uuid, uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.log_audit_event(uuid, character varying, character varying, uuid, jsonb, jsonb, text, character varying, jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.audit_trigger_function() SET search_path = pg_catalog, public;
