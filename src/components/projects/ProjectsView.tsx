/**
 * ANGEL AI — Workspace Projects
 * Domain containers linking goals, tasks, memories, and agents.
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  FolderGit2,
  Layers,
  MessageSquare,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { Project } from '../../types';
import { Button, EmptyState } from '../ui';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProjectsActivityChart } from './ProjectsActivityChart';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    createProject,
    deleteProject,
    tasks,
    memories,
    agents,
    executions,
    conversations,
    createConversation,
    setActiveTab,
    setSelectedAgentId,
    activeProjectId,
    setActiveProjectId,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';

  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || projects[0]?.id || '');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Sync when activeProjectId changes from Global Search
  React.useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [goalInputs, setGoalInputs] = useState<string[]>(['']);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(['angel-core']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const projectTasks = tasks.filter((t) => activeProject?.taskIds.includes(t.id));
  const projectMemories = memories.filter((m) => activeProject?.memoryIds.includes(m.id));
  const projectAgents = agents.filter((a) => activeProject?.agentIds.includes(a.id));

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const validGoals = goalInputs.filter((g) => g.trim().length > 0);

    createProject({
      name: projectName,
      description: projectDescription,
      goals: validGoals,
      agentIds: selectedAgentIds,
      activeAgentIds: selectedAgentIds,
      tags: ['Workspace'],
      taskIds: [],
      memoryIds: [],
      conversationIds: [],
      status: 'active',
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      notes: 'Initial project domain created.',
    });

    setProjectName('');
    setProjectDescription('');
    setGoalInputs(['']);
    setDueDate('');
    setIsNewProjectModalOpen(false);
  };

  const handleStartProjectChat = () => {
    const primaryAgent = projectAgents[0]?.id || 'angel-core';
    setSelectedAgentId(primaryAgent);
    createConversation(
      primaryAgent,
      activeProject.id,
      `Project: ${activeProject.name}`
    );
    setActiveTab('chat');
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Fixed Non-Transparent Header */}
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
              <FolderGit2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Projects</h1>
                <span className="text-[11px] font-medium opacity-60">({projects.length} active)</span>
              </div>
            </div>
          </div>

          <button
            id="btn-create-project"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-xs transition-all shrink-0 transform-gpu hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Real-Time Projects Activity & Agent Frequency Dashboard */}
        <ProjectsActivityChart
          projects={projects}
          tasks={tasks}
          executions={executions}
          isLight={isLight}
        />

        {/* Grid: Project Selector Tabs + Project Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Project Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-1 ${
                isLight ? 'text-slate-500' : 'text-neutral-400'
              }`}
            >
              Active Projects ({projects.length})
            </span>

            <div className="space-y-2">
              {projects.map((proj) => {
                const isSelected = proj.id === activeProject?.id;
                const pTasks = tasks.filter((t) => proj.taskIds.includes(t.id));
                const completedCount = pTasks.filter((t) => t.status === 'completed').length;
                const progressPct =
                  pTasks.length > 0
                    ? Math.round((completedCount / pTasks.length) * 100)
                    : proj.status === 'completed'
                    ? 100
                    : 30;

                return (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? isLight
                          ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200/60 shadow-sm text-slate-900'
                          : 'bg-[#151926] border-indigo-500/40 text-white shadow-xs ring-1 ring-indigo-500/30'
                        : isLight
                        ? 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700 shadow-2xs hover:shadow-xs'
                        : 'bg-[#121620] border-white/5 hover:border-white/10 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{proj.name}</h3>
                      <span
                        className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded border ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-600'
                            : 'bg-[#0E121B] border-white/5 text-neutral-400'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                      {proj.description}
                    </p>

                    {/* Visual Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-medium">
                        <span className="opacity-60">Completion</span>
                        <span className="font-semibold text-indigo-400">{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className={`flex items-center justify-between mt-2.5 text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{proj.dueDate ? `Due ${proj.dueDate}` : 'Active milestone'}</span>
                      </div>
                      <span>{pTasks.length} tasks • {proj.goals.length} goals</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Project Details (8 cols) */}
          {activeProject && (
            <div className="lg:col-span-8 space-y-6">
              {/* Overview Card */}
              <div
                className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
                  isLight
                    ? 'bg-white border-slate-200/90 text-slate-800'
                    : 'bg-[#121620] border-white/5 text-neutral-100'
                }`}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                    isLight ? 'border-slate-100' : 'border-white/5'
                  }`}
                >
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">
                      {activeProject.name}
                    </h2>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                      {activeProject.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleStartProjectChat}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Project Chat</span>
                    </button>
                    <button
                      onClick={() => setProjectToDelete(activeProject)}
                      className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer text-red-400 hover:text-red-500 hover:bg-red-500/10 ${
                        isLight ? 'border-red-200 bg-red-50/50' : 'border-red-500/20 bg-red-500/5'
                      }`}
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                  <Target className={`w-4 h-4 ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                  <span>Strategic Goals</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeProject.goals.map((goal, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-[#0E121B] border-white/5 text-neutral-300'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                      <span>{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Agents */}
              <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                  <Bot className={`w-4 h-4 ${isLight ? 'text-purple-500' : 'text-purple-400'}`} />
                  <span>Linked Agents</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {projectAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs ${
                        isLight
                          ? 'bg-purple-50/70 border-purple-200 text-purple-800'
                          : 'bg-[#0E121B] border-white/5 text-neutral-300'
                      }`}
                    >
                      <span className="font-semibold">{agent.name}</span>
                      <span className={`text-[10px] font-medium ${isLight ? 'text-purple-600' : 'text-neutral-500'}`}>
                        {agent.codename}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Linked Tasks Section */}
            <div className={`p-5 rounded-2xl border space-y-3 shadow-2xs ${
              isLight
                ? 'bg-white border-slate-200/90 text-slate-800'
                : 'bg-[#121620] border-white/5 text-neutral-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                  <CheckSquare className={`w-4 h-4 ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                  <span>Linked Project Tasks</span>
                </span>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`text-xs flex items-center gap-1 transition-colors ${
                    isLight ? 'text-indigo-600 hover:text-indigo-800 font-medium' : 'text-indigo-400 hover:text-indigo-300 font-medium'
                  }`}
                >
                  <span>Manage in Tasks</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {projectTasks.length === 0 ? (
                  <p className={`text-xs py-3 italic ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                    No tasks linked yet. Assign tasks to this project ID.
                  </p>
                ) : (
                  projectTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-[#0E121B] border-white/5 text-neutral-300'
                      }`}
                    >
                      <span className="truncate">{t.title}</span>
                      <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded border ${
                        isLight
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg border rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121620] border-white/10 text-neutral-100 shadow-2xl'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
              <h3 className="text-base font-bold tracking-tight">Create Project</h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className={`p-1 rounded-lg ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-white'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Project Name</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Angel Core Engine"
                  className={`w-full rounded-xl px-3 py-2 text-xs border outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-[#0E121B] border-white/10 text-neutral-200 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Description</label>
                <textarea
                  rows={2}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Scope, objectives, and deliverables..."
                  className={`w-full rounded-xl px-3 py-2 text-xs border outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-[#0E121B] border-white/10 text-neutral-200 focus:border-indigo-500'
                  }`}
                />
              </div>

              {/* Start & Due Date Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full rounded-xl px-3 py-1.5 text-xs font-medium border outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-[#0E121B] border-white/10 text-neutral-200'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Target Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full rounded-xl px-3 py-1.5 text-xs font-medium border outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-[#0E121B] border-white/10 text-neutral-200'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Key Goals</label>
                {goalInputs.map((val, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => {
                        const next = [...goalInputs];
                        next[idx] = e.target.value;
                        setGoalInputs(next);
                      }}
                      placeholder={`Goal #${idx + 1}`}
                      className={`flex-1 rounded-xl px-3 py-1.5 text-xs border outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                          : 'bg-[#0E121B] border-white/10 text-neutral-200 focus:border-indigo-500'
                      }`}
                    />
                    {goalInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGoalInputs((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-neutral-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setGoalInputs((prev) => [...prev, ''])}
                  className="text-xs text-indigo-500 hover:text-indigo-400 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Goal</span>
                </button>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-4 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-neutral-200'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Dialog: Delete Project */}
      <ConfirmDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) {
            deleteProject(projectToDelete.id);
            if (selectedProjectId === projectToDelete.id) {
              const remaining = projects.filter((p) => p.id !== projectToDelete.id);
              setSelectedProjectId(remaining[0]?.id || '');
            }
            setProjectToDelete(null);
          }
        }}
        title="Delete Project?"
        message={`"${projectToDelete?.name}" will be permanently removed along with its project workspace context.`}
        confirmLabel="Delete Project"
        isDestructive={true}
      />
    </div>
  );
};
