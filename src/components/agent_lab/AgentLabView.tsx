/**
 * ANGEL AI — Agent Lab Module
 * Extensible Agent Registry, Full Agent Configuration, and 9-Step Execution Inspector.
 * Lifecycle: requested → context preparation → memory retrieval → tool planning →
 *            execution → validation → response → memory update → completed
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Archive,
  ArrowRight,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Cpu,
  Edit2,
  ExternalLink,
  Filter,
  History,
  Info,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Trash2,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import {
  Agent,
  AgentExecutionMode,
  AgentExecutionRecord,
  AgentStatus,
  ExecutionLog,
  MemoryType,
} from '../../types';
import { Button, EmptyState } from '../ui';

const AVAILABLE_PERMISSIONS = [
  { id: 'workspace_read', label: 'Read Workspace State' },
  { id: 'workspace_write', label: 'Modify Workspace Projects' },
  { id: 'tasks_manage', label: 'Create & Update Tasks' },
  { id: 'memory_read', label: 'Read Long-Term Memories' },
  { id: 'memory_write', label: 'Formulate & Store Memories' },
  { id: 'code_execution', label: 'Code & Schema Synthesis' },
  { id: 'visual_perception', label: 'Multimodal Vision Perception' },
  { id: 'external_web', label: 'External Web Grounding' },
];

const ALL_MEMORY_TYPES: Array<{ type: MemoryType; label: string }> = [
  { type: 'user_preference', label: 'User Preferences' },
  { type: 'important_fact', label: 'Important Facts' },
  { type: 'long_term_instruction', label: 'Long-Term Instructions' },
  { type: 'agent_memory', label: 'Agent Specific' },
  { type: 'project_context', label: 'Project Context' },
  { type: 'conversation_derived', label: 'Temporary Conversation' },
  { type: 'saved_knowledge', label: 'Saved Knowledge' },
];

const LIFECYCLE_STEPS: Array<{ stage: string; label: string; description: string }> = [
  { stage: 'requested', label: '1. Requested', description: 'Validate prompt, permissions, and identity' },
  { stage: 'context_preparation', label: '2. Context Prep', description: 'Assemble project boundaries and history' },
  { stage: 'memory_retrieval', label: '3. Memory Retrieval', description: 'Score & recall relevant long-term memories' },
  { stage: 'tool_planning', label: '4. Tool Planning', description: 'Inspect permissions and discover candidate tools' },
  { stage: 'execution', label: '5. Execution', description: 'Dispatch to model provider & execute tool calls' },
  { stage: 'validation', label: '6. Validation', description: 'Verify structure, completeness, and safety' },
  { stage: 'response', label: '7. Response', description: 'Finalize synthesized executive output' },
  { stage: 'memory_update', label: '8. Memory Update', description: 'Formulate durable memories & derived tasks' },
  { stage: 'completed', label: '9. Completed', description: 'Finalize execution record and metrics' },
];

export const AgentLabView: React.FC = () => {
  const {
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
    availableTools,
    runAgentExecution,
    executions,
    createConversation,
    setActiveTab,
    selectedAgentId,
    setSelectedAgentId,
  } = useAngel();

  // Active View Tab: 'workbench' | 'inspector'
  const [activeSubTab, setActiveSubTab] = useState<'workbench' | 'inspector'>('workbench');

  // Agent selection
  const [selectedAgent, setSelectedAgent] = useState<Agent>(
    agents.find((a) => a.id === selectedAgentId) || agents[0]
  );

  // Status Filter for registry
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected execution for inspection
  const [inspectedExecutionId, setInspectedExecutionId] = useState<string | null>(null);

  // Editor Modal State
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isNewAgent, setIsNewAgent] = useState(false);

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCodename, setFormCodename] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formProvider, setFormProvider] = useState<
    'gemini' | 'openai_compatible' | 'anthropic_compatible'
  >('gemini');
  const [formModelId, setFormModelId] = useState('gemini-3.8-flash');
  const [formTemperature, setFormTemperature] = useState(0.5);
  const [formMaxTokens, setFormMaxTokens] = useState(4096);
  const [formExecutionMode, setFormExecutionMode] = useState<AgentExecutionMode>('assisted');
  const [formStatus, setFormStatus] = useState<AgentStatus>('active');
  const [formOwnerId, setFormOwnerId] = useState('user_default');
  const [formTools, setFormTools] = useState<string[]>([]);
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formMemoryRead, setFormMemoryRead] = useState(true);
  const [formMemoryWrite, setFormMemoryWrite] = useState(true);
  const [formMemoryTypes, setFormMemoryTypes] = useState<MemoryType[]>([
    'user_preference',
    'important_fact',
    'project_context',
    'saved_knowledge',
  ]);

  // Bench prompt & live execution
  const [benchPrompt, setBenchPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  // Sync selected agent
  useEffect(() => {
    const found = agents.find((a) => a.id === selectedAgentId);
    if (found && found.id !== selectedAgent.id) {
      setSelectedAgent(found);
    }
  }, [selectedAgentId, agents]);

  // Set default inspected execution
  useEffect(() => {
    if (!inspectedExecutionId && executions.length > 0) {
      setInspectedExecutionId(executions[0].id);
    }
  }, [executions, inspectedExecutionId]);

  const inspectedExecution: AgentExecutionRecord | undefined = executions.find(
    (e) => e.id === inspectedExecutionId
  ) || executions[0];

  const filteredAgents = agents.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchCode = a.codename.toLowerCase().includes(q);
      const matchDesc = a.description.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesc) return false;
    }
    return true;
  });

  const openEditor = (agent?: Agent) => {
    if (agent) {
      setIsNewAgent(false);
      setFormId(agent.id);
      setFormName(agent.name);
      setFormCodename(agent.codename);
      setFormTagline(agent.tagline);
      setFormDescription(agent.description);
      setFormInstructions(agent.systemInstructions);
      setFormProvider(agent.modelConfig.provider || 'gemini');
      setFormModelId(agent.modelConfig.modelId);
      setFormTemperature(agent.modelConfig.temperature);
      setFormMaxTokens(agent.modelConfig.maxTokens || 4096);
      setFormExecutionMode(agent.executionMode);
      setFormStatus(agent.status);
      setFormOwnerId(agent.ownerId || 'user_default');
      setFormTools(agent.tools || []);
      setFormPermissions(agent.permissions || []);
      setFormMemoryRead(agent.memoryAccess?.canRead ?? true);
      setFormMemoryWrite(agent.memoryAccess?.canWrite ?? true);
      setFormMemoryTypes(agent.memoryAccess?.types || ['user_preference', 'important_fact']);
    } else {
      setIsNewAgent(true);
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      setFormId(`agent-custom-${Date.now().toString(36)}`);
      setFormName('');
      setFormCodename(`AGENT-${randomSuffix}`);
      setFormTagline('Specialized domain assistant');
      setFormDescription('Configured for custom analytical workflows and execution.');
      setFormInstructions(
        'You are an Angel AI specialized agent. Execute instructions with crisp clarity, deep domain precision, and executive composure. Deliver structured markdown responses.'
      );
      setFormProvider('gemini');
      setFormModelId('gemini-3.8-flash');
      setFormTemperature(0.5);
      setFormMaxTokens(4096);
      setFormExecutionMode('assisted');
      setFormStatus('active');
      setFormOwnerId('user_default');
      setFormTools(['task_create', 'memory_search']);
      setFormPermissions(['workspace_read', 'tasks_manage', 'memory_read']);
      setFormMemoryRead(true);
      setFormMemoryWrite(true);
      setFormMemoryTypes(['user_preference', 'important_fact', 'project_context', 'saved_knowledge']);
    }
    setIsEditingModalOpen(true);
  };

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const agentData = {
      name: formName.trim(),
      codename: formCodename.trim().toUpperCase() || 'CUSTOM',
      tagline: formTagline.trim(),
      description: formDescription.trim(),
      systemInstructions: formInstructions.trim(),
      modelConfig: {
        provider: formProvider,
        modelId: formModelId,
        temperature: formTemperature,
        maxTokens: formMaxTokens,
      },
      tools: formTools,
      permissions: formPermissions,
      memoryAccess: {
        canRead: formMemoryRead,
        canWrite: formMemoryWrite,
        types: formMemoryTypes,
      },
      executionMode: formExecutionMode,
      status: formStatus,
      ownerId: formOwnerId || 'user_default',
      avatarIcon: 'Bot',
    };

    if (isNewAgent) {
      createAgent(agentData);
    } else {
      updateAgent(selectedAgent.id, agentData);
      setSelectedAgent((prev) => ({
        ...prev,
        ...agentData,
      }));
    }

    setIsEditingModalOpen(false);
  };

  const handleDeleteAgent = (agent: Agent) => {
    if (agent.isBuiltIn) {
      const confirmArchive = window.confirm(
        `${agent.name} is a core built-in agent. Would you like to set its status to "archived" instead?`
      );
      if (confirmArchive) {
        updateAgent(agent.id, { status: 'archived' });
      }
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete agent "${agent.name}"?`)) {
      deleteAgent(agent.id);
      const remaining = agents.filter((a) => a.id !== agent.id);
      if (remaining.length > 0) {
        setSelectedAgent(remaining[0]);
        setSelectedAgentId(remaining[0].id);
      }
    }
  };

  const handleRunBench = async () => {
    if (!benchPrompt.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const result = await runAgentExecution(selectedAgent.id, benchPrompt);
      setInspectedExecutionId(result.id);
      setActiveSubTab('inspector');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStartChatWithAgent = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    createConversation(agent.id);
    setActiveTab('chat');
  };

  const toggleTool = (toolId: string) => {
    setFormTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const togglePermission = (permId: string) => {
    setFormPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const toggleMemoryType = (memType: MemoryType) => {
    setFormMemoryTypes((prev) =>
      prev.includes(memType) ? prev.filter((t) => t !== memType) : [...prev, memType]
    );
  };

  const handleCopyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
              <Bot className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">
              Autonomous Systems & Registry
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100 mt-1">
            Agent Lab
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5 max-w-2xl">
            Extensible agent registry and 9-step execution lifecycle inspector. Configure agent models, system instructions, permissions, and inspect deterministic pipeline execution traces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab view switcher */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveSubTab('workbench')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'workbench'
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Registry & Bench</span>
            </button>
            <button
              onClick={() => setActiveSubTab('inspector')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'inspector'
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Execution Inspector ({executions.length})</span>
            </button>
          </div>

          <button
            id="btn-create-agent"
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-medium transition-colors shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Agent</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'workbench' ? (
        /* WORKBENCH & REGISTRY VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Extensible Agent Registry Catalog (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            {/* Filter and Search */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Registered Agents ({filteredAgents.length})
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  Total: {agents.length}
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter agents..."
                  className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-3 py-1.5 pl-8 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px]">
                {(['all', 'active', 'draft', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`flex-1 py-1 rounded text-center capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-neutral-800 text-neutral-100 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Cards */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {filteredAgents.length === 0 ? (
                <div className="p-4 rounded-xl border border-neutral-800/60 bg-neutral-900/20 text-center">
                  <p className="text-xs text-neutral-400">No agents match this filter.</p>
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = selectedAgent.id === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgent(agent);
                        setSelectedAgentId(agent.id);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-neutral-900 border-neutral-600 text-neutral-100 shadow-xs ring-1 ring-neutral-700/50'
                          : 'bg-neutral-900/30 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-neutral-200">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-semibold text-neutral-200">
                                {agent.name}
                              </h3>
                              {agent.isBuiltIn && (
                                <span className="text-[9px] font-mono px-1 rounded bg-neutral-800 text-neutral-400">
                                  Core
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500">
                              {agent.codename}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                              agent.status === 'active'
                                ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                                : agent.status === 'draft'
                                ? 'bg-neutral-900 border-neutral-800 text-neutral-500'
                                : 'bg-neutral-950 border-neutral-900 text-neutral-600'
                            }`}
                          >
                            {agent.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                        {agent.description}
                      </p>

                      <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-850">
                        <span>{agent.tools.length} tools • {agent.permissions.length} perms</span>
                        <span>{agent.modelConfig.modelId}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Agent Inspector & Execution Benchmark (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Agent Configuration Spec Card */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-neutral-100">
                      {selectedAgent.name}
                    </h2>
                    <span className="text-xs font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                      {selectedAgent.codename}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                      Status: {selectedAgent.status}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Owner: {selectedAgent.ownerId}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{selectedAgent.tagline}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditor(selectedAgent)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition-colors flex items-center gap-1.5"
                    title="Configure agent parameters"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configure</span>
                  </button>
                  <button
                    onClick={() => handleStartChatWithAgent(selectedAgent)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
                    title="Open chat conversation with this agent"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Open in Chat</span>
                  </button>
                  {!selectedAgent.isBuiltIn && (
                    <button
                      onClick={() => handleDeleteAgent(selectedAgent)}
                      className="p-1.5 rounded-lg border border-neutral-800 hover:border-red-800/80 text-neutral-400 hover:text-red-400 transition-colors"
                      title="Delete agent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Spec Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">
                    Model Engine
                  </span>
                  <p className="font-mono text-neutral-200 mt-1 font-medium truncate">
                    {selectedAgent.modelConfig.modelId}
                  </p>
                  <span className="text-[10px] text-neutral-500">
                    Temp: {selectedAgent.modelConfig.temperature} | Max: {selectedAgent.modelConfig.maxTokens || 4096}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">
                    Execution Mode
                  </span>
                  <p className="font-mono text-neutral-200 mt-1 capitalize font-medium">
                    {selectedAgent.executionMode}
                  </p>
                  <span className="text-[10px] text-neutral-500">
                    Deterministic pipeline
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">
                    Memory Access
                  </span>
                  <p className="font-mono text-neutral-200 mt-1 font-medium">
                    {selectedAgent.memoryAccess?.canRead ? 'Read' : 'No-Read'} / {selectedAgent.memoryAccess?.canWrite ? 'Write' : 'No-Write'}
                  </p>
                  <span className="text-[10px] text-neutral-500">
                    {selectedAgent.memoryAccess?.types?.length || 0} allowed categories
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">
                    Timestamps
                  </span>
                  <p className="font-mono text-neutral-200 mt-1 text-[11px]">
                    Created: {new Date(selectedAgent.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-[10px] text-neutral-500">
                    Updated: {new Date(selectedAgent.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* System Instructions Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  System Instructions
                </span>
                <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 font-mono text-xs text-neutral-300 leading-relaxed max-h-28 overflow-y-auto custom-scrollbar">
                  {selectedAgent.systemInstructions}
                </div>
              </div>

              {/* Tools & Permissions Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Tools */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                    Bound Tools ({selectedAgent.tools.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.tools.length === 0 ? (
                      <span className="text-xs text-neutral-500 italic">No tools bound.</span>
                    ) : (
                      selectedAgent.tools.map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center gap-1"
                        >
                          <Wrench className="w-2.5 h-2.5 text-neutral-500" />
                          {tool}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Granted Permissions */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                    Granted Permissions ({selectedAgent.permissions.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.permissions.length === 0 ? (
                      <span className="text-xs text-neutral-500 italic">No special permissions.</span>
                    ) : (
                      selectedAgent.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center gap-1"
                        >
                          <Shield className="w-2.5 h-2.5 text-neutral-500" />
                          {perm}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 9-Step Execution Pipeline Benchmark */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neutral-400" />
                  <h3 className="text-sm font-semibold text-neutral-100">
                    Execution Test Bench
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                  9-Step Lifecycle Pipeline
                </span>
              </div>

              <p className="text-xs text-neutral-400">
                Trigger a real execution through the deterministic 9-step pipeline for <strong>{selectedAgent.name}</strong>. The output, tool operations, memory recalls, and step logs will be recorded for inspection.
              </p>

              {/* Sample Prompts */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase text-neutral-500">Quick Prompts:</span>
                {[
                  'Deconstruct sprint milestones into tasks',
                  'Audit active workspace memories and preferences',
                  'Plan PostgreSQL table schema with RLS security policies',
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setBenchPrompt(sample)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>

              {/* Benchmark Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={benchPrompt}
                  onChange={(e) => setBenchPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunBench();
                  }}
                  placeholder={`Send an instruction to ${selectedAgent.name}...`}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
                />
                <button
                  id="btn-run-agent-pipeline"
                  onClick={handleRunBench}
                  disabled={!benchPrompt.trim() || isExecuting}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-medium disabled:opacity-40 transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
                >
                  {isExecuting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 9-STEP EXECUTION INSPECTOR VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Execution History List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Execution History ({executions.length})
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Inspectable
              </span>
            </div>

            <div className="space-y-2 max-h-[650px] overflow-y-auto custom-scrollbar pr-1">
              {executions.length === 0 ? (
                <div className="p-6 rounded-xl border border-neutral-800/60 bg-neutral-900/20 text-center space-y-2">
                  <History className="w-6 h-6 text-neutral-500 mx-auto" />
                  <p className="text-xs text-neutral-300 font-medium">No executions recorded</p>
                  <p className="text-[11px] text-neutral-500">
                    Switch to the Registry & Bench tab to run an agent through the pipeline.
                  </p>
                </div>
              ) : (
                executions.map((exec) => {
                  const isSelected = (inspectedExecution?.id || '') === exec.id;
                  const isSuccess = exec.status === 'completed';
                  return (
                    <div
                      key={exec.id}
                      onClick={() => setInspectedExecutionId(exec.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-neutral-900 border-neutral-600 text-neutral-100 shadow-xs ring-1 ring-neutral-700/50'
                          : 'bg-neutral-900/30 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSuccess ? 'bg-emerald-400' : exec.status === 'failed' ? 'bg-red-400' : 'bg-neutral-400'
                            }`}
                          />
                          <span className="text-xs font-mono font-medium text-neutral-200 truncate">
                            {exec.agentName}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                            isSuccess
                              ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400'
                              : exec.status === 'failed'
                              ? 'bg-red-950/40 border-red-900 text-red-400'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {exec.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-2 leading-relaxed font-sans">
                        "{exec.taskPrompt}"
                      </p>

                      <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-850">
                        <span>ID: {exec.id.slice(0, 14)}...</span>
                        <span>{new Date(exec.startedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Execution Step-by-Step Inspector (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {inspectedExecution ? (
              <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-6">
                {/* Execution Header Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                        {inspectedExecution.id}
                      </span>
                      <h2 className="text-base font-semibold text-neutral-100">
                        {inspectedExecution.agentName}
                      </h2>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          inspectedExecution.status === 'completed'
                            ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
                            : inspectedExecution.status === 'failed'
                            ? 'bg-red-950/50 border-red-800 text-red-400'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        Status: {inspectedExecution.status}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 mt-1.5 italic font-sans">
                      "{inspectedExecution.taskPrompt}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(inspectedExecution.startedAt).toLocaleTimeString()}
                      {inspectedExecution.completedAt &&
                        ` → ${new Date(inspectedExecution.completedAt).toLocaleTimeString()}`}
                    </span>
                  </div>
                </div>

                {/* 9-Step Lifecycle Timeline Visualization */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                      Deterministic 9-Step Pipeline Progression
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {inspectedExecution.logs.length} events logged
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 pt-1">
                    {LIFECYCLE_STEPS.map((s, idx) => {
                      const logForStage = inspectedExecution.logs.find(
                        (l) => l.stage === s.stage || (s.stage === 'execution' && l.stage === 'executing') || (s.stage === 'validation' && l.stage === 'validating')
                      );
                      const isCompleted = Boolean(logForStage) || (inspectedExecution.status === 'completed');
                      const isFailed = inspectedExecution.status === 'failed' && !logForStage;

                      return (
                        <div
                          key={s.stage}
                          title={`${s.label}: ${s.description}`}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            logForStage
                              ? 'bg-neutral-900 border-neutral-600 text-neutral-100 shadow-xs'
                              : isCompleted
                              ? 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
                              : isFailed
                              ? 'bg-red-950/20 border-red-900/60 text-red-400'
                              : 'bg-neutral-950/30 border-neutral-900 text-neutral-600'
                          }`}
                        >
                          <span className="text-[9px] font-mono uppercase block font-semibold truncate">
                            {idx + 1}. {s.stage.replace('_', ' ')}
                          </span>
                          <span className="text-[8px] font-mono text-neutral-500 block truncate">
                            {logForStage ? '✓ Passed' : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Step Logs */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Execution Telemetry & Step Logs
                  </span>

                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar font-mono text-xs">
                    {inspectedExecution.logs.map((log, index) => (
                      <div
                        key={index}
                        className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 uppercase font-semibold">
                              {log.stage}
                            </span>
                            <span className="text-neutral-300 font-sans">{log.message}</span>
                          </div>
                          <span className="text-neutral-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-1 pt-1 border-t border-neutral-900/80 text-[10px] text-neutral-500 space-y-0.5 font-mono">
                            {Object.entries(log.metadata).map(([k, v]) => (
                              <div key={k} className="flex gap-2">
                                <span className="text-neutral-400">{k}:</span>
                                <span className="text-neutral-300 truncate">
                                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Synthesized Result */}
                {inspectedExecution.result && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                        Synthesized Executive Output
                      </span>
                      <button
                        onClick={() => handleCopyOutput(inspectedExecution.result || '')}
                        className="text-[11px] font-mono text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                      >
                        {copiedOutput ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Result</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                      {inspectedExecution.result}
                    </div>
                  </div>
                )}

                {/* Error Banner if any */}
                {inspectedExecution.error && (
                  <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/60 text-xs text-red-300 space-y-1">
                    <div className="font-semibold font-mono uppercase">Pipeline Execution Error:</div>
                    <div className="font-mono text-[11px]">{inspectedExecution.error}</div>
                  </div>
                )}

                {/* Tools Used */}
                {inspectedExecution.toolsUsed && inspectedExecution.toolsUsed.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 text-xs font-mono text-neutral-400">
                    <span className="uppercase text-neutral-500">Tools Executed:</span>
                    {inspectedExecution.toolsUsed.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<Activity className="w-6 h-6 text-neutral-400" />}
                title="No execution selected"
                description="Select an execution from the left list or run a new pipeline execution from the bench."
                actionLabel="Switch to Bench"
                onAction={() => setActiveSubTab('workbench')}
              />
            )}
          </div>
        </div>
      )}

      {/* Extensible Agent Editor / Creator Modal */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-100">
                  {isNewAgent ? 'Register New Agent' : `Configure ${formName}`}
                </h3>
                <p className="text-xs text-neutral-400">
                  Define instructions, model routing, tool access, and memory permissions.
                </p>
              </div>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              {/* Name & Codename */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Agent Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sentry"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-neutral-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Codename *</label>
                  <input
                    type="text"
                    required
                    value={formCodename}
                    onChange={(e) => setFormCodename(e.target.value)}
                    placeholder="e.g. SENTRY-OPS"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-hidden focus:border-neutral-500"
                  />
                </div>
              </div>

              {/* Tagline & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Tagline</label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="Concise role summary"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-neutral-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AgentStatus)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">Full Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed functional description for workspace routing..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-neutral-500"
                />
              </div>

              {/* System Instructions Prompt */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  System Instructions (Prompt) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Define persona, capabilities, tone, boundaries, and formatting rules..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-hidden focus:border-neutral-500"
                />
              </div>

              {/* Model Configuration */}
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Model Routing & Engine
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400">Provider</label>
                    <select
                      value={formProvider}
                      onChange={(e) =>
                        setFormProvider(
                          e.target.value as 'gemini' | 'openai_compatible' | 'anthropic_compatible'
                        )
                      }
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai_compatible">OpenAI Compatible</option>
                      <option value="anthropic_compatible">Anthropic Compatible</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400">Model ID</label>
                    <select
                      value={formModelId}
                      onChange={(e) => setFormModelId(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
                    >
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Primary)</option>
                      <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="claude-3-7-sonnet">claude-3-7-sonnet</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400">Temperature: {formTemperature}</label>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.1"
                      value={formTemperature}
                      onChange={(e) => setFormTemperature(parseFloat(e.target.value))}
                      className="w-full accent-neutral-200 mt-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400">Max Tokens</label>
                    <input
                      type="number"
                      value={formMaxTokens}
                      onChange={(e) => setFormMaxTokens(parseInt(e.target.value) || 4096)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Memory Access Configuration */}
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Memory Access Configuration
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMemoryRead}
                        onChange={(e) => setFormMemoryRead(e.target.checked)}
                        className="rounded accent-neutral-100"
                      />
                      <span className="text-neutral-300">Can Read</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMemoryWrite}
                        onChange={(e) => setFormMemoryWrite(e.target.checked)}
                        className="rounded accent-neutral-100"
                      />
                      <span className="text-neutral-300">Can Write</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-neutral-500">Allowed Memory Categories:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_MEMORY_TYPES.map((t) => {
                      const isAllowed = formMemoryTypes.includes(t.type);
                      return (
                        <button
                          key={t.type}
                          type="button"
                          onClick={() => toggleMemoryType(t.type)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                            isAllowed
                              ? 'bg-neutral-800 border border-neutral-600 text-neutral-100'
                              : 'bg-neutral-950 border border-neutral-850 text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          {isAllowed && '✓ '}
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tools Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300">Bound Tools</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableTools.map((tool) => {
                    const isChecked = formTools.includes(tool.id);
                    return (
                      <div
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between select-none ${
                          isChecked
                            ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <span className="font-mono">{tool.name}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-neutral-200" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300">Workspace Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between select-none ${
                          isChecked
                            ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <span>{perm.label}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-neutral-200" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-medium transition-colors"
                >
                  {isNewAgent ? 'Register Agent' : 'Save Agent Spec'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
