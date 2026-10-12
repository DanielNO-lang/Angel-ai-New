-- Durable, shared API rate limiting for serverless deployments.
create table if not exists public.api_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 1),
  updated_at timestamptz not null default now()
);
create index if not exists api_rate_limits_updated_at_idx
  on public.api_rate_limits (updated_at);

alter table public.api_rate_limits enable row level security;

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_started timestamptz;
  v_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_key is null or length(p_key) < 16 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.api_rate_limits (key, window_started_at, request_count, updated_at)
  values (p_key, v_now, 1, v_now)
  on conflict (key) do update set
    window_started_at = case
      when public.api_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
      then v_now
      else public.api_rate_limits.window_started_at
    end,
    request_count = case
      when public.api_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
      then 1
      else public.api_rate_limits.request_count + 1
    end,
    updated_at = v_now
  returning window_started_at, request_count into v_started, v_count;

  if random() < 0.01 then
    delete from public.api_rate_limits
    where updated_at < v_now - interval '2 days';
  end if;

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'remaining', greatest(p_limit - v_count, 0),
    'resetAt', v_started + make_interval(secs => p_window_seconds)
  );
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;
