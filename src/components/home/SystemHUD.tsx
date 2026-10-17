import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Circle, Cpu, ListChecks, RadioTower, ShieldAlert } from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface Diagnostics {
  uptimeSeconds?: number;
  requestCount?: number;
  errorRequestCount?: number;
  averageRequestDurationMs?: number;
  recentEventCount?: number;
  platform?: string;
  memory?: { rssMb?: number; heapUsedMb?: number };
  providers?: Array<{ id: string; name: string; configured: boolean; defaultModel: string }>;
  timestamp?: string;
}

const formatDuration = (seconds = 0) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const useSystemDiagnostics = () => {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch('/api/diagnostics/system', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('System diagnostics unavailable');
        const value = await response.json() as Diagnostics;
        if (active) { setData(value); setAvailable(true); }
      } catch {
        if (active) setAvailable(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 30_000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, []);
  return { data, available };
};

export const SystemHUDOverlay: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { agents, selectedAgentId, isAgentProcessing, tasks, pendingSyncCount, syncStatus } = useAngel();
  const { data, available } = useSystemDiagnostics();
  const agent = agents.find((item) => item.id === selectedAgentId) || agents[0];
  const completed = tasks.filter((task) => String(task.status).toLowerCase() === 'completed').length;
  const activeTasks = tasks.filter((task) => !['completed', 'cancelled'].includes(String(task.status).toLowerCase())).length;
  const mood = isAgentProcessing ? 'Working' : open ? 'Attentive' : 'Ready';
  const health = available ? 'Connected' : 'Unavailable';

  return (
    <div className="fixed right-3 top-20 z-[60] sm:right-5">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
        className="group inline-flex items-center gap-2 bg-[#0b111bcc] px-3 py-2 text-xs text-neutral-200 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors hover:text-white">
        <Activity className={`h-4 w-4 ${isAgentProcessing ? 'animate-pulse text-emerald-300' : 'text-cyan-300'}`} />
        <span>System HUD</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-neutral-400" /> : <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />}
      </button>
      {open && (
        <section aria-label="Angel system telemetry" className="mt-2 w-[min(22rem,calc(100vw-1.5rem))] border border-cyan-300/15 bg-[#080d16f5] p-4 text-neutral-100 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">Angel // Telemetry</p>
              <h3 className="mt-1 text-sm font-semibold">System Status</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Circle className={`h-2 w-2 ${available ? 'fill-emerald-400 text-emerald-400' : 'fill-amber-400 text-amber-400'}`} />
              {health}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Agent</p>
              <p className="mt-1 truncate text-xs font-medium">{agent?.name || 'Angel Core'}</p>
              <p className="text-[10px] text-cyan-300/75">{mood}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Sync</p>
              <p className="mt-1 text-xs font-medium">{syncStatus.replace('_', ' ')}</p>
              <p className="text-[10px] text-neutral-500">{pendingSyncCount} queued</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Active tasks</p>
              <p className="mt-1 text-xs font-medium">{activeTasks}</p>
              <div className="mt-2 flex h-1 overflow-hidden bg-white/10">
                <div className="bg-cyan-300 transition-all" style={{ width: `${tasks.length ? Math.min(100, completed / tasks.length * 100) : 0}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-neutral-500">{completed} of {tasks.length} complete</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Runtime</p>
              <p className="mt-1 text-xs font-medium">{available ? formatDuration(data?.uptimeSeconds) : '—'}</p>
              <p className="text-[10px] text-neutral-500">{data?.platform || 'No connection'}</p>
            </div>
          </div>

          <div className="my-4 h-px bg-white/10" />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-neutral-400"><Cpu className="h-3.5 w-3.5" /> Process memory</span>
              <span className="tabular-nums">{available && data?.memory?.rssMb != null ? `${data.memory.rssMb} MB RSS` : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-neutral-400"><RadioTower className="h-3.5 w-3.5" /> API requests</span>
              <span className="tabular-nums">{available ? data?.requestCount ?? 0 : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-neutral-400"><ShieldAlert className="h-3.5 w-3.5" /> Failed requests</span>
              <span className={`tabular-nums ${(data?.errorRequestCount || 0) > 0 ? 'text-amber-300' : 'text-neutral-200'}`}>{available ? data?.errorRequestCount ?? 0 : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-neutral-400"><ListChecks className="h-3.5 w-3.5" /> AI providers ready</span>
              <span className="tabular-nums">{available ? data?.providers?.filter((provider) => provider.configured).length ?? 0 : '—'}</span>
            </div>
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-neutral-500">
            Memory and uptime describe Angel's API process only, not the entire hosting machine. Provider availability shows configuration, not a guaranteed successful model request.
          </p>
        </section>
      )}
    </div>
  );
};

export const HomeSystemStatusWidget: React.FC = () => {
  const { agents, selectedAgentId, isAgentProcessing, tasks, pendingSyncCount, syncStatus } = useAngel();
  const { data, available } = useSystemDiagnostics();
  const agent = agents.find((item) => item.id === selectedAgentId) || agents[0];
  const completed = tasks.filter((task) => String(task.status).toLowerCase() === 'completed').length;
  const activeTasks = tasks.filter((task) => !['completed', 'cancelled'].includes(String(task.status).toLowerCase())).length;
  const configuredProviders = useMemo(() => data?.providers?.filter((provider) => provider.configured).length ?? 0, [data?.providers]);

  return (
    <section className="space-y-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className={`h-4 w-4 ${isAgentProcessing ? 'animate-pulse text-emerald-400' : 'text-cyan-400'}`} />
          <h2 className="text-sm font-semibold tracking-wide">System Status</h2>
        </div>
        <span className="text-[11px] text-neutral-500">{available ? 'Live diagnostics' : 'API offline'}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <div><p className="text-[10px] uppercase tracking-wider text-neutral-500">Active agent</p><p className="mt-1 truncate text-xs font-medium">{agent?.name || 'Angel Core'}</p><p className="text-[10px] text-cyan-400">{isAgentProcessing ? 'Executing' : 'Ready'}</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-neutral-500">Open tasks</p><p className="mt-1 text-xs font-medium">{activeTasks}</p><p className="text-[10px] text-neutral-500">{completed} completed</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-neutral-500">Cloud queue</p><p className="mt-1 text-xs font-medium">{pendingSyncCount} pending</p><p className="text-[10px] text-neutral-500">{syncStatus.replace('_', ' ')}</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-neutral-500">AI providers</p><p className="mt-1 text-xs font-medium">{available ? configuredProviders : '—'}</p><p className="text-[10px] text-neutral-500">{available ? `${data?.requestCount ?? 0} API requests` : 'No telemetry'}</p></div>
      </div>
      {tasks.length > 0 && (
        <div className="flex items-start gap-2 border-t border-white/10 pt-3 text-xs">
          <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <p className="min-w-0 truncate text-neutral-300">Next task: {tasks.find((task) => !['completed', 'cancelled'].includes(String(task.status).toLowerCase()))?.title || 'All listed tasks completed'}</p>
        </div>
      )}
    </section>
  );
};
