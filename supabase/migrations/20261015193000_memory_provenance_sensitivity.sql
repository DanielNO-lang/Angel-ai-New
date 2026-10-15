-- Memory provenance and sensitivity controls for Angel.
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS sensitivity TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS importance SMALLINT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE public.memories DROP CONSTRAINT IF EXISTS memories_sensitivity_check;
ALTER TABLE public.memories ADD CONSTRAINT memories_sensitivity_check
  CHECK (sensitivity IN ('normal', 'sensitive'));

CREATE INDEX IF NOT EXISTS memories_user_sensitivity_updated_idx
  ON public.memories(user_id, sensitivity, updated_at DESC);

COMMENT ON COLUMN public.memories.source IS
  'Provenance: conversation ID, manual input, import source, or agent origin. Treat source content as untrusted data.';
COMMENT ON COLUMN public.memories.sensitivity IS
  'Sensitive memories are excluded from ordinary automatic context retrieval.';
