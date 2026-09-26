/**
 * ANGEL AI — Task Execution Center
 * Full operational task engine supporting creation, status transitions, priorities,
 * deadlines, recurring cadences, completion state, and association with agents/conversations.
 * Features an integrated search bar and tag filter engine with responsive screen adaptation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Edit2,
  Filter,
  Menu,
  MessageSquare,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { Button, EmptyState } from '../ui';

export const TasksView: React.FC = () => {
  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    toggleSubtask,
    agents,
    conversations,
    setSelectedAgentId,
    setActiveConversationId,
    createConversation,
    sendMessage,
    setActiveTab,
    highlightedTaskId,
    setHighlightedTaskId,
    settings,
    setMobileMenuOpen,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterRecurring, setFilterRecurring] = useState<string>('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<'daily' | 'weekly' | 'monthly' | 'none'>('none');
  const [assignedAgentId, setAssignedAgentId] = useState('agent-chronos');
  const [associatedConversationId, setAssociatedConversationId] = useState<string>('');
  const [subtaskInputs, setSubtaskInputs] = useState<string[]>(['']);
  const [tagInput, setTagInput] = useState('');

  // Extract all unique tags across tasks with occurrence counts
  const allUniqueTags = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      (t.tags || []).forEach((rawTag) => {
        const tag = rawTag.toLowerCase().trim();
        if (tag) {
          map.set(tag, (map.get(tag) || 0) + 1);
        }
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  // Sync and scroll to highlighted task if triggered from Global Search
  useEffect(() => {
    if (highlightedTaskId) {
      setFilterStatus('all');
      setFilterPriority('all');
      setFilterAgent('all');
      setFilterRecurring('all');
      setSelectedTag('all');
      setSearchQuery('');
      const timer = setTimeout(() => {
        const el = document.getElementById(`task-card-${highlightedTaskId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedTaskId]);

  const openNewTaskModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setDueDate('');
    setRecurring('none');
    setAssignedAgentId(agents[0]?.id || 'agent-chronos');
    setAssociatedConversationId('');
    setSubtaskInputs(['']);
    setTagInput('');
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setRecurring((task.recurring as any) || 'none');
    setAssignedAgentId(task.agentId || agents[0]?.id || 'agent-chronos');
    setAssociatedConversationId(task.conversationId || '');
    setSubtaskInputs(task.subtasks.length > 0 ? task.subtasks.map((s) => s.title) : ['']);
    setTagInput((task.tags || []).join(', '));
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validSubtasks = subtaskInputs
      .filter((s) => s.trim().length > 0)
      .map((s, idx) => ({
        id: `st-${Date.now()}-${idx}`,
        title: s.trim(),
        completed: editingTask?.subtasks[idx]?.completed || false,
      }));

    const parsedTags = tagInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || undefined,
      recurring: recurring === 'none' ? null : recurring,
      agentId: assignedAgentId || undefined,
      conversationId: associatedConversationId || undefined,
      subtasks: validSubtasks,
      tags: parsedTags.length > 0 ? parsedTags : ['workspace'],
      completedAt: status === 'completed' ? editingTask?.completedAt || new Date().toISOString() : undefined,
    };

    if (editingTask) {
      updateTask(editingTask.id, taskPayload);
    } else {
      createTask(taskPayload);
    }

    setIsTaskModalOpen(false);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const isNowCompleted = newStatus === 'completed';
    updateTask(taskId, {
      status: newStatus,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    });
  };

  const handleDelegateToAgent = (task: Task) => {
    const targetAgentId = task.agentId || 'angel-core';
    setSelectedAgentId(targetAgentId);
    createConversation(targetAgentId, undefined, `Task: ${task.title}`);
    sendMessage(
      `Please review and assist with executing the following workspace task:\n\n**Title**: ${task.title}\n**Description**: ${
        task.description || 'N/A'
      }\n**Priority**: ${task.priority}\n**Deadline**: ${task.dueDate || 'Unspecified'}\n**Recurring**: ${
        task.recurring || 'None'
      }\n**Tags**: ${(task.tags || []).join(', ') || 'None'}\n**Subtasks**: ${
        task.subtasks.map((s) => (s.completed ? `[x] ${s.title}` : `[ ] ${s.title}`)).join(', ') || 'None'
      }`
    );
    setActiveTab('chat');
  };

  // Filter pipeline: Title, Tag, Priority, Agent, Schedule, Status
  const filteredTasks = tasks.filter((task) => {
    // Status
    if (filterStatus === 'active') {
      if (task.status === 'completed' || task.status === 'cancelled') return false;
    } else if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }

    // Priority
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

    // Agent
    if (filterAgent !== 'all' && task.agentId !== filterAgent) return false;

    // Recurring schedule
    if (filterRecurring === 'recurring' && !task.recurring) return false;
    if (filterRecurring === 'one_time' && task.recurring) return false;

    // Selected Tag chip
    if (selectedTag !== 'all') {
      const hasTag = (task.tags || []).some((t) => t.toLowerCase().trim() === selectedTag);
      if (!hasTag) return false;
    }

    // Search query: filters tasks by title or tag (or description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cleanQ = q.startsWith('#') ? q.slice(1) : q;
      const matchTitle = task.title.toLowerCase().includes(cleanQ);
      const matchTags = (task.tags || []).some((t) => t.toLowerCase().includes(cleanQ));
      const matchDesc = (task.description || '').toLowerCase().includes(cleanQ);
      if (!matchTitle && !matchTags && !matchDesc) return false;
    }

    return true;
  });

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedTag !== 'all' ||
    filterStatus !== 'all' ||
    filterPriority !== 'all' ||
    filterAgent !== 'all' ||
    filterRecurring !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTag('all');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterAgent('all');
    setFilterRecurring('all');
  };

  return (
    <div
      className={`min-h-full px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6 transition-colors duration-150 animate-in fade-in duration-150 ${
        isLight ? 'text-slate-800' : 'text-neutral-100'
      }`}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        {/* ========================================================
            DEDICATED SEARCH & TAG FILTER CONTROL BAR
            ======================================================== */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border transition-colors shadow-2xs space-y-3.5 ${
            isLight
              ? 'bg-white/80 border-slate-200/90 shadow-slate-100 text-slate-800'
              : 'bg-[#0E121B]/80 border-white/5 shadow-black/40 text-neutral-100'
          }`}
        >
          {/* Main Search Input & Primary Filters */}
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search
                className={`w-4 h-4 absolute left-3.5 top-3 ${
                  isLight ? 'text-slate-400' : 'text-neutral-400'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title, description, or #tag..."
                className={`w-full rounded-xl pl-10 pr-9 py-2 text-xs transition-colors outline-none border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                    : 'bg-neutral-900/90 border-white/10 text-neutral-100 placeholder-neutral-500 focus:border-indigo-500 focus:bg-neutral-900'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-200"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters (Priority, Agent, Schedule) + Create Task */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className={`rounded-xl px-2.5 py-2 text-xs border outline-none cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-neutral-900 border-white/10 text-neutral-300 hover:border-white/20'
                }`}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className={`rounded-xl px-2.5 py-2 text-xs border outline-none cursor-pointer transition-colors max-w-[140px] truncate ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-neutral-900 border-white/10 text-neutral-300 hover:border-white/20'
                }`}
              >
                <option value="all">All Agents</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <select
                value={filterRecurring}
                onChange={(e) => setFilterRecurring(e.target.value)}
                className={`rounded-xl px-2.5 py-2 text-xs border outline-none cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-neutral-900 border-white/10 text-neutral-300 hover:border-white/20'
                }`}
              >
                <option value="all">All Schedules</option>
                <option value="recurring">Recurring</option>
                <option value="one_time">One-Time</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className={`p-2 rounded-xl transition-colors text-xs flex items-center gap-1.5 shrink-0 ${
                    isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white border border-white/10'
                  }`}
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}

              <button
                id="btn-create-task"
                onClick={openNewTaskModal}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            </div>
          </div>

          {/* Quick Tag Filter Chips Bar */}
          {allUniqueTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-inherit text-xs">
              <span className="text-[11px] font-mono opacity-60 mr-1 flex items-center gap-1 shrink-0">
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>Tags:</span>
              </span>

              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTag === 'all'
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-white/5'
                }`}
              >
                All ({tasks.length})
              </button>

              {allUniqueTags.map(([tag, count]) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? 'all' : tag)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-white/5'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="text-[10px] opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Navigation Tabs & Result Telemetry */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'active', label: 'Active Focus' },
              { id: 'todo', label: 'To Do' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'review', label: 'In Review' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => {
              const isActive = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? isLight
                        ? 'bg-white text-indigo-700 border border-slate-200 shadow-2xs font-semibold'
                        : 'bg-neutral-800 text-white border border-neutral-700/80 shadow-xs font-semibold'
                      : isLight
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Results Counter */}
          <div className="text-[11px] font-mono opacity-60 shrink-0 self-end sm:self-center">
            Showing <span className="font-semibold text-indigo-500">{filteredTasks.length}</span> of{' '}
            {tasks.length} tasks
          </div>
        </div>

        {/* Task Cards List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="w-6 h-6 text-neutral-400" />}
              title={
                hasActiveFilters
                  ? 'No tasks match your search or filter'
                  : 'No tasks in this workspace yet'
              }
              description={
                hasActiveFilters
                  ? 'Try clearing the search query or selecting a different tag/priority filter.'
                  : 'Tasks represent actionable directives, milestone deliverables, and automated workflows assigned to Angel agents.'
              }
              actionLabel={hasActiveFilters ? 'Clear Filters' : 'Create Task'}
              onAction={hasActiveFilters ? resetFilters : openNewTaskModal}
              secondaryActionLabel={hasActiveFilters ? undefined : 'Plan with Chronos'}
              onSecondaryAction={
                hasActiveFilters
                  ? undefined
                  : () => {
                      setSelectedAgentId('agent-chronos');
                      createConversation('agent-chronos', undefined, 'Task Planning');
                      sendMessage('Help me plan and decompose tasks for my upcoming milestones.');
                      setActiveTab('chat');
                    }
              }
            />
          ) : (
            filteredTasks.map((task) => {
              const assignedAgent = agents.find((a) => a.id === task.agentId);
              const isDone = task.status === 'completed';
              const isCancelled = task.status === 'cancelled';
              const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
              const isHighlighted = highlightedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  id={`task-card-${task.id}`}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isHighlighted
                      ? isLight
                        ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-300 shadow-md'
                        : 'bg-neutral-900 border-indigo-500 ring-2 ring-indigo-400/40 shadow-xl'
                      : isDone || isCancelled
                      ? isLight
                        ? 'bg-slate-50/80 border-slate-200/60 opacity-65'
                        : 'bg-neutral-950/40 border-neutral-900 opacity-60'
                      : isLight
                      ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                      : 'bg-[#0E121B]/80 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                      {/* Status Toggle Checkbox Button */}
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`mt-0.5 transition-colors shrink-0 ${
                          isDone
                            ? 'text-emerald-500'
                            : isLight
                            ? 'text-slate-400 hover:text-slate-600'
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                        title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Title & Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-sm font-semibold tracking-tight break-words ${
                              isDone
                                ? 'line-through opacity-60'
                                : isCancelled
                                ? 'line-through opacity-50'
                                : isLight
                                ? 'text-slate-900'
                                : 'text-neutral-100'
                            }`}
                          >
                            {task.title}
                          </h3>

                          {/* Priority Badge */}
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                              task.priority === 'urgent'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20 font-semibold'
                                : task.priority === 'high'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-semibold'
                                : isLight
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                            }`}
                          >
                            {task.priority}
                          </span>

                          {/* Status Transition Selector */}
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg border outline-none cursor-pointer shrink-0 ${
                              isLight
                                ? 'bg-slate-50 border-slate-200 text-slate-700'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">In Review</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          {/* Recurring Schedule Badge */}
                          {task.recurring && (
                            <span
                              className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 ${
                                isLight
                                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                              }`}
                            >
                              <Repeat className="w-3 h-3 text-indigo-400" />
                              <span>Every {task.recurring}</span>
                            </span>
                          )}

                          {/* Deadline / Due Date */}
                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 ${
                                isLight
                                  ? 'bg-slate-100 border-slate-200 text-slate-600'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                              }`}
                            >
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Due: {task.dueDate}</span>
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p
                            className={`text-xs leading-relaxed max-w-3xl ${
                              isLight ? 'text-slate-600' : 'text-neutral-400'
                            }`}
                          >
                            {task.description}
                          </p>
                        )}

                        {/* Subtasks Accordion */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div
                            className={`p-2.5 rounded-xl border mt-2 space-y-1.5 ${
                              isLight
                                ? 'bg-slate-50/80 border-slate-200/80'
                                : 'bg-neutral-950/60 border-neutral-800/80'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono opacity-60">
                              <span>
                                Subtasks ({completedSubtasks}/{task.subtasks.length})
                              </span>
                            </div>
                            <div className="space-y-1">
                              {task.subtasks.map((st) => (
                                <div
                                  key={st.id}
                                  onClick={() => toggleSubtask(task.id, st.id)}
                                  className={`flex items-center gap-2 text-xs cursor-pointer select-none transition-colors ${
                                    isLight ? 'text-slate-700 hover:text-slate-900' : 'text-neutral-300 hover:text-neutral-100'
                                  }`}
                                >
                                  <span
                                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                                      st.completed
                                        ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                                        : isLight
                                        ? 'border-slate-300 bg-white'
                                        : 'border-neutral-700 bg-neutral-900'
                                    }`}
                                  >
                                    {st.completed && '✓'}
                                  </span>
                                  <span className={st.completed ? 'line-through opacity-50' : ''}>
                                    {st.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags & Completion date */}
                        <div className="flex items-center gap-2.5 pt-1 text-[10px] font-mono opacity-70 flex-wrap">
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {task.tags.map((t) => (
                                <button
                                  key={t}
                                  onClick={() => setSelectedTag(t.toLowerCase().trim())}
                                  className="hover:underline text-indigo-400 font-semibold"
                                >
                                  #{t}
                                </button>
                              ))}
                            </div>
                          )}
                          {task.completedAt && (
                            <span>Completed on {new Date(task.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Actions (Responsive: turns into icon-only modes when cramped) */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                      {/* Assigned Agent Pill */}
                      {assignedAgent && (
                        <div
                          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-mono ${
                            isLight
                              ? 'bg-slate-100 border-slate-200 text-slate-700'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                          }`}
                          title={`Assigned to ${assignedAgent.name}`}
                        >
                          <Bot className="w-3 h-3 text-indigo-400" />
                          <span>{assignedAgent.name}</span>
                        </div>
                      )}

                      {/* Delegate / Chat with Agent Button */}
                      <button
                        onClick={() => handleDelegateToAgent(task)}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                          isLight
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-white/10'
                        }`}
                        title="Open task in Chat with assigned agent"
                      >
                        <span className="hidden sm:inline">Delegate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Task */}
                      <button
                        onClick={() => openEditTaskModal(task)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                        }`}
                        title="Edit task parameters"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Task */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete task"
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
      </div>

      {/* ========================================================
          CREATE / EDIT TASK MODAL
          ======================================================== */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#0E121B] border-white/10 text-neutral-100'
            }`}
          >
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <h3 className="text-base font-semibold">
                {editingTask ? 'Edit Task' : 'Create Task'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Audit database schema and deploy RLS rules"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-neutral-900 border-white/10 text-white focus:border-indigo-400'
                  }`}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, criteria for completion, or context..."
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-neutral-900 border-white/10 text-white focus:border-indigo-400'
                  }`}
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs outline-none border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                    }`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs outline-none border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                    }`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Deadline & Recurring Cadence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Deadline / Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full rounded-xl px-3 py-1.5 text-xs font-mono outline-none border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Recurring Schedule</label>
                  <select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value as any)}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs outline-none border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                    }`}
                  >
                    <option value="none">One-time (None)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Agent & Conversation Associations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Assign Agent</label>
                  <select
                    value={assignedAgentId}
                    onChange={(e) => setAssignedAgentId(e.target.value)}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs outline-none border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                    }`}
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.codename})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Link Conversation</label>
                  <select
                    value={associatedConversationId}
                    onChange={(e) => setAssociatedConversationId(e.target.value)}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs outline-none border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                    }`}
                  >
                    <option value="">No linked conversation</option>
                    {conversations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. backend, database, sprint-1"
                  className={`w-full rounded-xl px-3 py-1.5 text-xs outline-none border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                  }`}
                />
              </div>

              {/* Subtasks Inputs */}
              <div className="space-y-2">
                <label className="text-xs font-semibold">Subtasks</label>
                {subtaskInputs.map((inputVal, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => {
                        const next = [...subtaskInputs];
                        next[index] = e.target.value;
                        setSubtaskInputs(next);
                      }}
                      placeholder={`Subtask #${index + 1}`}
                      className={`flex-1 rounded-xl px-3 py-1.5 text-xs outline-none border ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                      }`}
                    />
                    {subtaskInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSubtaskInputs((prev) => prev.filter((_, i) => i !== index))}
                        className="p-1.5 text-neutral-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSubtaskInputs((prev) => [...prev, ''])}
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtask</span>
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
