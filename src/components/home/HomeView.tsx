/**
 * ANGEL AI — Master Home Command Center
 * Implements high-fidelity UI matching Image 1, 2, 5 & 12:
 * - Dynamic Angel Greetings ("Good morning, Danny ☀️", "Hello again, Danny 🔮", "Ready to build something great, Danny? 🚀")
 * - Subtitle: "I'm Angel, your AI assistant. What can I help you with today?"
 * - Top-right glowing Angel emblem with 3D aesthetic
 * - Interactive Prompt Input with 6 quick action pills (Chat, Create Image, Create Video, Web Search, Live Search, Run Agent)
 * - "What would you like to do?" 8-tool grid with 3D elevation, dynamic hover, and anti-slop contrast
 * - Active Agents & Recent Activity with no harsh white outlines
 * - Agent Lab highlight banner
 * - Spotlight & News tabs with adaptive Light/Dark inspiration cards
 * - 100% complete Light Mode and Dark Mode support
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Film,
  Globe,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Plus,
  Sparkles,
  Upload,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AngelLogo } from '../ui/AngelLogo';

export const HomeView: React.FC = () => {
  const {
    setActiveTab,
    createConversation,
    sendMessage,
    conversations,
    userProfile,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';

  const [promptText, setPromptText] = useState('');
  const [activePill, setActivePill] = useState<'chat' | 'image' | 'video' | 'web' | 'live' | 'agent'>('chat');
  const [homeTab, setHomeTab] = useState<'overview' | 'spotlight'>('overview');

  // Dynamic random Angel greetings based on intelligence and time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeBasedOptions =
      hour < 12
        ? [
            { text: 'Good morning', emoji: '☀️', subtitle: "I'm Angel, your AI assistant. What can I help you with today?" },
            { text: 'Bright morning', emoji: '☕', subtitle: 'Ready to turn today’s vision into tangible progress?' },
            { text: 'Rise and build', emoji: '✨', subtitle: 'All neural engines and agents are synchronized and ready.' },
          ]
        : hour < 18
        ? [
            { text: 'Good afternoon', emoji: '🌤️', subtitle: 'What high-impact objective shall we tackle next?' },
            { text: 'Hello again', emoji: '🔮', subtitle: 'Continuing momentum across all your active projects.' },
            { text: 'Ready to create', emoji: '🚀', subtitle: 'From strategy to code, your AI command center is primed.' },
          ]
        : [
            { text: 'Good evening', emoji: '🌙', subtitle: 'Refining today’s milestones and organizing tomorrow’s roadmap.' },
            { text: 'Evening focus', emoji: '✨', subtitle: 'Quiet hours are best for creative breakthrough.' },
            { text: 'Welcome back', emoji: '🌌', subtitle: 'Where would you like to direct Angel’s focus tonight?' },
          ];

    const randomIndex = Math.floor(Math.random() * timeBasedOptions.length);
    return timeBasedOptions[randomIndex];
  }, []);

  const handleExecutePrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) return;

    let targetAgentId = 'angel-core';
    let prefix = '';

    if (activePill === 'image') {
      prefix = '[Generate Image]: ';
      targetAgentId = 'agent-optic';
    } else if (activePill === 'video') {
      prefix = '[Generate Video]: ';
      targetAgentId = 'agent-optic';
    } else if (activePill === 'web') {
      prefix = '[Web Search]: ';
    } else if (activePill === 'live') {
      prefix = '[Live Search]: ';
    } else if (activePill === 'agent') {
      targetAgentId = 'agent-atlas';
      prefix = '[Agent Execution]: ';
    }

    createConversation(targetAgentId, undefined, promptText.slice(0, 36));
    sendMessage(`${prefix}${promptText}`);
    setActiveTab('chat');
    setPromptText('');
  };

  const handleToolCardClick = (toolId: string) => {
    switch (toolId) {
      case 'chat':
        createConversation();
        setActiveTab('chat');
        break;
      case 'image':
        setActivePill('image');
        setPromptText('Create a cinematic image of ');
        break;
      case 'video':
        setActivePill('video');
        setPromptText('Create a short video showing ');
        break;
      case 'web':
        setActivePill('web');
        setPromptText('Web search: ');
        break;
      case 'live':
        setActivePill('live');
        setPromptText('Live search: ');
        break;
      case 'agent':
        setActiveTab('agent_lab');
        break;
      case 'assistant':
        setActiveTab('marketplace');
        break;
      case 'marketplace':
        setActiveTab('marketplace');
        break;
      default:
        setActiveTab('chat');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-7 animate-in fade-in duration-150">
      {/* ========================================================
          1. GREETING CARD (Image 1, Image 2 & Desktop Light)
          ======================================================== */}
      <div
        className={`relative rounded-3xl p-6 sm:p-8 overflow-hidden transition-all duration-200 shadow-sm ${
          isLight
            ? 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border border-slate-200/80 shadow-slate-100'
            : 'bg-gradient-to-br from-[#121622] via-[#0E121B] to-[#151928] border border-white/5 shadow-2xl'
        }`}
      >
        {/* Dynamic Ambient Background Glow */}
        <div
          className={`absolute top-0 right-10 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-indigo-300/15' : 'bg-indigo-600/15'
          }`}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h1
              className={`text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              <span>{greeting.text}, {userProfile.name.split(' ')[0]}</span>
              <span>{greeting.emoji}</span>
            </h1>
            <p
              className={`text-xs sm:text-sm font-normal ${
                isLight ? 'text-slate-600' : 'text-neutral-300'
              }`}
            >
              {greeting.subtitle}
            </p>
          </div>

          {/* Winged Angel Emblem with ethereal 3D glow */}
          <div
            className={`hidden sm:flex items-center justify-center p-3 rounded-2xl shadow-md transition-transform duration-300 hover:scale-105 ${
              isLight
                ? 'bg-white border border-slate-200/80 shadow-slate-200/50'
                : 'bg-neutral-900/80 border border-white/5 shadow-black/60'
            }`}
          >
            <AngelLogo size={42} glow={true} />
          </div>
        </div>

        {/* ========================================================
            2. INTERACTIVE PROMPT CONSOLE
            Input with Send arrow + Row of 6 action pills
            ======================================================== */}
        <div className="mt-6 space-y-3 relative z-10">
          <form onSubmit={handleExecutePrompt} className="relative flex items-center">
            <input
              id="input-angel-prompt"
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ask me anything..."
              className={`w-full rounded-2xl px-5 py-4 pr-14 text-xs sm:text-sm outline-none transition-all shadow-inner ${
                isLight
                  ? 'bg-white border border-slate-300/80 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10'
                  : 'bg-neutral-950/90 border border-white/10 text-white placeholder-neutral-500 focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50'
              }`}
            />
            <button
              type="submit"
              disabled={!promptText.trim()}
              className="absolute right-3 w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-40 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center shadow-md transition-all cursor-pointer transform-gpu hover:scale-105 active:scale-95"
              title="Execute directive"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Action Pills Row (no harsh lines, 3D pill hover) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => setActivePill('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                activePill === 'chat'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePill('image');
                if (!promptText) setPromptText('Create an image of ');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                activePill === 'image'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Create Image</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePill('video');
                if (!promptText) setPromptText('Generate video of ');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                activePill === 'video'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-pink-400" />
              <span>Create Video</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePill('web');
                if (!promptText) setPromptText('Web search: ');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                activePill === 'web'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Web Search</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePill('live');
                if (!promptText) setPromptText('Live search trends: ');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                activePill === 'live'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Search</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePill('agent');
                if (!promptText) setPromptText('Autonomous agent task: ');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                activePill === 'agent'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Run Agent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Switcher (Overview vs Spotlight & News) */}
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-white/5'
        }`}
      >
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setHomeTab('overview')}
            className={`pb-1 transition-colors relative ${
              homeTab === 'overview'
                ? isLight
                  ? 'text-slate-900'
                  : 'text-white'
                : isLight
                ? 'text-slate-400 hover:text-slate-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Overview
            {homeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setHomeTab('spotlight')}
            className={`pb-1 transition-colors relative ${
              homeTab === 'spotlight'
                ? isLight
                  ? 'text-slate-900'
                  : 'text-white'
                : isLight
                ? 'text-slate-400 hover:text-slate-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Spotlight & News
            {homeTab === 'spotlight' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>

        <span
          className={`text-[11px] font-mono ${
            isLight ? 'text-slate-400' : 'text-neutral-400'
          }`}
        >
          5 AGENTS READY • PERSISTENT MEMORY
        </span>
      </div>

      {homeTab === 'overview' ? (
        <>
          {/* ========================================================
              3. "WHAT WOULD YOU LIKE TO DO?" 8-TOOL GRID + RIGHT COLUMN WIDGETS
              Dynamic 3D cards without harsh white outlines
              ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: What would you like to do? */}
            <div className="lg:col-span-2 space-y-4">
              <h2
                className={`text-sm font-semibold tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-neutral-200'
                }`}
              >
                What would you like to do?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Chat */}
                <div
                  onClick={() => handleToolCardClick('chat')}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 hover:shadow-lg ${
                    isLight
                      ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                      : 'bg-[#121622]/90 border border-white/5 hover:border-white/15 shadow-md shadow-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-3 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isLight ? 'text-slate-400 group-hover:text-indigo-600' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    />
                  </div>
                  <h3 className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Chat
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Have a conversation with Angel
                  </p>
                </div>

                {/* 2. Create Image */}
                <div
                  onClick={() => handleToolCardClick('image')}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 hover:shadow-lg ${
                    isLight
                      ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                      : 'bg-[#121622]/90 border border-white/5 hover:border-white/15 shadow-md shadow-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isLight ? 'text-slate-400 group-hover:text-indigo-600' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    />
                  </div>
                  <h3 className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Create image
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Bring your ideas to life
                  </p>
                </div>

                {/* 3. Create Video */}
                <div
                  onClick={() => handleToolCardClick('video')}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 hover:shadow-lg ${
                    isLight
                      ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                      : 'bg-[#121622]/90 border border-white/5 hover:border-white/15 shadow-md shadow-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 mb-3 group-hover:scale-110 transition-transform">
                      <Film className="w-4 h-4" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isLight ? 'text-slate-400 group-hover:text-indigo-600' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    />
                  </div>
                  <h3 className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Create video
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Turn ideas into videos
                  </p>
                </div>

                {/* 4. Web Search */}
                <div
                  onClick={() => handleToolCardClick('web')}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 hover:shadow-lg ${
                    isLight
                      ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                      : 'bg-[#121622]/90 border border-white/5 hover:border-white/15 shadow-md shadow-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                      <Globe className="w-4 h-4" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isLight ? 'text-slate-400 group-hover:text-indigo-600' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    />
                  </div>
                  <h3 className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Web search
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Find information across the web
                  </p>
                </div>

                {/* 5. Live Search */}
                <div
                  onClick={() => handleToolCardClick('live')}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 hover:shadow-lg ${
                    isLight
                      ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                      : 'bg-[#121622]/90 border border-white/5 hover:border-white/15 shadow-md shadow-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform">
                      <Zap className="w-4 h-4" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isLight ? 'text-slate-400 group-hover:text-indigo-600' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    />
                  </div>
                  <h3 className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Live search
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Real-time results & social feeds
                  </p>
                </div>

                {/* 6. Run Agent */}
                <div
                  onClick={() => handleToolCardClick('agent')}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 hover:shadow-lg ${
                    isLight
                      ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                      : 'bg-[#121622]/90 border border-white/5 hover:border-white/15 shadow-md shadow-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                      <Bot className="w-4 h-4" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isLight ? 'text-slate-400 group-hover:text-indigo-600' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    />
                  </div>
                  <h3 className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Run agent
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Let Angel work on complex tasks
                  </p>
                </div>

                {/* 7. Custom Assistant */}
                <div
                  onClick={() => handleToolCardClick('assistant')}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 hover:shadow-lg ${
                    isLight
                      ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                      : 'bg-[#121622]/90 border border-white/5 hover:border-white/15 shadow-md shadow-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isLight ? 'text-slate-400 group-hover:text-indigo-600' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    />
                  </div>
                  <h3 className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Custom assistant
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Your personal AI team
                  </p>
                </div>

                {/* 8. Agent Lab */}
                <div
                  onClick={() => handleToolCardClick('agent')}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 transform-gpu hover:-translate-y-1 hover:shadow-lg ${
                    isLight
                      ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                      : 'bg-[#121622]/90 border border-white/5 hover:border-white/15 shadow-md shadow-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-3 group-hover:scale-110 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isLight ? 'text-slate-400 group-hover:text-indigo-600' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    />
                  </div>
                  <h3 className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Agent Lab
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Build and execute workflows
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Active Agents + Recent Activity */}
            <div className="space-y-6">
              {/* Active Agents Widget */}
              <div
                className={`rounded-2xl p-5 space-y-3 transition-all ${
                  isLight
                    ? 'bg-white border border-slate-200/80 shadow-2xs'
                    : 'bg-[#121622]/90 border border-white/5 shadow-md shadow-black/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3
                      className={`text-xs font-semibold ${
                        isLight ? 'text-slate-900' : 'text-neutral-200'
                      }`}
                    >
                      Active Agents (3 running)
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('agent_lab')}
                    className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium"
                  >
                    View all →
                  </button>
                </div>

                <div className="space-y-2">
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100/70' : 'bg-neutral-900/50 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 text-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className={`text-xs font-medium ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                          Research Agent
                        </h4>
                        <p className={`text-[10px] truncate max-w-[130px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                          Gathering latest updates...
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                      2m
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100/70' : 'bg-neutral-900/50 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 text-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className={`text-xs font-medium ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                          Content Creator
                        </h4>
                        <p className={`text-[10px] truncate max-w-[130px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                          Generating blog post draft...
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                      4m
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100/70' : 'bg-neutral-900/50 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className={`text-xs font-medium ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                          Image Generator
                        </h4>
                        <p className={`text-[10px] truncate max-w-[130px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                          Creating graphic assets...
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                      1m
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div
                className={`rounded-2xl p-5 space-y-3 transition-all ${
                  isLight
                    ? 'bg-white border border-slate-200/80 shadow-2xs'
                    : 'bg-[#121622]/90 border border-white/5 shadow-md shadow-black/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-xs font-semibold ${
                      isLight ? 'text-slate-900' : 'text-neutral-200'
                    }`}
                  >
                    Recent Activity
                  </h3>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium"
                  >
                    View all →
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className={`truncate ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                        Image generated: Scenic mountain
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono shrink-0 ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                      2m
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Film className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span className={`truncate ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                        Video created: Product demo video
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono shrink-0 ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                      12m
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className={`truncate ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                        Task completed: Market research
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono shrink-0 ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                      18m
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className={`truncate ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                        Assistant installed: Productivity Coach
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono shrink-0 ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                      1h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              4. AGENT LAB HIGHLIGHT BANNER SECTION
              ======================================================== */}
          <div
            className={`rounded-2xl p-6 space-y-4 transition-all ${
              isLight
                ? 'bg-gradient-to-r from-indigo-50/70 to-purple-50/50 border border-slate-200/80 shadow-2xs'
                : 'bg-[#121622]/90 border border-white/5 shadow-md shadow-black/40'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  New
                </span>
                <div>
                  <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Agent Lab
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Create, manage and deploy autonomous AI agents.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('agent_lab')}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm transform-gpu hover:-translate-y-0.5"
              >
                <span>Open Agent Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {/* Agent Runner */}
              <div
                onClick={() => setActiveTab('agent_lab')}
                className={`p-3.5 rounded-xl cursor-pointer flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                  isLight
                    ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                    : 'bg-neutral-950/60 border border-white/5 hover:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                      Agent Runner
                    </span>
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <p className={`text-[11px] mb-3 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Run autonomous agents with goals.
                  </p>
                </div>
                <span className="text-[10px] text-indigo-500 font-semibold self-start hover:underline">
                  Launch →
                </span>
              </div>

              {/* Task Queue */}
              <div
                onClick={() => setActiveTab('tasks')}
                className={`p-3.5 rounded-xl cursor-pointer flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                  isLight
                    ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                    : 'bg-neutral-950/60 border border-white/5 hover:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                      Task Queue
                    </span>
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <p className={`text-[11px] mb-3 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Track multi-step goals.
                  </p>
                </div>
                <span className="text-[10px] text-blue-500 font-semibold self-start hover:underline">
                  View Tasks →
                </span>
              </div>

              {/* Approval Queue */}
              <div
                onClick={() => setActiveTab('agent_lab')}
                className={`p-3.5 rounded-xl cursor-pointer flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                  isLight
                    ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                    : 'bg-neutral-950/60 border border-white/5 hover:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                      Approval Queue
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className={`text-[11px] mb-3 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Review & authorize actions.
                  </p>
                </div>
                <span className="text-[10px] text-emerald-500 font-semibold self-start hover:underline">
                  Approvals →
                </span>
              </div>

              {/* Assistant Creator */}
              <div
                onClick={() => setActiveTab('marketplace')}
                className={`p-3.5 rounded-xl cursor-pointer flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                  isLight
                    ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                    : 'bg-neutral-950/60 border border-white/5 hover:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                      Assistant Creator
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className={`text-[11px] mb-3 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Build custom personas.
                  </p>
                </div>
                <span className="text-[10px] text-amber-500 font-semibold self-start hover:underline">
                  Create →
                </span>
              </div>

              {/* Marketplace */}
              <div
                onClick={() => setActiveTab('marketplace')}
                className={`p-3.5 rounded-xl cursor-pointer flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                  isLight
                    ? 'bg-white border border-slate-200/80 hover:border-indigo-400 shadow-2xs'
                    : 'bg-neutral-950/60 border border-white/5 hover:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                      Marketplace
                    </span>
                    <Layers className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <p className={`text-[11px] mb-3 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Explore ready-made tools.
                  </p>
                </div>
                <span className="text-[10px] text-orange-500 font-semibold self-start hover:underline">
                  Browse →
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              5. BOTTOM ROW: RECENT CONVERSATIONS & QUICK ACTIONS
              ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Conversations */}
            <div
              className={`rounded-2xl p-5 space-y-3 transition-all ${
                isLight
                  ? 'bg-white border border-slate-200/80 shadow-2xs'
                  : 'bg-[#121622]/90 border border-white/5 shadow-md shadow-black/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                  Recent Conversations
                </h3>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium"
                >
                  View all →
                </button>
              </div>

              <div className="space-y-1.5">
                {conversations.slice(0, 4).map((c, idx) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      createConversation('angel-core', undefined, c.title);
                      setActiveTab('chat');
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      isLight
                        ? 'bg-slate-50 hover:bg-slate-100'
                        : 'bg-neutral-950/60 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="truncate">
                        <h4 className={`text-xs font-medium truncate ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                          {c.title}
                        </h4>
                        <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                          {idx === 0 ? 'Web search' : idx === 1 ? 'Agent' : idx === 2 ? 'Image generation' : 'Chat'} • 2m ago
                        </p>
                      </div>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-neutral-400'}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div
              className={`rounded-2xl p-5 space-y-3 transition-all ${
                isLight
                  ? 'bg-white border border-slate-200/80 shadow-2xs'
                  : 'bg-[#121622]/90 border border-white/5 shadow-md shadow-black/40'
              }`}
            >
              <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                Quick Actions
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    createConversation();
                    setActiveTab('chat');
                  }}
                  className={`p-3 rounded-xl text-left transition-colors ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-neutral-950/60 hover:bg-neutral-900'
                  }`}
                >
                  <Plus className="w-4 h-4 text-indigo-500 mb-2" />
                  <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                    New Chat
                  </h4>
                  <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Start a conversation
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('visual_mode')}
                  className={`p-3 rounded-xl text-left transition-colors ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-neutral-950/60 hover:bg-neutral-900'
                  }`}
                >
                  <Upload className="w-4 h-4 text-blue-500 mb-2" />
                  <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                    Upload File
                  </h4>
                  <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Inspect documents or photos
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`p-3 rounded-xl text-left transition-colors ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-neutral-950/60 hover:bg-neutral-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-500 mb-2" />
                  <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                    Explore Assistants
                  </h4>
                  <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Browse extensions
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('memories')}
                  className={`p-3 rounded-xl text-left transition-colors ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-neutral-950/60 hover:bg-neutral-900'
                  }`}
                >
                  <Brain className="w-4 h-4 text-emerald-500 mb-2" />
                  <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                    View Memory
                  </h4>
                  <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Durable knowledge bank
                  </p>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================
            SPOTLIGHT & NEWS VIEW (Image 6 & Desktop Light Inspiration)
            ======================================================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Spotlight */}
            <div
              className={`lg:col-span-2 rounded-2xl p-6 space-y-4 ${
                isLight
                  ? 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border border-slate-200/80 text-slate-800'
                  : 'bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-purple-950/30 border border-white/5 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-500">
                  Today's Spotlight
                </span>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  • Gemini 3.8 Multi-Agent Release
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Autonomous Workflow Execution & Knowledge Retrieval
              </h2>
              <p
                className={`text-xs leading-relaxed max-w-xl ${
                  isLight ? 'text-slate-600' : 'text-neutral-300'
                }`}
              >
                Deploy specialized agents that synthesize memory from past sessions, coordinate schema migrations, and generate structured deliverables without constant hand-holding.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('agent_lab')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Try Atlas Architect
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  Inspect Task Queue
                </button>
              </div>
            </div>

            {/* Inspiring Artwork Quote Card (Desktop Light & Dark, Image 5 & 6) */}
            <div
              className={`rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden ${
                isLight
                  ? 'bg-gradient-to-br from-amber-50/70 via-rose-50/50 to-orange-50/60 border border-amber-200/60 text-slate-800'
                  : 'bg-gradient-to-br from-[#121620] via-neutral-900 to-[#181D2A] border border-white/5 text-neutral-200'
              }`}
            >
              <div className="space-y-2 relative z-10">
                <span className="text-2xl text-indigo-400 font-serif">“</span>
                <p className="text-xs italic leading-relaxed font-medium">
                  {isLight
                    ? 'Better ideas build a brighter future.'
                    : 'The future belongs to those who believe in the beauty of their dreams.'}
                </p>
                <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  {isLight ? '— Angel Inspiration' : '— Eleanor Roosevelt'}
                </p>
              </div>
              <div
                className={`mt-4 pt-4 border-t flex items-center justify-between text-[11px] ${
                  isLight ? 'border-amber-200/60 text-slate-500' : 'border-neutral-800 text-neutral-400'
                }`}
              >
                <span>Angel Daily Spark</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Latest News Feed */}
          <div
            className={`rounded-2xl p-5 space-y-4 ${
              isLight
                ? 'bg-white border border-slate-200/80'
                : 'bg-[#121622]/90 border border-white/5'
            }`}
          >
            <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
              Latest Intelligence Briefings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div
                className={`p-3.5 rounded-xl space-y-1.5 ${
                  isLight ? 'bg-slate-50' : 'bg-neutral-950/60'
                }`}
              >
                <span className="text-[10px] text-blue-500 font-mono">INDUSTRY UPDATE</span>
                <h4 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                  Gemini 3.8 Flash Benchmarks
                </h4>
                <p className={isLight ? 'text-slate-500' : 'text-neutral-400'}>
                  Sub-second latency with high thinking budget capabilities for multi-step reasoning.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl space-y-1.5 ${
                  isLight ? 'bg-slate-50' : 'bg-neutral-950/60'
                }`}
              >
                <span className="text-[10px] text-purple-500 font-mono">ARCHITECTURE</span>
                <h4 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                  Supabase RLS & Cloud Sync
                </h4>
                <p className={isLight ? 'text-slate-500' : 'text-neutral-400'}>
                  Row level security policies ensure zero cross-tenant contamination across private memories.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl space-y-1.5 ${
                  isLight ? 'bg-slate-50' : 'bg-neutral-950/60'
                }`}
              >
                <span className="text-[10px] text-emerald-500 font-mono">SECURITY</span>
                <h4 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                  Hardware Vault & Encrypted Secrets
                </h4>
                <p className={isLight ? 'text-slate-500' : 'text-neutral-400'}>
                  Client-side encrypted secrets and ephemeral incognito chat sessions prevent token exposure.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
