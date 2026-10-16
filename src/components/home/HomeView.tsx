import React, { useMemo, useState } from 'react';
import { ArrowUp, Sparkles, Search, Image as ImageIcon, FileText, Workflow, BookOpen, CalendarCheck } from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AngelLogo } from '../ui/AngelLogo';

const suggestionSets = [
  [
    { label: 'Research a topic', prompt: 'Research the latest developments in a topic I care about and cite reliable sources.', icon: Search },
    { label: 'Create something', prompt: 'Help me turn an idea into a polished piece of work.', icon: ImageIcon },
    { label: 'Plan my next steps', prompt: 'Help me organize my priorities into a practical step-by-step plan.', icon: CalendarCheck },
  ],
  [
    { label: 'Understand a difficult idea', prompt: 'Explain a difficult concept clearly, with examples and a short summary.', icon: BookOpen },
    { label: 'Write or improve a document', prompt: 'Help me draft or improve a document. Ask only for essential missing details.', icon: FileText },
    { label: 'Build a workflow', prompt: 'Help me design a reliable workflow for a repetitive task.', icon: Workflow },
  ],
  [
    { label: 'Explore an idea', prompt: 'Help me explore this idea, test its assumptions, and identify useful next steps.', icon: Sparkles },
    { label: 'Compare options', prompt: 'Compare the best options for my goal and explain the trade-offs.', icon: Search },
    { label: 'Make a practical plan', prompt: 'Turn my goal into a practical plan with milestones and success checks.', icon: CalendarCheck },
  ],
];

export const HomeView: React.FC = () => {
  const { setActiveTab, createConversation, sendMessage, userProfile, settings } = useAngel();
  const [promptText, setPromptText] = useState('');
  const isLight = settings.theme === 'light';
  const suggestions = useMemo(() => {
    const pool = suggestionSets.flat();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }, []);

  const submitPrompt = (event?: React.FormEvent) => {
    event?.preventDefault();
    const prompt = promptText.trim();
    if (!prompt) return;
    const conversationId = createConversation('angel-core', undefined, prompt.slice(0, 48));
    setActiveTab('chat');
    setPromptText('');
    void sendMessage(prompt, undefined, conversationId);
  };

  return (
    <section className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center px-4 pb-8 pt-8 sm:px-6 sm:pt-14">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 shadow-lg shadow-indigo-950/20">
        <AngelLogo size={34} glow />
      </div>
      <div className="mb-8 max-w-2xl text-center">
        <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {getGreeting()}, {userProfile.name?.trim().split(/\s+/)[0] || 'there'}
        </h1>
        <p className={`mt-2 text-sm sm:text-base ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>I'm Angel. What would you like to work on?</p>
      </div>
      <form onSubmit={submitPrompt} className={`w-full rounded-3xl border p-3 shadow-xl backdrop-blur-xl transition-all focus-within:border-indigo-400/50 ${isLight ? 'border-slate-200 bg-white/90' : 'border-white/10 bg-[#111522]/85'}`}>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitPrompt(); } }}
          rows={2}
          placeholder="Message Angel..."
          aria-label="Message Angel"
          className={`max-h-40 min-h-[64px] w-full resize-y bg-transparent px-3 py-2 text-sm outline-none ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-neutral-100 placeholder-neutral-500'}`}
        />
        <div className="flex items-center justify-between gap-3 px-1 pb-1">
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>Enter to send · Shift+Enter for a new line</span>
          <button type="submit" disabled={!promptText.trim()} aria-label="Send message to Angel" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
      <div className="mt-5 w-full max-w-xl">
        <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>Suggestions</h2>
        <ul className="space-y-1.5">
          {suggestions.map((item) => {
            const Icon = item.icon;
            return <li key={item.label}>
              <button type="button" onClick={() => { const label = item.label.toLowerCase(); if (label.includes('workflow')) { setActiveTab('automation'); return; } if (label.includes('create something')) { setActiveTab('media_studio'); return; } if (label.includes('document')) { setActiveTab('canvas'); return; } setPromptText(item.prompt); }} className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-indigo-400/40 ${isLight ? 'border-slate-200 bg-white/75 hover:bg-white' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-300'}`}><Icon className="h-3.5 w-3.5" /></span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[12px] font-medium ${isLight ? 'text-slate-800' : 'text-neutral-100'}`}>{item.label}</span>
                  <span className={`mt-0.5 block text-[10px] leading-snug line-clamp-1 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{item.prompt}</span>
                </span>
                <Sparkles className={`h-3.5 w-3.5 shrink-0 opacity-50 transition group-hover:opacity-100 ${isLight ? 'text-indigo-500' : 'text-indigo-300'}`} />
              </button>
            </li>;
          })}
        </ul>
      </div>
    </section>
  );
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
