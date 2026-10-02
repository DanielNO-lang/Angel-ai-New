/**
 * ANGEL AI — Reusable Moist Glass Confirmation Dialog
 * Used for permanent and irreversible actions (e.g. Recycle Bin purge, Agent delete, Task delete, Memory delete).
 */

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useAngel } from '../../context/AppContext';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message = 'This action is permanent and cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
}) => {
  const { settings } = useAngel();
  const isLight = settings.theme === 'light';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl backdrop-blur-xl border transition-all ${
          isLight
            ? 'bg-white/90 border-slate-200/80 text-slate-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_10px_30px_rgba(0,0,0,0.1)]'
            : 'bg-[#0E121B]/90 border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.6)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDestructive
                ? isLight
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
                : isLight
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-tight truncate">{title}</h3>
            <p className={`text-xs mt-0.5 line-clamp-2 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-inherit/40">
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isLight
                ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
