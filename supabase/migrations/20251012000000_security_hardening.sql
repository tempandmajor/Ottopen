-- Security hardening migration
-- 1) Move extensions out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_trgm' AND n.nspname = 'public') THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'unaccent' AND n.nspname = 'public') THEN
    ALTER EXTENSION unaccent SET SCHEMA extensions;
  END IF;
END $$;

-- 2) Ensure functions run with a safe search_path and invoker security where appropriate
-- Set SECURITY INVOKER for get_referral_balance
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_referral_balance'
      AND pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid'
  ) THEN
    ALTER FUNCTION public.get_referral_balance(p_user_id uuid) SECURITY INVOKER;
  END IF;
END $$;

-- Set an explicit search_path for functions flagged as mutable
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'update_post_comments_count','get_referral_balance','mark_earnings_available','update_posts_search_vector',
        'update_users_search_vector','search_posts_fulltext','search_users_fulltext','get_search_suggestions',
        'refresh_trending_searches','update_manuscript_search_vector','calculate_submission_analytics',
        'get_submission_trends','log_submission_status_change','set_submission_deadline','create_status_change_notification',
        'refresh_submission_stats'
      )
  ) LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = pg_catalog, public', r.proname, r.args);
  END LOOP;
END $$;

-- 3) Make views run as invoker to respect caller permissions (PG15+)
DO $$ BEGIN
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='dmca_stats';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.dmca_stats SET (security_invoker = on)'; END IF;
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='security_dashboard';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.security_dashboard SET (security_invoker = on)'; END IF;
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='active_moderation_actions';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.active_moderation_actions SET (security_invoker = on)'; END IF;
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='consent_overview';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.consent_overview SET (security_invoker = on)'; END IF;
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='dsr_dashboard';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.dsr_dashboard SET (security_invoker = on)'; END IF;
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='moderation_stats';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.moderation_stats SET (security_invoker = on)'; END IF;
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='admin_activity_summary';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.admin_activity_summary SET (security_invoker = on)'; END IF;
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='pending_dmca_actions';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.pending_dmca_actions SET (security_invoker = on)'; END IF;
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='posts_with_stats';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.posts_with_stats SET (security_invoker = on)'; END IF;
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='recent_audit_activity';
  IF FOUND THEN EXECUTE 'ALTER VIEW public.recent_audit_activity SET (security_invoker = on)'; END IF;
END $$;

-- 4) Restrict materialized views from anon/authenticated roles unless intended
DO $$ BEGIN
  PERFORM 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='trending_searches';
  IF FOUND THEN
    REVOKE SELECT ON MATERIALIZED VIEW public.trending_searches FROM anon, authenticated;
  END IF;
  PERFORM 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='submission_stats';
  IF FOUND THEN
    REVOKE SELECT ON MATERIALIZED VIEW public.submission_stats FROM anon, authenticated;
  END IF;
END $$;

-- NOTE: Enabling leaked password protection must be configured in Supabase Auth settings (dashboard), not via SQL.
