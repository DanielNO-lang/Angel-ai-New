/**
 * ANGEL AI — Agent Workflow Library
 * Visual drag-and-drop & click-to-import repository of pre-built workflow templates.
 */

import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Bot,
  ArrowRight,
  Check,
  Cpu,
  Globe,
  Code2,
  Eye,
  ShieldCheck,
  Zap,
  Download,
  GripVertical,
  X,
} from 'lucide-react';
import { Agent, ToolDefinition } from '../../types';

export interface WorkflowTemplate {
  id: string;
  name: string;
  codename: string;
  category: 'research' | 'code' | 'creative' | 'security' | 'operations';
  description: string;
  tagline: string;
  estimatedRuntime: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  stages: string[];
  modelConfig: {
    provider: 'gemini';
    modelId: string;
    temperature: number;
  };
  permissions: string[];
  systemInstructions: string;
}

export const PREBUILT_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: 'wf-market-intel',
    name: 'Competitor & Market Intelligence',
    codename: 'MARKET-INTEL-01',
    category: 'research',
    tagline: 'Autonomous web synthesis & competitor strategy monitor',
    description: 'Scrapes live web sources, monitors competitor updates, summarizes product announcements, and outputs an executive briefing.',
    estimatedRuntime: '45 seconds',
    icon: Globe,
    tags: ['Web Grounding', 'Synthesis', 'Automated'],
    stages: ['Target Discovery', 'Web Search Grounding', 'Data Extraction', 'Threat Analysis', 'Executive Briefing'],
    modelConfig: { provider: 'gemini', modelId: 'gemini-3.8-flash', temperature: 0.3 },
    permissions: ['workspace_read', 'tasks_manage', 'external_web'],
    systemInstructions: 'You are an elite competitive intelligence researcher. Ingest target company domains, extract core product pivots, pricing updates, and synthesize a structured competitive moat analysis.',
  },
  {
    id: 'wf-fullstack-synth',
    name: 'Full-Stack Schema & API Synthesizer',
    codename: 'CODE-SYNTH-02',
    category: 'code',
    tagline: 'Generates database schemas, ORMs, and secure REST endpoints',
    description: 'Transforms natural language requirements into complete PostgreSQL schemas, Drizzle migrations, TypeScript types, and validated API routes.',
    estimatedRuntime: '30 seconds',
    icon: Code2,
    tags: ['Code Gen', 'SQL', 'TypeScript'],
    stages: ['Schema Architecture', 'Constraint Validation', 'TypeScript Interface', 'Endpoint Generation', 'Test Harness'],
    modelConfig: { provider: 'gemini', modelId: 'gemini-3.8-flash', temperature: 0.2 },
    permissions: ['workspace_read', 'workspace_write', 'code_execution'],
    systemInstructions: 'You are a principal database engineer. Generate strict, production-ready schemas with primary keys, foreign keys, indexes, and full TypeScript typings.',
  },
  {
    id: 'wf-ui-auditor',
    name: 'Multimodal UI/UX Design Auditor',
    codename: 'VISION-AUDIT-03',
    category: 'creative',
    tagline: 'Visual screenshot inspection & accessibility scoring',
    description: 'Inspects user interfaces via Gemini multimodal vision to detect contrast defects, typographic inconsistencies, zero-pill violations, and layout flaws.',
    estimatedRuntime: '25 seconds',
    icon: Eye,
    tags: ['Vision Perception', 'WCAG', 'Design'],
    stages: ['Image Ingestion', 'Component Bounding', 'Contrast & WCAG Check', 'Visual Hierarchy Audit', 'Actionable Fixes'],
    modelConfig: { provider: 'gemini', modelId: 'gemini-3.8-flash', temperature: 0.4 },
    permissions: ['workspace_read', 'visual_perception'],
    systemInstructions: 'You are a senior design systems auditor. Inspect screenshots for visual hierarchy, typography scales, contrast ratios, and layout alignment.',
  },
  {
    id: 'wf-triage-security',
    name: 'Incident Response & Triage Worker',
    codename: 'TRIAGE-SEC-04',
    category: 'security',
    tagline: 'Log analysis, error grouping, and automated fix proposals',
    description: 'Parses production error stacks, correlates memory context and recent git commits, classifies severity, and drafts automated pull requests.',
    estimatedRuntime: '40 seconds',
    icon: ShieldCheck,
    tags: ['Security', 'DevOps', 'Incident'],
    stages: ['Log Stream Ingestion', 'Root Cause Analysis', 'Memory Cross-Reference', 'Severity Scoring', 'Fix Generation'],
    modelConfig: { provider: 'gemini', modelId: 'gemini-3.8-flash', temperature: 0.1 },
    permissions: ['workspace_read', 'workspace_write', 'memory_read', 'tasks_manage'],
    systemInstructions: 'You are a site reliability and security engineer. Analyze execution failures and propose minimal, high-confidence patches.',
  },
  {
    id: 'wf-content-engine',
    name: 'Content Marketing & Newsletter Engine',
    codename: 'CONTENT-ENGINE-05',
    category: 'operations',
    tagline: 'Multi-channel editorial drafting, SEO keywords & asset briefs',
    description: 'Converts product updates into publication-ready technical blog posts, newsletter dispatches, social threads, and prompt ideas for image generation.',
    estimatedRuntime: '35 seconds',
    icon: Zap,
    tags: ['Editorial', 'Social', 'SEO'],
    stages: ['Topic Ideation', 'Key Takeaway Extraction', 'Draft Synthesis', 'Tone Calibration', 'Multi-Channel Export'],
    modelConfig: { provider: 'gemini', modelId: 'gemini-3.8-flash', temperature: 0.7 },
    permissions: ['workspace_read', 'tasks_manage', 'memory_read'],
    systemInstructions: 'You are a tech editorial director. Craft compelling, authentic, jargon-free technical marketing narratives.',
  },
];

