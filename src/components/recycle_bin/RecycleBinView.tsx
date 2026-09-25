/**
 * ANGEL AI — Recycle Bin View
 * Matches Image 2 Panel 18:
 * - Search deleted items
 * - List of deleted files, chats, and records
 * - Restore & Permanently Delete controls
 * - Full Light Mode and Dark Mode support
 */

import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  FileText,
  MessageSquare,
  FolderGit2,
  Image as ImageIcon,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

export const RecycleBinView: React.FC = () => {
  const { settings } = useAngel();
  const isLight = settings.theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [deletedItems, setDeletedItems] = useState([
    {
      id: 'del-1',
      title: 'Old project wireframes.fig',
      type: 'project',
      deletedAt: '2 days ago',
      size: '14.2 MB',
    },
    {
      id: 'del-2',
      title: 'Image_017_draft.png',
      type: 'image',
      deletedAt: '4 days ago',
      size: '3.8 MB',
    },
    {
      id: 'del-3',
      title: 'Marketing plan deck - Q3.pdf',
      type: 'document',
      deletedAt: '1 week ago',
      size: '2.1 MB',
    },
    {
      id: 'del-4',
      title: 'Competitive Research Notes',
      type: 'chat',
      deletedAt: '2 weeks ago',
      size: '18 KB',
    },
  ]);

  const [restoredId, setRestoredId] = useState<string | null>(null);

  const handleRestore = (id: string) => {
    setRestoredId(id);
    setTimeout(() => {
      setDeletedItems((prev) => prev.filter((item) => item.id !== id));
      setRestoredId(null);
    }, 800);
  };

  const handleDeletePermanently = (id: string) => {
    setDeletedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEmptyBin = () => {
    setDeletedItems([]);
  };

  const filtered = deletedItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-inherit">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-xl border ${
                isLight
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </span>
            <span
              className={`text-xs font-mono uppercase tracking-wider ${
                isLight ? 'text-red-600 font-semibold' : 'text-red-400'
              }`}
            >
              Storage & Cleanup
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Recycle Bin</h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
            Items moved to the recycle bin are preserved for 30 days before being permanently purged.
          </p>
        </div>

        {deletedItems.length > 0 && (
          <button
            onClick={handleEmptyBin}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors self-start sm:self-auto flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Recycle Bin</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div
        className={`relative w-full sm:w-80 flex items-center px-3 py-2 rounded-2xl border transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-neutral-900/80 border-white/5 text-neutral-200'
        }`}
      >
        <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search deleted items..."
          className="w-full bg-transparent text-xs outline-none"
        />
      </div>

      {/* Deleted Items List */}
      <div
        className={`rounded-3xl border overflow-hidden shadow-md ${
          isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#121622] border-white/5'
        }`}
      >
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Trash2 className="w-8 h-8 mx-auto text-neutral-400 opacity-50" />
            <p className="text-xs font-semibold">Recycle bin is empty</p>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              No items currently pending deletion.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-inherit">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-900/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isLight ? 'bg-slate-100 text-slate-600' : 'bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : item.type === 'chat' ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-semibold truncate">{item.title}</h4>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Deleted {item.deletedAt} • {item.size}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRestore(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                      isLight
                        ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        : 'border-white/10 hover:bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {restoredId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Restored</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Restore</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeletePermanently(item.id)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
