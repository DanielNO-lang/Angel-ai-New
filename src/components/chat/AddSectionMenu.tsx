import React, { useEffect, useRef, useState } from 'react';
import {
  Upload, Image as ImageIcon, Film, Github, FolderOpen, Database, Globe,
  Code2, Search, Brain, CheckSquare, BarChart3, PenTool, Bot, X, Plus,
  ChevronRight
} from 'lucide-react';

export interface AddSectionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUploadFile: () => void;
  onSelectCreateImage: (promptPrefix: string) => void;
  onSelectCreateVideo?: (promptPrefix: string) => void;
  onSelectConnector: (connectorName: string, promptTag: string) => void;
  onSelectSkill: (skillName: string, promptDirective: string) => void;
  onSelectAddMemory: () => void;
  onSelectCreateTask: () => void;
  onSelectAgentTask?: () => void;
  onSelectDataAnalysis?: () => void;
  onSelectCanvas?: () => void;
  isLight: boolean;
}

export const AddSectionMenu: React.FC<AddSectionMenuProps> = ({
  isOpen, onClose, onSelectUploadFile, onSelectCreateImage, onSelectCreateVideo,
  onSelectConnector, onSelectSkill, onSelectAddMemory, onSelectCreateTask,
  onSelectAgentTask, onSelectDataAnalysis, onSelectCanvas, isLight,
}) => {
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    ['Upload file', 'PDF, documents, code, spreadsheets or images', Upload, () => onSelectUploadFile()],
    ['Create image', 'Generate a visual from your prompt', ImageIcon, () => onSelectCreateImage('/imagine ')],
    ['Create video', 'Generate a short video from a prompt', Film, () => onSelectCreateVideo?.('/video ')],
    ['Canvas / Build', 'Open the visual build workspace', PenTool, () => onSelectCanvas?.()],
    ['Data analysis', 'Analyze datasets and create charts', BarChart3, () => onSelectDataAnalysis?.()],
    ['Agent task', 'Launch an autonomous task', Bot, () => onSelectAgentTask?.()],
    ['GitHub', 'Repository, commits and pull requests', Github, () => onSelectConnector('GitHub', '@connector:github ')],
    ['Google Drive', 'Files, documents and spreadsheets', FolderOpen, () => onSelectConnector('Google Drive', '@connector:drive ')],
    ['PostgreSQL', 'Connect to a relational database', Database, () => onSelectConnector('PostgreSQL', '@connector:database ')],
    ['Web search', 'Ground the conversation in live web results', Globe, () => onSelectConnector('Web Search', '@search:live ')],
    ['Python', 'Run calculations and data workflows', Code2, () => onSelectSkill('Python', '@skill:python ')],
    ['Deep research', 'Research across multiple sources', Search, () => onSelectSkill('Deep Research', '@skill:deep_research ')],
    ['Memory', 'Save durable knowledge for your account', Brain, () => onSelectAddMemory()],
    ['Task', 'Turn the current work into a task', CheckSquare, () => onSelectCreateTask()],
  ] as const;

  const filtered = items.filter(([name, desc]) => `${name} ${desc}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} className={`absolute bottom-full left-0 mb-3 w-[min(92vw,390px)] rounded-2xl border p-3 z-50 shadow-2xl ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-white/10 text-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Plus className="w-4 h-4" /></span>
          <div><div className="text-xs font-semibold">Add</div><div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Bring another capability into this chat</div></div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><X className="w-4 h-4" /></button>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find an addition..." className={`w-full mb-2 rounded-xl px-3 py-2 text-xs outline-none border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-white/10'}`} />
      <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
        {filtered.map(([name, desc, Icon, action]) => (
          <button key={name} onClick={() => { action(); onClose(); }} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}>
            <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>
            <span className="min-w-0 flex-1"><span className="block text-xs font-semibold truncate">{name}</span><span className={`block text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{desc}</span></span>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>
        ))}
      </div>
    </div>
  );
};
