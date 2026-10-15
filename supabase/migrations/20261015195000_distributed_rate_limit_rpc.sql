-- Harden and document the existing distributed rate-limit RPC without changing its
-- JSONB return contract, which is already consumed by existing database clients.
CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_started TIMESTAMPTZ;
  v_count INTEGER;
  v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF p_key IS NULL OR length(p_key) < 16 OR length(p_key) > 200
     OR p_limit < 1 OR p_window_seconds < 1 OR p_window_seconds > 3600 THEN
    RAISE EXCEPTION 'Invalid rate-limit parameters';
  END IF;

  INSERT INTO public.api_rate_limits(key, window_started_at, request_count, updated_at)
  VALUES (p_key, v_now, 1, v_now)
  ON CONFLICT (key) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.api_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
      THEN v_now
      ELSE public.api_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN public.api_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
      THEN 1
      ELSE public.api_rate_limits.request_count + 1
    END,
    updated_at = v_now
  RETURNING window_started_at, request_count INTO v_started, v_count;

  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limits
    WHERE updated_at < v_now - interval '2 days';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_count <= p_limit,
    'remaining', greatest(p_limit - v_count, 0),
    'resetAt', v_started + make_interval(secs => p_window_seconds)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
