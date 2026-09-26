/**
 * ANGEL AI — Header Breadcrumb Navigation Bar
 * Provides hierarchical breadcrumb trails for deep settings, multi-agent workspaces,
 * projects, and chat sessions with interactive quick-jump capabilities.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Mic,
  Eye,
  Cpu,
  FolderGit2,
  CheckSquare,
  Brain,
  Palette,
  Bot,
  Layers,
  SlidersHorizontal,
  Home,
  Trash2,
  Check,
  Search,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { NavigationTab, SettingsSubSection } from '../../types';
import { SETTINGS_CATEGORIES, getSettingsCategoryAndItem } from '../../data/settingsCategories';

interface HeaderBreadcrumbsProps {
  isLight: boolean;
}

export const HeaderBreadcrumbs: React.FC<HeaderBreadcrumbsProps> = ({ isLight }) => {
  const {
    activeTab,
    setActiveTab,
    activeSettingsSection,
    setActiveSettingsSection,
    activeConversation,
    projects,
    activeProjectId,
    agents,
    selectedAgentId,
  } = useAngel();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Tab Icon and Display Label Mapping
  const tabConfig: Record<NavigationTab, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    home: { label: 'Home', icon: Home },
    chat: { label: 'Chat', icon: MessageSquare },
    voice: { label: 'Voice Mode', icon: Mic },
    visual_mode: { label: 'Visual Mode', icon: Eye },
    agent_lab: { label: 'Agent Lab', icon: Cpu },
    projects: { label: 'Projects', icon: FolderGit2 },
    tasks: { label: 'Tasks', icon: CheckSquare },
    memories: { label: 'Memory Vault', icon: Brain },
    media_studio: { label: 'Media Studio', icon: Palette },
    assistants: { label: 'Assistants', icon: Bot },
    marketplace: { label: 'Marketplace', icon: Layers },
    settings: { label: 'Settings', icon: SlidersHorizontal },
    profile: { label: 'Profile', icon: Bot },
    recycle_bin: { label: 'Recycle Bin', icon: Trash2 },
    more: { label: 'More Tools', icon: Layers },
  };

  const currentTabInfo = tabConfig[activeTab] || { label: 'Workspace', icon: Sparkles };
  const TabIcon = currentTabInfo.icon;

  // Settings Deep Info
  const settingsInfo = activeTab === 'settings' ? getSettingsCategoryAndItem(activeSettingsSection) : null;
  const SubSectionIcon = settingsInfo?.item.icon || SlidersHorizontal;

  // Chat Deep Info
  const chatTitle = activeTab === 'chat' ? activeConversation?.title || 'Active Session' : null;

  // Project Deep Info
  const currentProject = activeTab === 'projects' && activeProjectId ? projects.find((p) => p.id === activeProjectId) : null;

  // Agent Lab Deep Info
  const currentAgent = activeTab === 'agent_lab' ? agents.find((a) => a.id === selectedAgentId) : null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium min-w-0 transition-colors border shadow-2xs ${
        isLight
          ? 'bg-slate-100/80 border-slate-200/90 text-slate-600'
          : 'bg-[#121622]/80 border-white/5 text-neutral-300'
      }`}
    >
      {/* Root Node: Angel AI */}
      <button
        onClick={() => setActiveTab('home')}
        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg transition-colors group shrink-0 ${
          isLight
            ? 'hover:text-indigo-600 hover:bg-slate-200/60'
            : 'hover:text-white hover:bg-white/5'
        }`}
        title="Go to Home"
      >
        <span className="p-0.5 rounded-md bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-transform">
          <Sparkles className="w-3 h-3 text-indigo-500" />
        </span>
        <span className="hidden sm:inline font-semibold tracking-tight">Angel</span>
      </button>

      {/* Divider */}
      <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

      {/* Primary Tab Node */}
      <button
        onClick={() => {
          if (activeTab === 'settings') {
            setActiveSettingsSection('account');
          } else {
            setActiveTab(activeTab);
          }
        }}
        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg transition-colors shrink-0 ${
          activeTab === 'home'
            ? isLight
              ? 'text-indigo-600 font-bold'
              : 'text-indigo-400 font-bold'
            : isLight
            ? 'hover:text-indigo-600 hover:bg-slate-200/60'
            : 'hover:text-white hover:bg-white/5'
        }`}
        title={`View ${currentTabInfo.label}`}
      >
        <TabIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />
        <span className="truncate max-w-[100px] sm:max-w-none">{currentTabInfo.label}</span>
      </button>

      {/* Deep Section: Settings Category & Sub-Section */}
      {activeTab === 'settings' && settingsInfo && (
        <>
          {/* Subtle Category Crumb (Visible on md+ screens) */}
          <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0 hidden md:inline" />
          <span
            className={`hidden md:inline px-1 py-0.5 text-[11px] opacity-60 truncate max-w-[130px] font-normal ${
              isLight ? 'text-slate-500' : 'text-neutral-400'
            }`}
          >
            {settingsInfo.category}
          </span>

          <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

          {/* Active Sub-Section with Quick-Switcher Dropdown */}
          <div className="relative inline-flex items-center" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold transition-all ${
                isLight
                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/70 border border-indigo-200/60'
                  : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20'
              }`}
              title="Click to jump to another settings category"
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
            >
              <SubSectionIcon className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="truncate max-w-[110px] sm:max-w-[140px]">
                {settingsInfo.item.label}
              </span>
              <ChevronDown
                className={`w-3 h-3 ml-0.5 opacity-60 transition-transform ${
                  isDropdownOpen ? 'rotate-180 text-indigo-500' : ''
                }`}
              />
            </button>

            {/* Quick-Jump Settings Menu */}
            {isDropdownOpen && (
              <div
                className={`absolute left-0 top-full mt-2 w-72 max-h-96 overflow-y-auto rounded-2xl border shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-slate-200/60 text-slate-800'
                    : 'bg-[#121622] border-white/10 shadow-black/80 text-neutral-100'
                }`}
              >
                <div className="px-2.5 py-1.5 border-b border-inherit mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">
                    Jump to Sub-Section
                  </span>
                  <span className="text-[10px] font-mono text-indigo-500 font-semibold">
                    12 Modules
                  </span>
                </div>

                <div className="space-y-2">
                  {SETTINGS_CATEGORIES.map((cat) => (
                    <div key={cat.category} className="space-y-0.5">
                      <div className="px-2 pt-1 text-[9px] font-bold uppercase tracking-wider opacity-40">
                        {cat.category}
                      </div>
                      {cat.items.map((sec) => {
                        const Icon = sec.icon;
                        const isCurrent = activeSettingsSection === sec.id;
                        return (
                          <button
                            key={sec.id}
                            onClick={() => {
                              setActiveSettingsSection(sec.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                              isCurrent
                                ? isLight
                                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                                  : 'bg-indigo-600/20 text-white font-bold'
                                : isLight
                                ? 'hover:bg-slate-100 text-slate-700'
                                : 'hover:bg-white/5 text-neutral-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-indigo-500' : 'opacity-60'}`} />
                              <span className="truncate">{sec.label}</span>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Deep Section: Chat Conversation */}
      {activeTab === 'chat' && chatTitle && (
        <>
          <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
          <span
            className={`px-1.5 py-0.5 rounded-md font-medium truncate max-w-[120px] sm:max-w-[180px] md:max-w-[240px] ${
              isLight ? 'text-indigo-700 bg-indigo-50/60' : 'text-indigo-300 bg-indigo-500/10'
            }`}
            title={chatTitle}
          >
            {chatTitle}
          </span>
        </>
      )}

      {/* Deep Section: Active Project */}
      {activeTab === 'projects' && currentProject && (
        <>
          <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
          <span
            className={`px-1.5 py-0.5 rounded-md font-medium truncate max-w-[120px] sm:max-w-[180px] ${
              isLight ? 'text-indigo-700 bg-indigo-50/60' : 'text-indigo-300 bg-indigo-500/10'
            }`}
            title={currentProject.name}
          >
            {currentProject.name}
          </span>
        </>
      )}

      {/* Deep Section: Selected Agent in Agent Lab */}
      {activeTab === 'agent_lab' && currentAgent && (
        <>
          <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
          <span
            className={`px-1.5 py-0.5 rounded-md font-medium truncate max-w-[120px] sm:max-w-[180px] ${
              isLight ? 'text-indigo-700 bg-indigo-50/60' : 'text-indigo-300 bg-indigo-500/10'
            }`}
            title={currentAgent.name}
          >
            {currentAgent.name}
          </span>
        </>
      )}
    </nav>
  );
};
