import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, ExternalLink, FileSearch, LoaderCircle, RefreshCw, Search, Trash2 } from 'lucide-react';
import { getClientSupabase } from '../../services/supabaseService';

type Source = { title: string; url: string; snippet?: string };
type Step = { query: string; success: boolean; answer?: string; sources: Source[]; timestamp: string; error?: string };
type Report = { title: string; query: string; status: 'completed' | 'partial' | 'failed'; steps: Step[]; sources: Source[]; createdAt: string };
type SavedReport = { id: string; title: string; query: string; status: Report['status']; report?: Report; created_at: string };

export const ResearchWorkspace: React.FC = () => {
  const [token, setToken] = useState('');
  const [question, setQuestion] = useState('');
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('angel_pending_capability_prompt');
      if (!raw) return;
      const handoff = JSON.parse(raw) as { target?: string; prompt?: string; createdAt?: number };
      if (handoff.target !== 'research') return;
      localStorage.removeItem('angel_pending_capability_prompt');
      if (typeof handoff.prompt === 'string' && handoff.prompt.trim() &&
          typeof handoff.createdAt === 'number' && Date.now() - handoff.createdAt < 10 * 60 * 1000) {
        setQuestion(handoff.prompt);
        setNotice('Home suggestion loaded. Review the question and start research when ready.');
      }
    } catch {
      try { localStorage.removeItem('angel_pending_capability_prompt'); } catch {}
    }
  }, []);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains('light'));
    const client = getClientSupabase();
    if (!client) { setError('Research saving needs a configured Supabase sign-in session.'); return; }
    let alive = true;
    void client.auth.getSession().then(({ data }) => { if (alive) setToken(data.session?.access_token || ''); });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setToken(session?.access_token || '');
      setActiveReport(null); setReports([]);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const headers = useCallback((): Record<string, string> => token ? { Authorization: `Bearer ${token}` } : {}, [token]);
  const loadReports = useCallback(async () => {
    if (!token) { setReports([]); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/research/reports?limit=40', { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Saved reports could not be loaded.');
      setReports(Array.isArray(data.reports) ? data.reports : []);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Saved reports could not be loaded.'); }
    finally { setLoading(false); }
  }, [token, headers]);
  useEffect(() => { void loadReports(); }, [loadReports]);

  const runResearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) { setError('Sign in to save and revisit research reports.'); return; }
    if (!question.trim() || busy) return;
    setBusy(true); setError(''); setNotice('Searching up to four query angles. Sources come only from search-grounding metadata.'); setActiveReport(null);
    try {
      const response = await fetch('/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify({ query: question.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Research request failed.');
      setActiveReport(data);
      setQuestion('');
      setNotice(data.status === 'completed' ? 'Research completed and saved.' : data.status === 'partial' ? 'A partial report was saved; some research steps need another attempt.' : 'A failed report record was saved. No unsupported sources were fabricated.');
      await loadReports();
    } catch (e) { setNotice(''); setError(e instanceof Error ? e.message : 'Research request failed.'); }
    finally { setBusy(false); }
  };

  const openReport = async (id: string) => {
    setError(''); setNotice('');
    try {
      const response = await fetch(`/api/research/reports/${encodeURIComponent(id)}`, { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not open this report.');
      setActiveReport(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not open this report.'); }
  };
  const deleteReport = async (id: string) => {
    if (!window.confirm('Delete this saved research report?')) return;
    try {
      const response = await fetch(`/api/research/reports/${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers() });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Could not delete this report.'); }
      setReports((items) => items.filter((item) => item.id !== id));
      setActiveReport((current) => current?.id === id ? null : current);
      setNotice('Research report deleted.'); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete this report.'); }
  };

  const report = activeReport?.report;
  const panel = isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-[#111522] text-neutral-100';
  const muted = isLight ? 'text-slate-500' : 'text-neutral-400';
  return <section className={`mx-auto min-h-full w-full max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8 ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="flex items-center gap-2 text-indigo-400"><FileSearch className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Angel Research</span></div><h1 className="mt-2 text-2xl font-bold tracking-tight">Research workspace</h1><p className={`mt-1 max-w-2xl text-sm ${muted}`}>Multi-step web research, source inspection, and reports you can revisit.</p></div>
      <button type="button" disabled={loading} onClick={() => void loadReports()} className={`inline-flex items-center gap-2 self-start rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${panel}`}><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh reports</button>
    </header>
    <form onSubmit={runResearch} className={`space-y-3 rounded-2xl border p-4 sm:p-5 ${panel}`}>
      <label htmlFor="angel-research-question" className="block text-sm font-semibold">What should Angel investigate?</label>
      <textarea id="angel-research-question" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} rows={3} required placeholder="Ask a focused question. Angel searches several angles and keeps the source trail." className={`w-full resize-y rounded-xl border px-3 py-3 text-sm outline-none focus:border-indigo-500 ${isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-black/20 text-white'}`} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className={`text-xs ${muted}`}>Requires server-side Gemini grounding and the approved Supabase migration.</p><button type="submit" disabled={busy || !question.trim() || !token} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{busy ? 'Researching…' : 'Start research'}</button></div>
    </form>
    {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-500" role="alert">{error}</div>}
    {notice && !error && <div className="rounded-xl border border-indigo-500/20 px-4 py-3 text-sm text-indigo-400" role="status">{notice}</div>}
    {!token && <p className={`text-sm ${muted}`}>Sign in to use the private research archive. Guest reports cannot be saved here.</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <section className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${panel}`}><h2 className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4 text-indigo-400" />Report</h2>
        {!activeReport ? <p className={`mt-4 text-sm ${muted}`}>Choose a saved report or begin a new investigation. Source links open independently for inspection.</p> : <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-bold">{activeReport.title}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${activeReport.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : activeReport.status === 'partial' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>{activeReport.status}</span></div>
          <p className={`text-xs ${muted}`}>{activeReport.query}</p>
          {(report?.steps || []).map((step, i) => <article key={`${step.query}-${i}`} className="space-y-2 border-t border-inherit pt-3"><h4 className="text-sm font-semibold">{i + 1}. {step.query}</h4>{step.success && step.answer ? <p className="whitespace-pre-wrap text-sm leading-6">{step.answer}</p> : <p className="text-sm text-amber-500">This step did not return a fully grounded answer: {step.error || 'No verified source evidence returned.'}</p>}
            {step.sources.map((source) => <div key={source.url} className="rounded-lg border border-inherit p-3"><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-sm font-semibold text-indigo-400 hover:underline"><span>{source.title}</span><ExternalLink className="mt-0.5 h-3 w-3 shrink-0" /></a>{source.snippet && <p className={`mt-1 text-xs leading-5 ${muted}`}>{source.snippet}</p>}<p className={`mt-1 break-all text-[10px] ${muted}`}>{source.url}</p></div>)}
          </article>)}
          <p className={`border-t border-inherit pt-3 text-xs ${muted}`}>{report?.sources.length ?? 0} unique sources · {report?.createdAt ? new Date(report.createdAt).toLocaleString() : new Date(activeReport.created_at).toLocaleString()}</p>
        </div>}
      </section>
      <section className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${panel}`}><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Saved reports</h2>{loading && <LoaderCircle className="h-4 w-4 animate-spin text-indigo-400" />}</div>
        {reports.length === 0 ? <p className={`mt-4 text-sm ${muted}`}>{loading ? 'Loading report archive…' : 'No saved reports yet.'}</p> : <ul className="mt-3 space-y-2">{reports.map((item) => <li key={item.id} className={`flex items-center gap-2 rounded-xl border border-inherit p-3 ${activeReport?.id === item.id ? 'ring-1 ring-indigo-500/50' : ''}`}><button type="button" onClick={() => void openReport(item.id)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold">{item.title}</span><span className={`mt-1 block truncate text-xs ${muted}`}>{item.query}</span><span className={`mt-1 block text-[10px] uppercase tracking-wide ${muted}`}>{item.status} · {new Date(item.created_at).toLocaleDateString()}</span></button><button type="button" onClick={() => void deleteReport(item.id)} aria-label={`Delete report ${item.title}`} className="rounded-lg p-2 text-neutral-500 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button></li>)}</ul>}
      </section>
    </div>
  </section>;
};
