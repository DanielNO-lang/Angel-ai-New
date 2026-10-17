-- Extend durable jobs with verified lifecycle, progress, and bounded retries.
-- This is additive; do not rewrite the previously shipped migration.
begin;

alter table public.angel_background_jobs
  add column if not exists attempt_count integer not null default 0 check (attempt_count >= 0),
  add column if not exists max_attempts integer not null default 3 check (max_attempts between 1 and 8),
  add column if not exists next_attempt_at timestamptz,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists cancel_requested_at timestamptz,
  add column if not exists progress jsonb not null default '{"stage":"queued","percent":0,"message":"Waiting for a worker."}'::jsonb;

alter table public.angel_background_jobs
  drop constraint if exists angel_background_jobs_status_check;
alter table public.angel_background_jobs
  add constraint angel_background_jobs_status_check
  check (status in ('queued','running','retrying','completed','failed','cancelled'));

create index if not exists angel_background_jobs_retry_idx
  on public.angel_background_jobs(status, next_attempt_at, created_at)
  where status in ('queued','retrying');

create or replace function public.claim_angel_background_jobs(p_limit integer default 3)
returns setof public.angel_background_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with picked as (
    select id
    from public.angel_background_jobs
    where status = 'queued'
       or (status = 'retrying' and coalesce(next_attempt_at, now()) <= now())
    order by created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 3), 10))
  )
  update public.angel_background_jobs j
    set status = 'running',
        attempt_count = j.attempt_count + 1,
        started_at = coalesce(j.started_at, now()),
        last_attempt_at = now(),
        next_attempt_at = null,
        progress = jsonb_build_object(
          'stage', 'starting',
          'percent', 5,
          'message', 'Worker claimed the task.',
          'attempt', j.attempt_count + 1,
          'maxAttempts', j.max_attempts
        ),
        updated_at = now()
    from picked
    where j.id = picked.id
    returning j.*;
end;
$$;

revoke all on function public.claim_angel_background_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_angel_background_jobs(integer) to service_role;
grant select, insert, update on public.angel_background_jobs to authenticated, service_role;

commit;
