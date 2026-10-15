CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL,
  route TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  request_id TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_audit_events_service_role_only ON public.admin_audit_events;
CREATE POLICY admin_audit_events_service_role_only
  ON public.admin_audit_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.admin_audit_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_events TO service_role;

CREATE INDEX IF NOT EXISTS admin_audit_events_created_idx
  ON public.admin_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_events_user_created_idx
  ON public.admin_audit_events(user_id, created_at DESC);
