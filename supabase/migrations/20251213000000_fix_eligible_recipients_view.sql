-- Fix eligible_recipients view security issue
-- Issue: View was defined with SECURITY DEFINER which bypasses RLS
-- Fix: Recreate view with security_invoker = true to run with caller's permissions

CREATE OR REPLACE VIEW public.eligible_recipients
WITH (security_invoker = true)
AS
SELECT
  u.id,
  u.display_name,
  u.username,
  coalesce(u.company_name, '') as company_name,
  u.account_type,
  u.receiving_plan,
  u.can_receive_submissions,
  coalesce(u.specialties, '{}') as specialties,
  u.avatar_url
FROM public.users u
WHERE u.can_receive_submissions is true
  AND u.receiving_plan in ('basic','pro','enterprise')
  AND u.account_type in ('producer','platform_agent','external_agent');

COMMENT ON VIEW public.eligible_recipients IS 'Public-safe list of recipients eligible to receive submissions (runs with invoker permissions for security)';
