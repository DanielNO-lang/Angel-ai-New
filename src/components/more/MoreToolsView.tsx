/**
 * ANGEL AI — More (Tools) View
 * Matches Image 11 ("11. More (Tools)"):
 * - Grid of 9 primary tools:
 *   1. Marketplace
 *   2. Charts
 *   3. Memory
 *   4. Multimodal
 *   5. Skills
 *   6. Plugins
 *   7. Connections
 *   8. Secrets
 *   9. Recycle Bin
 * - Full Light Mode and Dark Mode support
 * - Eliminates duplicate sidebar tools
 */

import React, { useState } from 'react';
import {
  Layers,
  LineChart,
  Brain,
  Sparkles,
  Zap,
  Puzzle,
  Network,
  Lock,
  Trash2,
  ArrowRight,
  Shield,
  Key,
  ChevronRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { SecretsModal } from '../modals/SecretsModal';

export const MoreToolsView: React.FC = () => {
  const { settings, setActiveTab } = useAngel();
  const isLight = settings.theme === 'light';

  const [isSecretsOpen, setIsSecretsOpen] = useState(false);
  const [activeModalTool, setActiveModalTool] = useState<string | null>(null);

  const tools = [
    {
      id: 'marketplace',
      name: 'Marketplace',
      category: 'Ecosystem',
      description: 'Discover and install pre-built autonomous agents, prompt packs, and community tools.',
      icon: Layers,
      action: () => setActiveTab('marketplace'),
      accent: 'indigo',
    },
    {
      id: 'secrets',
      name: 'Secret Vault',
      category: 'Privacy Vault',
      description: 'Unlock passcode-protected confidential chats, encrypted keys, and private files.',
      icon: Lock,
      action: () => setIsSecretsOpen(true),
      accent: 'purple',
    },
  ];

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      {/* Top Header */}
      <div className="border-b pb-5 border-inherit">
        <div className="flex items-center gap-2">
          <span
            className={`p-1.5 rounded-xl border ${
              isLight
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </span>
          <span
            className={`text-xs font-mono uppercase tracking-wider ${
              isLight ? 'text-indigo-600 font-semibold' : 'text-indigo-400'
            }`}
          >
            Extensions & Utilities
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">More Options</h1>
        <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
          Explore extensions, community marketplace agents, and confidential encrypted vaults.
        </p>
      </div>

      {/* Grid of More Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={tool.action}
              className={`p-5 rounded-3xl border flex flex-col justify-between cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 shadow-md hover:shadow-xl group ${
                isLight
                  ? 'bg-white border-slate-200/90 shadow-slate-200/50 hover:border-indigo-400 hover:shadow-indigo-100/50'
                  : 'bg-[#121622] border-white/5 shadow-black/60 hover:border-indigo-500/40 hover:shadow-indigo-950/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-colors ${
                      isLight
                        ? 'bg-indigo-50/80 border-indigo-200/80 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                        : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {tool.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold tracking-tight text-inherit group-hover:text-indigo-500 transition-colors">
                    {tool.name}
                  </h3>
                  <p className={`text-xs leading-relaxed mt-1 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-inherit flex items-center justify-between">
                <span className={`text-[11px] font-medium ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                  Launch tool
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secrets Vault Modal */}
      <SecretsModal isOpen={isSecretsOpen} onClose={() => setIsSecretsOpen(false)} />

      {/* Modal for Charts, Skills, Plugins if clicked directly */}
      {activeModalTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121622] border-white/10 text-neutral-100'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <h3 className="text-base font-bold capitalize">{activeModalTool} Hub</h3>
              <button
                onClick={() => setActiveModalTool(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? 'hover:bg-slate-100' : 'hover:bg-neutral-800'
                }`}
              >
                ✕
              </button>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              {activeModalTool === 'charts'
                ? 'Interactive charting engine ready. Ask Angel in Chat to plot any financial model, dataset, or latency metric.'
                : activeModalTool === 'skills'
                ? 'Skills are autonomous capabilities granted to your agents, including Python execution, Google Search grounding, and GitHub synchronization.'
                : 'Plugins allow you to connect external REST APIs, webhooks, and third-party tools seamlessly.'}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveModalTool(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
