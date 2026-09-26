/**
 * ANGEL AI — Workspace Stage Window & Minimization Controls
 * Provides manual 'minimize' state for the main workspace area,
 * split/half-screen snap sizing, and floating minimized dock HUD.
 */

import React, { useEffect } from 'react';
import {
  Minus,
  Maximize2,
  Minimize2,
  Columns2,
  Sparkles,
  ChevronUp,
  MessageSquare,
  CheckSquare,
  FolderGit2,
  Bot,
  SlidersHorizontal,
  Home,
  Brain,
  Palette,
  Eye,
  Mic,
  RotateCcw,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AngelLogo } from '../ui/AngelLogo';

export const WorkspaceStageControls: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isWorkspaceMinimized,
    setIsWorkspaceMinimized,
    toggleWorkspaceMinimized,
    workspaceSizeMode,
    setWorkspaceSizeMode,
    settings,
    conversations,
    tasks,
    activeConversation,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Keyboard shortcut: Esc restores workspace if minimized
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWorkspaceMinimized) {
        setIsWorkspaceMinimized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWorkspaceMinimized, setIsWorkspaceMinimized]);

  if (isWorkspaceMinimized) {
    return null; // The minimized view handles its own floating dock
  }

  return (
    <div className="hidden md:flex absolute top-2.5 right-3 z-30 items-center gap-1 select-none">
      {/* Sizing & Minimization Pill */}
      <div
        className={`flex items-center gap-0.5 p-1 rounded-xl border backdrop-blur-md transition-all shadow-2xs ${
          isLight
            ? 'bg-white/85 border-slate-200/90 text-slate-600 shadow-slate-200/60'
            : 'bg-[#10141F]/85 border-white/10 text-neutral-300 shadow-black/60'
        }`}
      >
        {/* Half / Full Screen Snap Toggle */}
        <button
          onClick={() => setWorkspaceSizeMode(workspaceSizeMode === 'half' ? 'full' : 'half')}
          className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
            workspaceSizeMode === 'half'
              ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
              : isLight
              ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              : 'hover:bg-white/5 text-neutral-400 hover:text-white'
          }`}
          title={
            workspaceSizeMode === 'half'
              ? 'Expand to full screen (Click to toggle)'
              : 'Snap to half screen / compact width (Click to toggle)'
          }
          aria-label="Toggle half screen or full width"
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[10px] font-mono">
            {workspaceSizeMode === 'half' ? 'Half Screen' : 'Full Width'}
          </span>
        </button>

        {/* Manual Minimize Workspace Button */}
        <button
          onClick={toggleWorkspaceMinimized}
          className={`p-1.5 rounded-lg transition-colors ${
            isLight
              ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              : 'hover:bg-white/5 text-neutral-400 hover:text-white'
          }`}
          title="Minimize workspace area (Show ambient background canvas)"
          aria-label="Minimize workspace area"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const WorkspaceMinimizedView: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsWorkspaceMinimized,
    settings,
    tasks,
    conversations,
    activeConversation,
    userProfile,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Tab Title and Icon Mapping
  const tabDetails: Record<
    string,
    { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    home: {
      title: 'Home Dashboard',
      subtitle: `Welcome back, ${userProfile.name} • All systems nominal`,
      icon: Home,
    },
    chat: {
      title: activeConversation?.title || 'Chat Intelligence',
      subtitle: 'Active generative conversation in progress',
      icon: MessageSquare,
    },
    tasks: {
      title: 'Tasks & Workflows',
      subtitle: `${tasks.length} total tasks • Filtered operational list`,
      icon: CheckSquare,
    },
    projects: {
      title: 'Project Hub',
      subtitle: 'Active milestones and workspace deliverables',
      icon: FolderGit2,
    },
    agent_lab: {
      title: 'Agent Lab',
      subtitle: 'Autonomous multi-agent execution pipeline',
      icon: Bot,
    },
    settings: {
      title: 'Settings & System',
      subtitle: 'Workspace preferences and credentials',
      icon: SlidersHorizontal,
    },
    memories: {
      title: 'Memory Vault',
      subtitle: 'Episodic retention & context store',
      icon: Brain,
    },
    media_studio: {
      title: 'Media Studio',
      subtitle: 'Generative image and canvas studio',
      icon: Palette,
    },
    visual_mode: {
      title: 'Visual Perception',
      subtitle: 'Multimodal vision and camera stream',
      icon: Eye,
    },
    voice: {
      title: 'Voice Mode',
      subtitle: 'Acoustic audio stream with Nova',
      icon: Mic,
    },
  };

  const currentTab = tabDetails[activeTab] || {
    title: 'Angel Workspace',
    subtitle: 'Active background session',
    icon: Sparkles,
  };
  const Icon = currentTab.icon;

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-8 min-h-0 relative select-none animate-in fade-in duration-200">
      {/* Ambient Canvas Center HUD Card */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md text-center space-y-4">
        <div
          onClick={() => setIsWorkspaceMinimized(false)}
          className="relative cursor-pointer group transition-transform hover:scale-105"
          title="Click to restore workspace"
        >
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg group-hover:border-indigo-500/40 transition-colors">
            <AngelLogo size={36} glow={true} />
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-indigo-600 text-white shadow-md">
            <Maximize2 className="w-3 h-3" />
          </span>
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Workspace Minimized</span>
          </div>
          <h2
            className={`text-xl font-bold tracking-tight ${
              isLight ? 'text-slate-800' : 'text-neutral-100'
            }`}
          >
            {currentTab.title}
          </h2>
          <p
            className={`text-xs max-w-xs mx-auto leading-relaxed ${
              isLight ? 'text-slate-500' : 'text-neutral-400'
            }`}
          >
            {currentTab.subtitle}
          </p>
        </div>

        {/* Primary Restore Action */}
        <button
          onClick={() => setIsWorkspaceMinimized(false)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all transform-gpu hover:-translate-y-0.5 cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Restore Workspace</span>
          <span className="text-[10px] font-mono opacity-60 ml-1 px-1.5 py-0.5 rounded bg-black/20">
            Esc
          </span>
        </button>
      </div>

      {/* Floating Bottom Minimized Dock Bar */}
      <div
        className={`w-full max-w-xl mx-auto p-2.5 sm:p-3 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 transition-colors ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60'
            : 'bg-[#10141F]/95 border-white/10 text-neutral-100 shadow-black/80'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold truncate">{currentTab.title}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <p
              className={`text-[11px] truncate ${
                isLight ? 'text-slate-500' : 'text-neutral-400'
              }`}
            >
              Session paused • Click to resume
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsWorkspaceMinimized(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-xs cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>
        </div>
      </div>
    </div>
  );
};
