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
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import { AngelLogo } from '../ui/AngelLogo';
import { WindowsShortcutBadge } from '../ui/WindowsShortcutBadge';
import { UserProfileMenu } from './UserProfileMenu';
import { ChatOptionsMenu } from '../chat/ChatOptionsMenu';
import { SecretsModal } from '../modals/SecretsModal';
import { RandomQuoteCard } from '../ui/RandomQuoteCard';

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
    ignoreHoverRef.current = true;
    setIsHoverExpanded(false);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!isSidebarCollapsed) {
      toggleSidebar();
    }
    setTimeout(() => {
      ignoreHoverRef.current = false;
    }, 350);
  };

  const handleExpandSidebarPermanently = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHoverExpanded(false);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
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

  // Rescheduled sidebar arrangement (strictly per user's prompt):
  // 1. Home (fixed at top)
  // 2. Agent Lab
  // 3. Projects
  // 4. Library
  // 5. Schedule
  // 6. Media Studios
  // 7. More
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

  // Guest sidebar arrangement:
  // - Hide 'Agent Lab' for guests
  // - Ensure 'Media Studios' and 'Library' are available, forced to the top after 'Home'
  // - Projects & Schedule follow, redirecting to sign-in
  // - More is discarded
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

  const scrollableTools = isSignedIn ? signedInTools : guestTools;

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
    if (ignoreHoverRef.current) return;
    if (!isSidebarCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHoverExpanded(true);
  };

  const handleMouseLeaveRail = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHoverExpanded(false);
  };

  if (isFocusMode) {
    return null;
  }

  return (
    <>
      {/* ========================================================
          DESKTOP PERSISTENT SIDEBAR
          ======================================================== */}
      {/* Placeholder in document flow so page width does not jump when hovered while collapsed */}
      {isSidebarCollapsed && (
        <div className="hidden md:block w-16 shrink-0 h-screen pointer-events-none" />
      )}

      {/* Persistent Desktop Sidebar with Instant Hover-Expansion */}
      <motion.aside
        onMouseEnter={handleMouseEnterRail}
        onMouseLeave={handleMouseLeaveRail}
        initial={false}
        animate={{ width: effectiveExpanded ? 256 : 64 }}
        transition={{
          type: 'tween',
          duration: 0.09,
          ease: 'easeOut',
        }}
        style={{ willChange: 'width', transform: 'translateZ(0)' }}
        className={`hidden md:flex flex-col shrink-0 h-screen select-none overflow-x-hidden overflow-y-hidden ${
          isSidebarCollapsed ? 'fixed left-0 top-0 z-50 shadow-2xl' : 'relative z-30'
        } border-r ${
          isLight
            ? 'bg-white border-slate-200/90 text-slate-800 shadow-slate-300/40'
            : 'bg-[#0B0E14] border-white/5 text-neutral-200 shadow-black/80'
        }`}
      >
        {/* ========================================================
            1. FIXED (UNSCROLLABLE) TOP REGION
            From Angel Logo down through Home tool
            ======================================================== */}
        <div
          className={`shrink-0 p-3 pb-2 space-y-2 border-b ${
            isLight ? 'border-slate-100 bg-white' : 'border-white/5 bg-[#0B0E14]'
          }`}
        >
          {/* Logo & Collapse / Pin Toggle */}
          <div className="flex items-center justify-between h-9 px-1">
            {!effectiveExpanded ? (
              /* Collapsed: Angel Logo is ALWAYS shown at this position, never replaced by expand icon */
              <div
                onClick={handleExpandSidebarPermanently}
                className={`w-10 h-10 -ml-1 rounded-xl flex items-center justify-center cursor-pointer transition-colors group relative ${
                  isLight ? 'hover:bg-slate-100' : 'hover:bg-neutral-900'
                }`}
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <AngelLogo size={26} glow={true} />
              </div>
            ) : (
              /* Expanded: Angel Logo + Text + Collapse / Expand Button */
              <>
                <div
                  onClick={() => handleNavClick('home')}
                  className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                >
                  <AngelLogo size={28} glow={true} />
                  <span
                    className={`font-semibold tracking-tight text-base transition-colors ${
                      isLight
                        ? 'text-slate-900 group-hover:text-indigo-600'
                        : 'text-white group-hover:text-indigo-300'
                    }`}
                  >
                    Angel
                  </span>
                </div>

                {/* Top Actions: Collapse toggle button */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={isSidebarCollapsed ? handleExpandSidebarPermanently : handleCollapseSidebar}
                    aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isLight
                        ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                    title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {isSidebarCollapsed ? (
                      <PanelLeftOpen className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4" />
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
            className={`flex items-center rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 transform-gpu hover:-translate-y-0.5 shadow-xs cursor-pointer ${
              !effectiveExpanded
                ? 'w-10 h-10 mx-auto justify-center p-0'
                : 'w-full px-3 py-2'
            } ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 hover:border-slate-300'
                : 'bg-[#141824] hover:bg-[#1C2132] text-white border border-white/5 hover:border-white/10'
            }`}
          >
            <div className={`flex items-center min-w-0 ${!effectiveExpanded ? 'justify-center' : 'gap-3'}`}>
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                <SquarePen className="w-4 h-4 text-indigo-500 shrink-0" />
              </div>
              {effectiveExpanded && <span className="truncate">New Conversation</span>}
            </div>
          </button>

          {/* Search Trigger: Search bar when hovering / expanded, standalone icon when collapsed */}
          {!effectiveExpanded ? (
            <button
              onClick={() => openCommandPalette('all')}
              title="Search workspace (Win + K)"
              aria-label="Search workspace (Win + K)"
              className={`w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${
                isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                <Search className="w-4 h-4 text-neutral-400 hover:text-indigo-400 transition-colors" />
              </div>
            </button>
          ) : (
            <div
              onClick={() => openCommandPalette('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs cursor-pointer transition-colors shadow-2xs ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-500'
                  : 'bg-[#121622] hover:bg-[#161B2A] border-white/5 text-neutral-400'
              }`}
              title="Search workspace (Win + K)"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  <Search className="w-4 h-4 text-indigo-400 shrink-0" />
                </div>
                <span className="truncate text-xs">Search...</span>
              </div>
              <WindowsShortcutBadge shortcut="K" />
            </div>
          )}

          {/* Home Tool — Fixed & Unscrollable */}
          <div className="pt-0.5">
            <button
              onClick={() => handleNavClick('home')}
              title={!effectiveExpanded ? 'Home' : undefined}
              className={`flex items-center rounded-xl text-xs font-medium transition-colors ${
                !effectiveExpanded
                  ? 'w-10 h-10 mx-auto justify-center p-0'
                  : 'w-full px-3 py-2'
              } ${
                activeTab === 'home'
                  ? isLight
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-[#151926] text-white font-semibold border border-white/5 shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
              }`}
            >
              <div className={`flex items-center min-w-0 ${!effectiveExpanded ? 'justify-center' : 'gap-3'}`}>
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  <Home
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'home'
                        ? 'text-indigo-500'
                        : isLight
                        ? 'text-slate-400'
                        : 'text-neutral-400'
                    }`}
                  />
                </div>
                {effectiveExpanded && <span className="truncate">Home</span>}
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================
            2. SCROLLABLE MIDDLE REGION
            With overscroll-contain preventing scroll chaining to right pane!
            Contains tools, chats, and More dropdown
            ======================================================== */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-3 custom-scrollbar overscroll-contain">
          {/* Main Navigation Tools */}
          <div className="space-y-0.5">
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
                  className={`flex items-center rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    !effectiveExpanded
                      ? 'w-10 h-10 mx-auto justify-center p-0'
                      : 'w-full justify-between px-3 py-2'
                  } ${
                    isActive
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'bg-[#151926] text-white font-semibold border border-white/5 shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                  }`}
                >
                  <div className={`flex items-center min-w-0 ${!effectiveExpanded ? 'justify-center' : 'gap-3'}`}>
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center relative">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-indigo-500'
                            : isLight
                            ? 'text-slate-400'
                            : 'text-neutral-400'
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
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  )}
                  {effectiveExpanded && (!isAgentProcessing || tool.id !== 'agent_lab') && tool.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400">
                      {tool.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* When collapsed without hovering, display 1 single Chat icon consolidating Recent, Pinned, and Archive */}
            {!effectiveExpanded && (
              <div className="pt-1.5 mt-1 border-t border-inherit/40 flex justify-center">
                <button
                  onClick={() => handleNavClick('chat')}
                  title="Chats"
                  aria-label="Chats"
                  className={`w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-xs font-medium transition-colors cursor-pointer relative group ${
                    activeTab === 'chat'
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'bg-[#151926] text-white font-semibold border border-white/5 shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                  }`}
                >
                  <MessageSquare
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      activeTab === 'chat'
                        ? 'text-indigo-500'
                        : isLight
                        ? 'text-slate-400 group-hover:text-indigo-600'
                        : 'text-neutral-400 group-hover:text-indigo-400'
                    }`}
                  />
                  {conversations.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-[#0B0E14]" />
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
                    className={`w-full flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider ${
                      isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-neutral-200'
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
                                  : 'bg-[#151926] text-white font-medium'
                                : isLight
                                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
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
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800/40 transition-opacity"
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
                <div className="space-y-1">
                  <button
                    onClick={() => setIsArchivedExpanded(!isArchivedExpanded)}
                    className={`w-full flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider ${
                      isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span>Archived</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium opacity-60">
                        {archivedConversations.length}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${isArchivedExpanded ? '' : '-rotate-90'}`}
                      />
                    </div>
                  </button>

                  {isArchivedExpanded && (
                    <div className="space-y-0.5">
                      {archivedConversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectChat(conv.id)}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isLight
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-400 group-hover:text-indigo-400" />
                            <span className="truncate">{conv.title}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setChatOptionsAnchor({ top: rect.top, left: rect.right + 8 });
                              setChatOptionsId(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white"
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
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isLight ? 'text-slate-400' : 'text-neutral-400'
                    }`}
                  >
                    Recent
                  </span>
                  <span className="text-[10px] font-medium opacity-60">
                    {recentConversations.length}
                  </span>
                </div>

                  <div className="space-y-0.5">
                  {recentConversations.length === 0 ? (
                    <p className="text-xs text-neutral-500 px-2 py-1.5 italic">No recent chats.</p>
                  ) : (
                    (showAllRecent ? recentConversations : recentConversations.slice(0, 5)).map((conv) => {
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
                                : 'bg-[#151926] text-white font-medium'
                              : isLight
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-400 group-hover:text-indigo-400" />
                            <span className="truncate">{conv.title}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setChatOptionsAnchor({ top: rect.top, left: rect.right + 8 });
                              setChatOptionsId(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800/40 transition-opacity"
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
                      className={`w-full mt-1 py-1 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isLight
                          ? 'text-indigo-600 hover:bg-indigo-50/70'
                          : 'text-indigo-400 hover:bg-neutral-800/60'
                      }`}
                    >
                      <span>{showAllRecent ? 'See less' : `See more (${recentConversations.length - 5})`}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${showAllRecent ? 'rotate-180' : ''}`}
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
          className={`shrink-0 p-2.5 border-t space-y-2 select-none ${
            isLight ? 'border-slate-100 bg-white' : 'border-white/5 bg-[#0B0E14]'
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
            className={`w-full flex items-center gap-3 p-1.5 rounded-xl transition-colors group ${
              !effectiveExpanded ? 'justify-center p-1' : 'justify-between'
            } ${isLight ? 'hover:bg-slate-100' : 'hover:bg-neutral-900'}`}
            title={isSignedIn ? 'User Profile & Settings' : 'Sign in to Angel'}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-semibold text-white text-xs shadow-xs">
                  {isSignedIn ? (userProfile.initials || 'DD') : 'GU'}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
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
                      className={`text-xs font-semibold truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {isSignedIn ? userProfile.name : 'Guest User'}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {isSignedIn ? userProfile.plan : 'Free'}
                    </span>
                  </div>
                  <p
                    className={`text-[10px] truncate ${
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
                className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                  isLight ? 'text-slate-400' : 'text-neutral-400'
                }`}
              />
            )}
          </button>
        </div>
      </motion.aside>

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
            className={`fixed inset-y-0 left-0 w-72 sm:w-80 flex flex-col h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200 select-none ${
              isLight
                ? 'bg-white text-slate-800 border-r border-slate-200'
                : 'bg-[#0B0E14] text-neutral-200 border-r border-white/10'
            }`}
          >
            {/* Drawer Top Header: Logo + Close Button */}
            <div
              className={`shrink-0 p-3 pb-2 space-y-2 border-b ${
                isLight ? 'border-slate-100 bg-white' : 'border-white/5 bg-[#0B0E14]'
              }`}
            >
              <div className="flex items-center justify-between h-9 px-1">
                <div
                  onClick={() => handleNavClick('home')}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <AngelLogo size={28} glow={true} />
                  <span className="font-semibold text-base tracking-tight">Angel</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openCommandPalette('all');
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                    title="Search workspace (Win + K)"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-900'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* New Conversation Button */}
              <button
                onClick={handleNewChat}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 shadow-xs ${
                  isLight
                    ? 'bg-slate-100 text-slate-800 border border-slate-200'
                    : 'bg-[#141824] text-white border border-white/5'
                } px-3`}
              >
                <Plus className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>New Conversation</span>
              </button>

              {/* Home Tool */}
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'home'
                    ? isLight
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'bg-[#151926] text-white font-semibold border border-white/5'
                    : isLight
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-neutral-400 hover:bg-neutral-900/50'
                }`}
              >
                <Home className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Home</span>
              </button>
            </div>

            {/* Drawer Middle: Scrollable Tools and Chats */}
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-3 custom-scrollbar overscroll-contain">
              <div className="space-y-0.5">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? isLight
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'bg-[#151926] text-white font-semibold'
                          : isLight
                          ? 'text-slate-600 hover:bg-slate-100'
                          : 'text-neutral-400 hover:bg-neutral-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0 text-indigo-400" />
                        <span>{tool.label}</span>
                      </div>
                      {tool.badge && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400">
                          {tool.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Conversations */}
              <div className="space-y-3 pt-1">
                {/* Pinned */}
                {pinnedConversations.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
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
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer ${
                            activeConversationId === conv.id && activeTab === 'chat'
                              ? isLight ? 'bg-indigo-50 text-indigo-800' : 'bg-[#151926] text-white'
                              : isLight ? 'text-slate-600' : 'text-neutral-400'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                          <span className="truncate">{conv.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1. Archived before Recent */}
                {archivedConversations.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
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
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer text-neutral-400"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                          <span className="truncate">{conv.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Recent */}
                <div className="space-y-1">
                  <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
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
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer ${
                          activeConversationId === conv.id && activeTab === 'chat'
                            ? isLight ? 'bg-indigo-50 text-indigo-800 font-semibold' : 'bg-[#151926] text-white font-semibold'
                            : isLight ? 'text-slate-600' : 'text-neutral-400'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span className="truncate">{conv.title}</span>
                      </div>
                    ))}

                    {recentConversations.length > 5 && (
                      <button
                        onClick={() => setShowAllRecentMobile(!showAllRecentMobile)}
                        className={`w-full mt-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isLight ? 'text-indigo-600 hover:bg-slate-100' : 'text-indigo-400 hover:bg-neutral-800'
                        }`}
                      >
                        <span>{showAllRecentMobile ? 'See less' : `See more (${recentConversations.length - 5})`}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllRecentMobile ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Bottom: Fixed Quote & Profile */}
            <div
              className={`shrink-0 p-2.5 border-t space-y-2 select-none ${
                isLight ? 'border-slate-100 bg-white' : 'border-white/5 bg-[#0B0E14]'
              }`}
            >
              <RandomQuoteCard compact />

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (!isSignedIn) setIsAuthPageOpen(true);
                  else setIsUserProfileMenuOpen(true);
                }}
                className={`w-full flex items-center justify-between p-1.5 rounded-xl transition-colors ${
                  isLight ? 'hover:bg-slate-100' : 'hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-semibold text-white text-xs">
                    {isSignedIn ? (userProfile.initials || 'DD') : 'GU'}
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-xs font-semibold block truncate">
                      {isSignedIn ? userProfile.name : 'Guest User'}
                    </span>
                    <span className="text-[10px] text-neutral-400 block truncate">
                      {isSignedIn ? userProfile.email : 'Click to sign in'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
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
