/**
 * ANGEL AI — Master Ecosystem & Utility Workspace (More)
 * Central ecosystem area hosting:
 * - Marketplace (Modular artifact ecosystem)
 * - Memory Vault (Neural knowledge store embedded in More)
 * - Charts & Analytics (Workspace velocity, model telemetry, token consumption)
 * - Multimodal Perception Hub (Perception channels & camera/screen feeds)
 * - Skills & Functions (Callable tool registry & scripts)
 * - Plugins & Connectors (1P & 3P integration services)
 * - Connections (Inbound/Outbound automation webhooks)
 * - Secrets Vault (Environment variables & secure credentials)
 * - Recycle Bin (Soft-deleted assets, tasks & chats)
 */

import React, { useState } from 'react';
import {
  Layers,
  BarChart3,
  Brain,
  Sparkles,
  Zap,
  Puzzle,
  Share2,
  Lock,
  Trash2,
  ArrowRight,
  Shield,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  GitBranch,
  Radio,
  Sliders,
  TrendingUp,
  Activity,
  Cpu,
  PenTool,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAngel } from '../../context/AppContext';
import { MemoriesView } from '../memories/MemoriesView';
import { MarketplaceView } from '../marketplace/MarketplaceView';
import { RecycleBinView } from '../recycle_bin/RecycleBinView';
import { SecretsModal } from '../modals/SecretsModal';
import { ConnectionsWorkspace } from '../connections/ConnectionsWorkspace';
import { SkillsView } from '../skills/SkillsView';
import { PluginsView } from '../plugins/PluginsView';

export type MoreSubView =
  | 'overview'
  | 'marketplace'
  | 'memory'
  | 'charts'
  | 'multimodal'
  | 'skills'
  | 'plugins'
  | 'connections'
  | 'recycle_bin';

