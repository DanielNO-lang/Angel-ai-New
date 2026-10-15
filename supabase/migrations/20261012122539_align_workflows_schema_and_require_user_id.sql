-- Workflow schema alignment for the Angel AI workspace.
-- This migration was applied to the live Angel project; keep it in source control
-- so fresh databases and migration history match the deployed schema.
ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS codename text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS version text DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS conditions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS execution_chain jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS project_id text,
  ADD COLUMN IF NOT EXISTS agent_id text,
  ADD COLUMN IF NOT EXISTS system_instructions text,
  ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_executed_at timestamptz,
  ADD COLUMN IF NOT EXISTS execution_count integer DEFAULT 0;

-- Ownerless records must not become visible or writable under account-scoped RLS.
ALTER TABLE public.tasks         ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.projects      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.memories      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.library_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.agents        ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.messages      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.workflows     ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.executions    ALTER COLUMN user_id SET NOT NULL;
