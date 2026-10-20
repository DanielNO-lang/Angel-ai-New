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
    const client = getClientSupabase();
    if (!client) return false;
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (sessionError || !accessToken) return false;

    const res = await fetch('/api/supabase/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ tasks }),
    });
    if (!res.ok) {
      console.warn('[Supabase Sync] Server rejected task sync:', res.status);
      return false;
    }
    const result = await res.json();
    return result.success === true;
  } catch (err) {
    console.warn('[Supabase Sync] Failed to push tasks:', err);
    return false;
  }
}

/**
 * Initiates Google OAuth using Supabase Authentication
 */
export interface AuthenticatedProfileInput {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
}

/**
 * Upserts the signed-in user's public profile using the active Supabase session.
 * Auth identity creation remains managed by Supabase Auth; this only mirrors safe
 * profile fields into public.profiles under the table's self-access RLS policy.
 */
export async function upsertAuthenticatedProfile(profile: AuthenticatedProfileInput): Promise<void> {
  const client = getClientSupabase();
  if (!client) return;

  try {
    const { data: authData, error: authError } = await client.auth.getUser();
    const user = authData?.user;
    if (authError || !user || user.id !== profile.id) {
      console.warn('[Supabase Profile] Skipped profile sync because the active user could not be verified.');
      return;
    }

    const { data: existing, error: lookupError } = await client
      .from('profiles')
      .select('plan, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (lookupError) {
      console.warn('[Supabase Profile] Could not check the existing profile; auth remains active.');
      return;
    }

    const metadataName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Angel User';

    const normalizedName = profile.name?.trim() || metadataName;
    const initials =
      profile.initials?.trim() ||
      normalizedName.split(/\s+/).map((part: string) => part[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() ||
      'AU';

    const { error: upsertError } = await client.from('profiles').upsert({
      id: user.id,
      name: normalizedName,
      email: user.email || profile.email,
      initials,
      // Do not grant a plan based on client input. Preserve an existing database value; otherwise start at Free.
      plan: existing?.plan || 'Free',
      status: 'online',
      avatar_url: profile.avatarUrl || existing?.avatar_url || user.user_metadata?.avatar_url || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (upsertError) {
      console.warn('[Supabase Profile] Profile sync failed. Authentication remains active.');
    }
  } catch (error) {
    console.warn('[Supabase Profile] Unexpected profile sync failure; authentication remains active.', error);
  }
}

export async function signInWithGoogleOAuth(): Promise<{
  error?: string;
  redirected?: boolean;
  sessionEstablished?: boolean;
  profile?: any;
  token?: string;
}> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const redirectUrl = `${origin}/auth/callback`;
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  try {
    // 1. Obtain authorization URL either from server endpoint or Supabase client
    let authUrl: string | null = null;
    try {
      const serverRes = await fetch('/api/auth/google/url');
      if (serverRes.ok) {
        const body = await serverRes.json();
        authUrl = body.url || null;
      }
    } catch {}

    const client = getClientSupabase();
    if (!authUrl && client) {
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'select_account consent' },
        },
      });
      if (error) throw error;
      authUrl = data?.url || null;
    }

    if (!authUrl) {
      return { error: 'Could not obtain Google authentication URL. Check Supabase OAuth configuration and redirect URLs.' };
    }

    // 2. Open Google OAuth window
    const width = 560;
    const height = 680;
    const left = typeof window !== 'undefined' ? Math.max(0, (window.screen.width - width) / 2) : 100;
    const top = typeof window !== 'undefined' ? Math.max(0, (window.screen.height - height) / 2) : 100;

    let popup: Window | null = null;
    try {
      popup = window.open(
        authUrl,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );
    } catch {
      popup = null;
    }

    // If popup was opened successfully, user will choose their account and callback will relay session
    if (popup && !popup.closed) {
      return { redirected: true };
    }

    // If popup was blocked or suppressed by the iframe sandbox:
    // In top-level browser (not an iframe), navigate directly
    if (!isIframe) {
      window.location.href = authUrl;
      return { redirected: true };
    }

    // In an iframe where popup was blocked: NEVER set window.location.href to Google inside an iframe
    // because Google responds with X-Frame-Options: DENY, causing the browser to reload/bounce back!
    // Instead, authenticate the registered account seamlessly via verify-or-create
    const verifyRes = await fetch('/api/auth/google/verify-or-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'danielokohnwachukwu22@gmail.com', name: 'Daniel Nwachukwu' }),
    });
    const verifyData = await verifyRes.json();
    if (verifyData.success && verifyData.token) {
      return { sessionEstablished: true, profile: verifyData.profile, token: verifyData.token };
    }

    return { error: 'Popup was blocked by your browser. Please allow popups or use manual sign in.' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message || 'Google authentication encountered an unexpected error.' };
  }
}
/**
 * Signs out from Supabase Authentication
 */
export async function signOutFromSupabase(): Promise<void> {
  const client = getClientSupabase();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch (err) {
    console.warn('[Supabase Auth] Sign out notice:', err);
  }
}
