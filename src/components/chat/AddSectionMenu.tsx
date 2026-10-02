/**
 * ANGEL AI — Omnimodal "Add Section" Menu
 * Expands the input console (+) trigger to support:
 * 1. Upload Documents & Files (PDF, Code, Text, Spreadsheets)
 * 2. Create / Generate Images (Direct image creation prompt)
 * 3. Connectors (GitHub, Google Drive, Slack, Notion, PostgreSQL, Web Search)
 * 4. Skills & AI Tools (Python Code Interpreter, Deep Research, Scraper, Vision OCR)
 * 5. Memory & Knowledge Note (Add direct memory directive)
 * 6. Task / Milestone Directive (Create actionable task from context)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Sparkles,
  Link2,
  Wrench,
  Brain,
  CheckSquare,
  Globe,
  Database,
  Github,
  FolderOpen,
  Code2,
  Search,
  X,
  ChevronRight,
  Upload,
  Plus,
} from 'lucide-react';

export interface AddSectionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUploadFile: () => void;
  onSelectCreateImage: (promptPrefix: string) => void;
  onSelectConnector: (connectorName: string, promptTag: string) => void;
  onSelectSkill: (skillName: string, promptDirective: string) => void;
  onSelectAddMemory: () => void;
  onSelectCreateTask: () => void;
  isLight: boolean;
}

export const AddSectionMenu: React.FC<AddSectionMenuProps> = ({
  isOpen,
  onClose,
  onSelectUploadFile,
  onSelectCreateImage,
  onSelectConnector,
  onSelectSkill,
  onSelectAddMemory,
  onSelectCreateTask,
  isLight,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'connectors' | 'skills' | 'media'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    {
      id: 'upload',
      title: 'Upload Document / File',
      desc: 'PDF, Word, Code, CSV, Markdown, or Images from device',
      icon: Upload,
      color: 'text-indigo-500 bg-indigo-500/10',
      action: () => {
        onSelectUploadFile();
        onClose();
      },
      category: 'media',
    },
    {
      id: 'create_image',
      title: 'Generate / Create Image',
      desc: 'Create visual assets with Imagen & Gemini Flash',
      icon: ImageIcon,
      color: 'text-purple-500 bg-purple-500/10',
      action: () => {
        onSelectCreateImage('/imagine ');
        onClose();
      },
      category: 'media',
    },
    {
      id: 'connector_github',
      title: 'GitHub Repository Connector',
      desc: 'Connect repositories, pull requests, and commit logs',
      icon: Github,
      color: 'text-neutral-400 bg-neutral-500/10',
      action: () => {
        onSelectConnector('GitHub', '@connector:github ');
        onClose();
      },
      category: 'connectors',
    },
    {
      id: 'connector_gdrive',
      title: 'Google Drive / Docs Connector',
      desc: 'Ground in files, spreadsheets, and shared folders',
      icon: FolderOpen,
      color: 'text-amber-500 bg-amber-500/10',
      action: () => {
        onSelectConnector('Google Drive', '@connector:drive ');
        onClose();
      },
      category: 'connectors',
    },
    {
      id: 'connector_postgres',
      title: 'PostgreSQL / SQL Connector',
      desc: 'Query relational tables and database schemas',
      icon: Database,
      color: 'text-blue-500 bg-blue-500/10',
      action: () => {
        onSelectConnector('PostgreSQL', '@connector:database ');
        onClose();
      },
      category: 'connectors',
    },
    {
      id: 'connector_web',
      title: 'Live Web Grounding Connector',
      desc: 'Real-time Google search citations & verified facts',
      icon: Globe,
      color: 'text-emerald-500 bg-emerald-500/10',
      action: () => {
        onSelectConnector('Web Search', '@search:live ');
        onClose();
      },
      category: 'connectors',
    },
    {
      id: 'skill_python',
      title: 'Python Code Execution Skill',
      desc: 'Run mathematical calculations, charts, and data science',
      icon: Code2,
      color: 'text-sky-500 bg-sky-500/10',
      action: () => {
        onSelectSkill('Python Interpreter', '@skill:python ');
        onClose();
      },
      category: 'skills',
    },
    {
      id: 'skill_research',
      title: 'Deep Research Multi-Agent Skill',
      desc: 'Deep multi-source web crawl and analytical briefing',
      icon: Search,
      color: 'text-indigo-400 bg-indigo-500/10',
      action: () => {
        onSelectSkill('Deep Research', '@skill:deep_research ');
        onClose();
      },
      category: 'skills',
    },
    {
      id: 'add_memory',
      title: 'Add to Memory Vault',
      desc: 'Save persistent instructions or facts directly to memory',
      icon: Brain,
      color: 'text-pink-500 bg-pink-500/10',
      action: () => {
        onSelectAddMemory();
        onClose();
      },
      category: 'skills',
    },
    {
      id: 'create_task',
      title: 'Convert to Actionable Task',
      desc: 'Create a milestone item with deadline and priority',
      icon: CheckSquare,
      color: 'text-emerald-500 bg-emerald-500/10',
      action: () => {
        onSelectCreateTask();
        onClose();
      },
      category: 'skills',
    },
  ];

  const filteredCategories = categories.filter((item) => {
    if (activeTab !== 'all' && item.category !== activeTab) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      ref={menuRef}
      className={`absolute bottom-full left-0 mb-3 w-80 sm:w-96 rounded-2xl border shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-3 duration-150 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/60'
          : 'bg-[#121622] border-white/10 text-neutral-100 shadow-black/80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-600/10 text-indigo-500">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-tight">Add to Workspace</h4>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Connectors, image generation, tools & skills
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors ${
            isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-neutral-800 text-neutral-400'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'connectors', label: 'Connectors' },
          { id: 'skills', label: 'Skills & Tools' },
          { id: 'media', label: 'Media & Docs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Search */}
      <div className="relative mb-2">
        <Search
          className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${
            isLight ? 'text-slate-400' : 'text-neutral-500'
          }`}
        />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter additions..."
          className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none border transition-colors ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
              : 'bg-neutral-900 border-white/10 text-neutral-100 placeholder-neutral-500 focus:border-indigo-500'
          }`}
        />
      </div>

      {/* Items List */}
      <div className="max-h-72 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
        {filteredCategories.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                isLight
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-white/5 text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{item.title}</div>
                  <div
                    className={`text-[10px] truncate ${
                      isLight ? 'text-slate-500' : 'text-neutral-400'
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 opacity-40 ${
                  isLight ? 'text-slate-400' : 'text-neutral-500'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