export const MoreToolsView: React.FC = () => {
  const {
    settings,
    setActiveTab,
    setActiveSettingsSection,
    availableTools,
    memories,
    tasks,
    projects,
    executions,
    integrationsStatus,
    dispatchAutomationEvent,
  } = useAngel();

  const isLight = settings.theme === 'light';
  const [activeSubView, setActiveSubView] = useState<MoreSubView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);
  const [testDispatchSuccess, setTestDispatchSuccess] = useState(false);

  // Sub-workspace definitions
  const areas = [
    {
      id: 'canvas' as any,
      title: 'Canvas & Build Stage',
      desc: 'First-class multi-block document, code runner, and artifact development workspace.',
      icon: PenTool,
      badge: 'First-Class',
      color: 'cyan',
      action: () => setActiveTab('canvas'),
    },
    {
      id: 'data_analysis' as any,
      title: 'Data Analysis Capability',
      desc: 'Tabular dataset profiling, non-fabricated Recharts visualizations, and AI outlier detection.',
      icon: BarChart3,
      badge: 'Data Engine',
      color: 'blue',
      action: () => setActiveTab('data_analysis'),
    },
    {
      id: 'automation' as any,
      title: 'Event-Driven Automations',
      desc: 'Reactive triggers, multi-step branching, agent execution, and Zapier webhook integration.',
      icon: Zap,
      badge: 'Reactive',
      color: 'amber',
      action: () => setActiveTab('automation'),
    },
    {
      id: 'marketplace' as MoreSubView,
      title: 'Marketplace Ecosystem',
      desc: 'Discover, install, publish, and manage verified agents, tools, workflows, and templates.',
      icon: Layers,
      badge: 'Ecosystem',
      color: 'indigo',
    },
    {
      id: 'memory' as MoreSubView,
      title: 'Memory Bank',
      desc: 'Neural knowledge records, persistent user preferences, and cross-project long-term context.',
      icon: Brain,
      badge: `${memories.length} Records`,
      color: 'purple',
    },
    {
      id: 'charts' as MoreSubView,
      title: 'Analytics & Charts',
      desc: 'Interactive project velocity burndown, token utilization, and multi-agent execution telemetry.',
      icon: BarChart3,
      badge: 'Telemetry',
      color: 'blue',
    },
    {
      id: 'multimodal' as MoreSubView,
      title: 'Multimodal Perception',
      desc: 'Camera feed inspection, live screen recording, region OCR, and spatial UI understanding.',
      icon: Sparkles,
      badge: 'Optic AI',
      color: 'cyan',
    },
    {
      id: 'skills' as MoreSubView,
      title: 'Skills & Function Registry',
      desc: 'Standardized ModelToolDefinitions, Python sandboxes, and discoverable function calling.',
      icon: Zap,
      badge: `${availableTools.length} Active`,
      color: 'amber',
    },
    {
      id: 'plugins' as MoreSubView,
      title: 'Plugins & Integrations',
      desc: 'Google Workspace, GitHub, Supabase PostgreSQL, and Zapier integration pipelines.',
      icon: Puzzle,
      badge: 'Connectors',
      color: 'emerald',
    },
    {
      id: 'connections' as MoreSubView,
      title: 'Connections & Webhooks',
      desc: 'Real-time outbound event dispatcher and verified inbound webhook listener endpoints.',
      icon: Share2,
      badge: 'Webhooks',
      color: 'rose',
    },
    {
      id: 'secrets' as any,
      title: 'Secrets & API Vault',
      desc: 'Secure cryptographic store for Gemini, OpenAI, GitHub PAT, and Supabase credentials.',
      icon: Lock,
      badge: 'Encrypted',
      color: 'violet',
      action: () => setIsSecretsModalOpen(true),
    },
    {
      id: 'recycle_bin' as MoreSubView,
      title: 'Recycle Bin',
      desc: 'Safe restore and permanent purge area for archived threads, soft-deleted tasks, and assets.',
      icon: Trash2,
      badge: 'Recovery',
      color: 'zinc',
    },
  ];

  const filteredAreas = areas.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTestWebhook = async () => {
    try {
      const res = await dispatchAutomationEvent('task.created', {
        taskId: 'task-test-webhook',
        title: 'Ecosystem Test Event',
        triggeredAt: new Date().toISOString(),
      });
      if (res.dispatched) {
        setTestDispatchSuccess(true);
        setTimeout(() => setTestDispatchSuccess(false), 3000);
      }
    } catch {
      // Handled
    }
  };

  // If sub-view is Memory: embed full MemoriesView
  if (activeSubView === 'memory') {
    return (
      <div className="relative min-h-full">
        <div className="p-3 border-b flex items-center justify-between bg-black/20 text-xs">
          <button
            onClick={() => setActiveSubView('overview')}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            ← Back to More Workspace
          </button>
          <span className="opacity-60 font-mono text-[11px]">Ecosystem / Memory Bank</span>
        </div>
        <MemoriesView />
      </div>
    );
  }

  // If sub-view is Marketplace: embed full MarketplaceView
  if (activeSubView === 'marketplace') {
    return (
      <div className="relative min-h-full">
        <div className="p-3 border-b flex items-center justify-between bg-black/20 text-xs">
          <button
            onClick={() => setActiveSubView('overview')}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            ← Back to More Workspace
          </button>
          <span className="opacity-60 font-mono text-[11px]">Ecosystem / Modular Marketplace</span>
        </div>
        <MarketplaceView />
      </div>
    );
  }

  // If sub-view is Recycle Bin: embed full RecycleBinView
  if (activeSubView === 'recycle_bin') {
    return (
      <div className="relative min-h-full">
        <div className="p-3 border-b flex items-center justify-between bg-black/20 text-xs">
          <button
            onClick={() => setActiveSubView('overview')}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            ← Back to More Workspace
          </button>
          <span className="opacity-60 font-mono text-[11px]">Ecosystem / Recycle Bin</span>
        </div>
        <RecycleBinView />
      </div>
    );
  }

  // If sub-view is Skills: embed full SkillsView
  if (activeSubView === 'skills') {
    return (
      <div className="relative min-h-full">
        <div className="p-3 border-b flex items-center justify-between bg-black/20 text-xs">
          <button
            onClick={() => setActiveSubView('overview')}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            ← Back to More Workspace
          </button>
          <span className="opacity-60 font-mono text-[11px]">Ecosystem / Skills Registry</span>
        </div>
        <SkillsView />
      </div>
    );
  }

  // If sub-view is Plugins: embed full PluginsView
  if (activeSubView === 'plugins') {
    return (
      <div className="relative min-h-full">
        <div className="p-3 border-b flex items-center justify-between bg-black/20 text-xs">
          <button
            onClick={() => setActiveSubView('overview')}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            ← Back to More Workspace
          </button>
          <span className="opacity-60 font-mono text-[11px]">Ecosystem / Plugins Engine</span>
        </div>
        <PluginsView />
      </div>
    );
  }

  // Chart Velocity Mock/Telemetry Data
  const velocityData = [
    { day: 'Mon', completed: 4, velocity: 65, tokens: 4200 },
    { day: 'Tue', completed: 7, velocity: 78, tokens: 8900 },
    { day: 'Wed', completed: 9, velocity: 85, tokens: 12400 },
    { day: 'Thu', completed: 6, velocity: 72, tokens: 7300 },
    { day: 'Fri', completed: 12, velocity: 94, tokens: 15600 },
    { day: 'Sat', completed: 8, velocity: 88, tokens: 6800 },
    { day: 'Sun', completed: 11, velocity: 91, tokens: 9400 },
  ];

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 animate-in fade-in duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Sticky Header Bar */}
        <div
          className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#0B0E14] border-white/10 text-neutral-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-2xl border ${
                isLight
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
            >
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">More & Ecosystem</h1>
              <span className="text-[11px] font-mono opacity-60">
                Central Extensions, Multimodal Hub, Utilities & Knowledge Engine
              </span>
            </div>
          </div>

          {/* SubView Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {(['overview', 'charts', 'skills', 'plugins', 'connections'] as MoreSubView[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubView(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  activeSubView === tab
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isLight
                    ? 'hover:bg-slate-100 text-slate-600'
                    : 'hover:bg-white/10 text-neutral-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================
            SUB-VIEW: OVERVIEW (CARD ECOSYSTEM GRID)
            ======================================================== */}
        {activeSubView === 'overview' && (
          <div className="space-y-6">
            {/* Search filter */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search extensions, memory, skills, tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-indigo-400'
                }`}
              />
            </div>

            {/* Area Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAreas.map((area) => {
                const Icon = area.icon;

                return (
                  <div
                    key={area.id}
                    onClick={() => {
                      if (area.action) {
                        area.action();
                      } else {
                        setActiveSubView(area.id);
                      }
                    }}
                    className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 ${
                      isLight
                        ? 'bg-white border-slate-200 hover:border-indigo-500/50 text-slate-900'
                        : 'bg-[#10141E] border-white/10 hover:border-indigo-500/50 text-neutral-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`p-2.5 rounded-xl border ${
                            isLight
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                          {area.badge}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold mb-1 group-hover:text-indigo-400 transition-colors">
                        {area.title}
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-4">{area.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-indigo-400 font-medium">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-VIEW: CHARTS & ANALYTICS
            ======================================================== */}
        {activeSubView === 'charts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <span className="text-[11px] text-neutral-400 font-mono">Velocity Score</span>
                <div className="text-2xl font-bold mt-1 text-emerald-400">88 / 100</div>
                <p className="text-[11px] text-neutral-400 mt-1">Optimal sprint burndown velocity</p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <span className="text-[11px] text-neutral-400 font-mono">Tasks Completed (7d)</span>
                <div className="text-2xl font-bold mt-1 text-indigo-400">57 Tasks</div>
                <p className="text-[11px] text-neutral-400 mt-1">+24% vs previous sprint cycle</p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <span className="text-[11px] text-neutral-400 font-mono">AI Context Tokens</span>
                <div className="text-2xl font-bold mt-1 text-purple-400">64.6K Tokens</div>
                <p className="text-[11px] text-neutral-400 mt-1">Multi-turn context budgeted efficiently</p>
              </div>
            </div>

            {/* Main Velocity Area Chart */}
            <div
              className={`p-6 rounded-2xl border space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Weekly Task Velocity & Output</h3>
                  <p className="text-xs text-neutral-400">Chronos project telemetry and task delivery rate</p>
                </div>
                <span className="text-xs font-mono px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                  Live Sync
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="velocity"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#velocityGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-VIEW: SKILLS & FUNCTIONS REGISTRY
            ======================================================== */}
        {activeSubView === 'skills' && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <div>
                <h3 className="text-sm font-bold">Discoverable Workspace Skills</h3>
                <p className="text-xs text-neutral-400">
                  Registered JSON function definitions exposed to Gemini 3.8 Flash tool-call engine
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {availableTools.length} Tool Schemas Active
              </span>
            </div>

            <div
              className={`rounded-2xl border divide-y divide-white/5 overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              {availableTools.map((tool) => (
                <div key={tool.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">{tool.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 opacity-60">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">{tool.description}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10">
                    Live
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-VIEW: PLUGINS & CONNECTORS
            ======================================================== */}
        {activeSubView === 'plugins' && (
          <div className="space-y-4">
            <div
              className={`p-5 rounded-2xl border space-y-2 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <h3 className="text-sm font-bold">Installed Enterprise Plugins & Connectors</h3>
              <p className="text-xs text-neutral-400">
                Bridges Angel AI to PostgreSQL databases, continuous deployment, and task sync pipelines.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Supabase PostgreSQL
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Real-time database velocity tracking, table schema migration, and row-level security policies.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-400" />
                    GitHub Version Control
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Two-way synchronization for pull requests, commit telemetry, and repository issue triage.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-VIEW: CONNECTIONS & WEBHOOKS
            ======================================================== */}
        {activeSubView === 'connections' && <ConnectionsWorkspace />}
      </div>

      {/* Secrets Modal */}
      <SecretsModal isOpen={isSecretsModalOpen} onClose={() => setIsSecretsModalOpen(false)} />
    </div>
  );
};
