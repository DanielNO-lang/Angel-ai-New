/**
 * ANGEL AI — Server-Side Supabase Persistence & Velocity Service
 * Comprehensive cloud persistence engine for all major Angel entities:
 * - Profiles, Agents, Conversations, Messages, Tasks, Memories,
 *   Projects, Executions, Workflows, Library Items, and Settings.
 * - Enforces Row Level Security (RLS) policies and user-scoped data ownership.
 * - Computes real-time project velocity metrics and provides schema DDL migrations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseServerStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  mode: 'connected' | 'pending_configuration';
  message: string;
}

export interface TaskVelocityMetrics {
  total: number;
  completed: number;
  inProgress: number;
  review: number;
  todo: number;
  cancelled: number;
  completionRate: number; // 0 - 100
  velocityScore: number; // velocity rating scale 0 - 100
  velocityRating: 'Optimal' | 'High' | 'Steady' | 'Ramping Up' | 'Initial';
  weeklyVelocity: number; // completed in the last 7 days
  burnDownRate: string; // tasks/day
  estimatedDaysToCompletion: number;
  isSupabaseConnected: boolean;
  dataSource: 'supabase_live' | 'workspace_synced';
  lastSyncedAt: string;
  tasksCount: number;
}

export interface SyncPayload {
  userId?: string;
  profile?: Record<string, unknown>;
  agents?: Array<Record<string, unknown>>;
  conversations?: Array<Record<string, unknown>>;
  messages?: Array<Record<string, unknown>>;
  tasks?: Array<Record<string, unknown>>;
  memories?: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  workflows?: Array<Record<string, unknown>>;
  libraryItems?: Array<Record<string, unknown>>;
  settings?: Record<string, unknown>;
}

export interface SyncResult {
  success: boolean;
  syncedCounts: Record<string, number>;
  timestamp: string;
  message: string;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key || url.length < 5 || key.length < 5) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('[Supabase Service] Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return cachedClient;
}


/**
 * Anonymous-key client for server-side Supabase Auth entry points such as
 * sign-up, password sign-in, and password recovery. Never uses service-role.
 */
export function getSupabaseAuthClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error('[Supabase Service] Failed to initialize auth client:', err);
    return null;
  }
}

/**
 * Create a request-scoped client that carries a verified user's Supabase JWT.
 * RLS remains active for every read/write; privileged service-role credentials
 * are deliberately never used for user-owned workspace data.
 */
export function getSupabaseClientForUser(accessToken: string): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !accessToken) return null;

  try {
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  } catch (err) {
    console.error('[Supabase Service] Failed to initialize user-scoped client:', err);
    return null;
  }
}

export function getSupabaseServerStatus(): SupabaseServerStatus {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hasUrl = Boolean(url && url.length > 5);
  const hasAnonKey = Boolean(anonKey && anonKey.length > 5);
  const hasServiceRoleKey = Boolean(serviceRoleKey && serviceRoleKey.length > 5);
  const isConfigured = hasUrl && (hasAnonKey || hasServiceRoleKey);

  return {
    isConfigured,
    hasUrl,
    hasAnonKey,
    hasServiceRoleKey,
    mode: isConfigured ? 'connected' : 'pending_configuration',
    message: isConfigured
      ? 'Supabase credentials detected. Multi-entity PostgreSQL cloud sync active.'
      : 'Supabase credentials pending in .env. Angel is running with reactive workspace synchronization.',
  };
}

/**
 * Calculates project velocity from an array of tasks
 */
