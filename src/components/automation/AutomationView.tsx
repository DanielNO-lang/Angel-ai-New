/**
 * ANGEL AI — Automation Platform Workspace
 * Event-driven automation creator, trigger builder, branching inspector,
 * and real-time execution trace viewer showing:
 * What Triggered -> What Angel Decided -> What Ran -> What Failed -> What Completed.
 */

import React, { useState } from 'react';
import {
  Zap,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  GitBranch,
  RotateCcw,
  Sparkles,
  Share2,
  Filter,
  Layers,
  ChevronRight,
  Terminal,
  Activity,
  Bot,
  Wrench,
  Bell,
  Code,
  Check,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import {
  AutomationDefinition,
  AutomationExecutionRecord,
  AutomationTriggerEventType,
  AutomationStep,
  ConditionOperator,
} from '../../types';
import {
  getSavedAutomations,
  saveAutomations,
  getSavedExecutionHistory,
  saveExecutionHistory,
  dispatchEventToAutomations,
} from '../../services/automation/automationEngine';

export const AutomationView: React.FC = () => {
  const { settings, createTask, createMemory, activeProjectId, projects } = useAngel();
  const isLight = settings.theme === 'light';

  // State
  const [automations, setAutomations] = useState<AutomationDefinition[]>(() => getSavedAutomations());
  const [history, setHistory] = useState<AutomationExecutionRecord[]>(() => getSavedExecutionHistory());
  const [selectedAutoId, setSelectedAutoId] = useState<string>(automations[0]?.id || '');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(history[0]?.id || null);
  const [activeTabMode, setActiveTabMode] = useState<'workflows' | 'history' | 'builder'>('workflows');
  const [isExecuting, setIsExecuting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // New Workflow form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTriggerType, setNewTriggerType] = useState<AutomationTriggerEventType>('task.created');
  const [newField, setNewField] = useState('priority');
  const [newOp, setNewOp] = useState<ConditionOperator>('equals');
  const [newVal, setNewVal] = useState('urgent');

  const selectedAutomation = automations.find((a) => a.id === selectedAutoId) || automations[0];
  const selectedRun = history.find((h) => h.id === selectedRunId) || history[0];

  const handleToggleEnable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    setAutomations(updated);
    saveAutomations(updated);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = automations.filter((a) => a.id !== id);
    setAutomations(updated);
    saveAutomations(updated);
    if (selectedAutoId === id && updated.length > 0) {
      setSelectedAutoId(updated[0].id);
    }
  };

  const handleManualTrigger = async (auto: AutomationDefinition) => {
    setIsExecuting(true);
    setStatusNotice(`Triggering automation "${auto.name}"...`);

    const simulatedPayload: Record<string, any> = {
      title: 'Manual Test Execution Event',
      description: 'Triggered directly from the Angel Automation Platform test runner.',
      priority: 'urgent',
      datasetName: 'Telemetry Production Metrics',
      hasAnomalies: true,
      allTasksDone: true,
      triggeredAt: new Date().toISOString(),
      projectId: activeProjectId || 'proj-default',
    };

    try {
      const records = await dispatchEventToAutomations(auto.trigger.type, simulatedPayload, {
        createTask: async (t) => createTask(t),
        createMemory: async (m) => createMemory(m),
        showToast: (t, m) => {
          setStatusNotice(`Alert: ${t} — ${m}`);
        },
      });

      const updatedHistory = getSavedExecutionHistory();
      setHistory(updatedHistory);
      if (records.length > 0) {
        setSelectedRunId(records[0].id);
        setActiveTabMode('history');
      }
      setStatusNotice(`Executed automation "${auto.name}" successfully!`);
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err: any) {
      setStatusNotice(`Execution error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCreateWorkflow = () => {
    if (!newTitle.trim()) return;

    const newAuto: AutomationDefinition = {
      id: `auto-${Date.now()}`,
      name: newTitle.trim(),
      description: newDesc.trim() || 'Custom user-defined Angel automation workflow.',
      enabled: true,
      trigger: {
        type: newTriggerType,
      },
      conditions: [
        {
          id: `cond-${Date.now()}`,
          field: newField,
          operator: newOp,
          value: newVal,
        },
      ],
      steps: [
        {
          id: `step-${Date.now()}-1`,
          name: 'Angel Strategic Assessment',
          type: 'agent_execution',
          agentId: 'core',
          promptTemplate: 'Analyze the incoming event "{{title}}" and formulate an immediate action plan.',
        },
        {
          id: `step-${Date.now()}-2`,
          name: 'Record Context into Memory Vault',
          type: 'action',
          actionType: 'write_memory',
          actionPayload: {
            title: `Automated Log: ${newTitle}`,
            content: 'Logged automated decision and trigger payload into long-term context.',
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['custom', 'workflow'],
    };

    const updated = [newAuto, ...automations];
    setAutomations(updated);
    saveAutomations(updated);
    setSelectedAutoId(newAuto.id);
    setActiveTabMode('workflows');
    setNewTitle('');
    setNewDesc('');
    setStatusNotice(`Workflow "${newAuto.name}" created!`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div
          className={`p-4 sm:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`p-3 rounded-2xl border ${
                isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              <Zap className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Event-Driven Automation Engine</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Event Stream Active
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Deterministic triggers, conditional branching, autonomous agent execution, and Zapier/outbound webhooks.
              </p>
            </div>
          </div>

          {/* Tab Pill Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabMode('workflows')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                activeTabMode === 'workflows'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              Workflows ({automations.length})
            </button>
            <button
              onClick={() => setActiveTabMode('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTabMode === 'history'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Execution Trace ({history.length})
            </button>
            <button
              onClick={() => setActiveTabMode('builder')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTabMode === 'builder'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              New Automation
            </button>
          </div>
        </div>

        {/* Status Notice Toast */}
        {statusNotice && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* ========================================================
            VIEW MODE: WORKFLOWS LIST & INSPECTOR
            ======================================================== */}
        {activeTabMode === 'workflows' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Automation Cards */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Active Automation Pipelines
              </span>

              {automations.map((auto) => {
                const isSelected = auto.id === selectedAutomation?.id;
                return (
                  <div
                    key={auto.id}
                    onClick={() => setSelectedAutoId(auto.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-amber-50/70 border-amber-400 shadow-sm'
                          : 'bg-[#151B28] border-amber-500/40 shadow-md'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-[#10141E] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{auto.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              auto.enabled
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-neutral-500/10 text-neutral-400'
                            }`}
                          >
                            {auto.enabled ? 'Enabled' : 'Paused'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-2">{auto.description}</p>
                      </div>

                      <button
                        onClick={(e) => handleToggleEnable(auto.id, e)}
                        title={auto.enabled ? 'Pause automation' : 'Enable automation'}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                          auto.enabled
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-neutral-500/10 border-neutral-500/20 text-neutral-400'
                        }`}
                      >
                        {auto.enabled ? <Check className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Trigger: {auto.trigger.type}
                      </span>
                      <span>{auto.steps.length} Steps</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Workflow Detail & Steps */}
            {selectedAutomation && (
              <div
                className={`lg:col-span-7 p-6 rounded-3xl border space-y-6 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                {/* Header Action Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                      Workflow Pipeline Inspector
                    </span>
                    <h2 className="text-lg font-bold">{selectedAutomation.name}</h2>
                    <p className="text-xs text-neutral-400">{selectedAutomation.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleManualTrigger(selectedAutomation)}
                      disabled={isExecuting}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isExecuting ? 'Running...' : 'Run Test'}
                    </button>
                    <button
                      onClick={(e) => handleDelete(selectedAutomation.id, e)}
                      className="p-1.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs cursor-pointer"
                      title="Delete automation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Trigger & Conditions Box */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono flex items-center gap-2 text-amber-400">
                      <Zap className="w-4 h-4" />
                      1. Trigger Event Contract
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300">
                      {selectedAutomation.trigger.type}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-neutral-400">Conditions Evaluated by Angel:</span>
                    {selectedAutomation.conditions.length === 0 ? (
                      <p className="text-neutral-500 text-[11px]">Unconditional trigger (fires on all events).</p>
                    ) : (
                      <div className="space-y-1">
                        {selectedAutomation.conditions.map((cond, idx) => (
                          <div
                            key={cond.id}
                            className="px-2.5 py-1.5 rounded-lg bg-black/20 font-mono text-[11px] flex items-center gap-2"
                          >
                            <Filter className="w-3 h-3 text-amber-400" />
                            <span>
                              {cond.field} <span className="text-amber-400">{cond.operator}</span> {String(cond.value)}
                            </span>
                            {idx < selectedAutomation.conditions.length - 1 && (
                              <span className="ml-auto text-[10px] text-neutral-500 font-bold uppercase">
                                {cond.join || 'AND'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Execution Steps */}
                <div className="space-y-3">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    2. Workflow Step Chain ({selectedAutomation.steps.length} Steps)
                  </span>

                  <div className="space-y-3">
                    {selectedAutomation.steps.map((step, idx) => {
                      return (
                        <div
                          key={step.id}
                          className={`p-4 rounded-2xl border space-y-2 ${
                            isLight ? 'bg-white border-slate-200' : 'bg-[#151926] border-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold">{step.name}</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 uppercase opacity-70">
                              {step.type}
                            </span>
                          </div>

                          {/* Step Details according to type */}
                          {step.type === 'agent_execution' && (
                            <div className="text-xs text-neutral-400 space-y-1 bg-black/20 p-2.5 rounded-xl font-mono text-[11px]">
                              <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                                <Bot className="w-3 h-3" />
                                Agent: {step.agentId || 'core'}
                              </div>
                              <p className="line-clamp-2 text-neutral-300">Prompt: {step.promptTemplate}</p>
                            </div>
                          )}

                          {step.type === 'action' && (
                            <div className="text-xs text-neutral-400 space-y-1 bg-black/20 p-2.5 rounded-xl font-mono text-[11px]">
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                <Bell className="w-3 h-3" />
                                Action: {step.actionType}
                              </div>
                              <p className="line-clamp-2 text-neutral-300">
                                Payload: {JSON.stringify(step.actionPayload)}
                              </p>
                            </div>
                          )}

                          {step.type === 'branch' && step.branchConfig && (
                            <div className="text-xs text-neutral-400 space-y-1 bg-black/20 p-2.5 rounded-xl font-mono text-[11px]">
                              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                                <GitBranch className="w-3 h-3" />
                                Branch Condition: {step.branchConfig.conditionField}{' '}
                                {step.branchConfig.operator} {step.branchConfig.conditionValue}
                              </div>
                              <div className="flex gap-4 text-[10px] text-neutral-400">
                                <span>THEN: {step.branchConfig.thenStepIds.join(', ')}</span>
                                <span>ELSE: {step.branchConfig.elseStepIds.join(', ')}</span>
                              </div>
                            </div>
                          )}

                          {step.type === 'webhook' && (
                            <div className="text-xs text-neutral-400 space-y-1 bg-black/20 p-2.5 rounded-xl font-mono text-[11px]">
                              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                                <Share2 className="w-3 h-3" />
                                Webhook: {step.webhookMethod || 'POST'} {step.webhookUrl || '(Settings Default)'}
                              </div>
                              {step.retryPolicy && (
                                <p className="text-[10px] text-neutral-400">
                                  Retry Policy: {step.retryPolicy.maxRetries} max retries ({step.retryPolicy.backoffMs}ms backoff)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            VIEW MODE: EXECUTION AUDIT TRACE
            What triggered -> What Angel decided -> What ran -> What failed -> What completed
            ======================================================== */}
        {activeTabMode === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left list of runs */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Recent Automation Runs ({history.length})
              </span>

              {history.length === 0 ? (
                <div
                  className={`p-8 rounded-2xl border text-center space-y-2 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                  }`}
                >
                  <Activity className="w-8 h-8 text-neutral-500 mx-auto" />
                  <p className="text-xs text-neutral-400">No automation runs recorded yet.</p>
                  <button
                    onClick={() => selectedAutomation && handleManualTrigger(selectedAutomation)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-semibold text-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Trigger First Test
                  </button>
                </div>
              ) : (
                history.map((run) => {
                  const isSelected = run.id === selectedRun?.id;
                  return (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-amber-50/70 border-amber-400 shadow-sm'
                            : 'bg-[#151B28] border-amber-500/40 shadow-md'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-[#10141E] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs">{run.automationName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            run.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : run.status === 'failed'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-neutral-500/10 text-neutral-400'
                          }`}
                        >
                          {run.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                        <span>Event: {run.triggerEvent}</span>
                        <span>{run.durationMs}ms</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Execution Detail: Deep Audit Trail */}
            {selectedRun && (
              <div
                className={`lg:col-span-7 p-6 rounded-3xl border space-y-6 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                      Audit Trace Breakdown
                    </span>
                    <h2 className="text-base font-bold">{selectedRun.automationName}</h2>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Run ID: {selectedRun.id} • Started: {new Date(selectedRun.startedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                      selectedRun.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {selectedRun.status.toUpperCase()} ({selectedRun.durationMs}ms)
                  </span>
                </div>

                {/* 1. What Triggered */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-2">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    1. WHAT TRIGGERED THE AUTOMATION
                  </span>
                  <div className="text-xs font-mono text-neutral-300">
                    <div>Event: <span className="text-amber-300 font-bold">{selectedRun.triggerEvent}</span></div>
                    <pre className="mt-2 p-2 rounded-xl bg-black/40 text-[11px] overflow-x-auto text-neutral-400">
                      {JSON.stringify(selectedRun.triggerPayload, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* 2. What Angel Decided */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-2">
                  <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    2. WHAT ANGEL DECIDED
                  </span>
                  <p className="text-xs font-mono text-neutral-300">{selectedRun.decisionSummary}</p>
                </div>

                {/* 3. What Ran */}
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    3. WHAT RAN ({selectedRun.stepLogs.length} Execution Steps)
                  </span>

                  <div className="space-y-2">
                    {selectedRun.stepLogs.map((log, idx) => (
                      <div
                        key={log.stepId}
                        className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                          log.status === 'completed'
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-rose-500/5 border-rose-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            {log.status === 'completed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            Step {idx + 1}: {log.stepName}
                          </span>
                          <span className="text-[10px] text-neutral-400 uppercase">{log.stepType}</span>
                        </div>
                        {log.decision && <p className="text-[11px] text-neutral-300">{log.decision}</p>}
                        {log.error && <p className="text-[11px] text-rose-400 font-bold">Error: {log.error}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. What Completed / Result Summary */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                  <span className="text-xs font-mono font-bold text-neutral-400">
                    4. FINAL EXECUTION RESULT
                  </span>
                  <p className="text-xs text-neutral-200">{selectedRun.resultSummary}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            VIEW MODE: BUILDER FORM
            ======================================================== */}
        {activeTabMode === 'builder' && (
          <div
            className={`max-w-3xl mx-auto p-6 rounded-3xl border space-y-6 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
            }`}
          >
            <div>
              <h2 className="text-lg font-bold">Construct New Event-Driven Automation</h2>
              <p className="text-xs text-neutral-400">
                Define the trigger event, conditions, and chain of autonomous agent actions.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase font-mono block mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Release Review & Discord Dispatcher"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 focus:border-amber-500'
                      : 'bg-white/5 border-white/10 focus:border-amber-400'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase font-mono block mb-1">
                  Description & Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain when this workflow should run and what business goals it achieves..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 focus:border-amber-500'
                      : 'bg-white/5 border-white/10 focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase font-mono block mb-1">
                    Trigger Event
                  </label>
                  <select
                    value={newTriggerType}
                    onChange={(e) => setNewTriggerType(e.target.value as AutomationTriggerEventType)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-neutral-900 border-white/10 text-white'
                    }`}
                  >
                    <option value="task.created">task.created</option>
                    <option value="task.completed">task.completed</option>
                    <option value="project.created">project.created</option>
                    <option value="message.sent">message.sent</option>
                    <option value="data.analyzed">data.analyzed</option>
                    <option value="webhook.received">webhook.received</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase font-mono block mb-1">
                    Condition Matcher
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Field (e.g. priority)"
                      value={newField}
                      onChange={(e) => setNewField(e.target.value)}
                      className={`w-1/3 px-2 py-2 rounded-xl border text-xs outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}
                    />
                    <select
                      value={newOp}
                      onChange={(e) => setNewOp(e.target.value as ConditionOperator)}
                      className={`w-1/3 px-2 py-2 rounded-xl border text-xs outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                      }`}
                    >
                      <option value="equals">equals</option>
                      <option value="contains">contains</option>
                      <option value="greater_than">&gt;</option>
                      <option value="less_than">&lt;</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Value"
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                      className={`w-1/3 px-2 py-2 rounded-xl border text-xs outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setActiveTabMode('workflows')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                  Save & Activate Automation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
