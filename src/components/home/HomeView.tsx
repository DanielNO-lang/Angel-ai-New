import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Bot, CalendarClock, FolderKanban, Image as ImageIcon, Library, Search, Sparkles, BarChart3, Mic2, ArrowUpRight } from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AngelLogo } from '../ui/AngelLogo';
import { DailyDigest } from './DailyDigest';
import { RecentActivityWidget } from './RecentActivityWidget';

const greetings = ['How was your day?','Good to see you again.','What are you up to today?','Anything on your mind?','What shall we work on?','How is everything going?','What are we building today?','Ready when you are.'];

export const HomeView: React.FC = () => {
  const { setActiveTab, settings, userProfile, isSignedIn, openCommandPalette, setIsAuthPageOpen } = useAngel();
  const isLight = settings.theme === 'light';
  const greeting = useMemo(() => greetings[Math.floor(Math.random() * greetings.length)], []);
  const firstName = userProfile?.name?.split(' ')[0] || '';
  const tools = [
    { id: 'agent_lab', label: 'Agent Lab', icon: Bot, tab: 'agent_lab' as const },
    { id: 'projects', label: 'Projects', icon: FolderKanban, tab: 'projects' as const },
    { id: 'schedule', label: 'Schedule', icon: CalendarClock, tab: 'tasks' as const },
    { id: 'library', label: 'Library', icon: Library, tab: 'library' as const },
    { id: 'media_studio', label: 'Media Studios', icon: ImageIcon, tab: 'media_studio' as const },
    { id: 'data_analysis', label: 'Data Analysis', icon: BarChart3, tab: 'data_analysis' as const },
  ];
  const protectedTabs = new Set(['agent_lab','projects','tasks','library','data_analysis']);
  const runTool = (tab: string) => { if (!isSignedIn && protectedTabs.has(tab)) { setIsAuthPageOpen(true); return; } setActiveTab(tab as any); };

  return <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-7 sm:py-10 space-y-7">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-[0_25px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl p-6 sm:p-9">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="relative flex items-center justify-between gap-6"><div><p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-indigo-300/70">Angel</p><h1 className={`text-3xl sm:text-5xl font-semibold tracking-tight ${isLight?'text-slate-950':'text-white'}`}>{greeting}{firstName?`, ${firstName}`:''}</h1></div><div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/10 shadow-2xl"><AngelLogo size={42} glow /></div></div>
    </section>

    <section><div className="mb-3 flex items-center justify-between"><div><h2 className={`text-lg font-semibold ${isLight?'text-slate-900':'text-white'}`}>Tools</h2><p className={`text-xs mt-1 ${isLight?'text-slate-500':'text-neutral-500'}`}>Jump straight into the workspace.</p></div></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{tools.map(tool=>{const Icon=tool.icon;return <motion.button key={tool.id} whileHover={{y:-3,scale:1.01}} whileTap={{scale:.98}} onClick={()=>runTool(tool.tab)} className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${isLight?'border-slate-200 bg-white/75 hover:bg-white shadow-sm':'border-white/8 bg-white/[0.035] hover:bg-white/[0.07] shadow-lg shadow-black/10'}`}><div className="mb-8 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20"><Icon className="h-4 w-4"/></div><div className={`text-sm font-medium ${isLight?'text-slate-800':'text-neutral-100'}`}>{tool.label}</div><ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 opacity-30 group-hover:opacity-80"/></motion.button>})}</div>
    </section>

    <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-5"><div className={`rounded-3xl border p-5 sm:p-6 ${isLight?'border-slate-200 bg-white/70':'border-white/8 bg-white/[0.03]'}`}><div className="flex items-center justify-between mb-5"><div><h2 className={`font-semibold ${isLight?'text-slate-900':'text-white'}`}>Live search</h2><p className="text-xs text-neutral-500 mt-1">Fresh information when you need it.</p></div><button onClick={()=>openCommandPalette('all')} className="rounded-xl p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4"/></button></div><div className="grid sm:grid-cols-2 gap-3">{['Latest technology news','What is happening today?','Design inspiration','Market and product updates'].map(item=><button key={item} onClick={()=>setActiveTab('chat')} className={`rounded-2xl p-4 text-left border transition ${isLight?'border-slate-200 hover:bg-slate-50':'border-white/7 hover:bg-white/[0.05]'}`}><div className="flex items-center gap-2"><Search className="h-3.5 w-3.5 text-indigo-400"/><span className="text-sm">{item}</span></div></button>)}</div></div><div className={`rounded-3xl border p-5 sm:p-6 ${isLight?'border-slate-200 bg-white/70':'border-white/8 bg-white/[0.03]'}`}><div className="flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-violet-400"/><h2 className={`font-semibold ${isLight?'text-slate-900':'text-white'}`}>Quick capture</h2></div><p className="text-sm text-neutral-500 leading-6">Capture a thought now and turn it into something useful later.</p><button onClick={()=>setActiveTab('tasks')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"><Mic2 className="h-4 w-4"/>Voice Memo</button></div></section>

    <section className="grid grid-cols-1 xl:grid-cols-2 gap-5"><DailyDigest isLight={isLight}/><RecentActivityWidget isLight={isLight}/></section>
  </div>;
};
