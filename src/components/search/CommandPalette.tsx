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
  Mic,
  MicOff,
  Pin,
  Archive,
  Clock,
  Zap,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { WindowsShortcutBadge } from '../ui/WindowsShortcutBadge';
import { useVoiceDictation } from '../../services/voice/useVoiceDictation';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    conversations,
    setActiveConversationId,
    activeTab,
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
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tasks' | 'memories' | 'chats' | 'agents' | 'projects'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Web Speech API Voice search
  const voiceDictation = useVoiceDictation({
    onResult: (finalText, interimText) => {
      const combined = interimText ? `${finalText} ${interimText}`.trim() : finalText;
      setQuery(combined);
    },
    onFinal: (finalText) => {
      setQuery(finalText);
    },
  });

  const toggleVoiceSearch = () => {
    if (voiceDictation.isListening) {
      voiceDictation.stopListening();
    } else {
      voiceDictation.startListening(query);
    }
  };

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setCategoryFilter('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

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

  // Fuzzy match utility: checks substring or fuzzy character sequence with scoring
  const fuzzyScore = (needle: string, target: string): number => {
    const n = needle.toLowerCase().trim();
    const t = target.toLowerCase();
    if (!n) return 0;
    if (t === n) return 1000;
    if (t.startsWith(n)) return 500;
    const subIdx = t.indexOf(n);
    if (subIdx !== -1) return 300 - subIdx;

    // Fuzzy subsequence match
    let nIdx = 0;
    let score = 0;
    let prevIdx = -2;
    for (let i = 0; i < t.length; i++) {
      if (nIdx < n.length && t[i] === n[nIdx]) {
        score += 10;
        if (i === prevIdx + 1) score += 20; // consecutive bonus
        if (i === 0 || t[i - 1] === ' ' || t[i - 1] === '-' || t[i - 1] === '_') score += 25; // word start bonus
        prevIdx = i;
        nIdx++;
      }
    }
    return nIdx === n.length ? score : -1;
  };

  // Filtered dynamic search items with fuzzy ranking
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const rawQ = query.trim().toLowerCase();
    const isTagSearch = rawQ.startsWith('#') || rawQ.startsWith('tag:');
    const cleanQ = rawQ.replace(/^(#|tag:)/, '').trim();

    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'Tasks' | 'Memories' | 'Chats' | 'Agents' | 'Projects';
      icon: React.FC<{ className?: string }>;
      tags?: string[];
      score: number;
      action: () => void;
    }> = [];

    // 1. Tasks: match title, description, and tags
    if (categoryFilter === 'all' || categoryFilter === 'tasks') {
      tasks.forEach((t) => {
        let maxScore = -1;
        const titleScore = fuzzyScore(cleanQ, t.title);
        const descScore = t.description ? fuzzyScore(cleanQ, t.description) : -1;
        const tagMatches = (t.tags || []).some((tg) => {
          const s = fuzzyScore(cleanQ, tg);
          if (s > maxScore) maxScore = s + 50; // bonus for explicit tag match
          return s > 0;
        });

        maxScore = Math.max(maxScore, titleScore, descScore > 0 ? descScore - 20 : -1);

        if (maxScore > 0) {
          items.push({
            id: `task-${t.id}`,
            title: t.title,
            subtitle: `${t.priority.toUpperCase()} priority • ${t.status} ${t.dueDate ? `• Due ${t.dueDate}` : ''}`,
            category: 'Tasks',
            icon: CheckSquare,
            tags: t.tags,
            score: maxScore,
            action: () => {
              setActiveTab('tasks');
              closeCommandPalette();
            },
          });
        }
      });
    }

    // 2. Memory Vault: match title, content, and tags
    if (categoryFilter === 'all' || categoryFilter === 'memories') {
      memories.forEach((m) => {
        let maxScore = -1;
        const titleScore = fuzzyScore(cleanQ, m.title);
        const contentScore = fuzzyScore(cleanQ, m.content);
        const tagMatches = (m.tags || []).some((tg) => {
          const s = fuzzyScore(cleanQ, tg);
          if (s > maxScore) maxScore = s + 60; // bonus for memory tag match
          return s > 0;
        });

        maxScore = Math.max(maxScore, titleScore, contentScore > 0 ? contentScore - 30 : -1);

        if (maxScore > 0) {
          items.push({
            id: `memory-${m.id}`,
            title: m.title,
            subtitle: `${m.type.replace(/_/g, ' ')} • ${m.content.slice(0, 48)}...`,
            category: 'Memories',
            icon: Brain,
            tags: m.tags,
            score: maxScore,
            action: () => {
              setActiveTab('memories');
              closeCommandPalette();
            },
          });
        }
      });
    }

    // 3. Chats (unless tag-specific search mode)
    if (!isTagSearch && (categoryFilter === 'all' || categoryFilter === 'chats')) {
      conversations.forEach((c) => {
        const s = fuzzyScore(cleanQ, c.title);
        if (s > 0) {
          items.push({
            id: `chat-${c.id}`,
            title: c.title,
            subtitle: c.pinned ? 'Pinned Conversation' : c.isArchived ? 'Archived Conversation' : 'Recent Conversation',
            category: 'Chats',
            icon: MessageSquare,
            score: s,
            action: () => {
              setActiveConversationId(c.id);
              setActiveTab('chat');
              closeCommandPalette();
            },
          });
        }
      });
    }

    // 4. Agents (unless tag-specific search mode)
    if (!isTagSearch && (categoryFilter === 'all' || categoryFilter === 'agents')) {
      agents.forEach((a) => {
        const nameScore = fuzzyScore(cleanQ, a.name);
        const tagScore = fuzzyScore(cleanQ, a.tagline);
        const s = Math.max(nameScore, tagScore);
        if (s > 0) {
          items.push({
            id: `agent-${a.id}`,
            title: a.name,
            subtitle: a.tagline,
            category: 'Agents',
            icon: Bot,
            score: s,
            action: () => {
              createConversation(a.id);
              setActiveTab('chat');
              closeCommandPalette();
            },
          });
        }
      });
    }

    // 5. Projects
    if (!isTagSearch && (categoryFilter === 'all' || categoryFilter === 'projects')) {
      projects.forEach((p) => {
        const nameScore = fuzzyScore(cleanQ, p.name);
        const descScore = p.description ? fuzzyScore(cleanQ, p.description) : -1;
        const s = Math.max(nameScore, descScore);
        if (s > 0) {
          items.push({
            id: `proj-${p.id}`,
            title: p.name,
            subtitle: p.description || 'Workspace Project',
            category: 'Projects',
            icon: FolderGit2,
            score: s,
            action: () => {
              setActiveTab('projects');
              closeCommandPalette();
            },
          });
        }
      });
    }

    // Sort by match score descending
    return items.sort((a, b) => b.score - a.score);
  }, [query, categoryFilter, tasks, memories, conversations, agents, projects, setActiveConversationId, setActiveTab, createConversation, closeCommandPalette]);

  // Reset selected index when query or results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults.length, query]);

  // Global & Input Hotkey Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          // handled in parent
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeCommandPalette();
        return;
      }

      // Arrow navigation / Ctrl+N & Ctrl+P
      if (e.key === 'ArrowDown' || (e.ctrlKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        if (searchResults.length > 0) {
          setSelectedIndex((prev) => {
            const next = (prev + 1) % searchResults.length;
            const el = document.getElementById(`cp-item-${next}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
            return next;
          });
        }
        return;
      }

      if (e.key === 'ArrowUp' || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        if (searchResults.length > 0) {
          setSelectedIndex((prev) => {
            const next = (prev - 1 + searchResults.length) % searchResults.length;
            const el = document.getElementById(`cp-item-${next}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
            return next;
          });
        }
        return;
      }

      // Enter to select
      if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults.length > 0 && searchResults[selectedIndex]) {
          searchResults[selectedIndex].action();
        } else if (query.trim()) {
          executeSuggestion(query);
        }
        return;
      }

      // Tab to cycle category filters
      if (e.key === 'Tab') {
        e.preventDefault();
        const cats: Array<'all' | 'tasks' | 'memories' | 'chats' | 'agents' | 'projects'> = [
          'all',
          'tasks',
          'memories',
          'chats',
          'agents',
          'projects',
        ];
        const nextIdx = (cats.indexOf(categoryFilter) + (e.shiftKey ? -1 : 1) + cats.length) % cats.length;
        setCategoryFilter(cats[nextIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, closeCommandPalette, searchResults, selectedIndex, query, categoryFilter]);

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
            placeholder={
              voiceDictation.isListening
                ? 'Listening... speak to search'
                : 'Search chats, tasks, #tags, memories, agents...'
            }
            className={`flex-1 bg-transparent border-none text-sm outline-none ${
              isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-neutral-500'
            }`}
          />
          {/* Voice Search Microphone Trigger */}
          <button
            type="button"
            onClick={toggleVoiceSearch}
            className={`p-1.5 rounded-lg transition-all ${
              voiceDictation.isListening
                ? 'bg-red-500 text-white animate-pulse shadow-xs'
                : isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title={voiceDictation.isListening ? 'Stop voice input' : 'Search with voice dictation'}
          >
            {voiceDictation.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
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

        {/* Filter Chips Bar (All, Tasks, Memories, Chats, Agents, Projects) */}
        <div
          className={`flex items-center gap-1.5 px-4 py-2 border-b overflow-x-auto no-scrollbar text-xs ${
            isLight ? 'border-slate-100 bg-slate-50/20' : 'border-neutral-800/50 bg-[#0B0E14]'
          }`}
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'tasks', label: 'Tasks' },
              { id: 'memories', label: 'Memories' },
              { id: 'chats', label: 'Chats' },
              { id: 'agents', label: 'Agents' },
              { id: 'projects', label: 'Projects' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                categoryFilter === cat.id
                  ? isLight
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="text-[10px] font-mono opacity-40 ml-auto hidden sm:inline">
            Tab to cycle
          </span>
        </div>

        {/* Modal Body */}
        <div
          ref={resultsContainerRef}
          className="p-4 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar"
        >
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                  >
                    <span>Start conversation about "{query.slice(0, 20)}"</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      id={`cp-item-${idx}`}
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                        isSelected
                          ? isLight
                            ? 'bg-indigo-50 border-indigo-200 text-slate-900 shadow-xs'
                            : 'bg-indigo-950/40 border-indigo-500/40 text-white shadow-xs'
                          : isLight
                          ? 'hover:bg-slate-100/80 border-transparent text-slate-800'
                          : 'hover:bg-neutral-850/80 border-transparent text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : isLight
                              ? 'bg-slate-100 text-indigo-600'
                              : 'bg-neutral-900 text-indigo-400'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold truncate">{item.title}</p>
                            {isSelected && (
                              <span className="text-[10px] font-mono text-indigo-400 shrink-0">
                                ↵ Enter
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-[10px] truncate ${
                              isLight ? 'text-slate-500' : 'text-neutral-400'
                            }`}
                          >
                            {item.subtitle}
                          </p>

                          {/* Matching tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {item.tags.slice(0, 3).map((tg) => (
                                <span
                                  key={tg}
                                  className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                                    isLight
                                      ? 'bg-slate-100 text-slate-600'
                                      : 'bg-white/5 text-neutral-400'
                                  }`}
                                >
                                  #{tg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                            : isLight
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

        {/* Dynamic Contextual Footer with View Shortcuts */}
        <div
          className={`px-4 py-2.5 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] ${
            isLight
              ? 'border-slate-100 bg-slate-50/50 text-slate-500'
              : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-indigo-500 capitalize">{activeTab} View:</span>
            <span>
              {activeTab === 'tasks'
                ? 'N (New Task) • Quick Add Voice • Win+K Search'
                : activeTab === 'chat'
                ? 'Enter (Send) • Shift+Enter (Newline) • Mic (Dictate)'
                : activeTab === 'projects'
                ? 'New Project • Click Project Details'
                : activeTab === 'memories'
                ? 'Dictate Voice Note • Win+K Search'
                : activeTab === 'agent_lab'
                ? 'Execute Workflow • 9-Step Inspection'
                : activeTab === 'visual_mode'
                ? 'Camera & Screen Stream • Bounding Box ROI'
                : 'Win+K (Global Search) • Alt+1..6 (Navigate)'}
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[10px]">
            <WindowsShortcutBadge shortcut="K" />
            <span>Esc exit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
