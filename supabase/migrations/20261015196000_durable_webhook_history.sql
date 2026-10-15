CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  event TEXT NOT NULL,
  destination_host TEXT NOT NULL DEFAULT 'unknown',
  status TEXT NOT NULL CHECK (status IN ('delivered', 'failed', 'pending_configuration')),
  http_status INTEGER,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error TEXT,
  payload_summary TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS webhook_deliveries_service_role_only ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_service_role_only
  ON public.webhook_deliveries
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.webhook_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_deliveries TO service_role;

CREATE INDEX IF NOT EXISTS webhook_deliveries_timestamp_idx
  ON public.webhook_deliveries(timestamp DESC);
CREATE INDEX IF NOT EXISTS webhook_deliveries_event_idx
  ON public.webhook_deliveries(event, timestamp DESC);
