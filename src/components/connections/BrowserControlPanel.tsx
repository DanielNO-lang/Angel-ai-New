import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Globe, LoaderCircle, Lock, Play, Plus, RefreshCw, ShieldCheck, Square, Trash2, X } from 'lucide-react';
import { getClientSupabase } from '../../services/supabaseService';

type BrowserGrant = { id: string; host: string; scopes: string[]; created_at?: string };
type BrowserSession = { id: string; start_url: string; current_url: string; approved_hosts: string[]; status: string; created_at: string; last_activity_at: string; expires_at: string };
type BrowserEvent = { id: string; action_kind: string; target_host?: string; status: string; message?: string; created_at: string };
type BrowserStatus = { configured: boolean; workerConfigured: boolean; persistenceConfigured: boolean; reason?: string; supportedActions: string[]; unsupportedActions: string[] };
type PreparedAction = { challengeId: string; actionId: string; kind: string; host: string; targetUrl: string; requiresConfirmation: boolean; expiresAt: string; summary: string };
type ActionKind = 'navigate' | 'read_page' | 'click' | 'fill_form' | 'submit_form' | 'screenshot';

const availableScopes = [
  { value: 'browser:read', label: 'Read pages' },
  { value: 'browser:interact', label: 'Interact with page elements' },
  { value: 'browser:submit', label: 'Submit forms (confirmation required)' },
];

