-- Durable, user-scoped background agent jobs. No secrets or private media are stored in job payloads.
begin;

create table if not exists public.angel_background_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('agent_execution')),
  title text not null default 'Background task',
  input jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists angel_background_jobs_user_created_idx
  on public.angel_background_jobs(user_id, created_at desc);
create index if not exists angel_background_jobs_queue_idx
  on public.angel_background_jobs(status, created_at) where status = 'queued';

alter table public.angel_background_jobs enable row level security;
drop policy if exists "Users can read own background jobs" on public.angel_background_jobs;
create policy "Users can read own background jobs"
  on public.angel_background_jobs for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "Users can create own background jobs" on public.angel_background_jobs;
create policy "Users can create own background jobs"
  on public.angel_background_jobs for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "Users can cancel own queued jobs" on public.angel_background_jobs;
create policy "Users can cancel own queued jobs"
  on public.angel_background_jobs for update to authenticated
  using (user_id = auth.uid() and status = 'queued')
  with check (user_id = auth.uid() and status = 'cancelled');

create or replace function public.claim_angel_background_jobs(p_limit integer default 3)
returns setof public.angel_background_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with picked as (
    select id from public.angel_background_jobs
    where status = 'queued'
    order by created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 3), 10))
  )
  update public.angel_background_jobs j
    set status = 'running', started_at = now(), updated_at = now()
    from picked
    where j.id = picked.id
    returning j.*;
end;
$$;

revoke all on function public.claim_angel_background_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_angel_background_jobs(integer) to service_role;
grant select, insert, update on public.angel_background_jobs to authenticated, service_role;

commit;
