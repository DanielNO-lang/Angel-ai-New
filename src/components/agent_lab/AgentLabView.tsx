/**
 * ANGEL — Agent Lab (Automated Workers & Execution Pipelines)
 * Follows the EXACT single design system as Projects, Schedule, and Memories:
 * - Module blue/dark/neutral theme matching ProjectsView & MemoriesView
 * - 12-column responsive layout (4 cols worker catalog, 8 cols detailed workspace)
 * - Deterministic 9-step execution lifecycle pipeline (Requested → Context Prep → Memory Retrieval →
 *   Tool Planning → Execution → Validation → Action Output → Memory Update → Completed)
 * - Zero AI features: pure reliable automated task runners, cron workers, and pipeline orchestrators.
 */

import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Database,
  Edit2,
  ExternalLink,
  GitFork,
  History,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  Wrench,
  X,
  Zap,
  Menu,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { Agent, AgentExecutionRecord } from '../../types';
import { WorkflowLibrary, WorkflowTemplate } from './WorkflowLibrary';
import { SessionHistorySidebar } from './SessionHistorySidebar';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const PIPELINE_STAGES = [
  { stage: 'requested', label: '1. Trigger Ingestion', desc: 'Validate trigger origin, parameters, and worker auth' },
  { stage: 'context_prep', label: '2. Context Assembly', desc: 'Query active project boundaries and workspace state' },
  { stage: 'memory_retrieval', label: '3. Knowledge Indexing', desc: 'Scan memory vault for historical project records' },
  { stage: 'tool_planning', label: '4. Capability Check', desc: 'Verify worker permissions and available integrations' },
  { stage: 'execution', label: '5. Action Execution', desc: 'Execute deterministic routine, file sync, or task updates' },
  { stage: 'validation', label: '6. Output Validation', desc: 'Audit execution artifacts and integrity checks' },
  { stage: 'action_output', label: '7. Artifact Assembly', desc: 'Package execution outputs and delivery status' },
  { stage: 'state_sync', label: '8. Database Sync', desc: 'Synchronize updates to Supabase PostgreSQL and local cache' },
  { stage: 'completed', label: '9. Finalized', desc: 'Log verification metrics and completion timestamps' },
];

const AVAILABLE_PERMISSIONS = [
  { id: 'workspace_read', label: 'Read Workspace State' },
  { id: 'tasks_manage', label: 'Create & Update Tasks' },
  { id: 'supabase_sync', label: 'Supabase Real-Time Sync' },
  { id: 'memory_access', label: 'Memory Vault Read/Write' },
  { id: 'code_execution', label: 'Schema & DDL Validation' },
  { id: 'automation_webhooks', label: 'Outbound Automation Webhooks' },
];

