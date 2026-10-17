-- User-owned research reports and persistent editable work artifacts.
-- Apply this migration in the intended Supabase environment before enabling APIs.
begin;

create table if not exists public.angel_research_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  query text not null,
  status text not null check (status in ('completed','partial','failed')),
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists angel_research_reports_owner_created_idx
  on public.angel_research_reports(user_id, created_at desc);

alter table public.angel_research_reports enable row level security;
drop policy if exists "Users can read own research reports" on public.angel_research_reports;
create policy "Users can read own research reports" on public.angel_research_reports
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users can create own research reports" on public.angel_research_reports;
create policy "Users can create own research reports" on public.angel_research_reports
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users can update own research reports" on public.angel_research_reports;
create policy "Users can update own research reports" on public.angel_research_reports
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete own research reports" on public.angel_research_reports;
create policy "Users can delete own research reports" on public.angel_research_reports
  for delete to authenticated using (user_id = auth.uid());

create table if not exists public.angel_work_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  title text not null,
  kind text not null check (kind in ('document','code','plan','media','research')),
  content text not null default '',
  asset_url text,
  mime_type text,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists angel_work_artifacts_owner_updated_idx
  on public.angel_work_artifacts(user_id, updated_at desc);

alter table public.angel_work_artifacts enable row level security;
drop policy if exists "Users can read own work artifacts" on public.angel_work_artifacts;
create policy "Users can read own work artifacts" on public.angel_work_artifacts
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users can create own work artifacts" on public.angel_work_artifacts;
create policy "Users can create own work artifacts" on public.angel_work_artifacts
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users can update own work artifacts" on public.angel_work_artifacts;
create policy "Users can update own work artifacts" on public.angel_work_artifacts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete own work artifacts" on public.angel_work_artifacts;
create policy "Users can delete own work artifacts" on public.angel_work_artifacts
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.angel_research_reports to authenticated, service_role;
grant select, insert, update, delete on public.angel_work_artifacts to authenticated, service_role;

commit;
