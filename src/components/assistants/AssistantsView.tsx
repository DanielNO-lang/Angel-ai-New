/**
 * ANGEL AI — Assistants View
 * Matches Image 2 Panel 10:
 * - Subtabs: My Assistants, Marketplace
 * - Specialized Assistant Personas (Research Scout, Build Coach, Visual Analyst, Content Creator)
 * - "Create Assistant" action card
 * - Full Light Mode and Dark Mode support
 */

import React, { useState } from 'react';
import {
  Users,
  Bot,
  Brain,
  Search,
  Plus,
  Sparkles,
  ArrowRight,
  Code2,
  FileText,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

export const AssistantsView: React.FC = () => {
  const { settings, setActiveTab, createConversation, setSelectedAgentId } = useAngel();
  const isLight = settings.theme === 'light';

  const [activeSubTab, setActiveSubTab] = useState<'my' | 'marketplace'>('my');
  const [searchQuery, setSearchQuery] = useState('');

  const assistants = [
    {
      id: 'agent-atlas',
      name: 'Research Scout',
      tagline: 'Deep research, document synthesis & web intelligence',
      description: 'Performs multi-step web searches, cross-references sources, and writes cited executive briefs.',
      icon: Search,
      category: 'Research',
      model: 'gemini-3.8-flash',
      accent: 'indigo',
    },
    {
      id: 'agent-chronos',
      name: 'Build Coach',
      tagline: 'Architecture, full-stack code synthesis & automated tests',
      description: 'Generates clean TypeScript, plans system architectures, and manages developer task pipelines.',
      icon: Code2,
      category: 'Engineering',
      model: 'gemini-3.8-flash',
      accent: 'purple',
    },
    {
      id: 'agent-optic',
      name: 'Visual Analyst',
      tagline: 'Multimodal vision perception, chart reading & UI design',
      description: 'Extracts wireframes from UI snapshots, annotates spatial screens, and creates design tokens.',
      icon: Eye,
      category: 'Vision',
      model: 'gemini-3.8-flash',
      accent: 'cyan',
    },
    {
      id: 'agent-mnemosyne',
      name: 'Content Creator',
      tagline: 'Strategic copywriting, marketing copy & product messaging',
      description: 'Crafts persuasive copy, designs narrative frameworks, and indexes reusable brand voice guidelines.',
      icon: FileText,
      category: 'Creative',
      model: 'gemini-3.8-flash',
      accent: 'pink',
    },
  ];

  const handleStartChat = (assistantId: string, assistantName: string) => {
    setSelectedAgentId(assistantId);
    createConversation(assistantId, undefined, `Chat with ${assistantName}`);
    setActiveTab('chat');
  };

  const filtered = assistants.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      {/* Fixed Non-Transparent Header */}
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
            <Users className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Assistants</h1>
            <span className="text-[11px] font-mono opacity-60">Specialized Personas</span>
          </div>
        </div>

        {/* Subtabs */}
        <div
          className={`flex items-center p-1 rounded-2xl border text-xs self-start sm:self-auto ${
            isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-neutral-900/80 border-white/5'
          }`}
        >
          <button
            onClick={() => setActiveSubTab('my')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeSubTab === 'my'
                ? isLight
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'bg-[#151926] text-white font-semibold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            My Assistants
          </button>
          <button
            onClick={() => setActiveSubTab('marketplace')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeSubTab === 'marketplace'
                ? isLight
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'bg-[#151926] text-white font-semibold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Marketplace
          </button>
        </div>
      </div>

      {/* Grid of Assistants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((asst) => {
          const Icon = asst.icon;
          return (
            <div
              key={asst.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-200 transform-gpu hover:-translate-y-1 shadow-md hover:shadow-xl ${
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
                    {asst.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold tracking-tight">{asst.name}</h3>
                  <p className={`text-xs font-medium mt-0.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                    {asst.tagline}
                  </p>
                </div>

                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  {asst.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-inherit flex items-center justify-between">
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                  {asst.model}
                </span>

                <button
                  onClick={() => handleStartChat(asst.id, asst.name)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Create Assistant Card */}
        <div
          onClick={() => setActiveTab('agent_lab')}
          className={`p-6 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 ${
            isLight
              ? 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 text-slate-600'
              : 'border-white/10 hover:border-indigo-500/50 hover:bg-neutral-900/40 text-neutral-400'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-3 shadow-inner">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-inherit">Create Assistant</h3>
          <p className="text-xs opacity-70 mt-1 max-w-xs">
            Configure system prompts, connect specialized tools, and build customized AI agents in Agent Lab.
          </p>
        </div>
      </div>
    </div>
  );
};
