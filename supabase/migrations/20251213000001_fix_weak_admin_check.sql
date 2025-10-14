-- Fix weak admin check pattern in RLS policies
-- Issue: Using coalesce(u.is_admin, false) is weaker than explicit IS TRUE
-- Fix: Replace with u.is_admin IS TRUE for stronger security

-- Drop and recreate the admin policy with strong admin check
drop policy if exists submissions_select_admin on public.submissions;

create policy submissions_select_admin on public.submissions
  for select to authenticated
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid()
    and u.is_admin IS TRUE
  ));

COMMENT ON POLICY submissions_select_admin ON public.submissions IS
  'Admins can select all submissions (using strong IS TRUE check)';
