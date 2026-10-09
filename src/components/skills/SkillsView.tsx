/**
 * ANGEL AI — Skills System Registry
 * Browsable, executable agent cognitive capabilities.
 * Inspect instructions, required tools, permission scopes, and execute
 * skills in the interactive test playground.
 */

import React, { useState } from 'react';
import {
  PlayCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Flame,
  Bot,
  Wrench,
  Shield,
  Layers,
  Code2,
  Terminal,
  Cpu,
  BarChart3,
  BookOpen,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import {
  SkillDefinition,
  SkillCategory,
  SkillTestExecution,
} from '../../types';
import {
  getSavedSkills,
  saveSkills,
  testExecuteSkill,
} from '../../services/skills/skillsRegistry';

export const SkillsView: React.FC = () => {
  const { settings, setActiveTab, availableTools } = useAngel();
  const isLight = settings.theme === 'light';

  // Skills state
  const [skills, setSkills] = useState<SkillDefinition[]>(() => getSavedSkills());
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabMode, setActiveTabMode] = useState<'catalog' | 'playground' | 'creator'>('catalog');

  // Interactive Playground state
  const [testInputParams, setTestInputParams] = useState<Record<string, any>>({});
  const [testExecutionResult, setTestExecutionResult] = useState<SkillTestExecution | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // New Skill creator state
  const [newName, setNewName] = useState('');
  const [newCodename, setNewCodename] = useState('');
  const [newCategory, setNewCategory] = useState<SkillCategory>('custom');
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newSelectedTools, setNewSelectedTools] = useState<string[]>(['workspace_search']);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];

  // Set default playground parameters when selected skill changes
  React.useEffect(() => {
    if (selectedSkill) {
      const initialParams: Record<string, any> = {};
      Object.entries(selectedSkill.parametersSchema).forEach(([k, schema]) => {
        initialParams[k] = schema.default || (schema.type === 'number' ? 100 : 'Test input');
      });
      setTestInputParams(initialParams);
      setTestExecutionResult(null);
    }
  }, [selectedSkillId]);

  const filteredSkills = skills.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.codename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleToggleActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = skills.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    setSkills(updated);
    saveSkills(updated);
  };

  const handleRunPlaygroundTest = async () => {
    if (!selectedSkill) return;
    setIsRunningTest(true);
    setStatusNotice(`Executing skill "${selectedSkill.name}" in playground...`);

    try {
      const result = await testExecuteSkill(selectedSkill, testInputParams);
      setTestExecutionResult(result);
      setStatusNotice(`Skill "${selectedSkill.name}" executed successfully in ${result.durationMs}ms!`);
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: any) {
      setStatusNotice(`Test error: ${err.message}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleCreateSkill = () => {
    if (!newName.trim() || !newInstructions.trim()) return;

    const newSkill: SkillDefinition = {
      id: `skill-${Date.now()}`,
      name: newName.trim(),
      codename: newCodename.trim().toLowerCase().replace(/\s+/g, '_') || 'custom_skill',
      description: newDesc.trim() || 'Custom user-authored cognitive skill.',
      author: 'You (Workspace Author)',
      version: '1.0.0',
      category: newCategory,
      icon: 'Flame',
      instructions: newInstructions.trim(),
      requiredTools: newSelectedTools,
      permissions: ['filesystem_read'],
      modelRequirements: {
        minContext: 32000,
        recommendedModel: 'gemini-3.8-flash',
      },
      isActive: true,
      isBuiltIn: false,
      parametersSchema: {
        inputQuery: { type: 'string', description: 'Input prompt or target resource', required: true },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newSkill, ...skills];
    setSkills(updated);
    saveSkills(updated);
    setSelectedSkillId(newSkill.id);
    setActiveTabMode('catalog');
    setNewName('');
    setNewCodename('');
    setNewDesc('');
    setNewInstructions('');
    setStatusNotice(`Created skill "${newSkill.name}"!`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div
          className={`p-4 sm:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`p-3 rounded-2xl border ${
                isLight
                  ? 'bg-purple-50 border-purple-200 text-purple-600'
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
              }`}
            >
              <PlayCircle className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Skills & Cognitive Capabilities</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {skills.length} Registered Skills
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Executable cognitive behaviors, declared tool dependencies, and interactive test playground.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabMode('catalog')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                activeTabMode === 'catalog'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-white/5 text-neutral-300'
              }`}
            >
              Catalog ({skills.length})
            </button>
            <button
              onClick={() => setActiveTabMode('playground')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTabMode === 'playground'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-white/5 text-neutral-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Test Playground
            </button>
            <button
              onClick={() => setActiveTabMode('creator')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTabMode === 'creator'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-white/5 text-neutral-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Author Skill
            </button>
          </div>
        </div>

        {/* Status Notice Toast */}
        {statusNotice && (
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Flame className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: CATALOG & DETAIL INSPECTOR
            ======================================================== */}
        {activeTabMode === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left list of skills */}
            <div className="lg:col-span-5 space-y-3">
              {/* Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {(['all', 'analysis', 'coding', 'research', 'multimodal'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white'
                        : isLight
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-white/5 text-neutral-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filteredSkills.map((skill) => {
                const isSelected = skill.id === selectedSkill?.id;
                return (
                  <div
                    key={skill.id}
                    onClick={() => setSelectedSkillId(skill.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-purple-50/70 border-purple-400 shadow-sm'
                          : 'bg-[#151928] border-purple-500/40 shadow-md'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-[#10141E] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{skill.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-300">
                            v{skill.version}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-2">{skill.description}</p>
                      </div>

                      <button
                        onClick={(e) => handleToggleActive(skill.id, e)}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                          skill.isActive
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-neutral-500/10 border-neutral-500/20 text-neutral-400'
                        }`}
                      >
                        {skill.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-medium text-neutral-400">
                      <span>Tools: {skill.requiredTools.join(', ')}</span>
                      <span className="text-[10px] uppercase font-bold text-neutral-500">{skill.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Detail Pane */}
            {selectedSkill && (
              <div
                className={`lg:col-span-7 p-6 rounded-3xl border space-y-6 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium font-semibold text-purple-400 uppercase tracking-wider">
                      Cognitive Specification • {selectedSkill.codename}
                    </span>
                    <h2 className="text-lg font-bold">{selectedSkill.name}</h2>
                    <span className="text-xs text-neutral-400">
                      By {selectedSkill.author} • Version {selectedSkill.version}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTabMode('playground')}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Open in Playground
                  </button>
                </div>

                {/* Instructions Prompt Pattern */}
                <div className="space-y-2">
                  <span className="text-xs font-bold font-medium text-purple-400 uppercase tracking-wider block">
                    Cognitive System Instructions
                  </span>
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 font-medium text-xs text-neutral-300 whitespace-pre-line leading-relaxed">
                    {selectedSkill.instructions}
                  </div>
                </div>

                {/* Declared Tool Dependencies */}
                <div className="space-y-2">
                  <span className="text-xs font-bold font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-purple-400" />
                    Required Tools ({selectedSkill.requiredTools.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkill.requiredTools.map((tool) => (
                      <span
                        key={tool}
                        className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium text-xs"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Declared Permissions */}
                <div className="space-y-2">
                  <span className="text-xs font-bold font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Security Permissions Scopes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkill.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-xs"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Model Requirements */}
                {selectedSkill.modelRequirements && (
                  <div className="p-3 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between text-xs font-medium text-neutral-400">
                    <span>Recommended Model: {selectedSkill.modelRequirements.recommendedModel}</span>
                    <span>Min Context: {selectedSkill.modelRequirements.minContext?.toLocaleString()} tokens</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SUB-TAB: TEST PLAYGROUND
            ======================================================== */}
        {activeTabMode === 'playground' && selectedSkill && (
          <div
            className={`max-w-4xl mx-auto p-6 rounded-3xl border space-y-6 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-medium font-bold text-purple-400 uppercase">
                  Interactive Execution Simulator
                </span>
                <h2 className="text-lg font-bold">Testing: {selectedSkill.name}</h2>
                <p className="text-xs text-neutral-400">
                  Input test parameters to run this skill, verify tool invocations, and inspect runtime output.
                </p>
              </div>

              <button
                onClick={handleRunPlaygroundTest}
                disabled={isRunningTest}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isRunningTest ? 'Running Skill...' : 'Execute Test Run'}
              </button>
            </div>

            {/* Parameter Input Fields */}
            <div className="space-y-3 p-4 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-xs font-bold font-medium text-neutral-400 uppercase block">
                Input Parameters
              </span>

              {Object.entries(selectedSkill.parametersSchema).map(([paramName, schema]) => (
                <div key={paramName} className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                    <span>{paramName} {schema.required && <span className="text-rose-400">*</span>}</span>
                    <span className="text-[10px] text-neutral-500">{schema.description}</span>
                  </label>
                  <input
                    type="text"
                    value={testInputParams[paramName] || ''}
                    onChange={(e) =>
                      setTestInputParams({ ...testInputParams, [paramName]: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none font-medium ${
                      isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Test Execution Output */}
            {testExecutionResult && (
              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Live Execution Trace ({testExecutionResult.durationMs}ms)
                </span>

                {/* Tool Invocations */}
                <div className="space-y-2">
                  <span className="text-[11px] font-medium text-neutral-400">Tools Invoked:</span>
                  {testExecutionResult.toolsInvoked.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/40 border border-white/5 font-medium text-xs flex items-center justify-between"
                    >
                      <span className="text-purple-300 font-bold">{t.toolName}</span>
                      <span className="text-emerald-400 text-[10px] uppercase font-bold">{t.status}</span>
                    </div>
                  ))}
                </div>

                {/* Synthesized Output */}
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 font-medium text-xs text-neutral-200 space-y-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block">
                    Synthesized Cognitive Output:
                  </span>
                  <pre className="whitespace-pre-wrap leading-relaxed text-neutral-300">
                    {testExecutionResult.outputResult}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SUB-TAB: SKILL CREATOR
            ======================================================== */}
        {activeTabMode === 'creator' && (
          <div
            className={`max-w-2xl mx-auto p-6 rounded-3xl border space-y-6 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
            }`}
          >
            <div>
              <h2 className="text-lg font-bold">Author New Agent Skill</h2>
              <p className="text-xs text-neutral-400">
                Define reusable instructions, required tool capabilities, and parameter schemas.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase font-medium block mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Database Migration Strategist"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase font-medium block mb-1">
                  Cognitive System Instructions
                </label>
                <textarea
                  rows={6}
                  placeholder="You are an expert... When analyzing... 1. Inspect schema. 2. Verify constraints. 3. Formulate output."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className={`w-full p-3 rounded-2xl border font-medium text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveTabMode('catalog')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSkill}
                  disabled={!newName.trim() || !newInstructions.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Save & Register Skill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
