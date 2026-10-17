-- The API rate-limit ledger is server-only. Explicitly scope its sole RLS policy
-- to service_role; anon/authenticated users receive no policy and remain denied.
DROP POLICY IF EXISTS api_rate_limits_service_role_only ON public.api_rate_limits;
CREATE POLICY api_rate_limits_service_role_only
  ON public.api_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