interface WorkflowLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  onImportWorkflow: (template: WorkflowTemplate) => void;
}

export const WorkflowLibrary: React.FC<WorkflowLibraryProps> = ({
  isOpen,
  onClose,
  isLight,
  onImportWorkflow,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedTemplate, setDraggedTemplate] = useState<WorkflowTemplate | null>(null);
  const [isDropOver, setIsDropOver] = useState(false);
  const [importedId, setImportedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredWorkflows = PREBUILT_WORKFLOWS.filter((wf) => {
    if (selectedCategory !== 'all' && wf.category !== selectedCategory) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, template: WorkflowTemplate) => {
    setDraggedTemplate(template);
    e.dataTransfer.setData('text/plain', template.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDropOver(true);
  };

  const handleDragLeave = () => {
    setIsDropOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOver(false);
    if (draggedTemplate) {
      onImportWorkflow(draggedTemplate);
      setImportedId(draggedTemplate.id);
      setTimeout(() => {
        setImportedId(null);
        onClose();
      }, 700);
      setDraggedTemplate(null);
    }
  };

  const handleQuickImport = (template: WorkflowTemplate) => {
    onImportWorkflow(template);
    setImportedId(template.id);
    setTimeout(() => {
      setImportedId(null);
      onClose();
    }, 700);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xl animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white/85 border-slate-200/80 text-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_50px_rgba(0,0,0,0.1)]'
            : 'bg-[#0E121B]/90 border-white/10 text-neutral-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_50px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isLight ? 'border-slate-200/60 bg-white/50' : 'border-white/5 bg-[#141824]/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Workflow Library</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Select or drag a pre-built template onto the drop zone to import.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200/80 text-slate-500' : 'hover:bg-white/10 text-neutral-400'
            }`}
            title="Close Library"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Drop Zone Banner for Drag and Drop Visual Importing */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
              isDropOver
                ? 'border-indigo-500 bg-indigo-500/15 scale-[1.01]'
                : isLight
                ? 'border-slate-300/80 bg-slate-50/50 text-slate-600'
                : 'border-white/10 bg-[#121622]/40 text-neutral-400'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Download className={`w-4 h-4 ${isDropOver ? 'animate-bounce' : ''}`} />
            </div>
            <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Drag & Drop Template Here to Import
            </h3>
            <p className="text-[11px] opacity-70">
              Drop any workflow template here or click "Import" to instantiate.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Templates' },
              { id: 'research', label: 'Market Research' },
              { id: 'code', label: 'Code & Schemas' },
              { id: 'creative', label: 'UI/UX Vision' },
              { id: 'security', label: 'Security & Triage' },
              { id: 'operations', label: 'Content Operations' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isLight
                    ? 'bg-white/80 border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                    : 'bg-[#121622]/80 border border-white/5 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Templates Visual Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkflows.map((template) => {
              const Icon = template.icon;
              const isJustImported = importedId === template.id;

              return (
                <div
                  key={template.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, template)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing hover:-translate-y-0.5 shadow-2xs group ${
                    isLight
                      ? 'bg-white/90 border-slate-200/90 text-slate-800 hover:border-indigo-400'
                      : 'bg-[#121622]/90 border-white/5 text-neutral-100 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold tracking-tight">{template.name}</h4>
                          <p className={`text-[10px] font-mono opacity-60 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                            {template.codename} • ~{template.estimatedRuntime}
                          </p>
                        </div>
                      </div>

                      <GripVertical className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 text-neutral-400" />
                    </div>

                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                      {template.description}
                    </p>

                    {/* Pipeline Stages Mini Pills */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        {template.stages.slice(0, 4).map((stg, i) => (
                          <span
                            key={stg}
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md border ${
                              isLight
                                ? 'bg-slate-50 border-slate-200 text-slate-600'
                                : 'bg-white/5 border-white/5 text-neutral-400'
                            }`}
                          >
                            {i + 1}. {stg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-3 mt-3 border-t border-inherit flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {template.tags.slice(0, 2).map((tg) => (
                        <span
                          key={tg}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400"
                        >
                          {tg}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleQuickImport(template)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isJustImported
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      }`}
                    >
                      {isJustImported ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Imported!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          <span>Import</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
