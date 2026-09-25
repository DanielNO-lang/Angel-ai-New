/**
 * ANGEL AI — Task Execution Center
 * Full operational task engine supporting creation, status transitions, priorities,
 * deadlines, recurring cadences, completion state, and association with agents/conversations.
 */

import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Plus,
  Repeat,
  RotateCcw,
  Search,
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
  } = useAngel();

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterRecurring, setFilterRecurring] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Sync and scroll to highlighted task if triggered from Global Search
  useEffect(() => {
    if (highlightedTaskId) {
      setFilterStatus('all');
      setFilterPriority('all');
      setFilterAgent('all');
      setFilterRecurring('all');
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
    setRecurring(task.recurring || 'none');
    setAssignedAgentId(task.agentId || agents[0]?.id || 'agent-chronos');
    setAssociatedConversationId(task.conversationId || '');
    setSubtaskInputs(
      task.subtasks && task.subtasks.length > 0 ? task.subtasks.map((st) => st.title) : ['']
    );
    setTagInput(task.tags ? task.tags.join(', ') : '');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validSubtasks = subtaskInputs
      .filter((s) => s.trim().length > 0)
      .map((s, idx) => {
        // If editing, preserve existing completed state if matches title
        const existing = editingTask?.subtasks?.find((ex) => ex.title === s.trim());
        return {
          id: existing ? existing.id : `st-${Date.now()}-${idx}`,
          title: s.trim(),
          completed: existing ? existing.completed : false,
        };
      });

    const parsedTags = tagInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

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
      completedAt: status === 'completed' ? (editingTask?.completedAt || new Date().toISOString()) : undefined,
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

  const handleJumpToConversation = (convId: string) => {
    setActiveConversationId(convId);
    setActiveTab('chat');
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
      }\n**Subtasks**: ${
        task.subtasks.map((s) => (s.completed ? `[x] ${s.title}` : `[ ] ${s.title}`)).join(', ') || 'None'
      }`
    );
    setActiveTab('chat');
  };

  // Filter pipeline
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

    // Recurring
    if (filterRecurring === 'recurring' && !task.recurring) return false;
    if (filterRecurring === 'one_time' && task.recurring) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchTags = (task.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }

    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
              <CheckSquare className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">
              Operational Task Engine
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100 mt-1">
            Tasks & Workflows
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Create, track, and assign actionable workflows to Angel agents. Supports deadlines, recurring schedules, and direct conversation linkages.
          </p>
        </div>

        <button
          id="btn-create-task"
          onClick={openNewTaskModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-medium transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        {/* Search Bar & Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, descriptions, tags..."
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-3 py-2 pl-9 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap text-xs">
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-hidden"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Agent Filter */}
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-hidden"
            >
              <option value="all">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Recurring Filter */}
            <select
              value={filterRecurring}
              onChange={(e) => setFilterRecurring(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-hidden"
            >
              <option value="all">All Schedules</option>
              <option value="recurring">Recurring Only</option>
              <option value="one_time">One-Time Only</option>
            </select>
          </div>
        </div>

        {/* Status Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'active', label: 'Active Focus' },
            { id: 'todo', label: 'To Do' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'review', label: 'In Review' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700/80 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-6 h-6 text-neutral-400" />}
            title="No tasks match the active filters"
            description="Tasks represent actionable directives, milestone deliverables, and automated workflows assigned to Angel agents."
            actionLabel="Create Task"
            onAction={openNewTaskModal}
            secondaryActionLabel="Plan with Chronos"
            onSecondaryAction={() => {
              setSelectedAgentId('agent-chronos');
              createConversation('agent-chronos', undefined, 'Task Planning');
              sendMessage('Help me plan and decompose tasks for my upcoming milestones.');
              setActiveTab('chat');
            }}
          />
        ) : (
          filteredTasks.map((task) => {
            const assignedAgent = agents.find((a) => a.id === task.agentId);
            const associatedConv = conversations.find((c) => c.id === task.conversationId);
            const isDone = task.status === 'completed';
            const isCancelled = task.status === 'cancelled';
            const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
            const isHighlighted = highlightedTaskId === task.id;

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isHighlighted
                    ? 'bg-neutral-900 border-neutral-400 ring-2 ring-neutral-300 shadow-xl'
                    : isDone || isCancelled
                    ? 'bg-neutral-950/40 border-neutral-900 opacity-60'
                    : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Status Toggle Button */}
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`mt-0.5 transition-colors ${
                        isDone ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                      title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div className="space-y-1.5 flex-1">
                      {/* Title & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm font-semibold tracking-tight ${
                            isDone ? 'line-through text-neutral-400' : isCancelled ? 'line-through text-neutral-500' : 'text-neutral-100'
                          }`}
                        >
                          {task.title}
                        </h3>

                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                            task.priority === 'urgent'
                              ? 'bg-red-950/40 text-red-300 border-red-800'
                              : task.priority === 'high'
                              ? 'bg-neutral-800 text-neutral-100 border-neutral-700'
                              : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Status Transition Selector */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 focus:outline-hidden"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">In Review</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Recurring Schedule Badge */}
                        {task.recurring && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                            <Repeat className="w-3 h-3 text-neutral-400" />
                            <span>Every {task.recurring}</span>
                          </span>
                        )}

                        {/* Deadline / Due Date */}
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                            <Calendar className="w-3 h-3 text-neutral-500" />
                            <span>Due: {task.dueDate}</span>
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
                          {task.description}
                        </p>
                      )}

                      {/* Associated Conversation Pill */}
                      {associatedConv && (
                        <div className="pt-0.5 flex items-center gap-1.5">
                          <button
                            onClick={() => handleJumpToConversation(associatedConv.id)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-[11px] text-neutral-300 font-mono transition-colors"
                          >
                            <MessageSquare className="w-3 h-3 text-neutral-500" />
                            <span>Linked Chat: {associatedConv.title}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-neutral-500" />
                          </button>
                        </div>
                      )}

                      {/* Subtasks Progress */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="pt-2 space-y-1.5">
                          <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
                            <span>
                              Subtasks ({completedSubtasks}/{task.subtasks.length})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {task.subtasks.map((st) => (
                              <div
                                key={st.id}
                                onClick={() => toggleSubtask(task.id, st.id)}
                                className="flex items-center gap-2 text-xs text-neutral-300 hover:text-neutral-100 cursor-pointer select-none"
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                                    st.completed
                                      ? 'bg-neutral-100 border-white text-neutral-950 font-bold'
                                      : 'border-neutral-700 bg-neutral-950'
                                  }`}
                                >
                                  {st.completed && '✓'}
                                </span>
                                <span className={st.completed ? 'line-through text-neutral-500' : ''}>
                                  {st.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags & Completion date */}
                      <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-neutral-500">
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>{task.tags.join(', ')}</span>
                          </div>
                        )}
                        {task.completedAt && (
                          <span>Completed on {new Date(task.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Assigned Agent Pill */}
                    {assignedAgent && (
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 font-mono">
                        <Bot className="w-3 h-3 text-neutral-400" />
                        <span>{assignedAgent.name}</span>
                      </div>
                    )}

                    {/* Delegate / Chat with Agent Button */}
                    <button
                      onClick={() => handleDelegateToAgent(task)}
                      className="px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium transition-colors flex items-center gap-1 shadow-xs"
                      title="Open task in Chat with assigned agent"
                    >
                      <span className="hidden sm:inline">Delegate</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {/* Edit Task */}
                    <button
                      onClick={() => openEditTaskModal(task)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                      title="Edit task parameters"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Task */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">
                {editingTask ? 'Edit Task' : 'Create Task'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Audit database schema and deploy RLS rules"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-neutral-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, criteria for completion, or context..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-neutral-500"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
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
                  <label className="text-xs font-medium text-neutral-300">Deadline / Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Recurring Schedule</label>
                  <select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
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
                  <label className="text-xs font-medium text-neutral-300">Assign Agent</label>
                  <select
                    value={assignedAgentId}
                    onChange={(e) => setAssignedAgentId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.codename})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Link Conversation</label>
                  <select
                    value={associatedConversationId}
                    onChange={(e) => setAssociatedConversationId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
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
                <label className="text-xs font-medium text-neutral-300">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. backend, database, sprint-1"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-hidden"
                />
              </div>

              {/* Subtasks Inputs */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300">Subtasks</label>
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
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                    />
                    {subtaskInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSubtaskInputs((prev) => prev.filter((_, i) => i !== index))}
                        className="p-1.5 text-neutral-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSubtaskInputs((prev) => [...prev, ''])}
                  className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtask</span>
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-medium transition-colors"
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
