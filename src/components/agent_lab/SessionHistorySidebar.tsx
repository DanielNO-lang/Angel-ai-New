/**
 * ANGEL AI — Agent Session History Sidebar
 * Displays chat logs, decision traces, and execution histories with Re-run and Fork capabilities.
 */

import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  GitFork,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Terminal,
  ArrowRight,
  Play,
  X,
  Bot,
  Zap,
} from 'lucide-react';
import { AgentExecutionRecord } from '../../types';

interface SessionHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  executions: AgentExecutionRecord[];
  onRerun: (record: AgentExecutionRecord) => void;
  onFork: (record: AgentExecutionRecord) => void;
}

export const SessionHistorySidebar: React.FC<SessionHistorySidebarProps> = ({
  isOpen,
  onClose,
  isLight,
  executions,
  onRerun,
  onFork,
}) => {
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(
    executions[0]?.id || null
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 shadow-2xl flex flex-col transition-all duration-200 animate-in slide-in-from-right-4">
      {/* Container Background */}
      <div
        className={`flex-1 flex flex-col h-full border-l ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0E121B] border-white/10 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isLight ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-[#121622]/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-tight">Session History</h3>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                {executions.length} past workflow execution traces
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'hover:bg-slate-200 text-slate-500'
                : 'hover:bg-neutral-800 text-neutral-400'
            }`}
            title="Close History Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Executions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {executions.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Clock className="w-8 h-8 text-neutral-500 mx-auto opacity-40" />
              <p className="text-xs font-semibold">No Past Executions</p>
              <p className="text-[11px] opacity-70">
                Run a worker pipeline to log real-time decision traces and execution records here.
              </p>
            </div>
          ) : (
            executions.map((record) => {
              const isExpanded = expandedRecordId === record.id;
              const isCompleted = record.status === 'completed';
              const isFailed = record.status === 'failed';

              return (
                <div
                  key={record.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? isLight
                        ? 'border-indigo-300 bg-indigo-50/30 shadow-xs'
                        : 'border-indigo-500/40 bg-indigo-950/20 shadow-xs'
                      : isLight
                      ? 'border-slate-200/80 bg-white hover:border-slate-300'
                      : 'border-white/5 bg-[#121622]/80 hover:border-white/10'
                  }`}
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() =>
                      setExpandedRecordId(isExpanded ? null : record.id)
                    }
                    className="p-3 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-xs font-bold truncate">
                          {record.agentName}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : isFailed
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>

                    <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                      "{record.taskPrompt}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono opacity-60 pt-1">
                      <span>{record.startedAt ? new Date(record.startedAt).toLocaleTimeString() : 'Recent'}</span>
                      <div className="flex items-center gap-1">
                        <span>{record.logs?.length || 0} trace steps</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Decision Traces & Action Buttons */}
                  {isExpanded && (
                    <div className={`p-3 border-t space-y-3 ${isLight ? 'border-indigo-100 bg-white' : 'border-white/5 bg-[#0E121B]'}`}>
                      {/* Action Bar: Re-run & Fork Workflow */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onRerun(record)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Re-run this past workflow through the pipeline"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-run</span>
                        </button>

                        <button
                          onClick={() => onFork(record)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isLight
                              ? 'border-slate-300 hover:bg-slate-100 text-slate-700'
                              : 'border-white/10 hover:bg-white/5 text-neutral-200'
                          }`}
                          title="Fork this task into a new customizable workflow"
                        >
                          <GitFork className="w-3.5 h-3.5 text-purple-400" />
                          <span>Fork</span>
                        </button>
                      </div>

                      {/* Decision Traces & Logs View */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 flex items-center gap-1">
                          <Terminal className="w-3 h-3 text-indigo-400" />
                          Decision Traces
                        </span>

                        <div className={`p-2.5 rounded-xl border space-y-2 text-[11px] font-mono max-h-48 overflow-y-auto custom-scrollbar ${
                          isLight ? 'bg-slate-50 border-slate-200/80 text-slate-700' : 'bg-black/40 border-white/5 text-neutral-300'
                        }`}>
                          {record.logs && record.logs.length > 0 ? (
                            record.logs.map((log, idx) => (
                              <div key={idx} className="space-y-0.5 border-b border-inherit pb-1.5 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between text-[9px] opacity-60">
                                  <span className="text-indigo-400 uppercase font-semibold">
                                    Stage {idx + 1}: {log.stage}
                                  </span>
                                  <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                                </div>
                                <p className="leading-snug">{log.message}</p>
                              </div>
                            ))
                          ) : (
                            <p className="opacity-50 text-[10px]">No step logs attached to this trace.</p>
                          )}
                        </div>
                      </div>

                      {/* Tools Used Badge List */}
                      {record.toolsUsed && record.toolsUsed.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono opacity-60 block">Tools Executed:</span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {record.toolsUsed.map((tool) => (
                              <span
                                key={tool}
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
