/**
 * ANGEL AI — Workspace Projects
 * Domain containers linking goals, tasks, memories, and agents.
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  CheckSquare,
  Clock,
  FolderGit2,
  Layers,
  MessageSquare,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { Project } from '../../types';
import { Button, EmptyState } from '../ui';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    createProject,
    tasks,
    memories,
    agents,
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
      notes: 'Initial project domain created.',
    });

    setProjectName('');
    setProjectDescription('');
    setGoalInputs(['']);
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
    <div className="module-blue-theme max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
        isLight ? 'border-slate-200' : 'border-neutral-800'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1 rounded border ${
              isLight ? 'bg-slate-100 border-slate-200 text-indigo-600' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
            }`}>
              <FolderGit2 className="w-4 h-4" />
            </span>
            <span className={`text-xs font-mono tracking-wider uppercase ${
              isLight ? 'text-slate-400' : 'text-neutral-400'
            }`}>
              High-Level Domain Workspaces
            </span>
          </div>
          <h1 className={`text-2xl font-semibold tracking-tight mt-1 ${
            isLight ? 'text-slate-900' : 'text-neutral-100'
          }`}>
            Projects
          </h1>
          <p className={`text-sm mt-0.5 ${
            isLight ? 'text-slate-500' : 'text-neutral-400'
          }`}>
            Organize long-term initiatives, tie tasks to durable memories, and coordinate specialized agents.
          </p>
        </div>

        <button
          id="btn-create-project"
          onClick={() => setIsNewProjectModalOpen(true)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 shadow-xs ${
            isLight
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-neutral-100 hover:bg-white text-neutral-950'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Grid: Project Selector Tabs + Project Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Project Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <span className={`text-xs font-semibold uppercase tracking-wider px-1 ${
            isLight ? 'text-slate-500' : 'text-neutral-400'
          }`}>
            Active Projects ({projects.length})
          </span>

          <div className="space-y-2">
            {projects.map((proj) => {
              const isSelected = proj.id === activeProject?.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? isLight
                        ? 'bg-white border-indigo-300 ring-2 ring-indigo-200/60 shadow-md text-slate-900'
                        : 'bg-neutral-900 border-neutral-600 text-neutral-100 shadow-sm'
                      : isLight
                      ? 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700 shadow-2xs hover:shadow-xs'
                      : 'bg-neutral-900/30 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{proj.name}</h3>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-600'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}>
                      {proj.status}
                    </span>
                  </div>
                  <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    {proj.description}
                  </p>
                  <div className={`flex items-center gap-3 mt-3 text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                    <span>{proj.taskIds.length} tasks</span>
                    <span>•</span>
                    <span>{proj.goals.length} goals</span>
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
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-2xs'
                : 'border-neutral-800 bg-neutral-900/40'
            }`}>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                isLight ? 'border-slate-100' : 'border-neutral-800'
              }`}>
                <div>
                  <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                    {activeProject.name}
                  </h2>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    {activeProject.description}
                  </p>
                </div>

                <button
                  onClick={handleStartProjectChat}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs shrink-0 ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-neutral-100 hover:bg-white text-neutral-950'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Open Project Chat</span>
                </button>
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                  <Target className={`w-4 h-4 ${isLight ? 'text-indigo-500' : 'text-neutral-400'}`} />
                  <span>Strategic Goals</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeProject.goals.map((goal, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-indigo-500' : 'text-neutral-500'}`} />
                      <span>{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Agents */}
              <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-slate-100' : 'border-neutral-800/80'}`}>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                  <Bot className={`w-4 h-4 ${isLight ? 'text-purple-500' : 'text-neutral-400'}`} />
                  <span>Linked Agents</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {projectAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                        isLight
                          ? 'bg-purple-50/70 border-purple-200 text-purple-800'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span className="font-semibold">{agent.name}</span>
                      <span className={`text-[10px] font-mono ${isLight ? 'text-purple-600' : 'text-neutral-500'}`}>
                        {agent.codename}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Linked Tasks Section */}
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-2xs'
                : 'border-neutral-800 bg-neutral-900/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                  <CheckSquare className={`w-4 h-4 ${isLight ? 'text-indigo-500' : 'text-neutral-400'}`} />
                  <span>Linked Project Tasks</span>
                </span>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`text-xs flex items-center gap-1 transition-colors ${
                    isLight ? 'text-indigo-600 hover:text-indigo-800 font-medium' : 'text-neutral-400 hover:text-neutral-200'
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
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span className="truncate">{t.title}</span>
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                        isLight
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : 'bg-neutral-900 text-neutral-400'
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

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg border rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-neutral-100'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-100' : 'border-neutral-800'
            }`}>
              <h3 className={`text-base font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>Create Project</h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-neutral-100'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">Project Name</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Angel Core Engine"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">Description</label>
                <textarea
                  rows={2}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Scope, objectives, and deliverables..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300">Key Goals</label>
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
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
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
                  className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Goal</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-medium transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
