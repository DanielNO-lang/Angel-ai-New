/**
 * ANGEL AI — More Tools & Extensions View
 * Matches Image 2 Panel 11 & Image 3 Panel 11:
 * - 9 core modular tools:
 *   1. Marketplace
 *   2. Charts
 *   3. Memory
 *   4. Multimodal
 *   5. Skills
 *   6. Plugins
 *   7. Connections
 *   8. Secrets
 *   9. Recycle Bin
 * - 100% Light Mode and Dark Mode fidelity
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
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { SecretsModal } from '../modals/SecretsModal';

export const MoreToolsView: React.FC = () => {
  const { settings, setActiveTab, setActiveSettingsSection } = useAngel();
  const isLight = settings.theme === 'light';
  const [isSecretsOpen, setIsSecretsOpen] = useState(false);

  const tools = [
    {
      id: 'marketplace',
      title: 'Marketplace',
      desc: 'Discover and install pre-built agents, workflows, and integrations.',
      icon: Layers,
      action: () => setActiveTab('marketplace'),
      badge: 'Curated',
      color: 'indigo',
    },
    {
      id: 'charts',
      title: 'Charts',
      desc: 'Interactive data visualization, trends, and analytical charts.',
      icon: BarChart3,
      action: () => setActiveTab('home'),
      badge: 'Analytics',
      color: 'blue',
    },
    {
      id: 'memory',
      title: 'Memory Bank',
      desc: 'Neural knowledge records, preferences, and long-term context.',
      icon: Brain,
      action: () => setActiveTab('memories'),
      badge: 'Core',
      color: 'purple',
    },
    {
      id: 'multimodal',
      title: 'Multimedia Vision',
      desc: 'Real-time webcam perception, screen recording, and visual OCR.',
      icon: Sparkles,
      action: () => setActiveTab('visual_mode'),
      badge: 'Perception',
      color: 'cyan',
    },
    {
      id: 'skills',
      title: 'Skills and Function',
      desc: 'Custom function calling tools, Python scripts, and live APIs.',
      icon: Zap,
      action: () => setActiveTab('agent_lab'),
      badge: 'Automations',
      color: 'amber',
    },
    {
      id: 'plugins',
      title: 'Plugins and Connectors',
      desc: 'Google Workspace, GitHub, Supabase, and Zapier integrations.',
      icon: Puzzle,
      action: () => {
        setActiveSettingsSection('connections');
        setActiveTab('settings');
      },
      badge: 'API Links',
      color: 'emerald',
    },
    {
      id: 'connections',
      title: 'Connections',
      desc: 'Database endpoints, webhook subscribers, and cloud proxies.',
      icon: Share2,
      action: () => {
        setActiveSettingsSection('connections');
        setActiveTab('settings');
      },
      badge: 'Network',
      color: 'rose',
    },
    {
      id: 'secrets',
      title: 'Secret Vault',
      desc: 'Passcode-protected private vault for confidential chats.',
      icon: Lock,
      action: () => setIsSecretsOpen(true),
      badge: 'PIN Protected',
      color: 'purple',
    },
    {
      id: 'recycle_bin',
      title: 'Recycle Bin',
      desc: 'Manage and restore deleted chats, files, and archived items.',
      icon: Trash2,
      action: () => setActiveTab('recycle_bin'),
      badge: 'Storage',
      color: 'neutral',
    },
  ];

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      {/* Top Header - Fixed Non-Transparent */}
      <div
        className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-colors flex items-center justify-between shadow-xs ${
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
            <h1 className="text-xl font-bold tracking-tight">More Tools & Extensions</h1>
            <span className="text-[11px] font-mono opacity-60">System Modules & Utilities</span>
          </div>
        </div>
      </div>

      {/* Grid of 9 Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={tool.action}
              className={`p-5 rounded-3xl border flex flex-col justify-between cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 shadow-md hover:shadow-xl ${
                isLight
                  ? 'bg-white border-slate-200/90 shadow-slate-200/50 hover:border-indigo-400'
                  : 'bg-[#121622] border-white/5 shadow-black/60 hover:border-indigo-500/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
                      isLight
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                        : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {tool.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold tracking-tight">{tool.title}</h3>
                  <p className={`text-xs leading-relaxed mt-1 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    {tool.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-inherit flex items-center justify-between text-xs font-semibold text-indigo-500">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secrets Vault Modal */}
      <SecretsModal isOpen={isSecretsOpen} onClose={() => setIsSecretsOpen(false)} />
    </div>
  );
};
