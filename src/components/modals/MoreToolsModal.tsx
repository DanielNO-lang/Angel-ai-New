import React, { useRef, useEffect } from 'react';
import {
  Calendar,
  BookOpen,
  Image as ImageIcon,
  Users,
  Bot,
  Brain,
  BarChart3,
  Layers,
  Lock,
  Sliders,
  Sparkles,
  X,
  ChevronRight,
  Mic,
  Eye,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { NavigationTab } from '../../types';

interface MoreToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSecrets?: () => void;
  onOpenMediaStudio?: () => void;
  anchorPosition?: { top: number; left: number };
}

export const MoreToolsModal: React.FC<MoreToolsModalProps> = ({
  isOpen,
  onClose,
  onOpenSecrets,
  onOpenMediaStudio,
  anchorPosition,
}) => {
  const { settings, setActiveTab, isSidebarCollapsed } = useAngel();
  const isLight = settings.theme === 'light';
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToolSelect = (action: () => void) => {
    action();
    onClose();
  };

  const tools = [
    {
      label: 'Voice Mode',
      icon: Mic,
      action: () => setActiveTab('voice'),
      desc: 'Real-time conversational speech & audio synthesis',
    },
    {
      label: 'Visual Mode',
      icon: Eye,
      action: () => setActiveTab('visual_mode'),
      desc: 'Live camera & screen perception with Gemini 3.8 Flash',
    },
    {
      label: 'Marketplace',
      icon: Layers,
      action: () => setActiveTab('marketplace'),
      desc: 'Discover community agents, prompts & tools',
    },
    {
      label: 'Secret Vault',
      icon: Lock,
      action: () => {
        if (onOpenSecrets) onOpenSecrets();
      },
      desc: 'Passcode-protected confidential chats & files',
      badge: 'PIN',
    },
  ];

  // Side positioning: Anchors immediately next to the sidebar on desktop!
  const leftPos = anchorPosition?.left
    ? `${anchorPosition.left}px`
    : isSidebarCollapsed
    ? '4.5rem'
    : '16.5rem';

  const topPos = anchorPosition?.top
    ? `${Math.max(20, Math.min(window.innerHeight - 380, anchorPosition.top - 100))}px`
    : 'auto';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Invisible backdrop click catcher */}
      <div className="fixed inset-0 pointer-events-auto" onClick={onClose} />

      {/* Floating Side Popover */}
      <div
        ref={popoverRef}
        style={{
          left: leftPos,
          top: anchorPosition?.top ? topPos : undefined,
          bottom: anchorPosition?.top ? undefined : '4.5rem',
        }}
        className={`pointer-events-auto fixed z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl p-2.5 animate-in fade-in slide-in-from-left-2 duration-150 transition-all ${
          isLight
            ? 'bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 shadow-slate-300/50'
            : 'bg-[#0E121B]/95 backdrop-blur-md border border-white/10 text-neutral-100 shadow-black/80'
        }`}
      >
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-inherit mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500">
            More Options
          </span>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar p-1 pb-4">
          {tools.map((item, itemIdx) => {
            const Icon = item.icon;
            return (
              <button
                key={itemIdx}
                onClick={() => handleToolSelect(item.action)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                  isLight
                    ? 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    : 'hover:bg-neutral-850/80 text-neutral-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isLight
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-neutral-900 text-neutral-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-xs truncate">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isLight ? 'text-slate-400' : 'text-neutral-400'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>

                {item.badge ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