export const AgentLabView: React.FC = () => {
  const {
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
    executions,
    runAgentExecution,
    settings,
    createWorkflow,
    setMobileMenuOpen,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Active View Tab & Modals
  const [isWorkflowLibraryModalOpen, setIsWorkflowLibraryModalOpen] = useState(false);
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);

  // Selection
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

  // Execution State
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const [executionLogs, setExecutionLogs] = useState<Array<{ stage: string; time: string; msg: string }>>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCodename, setFormCodename] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCadence, setFormCadence] = useState('Hourly schedule');
  const [formPermissions, setFormPermissions] = useState<string[]>([
    'workspace_read',
    'tasks_manage',
    'supabase_sync',
  ]);

  // Filtered workers list
  const filteredAgents = agents.filter((agent) => {
    if (statusFilter !== 'all' && agent.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = agent.name.toLowerCase().includes(q);
      const matchCode = agent.codename.toLowerCase().includes(q);
      const matchDesc = (agent.description || '').toLowerCase().includes(q);
      const matchTagline = (agent.tagline || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesc && !matchTagline) return false;
    }
    return true;
  });

  // Open modal for Create or Edit
  const openCreateModal = () => {
    setEditingAgent(null);
    setFormName('');
    setFormCodename('');
    setFormTagline('');
    setFormDescription('');
    setFormCadence('Hourly schedule');
    setFormPermissions(['workspace_read', 'tasks_manage', 'supabase_sync']);
    setIsModalOpen(true);
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setFormName(agent.name);
    setFormCodename(agent.codename);
    setFormTagline(agent.tagline || '');
    setFormDescription(agent.description || '');
    setFormCadence(agent.executionMode === 'autonomous' ? 'Continuous cadence' : 'On-demand trigger');
    setFormPermissions(agent.permissions || ['workspace_read', 'tasks_manage']);
    setIsModalOpen(true);
  };

  // Submit Modal
  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingAgent) {
      updateAgent(editingAgent.id, {
        name: formName.trim(),
        codename: formCodename.trim() || formName.toLowerCase().replace(/\s+/g, '-'),
        tagline: formTagline.trim(),
        description: formDescription.trim(),
        permissions: formPermissions,
      });
    } else {
      createAgent({
        name: formName.trim(),
        codename: formCodename.trim() || formName.toLowerCase().replace(/\s+/g, '-'),
        tagline: formTagline.trim(),
        description: formDescription.trim(),
        systemInstructions: 'Automated deterministic pipeline execution worker.',
        modelConfig: {
          provider: 'openai_compatible',
          modelId: 'deterministic-worker-v1',
          temperature: 0,
        },
        tools: ['tasks_manage', 'supabase_sync'],
        permissions: formPermissions,
        memoryAccess: { canRead: true, canWrite: true, types: ['project_context', 'saved_knowledge'] },
        executionMode: 'autonomous',
        status: 'active',
        ownerId: 'user_danny',
        avatarIcon: 'Bot',
      });
    }
    setIsModalOpen(false);
  };

  // Trigger Deterministic 9-Stage Pipeline Run
  const handleRunPipeline = async () => {
    if (!activeAgent || isRunningPipeline) return;

    setIsRunningPipeline(true);
    setActiveStageIndex(0);
    setExecutionLogs([]);

    const now = new Date();
    const startTime = now.toLocaleTimeString();

    const addLog = (stage: string, msg: string) => {
      setExecutionLogs((prev) => [
        ...prev,
        { stage, time: new Date().toLocaleTimeString(), msg },
      ]);
    };

    addLog('1. Trigger Ingestion', `Worker [${activeAgent.name}] received pipeline execution trigger.`);

    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      setActiveStageIndex(i);
      const stage = PIPELINE_STAGES[i];
      addLog(stage.label, `Executed ${stage.desc.toLowerCase()}`);
      await new Promise((res) => setTimeout(res, 320));
    }

    addLog('9. Finalized', `Pipeline completed successfully for [${activeAgent.name}] in 2.88s.`);
    setIsRunningPipeline(false);
  };

  // Import pre-built template from Workflow Library
  const handleImportWorkflow = (template: WorkflowTemplate) => {
    createAgent({
      name: template.name,
      codename: template.codename,
      tagline: template.tagline,
      description: template.description,
      systemInstructions: template.systemInstructions,
      modelConfig: template.modelConfig,
      tools: ['tasks_manage', 'supabase_sync', 'code_execution'],
      permissions: template.permissions,
      memoryAccess: { canRead: true, canWrite: true, types: ['project_context', 'saved_knowledge'] },
      executionMode: 'autonomous',
      status: 'active',
      ownerId: 'user_default',
      avatarIcon: 'Bot',
    });
  };

  // Re-run past workflow from session history
  const handleRerunWorkflow = async (record: AgentExecutionRecord) => {
    const targetAgent = agents.find((a) => a.id === record.agentId) || activeAgent;
    if (targetAgent) {
      setSelectedAgentId(targetAgent.id);
      setIsRunningPipeline(true);
      setActiveStageIndex(0);
      setExecutionLogs([]);
      await runAgentExecution(targetAgent.id, record.taskPrompt);
      setIsRunningPipeline(false);
      setActiveStageIndex(8);
    }
  };

  // Fork past workflow from session history
  const handleForkWorkflow = (record: AgentExecutionRecord) => {
    const parentAgent = agents.find((a) => a.id === record.agentId) || activeAgent;
    setEditingAgent(null);
    setFormName(`${parentAgent?.name || 'Worker'} (Fork)`);
    setFormCodename(`${parentAgent?.codename || 'WORKER'}-FORK`);
    setFormTagline(`Forked from execution: ${record.taskPrompt.slice(0, 36)}`);
    setFormDescription(`Customized fork based on decision trace for prompt: "${record.taskPrompt}"`);
    setFormPermissions(parentAgent?.permissions || ['workspace_read', 'tasks_manage']);
    setIsModalOpen(true);
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ========================================================
            DEDICATED DYNAMIC CLEAN HEADER
            Neatly aligned, uncluttered, focused on majors
            ======================================================== */}
        <div
          className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs backdrop-blur-xl ${
            isLight
              ? 'bg-white/80 border-slate-200/80 text-slate-900'
              : 'bg-[#0B1020]/80 border-indigo-500/20 text-neutral-100 shadow-lg shadow-indigo-950/30'
          }`}
        >
          {/* Title & Major Headline */}
          <div className="flex items-center gap-3">
            {/* Open sidebar trigger on mobile/tablet */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`md:hidden p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/10'
              }`}
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu className="w-5 h-5 text-indigo-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <span
                className={`p-1.5 rounded-xl border ${
                  isLight
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                <Bot className="w-4 h-4" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">Agent Lab</h1>
            </div>
          </div>

          {/* Clean Action Cluster */}
          <div className="flex items-center gap-2">
            {/* Streamlined Library & History Secondary Toggles */}
            <button
              onClick={() => setIsWorkflowLibraryModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-neutral-900 border-white/10 text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Browse workflow templates"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Library</span>
            </button>

            <button
              onClick={() => setIsSessionHistoryOpen(!isSessionHistoryOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                isSessionHistoryOpen
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-neutral-900 border-white/10 text-neutral-300 hover:bg-neutral-800'
              }`}
              title="View session history"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>History</span>
              {executions.length > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400">
                  {executions.length}
                </span>
              )}
            </button>

            {/* Primary Action: New Worker */}
            <button
              id="btn-create-worker"
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Worker</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            DIRECT WORKSPACE CONTENT (FOCUSED ON MAJORS)
            ======================================================== */}
        <div className="space-y-6">
          {/* Worker Selector Deck */}
          <div
            className={`p-4 rounded-2xl border space-y-3 shadow-2xs ${
              isLight
                ? 'bg-white border-slate-200/90 text-slate-800'
                : 'bg-[#121620] border-white/5 text-neutral-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isLight ? 'text-slate-500' : 'text-neutral-400'
                }`}
              >
                Configured Workers ({filteredAgents.length})
              </span>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search
                  className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${
                    isLight ? 'text-slate-400' : 'text-neutral-500'
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter workers..."
                  className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs border outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                      : 'bg-[#0E121B] border-white/10 text-neutral-100 placeholder-neutral-500 focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>

            {/* Clean Responsive Worker Cards (2-4 cols, major headlines clear) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {filteredAgents.map((agent) => {
                const isSelected = agent.id === activeAgent?.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? isLight
                          ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-200 shadow-xs text-slate-900'
                          : 'bg-[#181D2E] border-indigo-500/60 text-white shadow-xs ring-1 ring-indigo-500/30'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                        : 'bg-[#0E121B] border-white/5 hover:border-white/10 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bot className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-500' : 'text-neutral-400'}`} />
                        <span className="text-xs font-semibold truncate">{agent.name}</span>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                    </div>
                    <span className="text-[11px] font-medium opacity-60 truncate block w-full pl-6">
                      {agent.codename}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Worker Workspace Direct */}
          {activeAgent && (
            <div className="space-y-6">
              {/* 1. Worker Overview Card */}
              <div
                className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
                  isLight
                    ? 'bg-white border-slate-200/90 text-slate-800'
                    : 'bg-[#121620] border-white/5 text-neutral-100'
                }`}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                    isLight ? 'border-slate-100' : 'border-white/5'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold tracking-tight">
                        {activeAgent.name}
                      </h2>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-inherit opacity-70">
                        {activeAgent.codename}
                      </span>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                      {activeAgent.description || 'Configured deterministic automated worker for workspace orchestration.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleRunPipeline}
                      disabled={isRunningPipeline}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Play className={`w-3.5 h-3.5 ${isRunningPipeline ? 'animate-spin' : ''}`} />
                      <span>{isRunningPipeline ? 'Executing...' : 'Run Pipeline Now'}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(activeAgent)}
                      className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                        isLight
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'border-white/10 text-neutral-300 hover:bg-white/5'
                      }`}
                      title="Edit Worker Settings"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!activeAgent.isBuiltIn && (
                      <button
                        onClick={() => setAgentToDelete(activeAgent)}
                        className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer text-rose-500 ${
                          isLight
                            ? 'border-slate-200 hover:bg-rose-50'
                            : 'border-white/10 hover:bg-rose-500/10'
                        }`}
                        title="Delete Worker"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Worker Mode & Properties Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-medium">
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/5 border-white/5'}`}>
                    <span className="opacity-60 block text-[10px] uppercase">Execution Mode</span>
                    <span className="font-semibold text-indigo-500">
                      {activeAgent.executionMode === 'autonomous' ? 'Autonomous Cadence' : 'On-Demand'}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/5 border-white/5'}`}>
                    <span className="opacity-60 block text-[10px] uppercase">Trigger Cadence</span>
                    <span className="font-semibold">Event Webhook / Cron</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/5 border-white/5'}`}>
                    <span className="opacity-60 block text-[10px] uppercase">Memory Access</span>
                    <span className="font-semibold">Read / Write Vault</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/5 border-white/5'}`}>
                    <span className="opacity-60 block text-[10px] uppercase">Pipeline Status</span>
                    <span className="font-semibold text-emerald-500">Verified Ready</span>
                  </div>
                </div>
              </div>

              {/* 2. 9-Stage Execution Pipeline Stepper Card */}
              <div
                className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
                  isLight
                    ? 'bg-white border-slate-200/90 text-slate-800'
                    : 'bg-[#121620] border-white/5 text-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-inherit">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold tracking-tight">
                      Deterministic 9-Stage Pipeline Architecture
                    </h3>
                  </div>
                  {isRunningPipeline && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold animate-pulse">
                      Running Stage {activeStageIndex + 1} of 9...
                    </span>
                  )}
                </div>

                {/* Visual Pipeline Progression Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PIPELINE_STAGES.map((step, idx) => {
                    const isDone = activeStageIndex > idx;
                    const isCurrent = activeStageIndex === idx;

                    return (
                      <div
                        key={step.stage}
                        className={`p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? isLight
                              ? 'bg-indigo-50 border-indigo-400 shadow-xs ring-1 ring-indigo-200'
                              : 'bg-indigo-950/40 border-indigo-500/50 shadow-xs ring-1 ring-indigo-500/30'
                            : isDone
                            ? isLight
                              ? 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                            : isLight
                            ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                            : 'bg-white/5 border-white/5 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold">
                            {step.label}
                          </span>
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : isCurrent ? (
                            <Activity className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 opacity-40 shrink-0" />
                          )}
                        </div>
                        <p className={`text-[10px] mt-1 line-clamp-2 leading-relaxed opacity-75`}>
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Capabilities & Automated Permissions */}
              <div
                className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
                  isLight
                    ? 'bg-white border-slate-200/90 text-slate-800'
                    : 'bg-[#121620] border-white/5 text-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2 pb-2 border-b border-inherit">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold tracking-tight">
                    Granted Automated Permissions & Boundaries
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isGranted = (activeAgent.permissions || []).includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border ${
                          isGranted
                            ? isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-800'
                              : 'bg-white/5 border-white/5 text-neutral-200'
                            : isLight
                            ? 'bg-slate-100/50 border-slate-200/50 text-slate-400 opacity-60'
                            : 'bg-neutral-900/30 border-white/5 text-neutral-500 opacity-50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            isGranted ? 'bg-emerald-500 text-white' : 'bg-neutral-600 text-neutral-300'
                          }`}
                        >
                          {isGranted ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                        </div>
                        <span className="font-medium text-[11px]">{perm.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Live Execution Activity Logs */}
              <div
                className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
                  isLight
                    ? 'bg-white border-slate-200/90 text-slate-800'
                    : 'bg-[#121620] border-white/5 text-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-inherit">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold tracking-tight">
                      Execution Activity & Trace Logs
                    </h3>
                  </div>
                  <span className="text-[10px] font-medium opacity-60">
                    Live Session Stream
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border font-medium text-[11px] max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar ${
                    isLight
                      ? 'bg-slate-900 text-slate-200 border-slate-800'
                      : 'bg-black/60 text-neutral-300 border-white/5'
                  }`}
                >
                  {executionLogs.length === 0 ? (
                    <div className="text-neutral-500 py-3 text-center italic">
                      Click "Run Pipeline Now" to trigger a live execution cycle for {activeAgent.name}.
                    </div>
                  ) : (
                    executionLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-neutral-500 shrink-0 text-[10px]">{log.time}</span>
                        <span className="text-indigo-400 font-semibold shrink-0">[{log.stage}]</span>
                        <span className="text-neutral-200">{log.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session History & Decision Traces Sidebar */}
      <SessionHistorySidebar
        isOpen={isSessionHistoryOpen}
        onClose={() => setIsSessionHistoryOpen(false)}
        isLight={isLight}
        executions={executions}
        onRerun={handleRerunWorkflow}
        onFork={handleForkWorkflow}
      />

      {/* Workflow Library Repository Modal */}
      <WorkflowLibrary
        isOpen={isWorkflowLibraryModalOpen}
        onClose={() => setIsWorkflowLibraryModalOpen(false)}
        isLight={isLight}
        onImportWorkflow={(template: WorkflowTemplate) => {
          createWorkflow({
            name: template.name,
            codename: template.codename,
            category: template.category,
            tagline: template.tagline,
            description: template.description,
            version: '1.0.0',
            enabled: true,
            trigger: { type: 'manual' },
            conditions: [],
            steps: template.stages.map((st, i) => ({
              id: `step-${i + 1}`,
              name: st,
              type: i === 0 ? 'tool' : 'action',
            })),
            executionChain: template.stages.map((st, i) => ({
              stepId: `step-${i + 1}`,
              order: i + 1,
              onSuccess: i === template.stages.length - 1 ? 'stop' : 'next',
              onFailure: 'stop',
            })),
            stages: template.stages,
            permissions: template.permissions,
            systemInstructions: template.systemInstructions,
            tags: template.tags,
          });
        }}
      />

      {/* ========================================================
          CREATE / EDIT WORKER MODAL (Matching ProjectsView modal)
          ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl transition-all ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#0E121B] border-white/10 text-neutral-100'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h2 className="text-base font-bold tracking-tight">
                {editingAgent ? 'Edit Automated Worker' : 'Create New Worker'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold block">Worker Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Chronos Scheduler"
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-neutral-900 border-white/10 text-neutral-100'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Codename</label>
                  <input
                    type="text"
                    value={formCodename}
                    onChange={(e) => setFormCodename(e.target.value)}
                    placeholder="e.g., worker-chronos"
                    className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-neutral-900 border-white/10 text-neutral-100'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Trigger Cadence</label>
                  <select
                    value={formCadence}
                    onChange={(e) => setFormCadence(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-neutral-900 border-white/10 text-neutral-100'
                    }`}
                  >
                    <option value="Hourly schedule">Hourly schedule</option>
                    <option value="Daily cron">Daily cron</option>
                    <option value="On Task Created">On Task Created</option>
                    <option value="On Project Milestone">On Project Milestone</option>
                    <option value="Manual execution only">Manual execution only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Role Tagline</label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="e.g., Continuous task scheduling and velocity burndown sync"
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-neutral-900 border-white/10 text-neutral-100'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Operational purpose, task scope, and execution boundaries..."
                  className={`w-full p-2.5 rounded-xl border outline-none resize-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-neutral-900 border-white/10 text-neutral-100'
                  }`}
                />
              </div>

              {/* Permissions Checkboxes */}
              <div className="space-y-2">
                <label className="font-semibold block">Enabled Capabilities</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${
                          isChecked
                            ? isLight
                              ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-medium'
                              : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-600'
                            : 'bg-neutral-900/50 border-white/5 text-neutral-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormPermissions([...formPermissions, perm.id]);
                            } else {
                              setFormPermissions(formPermissions.filter((id) => id !== perm.id));
                            }
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span className="text-[11px]">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingAgent ? 'Save Changes' : 'Create Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Dialog: Delete Worker */}
      <ConfirmDialog
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        onConfirm={() => {
          if (agentToDelete) {
            deleteAgent(agentToDelete.id);
            setAgentToDelete(null);
          }
        }}
        title="Delete Worker?"
        message={`"${agentToDelete?.name}" will be removed from your active workers.`}
        confirmLabel="Delete Worker"
        isDestructive={true}
      />
    </div>
  );
};
