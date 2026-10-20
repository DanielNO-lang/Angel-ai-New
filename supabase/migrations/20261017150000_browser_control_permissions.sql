-- Owner-scoped browser grants, sessions, one-time action confirmations, and minimal audit events.
-- Browser execution stays disabled until this migration and an isolated worker are configured.
begin;

create table if not exists public.angel_browser_permission_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  host text not null check (host = lower(host) and length(host) between 1 and 253 and host !~ '[*/:]'),
  scopes text[] not null check (
    cardinality(scopes) between 1 and 8 and
    scopes <@ array['browser:read','browser:interact','browser:submit','browser:download','browser:upload','browser:purchase','browser:delete','browser:credentials']::text[]
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, host)
);
alter table public.angel_browser_permission_grants enable row level security;
drop policy if exists "Users can read own browser grants" on public.angel_browser_permission_grants;
create policy "Users can read own browser grants" on public.angel_browser_permission_grants
  for select to authenticated using (user_id = auth.uid());

create table if not exists public.angel_browser_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  worker_session_id text not null unique,
  start_url text not null,
  current_url text not null,
  approved_hosts text[] not null,
  status text not null default 'active' check (status in ('active','closed','expired','failed')),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists angel_browser_sessions_owner_activity_idx
  on public.angel_browser_sessions(user_id, last_activity_at desc);
alter table public.angel_browser_sessions enable row level security;
drop policy if exists "Users can read own browser sessions" on public.angel_browser_sessions;
create policy "Users can read own browser sessions" on public.angel_browser_sessions
  for select to authenticated using (user_id = auth.uid());

create table if not exists public.angel_browser_action_confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.angel_browser_sessions(id) on delete cascade,
  action_id uuid not null,
  action_kind text not null check (action_kind in ('navigate','read_page','click','fill_form','submit_form','screenshot')),
  target_host text not null,
  target_url text not null,
  payload_hash text not null,
  requires_confirmation boolean not null default false,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists angel_browser_action_confirmations_pending_idx
  on public.angel_browser_action_confirmations(user_id, session_id, expires_at)
  where used_at is null;
alter table public.angel_browser_action_confirmations enable row level security;

create table if not exists public.angel_browser_action_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.angel_browser_sessions(id) on delete set null,
  action_id uuid not null,
  action_kind text not null,
  target_host text,
  status text not null check (status in ('denied','prepared','started','completed','failed','cancelled')),
  message text,
  created_at timestamptz not null default now()
);
create index if not exists angel_browser_action_audit_owner_idx
  on public.angel_browser_action_audit(user_id, created_at desc);
alter table public.angel_browser_action_audit enable row level security;
drop policy if exists "Users can read own browser audit events" on public.angel_browser_action_audit;
create policy "Users can read own browser audit events" on public.angel_browser_action_audit
  for select to authenticated using (user_id = auth.uid());

-- The browser capability is mediated by the server. Do not expose the grant,
-- session, confirmation, or audit write privileges directly to browser clients.
revoke all on public.angel_browser_permission_grants from anon, authenticated;
revoke all on public.angel_browser_sessions from anon, authenticated;
revoke all on public.angel_browser_action_confirmations from anon, authenticated;
revoke all on public.angel_browser_action_audit from anon, authenticated;
grant select, insert, update, delete on public.angel_browser_permission_grants to service_role;
grant select, insert, update, delete on public.angel_browser_sessions to service_role;
grant select, insert, update, delete on public.angel_browser_action_confirmations to service_role;
grant select, insert, update, delete on public.angel_browser_action_audit to service_role;

commit;
