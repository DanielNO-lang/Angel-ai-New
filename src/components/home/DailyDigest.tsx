/**
 * ANGEL AI — Daily Digest & Workspace Briefing
 * Aggregates:
 * 1. Today's and upcoming urgent/high priority tasks.
 * 2. Recent memory vault updates & knowledge acquisitions.
 * 3. Active agent workflows, running orchestration pipelines, and velocity metrics.
 * 4. Project progression summary.
 */

import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Brain,
  Bot,
  Zap,
  FolderGit2,
  Flame,
  CheckSquare,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface DailyDigestProps {
  isLight: boolean;
}

export const DailyDigest: React.FC<DailyDigestProps> = ({ isLight }) => {
  const {
    tasks,
    memories,
    projects,
    agents,
    executions,
    setActiveTab,
    toggleTaskStatus,
  } = useAngel();

  // Upcoming / active tasks
  const pendingTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Urgent / High priority tasks
  const focusTasks = pendingTasks
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    })
    .slice(0, 4);

  // Recent memories
  const recentMemories = [...memories].slice(0, 3);

  // Active agents & executions
  const recentExecutions = [...executions].slice(0, 3);

  const todayDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-6 transition-all duration-200 shadow-sm relative overflow-hidden ${
        isLight
          ? 'bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 border-slate-200 text-slate-800'
          : 'bg-gradient-to-br from-[#101420] via-[#0E121B] to-[#0A0D14] border-white/10 text-neutral-100 shadow-xl'
      }`}
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
            <Flame className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Daily Digest & Briefing</h2>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                {todayDate}
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Your workspace overview: upcoming milestones, memory reflections, and autonomous workflows.
            </p>
          </div>
        </div>

        {/* Global Velocity Pill */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="text-right">
            <div className="text-[11px] font-medium opacity-60">Completion Rate</div>
            <div className="text-xs font-bold text-indigo-400">{completionRate}% ({completedTasks.length}/{tasks.length})</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 flex items-center justify-center relative">
            <div
              className="absolute inset-0 rounded-full border-4 border-indigo-500"
              style={{
                clipPath: `polygon(50% 50%, -50% -50%, ${completionRate}% -50%, ${completionRate}% ${completionRate}%)`,
              }}
            />
            <span className="text-[11px] font-bold font-medium">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Pillars (Upcoming Tasks, Recent Memories, Active Agent Workflows) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        {/* 1. Upcoming Tasks Pillar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Priority Tasks</h3>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-[11px] font-semibold text-indigo-500 hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {focusTasks.length === 0 ? (
              <p className="text-xs text-neutral-500 italic p-3 rounded-xl bg-black/5 dark:bg-white/5">
                All tasks are currently completed! Great job.
              </p>
            ) : (
              focusTasks.map((t) => (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isLight
                      ? 'bg-white/80 border-slate-200/80 hover:border-slate-300'
                      : 'bg-neutral-900/60 border-white/5 hover:border-white/10'
                  }`}
                >
                  <button
                    onClick={() => toggleTaskStatus(t.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{t.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium">
                      <span
                        className={`px-1.5 py-0.2 rounded font-semibold uppercase ${
                          t.priority === 'urgent'
                            ? 'bg-red-500/10 text-red-500'
                            : t.priority === 'high'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-indigo-500/10 text-indigo-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                      {t.dueDate && <span className="opacity-60">Due: {t.dueDate}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Recent Memories Pillar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-pink-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Memory Updates</h3>
            </div>
            <button
              onClick={() => setActiveTab('memories')}
              className="text-[11px] font-semibold text-indigo-500 hover:underline flex items-center gap-0.5"
            >
              <span>Vault</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {recentMemories.length === 0 ? (
              <p className="text-xs text-neutral-500 italic p-3 rounded-xl bg-black/5 dark:bg-white/5">
                No memories recorded yet.
              </p>
            ) : (
              recentMemories.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isLight
                      ? 'bg-white/80 border-slate-200/80 hover:border-slate-300'
                      : 'bg-neutral-900/60 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold truncate">{m.title}</p>
                    <span className="text-[9px] font-medium px-1 rounded bg-pink-500/10 text-pink-400 shrink-0">
                      {m.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-neutral-400'
                    }`}
                  >
                    {m.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Active Agent Workflows Pillar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Agent Workflows</h3>
            </div>
            <button
              onClick={() => setActiveTab('agent_lab')}
              className="text-[11px] font-semibold text-indigo-500 hover:underline flex items-center gap-0.5"
            >
              <span>Agent Lab</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {recentExecutions.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-inherit space-y-2">
                <p className="text-xs text-neutral-500 italic">
                  All {agents.length} agents are synchronized and ready on standby.
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {agents.slice(0, 4).map((a) => (
                    <span
                      key={a.id}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              recentExecutions.map((ex) => (
                <div
                  key={ex.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isLight
                      ? 'bg-white/80 border-slate-200/80 hover:border-slate-300'
                      : 'bg-neutral-900/60 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="truncate">{ex.agentName}</span>
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded uppercase ${
                        ex.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : ex.status === 'executing'
                          ? 'bg-indigo-500/10 text-indigo-400 animate-pulse'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {ex.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 truncate mt-1">
                    Directive: {ex.taskPrompt}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
