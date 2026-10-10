/**
 * ANGEL AI — Master Workspace Sidebar
 * Implements the user's explicit design requirements:
 * 1. Fixed Top Region:
 *    - Angel Logo + "Angel" (clean, no subtitles)
 *    - New Conversation button
 *    - Search bar with Windows key shortcut badge (Win + K)
 *    - Home navigation tool
 * 2. Scrollable Middle Region:
 *    - Scroll containment (overscroll-contain) preventing scroll propagation to main view
 *    - Tools: Agent Lab, Projects, Schedule, Library, Media Studio, Assistants, Marketplace, More
 *    - Pinned, Recent, and Archived conversations
 *    - No harsh white lines/borders; modern 3D dynamic elevations and subtle contrast
 * 3. Fixed Bottom Region:
 *    - Quote card ("Small steps every day lead to big results." / "Progress happens one small step at a time.")
 *      permanently fixed above the user profile
 *    - Danny Davis user profile (DD avatar, live status dot, Pro/Free badge, opens UserProfileMenu)
 * 4. Collapsed Hover Preview (Image 5 Panel 3):
 *    - Floating preview panel revealing New Chat, "Hover preview (does not permanently open)",
 *      recent chats list, and tool shortcuts on hover, closing smoothly on mouse leave
 * 5. Full Light Mode & Dark Mode fidelity across all components
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Bot,
  Brain,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FolderGit2,
  Home,
  Layers,
  MessageSquare,
  Plus,
  SquarePen,
  Search,
  Image as ImageIcon,
  Users,
  MoreHorizontal,
  Pin,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Flame,
  Quote,
  X,
  LogIn,
  PenTool,
  BarChart3,
  Zap,
  Settings,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import { AngelLogo } from '../ui/AngelLogo';
import { WindowsShortcutBadge } from '../ui/WindowsShortcutBadge';
import { UserProfileMenu } from './UserProfileMenu';
import { ChatOptionsMenu } from '../chat/ChatOptionsMenu';
import { SecretsModal } from '../modals/SecretsModal';
import { RandomQuoteCard } from '../ui/RandomQuoteCard';
import angelBackdropImg from '../../assets/images/Luminous Angelic A Emblem in Flowing Wings.png';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    openCommandPalette,
    userProfile,
    settings,
    isSignedIn,
    setIsAuthPageOpen,
    setAuthPageMode,
    isFocusMode,
    isAgentProcessing,
    isIncognitoActive,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Full-page hover-expand state on closed sidebar (per user specification)
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ignoreHoverRef = useRef(false);

  // Effective expanded state: true if permanently expanded OR currently hovered while collapsed
  const effectiveExpanded = !isSidebarCollapsed || isHoverExpanded;

  const handleCollapseSidebar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHoverExpanded(false);
    if (!isSidebarCollapsed) {
      toggleSidebar();
    }
  };

  const handleExpandSidebarPermanently = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHoverExpanded(false);
    if (isSidebarCollapsed) {
      toggleSidebar();
    }
  };

  // Modals & Anchors state
  const [isUserProfileMenuOpen, setIsUserProfileMenuOpen] = useState(false);
  const [chatOptionsId, setChatOptionsId] = useState<string | null>(null);
  const [chatOptionsAnchor, setChatOptionsAnchor] = useState<{ top: number; left: number } | undefined>();
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);

  // Section collapsed toggles
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllRecentMobile, setShowAllRecentMobile] = useState(false);

  // Conversations breakdown (strictly excluding secret chats)
  const pinnedConversations = conversations.filter((c) => c.pinned && !c.isArchived && !c.isSecret);
  const archivedConversations = conversations.filter((c) => c.isArchived && !c.isSecret);
  const recentConversations = conversations.filter((c) => !c.pinned && !c.isArchived && !c.isSecret);

  const redirectToSignIn = () => {
    setAuthPageMode('signin');
    setIsAuthPageOpen(true);
  };

  // Incognito Navigation: Only Chat, Media Studios, Knowledge/Search, and Recent Chats
  const incognitoTools: Array<{
    id: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    tabTarget?: NavigationTab;
    onClickCustom?: () => void;
  }> = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, tabTarget: 'chat' },
    { id: 'media_studio', label: 'Media Studios', icon: ImageIcon, tabTarget: 'media_studio' },
  ];

  const signedInTools: Array<{
    id: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    tabTarget?: NavigationTab;
    onClickCustom?: () => void;
    badge?: string;
  }> = [
    { id: 'agent_lab', label: 'Agent Lab', icon: Bot, tabTarget: 'agent_lab' },
    { id: 'projects', label: 'Projects', icon: FolderGit2, tabTarget: 'projects' },
    { id: 'library', label: 'Library', icon: BookOpen, tabTarget: 'library' },
    { id: 'tasks', label: 'Schedule', icon: Calendar, tabTarget: 'tasks' },
    { id: 'media_studio', label: 'Media Studios', icon: ImageIcon, tabTarget: 'media_studio' },
    { id: 'more', label: 'More', icon: MoreHorizontal, tabTarget: 'more' },
  ];

  const guestTools: Array<{
    id: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    tabTarget?: NavigationTab;
    onClickCustom?: () => void;
    badge?: string;
  }> = [
    { id: 'media_studio', label: 'Media Studios', icon: ImageIcon, tabTarget: 'media_studio' },
    { id: 'library', label: 'Library', icon: BookOpen, onClickCustom: redirectToSignIn },
    { id: 'projects', label: 'Projects', icon: FolderGit2, onClickCustom: redirectToSignIn },
    { id: 'tasks', label: 'Schedule', icon: Calendar, onClickCustom: redirectToSignIn },
  ];

  const scrollableTools = isIncognitoActive
    ? incognitoTools
    : isSignedIn
    ? signedInTools
    : guestTools;

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setIsHoverExpanded(false);
    // Ensure section starts from beginning of that section not where previous section stopped
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const handleNewChat = () => {
    createConversation();
    setActiveTab('chat');
    setMobileMenuOpen(false);
    setIsHoverExpanded(false);
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const handleSelectChat = (convId: string) => {
    setActiveConversationId(convId);
    setActiveTab('chat');
    setMobileMenuOpen(false);
    setIsHoverExpanded(false);
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const handleMouseEnterRail = () => {
    if (!isSidebarCollapsed) return;
    setIsHoverExpanded(true);
  };

  const handleMouseLeaveRail = () => {
    setIsHoverExpanded(false);
  };

  if (isFocusMode) {
    return null;
  }

  return (
    <>
      {/* ========================================================
          DESKTOP PERSISTENT SIDEBAR — Anchored at exact edge (left: 0)
          ======================================================== */}
      <aside
        onMouseEnter={handleMouseEnterRail}
        onMouseLeave={handleMouseLeaveRail}
        onPointerEnter={handleMouseEnterRail}
        onPointerLeave={handleMouseLeaveRail}
        style={{
          width: effectiveExpanded ? 240 : 60,
          transition: 'width 0ms linear',
          willChange: 'width',
        }}
        className={`hidden md:flex flex-col shrink-0 h-screen select-none overflow-x-hidden overflow-y-hidden relative z-30 border-r backdrop-blur-2xl ${
          isLight
            ? 'border-slate-200/60 bg-white/40 text-slate-800'
            : 'border-white/10 bg-white/[0.03] text-neutral-200 shadow-2xl'
        }`}
      >
        {/* Angel Backdrop Integration — Carries the left portion of the Angel artwork seamlessly */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none">
          <img
            src={angelBackdropImg}
            alt=""
            aria-hidden="true"
            className={`w-[100vw] h-full max-w-none object-cover object-left select-none transition-opacity duration-500 ${
              isLight
                ? 'opacity-20 mix-blend-multiply filter contrast-125 saturate-110'
                : 'opacity-70 mix-blend-screen filter brightness-105 contrast-125'
            }`}
          />
          <div
            className={`absolute inset-0 backdrop-blur-2xl ${
              isLight ? 'bg-[#F4F6FC]/60' : 'bg-[#060813]/60'
            }`}
          />
          <div
            className="absolute -top-[10%] -left-[20%] w-[120%] h-[50%] rounded-full pointer-events-none blur-[60px]"
            style={{
              background: isLight
                ? 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.12) 50%, transparent 70%)',
            }}
          />
        </div>

        {/* ========================================================
            1. FIXED (UNSCROLLABLE) TOP REGION
            ======================================================== */}
        <div
          className={`shrink-0 p-2 pb-1.5 space-y-1.5 border-b backdrop-blur-md ${
            isLight ? 'border-slate-200/50 bg-white/30' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          {/* Logo & Collapse / Pin Toggle */}
          <div className="flex items-center justify-between h-8 px-1">
            {!effectiveExpanded ? (
              <div
                onClick={handleExpandSidebarPermanently}
                className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors group relative ${
                  isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                }`}
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <AngelLogo size={24} glow={true} />
              </div>
            ) : (
              <>
                <div
                  onClick={() => !isIncognitoActive && handleNavClick('home')}
                  className="flex items-center gap-2 cursor-pointer group min-w-0"
                >
                  <AngelLogo size={26} glow={true} />
                  <span
                    className={`font-calligraphy text-2xl tracking-wide select-none transition-colors ${
                      isLight
                        ? 'text-slate-900 group-hover:text-indigo-600'
                        : 'text-white group-hover:text-indigo-300'
                    }`}
                  >
                    {isIncognitoActive ? 'Angel Private' : 'Angel'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* When sidebar is expanded, Search displays as a microscope/search icon immediately before the collapse sidebar icon */}
                  <button
                    onClick={() => openCommandPalette('all')}
                    aria-label="Search Workspace (Ctrl + K)"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-neutral-300 hover:text-white hover:bg-white/10'
                    }`}
                    title="Search (Ctrl + K)"
                  >
                    <Search className="w-3.5 h-3.5 text-indigo-400" />
                  </button>

                  <button
                    onClick={isSidebarCollapsed ? handleExpandSidebarPermanently : handleCollapseSidebar}
                    aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                        : 'text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {isSidebarCollapsed ? (
                      <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <PanelLeftClose className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Action: New Conversation */}
          <button
            onClick={handleNewChat}
            title={!effectiveExpanded ? 'New Conversation' : undefined}
            aria-label="New Conversation"
            className={`flex items-center rounded-xl text-[11px] font-semibold tracking-tight transition-all duration-150 transform-gpu hover:-translate-y-0.5 shadow-sm cursor-pointer ${
              !effectiveExpanded
                ? 'w-8 h-8 mx-auto justify-center p-0'
                : 'w-full px-2.5 py-1.5'
            } ${
              isLight
                ? 'bg-white/70 hover:bg-white text-slate-800 border border-slate-200/80 shadow-xs'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 shadow-sm backdrop-blur-md'
            }`}
          >
            <div className={`flex items-center min-w-0 ${!effectiveExpanded ? 'justify-center' : 'gap-2.5'}`}>
              <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                <SquarePen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              </div>
              {effectiveExpanded && <span className="truncate">New Conversation</span>}
            </div>
          </button>

          {/* Search Workspace Option — When collapsed, stays in-between New Conversation and Home. When expanded, moves to header before collapse icon */}
          {!effectiveExpanded && (
            <button
              onClick={() => openCommandPalette('all')}
              title={isIncognitoActive ? 'Knowledge / Search (Ctrl + K)' : 'Search (Ctrl + K)'}
              aria-label="Search Workspace (Ctrl + K)"
              className={`flex items-center rounded-xl text-[11px] font-medium transition-all duration-150 cursor-pointer w-8 h-8 mx-auto justify-center p-0 ${
                isLight
                  ? 'text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/70 border border-slate-200/60'
                  : 'text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-400/30 backdrop-blur-md'
              }`}
            >
              <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              </div>
            </button>
          )}

          {/* Home Tool — Hidden in Incognito Mode */}
          {!isIncognitoActive && (
            <div className="pt-0.5">
              <button
                onClick={() => handleNavClick('home')}
                title={!effectiveExpanded ? 'Home' : undefined}
                className={`flex items-center rounded-xl text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                  !effectiveExpanded
                    ? 'w-8 h-8 mx-auto justify-center p-0'
                    : 'w-full px-2.5 py-1.5'
                } ${
                  activeTab === 'home'
                    ? isLight
                      ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-2xs border border-indigo-200/80'
                      : 'bg-indigo-500/20 text-white font-semibold border border-indigo-400/30 backdrop-blur-md shadow-sm'
                    : isLight
                    ? 'text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/70 border border-slate-200/60'
                    : 'text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-400/30 backdrop-blur-md'
                }`}
              >
                <div className={`flex items-center min-w-0 ${!effectiveExpanded ? 'justify-center' : 'gap-2.5'}`}>
                  <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                    <Home
                      className={`w-3.5 h-3.5 shrink-0 ${
                        activeTab === 'home'
                          ? 'text-indigo-400'
                          : isLight
                          ? 'text-slate-400'
                          : 'text-indigo-300/80'
                      }`}
                    />
                  </div>
                  {effectiveExpanded && <span className="truncate">Home</span>}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            2. SCROLLABLE MIDDLE REGION
            With overscroll-contain preventing scroll chaining to right pane!
            Contains tools, chats, and More dropdown
            ======================================================== */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-1.5 space-y-2 custom-scrollbar overscroll-contain">
          {/* Main Navigation Tools */}
          <div className="space-y-1">
            {scrollableTools.map((tool) => {
              const isActive = tool.tabTarget ? activeTab === tool.tabTarget : false;
              const Icon = tool.icon;

              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    if (tool.onClickCustom) {
                      tool.onClickCustom();
                    } else if (tool.tabTarget) {
                      handleNavClick(tool.tabTarget);
                    }
                  }}
                  title={!effectiveExpanded ? tool.label : undefined}
                  className={`flex items-center rounded-xl text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                    !effectiveExpanded
                      ? 'w-8 h-8 mx-auto justify-center p-0'
                      : 'w-full justify-between px-2.5 py-1.5'
                  } ${
                    isActive
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs border border-indigo-200'
                        : 'bg-[#1E2744] text-white font-semibold border border-indigo-400/30 shadow-md shadow-indigo-950/40 backdrop-blur-md'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                      : 'text-slate-300 hover:text-white bg-[#141B2E]/50 hover:bg-[#1C2540] border border-white/5 hover:border-indigo-500/20 backdrop-blur-md'
                  }`}
                >
                  <div className={`flex items-center min-w-0 ${!effectiveExpanded ? 'justify-center' : 'gap-2.5'}`}>
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center relative">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive
                            ? 'text-indigo-400'
                            : isLight
                            ? 'text-slate-400'
                            : 'text-indigo-300/80'
                        }`}
                      />
                      {/* Heartbeat pulse indicator for active agent background processing */}
                      {tool.id === 'agent_lab' && isAgentProcessing && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2" title="AI Agent workflow actively processing">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse"></span>
                        </span>
                      )}
                    </div>
                    {effectiveExpanded && <span className="truncate">{tool.label}</span>}
                  </div>
                  {effectiveExpanded && tool.id === 'agent_lab' && isAgentProcessing && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  )}
                  {effectiveExpanded && (!isAgentProcessing || tool.id !== 'agent_lab') && tool.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-indigo-500/10 text-indigo-400">
                      {tool.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* When collapsed without hovering, display 1 single Chat icon consolidating Recent, Pinned, and Archive */}
            {!effectiveExpanded && (
              <div className="pt-1 mt-1 border-t border-indigo-500/20 flex justify-center">
                <button
                  onClick={() => handleNavClick('chat')}
                  title="Chats"
                  aria-label="Chats"
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer relative group ${
                    activeTab === 'chat'
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs border border-indigo-200'
                        : 'bg-[#1E2744] text-white font-semibold border border-indigo-400/30 shadow-md shadow-indigo-950/40 backdrop-blur-md'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-300 hover:text-white bg-[#141B2E]/50 hover:bg-[#1C2540] border border-white/5 hover:border-indigo-500/20 backdrop-blur-md'
                  }`}
                >
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                      activeTab === 'chat'
                        ? 'text-indigo-400'
                        : isLight
                        ? 'text-slate-400 group-hover:text-indigo-600'
                        : 'text-indigo-300/80 group-hover:text-indigo-300'
                    }`}
                  />
                  {conversations.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-[#0E1322]" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Conversations Section (Visible when expanded) */}
          {effectiveExpanded && (
            <div className="space-y-3 pt-1">
              {/* Pinned Chats */}
              {pinnedConversations.length > 0 && (
                <div className="space-y-1">
                  <button
                    onClick={() => setIsPinnedExpanded(!isPinnedExpanded)}
                    className={`w-full flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider ${
                      isLight ? 'text-slate-400 hover:text-slate-700' : 'text-indigo-300/70 hover:text-indigo-200'
                    }`}
                  >
                    <span>Pinned</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${isPinnedExpanded ? '' : '-rotate-90'}`}
                    />
                  </button>

                  {isPinnedExpanded && (
                    <div className="space-y-0.5">
                      {pinnedConversations.map((conv) => {
                        const isSelected =
                          activeConversationId === conv.id && activeTab === 'chat';
                        return (
                          <div
                            key={conv.id}
                            onClick={() => handleSelectChat(conv.id)}
                            className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? isLight
                                  ? 'bg-indigo-50 text-indigo-800 font-medium'
                                  : 'bg-[#1E2744] text-white font-medium border border-indigo-400/30'
                                : isLight
                                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                                : 'text-slate-300 hover:text-white hover:bg-[#161D32]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                              <span className="truncate">{conv.title}</span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setChatOptionsAnchor({ top: rect.top, left: rect.right + 8 });
                                setChatOptionsId(conv.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity"
                            >
                              <MoreHorizontal className="w-3 h-3 text-neutral-400" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 1. Archived Chats (Comes BEFORE Recent section per user request) */}
              {archivedConversations.length > 0 && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setIsArchivedExpanded(!isArchivedExpanded)}
                    className={`w-full flex items-center justify-between px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      isLight ? 'text-slate-400 hover:text-slate-700' : 'text-indigo-300/70 hover:text-indigo-200'
                    }`}
                  >
                    <span>Archived</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-medium opacity-60">
                        {archivedConversations.length}
                      </span>
                      <ChevronDown
                        className={`w-2.5 h-2.5 transition-transform ${isArchivedExpanded ? '' : '-rotate-90'}`}
                      />
                    </div>
                  </button>

                  {isArchivedExpanded && (
                    <div className="space-y-0.5">
                      {archivedConversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectChat(conv.id)}
                          className={`group flex items-center justify-between px-2 py-1 rounded-md text-[11px] cursor-pointer transition-colors ${
                            isLight
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              : 'text-slate-300 hover:text-white hover:bg-[#161D32]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate pr-1">
                            <MessageSquare className="w-3 h-3 shrink-0 text-indigo-400/70 group-hover:text-indigo-400" />
                            <span className="truncate">{conv.title}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setChatOptionsAnchor({ top: rect.top, left: rect.right + 8 });
                              setChatOptionsId(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-white"
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Recent (Follows Archived section, labeled "Recent") */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isLight ? 'text-slate-400' : 'text-indigo-300/70'
                    }`}
                  >
                    Recent
                  </span>
                  <span className="text-[9px] font-medium opacity-60">
                    {recentConversations.length}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {recentConversations.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 px-2 py-1 italic">No recent chats.</p>
                  ) : (
                    (showAllRecent ? recentConversations : recentConversations.slice(0, 5)).map((conv) => {
                      const isSelected =
                        activeConversationId === conv.id && activeTab === 'chat';
                      return (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectChat(conv.id)}
                          className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors ${
                            isSelected
                              ? isLight
                                ? 'bg-indigo-50 text-indigo-800 font-medium'
                                : 'bg-[#1E2744] text-white font-medium border border-indigo-400/30'
                              : isLight
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                              : 'text-slate-300 hover:text-white hover:bg-[#161D32]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate pr-1">
                            <MessageSquare className="w-3 h-3 shrink-0 text-neutral-400 group-hover:text-indigo-400" />
                            <span className="truncate">{conv.title}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setChatOptionsAnchor({ top: rect.top, left: rect.right + 8 });
                              setChatOptionsId(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-800/40 transition-opacity"
                          >
                            <MoreHorizontal className="w-3 h-3 text-neutral-400" />
                          </button>
                        </div>
                      );
                    })
                  )}

                  {/* ChatGPT-style See more toggle button */}
                  {recentConversations.length > 5 && (
                    <button
                      onClick={() => setShowAllRecent(!showAllRecent)}
                      className={`w-full mt-0.5 py-0.5 px-2 rounded-md text-[10px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isLight
                          ? 'text-indigo-600 hover:bg-indigo-50/70'
                          : 'text-indigo-400 hover:bg-neutral-800/60'
                      }`}
                    >
                      <span>{showAllRecent ? 'See less' : `See more (${recentConversations.length - 5})`}</span>
                      <ChevronDown
                        className={`w-2.5 h-2.5 transition-transform ${showAllRecent ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            3. FIXED BOTTOM REGION
            - Quote Card: Permanently fixed right above Danny Davis
            - User Profile: Danny Davis (DD), Pro/Free badge, online status dot
            ======================================================== */}
        <div
          className={`shrink-0 p-1.5 border-t space-y-1.5 select-none backdrop-blur-md ${
            isLight ? 'border-slate-100/80 bg-white/60' : 'border-indigo-500/15 bg-[#10172B]/75'
          }`}
        >
          {/* Dynamic Random Quote Card */}
          {effectiveExpanded && <RandomQuoteCard compact />}

          {/* User Profile Card */}
          <button
            onClick={() => {
              if (!isSignedIn) {
                setIsAuthPageOpen(true);
              } else {
                setIsUserProfileMenuOpen(true);
              }
            }}
            className={`w-full flex items-center gap-2 p-1.5 rounded-xl transition-all group ${
              !effectiveExpanded ? 'justify-center p-1' : 'justify-between'
            } ${
              isLight
                ? 'hover:bg-slate-100'
                : 'hover:bg-[#1C2540] bg-[#141B2E]/60 border border-white/5 hover:border-indigo-500/20'
            }`}
            title={isSignedIn ? 'User Profile & Settings' : 'Sign in to Angel'}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-semibold text-white text-[11px] shadow-2xs">
                  {isSignedIn ? (userProfile.initials || 'DD') : 'GU'}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 ${
                    isLight ? 'border-white' : 'border-neutral-950'
                  } ${
                    !isSignedIn
                      ? 'bg-neutral-400'
                      : userProfile.status === 'online'
                      ? 'bg-emerald-500'
                      : 'bg-neutral-500'
                  }`}
                />
              </div>

              {effectiveExpanded && (
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11.5px] font-semibold truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {isSignedIn ? userProfile.name : 'Guest User'}
                    </span>
                    <span className="text-[8.5px] font-semibold px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {isSignedIn ? userProfile.plan : 'Free'}
                    </span>
                  </div>
                  <p
                    className={`text-[9.5px] truncate ${
                      isLight ? 'text-slate-500' : 'text-neutral-400'
                    }`}
                  >
                    {isSignedIn ? userProfile.email : 'Click to sign in'}
                  </p>
                </div>
              )}
            </div>

            {effectiveExpanded && (
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                  isLight ? 'text-slate-400' : 'text-neutral-400'
                }`}
              />
            )}
          </button>
        </div>
      </aside>

      {/* Persistent mobile icon rail: icons remain available without a universal top bar. */}
      <nav aria-label="Workspace sections" className="fixed left-0 top-0 bottom-0 z-40 md:hidden w-12 flex flex-col items-center gap-2 py-3 border-r border-white/10 bg-[#080B14]/95 text-neutral-200 backdrop-blur-xl">
        <button onClick={() => handleNavClick('home')} aria-label="Home" title="Home" className={'w-9 h-9 flex items-center justify-center rounded-xl ' + (activeTab === 'home' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-500/10')}><Home className="w-5 h-5" /></button>
        <button onClick={() => handleNavClick('chat')} aria-label="Chat" title="Chat" className={'w-9 h-9 flex items-center justify-center rounded-xl ' + (activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-500/10')}><MessageSquare className="w-5 h-5" /></button>
        <div className="w-7 border-t border-current/15 my-1" />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2">
          {scrollableTools.filter((tool) => tool.id !== 'chat').map((tool) => {
            const Icon = tool.icon;
            const selected = !!tool.tabTarget && activeTab === tool.tabTarget;
            return <button key={tool.id} onClick={() => tool.onClickCustom ? tool.onClickCustom() : tool.tabTarget && handleNavClick(tool.tabTarget)} aria-label={tool.label} title={tool.label} className={'w-9 h-9 shrink-0 flex items-center justify-center rounded-xl ' + (selected ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-500/10')}><Icon className="w-5 h-5" /></button>;
          })}
        </div>
        <button onClick={() => handleNavClick('settings')} aria-label="Settings" title="Settings" className={'w-9 h-9 flex items-center justify-center rounded-xl ' + (activeTab === 'settings' || activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-500/10')}><Settings className="w-5 h-5" /></button>
        <button onClick={() => setMobileMenuOpen(true)} aria-label="Open full sidebar" title="Open full sidebar" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-indigo-500/10"><MoreHorizontal className="w-5 h-5" /></button>
      </nav>

      {/* ========================================================
          MOBILE & TABLET SLIDE-IN SIDEBAR DRAWER
          Exact restoration per user request: single unified sidebar
          with NO bottom navigation panel!
          ======================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <aside
            className={`fixed inset-y-0 left-0 w-72 sm:w-80 flex flex-col h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200 select-none overflow-hidden relative border-r ${
              isLight
                ? 'text-slate-800 border-slate-200'
                : 'text-neutral-200 border-indigo-500/20'
            }`}
          >
            {/* Angel Backdrop Integration — Unified with app backdrop colors */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none">
              <img
                src={angelBackdropImg}
                alt=""
                aria-hidden="true"
                className={`w-[100vw] h-full max-w-none object-cover object-left select-none transition-opacity duration-500 ${
                  isLight
                    ? 'opacity-20 mix-blend-multiply filter contrast-125 saturate-110'
                    : 'opacity-70 mix-blend-screen filter brightness-105 contrast-125'
                }`}
              />
              <div
                className={`absolute inset-0 backdrop-blur-2xl ${
                  isLight ? 'bg-[#F4F6FC]/85' : 'bg-[#060813]/85'
                }`}
              />
            </div>

            {/* Drawer Top Header: Logo + Collapse Sidebar Icon */}
            <div
              className={`shrink-0 p-2 pb-1.5 space-y-1.5 border-b backdrop-blur-md ${
                isLight ? 'border-slate-100/80 bg-white/60' : 'border-indigo-500/15 bg-[#10172B]/75'
              }`}
            >
              <div className="flex items-center justify-between h-8 px-1">
                <div
                  onClick={() => {
                    handleNavClick('home');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <AngelLogo size={26} glow={true} />
                  <span className="font-calligraphy text-2xl tracking-wide select-none text-white">Angel</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Replaced cancel (x) button with collapse sidebar icon for mobiles */}
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Collapse sidebar"
                    title="Collapse sidebar"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <PanelLeftClose className="w-4 h-4 text-indigo-400" />
                  </button>
                </div>
              </div>

              {/* 1. New Conversation Button */}
              <button
                onClick={handleNewChat}
                className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-xl text-[11px] font-semibold tracking-tight transition-all duration-150 shadow-sm cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 text-slate-800 border border-slate-200'
                    : 'bg-[#182036] hover:bg-[#202b48] text-white border border-indigo-500/20 shadow-indigo-950/30'
                } px-2.5`}
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>New Conversation</span>
              </button>

              {/* 2. Search Option — Positioned in-between New Conversation and Home */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openCommandPalette('all');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 bg-slate-100/80 border border-slate-200/70'
                    : 'text-slate-300 hover:text-white bg-[#141B2E]/60 hover:bg-[#1C2540] border border-white/5 backdrop-blur-md'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Search</span>
                </div>
                <kbd
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    isLight ? 'bg-slate-200/80 text-slate-500' : 'bg-white/5 text-neutral-400 border border-white/10'
                  }`}
                >
                  Ctrl K
                </kbd>
              </button>

              {/* 3. Home Tool */}
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                  activeTab === 'home'
                    ? isLight
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'bg-[#1E2744] text-white font-semibold border border-indigo-400/30'
                    : isLight
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-slate-300 hover:text-white bg-[#141B2E]/60 hover:bg-[#1C2540] border border-white/5'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Home</span>
              </button>
            </div>

            {/* Drawer Middle: Scrollable Tools and Chats */}
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1.5 space-y-2 custom-scrollbar overscroll-contain">
              <div className="space-y-1">
                {scrollableTools.map((tool) => {
                  const isActive = tool.tabTarget ? activeTab === tool.tabTarget : false;
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        if (tool.onClickCustom) {
                          tool.onClickCustom();
                        } else if (tool.tabTarget) {
                          handleNavClick(tool.tabTarget);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                        isActive
                          ? isLight
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'bg-[#1E2744] text-white font-semibold border border-indigo-400/30'
                          : isLight
                          ? 'text-slate-600 hover:bg-slate-100'
                          : 'text-slate-300 hover:text-white bg-[#141B2E]/50 hover:bg-[#1C2540] border border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                        <span>{tool.label}</span>
                      </div>
                      {tool.badge && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-indigo-500/10 text-indigo-400">
                          {tool.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Conversations */}
              <div className="space-y-2 pt-1">
                {/* Pinned */}
                {pinnedConversations.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Pinned
                    </div>
                    <div className="space-y-0.5">
                      {pinnedConversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setActiveConversationId(conv.id);
                            setActiveTab('chat');
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2 px-2 py-1 rounded-md text-[11px] cursor-pointer ${
                            activeConversationId === conv.id && activeTab === 'chat'
                              ? isLight ? 'bg-indigo-50 text-indigo-800' : 'bg-[#151926] text-white'
                              : isLight ? 'text-slate-600' : 'text-neutral-400'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3 shrink-0 text-indigo-400" />
                          <span className="truncate">{conv.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1. Archived before Recent */}
                {archivedConversations.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Archived ({archivedConversations.length})
                    </div>
                    <div className="space-y-0.5">
                      {archivedConversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setActiveConversationId(conv.id);
                            setActiveTab('chat');
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-2 py-1 rounded-md text-[11px] cursor-pointer text-neutral-400"
                        >
                          <MessageSquare className="w-3 h-3 shrink-0 text-neutral-400" />
                          <span className="truncate">{conv.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Recent */}
                <div className="space-y-0.5">
                  <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Recent ({recentConversations.length})
                  </div>
                  <div className="space-y-0.5">
                    {(showAllRecentMobile ? recentConversations : recentConversations.slice(0, 5)).map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          setActiveTab('chat');
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md text-[11px] cursor-pointer ${
                          activeConversationId === conv.id && activeTab === 'chat'
                            ? isLight ? 'bg-indigo-50 text-indigo-800 font-semibold' : 'bg-[#151926] text-white font-semibold'
                            : isLight ? 'text-slate-600' : 'text-neutral-400'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3 shrink-0 text-neutral-400" />
                        <span className="truncate">{conv.title}</span>
                      </div>
                    ))}

                    {recentConversations.length > 5 && (
                      <button
                        onClick={() => setShowAllRecentMobile(!showAllRecentMobile)}
                        className={`w-full mt-0.5 py-0.5 px-2 rounded-md text-[10px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isLight ? 'text-indigo-600 hover:bg-slate-100' : 'text-indigo-400 hover:bg-neutral-800'
                        }`}
                      >
                        <span>{showAllRecentMobile ? 'See less' : `See more (${recentConversations.length - 5})`}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showAllRecentMobile ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Bottom: Fixed Quote & Profile */}
            <div
              className={`shrink-0 p-1.5 border-t space-y-1.5 select-none backdrop-blur-md ${
                isLight ? 'border-slate-100 bg-white/90' : 'border-indigo-500/15 bg-[#10172B]/90'
              }`}
            >
              <RandomQuoteCard compact />

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (!isSignedIn) setIsAuthPageOpen(true);
                  else setIsUserProfileMenuOpen(true);
                }}
                className={`w-full flex items-center justify-between p-1.5 rounded-xl transition-all ${
                  isLight
                    ? 'hover:bg-slate-100'
                    : 'hover:bg-[#1C2540] bg-[#141B2E]/60 border border-white/5 hover:border-indigo-500/20'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-semibold text-white text-[11px]">
                    {isSignedIn ? (userProfile.initials || 'DD') : 'GU'}
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-[11.5px] font-semibold block truncate">
                      {isSignedIn ? userProfile.name : 'Guest User'}
                    </span>
                    <span className="text-[9.5px] text-neutral-400 block truncate">
                      {isSignedIn ? userProfile.email : 'Click to sign in'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* User Profile Menu Modal */}
      <UserProfileMenu
        isOpen={isUserProfileMenuOpen}
        onClose={() => setIsUserProfileMenuOpen(false)}
        onOpenSettings={() => {
          setIsUserProfileMenuOpen(false);
          setActiveTab('settings');
        }}
      />

      {/* Chat Options Context Menu — with anchorPosition side popover */}
      {chatOptionsId && (
        <ChatOptionsMenu
          conversationId={chatOptionsId}
          isOpen={true}
          anchorPosition={chatOptionsAnchor}
          onClose={() => setChatOptionsId(null)}
          onOpenSecrets={() => setIsSecretsModalOpen(true)}
        />
      )}

      {/* Secrets Vault Modal */}
      <SecretsModal
        isOpen={isSecretsModalOpen}
        onClose={() => setIsSecretsModalOpen(false)}
      />
    </>
  );
};
