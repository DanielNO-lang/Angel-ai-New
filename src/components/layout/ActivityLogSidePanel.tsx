/**
 * ANGEL AI — Workspace Activity Log Side-Panel
 * Keeps track of recent user actions, agent executions, and task/memory updates.
 */

import React from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  X,
  Brain,
  FolderGit2,
  ChevronRight,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface ActivityLogSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
}

export const ActivityLogSidePanel: React.FC<ActivityLogSidePanelProps> = ({
  isOpen,
  onClose,
  isLight,
}) => {
  const { executions, tasks, memories, conversations, agents, setActiveTab } = useAngel();

  if (!isOpen) return null;

  // Build aggregate timeline items
  const timelineItems: Array<{
    id: string;
    type: 'agent' | 'task' | 'memory' | 'chat';
    title: string;
    detail: string;
    timestamp: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    action?: () => void;
  }> = [];

  // Agent executions
  executions.slice(0, 10).forEach((ex) => {
    timelineItems.push({
      id: `ex-${ex.id}`,
      type: 'agent',
      title: `${ex.agentName} executed directive`,
      detail: ex.taskPrompt.slice(0, 70),
      timestamp: ex.startedAt || 'Recent',
      icon: Bot,
      color: 'text-indigo-400 bg-indigo-500/10',
      action: () => {
        setActiveTab('agent_lab');
        onClose();
      },
    });
  });

  // Recent completed or updated tasks
  tasks.slice(0, 8).forEach((t) => {
    timelineItems.push({
      id: `task-${t.id}`,
      type: 'task',
      title: t.status === 'completed' ? `Completed task: ${t.title}` : `Active task: ${t.title}`,
      detail: `Priority: ${t.priority} • ${t.subtasks.length} subtasks`,
      timestamp: t.completedAt || t.createdAt || 'Recent',
      icon: CheckCircle2,
      color: t.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10',
      action: () => {
        setActiveTab('tasks');
        onClose();
      },
    });
  });

  // Memories
  memories.slice(0, 6).forEach((m) => {
    timelineItems.push({
      id: `mem-${m.id}`,
      type: 'memory',
      title: `Memory archived: ${m.title}`,
      detail: m.content.slice(0, 60),
      timestamp: m.createdAt || 'Recent',
      icon: Brain,
      color: 'text-pink-400 bg-pink-500/10',
      action: () => {
        setActiveTab('memories');
        onClose();
      },
    });
  });

  // Conversations
  conversations.slice(0, 6).forEach((c) => {
    timelineItems.push({
      id: `conv-${c.id}`,
      type: 'chat',
      title: `Session: ${c.title}`,
      detail: `${c.messageCount || 0} messages exchanged`,
      timestamp: c.updatedAt || 'Recent',
      icon: MessageSquare,
      color: 'text-purple-400 bg-purple-500/10',
      action: () => {
        setActiveTab('chat');
        onClose();
      },
    });
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 select-none ${
          isLight
            ? 'bg-white border-l border-slate-200 text-slate-800'
            : 'bg-[#0B0E14] border-l border-white/10 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Workspace Activity Log</h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Audit trail of actions, agent runs, and task mutations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {timelineItems.length === 0 ? (
            <p className="text-xs text-neutral-500 italic text-center py-10">No recent workspace actions.</p>
          ) : (
            timelineItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isLight
                      ? 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200/80 hover:border-indigo-300'
                      : 'bg-[#121622] hover:bg-[#161B2B] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{item.title}</span>
                      <span className="text-[10px] font-mono opacity-50 shrink-0">
                        {item.timestamp.slice(0, 10)}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                      {item.detail}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0 self-center" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
