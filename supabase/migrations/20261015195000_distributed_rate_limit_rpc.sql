CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(allowed BOOLEAN, retry_after_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.api_rate_limits%ROWTYPE;
  v_expired BOOLEAN;
BEGIN
  IF p_key IS NULL OR length(p_key) = 0 OR length(p_key) > 200
     OR p_limit < 1 OR p_window_seconds < 1 OR p_window_seconds > 3600 THEN
    RAISE EXCEPTION 'Invalid rate-limit parameters';
  END IF;

  INSERT INTO public.api_rate_limits(key, window_started_at, request_count, updated_at)
  VALUES (p_key, now(), 1, now())
  ON CONFLICT (key) DO UPDATE
  SET
    request_count = CASE
      WHEN public.api_rate_limits.window_started_at
        + make_interval(secs => p_window_seconds) <= now() THEN 1
      ELSE public.api_rate_limits.request_count + 1
    END,
    window_started_at = CASE
      WHEN public.api_rate_limits.window_started_at
        + make_interval(secs => p_window_seconds) <= now() THEN now()
      ELSE public.api_rate_limits.window_started_at
    END,
    updated_at = now()
  RETURNING * INTO v_row;

  v_expired := v_row.window_started_at + make_interval(secs => p_window_seconds) <= now();

  RETURN QUERY SELECT
    (v_row.request_count <= p_limit),
    GREATEST(
      0,
      CEIL(EXTRACT(EPOCH FROM (
        v_row.window_started_at + make_interval(secs => p_window_seconds) - now()
      )))::INTEGER
    );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
