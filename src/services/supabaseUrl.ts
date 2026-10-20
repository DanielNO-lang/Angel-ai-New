/**
 * Canonicalizes a Supabase project URL before it is passed to supabase-js.
 * API REST endpoints may end in /rest/v1, but createClient requires the
 * project base URL (for example https://<project>.supabase.co).
 */
export function normalizeSupabaseProjectUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';

  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';

    if (/\/rest\/v1\/?$/i.test(url.pathname)) {
      url.pathname = '';
    } else {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}
