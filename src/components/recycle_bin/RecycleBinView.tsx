/**
 * ANGEL AI — Recycle Bin View
 * - Fixed moist glass header
 * - Single / batch permanent delete with confirmation modal
 * - Zero verbose subtitles or descriptions (tooltips on hover)
 */

import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface DeletedItem {
  id: string;
  title: string;
  type: string;
  deletedAt: string;
  size: string;
}

export const RecycleBinView: React.FC = () => {
  const { settings } = useAngel();
  const isLight = settings.theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([
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
  const [itemToDelete, setItemToDelete] = useState<DeletedItem | null>(null);
  const [isEmptyBinConfirmOpen, setIsEmptyBinConfirmOpen] = useState(false);

  const handleRestore = (id: string) => {
    setRestoredId(id);
    setTimeout(() => {
      setDeletedItems((prev) => prev.filter((item) => item.id !== id));
      setRestoredId(null);
    }, 600);
  };

  const handleConfirmDeleteSingle = () => {
    if (!itemToDelete) return;
    setDeletedItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const handleConfirmEmptyBin = () => {
    setDeletedItems([]);
    setIsEmptyBinConfirmOpen(false);
  };

  const filtered = deletedItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`min-h-full transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      {/* Fixed Non-Transparent Header */}
      <div
        className={`sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0B0E14] border-white/10 text-neutral-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl border backdrop-blur-md ${
              isLight
                ? 'bg-red-500/10 border-red-500/20 text-red-600'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Recycle Bin</h1>
            <span className="text-[11px] font-medium opacity-60">
              {deletedItems.length} items preserved
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div
            className={`relative flex items-center px-3 py-1.5 rounded-xl border backdrop-blur-md transition-colors ${
              isLight
                ? 'bg-white/80 border-slate-200 text-slate-800'
                : 'bg-[#121622]/80 border-white/10 text-neutral-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-xs outline-none w-36 sm:w-48 placeholder-neutral-400"
            />
          </div>

          {deletedItems.length > 0 && (
            <button
              onClick={() => setIsEmptyBinConfirmOpen(true)}
              title="Empty all items"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Bin</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Deleted Items List with Moist Glass Cards */}
        <div
          className={`rounded-2xl border backdrop-blur-xl overflow-hidden shadow-sm ${
            isLight
              ? 'bg-white/70 border-slate-200/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_8px_24px_rgba(0,0,0,0.03)]'
              : 'bg-[#121622]/70 border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.4)]'
          }`}
        >
          {filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Trash2 className="w-7 h-7 mx-auto text-neutral-400 opacity-40" />
              <p className="text-xs font-semibold">Recycle bin is empty</p>
            </div>
          ) : (
            <div className="divide-y divide-inherit">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                    isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 border backdrop-blur-md ${
                        isLight
                          ? 'bg-slate-100 border-slate-200/80 text-slate-600'
                          : 'bg-white/5 border-white/10 text-neutral-400'
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
                        {item.deletedAt} • {item.size}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRestore(item.id)}
                      title="Restore item"
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isLight
                          ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                          : 'border-white/10 hover:bg-white/10 text-neutral-300'
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
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
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

      {/* Confirmation Dialog: Delete Single Item */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDeleteSingle}
        title="Permanently Delete Item?"
        message={`"${itemToDelete?.title}" will be permanently erased from your workspace.`}
        confirmLabel="Delete"
        isDestructive={true}
      />

      {/* Confirmation Dialog: Empty Recycle Bin */}
      <ConfirmDialog
        isOpen={isEmptyBinConfirmOpen}
        onClose={() => setIsEmptyBinConfirmOpen(false)}
        onConfirm={handleConfirmEmptyBin}
        title="Empty Entire Recycle Bin?"
        message="All items in the recycle bin will be permanently erased. This cannot be undone."
        confirmLabel="Empty All"
        isDestructive={true}
      />
    </div>
  );
};
