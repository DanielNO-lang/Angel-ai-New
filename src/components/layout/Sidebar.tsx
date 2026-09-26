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
  Search,
  Image as ImageIcon,
  Users,
  MoreHorizontal,
  Pin,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Sparkles,
  Quote,
  X,
  LogIn,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import { AngelLogo } from '../ui/AngelLogo';
import { WindowsShortcutBadge } from '../ui/WindowsShortcutBadge';
import { UserProfileMenu } from './UserProfileMenu';
import { ChatOptionsMenu } from '../chat/ChatOptionsMenu';
import { MoreToolsModal } from '../modals/MoreToolsModal';
import { SecretsModal } from '../modals/SecretsModal';

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
  const [isMoreToolsModalOpen, setIsMoreToolsModalOpen] = useState(false);
  const [moreToolsAnchor, setMoreToolsAnchor] = useState<{ top: number; left: number } | undefined>();
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);

  // Section collapsed toggles
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);

  // Conversations breakdown (strictly excluding secret chats)
  const pinnedConversations = conversations.filter((c) => c.pinned && !c.isArchived && !c.isSecret);
  const archivedConversations = conversations.filter((c) => c.isArchived && !c.isSecret);
  const recentConversations = conversations.filter((c) => !c.pinned && !c.isArchived && !c.isSecret);

  // Navigation tools
  const scrollableTools: Array<{
    id: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    tabTarget?: NavigationTab;
    onClickCustom?: () => void;
    badge?: string;
  }> = [
    { id: 'agent_lab', label: 'Agent Lab', icon: Bot, tabTarget: 'agent_lab' },
    { id: 'projects', label: 'Projects', icon: FolderGit2, tabTarget: 'projects' },
    { id: 'tasks', label: 'Schedule', icon: Calendar, tabTarget: 'tasks' },
    { id: 'memories', label: 'Memory', icon: Brain, tabTarget: 'memories' },
    { id: 'media_studio', label: 'Media Studios', icon: ImageIcon, tabTarget: 'media_studio' },
    { id: 'assistants', label: 'Assistants', icon: Users, tabTarget: 'assistants' },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setIsHoverExpanded(false);
  };

  const handleNewChat = () => {
    createConversation();
    setActiveTab('chat');
    setMobileMenuOpen(false);
    setIsHoverExpanded(false);
  };

  const handleSelectChat = (convId: string) => {
    setActiveConversationId(convId);
    setActiveTab('chat');
    setMobileMenuOpen(false);
    setIsHoverExpanded(false);
  };

  const handleMouseEnterRail = () => {
    if (ignoreHoverRef.current) return;
    if (!isSidebarCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHoverExpanded(true);
  };

  const handleMouseLeaveRail = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoverExpanded(false);
    }, 180);
  };

  return (
    <>
      {/* ========================================================
          DESKTOP PERSISTENT SIDEBAR
          ======================================================== */}
      {/* Placeholder in document flow so page width does not jump when hovered while collapsed */}
      {isSidebarCollapsed && (
        <div className="hidden md:block w-16 shrink-0 h-screen pointer-events-none" />
      )}

      {/* Persistent Desktop Sidebar with Full Hover-Expansion when Collapsed */}
      <motion.aside
        onMouseEnter={handleMouseEnterRail}
        onMouseLeave={handleMouseLeaveRail}
        layout
        animate={{ width: effectiveExpanded ? 256 : 64 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.72, layout: { type: 'spring', stiffness: 500, damping: 38, mass: 0.65 } }}
        style={{ willChange: 'width', transform: 'translateZ(0)' }}
        className={`hidden md:flex flex-col shrink-0 h-screen select-none overflow-hidden ${
          isSidebarCollapsed ? 'absolute left-0 top-0' : 'relative'
        } ${
          isHoverExpanded || !isSidebarCollapsed ? 'z-40 shadow-2xl' : 'z-30'
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

                {/* Top Actions: Search Icon next to collapse toggle button when expanded */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isSidebarCollapsed && (
                    <button
                      onClick={() => openCommandPalette('all')}
                      aria-label="Search workspace (Win + K)"
                      title="Search workspace (Win + K)"
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLight
                          ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  )}

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
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 transform-gpu hover:-translate-y-0.5 shadow-xs ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 hover:border-slate-300'
                : 'bg-[#141824] hover:bg-[#1C2132] text-white border border-white/5 hover:border-white/10'
            } ${!effectiveExpanded ? 'px-2' : 'px-3'}`}
          >
            <Plus className="w-4 h-4 text-indigo-500 shrink-0" />
            {effectiveExpanded && <span>New Conversation</span>}
          </button>

          {/* Standalone Search Trigger Icon:
              Transitions to a standalone icon when collapsed and persists this state during temporary mouse-over expansions */}
          {isSidebarCollapsed && (
            <button
              onClick={() => openCommandPalette('all')}
              title="Search workspace (Win + K)"
              aria-label="Search workspace (Win + K)"
              className={`w-full flex items-center justify-center py-2 rounded-xl text-xs font-medium transition-colors ${
                isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Search className="w-4 h-4 text-neutral-400 hover:text-indigo-400 transition-colors" />
            </button>
          )}

          {/* Home Tool — Fixed & Unscrollable */}
          <div className="pt-0.5">
            <button
              onClick={() => handleNavClick('home')}
              title={!effectiveExpanded ? 'Home' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'home'
                  ? isLight
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-[#151926] text-white font-semibold border border-white/5 shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
              } ${!effectiveExpanded ? 'justify-center px-2 py-2.5' : ''}`}
            >
              <Home
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'home'
                    ? 'text-indigo-500'
                    : isLight
                    ? 'text-slate-400'
                    : 'text-neutral-400'
                }`}
              />
              {effectiveExpanded && <span>Home</span>}
            </button>
          </div>
        </div>

        {/* ========================================================
            2. SCROLLABLE MIDDLE REGION
            With overscroll-contain preventing scroll chaining to right pane!
            Contains tools, chats, and More dropdown
            ======================================================== */}
        <motion.div layoutScroll className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-3 custom-scrollbar overscroll-contain">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'bg-[#151926] text-white font-semibold border border-white/5 shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                  } ${!effectiveExpanded ? 'justify-center px-2 py-2.5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-indigo-500'
                          : isLight
                          ? 'text-slate-400'
                          : 'text-neutral-400'
                      }`}
                    />
                    {effectiveExpanded && <span>{tool.label}</span>}
                  </div>
                  {effectiveExpanded && tool.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400">
                      {tool.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More Tools Trigger — Navigates to More page and opens popover by the side */}
            <button
              onClick={(e) => {
                handleNavClick('more');
                const rect = e.currentTarget.getBoundingClientRect();
                setMoreToolsAnchor({ top: rect.top, left: rect.right + 8 });
                setIsMoreToolsModalOpen(true);
              }}
              title={!effectiveExpanded ? 'More Tools' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'more'
                  ? isLight
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'bg-[#151926] text-white font-semibold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
              } ${!effectiveExpanded ? 'justify-center px-2 py-2.5' : ''}`}
            >
              <div className="flex items-center gap-3">
                <MoreHorizontal className={`w-4 h-4 shrink-0 ${activeTab === 'more' ? 'text-indigo-500' : 'text-neutral-400'}`} />
                {effectiveExpanded && <span>More</span>}
              </div>
              {effectiveExpanded && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </button>
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
                      <span className="text-[10px] font-mono opacity-60">
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
                  <span className="text-[10px] font-mono opacity-60">
                    {recentConversations.length}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {recentConversations.length === 0 ? (
                    <p className="text-xs text-neutral-500 px-2 py-1.5 italic">No recent chats.</p>
                  ) : (
                    recentConversations.map((conv) => {
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
                </div>
              </div>
            </div>
          )}

          {/* When Collapsed: Transform Conversation Sections into Standalone Icons */}
          {!effectiveExpanded && (
            <div className="space-y-2 pt-2 border-t border-inherit">
              {/* Pinned Section Icon */}
              {pinnedConversations.length > 0 && (
                <button
                  onClick={() => handleSelectChat(pinnedConversations[0].id)}
                  title={`Pinned Chats (${pinnedConversations.length})`}
                  className={`w-full flex items-center justify-center p-2 rounded-xl transition-all relative group ${
                    isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <Pin className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white text-[9px] font-mono flex items-center justify-center font-bold shadow-2xs">
                    {pinnedConversations.length}
                  </span>
                </button>
              )}

              {/* Recent Section Icon */}
              {recentConversations.length > 0 && (
                <button
                  onClick={() => handleSelectChat(recentConversations[0].id)}
                  title={`Recent Chats (${recentConversations.length})`}
                  className={`w-full flex items-center justify-center p-2 rounded-xl transition-all relative group ${
                    activeTab === 'chat'
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'bg-[#151926] text-white font-semibold'
                      : isLight
                      ? 'hover:bg-slate-100 text-slate-600'
                      : 'hover:bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-neutral-400 group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-neutral-700 text-white text-[9px] font-mono flex items-center justify-center font-bold shadow-2xs">
                    {recentConversations.length}
                  </span>
                </button>
              )}

              {/* Archived Section Icon */}
              {archivedConversations.length > 0 && (
                <button
                  onClick={() => handleSelectChat(archivedConversations[0].id)}
                  title={`Archived Chats (${archivedConversations.length})`}
                  className={`w-full flex items-center justify-center p-2 rounded-xl transition-all relative group ${
                    isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <Archive className="w-4 h-4 text-neutral-400 group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-neutral-700 text-white text-[9px] font-mono flex items-center justify-center font-bold shadow-2xs">
                    {archivedConversations.length}
                  </span>
                </button>
              )}
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
          {/* Fixed Quote Section */}
          {effectiveExpanded && (
            <div
              className={`p-3 rounded-xl transition-all duration-200 transform-gpu hover:-translate-y-0.5 shadow-2xs ${
                isLight
                  ? 'bg-slate-50 border border-slate-200/70 text-slate-700'
                  : 'bg-[#121620] border border-white/5 text-neutral-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5 opacity-70" />
                <div className="space-y-0.5">
                  <p className="italic text-[11px] leading-snug">
                    {isLight
                      ? '"Progress happens one small step at a time."'
                      : '"Small steps every day create big results."'}
                  </p>
                  <p
                    className={`text-[10px] font-medium ${
                      isLight ? 'text-slate-500' : 'text-neutral-400'
                    }`}
                  >
                    {isLight ? '— Unknown' : '— Angel'}
                  </p>
                </div>
              </div>
            </div>
          )}

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
      </aside>

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
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400">
                          {tool.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    handleNavClick('more');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === 'more'
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'bg-[#151926] text-white font-semibold'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-neutral-400 hover:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MoreHorizontal className={`w-4 h-4 shrink-0 ${activeTab === 'more' ? 'text-indigo-400' : 'text-neutral-400'}`} />
                    <span>More</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
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
                    {recentConversations.map((conv) => (
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
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span className="truncate">{conv.title}</span>
                      </div>
                    ))}
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
              <div
                className={`p-3 rounded-xl ${
                  isLight ? 'bg-slate-50 border border-slate-200 text-slate-700' : 'bg-[#121620] border border-white/5 text-neutral-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5 opacity-70" />
                  <p className="italic text-[11px] leading-snug">
                    "Small steps every day create big results."
                  </p>
                </div>
              </div>

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

      {/* More Tools Modal — with anchorPosition side popover */}
      <MoreToolsModal
        isOpen={isMoreToolsModalOpen}
        anchorPosition={moreToolsAnchor}
        onClose={() => setIsMoreToolsModalOpen(false)}
        onOpenSecrets={() => setIsSecretsModalOpen(true)}
        onOpenMediaStudio={() => {
          setActiveTab('media_studio');
          setIsMoreToolsModalOpen(false);
        }}
      />

      {/* Secrets Vault Modal */}
      <SecretsModal
        isOpen={isSecretsModalOpen}
        onClose={() => setIsSecretsModalOpen(false)}
      />
    </>
  );
};
