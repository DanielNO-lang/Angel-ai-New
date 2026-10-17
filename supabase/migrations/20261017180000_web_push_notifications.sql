-- Per-user browser push subscriptions. Subscription endpoints and auth keys are private
-- credentials; all access is mediated by the authenticated server API.
begin;

create table if not exists public.angel_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (length(endpoint) between 32 and 2048 and endpoint like 'https://%'),
  subscription jsonb not null check (jsonb_typeof(subscription) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists angel_push_subscriptions_owner_idx
  on public.angel_push_subscriptions(user_id, created_at desc);
alter table public.angel_push_subscriptions enable row level security;
drop policy if exists "Users can read own push subscriptions" on public.angel_push_subscriptions;
create policy "Users can read own push subscriptions"
  on public.angel_push_subscriptions for select to authenticated
  using (user_id = auth.uid());

-- Do not grant browser clients table access: otherwise a forged endpoint could be used
-- to make the server send outbound requests to an attacker-controlled destination.
revoke all on public.angel_push_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.angel_push_subscriptions to service_role;

commit;
