export interface BrowserWorkerResponse {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
}

export function getBrowserWorkerStatus(): { configured: boolean; reason?: string } {
  const rawUrl = process.env.ANGEL_BROWSER_WORKER_URL || '';
  const secret = process.env.ANGEL_BROWSER_WORKER_SECRET || '';
  if (!rawUrl || !secret) return { configured: false, reason: 'The isolated browser worker URL and server-only secret are not configured.' };
  try {
    const url = new URL(rawUrl);
    if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
      return { configured: false, reason: 'The browser worker URL must be a clean HTTPS origin without credentials, query, fragment, or path.' };
    }
    const localHttp = process.env.NODE_ENV !== 'production' && url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localHttp) return { configured: false, reason: 'The browser worker must use HTTPS.' };
    return { configured: true };
  } catch {
    return { configured: false, reason: 'The browser worker URL is invalid.' };
  }
}

export async function callBrowserWorker(path: string, init: { method?: 'GET'|'POST'|'DELETE'; body?: Record<string, unknown>; timeoutMs?: number } = {}): Promise<BrowserWorkerResponse> {
  const status = getBrowserWorkerStatus();
  if (!status.configured) return { ok: false, status: 503, data: { error: status.reason || 'Browser worker is not configured.' } };
  const base = new URL(process.env.ANGEL_BROWSER_WORKER_URL!);
  const url = new URL(path.replace(/^\/+/, ''), base.href.endsWith('/') ? base.href : base.href + '/');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(30000, Math.max(1000, init.timeoutMs || 20000)));
  try {
    const response = await fetch(url, {
      method: init.method || 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.ANGEL_BROWSER_WORKER_SECRET!,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      redirect: 'error',
      signal: controller.signal,
    });
    const raw = await response.text();
    let data: Record<string, unknown> = {};
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) data = parsed as Record<string, unknown>;
    } catch {
      data = { error: 'The browser worker returned an invalid response.' };
    }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError'
      ? 'Browser worker request timed out.'
      : 'Browser worker is unreachable. Check its deployment and network access.';
    return { ok: false, status: 503, data: { error: reason } };
  } finally {
    clearTimeout(timeout);
  }
}