export const BrowserControlPanel: React.FC<{ isLight: boolean; isGuest: boolean }> = ({ isLight, isGuest }) => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<BrowserStatus | null>(null);
  const [grants, setGrants] = useState<BrowserGrant[]>([]);
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [events, setEvents] = useState<BrowserEvent[]>([]);
  const [host, setHost] = useState('');
  const [scopes, setScopes] = useState<string[]>(['browser:read']);
  const [startUrl, setStartUrl] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [kind, setKind] = useState<ActionKind>('read_page');
  const [actionUrl, setActionUrl] = useState('');
  const [selector, setSelector] = useState('');
  const [value, setValue] = useState('');
  const [pending, setPending] = useState<PreparedAction | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const card = isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-neutral-900/60';
  const field = `w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-indigo-500 ${isLight ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-white/10 bg-neutral-950 text-neutral-100'}`;
  const muted = isLight ? 'text-slate-500' : 'text-neutral-400';
  const selectedSession = useMemo(() => sessions.find((item) => item.id === selectedSessionId && item.status === 'active') || null, [sessions, selectedSessionId]);

  useEffect(() => {
    const client = getClientSupabase();
    if (!client) return;
    let alive = true;
    void client.auth.getSession().then(({ data }) => { if (alive) setToken(data.session?.access_token || ''); });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setToken(session?.access_token || '');
      setGrants([]); setSessions([]); setEvents([]); setPending(null); setResult(null);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!token) throw new Error('Sign in to use browser control.');
    const response = await fetch(path, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: 'Bearer ' + token, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    const data: any = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : `Request failed (${response.status}).`);
    return data;
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token || isGuest) return;
    setBusy(true); setError('');
    try {
      const results = await Promise.all([
        api('/api/browser/status'),
        api('/api/browser/grants'),
        api('/api/browser/sessions'),
        api('/api/browser/audit?limit=20'),
      ]);
      setStatus(results[0] as BrowserStatus);
      setGrants(Array.isArray(results[1].grants) ? results[1].grants : []);
      setSessions(Array.isArray(results[2].sessions) ? results[2].sessions : []);
      setEvents(Array.isArray(results[3].events) ? results[3].events : []);
      if (!selectedSessionId) {
        const first = (results[2].sessions as BrowserSession[] | undefined)?.find((item) => item.status === 'active');
        if (first) setSelectedSessionId(first.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load browser-control status.');
    } finally { setBusy(false); }
  }, [token, isGuest, api, selectedSessionId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addGrant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !host.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await api('/api/browser/grants', { method: 'POST', body: JSON.stringify({ host: host.trim(), scopes }) });
      setHost(''); setNotice('Host permission saved. New sessions will use the updated grant.');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save host permission.'); }
    finally { setBusy(false); }
  };

  const revokeGrant = async (grant: BrowserGrant) => {
    if (!window.confirm(`Revoke Angel's browser permission for ${grant.host}?`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await api('/api/browser/grants/' + encodeURIComponent(grant.id), { method: 'DELETE' });
      setNotice(`Permission revoked for ${grant.host}. Existing sessions cannot start new actions on that host.`);
      setPending(null); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not revoke the permission.'); }
    finally { setBusy(false); }
  };

  const startSession = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !startUrl.trim()) return;
    setBusy(true); setError(''); setNotice(''); setResult(null);
    try {
      const data = await api('/api/browser/sessions', { method: 'POST', body: JSON.stringify({ startUrl: startUrl.trim() }) });
      const session = data.session as BrowserSession;
      setSessions((old) => [session, ...old.filter((item) => item.id !== session.id)]);
      setSelectedSessionId(session.id); setActionUrl(session.current_url);
      setStartUrl(''); setNotice('Isolated browser session started. Only the granted hosts are available to this session.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not start browser session.'); }
    finally { setBusy(false); }
  };

  const prepareAction = async () => {
    if (!selectedSession || busy) return;
    setBusy(true); setError(''); setNotice(''); setResult(null);
    try {
      const body: Record<string, unknown> = { kind };
      if (kind === 'navigate') body.url = actionUrl.trim();
      if (kind === 'click' || kind === 'fill_form' || kind === 'submit_form') body.selector = selector.trim();
      if (kind === 'fill_form') body.value = value;
      const data = await api(`/api/browser/sessions/${encodeURIComponent(selectedSession.id)}/prepare`, { method: 'POST', body: JSON.stringify(body) });
      setPending(data as PreparedAction);
      setNotice((data as PreparedAction).requiresConfirmation
        ? 'Review the action summary carefully. Nothing has happened yet.'
        : 'Action prepared and permission-checked. Nothing has happened yet.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not prepare the browser action.'); }
    finally { setBusy(false); }
  };

  const executePending = async (confirmed: boolean) => {
    if (!selectedSession || !pending || busy) return;
    setBusy(true); setError(''); setNotice(''); setResult(null);
    try {
      const body: Record<string, unknown> = { challengeId: pending.challengeId, kind: pending.kind, confirmed };
      if (kind === 'navigate') body.url = actionUrl.trim();
      if (kind === 'click' || kind === 'fill_form' || kind === 'submit_form') body.selector = selector.trim();
      if (kind === 'fill_form') body.value = value;
      const data = await api(`/api/browser/sessions/${encodeURIComponent(selectedSession.id)}/execute`, { method: 'POST', body: JSON.stringify(body) });
      const nextResult = data.result as Record<string, unknown>;
      setResult(nextResult);
      if (typeof nextResult.url === 'string') {
        setActionUrl(nextResult.url);
        setSessions((old) => old.map((item) => item.id === selectedSession.id ? { ...item, current_url: nextResult.url as string, last_activity_at: new Date().toISOString() } : item));
      }
      setPending(null);
      setNotice(typeof data.message === 'string' ? data.message : 'Browser action finished.');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Browser action failed.'); }
    finally { setBusy(false); }
  };

  const closeSession = async (session: BrowserSession) => {
    setBusy(true); setError('');
    try {
      await api(`/api/browser/sessions/${encodeURIComponent(session.id)}/close`, { method: 'POST', body: '{}' });
      setSessions((old) => old.map((item) => item.id === session.id ? { ...item, status: 'closed' } : item));
      if (selectedSessionId === session.id) { setSelectedSessionId(''); setPending(null); }
      setNotice('Browser session closed.');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not close browser session.'); }
    finally { setBusy(false); }
  };

  if (isGuest || !token) {
    return <div className={`rounded-2xl border p-5 ${card}`}><div className="flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4 text-indigo-400" /> Browser control is for signed-in accounts</div><p className={`mt-2 text-xs ${muted}`}>Sign in to create host-specific grants and isolated sessions. Guest mode remains local and cannot start browser automation.</p></div>;
  }

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${card}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-indigo-400" /><div><h3 className="text-sm font-semibold">Controlled browser</h3><p className={`mt-1 text-xs ${muted}`}>Angel only acts on exact hostnames you approve. Consequential clicks require a separate confirmation.</p></div></div>
          <button onClick={() => void refresh()} disabled={busy} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs ${isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-white/10 hover:bg-white/5'}`}><RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
        {status && <div className={`rounded-xl border p-3 text-xs ${status.configured ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-300' : 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300'}`}>
          <div className="flex items-center gap-2 font-semibold">{status.configured ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{status.configured ? 'Browser worker ready' : 'Browser worker not ready'}</div>
          {status.reason && <p className="mt-1">{status.reason}</p>}
          {!status.workerConfigured && <p className="mt-1">Deploy the isolated service in <code>browser-worker/</code>, then configure server-only <code>ANGEL_BROWSER_WORKER_URL</code> and <code>ANGEL_BROWSER_WORKER_SECRET</code>. Do not put either secret in a Vite variable.</p>}
          {!status.persistenceConfigured && <p className="mt-1">The browser-control migration must be applied to the approved Supabase environment.</p>}
        </div>}
        {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-500">{error}</div>}
        {notice && <div role="status" className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-500">{notice}</div>}
      </div>

      <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${card}`}>
        <h4 className="text-xs font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-indigo-400" /> Approved host permissions</h4>
        <p className={`text-xs ${muted}`}>Use one exact hostname, such as <code>docs.example.com</code>. Wildcards, local/private addresses, credential entry, and operating-system control are blocked.</p>
        <form onSubmit={addGrant} className="space-y-3">
          <input className={field} value={host} onChange={(event) => setHost(event.target.value)} placeholder="docs.example.com" aria-label="Exact hostname" required maxLength={253} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {availableScopes.map((scope) => <label key={scope.value} className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${isLight ? 'border-slate-200' : 'border-white/10'}`}><input type="checkbox" checked={scopes.includes(scope.value)} disabled={scope.value === 'browser:read'} onChange={(event) => setScopes((current) => event.target.checked ? [...current, scope.value] : current.filter((item) => item !== scope.value))} /><span>{scope.label}</span></label>)}
          </div>
          <button disabled={busy || !host.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" /> Save host permissions</button>
        </form>
        {grants.length === 0 ? <p className={`text-xs ${muted}`}>No host permissions saved yet.</p> : <div className="space-y-2">{grants.map((grant) => <div key={grant.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}><div className="min-w-0"><p className="truncate text-xs font-semibold">{grant.host}</p><p className={`mt-1 text-[11px] ${muted}`}>{grant.scopes.join(' · ')}</p></div><button onClick={() => void revokeGrant(grant)} disabled={busy} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Revoke</button></div>)}</div>}
      </div>

      <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${card}`}>
        <div><h4 className="text-xs font-semibold">Start a controlled session</h4><p className={`mt-1 text-xs ${muted}`}>Start with an approved hostname. Sessions are isolated and expire automatically.</p></div>
        <form onSubmit={startSession} className="flex flex-col sm:flex-row gap-2"><input className={field} value={startUrl} onChange={(event) => setStartUrl(event.target.value)} placeholder="https://docs.example.com/" type="url" required maxLength={2048} /><button disabled={busy || !startUrl.trim() || !status?.configured} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><Play className="h-4 w-4" /> Start session</button></form>
        {sessions.length > 0 && <div className="space-y-2">{sessions.slice(0, 8).map((session) => <div key={session.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}><button onClick={() => { setSelectedSessionId(session.id); setActionUrl(session.current_url); setPending(null); setResult(null); }} className="min-w-0 flex-1 text-left"><p className="truncate text-xs font-semibold">{session.current_url}</p><p className={`mt-1 text-[11px] ${muted}`}>{session.status} · expires {new Date(session.expires_at).toLocaleTimeString()}</p></button>{session.status === 'active' && <button onClick={() => void closeSession(session)} disabled={busy} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10"><Square className="h-3.5 w-3.5" /> Stop</button>}</div>)}</div>}
      </div>

      {selectedSession && <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${card}`}>
        <div className="flex items-center justify-between gap-3"><div><h4 className="text-xs font-semibold">Session actions</h4><p className={`mt-1 text-xs ${muted}`}>Current page: <a href={selectedSession.current_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{selectedSession.current_url}<ExternalLink className="ml-1 inline h-3 w-3" /></a></p></div><span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[10px] text-emerald-500">Isolated</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1.5 text-xs"><span>Action</span><select className={field} value={kind} onChange={(event) => { setKind(event.target.value as ActionKind); setPending(null); }}><option value="read_page">Read page</option><option value="navigate">Navigate to URL</option><option value="screenshot">Capture screenshot</option><option value="click">Click element (confirmation)</option><option value="fill_form">Fill ordinary field</option><option value="submit_form">Submit form (confirmation)</option></select></label>
          {kind === 'navigate' && <label className="space-y-1.5 text-xs"><span>Target URL</span><input className={field} value={actionUrl} onChange={(event) => setActionUrl(event.target.value)} placeholder="https://docs.example.com/page" /></label>}
          {(kind === 'click' || kind === 'fill_form' || kind === 'submit_form') && <label className="space-y-1.5 text-xs"><span>CSS selector</span><input className={field} value={selector} onChange={(event) => { setSelector(event.target.value); setPending(null); }} placeholder='button[type="submit"]' maxLength={500} /></label>}
          {kind === 'fill_form' && <label className="space-y-1.5 text-xs"><span>Field value (never used for passwords or secrets)</span><input className={field} value={value} onChange={(event) => { setValue(event.target.value); setPending(null); }} maxLength={10000} /></label>}
        </div>
        <div className="flex flex-wrap items-center gap-2"><button onClick={() => void prepareAction()} disabled={busy || (kind === 'navigate' && !actionUrl.trim()) || (['click','fill_form','submit_form'].includes(kind) && !selector.trim())} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? <LoaderCircle className="mr-2 inline h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 inline h-3.5 w-3.5" />}Prepare action</button>{pending && <button onClick={() => setPending(null)} disabled={busy} className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs ${isLight ? 'border-slate-200' : 'border-white/10'}`}><X className="h-3.5 w-3.5" /> Discard</button>}</div>
        {pending && <div className={`rounded-xl border p-3 space-y-3 ${pending.requiresConfirmation ? 'border-amber-500/40 bg-amber-500/5' : isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20'}`}><div className="flex items-start gap-2">{pending.requiresConfirmation ? <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" /> : <ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-400" />}<div><p className="text-xs font-semibold">{pending.requiresConfirmation ? 'Confirmation required' : 'Review prepared action'}</p><p className={`mt-1 text-xs ${muted}`}>{pending.summary}</p><p className={`mt-1 text-[11px] ${muted}`}>One-time approval expires {new Date(pending.expiresAt).toLocaleTimeString()}. Page content cannot grant permissions.</p></div></div><div className="flex flex-wrap gap-2"><button onClick={() => void executePending(pending.requiresConfirmation)} disabled={busy} className={`rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 ${pending.requiresConfirmation ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>{pending.requiresConfirmation ? 'Confirm and run' : 'Run action'}</button><button onClick={() => setPending(null)} disabled={busy} className={`rounded-xl border px-3 py-2.5 text-xs ${isLight ? 'border-slate-200' : 'border-white/10'}`}>Cancel</button></div></div>}
        {result && <div className={`rounded-xl border p-3 space-y-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}><p className="text-xs font-semibold">Verified worker response</p>{typeof result.image === 'string' && <img className="max-h-96 w-full rounded-lg object-contain" alt="Screenshot captured from the active browser session" src={`data:image/jpeg;base64,${result.image}`} />}{typeof result.title === 'string' && <p className="text-xs font-medium">{result.title}</p>}{typeof result.url === 'string' && <p className={`break-all text-[11px] ${muted}`}>{result.url}</p>}{typeof result.text === 'string' && <pre className={`max-h-72 overflow-auto whitespace-pre-wrap rounded-lg p-3 text-xs ${isLight ? 'bg-slate-50' : 'bg-black/30'}`}>{result.text}</pre>}{result.filled === true && <p className="text-xs">Field filled. Review the page before taking another action.</p>}</div>}
      </div>}

      <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${card}`}><h4 className="text-xs font-semibold">Recent browser activity</h4>{events.length === 0 ? <p className={`text-xs ${muted}`}>No browser actions recorded yet.</p> : <div className="space-y-2">{events.slice(0, 10).map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2"><div><p className="text-xs font-medium">{event.action_kind} {event.target_host ? `· ${event.target_host}` : ''}</p><p className={`mt-1 text-[11px] ${muted}`}>{event.message || event.status}</p></div><span className={`text-[10px] ${event.status === 'failed' || event.status === 'denied' ? 'text-red-500' : 'text-emerald-500'}`}>{event.status}</span></div>)}</div>}</div>
      <p className={`text-[11px] leading-relaxed ${muted}`}>Limits: sessions are temporary; uploads, downloads, credential entry, purchases, destructive actions, and operating-system control are not enabled. Browser control is an approved-site interaction tool, not unrestricted remote desktop access.</p>
    </div>
  );
};
