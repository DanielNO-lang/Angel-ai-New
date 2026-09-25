/**
 * ANGEL AI — Supabase SQL Schema, Migration Script & RLS Definitions
 * Ready for immediate execution in any Supabase project's SQL Editor.
 */

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- ANGEL AI — SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Target: Supabase Postgres with pgvector support
-- ==============================================================================

-- 1. Enable UUID and Vector Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- 2. Profiles Table (Linked to Supabase Auth auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  preferences jsonb default '{"tone": "balanced", "verbosity": "balanced"}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Projects Table
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text default 'active' check (status in ('active', 'planning', 'completed', 'on_hold')),
  tags text[] default '{}',
  goals text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. Agents Table
create table if not exists public.agents (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  codename text not null,
  tagline text,
  description text not null,
  system_instructions text not null,
  model_config jsonb not null,
  tools text[] default '{}',
  permissions text[] default '{}',
  memory_access jsonb not null,
  execution_mode text default 'assisted' check (execution_mode in ('autonomous', 'assisted', 'supervised')),
  status text default 'active' check (status in ('active', 'draft', 'archived')),
  avatar_icon text default 'Sparkles',
  is_built_in boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. Conversations Table
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  agent_id text references public.agents(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  pinned boolean default false,
  message_count integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 6. Messages Table
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  agent_id text references public.agents(id) on delete set null,
  attachments jsonb default '[]'::jsonb,
  tool_calls jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null
);

-- 7. Memories Table (with semantic vector embedding readiness)
create table if not exists public.memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'user_preference',
    'important_fact',
    'project_context',
    'conversation_derived',
    'long_term_instruction',
    'saved_knowledge',
    'agent_memory'
  )),
  title text not null,
  content text not null,
  confidence float default 1.0,
  source text,
  tags text[] default '{}',
  agent_id text references public.agents(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  is_pinned boolean default false,
  embedding vector(768), -- compatible with Gemini text-embedding-004 / 2-preview
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 8. Tasks Table
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'review', 'completed', 'cancelled')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  recurring text,
  agent_id text references public.agents(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  subtasks jsonb default '[]'::jsonb,
  tags text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  completed_at timestamptz
);

-- 9. Agent Executions Log Table
create table if not exists public.agent_executions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null references public.agents(id) on delete cascade,
  task_prompt text not null,
  status text not null check (status in (
    'requested',
    'context_preparation',
    'memory_retrieval',
    'tool_planning',
    'executing',
    'validating',
    'completed',
    'failed'
  )),
  logs jsonb default '[]'::jsonb,
  result text,
  tools_used text[] default '{}',
  started_at timestamptz default now() not null,
  completed_at timestamptz,
  error text
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation ensuring users only access their personal data
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.agents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.tasks enable row level security;
alter table public.agent_executions enable row level security;

-- Profiles: Users can view and update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Projects
create policy "Users can manage own projects" on public.projects
  for all using (auth.uid() = user_id);

-- Agents: Users can see built-in agents OR their own custom agents
create policy "Users can view built-in or own agents" on public.agents
  for select using (is_built_in = true or auth.uid() = user_id);
create policy "Users can manage own agents" on public.agents
  for all using (auth.uid() = user_id and is_built_in = false);

-- Conversations & Messages
create policy "Users can manage own conversations" on public.conversations
  for all using (auth.uid() = user_id);
create policy "Users can manage own messages" on public.messages
  for all using (auth.uid() = user_id);

-- Memories
create policy "Users can manage own memories" on public.memories
  for all using (auth.uid() = user_id);

-- Tasks
create policy "Users can manage own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- Executions
create policy "Users can manage own executions" on public.agent_executions
  for all using (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_conversations_user on public.conversations(user_id, updated_at desc);
create index if not exists idx_messages_conv on public.messages(conversation_id, created_at asc);
create index if not exists idx_tasks_user_status on public.tasks(user_id, status);
create index if not exists idx_memories_user_type on public.memories(user_id, type);
`;

export interface SupabaseConfigStatus {
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  isReady: boolean;
  statusText: string;
}

export const checkSupabaseEnvironment = (): SupabaseConfigStatus => {
  // In browser, import.meta.env or window config
  const url = typeof process !== 'undefined' ? process.env.SUPABASE_URL : '';
  const anonKey = typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '';
  const serviceKey = typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : '';

  const hasUrl = Boolean(url && url.length > 5);
  const hasAnonKey = Boolean(anonKey && anonKey.length > 5);
  const hasServiceRoleKey = Boolean(serviceKey && serviceKey.length > 5);

  const isReady = hasUrl && hasAnonKey;

  return {
    hasUrl,
    hasAnonKey,
    hasServiceRoleKey,
    isReady,
    statusText: isReady
      ? 'Connected to Supabase PostgreSQL'
      : 'Pending Supabase credentials in .env (Running local reactive memory fallback)',
  };
};

export const SUPABASE_SCHEMA_SQL = SUPABASE_SQL_SCHEMA;