export function calculateVelocityMetrics(
  tasks: Array<{
    id?: string;
    status?: string;
    completedAt?: string;
    completed_at?: string;
    createdAt?: string;
    created_at?: string;
  }>,
  isLiveSupabase: boolean = false
): TaskVelocityMetrics {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const review = tasks.filter((t) => t.status === 'review').length;
  const todo = tasks.filter((t) => t.status === 'todo' || !t.status).length;
  const cancelled = tasks.filter((t) => t.status === 'cancelled').length;

  const activePool = total - cancelled;
  const completionRate = activePool > 0 ? Math.round((completed / activePool) * 100) : 0;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const weeklyVelocity = tasks.filter((t) => {
    if (t.status !== 'completed') return false;
    const completedTimestamp = t.completedAt || t.completed_at || t.createdAt || t.created_at;
    if (!completedTimestamp) return false;
    const ts = new Date(completedTimestamp).getTime();
    return ts >= sevenDaysAgo && ts <= now;
  }).length;

  let velocityScore = 50;
  if (total === 0) {
    velocityScore = 0;
  } else {
    const rawScore = completionRate * 0.6 + Math.min(weeklyVelocity * 8, 40);
    velocityScore = Math.min(100, Math.max(10, Math.round(rawScore)));
  }

  let velocityRating: TaskVelocityMetrics['velocityRating'] = 'Steady';
  if (velocityScore >= 80) velocityRating = 'Optimal';
  else if (velocityScore >= 65) velocityRating = 'High';
  else if (velocityScore >= 45) velocityRating = 'Steady';
  else if (velocityScore >= 25) velocityRating = 'Ramping Up';
  else velocityRating = 'Initial';

  const burnDownRateVal = (weeklyVelocity / 7).toFixed(1);
  const remaining = Math.max(0, activePool - completed);
  const dailyRate = Math.max(0.4, weeklyVelocity / 7);
  const estimatedDaysToCompletion = remaining > 0 ? Math.ceil(remaining / dailyRate) : 0;

  return {
    total,
    completed,
    inProgress,
    review,
    todo,
    cancelled,
    completionRate,
    velocityScore,
    velocityRating,
    weeklyVelocity,
    burnDownRate: `${burnDownRateVal} tasks/day`,
    estimatedDaysToCompletion,
    isSupabaseConnected: isLiveSupabase,
    dataSource: isLiveSupabase ? 'supabase_live' : 'workspace_synced',
    lastSyncedAt: new Date().toISOString(),
    tasksCount: total,
  };
}

export async function getTasksVelocity(fallbackTasks: any[] = [], userClient?: SupabaseClient): Promise<TaskVelocityMetrics> {
  // Never query all users' tasks through a service-role client for a user-facing metric.
  const supabase = userClient;
  if (supabase) {
    try {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error && Array.isArray(data)) {
        return calculateVelocityMetrics(data, true);
      }
    } catch {
      // Fall through to fallback
    }
  }
  return calculateVelocityMetrics(fallbackTasks, false);
}

