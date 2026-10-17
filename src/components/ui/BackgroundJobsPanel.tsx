import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, CheckCircle2, Clock3, LoaderCircle, Play, XCircle } from 'lucide-react';
import { getClientSupabase } from '../../services/supabaseService';

type Job = { id: string; title: string; status: 'queued' | 'running' | 'retrying' | 'completed' | 'failed' | 'cancelled'; result?: { output?: string; verified?: boolean }; error?: string; progress?: { stage?: string; percent?: number; message?: string; attempt?: number; maxAttempts?: number }; attempt_count?: number; max_attempts?: number; cancel_requested_at?: string | null; created_at: string };
export const BackgroundJobsPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => { try { return localStorage.getItem('angel_desktop_notifications_enabled') === 'true'; } catch { return false; } });
  const previousStatuses = useRef<Record<string, Job['status']> | null>(null);

  useEffect(() => {
    const client = getClientSupabase();
    if (!client) return;
    let alive = true;
    void client.auth.getSession().then(({ data }) => {
      if (alive) setToken(data.session?.access_token || '');
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => setToken(session?.access_token || ''));
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const loadJobs = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/jobs?limit=12', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load background tasks.');
      const nextJobs: Job[] = Array.isArray(data.jobs) ? data.jobs : [];
      const previous = previousStatuses.current;
      if (previous && notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        for (const job of nextJobs) {
          const previousStatus = previous[job.id];
          const finished = job.status === 'completed' || job.status === 'failed';
          const wasActive = previousStatus === 'queued' || previousStatus === 'running';
          if (finished && wasActive) {
            const body = job.status === 'completed'
              ? (job.result?.output || 'Angel finished a background task.')
              : (job.error || 'A background task needs attention.');
            try { new Notification(job.status === 'completed' ? 'Angel task completed' : 'Angel task failed', { body: body.slice(0, 180), tag: `angel-job-${job.id}` }); } catch {}
          }
        }
      }
      previousStatuses.current = Object.fromEntries(nextJobs.map((job) => [job.id, job.status]));
      setJobs(nextJobs);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Background task status is unavailable.'); }
  }, [token, notificationsEnabled]);

  useEffect(() => {
    const refreshPreference = () => {
      try { setNotificationsEnabled(localStorage.getItem('angel_desktop_notifications_enabled') === 'true'); } catch { setNotificationsEnabled(false); }
    };
    window.addEventListener('storage', refreshPreference);
    window.addEventListener('angel:notification-preference-changed', refreshPreference);
    refreshPreference();
    return () => {
      window.removeEventListener('storage', refreshPreference);
      window.removeEventListener('angel:notification-preference-changed', refreshPreference);
    };
  }, []);

  useEffect(() => {
    if (!token || (!open && !notificationsEnabled)) return;
    void loadJobs();
    const interval = window.setInterval(() => void loadJobs(), 12000);
    return () => window.clearInterval(interval);
  }, [token, open, notificationsEnabled, loadJobs]);

  const enqueue = async () => {
    if (!token || !prompt.trim() || busy) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kind: 'agent_execution', title: prompt.trim().slice(0, 90), taskPrompt: prompt.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not queue this task.');
      setPrompt('');
      setMessage('Task queued. It will run when the server-side worker is configured and online.');
      await loadJobs();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not queue this task.'); }
    finally { setBusy(false); }
  };

  const cancel = async (job: Job) => {
    if (!token || job.cancel_requested_at) return;
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(job.id)}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'This task could not be cancelled.');
      setMessage(data.message || 'Cancellation requested.');
      await loadJobs();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'This task could not be cancelled.'); }
  };

  if (!token) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[74] max-w-[calc(100vw-2rem)]">
      {open && <section className="mb-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#101522]/97 text-white shadow-2xl backdrop-blur-xl">
        <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3"><Activity className="h-4 w-4 text-indigo-300"/><h2 className="flex-1 text-sm font-semibold">Background work</h2><button onClick={() => setOpen(false)} aria-label="Close background tasks" className="rounded-lg p-1.5 hover:bg-white/10"><XCircle className="h-4 w-4"/></button></header>
        <div className="space-y-3 p-3">
          <p className="text-xs leading-relaxed text-white/60">Queue a task for Angel to work on in the background. You can return to this account to check progress or cancel work that has not started.</p>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} maxLength={20000} placeholder="What should Angel work on?" className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"/>
          <button disabled={busy || !prompt.trim()} onClick={() => void enqueue()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-3 py-2.5 text-sm font-semibold disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4"/>}Queue task</button>
          {message && <p role="status" className="text-xs text-indigo-200">{message}</p>}
          <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-xs font-semibold">Recent tasks</span><button onClick={() => void loadJobs()} className="text-xs text-white/60 hover:text-white">Refresh</button></div>
            {jobs.length === 0 && <p className="text-xs text-white/50">No background tasks yet.</p>}
            {jobs.map((job) => <article key={job.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="flex items-start gap-2"><StatusIcon status={job.status}/><div className="min-w-0 flex-1"><p className="break-words text-xs font-medium">{job.title}</p><p className="mt-1 text-[11px] capitalize text-white/50">{job.status.replace('_', ' ')}</p></div>{['queued', 'retrying', 'running'].includes(job.status) && <button disabled={Boolean(job.cancel_requested_at)} onClick={() => void cancel(job)} className="shrink-0 text-[11px] text-red-300 hover:text-red-200 disabled:opacity-50">{job.cancel_requested_at ? 'Stop requested' : job.status === 'running' ? 'Request stop' : 'Cancel'}</button>}</div>
              {job.progress && <div className="mt-2 space-y-1.5"><p role="status" className="text-[11px] leading-relaxed text-white/65">{job.progress.message || 'Task in progress'}</p><div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Task progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0,Math.min(100,job.progress.percent ?? 0))}><div className="h-full rounded-full bg-indigo-400 transition-[width] duration-300" style={{ width: String(Math.max(0,Math.min(100,job.progress.percent ?? 0))) + '%' }} /></div><p className="text-[10px] text-white/40">Attempt {job.progress.attempt ?? job.attempt_count ?? 0} of {job.progress.maxAttempts ?? job.max_attempts ?? 3}</p></div>}
              {job.cancel_requested_at && job.status === 'running' && <p className="mt-2 text-[11px] text-amber-200">Angel will stop after the current model request returns. Its result will not be saved or retried.</p>}
              {job.status === 'completed' && job.result?.output && <p className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-white/75">{job.result.output}</p>}
              {job.status === 'completed' && job.result?.verified === true && <p className="mt-1 text-[10px] text-emerald-300">Result checked</p>}
              {job.status === 'failed' && job.error && <p className="mt-2 text-xs text-red-200">{job.error}</p>}
            </article>)}
          </div>
        </div>
      </section>}
      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-full border border-white/15 bg-[#101522]/95 px-3.5 py-2.5 text-xs font-medium text-white shadow-xl backdrop-blur-xl hover:bg-[#1a2030]" aria-expanded={open}><Activity className="h-4 w-4 text-indigo-300"/>Background work{jobs.some((job) => job.status === 'running' || job.status === 'queued' || job.status === 'retrying') && <span className="h-2 w-2 rounded-full bg-amber-300"/>}</button>
    </div>
  );
};
const StatusIcon: React.FC<{ status: Job['status'] }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300"/>;
  if (status === 'failed' || status === 'cancelled') return <XCircle className="h-4 w-4 shrink-0 text-red-300"/>;
  if (status === 'running') return <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-indigo-300"/>;
  return <Clock3 className="h-4 w-4 shrink-0 text-amber-300"/>;
};
