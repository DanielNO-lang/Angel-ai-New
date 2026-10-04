import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, FolderGit2, Home, BookOpen, MessageSquare, MoreHorizontal, SquarePen, Search, Image as ImageIcon, Users, Calendar, PanelLeftClose, ChevronDown, ChevronRight } from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import { AngelLogo } from '../ui/AngelLogo';
import { WindowsShortcutBadge } from '../ui/WindowsShortcutBadge';
import { UserProfileMenu } from './UserProfileMenu';
import { ChatOptionsMenu } from '../chat/ChatOptionsMenu';

const signedInTools = [
  { id: 'agent_lab', label: 'Agent Lab', icon: Bot, tab: 'agent_lab' as NavigationTab },
  { id: 'projects', label: 'Projects', icon: FolderGit2, tab: 'projects' as NavigationTab },
  { id: 'schedule', label: 'Schedule', icon: Calendar, tab: 'tasks' as NavigationTab },
  { id: 'library', label: 'Library', icon: BookOpen, tab: 'library' as NavigationTab },
  { id: 'media_studio', label: 'Media Studio', icon: ImageIcon, tab: 'media_studio' as NavigationTab },
  { id: 'assistants', label: 'Assistants', icon: Users, tab: 'assistants' as NavigationTab },
];

const guestTools = [
  { id: 'media_studio', label: 'Media Studio', icon: ImageIcon, tab: 'media_studio' as NavigationTab },
];

