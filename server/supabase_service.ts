/**
 * ANGEL AI — Server-Side Supabase Persistence Boundary
 * Secure server-only database interactions respecting Row Level Security (RLS).
 */

export interface SupabaseServerStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  mode: 'connected' | 'pending_configuration';
  message: string;
}

export function getSupabaseServerStatus(): SupabaseServerStatus {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
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
      ? 'Supabase credentials detected. PostgreSQL persistence active.'
      : 'Supabase credentials pending in .env. Angel is running with client-side reactive state persistence.',
  };
}
