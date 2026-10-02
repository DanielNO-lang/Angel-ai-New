/**
 * ANGEL AI — Horizontally Scrollable Mobile Bottom Navigation Menu
 * Provides touch-swiping access to workspace modules without affecting page layout.
 * Features smooth scrolling, safe area padding, and active tab indicator pills.
 */

import React, { useRef } from 'react';
import {
  Home,
  MessageSquare,
  Bot,
  Clapperboard,
  Brain,
  FolderGit2,
  CheckSquare,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, settings } = useAngel();
  const isLight = settings.theme === 'light';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // In Tasks/Schedule view, the bottom bar is removed per consolidated sidebar specification
  if (activeTab === 'tasks') {
    return null;
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'agent_lab', label: 'Agents', icon: Bot },
    { id: 'media_studio', label: 'Studio', icon: Clapperboard },
    { id: 'memories', label: 'Memories', icon: Brain },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav
      aria-label="Mobile workspace navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors duration-150 select-none ${
        isLight
          ? 'bg-white/95 border-slate-200/90 text-slate-700 shadow-lg shadow-slate-200/50'
          : 'bg-[#0B0E14]/95 border-white/10 text-neutral-300 shadow-2xl shadow-black/90'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Horizontally scrollable flex container with touch swiping */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x overscroll-contain w-full"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`relative flex flex-col items-center justify-center shrink-0 min-w-[62px] px-2.5 py-1 rounded-xl transition-all duration-150 ${
                isActive
                  ? isLight
                    ? 'text-indigo-600 font-semibold'
                    : 'text-indigo-400 font-semibold'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {/* Active Pill Background */}
              {isActive && (
                <span
                  className={`absolute inset-0 rounded-xl transition-colors ${
                    isLight
                      ? 'bg-indigo-50 border border-indigo-200/60'
                      : 'bg-indigo-500/15 border border-indigo-500/25'
                  }`}
                />
              )}

              <Icon className="w-4 h-4 shrink-0 relative z-10" />
              <span className="text-[10px] tracking-tight mt-0.5 truncate relative z-10">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
