/**
 * ANGEL AI — Assistants Lifecycle System
 * Complete AI Entity Lifecycle Workspace:
 * - Create, Configure, Edit, Version, Duplicate, Archive, Delete
 * - Publish / Unpublish to Marketplace
 * - Permission, Model, Memory, and Tool Configuration
 * - Interactive Testing Playground
 * - Real Execution History & Agent Lab Integration
 */

import React, { useState } from 'react';
import {
  Users,
  Bot,
  Brain,
  Search,
  Plus,
  Sparkles,
  ArrowRight,
  Code2,
  FileText,
  Eye,
  CheckCircle2,
  Copy,
  Archive,
  Trash2,
  Sliders,
  Play,
  Send,
  Shield,
  Layers,
  Check,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Wrench,
  X,
  History,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AssistantEntity, ToolDefinition } from '../../types';

export const AssistantsView: React.FC = () => {
  const {
    assistantsList,
    createAssistant,
    updateAssistant,
    deleteAssistant,
    duplicateAssistant,
    toggleArchiveAssistant,
    togglePublishAssistant,
    availableTools,
    createConversation,
    setActiveTab,
    setSelectedAgentId,
    executions,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';

  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(assistantsList[0]?.id || 'asst-atlas');
  const [activeTab, setActiveSubTab] = useState<'configure' | 'testing' | 'history' | 'lifecycle'>('configure');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Playground state
  const [testPrompt, setTestPrompt] = useState('');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testLatencyMs, setTestLatencyMs] = useState<number | null>(null);

  // New Assistant Form state
  const [newName, setNewName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newCategory, setNewCategory] = useState<AssistantEntity['category']>('Engineering');
  const [newInstructions, setNewInstructions] = useState('');
  const [newModel, setNewModel] = useState('gemini-3.8-flash');

  const selectedAssistant = assistantsList.find((a) => a.id === selectedAssistantId) || assistantsList[0];

  const filteredAssistants = assistantsList.filter((a) => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.tagline.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartChat = (assistant: AssistantEntity) => {
    setSelectedAgentId(assistant.id);
    createConversation(assistant.id, undefined, `Chat with ${assistant.name}`);
    setActiveTab('chat');
  };

  const handleRunPlaygroundTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim() || !selectedAssistant) return;

    setIsTesting(true);
    setTestOutput(null);
    const start = Date.now();

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          systemInstruction: selectedAssistant.systemInstructions,
          modelId: selectedAssistant.modelId,
        }),
      });

      const data = await res.json();
      setTestOutput(data.text || 'Assistant responded successfully.');
      setTestLatencyMs(Date.now() - start);
    } catch (err) {
      setTestOutput(`Error testing assistant: ${err instanceof Error ? err.message : String(err)}`);
      setTestLatencyMs(Date.now() - start);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = createAssistant({
      name: newName.trim(),
      tagline: newTagline.trim() || 'Custom AI entity',
      description: newTagline.trim(),
      category: newCategory,
      version: '1.0.0',
      modelId: newModel,
      systemInstructions: newInstructions.trim() || 'You are an Angel AI autonomous assistant.',
      permissions: {
        readMemory: true,
        writeTasks: true,
        executeCode: false,
        webAccess: true,
        runTools: true,
      },
      allowedToolIds: ['memory_search', 'task_create'],
      memoryScope: 'shared',
      isPublished: false,
      isArchived: false,
    });

    setSelectedAssistantId(created.id);
    setIsCreateModalOpen(false);
    setNewName('');
    setNewTagline('');
    setNewInstructions('');
  };

  const handleToggleTool = (toolId: string) => {
    if (!selectedAssistant) return;
    const current = selectedAssistant.allowedToolIds || [];
    const updated = current.includes(toolId) ? current.filter((t) => t !== toolId) : [...current, toolId];
    updateAssistant(selectedAssistant.id, { allowedToolIds: updated });
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 animate-in fade-in duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Sticky Header */}
        <div
          className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#0B0E14] border-white/10 text-neutral-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-2xl border ${
                isLight
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
            >
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Assistants Lifecycle System</h1>
              <span className="text-[11px] font-medium opacity-60">
                Configure, Version, Test, Publish & Monitor AI Personas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Assistant</span>
            </button>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ========================================================
              LEFT COLUMN: ASSISTANTS ROSTER (4 COLS)
              ======================================================== */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search assistants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
                }`}
              />
            </div>

            <div className="space-y-2">
              {filteredAssistants.map((asst) => {
                const isSelected = selectedAssistant?.id === asst.id;

                return (
                  <div
                    key={asst.id}
                    onClick={() => setSelectedAssistantId(asst.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? isLight
                          ? 'bg-indigo-50/60 border-indigo-400 shadow-xs'
                          : 'bg-indigo-950/20 border-indigo-500/50 shadow-xs'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-[#10141E] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs ${
                            isLight
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}
                        >
                          {asst.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                            <span>{asst.name}</span>
                            <span className="text-[10px] font-medium opacity-50">v{asst.version}</span>
                          </h4>
                          <span className="text-[10px] text-neutral-400 font-medium">{asst.category}</span>
                        </div>
                      </div>

                      {asst.isPublished && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">
                          Published
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                      {asst.tagline || asst.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: ASSISTANT WORKSPACE STUDIO (8 COLS)
              ======================================================== */}
          {selectedAssistant && (
            <div
              className={`lg:col-span-8 p-6 rounded-3xl border space-y-6 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              {/* Top Assistant Meta & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{selectedAssistant.name}</h2>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                      v{selectedAssistant.version}
                    </span>
                    <span className="text-xs font-medium text-purple-400">({selectedAssistant.modelId})</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{selectedAssistant.tagline}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartChat(selectedAssistant)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Launch Chat</span>
                  </button>
                  <button
                    onClick={() => duplicateAssistant(selectedAssistant.id)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white cursor-pointer"
                    title="Duplicate Assistant"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAssistant(selectedAssistant.id)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 cursor-pointer"
                    title="Delete Assistant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Configuration, Testing Playground, History, Lifecycle */}
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                {[
                  { id: 'configure', label: 'Configuration & Tools' },
                  { id: 'testing', label: 'Testing Playground' },
                  { id: 'history', label: 'Execution History' },
                  { id: 'lifecycle', label: 'Version & Publishing' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveSubTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: CONFIGURE */}
              {activeTab === 'configure' && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">System Directives & Instructions</label>
                    <textarea
                      rows={4}
                      value={selectedAssistant.systemInstructions}
                      onChange={(e) =>
                        updateAssistant(selectedAssistant.id, { systemInstructions: e.target.value })
                      }
                      className={`w-full p-3 text-xs rounded-xl border outline-none font-medium leading-relaxed ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                  </div>

                  {/* Permissions & Security Matrix */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Permission Configuration</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'readMemory', label: 'Read Memory' },
                        { key: 'writeTasks', label: 'Write Tasks' },
                        { key: 'webAccess', label: 'Web Access' },
                        { key: 'runTools', label: 'Run Tools' },
                      ].map((perm) => {
                        const isGranted = (selectedAssistant.permissions as any)[perm.key];

                        return (
                          <button
                            key={perm.key}
                            type="button"
                            onClick={() =>
                              updateAssistant(selectedAssistant.id, {
                                permissions: {
                                  ...selectedAssistant.permissions,
                                  [perm.key]: !isGranted,
                                },
                              })
                            }
                            className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isGranted
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                : 'bg-white/5 border-white/10 text-neutral-400 opacity-60'
                            }`}
                          >
                            <span>{perm.label}</span>
                            <span className="text-[10px] font-medium">{isGranted ? '✓' : '—'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tool Configuration Matrix */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-purple-400" />
                      <span>Allowed Tool Registry</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableTools.map((tool) => {
                        const isAllowed = selectedAssistant.allowedToolIds?.includes(tool.id);

                        return (
                          <div
                            key={tool.id}
                            onClick={() => handleToggleTool(tool.id)}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isAllowed
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                                : 'bg-white/5 border-white/10 text-neutral-400 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div>
                              <div className="font-semibold">{tool.name}</div>
                              <div className="text-[10px] text-neutral-400 truncate max-w-xs">{tool.description}</div>
                            </div>
                            <span className="text-xs font-bold font-medium">{isAllowed ? '✓' : '+'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TESTING PLAYGROUND */}
              {activeTab === 'testing' && (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">Interactive Sandbox Session</span>
                      {testLatencyMs && (
                        <span className="font-medium text-[10px] text-emerald-400">{testLatencyMs}ms response latency</span>
                      )}
                    </div>

                    <form onSubmit={handleRunPlaygroundTest} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Test prompt for ${selectedAssistant.name}...`}
                        value={testPrompt}
                        onChange={(e) => setTestPrompt(e.target.value)}
                        className={`flex-1 px-3.5 py-2 text-xs rounded-xl border outline-none ${
                          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-black/30 border-white/10 text-white'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isTesting}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        <span>Run</span>
                      </button>
                    </form>
                  </div>

                  {testOutput && (
                    <div
                      className={`p-4 rounded-2xl border text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                        isLight ? 'bg-slate-100 text-slate-800' : 'bg-black/40 border-white/10 text-neutral-200'
                      }`}
                    >
                      {testOutput}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EXECUTION HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-neutral-400">
                    Historical executions associated with {selectedAssistant.name}:
                  </div>
                  {executions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      No executions recorded yet. Launch chat or run an Agent Lab task to log execution records.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {executions.slice(0, 5).map((exec) => (
                        <div
                          key={exec.id}
                          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{exec.taskPrompt}</div>
                            <div className="text-[10px] text-neutral-400 font-medium">
                              Tools: {exec.toolsUsed.join(', ') || 'none'}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              exec.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {exec.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LIFECYCLE & PUBLISHING */}
              {activeTab === 'lifecycle' && (
                <div className="space-y-4">
                  <div
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold">Marketplace Publication</h4>
                        <p className="text-[11px] text-neutral-400">
                          Publish this configured assistant to the Angel Marketplace for the community.
                        </p>
                      </div>
                      <button
                        onClick={() => togglePublishAssistant(selectedAssistant.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          selectedAssistant.isPublished
                            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {selectedAssistant.isPublished ? 'Unpublish from Marketplace' : 'Publish to Marketplace'}
                      </button>
                    </div>
                  </div>

                  <div
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold">Archive Status</h4>
                        <p className="text-[11px] text-neutral-400">
                          Archive this assistant to hide it from active sidebar chats while preserving historical logs.
                        </p>
                      </div>
                      <button
                        onClick={() => toggleArchiveAssistant(selectedAssistant.id)}
                        className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-semibold cursor-pointer"
                      >
                        {selectedAssistant.isArchived ? 'Restore Assistant' : 'Archive Assistant'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Assistant Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E121B] border-white/10 text-neutral-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Create Autonomous Assistant</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Assistant Name</label>
                <input
                  type="text"
                  placeholder="e.g. SRE Incident Commander"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Research">Research</option>
                    <option value="Vision">Vision</option>
                    <option value="Creative">Creative</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Base Model</label>
                  <select
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Tagline / Mission</label>
                <input
                  type="text"
                  placeholder="Triages production alert logs and generates incident postmortems"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">System Instructions</label>
                <textarea
                  rows={4}
                  placeholder="You are an expert SRE incident commander. Prioritize uptime, verify runbooks..."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Create Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
