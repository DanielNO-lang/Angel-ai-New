-- User-owned proactive assistance schedules. Every due occurrence creates an idempotent
-- background job; execution remains subject to the normal worker limits and permissions.
begin;

create table if not exists public.angel_scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 160),
  task_prompt text not null check (length(task_prompt) between 1 and 20000),
  schedule_type text not null check (schedule_type in ('once','interval')),
  scheduled_at timestamptz not null,
  interval_minutes integer,
  max_runs integer not null default 1 check (max_runs between 1 and 100),
  runs_enqueued integer not null default 0 check (runs_enqueued between 0 and 100),
  enabled boolean not null default true,
  notify_on_completion boolean not null default true,
  next_run_at timestamptz,
  last_enqueued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (schedule_type = 'once' and interval_minutes is null and max_runs = 1) or
    (schedule_type = 'interval' and interval_minutes is not null and interval_minutes between 15 and 43200)
  )
);

create index if not exists angel_scheduled_tasks_due_idx
  on public.angel_scheduled_tasks(next_run_at, created_at)
  where enabled = true;
create index if not exists angel_scheduled_tasks_owner_idx
  on public.angel_scheduled_tasks(user_id, created_at desc);


-- Enforce the per-user enabled-schedule cap even for concurrent requests.
create or replace function public.enforce_angel_schedule_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $
declare
  enabled_count integer;
begin
  if new.enabled = false then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  select count(*) into enabled_count
    from public.angel_scheduled_tasks
    where user_id = new.user_id and enabled = true
      and id is distinct from new.id;
  if enabled_count >= 20 then
    raise exception 'An account can have at most 20 enabled schedules.'
      using errcode = '23514';
  end if;
  return new;
end;
$;
drop trigger if exists angel_scheduled_tasks_enforce_limit on public.angel_scheduled_tasks;
create trigger angel_scheduled_tasks_enforce_limit
  before insert or update of enabled, user_id on public.angel_scheduled_tasks
  for each row execute function public.enforce_angel_schedule_limit();
revoke all on function public.enforce_angel_schedule_limit() from public, anon, authenticated;

alter table public.angel_scheduled_tasks enable row level security;
drop policy if exists "Users can read own scheduled tasks" on public.angel_scheduled_tasks;
create policy "Users can read own scheduled tasks" on public.angel_scheduled_tasks
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users can create own scheduled tasks" on public.angel_scheduled_tasks;
create policy "Users can create own scheduled tasks" on public.angel_scheduled_tasks
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users can update own scheduled tasks" on public.angel_scheduled_tasks;
create policy "Users can update own scheduled tasks" on public.angel_scheduled_tasks
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete own scheduled tasks" on public.angel_scheduled_tasks;
create policy "Users can delete own scheduled tasks" on public.angel_scheduled_tasks
  for delete to authenticated using (user_id = auth.uid());

alter table public.angel_background_jobs
  add column if not exists notify_on_completion boolean not null default true,
  add column if not exists scheduled_task_id uuid references public.angel_scheduled_tasks(id) on delete set null,
  add column if not exists scheduled_for timestamptz;
create unique index if not exists angel_background_jobs_scheduled_occurrence_idx
  on public.angel_background_jobs(scheduled_task_id, scheduled_for)
  where scheduled_task_id is not null and scheduled_for is not null;
create index if not exists angel_background_jobs_schedule_status_idx
  on public.angel_background_jobs(scheduled_task_id, status)
  where scheduled_task_id is not null;

grant select, insert, update, delete on public.angel_scheduled_tasks to authenticated, service_role;

-- Atomically enqueue due occurrences with a unique occurrence key so duplicate
-- scheduler invocations do not create duplicate work for the same schedule time.
create or replace function public.enqueue_due_angel_scheduled_tasks(p_limit integer default 20)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  scheduled record;
  occurrence timestamptz;
  inserted_rows integer;
  enqueued_total integer := 0;
begin
  for scheduled in
    select *
    from public.angel_scheduled_tasks
    where enabled = true
      and next_run_at is not null
      and next_run_at <= now()
      and runs_enqueued < max_runs
    order by next_run_at, created_at
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    for update skip locked
  loop
    occurrence := scheduled.next_run_at;

    insert into public.angel_background_jobs (
      user_id, kind, title, input, status, notify_on_completion,
      scheduled_task_id, scheduled_for
    ) values (
      scheduled.user_id,
      'agent_execution',
      scheduled.title,
      jsonb_build_object(
        'taskPrompt', scheduled.task_prompt,
        'agentName', 'Angel',
        'systemInstructions', 'This is a user-scheduled background task. Complete the requested analysis or drafting carefully. Background tools and private-memory access are disabled. Do not claim external actions were performed.',
        'modelConfig', '{}'::jsonb,
        'context', jsonb_build_object(
          'scheduleId', scheduled.id,
          'scheduledFor', occurrence,
          'notifyOnCompletion', scheduled.notify_on_completion
        )
      ),
      'queued',
      scheduled.notify_on_completion,
      scheduled.id,
      occurrence
    )
    on conflict (scheduled_task_id, scheduled_for)
      where scheduled_task_id is not null and scheduled_for is not null
      do nothing;

    get diagnostics inserted_rows = row_count;
    enqueued_total := enqueued_total + inserted_rows;

    if scheduled.schedule_type = 'once'
       or scheduled.runs_enqueued + 1 >= scheduled.max_runs then
      update public.angel_scheduled_tasks
        set runs_enqueued = runs_enqueued + 1,
            enabled = false,
            next_run_at = null,
            last_enqueued_at = now(),
            updated_at = now()
        where id = scheduled.id;
    else
      -- Avoid a burst of missed occurrences after a delayed scheduler run.
      update public.angel_scheduled_tasks
        set runs_enqueued = runs_enqueued + 1,
            next_run_at = greatest(
              occurrence + make_interval(mins => scheduled.interval_minutes),
              now() + interval '30 seconds'
            ),
            last_enqueued_at = now(),
            updated_at = now()
        where id = scheduled.id;
    end if;
  end loop;

  return enqueued_total;
end;
$$;

revoke all on function public.enqueue_due_angel_scheduled_tasks(integer) from public, anon, authenticated;
grant execute on function public.enqueue_due_angel_scheduled_tasks(integer) to service_role;

commit;