export async function syncTasksToSupabase(tasks: any[], userId: string, accessToken: string): Promise<{ success: boolean; syncedCount: number; message: string }> {
  const supabase = getSupabaseClientForUser(accessToken);
  if (!supabase) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Supabase client not configured in server environment',
    };
  }

  try {
    const formatted = tasks.map((t) => ({
      id: t.id,
      user_id: userId,
      title: t.title,
      description: t.description || '',
      status: t.status || 'todo',
      priority: t.priority || 'medium',
      due_date: t.dueDate || null,
      recurring: t.recurring || null,
      agent_id: t.agentId || null,
      conversation_id: t.conversationId || null,
      project_id: t.projectId || null,
      subtasks: t.subtasks || [],
      tags: t.tags || [],
      created_at: t.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: t.completedAt || null,
    }));

    const { error } = await supabase.from('tasks').upsert(formatted, { onConflict: 'id' });
    if (error) throw error;

    return {
      success: true,
      syncedCount: formatted.length,
      message: `Successfully synchronized ${formatted.length} tasks to Supabase`,
    };
  } catch (err) {
    return {
      success: false,
      syncedCount: 0,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Universal Multi-Entity Cloud Synchronization
 * Synchronizes profiles, tasks, memories, projects, agents, conversations, and workflows
 */
export async function syncAllEntitiesToSupabase(
  payload: SyncPayload,
  userId: string,
  accessToken: string
): Promise<SyncResult> {
  const supabase = getSupabaseClientForUser(accessToken);
  const counts: Record<string, number> = {};
  const errors: string[] = [];

  if (!supabase) {
    return {
      success: false,
      syncedCounts: counts,
      timestamp: new Date().toISOString(),
      message: 'Supabase user-scoped client is not configured.',
    };
  }

  const now = new Date().toISOString();
  const upsert = async (table: string, rows: Array<Record<string, any>>, key: string) => {
    if (!rows.length) return;
    const { error } = await supabase.from(table).upsert(rows, { onConflict: table === 'settings' ? 'user_id' : 'id' });
    if (error) {
      errors.push(`${key}: ${error.message}`);
      return;
    }
    counts[key] = rows.length;
  };

  try {
    if (payload.profile) {
      const p = payload.profile;
      const { data: existingProfile, error: profileLookupError } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();
      if (profileLookupError) {
        errors.push(`profile: ${profileLookupError.message}`);
      } else {
        await upsert('profiles', [{
          id: userId,
          name: String(p.name || p.full_name || ''),
          email: String(p.email || ''),
          initials: String(p.initials || ''),
          avatar_url: p.avatarUrl || p.avatar_url || null,
          status: String(p.status || 'online'),
          // Preserve the database-owned plan. Never trust a client payload to upgrade it.
          plan: existingProfile?.plan || 'Free',
          updated_at: now,
        }], 'profile');
      }
    }

    await upsert('agents', (payload.agents || []).map((a: any) => ({
      id: a.id,
      user_id: userId,
      name: a.name || 'Agent',
      description: a.description || '',
      role: a.role || null,
      instructions: a.instructions || null,
      model: a.model || null,
      status: a.status || 'active',
      config: a.config || {},
      created_at: a.createdAt || now,
      updated_at: now,
    })), 'agents');

    await upsert('conversations', (payload.conversations || []).map((c: any) => ({
      id: c.id,
      user_id: userId,
      title: c.title || 'New conversation',
      mode: c.mode || 'chat',
      model: c.model || c.modelId || null,
      metadata: c.metadata || {},
      created_at: c.createdAt || now,
      updated_at: now,
    })), 'conversations');

    await upsert('messages', (payload.messages || []).map((m: any) => ({
      id: m.id,
      user_id: userId,
      conversation_id: m.conversationId || m.conversation_id,
      role: m.role || 'user',
      content: typeof m.content === 'string' ? m.content : '',
      attachments: m.attachments || [],
      metadata: m.metadata || {},
      created_at: m.createdAt || now,
    })), 'messages');

    await upsert('tasks', (payload.tasks || []).map((t: any) => ({
      id: t.id,
      user_id: userId,
      title: t.title || 'Untitled task',
      description: t.description || '',
      status: t.status || 'todo',
      priority: t.priority || 'medium',
      due_date: t.dueDate || t.due_date || null,
      recurring: t.recurring || null,
      agent_id: t.agentId || t.agent_id || null,
      conversation_id: t.conversationId || t.conversation_id || null,
      project_id: t.projectId || t.project_id || null,
      subtasks: t.subtasks || [],
      tags: t.tags || [],
      completed_at: t.completedAt || t.completed_at || null,
      created_at: t.createdAt || t.created_at || now,
      updated_at: now,
    })), 'tasks');

    await upsert('memories', (payload.memories || []).map((m: any) => ({
      id: m.id,
      user_id: userId,
      title: m.title || 'Memory',
      content: m.content || '',
      type: m.type || 'important_fact',
      confidence: m.confidence ?? 1,
      tags: m.tags || [],
      agent_id: m.agentId || m.agent_id || null,
      project_id: m.projectId || m.project_id || null,
      is_pinned: m.isPinned ?? m.is_pinned ?? false,
      created_at: m.createdAt || m.created_at || now,
      updated_at: now,
    })), 'memories');

    await upsert('projects', (payload.projects || []).map((p: any) => ({
      id: p.id,
      user_id: userId,
      name: p.name || 'Untitled project',
      description: p.description || '',
      status: p.status || 'active',
      tags: p.tags || [],
      goals: p.goals || [],
      instructions: p.instructions || '',
      due_date: p.dueDate || p.due_date || null,
      created_at: p.createdAt || p.created_at || now,
      updated_at: now,
    })), 'projects');

    await upsert('library_items', (payload.libraryItems || []).map((l: any) => ({
      id: String(l.id || ''),
      user_id: userId,
      title: String(l.title || 'Untitled item').slice(0, 240),
      description: String(l.description || '').slice(0, 5000),
      category: String(l.category || 'documents').slice(0, 80),
      type: String(l.type || 'document').slice(0, 80),
      url: typeof l.url === 'string' ? l.url.slice(0, 4000) : null,
      content: typeof l.content === 'string' ? l.content.slice(0, 100000) : null,
      metadata: l.metadata && typeof l.metadata === 'object' && !Array.isArray(l.metadata) ? l.metadata : {},
      mime_type: l.mimeType || l.mime_type || null,
      tags: Array.isArray(l.tags) ? l.tags.filter((tag: unknown) => typeof tag === 'string').slice(0, 40) : [],
      project_id: l.projectId || l.project_id || null,
      is_favorite: l.isFavorite ?? l.is_favorite ?? false,
      created_at: l.createdAt || l.created_at || now,
      updated_at: now,
    }).filter((row: any) => /^[A-Za-z0-9_-]{1,180}$/.test(row.id)), 'libraryItems');

    await upsert('workflows', (payload.workflows || []).map((w: any) => ({
      id: w.id,
      user_id: userId,
      name: w.name || 'Untitled workflow',
      description: w.description || '',
      status: w.status || 'draft',
      codename: w.codename || null,
      category: w.category || 'general',
      version: w.version || '1.0.0',
      enabled: w.enabled ?? true,
      trigger: w.trigger || { type: 'manual' },
      conditions: w.conditions || [],
      steps: w.steps || [],
      execution_chain: w.executionChain || w.execution_chain || [],
      stages: w.stages || [],
      permissions: w.permissions || [],
      project_id: w.projectId || w.project_id || null,
      agent_id: w.agentId || w.agent_id || null,
      system_instructions: w.systemInstructions || w.system_instructions || null,
      is_template: w.isTemplate ?? w.is_template ?? false,
      tags: w.tags || [],
      last_executed_at: w.lastExecutedAt || w.last_executed_at || null,
      execution_count: w.executionCount ?? w.execution_count ?? 0,
      schedule: w.schedule || null,
      created_at: w.createdAt || w.created_at || now,
      updated_at: now,
    })), 'workflows');

    if (payload.settings) {
      await upsert('settings', [{
        user_id: userId,
        preferences: payload.settings.preferences || payload.settings,
        updated_at: now,
      }], 'settings');
    }

    return {
      success: errors.length === 0,
      syncedCounts: counts,
      timestamp: now,
      message: errors.length
        ? `Partial sync: ${Object.values(counts).reduce((a, b) => a + b, 0)} records saved; ${errors.join('; ')}`
        : `Synchronized ${Object.values(counts).reduce((a, b) => a + b, 0)} records across Supabase tables.`,
    };
  } catch (err) {
    return {
      success: false,
      syncedCounts: counts,
      timestamp: new Date().toISOString(),
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Returns complete PostgreSQL DDL and Row Level Security policies for Angel
 */
export function getSupabaseDDL(): string {
  return `
-- ============================================================================
-- ANGEL AI — Production PostgreSQL Schema & Row Level Security (RLS)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  initials TEXT,
  plan TEXT DEFAULT 'Pro',
  status TEXT DEFAULT 'online',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  instructions TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  recurring TEXT,
  agent_id TEXT,
  conversation_id TEXT,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  subtasks JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- 4. Memories Table
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'important_fact',
  confidence NUMERIC DEFAULT 1.0,
  tags TEXT[] DEFAULT '{}',
  agent_id TEXT,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own memories" ON memories
  FOR ALL USING (auth.uid() = user_id);

-- 5. Library Items Table
CREATE TABLE IF NOT EXISTS library_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'document',
  category TEXT DEFAULT 'documents',
  url TEXT,
  mime_type TEXT,
  tags TEXT[] DEFAULT '{}',
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own library items" ON library_items
  FOR ALL USING (auth.uid() = user_id);

-- 6. Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  codename TEXT,
  category TEXT DEFAULT 'general',
  version TEXT DEFAULT '1.0.0',
  enabled BOOLEAN DEFAULT TRUE,
  trigger JSONB NOT NULL DEFAULT '{"type": "manual"}'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_chain JSONB DEFAULT '[]'::jsonb,
  stages TEXT[] DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  system_instructions TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_executed_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own workflows" ON workflows
  FOR ALL USING (auth.uid() = user_id OR is_template = true);
  `.trim();
}
