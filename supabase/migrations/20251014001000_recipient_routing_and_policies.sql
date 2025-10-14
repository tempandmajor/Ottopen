-- Recipient routing and eligibility for paid agents/producers
-- 1) User flags to receive submissions
alter table if exists public.users
  add column if not exists can_receive_submissions boolean not null default false,
  add column if not exists receiving_plan text check (receiving_plan in ('none','basic','pro','enterprise')) default 'none',
  add column if not exists specialties text[] default '{}',
  add column if not exists company_name text;

comment on column public.users.can_receive_submissions is 'Indicates user can receive submissions (paid role)';
comment on column public.users.receiving_plan is 'Paid plan tier for receiving submissions';
comment on column public.users.specialties is 'List of genres/types the recipient prefers';

-- 2) Ensure submissions table has reviewer_id FK to users
alter table if exists public.submissions
  add column if not exists reviewer_id uuid references public.users(id) on delete set null;

-- 3) Helper view to expose eligible recipients (paid and allowed)
create or replace view public.eligible_recipients as
select
  u.id,
  u.display_name,
  u.username,
  coalesce(u.company_name, '') as company_name,
  u.account_type,
  u.receiving_plan,
  u.can_receive_submissions,
  coalesce(u.specialties, '{}') as specialties,
  u.avatar_url
from public.users u
where u.can_receive_submissions is true
  and u.receiving_plan in ('basic','pro','enterprise')
  and u.account_type in ('producer','platform_agent','external_agent');

comment on view public.eligible_recipients is 'Public-safe list of recipients eligible to receive submissions';

-- 4) Recommended RLS (example; adjust if policies exist)
-- Make sure RLS is enabled
alter table if exists public.submissions enable row level security;

-- Submitter can select/insert their own submission
create policy if not exists submissions_insert_own on public.submissions
  for insert to authenticated
  with check (auth.uid() = submitter_id);

-- Submitter can select their own submissions
create policy if not exists submissions_select_submitter on public.submissions
  for select to authenticated
  using (auth.uid() = submitter_id);

-- Assigned reviewer can select assigned submissions
create policy if not exists submissions_select_assigned_reviewer on public.submissions
  for select to authenticated
  using (auth.uid() = reviewer_id);

-- Submitter can update to withdrawn
create policy if not exists submissions_update_withdrawn_by_submitter on public.submissions
  for update to authenticated
  using (auth.uid() = submitter_id)
  with check (status in ('pending','withdrawn'));

-- Admins can select all (expects a role or a flag)
-- Replace `is_admin` with your actual admin check.
create policy if not exists submissions_select_admin on public.submissions
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false)));
