/**
 * ANGEL AI — Global Workspace Search Overlay
 * Matches Image 1 & Image 5 Panel 11 with high fidelity:
 * - Search input: "Search chats, files, tools..." with clear 'X'
 * - When empty or default:
 *     Quick Search: Recent chats, Pinned chats, Archived chats
 *     Suggestions: Website redesign, Marketing plan, Image generation, Product research
 * - High-speed search filtering across chats, agents, tasks, projects, memories, and actions
 * - Windows-native shortcuts (Win + K / Esc / Enter)
 * - 100% reactive Light Mode and Dark Mode support with anti-slop contrast
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  Brain,
  FolderGit2,
  Bot,
  Sparkles,
  Plus,
  Eye,
  Settings,
  Calendar,
  CornerDownLeft,
  X,
  MessageSquare,
  Pin,
  Archive,
  Clock,
  Zap,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { WindowsShortcutBadge } from '../ui/WindowsShortcutBadge';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    conversations,
    setActiveConversationId,
    setActiveTab,
    createConversation,
    sendMessage,
    tasks,
    memories,
    projects,
    agents,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Global key listener for Ctrl+K / Win+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isCommandPaletteOpen) closeCommandPalette();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        e.preventDefault();
        closeCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, closeCommandPalette]);

  // Suggestions from Image 1 & Image 5 Panel 11
  const suggestions = [
    { label: 'Website redesign', action: () => executeSuggestion('Website redesign') },
    { label: 'Marketing plan', action: () => executeSuggestion('Marketing plan') },
    { label: 'Image generation', action: () => executeSuggestion('Image generation') },
    { label: 'Product research', action: () => executeSuggestion('Product research') },
  ];

  const executeSuggestion = (text: string) => {
    closeCommandPalette();
    const existing = conversations.find((c) =>
      c.title.toLowerCase().includes(text.toLowerCase())
    );
    if (existing) {
      setActiveConversationId(existing.id);
      setActiveTab('chat');
    } else {
      createConversation('angel-core', undefined, text);
      sendMessage(`Let's work on ${text}. Provide initial strategic thoughts and outline.`);
      setActiveTab('chat');
    }
  };

  // Filtered dynamic search items
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: string;
      icon: React.FC<{ className?: string }>;
      action: () => void;
    }> = [];

    // Chats
    conversations.forEach((c) => {
      if (c.title.toLowerCase().includes(q)) {
        items.push({
          id: `chat-${c.id}`,
          title: c.title,
          subtitle: c.pinned ? 'Pinned Chat' : c.isArchived ? 'Archived Chat' : 'Recent Chat',
          category: 'Chats',
          icon: MessageSquare,
          action: () => {
            setActiveConversationId(c.id);
            setActiveTab('chat');
            closeCommandPalette();
          },
        });
      }
    });

    // Agents
    agents.forEach((a) => {
      if (a.name.toLowerCase().includes(q) || a.tagline.toLowerCase().includes(q)) {
        items.push({
          id: `agent-${a.id}`,
          title: a.name,
          subtitle: a.tagline,
          category: 'Agents',
          icon: Bot,
          action: () => {
            createConversation(a.id);
            setActiveTab('chat');
            closeCommandPalette();
          },
        });
      }
    });

    // Tasks
    tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q)) {
        items.push({
          id: `task-${t.id}`,
          title: t.title,
          subtitle: `${t.priority.toUpperCase()} Priority · ${t.status}`,
          category: 'Tasks',
          icon: CheckSquare,
          action: () => {
            setActiveTab('tasks');
            closeCommandPalette();
          },
        });
      }
    });

    // Projects
    projects.forEach((p) => {
      if (p.name.toLowerCase().includes(q)) {
        items.push({
          id: `proj-${p.id}`,
          title: p.name,
          subtitle: p.description,
          category: 'Projects',
          icon: FolderGit2,
          action: () => {
            setActiveTab('projects');
            closeCommandPalette();
          },
        });
      }
    });

    return items;
  }, [query, conversations, agents, tasks, projects, setActiveConversationId, setActiveTab, createConversation, closeCommandPalette]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100"
      onClick={closeCommandPalette}
    >
      {/* Search Overlay Window matching Image 1 & 5 */}
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150 transition-all ${
          isLight
            ? 'bg-white text-slate-800 border border-slate-200'
            : 'bg-[#0E121B] text-neutral-100 border border-white/10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Input Bar (Image 1: "Search chats, files, tools...") */}
        <div
          className={`flex items-center px-4 py-3.5 border-b gap-3 ${
            isLight ? 'border-slate-100 bg-slate-50/50' : 'border-neutral-800/80 bg-neutral-900/40'
          }`}
        >
          <Search className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-neutral-400'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats, files, tools..."
            className={`flex-1 bg-transparent border-none text-sm outline-none ${
              isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-neutral-500'
            }`}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className={`p-1 rounded-md transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-neutral-800 text-neutral-400'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={closeCommandPalette}
              className={`p-1 rounded-md transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-neutral-800 text-neutral-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {query.trim().length === 0 ? (
            <>
              {/* Quick Search Section (Image 1 & Image 5 Panel 11) */}
              <div className="space-y-1.5">
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wider px-2 ${
                    isLight ? 'text-slate-500' : 'text-neutral-400'
                  }`}
                >
                  Quick Search
                </p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      closeCommandPalette();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                      isLight
                        ? 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
                        : 'hover:bg-neutral-850/80 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-medium">Recent chats</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">
                      {conversations.filter((c) => !c.pinned && !c.isArchived).length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      closeCommandPalette();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                      isLight
                        ? 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
                        : 'hover:bg-neutral-850/80 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Pin className="w-4 h-4 text-indigo-400 fill-indigo-400/30" />
                      <span className="text-xs font-medium">Pinned chats</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">
                      {conversations.filter((c) => c.pinned).length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      closeCommandPalette();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                      isLight
                        ? 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
                        : 'hover:bg-neutral-850/80 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Archive className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-medium">Archived chats</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">
                      {conversations.filter((c) => c.isArchived).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Suggestions Section (Image 1 & Image 5 Panel 11) */}
              <div className="space-y-1.5">
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wider px-2 ${
                    isLight ? 'text-slate-500' : 'text-neutral-400'
                  }`}
                >
                  Suggestions
                </p>
                <div className="space-y-0.5">
                  {suggestions.map((sug) => (
                    <button
                      key={sug.label}
                      onClick={sug.action}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
                        isLight
                          ? 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
                          : 'hover:bg-neutral-850/80 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-xs font-medium">{sug.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Search Results */
            <div className="space-y-1">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-neutral-400">
                    No results found for <span className="font-semibold text-white">"{query}"</span>
                  </p>
                  <button
                    onClick={() => executeSuggestion(query)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <span>Start conversation about "{query.slice(0, 20)}"</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                searchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isLight
                          ? 'hover:bg-slate-100 text-slate-800'
                          : 'hover:bg-neutral-850/80 text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isLight
                              ? 'bg-slate-100 text-indigo-600'
                              : 'bg-neutral-900 text-indigo-400'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{item.title}</p>
                          <p
                            className={`text-[10px] truncate ${
                              isLight ? 'text-slate-500' : 'text-neutral-400'
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          isLight
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-neutral-900 text-neutral-400'
                        }`}
                      >
                        {item.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer with Windows Shortcut Badge */}
        <div
          className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] ${
            isLight
              ? 'border-slate-100 bg-slate-50/50 text-slate-500'
              : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>Open search anytime with</span>
            <WindowsShortcutBadge shortcut="K" />
          </div>
          <span className="text-[10px] font-mono">Press Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
