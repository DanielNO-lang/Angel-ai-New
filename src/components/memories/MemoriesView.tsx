/**
 * ANGEL AI — Memory Vault & Knowledge Bank
 * Dedicated memory management area supporting view, edit, and delete.
 * Distinguishes:
 *  - User-created memory (user_preference)
 *  - Long-term memory (important_fact, long_term_instruction, saved_knowledge)
 *  - Agent-specific memory (agent_memory)
 *  - Project memory (project_context)
 *  - Temporary conversation context (conversation_derived)
 */

import React, { useState, useEffect } from 'react';
import {
  Archive,
  Bot,
  Brain,
  Check,
  Clock,
  Compass,
  Copy,
  Edit2,
  Filter,
  FolderGit2,
  Layers,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { Memory, MemoryType } from '../../types';
import { Button, EmptyState } from '../ui';

// Categorical classifications for tabs
type MemoryClassificationFilter =
  | 'all'
  | 'user_created'
  | 'long_term'
  | 'agent_specific'
  | 'project'
  | 'temporary';

export const MemoriesView: React.FC = () => {
  const {
    memories,
    createMemory,
    updateMemory,
    deleteMemory,
    agents,
    projects,
    highlightedMemoryId,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MemoryClassificationFilter>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<MemoryType>('user_preference');
  const [formAgentId, setFormAgentId] = useState<string>('');
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formSource, setFormSource] = useState('Manual Entry');
  const [formConfidence, setFormConfidence] = useState<number>(0.95);
  const [formTags, setFormTags] = useState('');
  const [formPinned, setFormPinned] = useState(false);

  // Sync and scroll to highlighted memory if triggered from Global Search
  useEffect(() => {
    if (highlightedMemoryId) {
      setActiveFilter('all');
      setSelectedAgentFilter('all');
      setSearchQuery('');
      const timer = setTimeout(() => {
        const el = document.getElementById(`memory-card-${highlightedMemoryId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedMemoryId]);

  const openNewModal = (defaultCategory?: MemoryType) => {
    setEditingMemory(null);
    setFormTitle('');
    setFormContent('');
    setFormType(defaultCategory || 'user_preference');
    setFormAgentId('');
    setFormProjectId(projects[0]?.id || '');
    setFormSource('User Manual Configuration');
    setFormConfidence(0.98);
    setFormTags('');
    setFormPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (mem: Memory) => {
    setEditingMemory(mem);
    setFormTitle(mem.title);
    setFormContent(mem.content);
    setFormType(mem.type);
    setFormAgentId(mem.agentId || '');
    setFormProjectId(mem.projectId || '');
    setFormSource(mem.source || 'Manual Entry');
    setFormConfidence(mem.confidence ?? 0.95);
    setFormTags(mem.tags ? mem.tags.join(', ') : '');
    setFormPinned(Boolean(mem.isPinned));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const memoryPayload = {
      title: formTitle.trim(),
      content: formContent.trim(),
      type: formType,
      agentId: formType === 'agent_memory' ? (formAgentId || undefined) : (formAgentId || undefined),
      projectId: formType === 'project_context' ? (formProjectId || undefined) : (formProjectId || undefined),
      confidence: formConfidence,
      source: formSource.trim() || 'Manual configuration',
      tags: parsedTags.length > 0 ? parsedTags : ['workspace'],
      isPinned: formPinned,
    };

    if (editingMemory) {
      updateMemory(editingMemory.id, memoryPayload);
    } else {
      createMemory(memoryPayload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete memory item "${title}"? This cannot be undone.`)) {
      deleteMemory(id);
    }
  };

  const handleTogglePin = (mem: Memory) => {
    updateMemory(mem.id, { isPinned: !mem.isPinned });
  };

  const handleCopyContent = (mem: Memory) => {
    navigator.clipboard.writeText(`${mem.title}\n\n${mem.content}`);
    setCopiedId(mem.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Memory Classification Matcher
  const matchesClassification = (mem: Memory, filter: MemoryClassificationFilter): boolean => {
    switch (filter) {
      case 'all':
        return true;
      case 'user_created':
        return mem.type === 'user_preference';
      case 'long_term':
        return (
          mem.type === 'long_term_instruction' ||
          mem.type === 'important_fact' ||
          mem.type === 'saved_knowledge'
        );
      case 'agent_specific':
        return mem.type === 'agent_memory' || Boolean(mem.agentId);
      case 'project':
        return mem.type === 'project_context' || Boolean(mem.projectId);
      case 'temporary':
        return mem.type === 'conversation_derived';
      default:
        return true;
    }
  };

  // Helper for category badge styling and human readable label
  const getCategoryMeta = (mem: Memory) => {
    if (mem.type === 'user_preference') {
      return {
        label: 'User-Created',
        sublabel: 'Preference',
        badgeClass: isLight
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-neutral-800 text-neutral-100 border-neutral-700',
        icon: <User className={`w-3 h-3 ${isLight ? 'text-indigo-600' : 'text-neutral-300'}`} />,
      };
    }
    if (mem.type === 'agent_memory' || mem.agentId) {
      const boundAgent = agents.find((a) => a.id === mem.agentId);
      return {
        label: 'Agent-Specific',
        sublabel: boundAgent ? boundAgent.name : 'Dedicated Agent',
        badgeClass: isLight
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-neutral-900 text-neutral-200 border-neutral-700',
        icon: <Bot className={`w-3 h-3 ${isLight ? 'text-purple-600' : 'text-neutral-400'}`} />,
      };
    }
    if (mem.type === 'project_context' || mem.projectId) {
      const boundProject = projects.find((p) => p.id === mem.projectId);
      return {
        label: 'Project Memory',
        sublabel: boundProject ? boundProject.name : 'Project Context',
        badgeClass: isLight
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-neutral-900 text-neutral-200 border-neutral-700',
        icon: <FolderGit2 className={`w-3 h-3 ${isLight ? 'text-blue-600' : 'text-neutral-400'}`} />,
      };
    }
    if (mem.type === 'conversation_derived') {
      return {
        label: 'Temporary Context',
        sublabel: 'Derived from Chat',
        badgeClass: isLight
          ? 'bg-slate-100 text-slate-600 border-slate-200 italic'
          : 'bg-neutral-950 text-neutral-400 border-neutral-800 italic',
        icon: <MessageSquare className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`} />,
      };
    }
    // Long term categories
    return {
      label: 'Long-Term Memory',
      sublabel: mem.type.replace('_', ' '),
      badgeClass: isLight
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-neutral-900 text-neutral-200 border-neutral-750',
      icon: <Brain className={`w-3 h-3 ${isLight ? 'text-emerald-600' : 'text-neutral-400'}`} />,
    };
  };

  // Counts for each tab
  const counts = {
    all: memories.length,
    user_created: memories.filter((m) => m.type === 'user_preference').length,
    long_term: memories.filter(
      (m) =>
        m.type === 'long_term_instruction' ||
        m.type === 'important_fact' ||
        m.type === 'saved_knowledge'
    ).length,
    agent_specific: memories.filter((m) => m.type === 'agent_memory' || Boolean(m.agentId)).length,
    project: memories.filter((m) => m.type === 'project_context' || Boolean(m.projectId)).length,
    temporary: memories.filter((m) => m.type === 'conversation_derived').length,
  };

  // Filtered dataset
  const filteredMemories = memories.filter((mem) => {
    if (!matchesClassification(mem, activeFilter)) return false;
    if (selectedAgentFilter !== 'all' && mem.agentId !== selectedAgentFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = mem.title.toLowerCase().includes(q);
      const matchContent = mem.content.toLowerCase().includes(q);
      const matchSource = (mem.source || '').toLowerCase().includes(q);
      const matchTags = (mem.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchSource && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
        isLight ? 'border-slate-200' : 'border-neutral-800'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1 rounded border ${
              isLight ? 'bg-slate-100 border-slate-200 text-indigo-600' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
            }`}>
              <Brain className="w-4 h-4" />
            </span>
            <span className={`text-xs font-mono tracking-wider uppercase ${
              isLight ? 'text-slate-400' : 'text-neutral-400'
            }`}>
              Persistent Knowledge & Recall
            </span>
          </div>
          <h1 className={`text-2xl font-semibold tracking-tight mt-1 ${
            isLight ? 'text-slate-900' : 'text-neutral-100'
          }`}>
            Memory Vault
          </h1>
          <p className={`text-sm mt-0.5 max-w-2xl ${
            isLight ? 'text-slate-500' : 'text-neutral-400'
          }`}>
            Inspect, curate, and maintain durable workspace intelligence. Clear distinctions between user preferences, long-term architectural mandates, agent-specific rules, project contexts, and temporary conversation findings.
          </p>
        </div>

        <button
          id="btn-add-memory"
          onClick={() => openNewModal()}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 shadow-xs ${
            isLight
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-neutral-100 hover:bg-white text-neutral-950'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Memory</span>
        </button>
      </div>

      {/* Filter Tabs distinguishing all required memory classes */}
      <div className="space-y-3">
        {/* Classification Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Knowledge', count: counts.all },
            { id: 'user_created', label: 'User-Created', count: counts.user_created },
            { id: 'long_term', label: 'Long-Term Memory', count: counts.long_term },
            { id: 'agent_specific', label: 'Agent-Specific', count: counts.agent_specific },
            { id: 'project', label: 'Project Context', count: counts.project },
            { id: 'temporary', label: 'Temporary Derived', count: counts.temporary },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as MemoryClassificationFilter)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? isLight
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                    : 'bg-neutral-800 text-neutral-100 border border-neutral-700/80 shadow-xs'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeFilter === tab.id
                    ? isLight
                      ? 'bg-indigo-100/80 text-indigo-800'
                      : 'bg-neutral-900 text-neutral-300'
                    : isLight
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-neutral-900/60 text-neutral-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Agent Filter Row */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories, rules, content, tags..."
              className={`w-full border rounded-xl px-3 py-2 pl-9 text-xs focus:outline-hidden ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 shadow-2xs'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:border-neutral-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
            <span className={`text-[11px] font-mono whitespace-nowrap ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>Agent Filter:</span>
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500 shadow-2xs'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300'
              }`}
            >
              <option value="all">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <EmptyState
            icon={<Brain className={`w-6 h-6 ${isLight ? 'text-slate-400' : 'text-neutral-400'}`} />}
            title="No memories found"
            description="The memory vault stores verified preferences, agent operating boundaries, project directives, and temporary conversation facts."
            actionLabel="Add First Memory"
            onAction={() => openNewModal()}
          />
        ) : (
          filteredMemories.map((mem) => {
            const meta = getCategoryMeta(mem);
            const isHighlighted = highlightedMemoryId === mem.id;
            const boundAgent = agents.find((a) => a.id === mem.agentId);
            const boundProject = projects.find((p) => p.id === mem.projectId);

            return (
              <div
                key={mem.id}
                id={`memory-card-${mem.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isLight
                    ? isHighlighted
                      ? 'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-200 shadow-md'
                      : mem.isPinned
                      ? 'bg-white border-indigo-200/90 shadow-2xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    : isHighlighted
                    ? 'bg-neutral-900 border-neutral-400 ring-2 ring-neutral-300 shadow-xl'
                    : mem.isPinned
                    ? 'bg-[#121622] border-neutral-700/80 shadow-xs'
                    : 'bg-[#121622]/90 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Header Badges & Title */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Classification Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono border ${meta.badgeClass}`}
                      >
                        {meta.icon}
                        <span>{meta.label}</span>
                        {meta.sublabel && meta.sublabel !== meta.label && (
                          <span className={`${isLight ? 'text-slate-500' : 'text-neutral-400'} font-sans`}>• {meta.sublabel}</span>
                        )}
                      </span>

                      {/* Associated Agent Pill if not already in badge */}
                      {boundAgent && mem.type !== 'agent_memory' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-600'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}>
                          <Bot className={`w-2.5 h-2.5 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`} />
                          <span>{boundAgent.name}</span>
                        </span>
                      )}

                      {/* Associated Project Pill if not already in badge */}
                      {boundProject && mem.type !== 'project_context' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-600'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}>
                          <FolderGit2 className={`w-2.5 h-2.5 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`} />
                          <span>{boundProject.name}</span>
                        </span>
                      )}

                      {/* Confidence Rating */}
                      {mem.confidence !== undefined && (
                        <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                          Confidence: {Math.round(mem.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className={`text-sm font-semibold tracking-tight ${
                      isLight ? 'text-slate-900' : 'text-neutral-100'
                    }`}>
                      {mem.title}
                    </h3>

                    {/* Content */}
                    <p className={`text-xs leading-relaxed max-w-3xl whitespace-pre-wrap font-sans ${
                      isLight ? 'text-slate-600' : 'text-neutral-300'
                    }`}>
                      {mem.content}
                    </p>

                    {/* Meta Footer: Source, Tags, Timestamps */}
                    <div className={`flex items-center gap-3 pt-2 text-[10px] font-mono flex-wrap border-t ${
                      isLight ? 'border-slate-100 text-slate-400' : 'border-neutral-850 text-neutral-500'
                    }`}>
                      {mem.source && (
                        <span className={isLight ? 'text-slate-500' : 'text-neutral-400'}>
                          Source: <strong className={isLight ? 'text-slate-700 font-medium' : 'text-neutral-300 font-normal'}>{mem.source}</strong>
                        </span>
                      )}

                      {mem.tags && mem.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className={`w-3 h-3 ${isLight ? 'text-slate-400' : 'text-neutral-600'}`} />
                          <span>{mem.tags.join(', ')}</span>
                        </div>
                      )}

                      <span>
                        Updated {new Date(mem.updatedAt || mem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Pin Toggle */}
                    <button
                      onClick={() => handleTogglePin(mem)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        mem.isPinned
                          ? isLight
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                            : 'bg-neutral-800 border-neutral-600 text-neutral-100 shadow-xs'
                          : isLight
                          ? 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
                          : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-800'
                      }`}
                      title={mem.isPinned ? 'Unpin memory' : 'Pin memory to top'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${mem.isPinned ? 'fill-current' : ''}`} />
                    </button>

                    {/* Copy Content */}
                    <button
                      onClick={() => handleCopyContent(mem)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Copy memory content"
                    >
                      {copiedId === mem.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Edit Memory */}
                    <button
                      onClick={() => openEditModal(mem)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Edit memory"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Memory */}
                    <button
                      onClick={() => handleDelete(mem.id, mem.title)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLight ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-neutral-500 hover:text-red-400'
                      }`}
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg border rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-neutral-100'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-100' : 'border-neutral-800'
            }`}>
              <div>
                <h3 className={`text-base font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                  {editingMemory ? 'Edit Memory' : 'Store New Memory'}
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Configure memory category, association, and confidence.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-neutral-100'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {/* Category / Type */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Memory Classification Category *
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as MemoryType)}
                  className={`w-full border rounded-lg px-2.5 py-2 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                  }`}
                >
                  <option value="user_preference">User-Created: Preference & Directive</option>
                  <option value="long_term_instruction">Long-Term Memory: System Instruction</option>
                  <option value="important_fact">Long-Term Memory: Architecture & Fact</option>
                  <option value="saved_knowledge">Long-Term Memory: Saved Knowledge</option>
                  <option value="agent_memory">Agent-Specific Memory: Operational Rule</option>
                  <option value="project_context">Project Memory: Architecture & Boundaries</option>
                  <option value="conversation_derived">Temporary Context: Conversation Derived</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Memory Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Visual Identity & Styling Standard"
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-hidden ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500' : 'bg-neutral-950 border-neutral-800 text-neutral-200 focus:border-neutral-500'
                  }`}
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Memory Content *</label>
                <textarea
                  rows={4}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="State the durable knowledge, constraint, or preference in clear language..."
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-hidden font-sans ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500' : 'bg-neutral-950 border-neutral-800 text-neutral-200 focus:border-neutral-500'
                  }`}
                />
              </div>

              {/* Conditional Associations: Agent / Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Associated Agent</label>
                  <select
                    value={formAgentId}
                    onChange={(e) => setFormAgentId(e.target.value)}
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <option value="">Global / Workspace-Wide</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.codename})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Associated Project</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <option value="">Global / No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source & Confidence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Provenance / Source</label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="e.g. User Configuration, PRD"
                    className={`w-full border rounded-lg px-3 py-1.5 text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                    Confidence ({Math.round(formConfidence * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={formConfidence}
                    onChange={(e) => setFormConfidence(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 mt-2"
                  />
                </div>
              </div>

              {/* Tags & Pinned */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2 space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="e.g. design, styling, dark_mode"
                    className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-hidden ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  />
                </div>

                <div className="pt-4 flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPinned}
                      onChange={(e) => setFormPinned(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Pin to Top</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className={`flex items-center justify-end gap-2 pt-4 border-t ${
                isLight ? 'border-slate-100' : 'border-neutral-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isLight
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      : 'bg-neutral-100 hover:bg-white text-neutral-950'
                  }`}
                >
                  {editingMemory ? 'Save Changes' : 'Store Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
