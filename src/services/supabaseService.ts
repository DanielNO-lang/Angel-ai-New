/**
 * ANGEL AI — Client-Side Supabase Service & Real-Time Velocity Engine
 * Handles real-time subscriptions, velocity calculations, and Supabase synchronization.
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Task } from '../types';

export interface VelocityMetrics {
  total: number;
  completed: number;
  inProgress: number;
  review: number;
  todo: number;
  cancelled: number;
  completionRate: number; // 0 - 100
  velocityScore: number; // 0 - 100
  velocityRating: 'Optimal' | 'High' | 'Steady' | 'Ramping Up' | 'Initial';
  weeklyVelocity: number;
  burnDownRate: string;
  estimatedDaysToCompletion: number;
  isSupabaseConnected: boolean;
  dataSource: 'supabase_live' | 'workspace_synced';
  lastSyncedAt: string;
  tasksCount: number;
}

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const supabaseKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  '';

let clientInstance: SupabaseClient | null = null;

export function getClientSupabase(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  if (supabaseUrl && supabaseKey && supabaseUrl.length > 5 && supabaseKey.length > 5) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseKey);
      return clientInstance;
    } catch (err) {
      console.warn('[Supabase Client] Failed to create instance:', err);
      return null;
    }
  }
  return null;
}

/**
 * Calculates local velocity metrics when offline or as immediate feedback
 */
export function calculateLocalVelocity(
  tasks: Task[],
  isSupabaseConnected = false
): VelocityMetrics {
  const total = tasks.length;
  let completed = 0;
  let inProgress = 0;
  let review = 0;
  let todo = 0;
  let cancelled = 0;
  let weeklyVelocity = 0;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const t of tasks) {
    const st = (t.status || 'todo').toLowerCase();
    if (st === 'completed') {
      completed++;
      const completedTime = t.completedAt ? new Date(t.completedAt).getTime() : 0;
      if (completedTime >= oneWeekAgo || !t.completedAt) {
        weeklyVelocity++;
      }
    } else if (st === 'in_progress') {
      inProgress++;
    } else if (st === 'review') {
      review++;
    } else if (st === 'cancelled') {
      cancelled++;
    } else {
      todo++;
    }
  }

  const activePool = total - cancelled;
  const completionRate = activePool > 0 ? Math.round((completed / activePool) * 100) : 0;

  const inProgressWeight = inProgress * 0.4;
  const reviewWeight = review * 0.7;
  const effectiveProgress = completed + inProgressWeight + reviewWeight;
  const velocityScore =
    activePool > 0 ? Math.min(100, Math.round((effectiveProgress / activePool) * 100)) : 0;

  let velocityRating: 'Optimal' | 'High' | 'Steady' | 'Ramping Up' | 'Initial';
  if (velocityScore >= 80) velocityRating = 'Optimal';
  else if (velocityScore >= 60) velocityRating = 'High';
  else if (velocityScore >= 35) velocityRating = 'Steady';
  else if (velocityScore > 10) velocityRating = 'Ramping Up';
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
    isSupabaseConnected,
    dataSource: isSupabaseConnected ? 'supabase_live' : 'workspace_synced',
    lastSyncedAt: new Date().toISOString(),
    tasksCount: total,
  };
}

/**
 * Fetches real-time completion status and velocity from the server / Supabase
 */
export async function fetchTasksVelocityFromSupabase(
  workspaceTasks: Task[] = []
): Promise<VelocityMetrics> {
  try {
    const res = await fetch('/api/supabase/velocity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks: workspaceTasks }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data: VelocityMetrics = await res.json();
    return data;
  } catch (err) {
    console.debug('[Supabase Service] Server endpoint unavailable, using reactive fallback:', err);
    return calculateLocalVelocity(workspaceTasks, false);
  }
}

/**
 * Subscribes to Supabase postgres_changes on public:tasks if client is connected
 */
export function subscribeToSupabaseTasks(onUpdate: () => void): () => void {
  const client = getClientSupabase();
  if (!client) {
    return () => {};
  }

  let channel: RealtimeChannel | null = null;
  try {
    channel = client
      .channel('tasks-velocity-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.debug('[Supabase Realtime] Task change detected:', payload);
          onUpdate();
        }
      )
      .subscribe((status) => {
        console.debug('[Supabase Realtime] Channel status:', status);
      });
  } catch (err) {
    console.warn('[Supabase Realtime] Subscription error:', err);
  }

  return () => {
    if (channel && client) {
      client.removeChannel(channel);
    }
  };
}

/**
 * Pushes tasks to Supabase
 */
export async function pushTasksToSupabase(tasks: Task[]): Promise<boolean> {
  try {
    const res = await fetch('/api/supabase/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Supabase Sync] Failed to push tasks:', err);
    return false;
  }
}
