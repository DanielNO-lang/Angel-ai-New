/**
 * ANGEL AI — Mobile Top Header Bar
 * Rendered on mobile/tablet viewports (< 768px) on non-home pages,
 * ensuring users can always access the hamburger drawer, search,
 * minimize controls, and active view indicator.
 */

import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Minus,
  Maximize2,
  Headphones,
  Bot,
  MessageSquare,
  CheckSquare,
  FolderGit2,
  Brain,
  Palette,
  Eye,
  Settings,
  Users,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AngelLogo } from '../ui/AngelLogo';

export const MobileTopBar: React.FC = () => {
  const {
    activeTab,
    setMobileMenuOpen,
    openCommandPalette,
    toggleWorkspaceMinimized,
    isWorkspaceMinimized,
    setActiveTab,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const tabLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    chat: { label: 'Chat', icon: MessageSquare },
    agent_lab: { label: 'Agent Lab', icon: Bot },
    tasks: { label: 'Tasks', icon: CheckSquare },
    projects: { label: 'Projects', icon: FolderGit2 },
    memories: { label: 'Memory', icon: Brain },
    media_studio: { label: 'Media Studio', icon: Palette },
    assistants: { label: 'Assistants', icon: Users },
    visual_mode: { label: 'Visual Mode', icon: Eye },
    voice: { label: 'Voice Mode', icon: Headphones },
    settings: { label: 'Settings', icon: Settings },
  };

  const current = tabLabels[activeTab] || { label: 'Angel', icon: Sparkles };
  const TabIcon = current.icon;

  return (
    <header
      className={`md:hidden sticky top-0 z-30 flex items-center justify-between px-3 py-2 border-b backdrop-blur-md transition-colors select-none ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-2xs'
          : 'bg-[#0B0E14]/95 border-white/10 text-neutral-100 shadow-black/60'
      }`}
    >
      {/* Left: Hamburger Drawer Trigger + Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-neutral-300'
          }`}
          aria-label="Open navigation drawer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer min-w-0"
        >
          <AngelLogo size={24} glow={true} />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-sm tracking-tight truncate">Angel</span>
            <span className="text-neutral-400 text-xs">/</span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-medium truncate">
              <TabIcon className="w-3 h-3 shrink-0" />
              <span className="truncate">{current.label}</span>
            </div>
            {!isOnline && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-mono shrink-0">
                <WifiOff className="w-3 h-3 animate-pulse" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Voice Mode */}
        <button
          onClick={() => setActiveTab('voice')}
          className={`p-2 rounded-xl transition-colors ${
            isLight
              ? 'hover:bg-slate-100 text-slate-600 hover:text-indigo-600'
              : 'hover:bg-white/10 text-neutral-400 hover:text-indigo-400'
          }`}
          title="Voice Mode"
          aria-label="Voice Mode"
        >
          <Headphones className="w-4 h-4" />
        </button>

        {/* Global Search */}
        <button
          onClick={() => openCommandPalette('all')}
          className={`p-2 rounded-xl transition-colors ${
            isLight
              ? 'hover:bg-slate-100 text-slate-600'
              : 'hover:bg-white/10 text-neutral-400'
          }`}
          title="Search workspace (Win + K)"
          aria-label="Search workspace"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Minimize Workspace Stage */}
        <button
          onClick={toggleWorkspaceMinimized}
          className={`p-2 rounded-xl transition-colors ${
            isLight
              ? 'hover:bg-slate-100 text-slate-600'
              : 'hover:bg-white/10 text-neutral-400'
          }`}
          title={isWorkspaceMinimized ? 'Restore workspace' : 'Minimize workspace'}
          aria-label="Minimize or restore workspace"
        >
          {isWorkspaceMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
