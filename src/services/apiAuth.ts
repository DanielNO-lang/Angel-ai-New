/**
 * ANGEL AI — Same-origin API authentication bridge.
 *
 * Attach the current Supabase access token to same-origin /api requests so
 * verified-user and administrator routes can authenticate the active account.
 * Guests have no Supabase session and continue to call public/guest-safe routes
 * without an Authorization header. Never forward tokens to another origin.
 */

import { getClientSupabase } from './supabaseService';

let installed = false;

async function currentSupabaseToken(): Promise<string | null> {
  try {
    const client = getClientSupabase();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) return null;
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function isSameOriginApi(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin &&
      (parsed.pathname === '/api' || parsed.pathname.startsWith('/api/'));
  } catch {
    return false;
  }
}

export function installApiAuth(): void {
  if (installed || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

      if (isSameOriginApi(url)) {
        // Preserve headers from both a Request input and a RequestInit override.
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        if (init?.headers) {
          new Headers(init.headers).forEach((value, key) => headers.set(key, value));
        }

        // Respect explicit caller credentials; only fill in a missing header.
        if (!headers.has('Authorization')) {
          const token = await currentSupabaseToken();
          if (token) {
            headers.set('Authorization', 'Bearer ' + token);
            return originalFetch(input, { ...init, headers });
          }
        }
      }
    } catch {
      // Authentication plumbing must never prevent a normal request from running.
    }

    return originalFetch(input, init);
  };
}
