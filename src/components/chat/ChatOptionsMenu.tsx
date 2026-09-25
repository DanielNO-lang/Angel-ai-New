/**
 * ANGEL AI — Chat Options Side Popover Menu
 * Displayed right by the side of the 3-dot trigger button.
 * - Share chat
 * - Rename chat
 * - Pin/Unpin chat
 * - Move to secrets (hides chat from sidebar, stores in passcode-protected vault)
 * - Archive/Unarchive chat
 * - Delete chat
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  Edit2,
  Pin,
  Lock,
  Archive,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface ChatOptionsMenuProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenSecrets?: () => void;
  anchorPosition?: { top: number; left: number };
}

export const ChatOptionsMenu: React.FC<ChatOptionsMenuProps> = ({
  conversationId,
  isOpen,
  onClose,
  onOpenSecrets,
  anchorPosition,
}) => {
  const {
    conversations,
    renameConversation,
    deleteConversation,
    togglePinConversation,
    toggleArchiveConversation,
    moveConversationToSecret,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';
  const menuRef = useRef<HTMLDivElement>(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const conv = conversations.find((c) => c.id === conversationId);
  const [newTitle, setNewTitle] = useState(conv?.title || '');
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [isSecretSaved, setIsSecretSaved] = useState(false);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !conv) return null;

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      renameConversation(conversationId, newTitle.trim());
      setIsRenaming(false);
      onClose();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsShareCopied(true);
    setTimeout(() => {
      setIsShareCopied(false);
      onClose();
    }, 1200);
  };

  const handleMoveToSecrets = () => {
    moveConversationToSecret(conversationId);
    setIsSecretSaved(true);
    setTimeout(() => {
      onClose();
      if (onOpenSecrets) onOpenSecrets();
    }, 800);
  };

  const handleDelete = () => {
    deleteConversation(conversationId);
    onClose();
  };

  // Side positioning: Anchors immediately next to the clicked 3-dot item
  const topPos = anchorPosition?.top
    ? `${Math.max(10, Math.min(window.innerHeight - 260, anchorPosition.top - 20))}px`
    : '20%';

  const leftPos = anchorPosition?.left
    ? `${Math.min(window.innerWidth - 240, anchorPosition.left + 10)}px`
    : '16.5rem';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Invisible backdrop click catcher */}
      <div className="fixed inset-0 pointer-events-auto" onClick={onClose} />

      {/* Popover Card */}
      <div
        ref={menuRef}
        style={{
          top: topPos,
          left: leftPos,
        }}
        className={`pointer-events-auto fixed z-50 w-56 rounded-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 transition-all ${
          isLight
            ? 'bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/90 shadow-slate-300/60'
            : 'bg-[#0E121B]/95 backdrop-blur-md text-neutral-100 border border-white/10 shadow-black/80'
        }`}
      >
        {isRenaming ? (
          <form onSubmit={handleSaveRename} className="p-2 space-y-2.5">
            <span className="text-[11px] font-semibold">Rename conversation</span>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              className={`w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                  : 'bg-neutral-900 border-neutral-700 text-white focus:border-indigo-400'
              }`}
            />
            <div className="flex items-center justify-end gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                  isLight ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="text-xs space-y-0.5">
            {/* Share chat */}
            <button
              onClick={handleShare}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all ${
                isLight
                  ? 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                  : 'hover:bg-neutral-850/80 text-neutral-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-medium">
                  {isShareCopied ? 'Link Copied!' : 'Share chat'}
                </span>
              </div>
              {isShareCopied && <Check className="w-3 h-3 text-emerald-500" />}
            </button>

            {/* Rename chat */}
            <button
              onClick={() => setIsRenaming(true)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all ${
                isLight
                  ? 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                  : 'hover:bg-neutral-850/80 text-neutral-300 hover:text-white'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-medium">Rename chat</span>
            </button>

            {/* Pin chat */}
            <button
              onClick={() => {
                togglePinConversation(conversationId);
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all ${
                isLight
                  ? 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                  : 'hover:bg-neutral-850/80 text-neutral-300 hover:text-white'
              }`}
            >
              <Pin
                className={`w-3.5 h-3.5 shrink-0 ${
                  conv.pinned ? 'text-indigo-500 fill-indigo-500' : 'text-indigo-400'
                }`}
              />
              <span className="font-medium">{conv.pinned ? 'Unpin chat' : 'Pin chat'}</span>
            </button>

            {/* Move to Secrets */}
            <button
              onClick={handleMoveToSecrets}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all ${
                isLight
                  ? 'hover:bg-purple-50 text-purple-700'
                  : 'hover:bg-purple-950/40 text-purple-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="font-medium">
                  {isSecretSaved ? 'Moved to Secrets!' : 'Move to Secrets'}
                </span>
              </div>
              {isSecretSaved && <Check className="w-3 h-3 text-emerald-500" />}
            </button>

            {/* Archive chat */}
            <button
              onClick={() => {
                toggleArchiveConversation(conversationId);
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all ${
                isLight
                  ? 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                  : 'hover:bg-neutral-850/80 text-neutral-300 hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="font-medium">
                {conv.isArchived ? 'Unarchive chat' : 'Archive chat'}
              </span>
            </button>

            {/* Delete chat */}
            <button
              onClick={handleDelete}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all ${
                isLight ? 'hover:bg-red-50 text-red-600' : 'hover:bg-red-500/10 text-red-400'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="font-medium">Delete chat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
