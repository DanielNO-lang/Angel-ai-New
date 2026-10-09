/**
 * ANGEL AI — Real-Time Recent Activity Widget
 * Displays a unified chronological timeline of:
 * - Autonomous Agent Executions
 * - Task Completions
 * - Memory Vault Additions
 */

import React, { useMemo } from 'react';
import {
  Bot,
  CheckCircle2,
  Brain,
  Clock,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface TimelineActivity {
  id: string;
  type: 'agent' | 'task' | 'memory';
  title: string;
  subtitle: string;
  timestamp: string;
  isoDate: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

export const RecentActivityWidget: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const { executions, tasks, memories, setActiveTab, isSignedIn } = useAngel();

  const activities = useMemo(() => {
    const list: TimelineActivity[] = [];

    // 1. Agent Executions
    executions.forEach((ex) => {
      const date = ex.startedAt ? new Date(ex.startedAt) : new Date();
      list.push({
        id: `agent-${ex.id}`,
        type: 'agent',
        title: `${ex.agentName}: ${ex.status}`,
        subtitle: ex.taskPrompt || 'Autonomous directive run',
        timestamp: formatRelativeTime(date),
        isoDate: date.toISOString(),
        icon: Bot,
        color: ex.status === 'completed' ? 'text-emerald-500 bg-emerald-500/10' : 'text-indigo-400 bg-indigo-500/10',
        onClick: () => setActiveTab('agent_lab'),
      });
    });

    // 2. Task Completions
    tasks
      .filter((t) => t.status === 'completed')
      .forEach((t) => {
        const date = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
        list.push({
          id: `task-${t.id}`,
          type: 'task',
          title: `Completed: ${t.title}`,
          subtitle: `Priority: ${t.priority} • ${t.subtasks.length} subtasks`,
          timestamp: formatRelativeTime(date),
          isoDate: date.toISOString(),
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-500/10',
          onClick: () => setActiveTab('tasks'),
        });
      });

    // Memory activity belongs only to an authenticated, persistent workspace.
    if (isSignedIn) {
      memories.forEach((m) => {
        const date = m.createdAt ? new Date(m.createdAt) : new Date();
        list.push({
          id: `memory-${m.id}`,
          type: 'memory',
          title: `Memory: ${m.title}`,
          subtitle: m.content.slice(0, 50) + (m.content.length > 50 ? '...' : ''),
          timestamp: formatRelativeTime(date),
          isoDate: date.toISOString(),
          icon: Brain,
          color: 'text-purple-400 bg-purple-500/10',
          onClick: () => setActiveTab('memories'),
        });
      });
    }

    // Sort descending by ISO timestamp
    return list.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime()).slice(0, 7);
  }, [executions, tasks, memories, isSignedIn, setActiveTab]);

  return (
    <div
      className={`rounded-2xl p-5 space-y-3.5 backdrop-blur-xl border transition-all ${
        isLight
          ? 'bg-white/70 border-slate-200/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_8px_24px_rgba(0,0,0,0.03)]'
          : 'bg-[#121622]/70 border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.4)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <h3
            className={`text-xs font-semibold ${
              isLight ? 'text-slate-900' : 'text-neutral-200'
            }`}
          >
            Recent Activity
          </h3>
        </div>
        <button
          onClick={() => setActiveTab('tasks')}
          className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium cursor-pointer"
        >
          View all →
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-6 px-4 space-y-2">
          <Activity className="w-5 h-5 text-indigo-400 mx-auto opacity-40" />
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
            No recent activity recorded
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {activities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={item.onClick}
                className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                  isLight
                    ? 'hover:bg-slate-50 border border-transparent hover:border-slate-200/60'
                    : 'hover:bg-neutral-900/60 border border-transparent hover:border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                      {item.title}
                    </p>
                    <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                    {item.timestamp}
                  </span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isLight ? 'text-indigo-600' : 'text-indigo-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}
