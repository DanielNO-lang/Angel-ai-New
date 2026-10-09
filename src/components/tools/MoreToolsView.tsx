/**
 * ANGEL AI — Master Ecosystem & Utility Workspace (More)
 * Central ecosystem area hosting:
 * - Assistants Team (Specialized autonomous AI personas)
 * - Marketplace (Modular artifact ecosystem)
 * - Skills & Functions (Callable tool registry & scripts)
 * - Plugins & Integrations (1P & 3P integration services)
 * - Connections (Inbound/Outbound automation webhooks)
 * - Secrets Vault (Environment variables & secure credentials)
 * - Memory Bank (Neural knowledge store)
 * - Recycle Bin (Soft-deleted assets, tasks & chats)
 */

import React, { useState } from 'react';
import {
  Layers,
  Brain,
  Flame,
  Users,
  Zap,
  Puzzle,
  Share2,
  Lock,
  Trash2,
  ArrowRight,
  Search,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { MemoriesView } from '../memories/MemoriesView';
import { MarketplaceView } from '../marketplace/MarketplaceView';
import { RecycleBinView } from '../recycle_bin/RecycleBinView';
import { SecretsModal } from '../modals/SecretsModal';
import { SkillsView } from '../skills/SkillsView';
import { PluginsView } from '../plugins/PluginsView';
import { ConnectionsWorkspace } from '../connections/ConnectionsWorkspace';

export type MoreSubView =
  | 'overview'
  | 'marketplace'
  | 'memory'
  | 'skills'
  | 'plugins'
  | 'connections'
  | 'recycle_bin';

export const MoreToolsView: React.FC = () => {
  const {
    settings,
    setActiveTab,
    availableTools,
    memories,
    assistantsList,
  } = useAngel();

  const isLight = settings.theme === 'light';
  const [activeSubView, setActiveSubView] = useState<MoreSubView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);

  // Sub-workspace definitions strictly aligned with user specifications
  const areas = [
    {
      id: 'assistants' as any,
      title: 'Assistants Team',
      desc: 'Build, configure, and converse with specialized autonomous AI personas.',
      icon: Users,
      badge: `${assistantsList.length} Active`,
      color: 'indigo',
      action: () => setActiveTab('assistants'),
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
      id: 'skills' as MoreSubView,
      title: 'Skills & Function Registry',
      desc: 'Standardized tool definitions, sandboxes, and discoverable function calling registry.',
      icon: Zap,
      badge: `${availableTools.length} Active`,
      color: 'amber',
    },
    {
      id: 'plugins' as MoreSubView,
      title: 'Plugins & Integrations',
      desc: 'Google Workspace, GitHub, Supabase PostgreSQL, and automated service pipelines.',
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
      desc: 'Secure cryptographic store for Gemini, OpenAI, GitHub PAT, and service credentials.',
      icon: Lock,
      badge: 'Encrypted',
      color: 'violet',
      action: () => setIsSecretsModalOpen(true),
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

  // If sub-view is Memory: embed full MemoriesView
  if (activeSubView === 'memory') {
    return (
      <div className="relative min-h-full">
        <div className="p-3 border-b flex items-center justify-between bg-black/20 text-xs">
          <button
            onClick={() => setActiveSubView('overview')}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            ← Back to More Ecosystem
          </button>
          <span className="opacity-60 font-medium text-[11px]">Ecosystem / Memory Bank</span>
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
            ← Back to More Ecosystem
          </button>
          <span className="opacity-60 font-medium text-[11px]">Ecosystem / Modular Marketplace</span>
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
            ← Back to More Ecosystem
          </button>
          <span className="opacity-60 font-medium text-[11px]">Ecosystem / Recycle Bin</span>
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
            ← Back to More Ecosystem
          </button>
          <span className="opacity-60 font-medium text-[11px]">Ecosystem / Skills Registry</span>
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
            ← Back to More Ecosystem
          </button>
          <span className="opacity-60 font-medium text-[11px]">Ecosystem / Plugins Engine</span>
        </div>
        <PluginsView />
      </div>
    );
  }

  // If sub-view is Connections: embed full ConnectionsWorkspace
  if (activeSubView === 'connections') {
    return (
      <div className="relative min-h-full">
        <div className="p-3 border-b flex items-center justify-between bg-black/20 text-xs">
          <button
            onClick={() => setActiveSubView('overview')}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            ← Back to More Ecosystem
          </button>
          <span className="opacity-60 font-medium text-[11px]">Ecosystem / Connections & Webhooks</span>
        </div>
        <ConnectionsWorkspace />
      </div>
    );
  }

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 animate-in fade-in duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Clean Sticky Header Bar without top duplicate tab bar */}
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
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Modular extensions, utilities, assistants team, and integrations
              </p>
            </div>
          </div>

          {/* Search input in header */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search ecosystem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                  : 'bg-[#0E121B] border-white/10 text-white placeholder-neutral-500 focus:border-indigo-400'
              }`}
            />
          </div>
        </div>

        {/* Clean Grid of Verified Options */}
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
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
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

      {/* Secrets Vault Modal */}
      {isSecretsModalOpen && <SecretsModal isOpen={isSecretsModalOpen} onClose={() => setIsSecretsModalOpen(false)} />}
    </div>
  );
};
