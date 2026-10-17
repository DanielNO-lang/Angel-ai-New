import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowUpRight, BookOpen, Check, ExternalLink, FileText, LoaderCircle, RefreshCw, Save, Search, ShieldCheck, SquarePen, X } from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { LibraryItem } from '../../types';

interface ResearchSource { title: string; url: string }
interface ResearchResponse {
  query: string;
  answer: string;
  sources: ResearchSource[];
  searchQueries: string[];
  modelId: string;
  grounded: boolean;
}

function asSources(item?: LibraryItem | null): ResearchSource[] {
  const value = item?.metadata?.sources;
  if (!Array.isArray(value)) return [];
  return value.filter((source): source is ResearchSource =>
    Boolean(source) && typeof source === 'object'
    && typeof (source as ResearchSource).title === 'string'
    && typeof (source as ResearchSource).url === 'string'
    && /^https:\/\//i.test((source as ResearchSource).url)
  );
}

function safeErrorMessage(value: unknown): string {
  const message = value instanceof Error ? value.message : 'Research request failed.';
  return message
    .replace(/(api[_ -]?key|authorization|bearer|token|secret)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 360);
}

export const ResearchWorkspace: React.FC = () => {
  const {
    settings, isSignedIn, libraryItems, createLibraryItem, updateLibraryItem,
  } = useAngel();
  const isLight = settings.theme === 'light';
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [savedReport, setSavedReport] = useState<LibraryItem | null>(null);
  const [reportText, setReportText] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const savedReports = useMemo(() => libraryItems
    .filter((item) => item.metadata?.kind === 'research_report')
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)), [libraryItems]);
  const selectedSources = savedReport ? asSources(savedReport) : result?.sources || [];
  const isLightTheme = isLight;

  useEffect(() => () => controllerRef.current?.abort(), []);

  const requestResearch = async (searchQuery: string, signal: AbortSignal): Promise<ResearchResponse> => {
    const response = await fetch('/api/research/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, maxSources: 6 }),
      signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = typeof payload?.error === 'string' ? payload.error : `Research service returned HTTP ${response.status}.`;
      throw new Error(detail.slice(0, 360));
    }
    if (typeof payload?.answer !== 'string' || !payload.answer.trim()) {
      throw new Error('The research provider returned no usable answer.');
    }
    const sources: ResearchSource[] = Array.isArray(payload.sources)
      ? payload.sources.filter((source: unknown): source is ResearchSource =>
          Boolean(source) && typeof source === 'object'
          && typeof (source as ResearchSource).title === 'string'
          && typeof (source as ResearchSource).url === 'string'
          && /^https:\/\//i.test((source as ResearchSource).url))
      : [];
    return {
      query: typeof payload.query === 'string' ? payload.query : searchQuery,
      answer: payload.answer.trim(),
      sources: sources.slice(0, 6),
      searchQueries: Array.isArray(payload.searchQueries)
        ? payload.searchQueries.filter((item: unknown): item is string => typeof item === 'string').slice(0, 8)
        : [],
      modelId: typeof payload.modelId === 'string' ? payload.modelId : 'configured research provider',
      grounded: payload.grounded === true && sources.length > 0,
    };
  };

  const runResearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const normalized = query.trim();
    if (normalized.length < 3) {
      setError('Enter a research question with at least three characters.');
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsResearching(true);
    setError(null);
    setNotice(null);
    setResult(null);
    setSavedReport(null);
    setReportText('');
    setReportTitle(normalized.slice(0, 100));
    const supplementalAnswers: string[] = [];
    const sourceMap = new Map<string, ResearchSource>();
    const queries = new Set<string>();
    try {
      setProgress('Step 1 of 3 · Researching the main question');
      const primary = await requestResearch(normalized, controller.signal);
      primary.sources.forEach((source) => sourceMap.set(source.url, source));
      primary.searchQueries.forEach((searchQuery) => queries.add(searchQuery));

      // Grounding often returns follow-up search queries. Inspect up to two distinct angles
      // to deepen the report while keeping the interaction bounded and cancellable.
      const followUps = primary.searchQueries
        .map((item) => item.trim())
        .filter((item) => item.length >= 3 && item.toLowerCase() !== normalized.toLowerCase())
        .slice(0, 2);
      for (let i = 0; i < followUps.length; i++) {
        if (controller.signal.aborted) throw new DOMException('Research cancelled.', 'AbortError');
        setProgress(`Step ${i + 2} of ${followUps.length + 1} · Checking another source angle`);
        try {
          const supplemental = await requestResearch(followUps[i], controller.signal);
          supplementalAnswers.push(supplemental.answer);
          supplemental.sources.forEach((source) => sourceMap.set(source.url, source));
          supplemental.searchQueries.forEach((searchQuery) => queries.add(searchQuery));
        } catch (followupError) {
          if (controller.signal.aborted) throw followupError;
          // A partial report remains useful; record that one supporting pass was unavailable.
          supplementalAnswers.push(`Follow-up search “${followUps[i]}” could not be completed: ${safeErrorMessage(followupError)}`);
        }
      }

      const merged: ResearchResponse = {
        ...primary,
        answer: [primary.answer, ...supplementalAnswers.map((answer, index) =>
          `### Supplementary findings ${index + 1}\n${answer}`
        )].join('\n\n'),
        sources: [...sourceMap.values()].slice(0, 10),
        searchQueries: [...queries].slice(0, 10),
        grounded: primary.grounded && sourceMap.size > 0,
      };
      setResult(merged);
      setReportText([
        `# ${normalized}`,
        '',
        merged.answer,
        '',
        '## Sources',
        ...merged.sources.map((source, index) => `${index + 1}. [${source.title}](${source.url})`),
        '',
        `Research provider: ${merged.modelId}`,
        `Sources returned: ${merged.sources.length}`,
      ].join('\n'));
      setProgress('Research complete · Review evidence before relying on consequential claims');
    } catch (researchError) {
      if (controller.signal.aborted || (researchError instanceof DOMException && researchError.name === 'AbortError')) {
        setProgress('Research was cancelled. Any partial findings were not saved automatically.');
      } else {
        setError(safeErrorMessage(researchError));
        setProgress('Research did not complete.');
      }
    } finally {
      setIsResearching(false);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  const cancelResearch = () => {
    controllerRef.current?.abort();
    setProgress('Cancelling research…');
  };

  const openSavedReport = (item: LibraryItem) => {
    setSavedReport(item);
    setResult(null);
    setQuery(typeof item.metadata?.query === 'string' ? item.metadata.query : item.title);
    setReportTitle(item.title);
    setReportText(item.content || '');
    setError(null);
    setNotice(null);
    setProgress('Opened saved report.');
  };

  const saveCurrentReport = () => {
    if (!result || !reportText.trim()) return;
    if (!isSignedIn) {
      setNotice('Sign in to save research reports to your persistent workspace. Unsaved work stays on this screen.');
      return;
    }
    createLibraryItem({
      title: reportTitle.trim() || result.query.slice(0, 100),
      description: `Research report for: ${result.query}`,
      category: 'references',
      type: 'reference',
      content: reportText,
      tags: ['research', 'web-sources'],
      metadata: {
        kind: 'research_report',
        query: result.query,
        sources: result.sources,
        searchQueries: result.searchQueries,
        modelId: result.modelId,
        grounded: result.grounded,
      },
    });
    setNotice('Research report saved to Library.');
    setProgress('Saved report · Available again from Saved research.');
  };

  const saveEditedReport = () => {
    if (!savedReport || !isSignedIn) return;
    updateLibraryItem(savedReport.id, {
      title: reportTitle.trim() || savedReport.title,
      content: reportText,
      description: `Saved research report · Last edited ${new Date().toLocaleString()}`,
    });
    setNotice('Report changes queued for workspace sync.');
  };

  const surface = isLightTheme
    ? 'border-slate-200 bg-white text-slate-900'
    : 'border-white/10 bg-neutral-950/50 text-neutral-100';
  const muted = isLightTheme ? 'text-slate-500' : 'text-neutral-400';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-indigo-500">
          <Search className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Angel Research</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Research workspace</h1>
        <p className={`mt-1 max-w-2xl text-sm leading-6 ${muted}`}>
          Investigate a question, inspect source links, then save an editable report to revisit later.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-4">
          <form onSubmit={runResearch} className={`rounded-2xl border p-3 ${surface}`}>
            <label htmlFor="angel-research-query" className="mb-2 block text-xs font-semibold">Research question</label>
            <textarea
              id="angel-research-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What would you like to investigate?"
              rows={3}
              maxLength={2000}
              disabled={isResearching}
              className="w-full resize-y bg-transparent px-1 py-2 text-sm outline-none placeholder:opacity-50 disabled:opacity-60"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-inherit pt-3">
              <span className={`text-[11px] ${muted}`}>Bounded research: main question plus up to two follow-up searches.</span>
              <div className="flex gap-2">
                {isResearching && (
                  <button type="button" onClick={cancelResearch} className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-2 text-xs font-semibold">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                )}
                <button type="submit" disabled={isResearching || query.trim().length < 3} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-45">
                  {isResearching ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  {isResearching ? 'Researching…' : 'Start research'}
                </button>
              </div>
            </div>
          </form>

          {(progress || error || notice) && (
            <div className={`rounded-xl border px-3 py-2.5 text-xs ${error ? 'border-rose-500/30 bg-rose-500/5 text-rose-600' : surface}`}>
              {error && <div role="alert" className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span><button type="button" onClick={() => void runResearch()} className="ml-auto inline-flex shrink-0 items-center gap-1 font-semibold"><RefreshCw className="h-3 w-3" /> Retry</button></div>}
              {!error && (notice || progress) && <p role="status">{notice || progress}</p>}
              {error && notice && <p className="mt-1">{notice}</p>}
            </div>
          )}

          {result && !savedReport && (
            <section className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">Findings</h2>
                  <p className={`mt-1 text-xs ${muted}`}>{result.grounded ? 'Search grounding returned source links.' : 'No source links were returned. Treat claims as unverified.'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${result.grounded ? 'border-emerald-500/30 text-emerald-600' : 'border-amber-500/30 text-amber-600'}`}>
                  <ShieldCheck className="h-3 w-3" /> {result.grounded ? 'Sources available' : 'Verify independently'}
                </span>
              </div>
              <article className="mt-4 whitespace-pre-wrap text-sm leading-7">{result.answer}</article>
              {result.sources.length > 0 && (
                <div className="mt-5 border-t border-inherit pt-4">
                  <h3 className="text-sm font-semibold">Sources ({result.sources.length})</h3>
                  <ol className="mt-2 space-y-2">
                    {result.sources.map((source, index) => (
                      <li key={source.url} className="flex gap-2 text-xs">
                        <span className={muted}>{index + 1}.</span>
                        <div className="min-w-0">
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-indigo-500 hover:underline">
                            {source.title} <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          <p className={`mt-0.5 break-all ${muted}`}>{source.url}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {result.searchQueries.length > 0 && (
                <details className="mt-4 border-t border-inherit pt-3">
                  <summary className={`cursor-pointer text-xs font-semibold ${muted}`}>Inspect search queries</summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">{result.searchQueries.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                </details>
              )}
            </section>
          )}

          {(result || savedReport) && (
            <section className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
              <div className="mb-3 flex items-center gap-2">
                {savedReport ? <SquarePen className="h-4 w-4 text-indigo-500" /> : <FileText className="h-4 w-4 text-indigo-500" />}
                <h2 className="text-sm font-semibold">{savedReport ? 'Edit saved report' : 'Saved report draft'}</h2>
              </div>
              <label htmlFor="angel-report-title" className="mb-1 block text-xs font-medium">Report title</label>
              <input id="angel-report-title" value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} maxLength={160} className="mb-3 w-full rounded-lg border border-inherit bg-transparent px-3 py-2 text-sm" />
              <label htmlFor="angel-report-content" className="mb-1 block text-xs font-medium">Editable report (Markdown)</label>
              <textarea id="angel-report-content" value={reportText} onChange={(event) => setReportText(event.target.value)} rows={14} maxLength={100000} className="w-full resize-y rounded-xl border border-inherit bg-transparent px-3 py-3 font-mono text-xs leading-6 outline-none" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className={`text-[11px] ${muted}`}>{savedReport ? 'Edits are saved to this Library artifact.' : 'Review before saving; a generated report is not a guarantee that every claim is correct.'}</span>
                {savedReport ? (
                  <button type="button" onClick={saveEditedReport} disabled={!isSignedIn} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-45"><Save className="h-3.5 w-3.5" /> Save edits</button>
                ) : (
                  <button type="button" onClick={saveCurrentReport} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Save className="h-3.5 w-3.5" /> Save to Library</button>
                )}
              </div>
              {!isSignedIn && <p className="mt-2 text-xs text-amber-600">Sign in to save a report persistently. Research itself remains available.</p>}
            </section>
          )}
        </main>

        <aside className="min-w-0">
          <section className={`rounded-2xl border p-3.5 ${surface}`}>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-semibold">Saved research</h2>
            </div>
            <p className={`mt-1 text-xs ${muted}`}>Open a report to review sources or continue editing it.</p>
            {savedReports.length === 0 ? (
              <p className={`mt-4 text-xs ${muted}`}>No saved reports yet.</p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {savedReports.map((item) => (
                  <button key={item.id} type="button" onClick={() => openSavedReport(item)} className={`block w-full rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors ${isLightTheme ? 'hover:bg-slate-50 hover:border-slate-200' : 'hover:bg-white/[0.04] hover:border-white/10'}`}>
                    <span className="block truncate text-xs font-semibold">{item.title}</span>
                    <span className={`mt-1 block text-[10px] ${muted}`}>{new Date(item.updatedAt).toLocaleDateString()} · {asSources(item).length} sources</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 border-t border-inherit pt-3">
              <button type="button" onClick={() => { setSavedReport(null); setResult(null); setReportText(''); setReportTitle(''); setNotice(null); setError(null); }} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${muted} hover:text-indigo-500`}>
                <Search className="h-3.5 w-3.5" /> New report
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