export const SidebarCanonical: React.FC = () => {
  const { activeTab, setActiveTab, isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, setMobileMenuOpen, conversations, activeConversationId, setActiveConversationId, createConversation, openCommandPalette, userProfile, settings, isSignedIn, setIsAuthPageOpen, isFocusMode, isAgentProcessing } = useAngel();
  const isLight = settings.theme === 'light';
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOptionsId, setChatOptionsId] = useState<string | null>(null);
  const [chatOptionsAnchor, setChatOptionsAnchor] = useState<{ top: number; left: number }>();
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const hoverLock = useRef(false);
  const expanded = !isSidebarCollapsed || hoverExpanded;

  const pinned = conversations.filter((c) => c.pinned && !c.isArchived && !c.isSecret);
  const archived = conversations.filter((c) => c.isArchived && !c.isSecret);
  const recent = conversations.filter((c) => !c.pinned && !c.isArchived && !c.isSecret);
  const tools = isSignedIn ? signedInTools : guestTools;

  const navigate = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setHoverExpanded(false);
    requestAnimationFrame(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    });
  };

  const newChat = () => {
    createConversation();
    navigate('chat');
  };

  const chatRow = (conversation: typeof conversations[number]) => (
    <div key={conversation.id} onClick={() => { setActiveConversationId(conversation.id); navigate('chat'); }} className={`group flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${activeConversationId === conversation.id && activeTab === 'chat' ? (isLight ? 'bg-indigo-50 text-indigo-800 font-medium' : 'bg-[#151926] text-white font-medium') : (isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200')}`}>
      <div className="flex items-center gap-2 min-w-0"><MessageSquare className="w-3.5 h-3.5 shrink-0 text-indigo-400" /><span className="truncate">{conversation.title}</span></div>
      <button type="button" aria-label="Chat options" onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setChatOptionsAnchor({ top: r.top, left: r.right + 8 }); setChatOptionsId(conversation.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800/50"><MoreHorizontal className="w-3 h-3" /></button>
    </div>
  );

  const shell = (
    <motion.aside onMouseEnter={() => !hoverLock.current && isSidebarCollapsed && setHoverExpanded(true)} onMouseLeave={() => setHoverExpanded(false)} initial={false} animate={{ width: expanded ? 256 : 64 }} transition={{ type: 'tween', duration: 0.11, ease: 'easeOut' }} className={`flex flex-col h-screen shrink-0 select-none overflow-hidden border-r ${isLight ? 'bg-white border-slate-200/80 text-slate-800' : 'bg-[#0B0E14] border-white/5 text-neutral-200'}`}>
      <div className="shrink-0 p-3 pb-2 space-y-2">
        <div className="h-9 flex items-center justify-between px-1">
          {!expanded ? <button type="button" onClick={toggleSidebar} className="w-10 h-10 -ml-1 rounded-xl flex items-center justify-center hover:bg-white/5" title="Open sidebar"><AngelLogo size={26} glow /></button> : <>
            <button type="button" onClick={() => navigate('home')} className="flex items-center gap-2.5 min-w-0"><AngelLogo size={28} glow /><span className={`font-semibold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>Angel</span></button>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => openCommandPalette('all')} className="p-1.5 rounded-lg text-neutral-400 hover:bg-white/5" title="Search"><Search className="w-4 h-4" /></button>
              <button type="button" onClick={() => { hoverLock.current = true; setHoverExpanded(false); toggleSidebar(); window.setTimeout(() => (hoverLock.current = false), 300); }} className="p-1.5 rounded-lg text-neutral-400 hover:bg-white/5" title="Collapse sidebar"><PanelLeftClose className="w-4 h-4" /></button>
            </div>
          </>}
        </div>
        <button type="button" onClick={newChat} className={`flex items-center rounded-xl text-xs font-semibold transition-all ${expanded ? 'w-full px-3 py-2 gap-3' : 'w-10 h-10 mx-auto justify-center'} ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-[#141824] hover:bg-[#1C2132] text-white'}`} title="New Conversation"><SquarePen className="w-4 h-4 text-indigo-500" />{expanded && <span>New Conversation</span>}</button>
        <button type="button" onClick={() => openCommandPalette('all')} className={`flex items-center rounded-xl text-xs ${expanded ? 'w-full px-3 py-2 gap-3' : 'w-10 h-10 mx-auto justify-center'} ${isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-500' : 'bg-[#121622] hover:bg-[#161B2A] text-neutral-400'}`} title="Search workspace"><Search className="w-4 h-4" />{expanded && <><span className="truncate">Search...</span><span className="ml-auto"><WindowsShortcutBadge shortcut="K" /></span></>}</button>
        <button type="button" onClick={() => navigate('home')} className={`flex items-center rounded-xl text-xs font-medium ${expanded ? 'w-full px-3 py-2 gap-3' : 'w-10 h-10 mx-auto justify-center'} ${activeTab === 'home' ? (isLight ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-[#151926] text-white font-semibold') : (isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-900/50')}`} title="Home"><Home className="w-4 h-4" />{expanded && <span>Home</span>}</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-3 custom-scrollbar overscroll-contain">
        <div className="space-y-0.5">
          {tools.map((tool) => { const Icon = tool.icon; const active = activeTab === tool.tab || (tool.id === 'schedule' && activeTab === 'schedule'); return <button key={tool.id} type="button" onClick={() => navigate(tool.tab)} className={`flex items-center rounded-xl text-xs font-medium ${expanded ? 'w-full px-3 py-2 gap-3' : 'w-10 h-10 mx-auto justify-center'} ${active ? (isLight ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-[#151926] text-white font-semibold') : (isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-900/50')}`} title={tool.label}><span className="relative"><Icon className="w-4 h-4" />{tool.id === 'agent_lab' && isAgentProcessing && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}</span>{expanded && <span className="truncate">{tool.label}</span>}</button>; })}
          <button type="button" onClick={() => navigate('more')} className={`flex items-center rounded-xl text-xs font-medium ${expanded ? 'w-full px-3 py-2 gap-3' : 'w-10 h-10 mx-auto justify-center'} ${activeTab === 'more' ? (isLight ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-[#151926] text-white font-semibold') : (isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-900/50')}`} title="More"><MoreHorizontal className="w-4 h-4" />{expanded && <><span>More</span><ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" /></>}</button>
        </div>

        <div className="pt-2 border-t border-black/5 dark:border-white/5">
          {expanded && pinned.length > 0 && <div className="mb-3"><button type="button" onClick={() => setPinnedOpen((v) => !v)} className="w-full flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"><span>Pinned</span><ChevronDown className={`w-3 h-3 ${pinnedOpen ? '' : '-rotate-90'}`} /></button>{pinnedOpen && <div className="mt-1 space-y-0.5">{pinned.map(chatRow)}</div>}</div>}
          {expanded && archived.length > 0 && <div className="mb-3"><button type="button" onClick={() => setArchivedOpen((v) => !v)} className="w-full flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"><span>Archived</span><ChevronDown className={`w-3 h-3 ${archivedOpen ? '' : '-rotate-90'}`} /></button>{archivedOpen && <div className="mt-1 space-y-0.5">{archived.map(chatRow)}</div>}</div>}
          {expanded && <div><div className="flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"><span>Recent</span><span className="text-[10px] font-mono opacity-60">{recent.length}</span></div><div className="mt-1 space-y-0.5">{recent.length ? recent.map(chatRow) : <p className="px-2 py-1.5 text-xs text-neutral-500 italic">No recent chats.</p>}</div></div>}
        </div>
      </div>

      <div className="shrink-0 p-2.5 border-t border-black/5 dark:border-white/5">
        <button type="button" onClick={() => isSignedIn ? setProfileOpen(true) : setIsAuthPageOpen(true)} className={`w-full flex items-center gap-3 p-1.5 rounded-xl ${expanded ? 'justify-between' : 'justify-center'} ${isLight ? 'hover:bg-slate-100' : 'hover:bg-neutral-900'}`} title={isSignedIn ? 'Profile & settings' : 'Sign in / Sign up'}>
          <div className="flex items-center gap-2.5 min-w-0"><div className="relative shrink-0"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-semibold text-white text-xs">{isSignedIn ? (userProfile.initials || 'U') : 'G'}</div><span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isLight ? 'border-white' : 'border-[#0B0E14]'} ${isSignedIn && userProfile.status === 'online' ? 'bg-emerald-500' : 'bg-neutral-400'}`} /></div>{expanded && <div className="min-w-0 text-left"><div className="flex items-center gap-1.5"><span className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{isSignedIn ? userProfile.name : 'Guest'}</span><span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{isSignedIn ? userProfile.plan : 'Free'}</span></div><span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{isSignedIn ? 'Account' : 'Sign in / Sign up'}</span></div>}</div>
          {expanded && <ChevronRight className="w-4 h-4 text-neutral-400" />}
        </button>
      </div>
    </motion.aside>
  );

  if (isFocusMode) return null;
  return <>
    <div className="hidden md:block shrink-0 w-16 h-screen" aria-hidden="true" />
    <div className="hidden md:block fixed left-0 top-0 z-50 h-screen">{shell}</div>
    {isMobileMenuOpen && <div className="fixed inset-0 z-50 md:hidden"><button type="button" aria-label="Close sidebar" className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} /><div className="absolute inset-y-0 left-0 w-[min(88vw,340px)] shadow-2xl">{shell}</div></div>}
    <UserProfileMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    {chatOptionsId && <ChatOptionsMenu conversationId={chatOptionsId} isOpen={true} onClose={() => setChatOptionsId(null)} anchorPosition={chatOptionsAnchor} />}
  </>;
};
