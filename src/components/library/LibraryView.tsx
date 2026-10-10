/**
 * ANGEL AI — Library Workspace
 * First-class asset and knowledge repository organizing:
 * - Files, Documents, Generated Media, Saved References,
 *   Project Materials, Reusable Resources, Uploaded Assets, Exported Artifacts.
 * Deeply connected to Chat, Projects, Media Studio, Agent Lab, and Memory.
 */

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  FileText,
  Image as ImageIcon,
  FolderGit2,
  FileCode,
  Tag,
  Star,
  Plus,
  Download,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Check,
  Copy,
  Clock,
  HardDrive,
  Maximize2,
  X,
  Share2,
  Menu,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { LibraryCategory, LibraryItem } from '../../types';

export const LibraryView: React.FC = () => {
  const {
    libraryItems,
    createLibraryItem,
    updateLibraryItem,
    deleteLibraryItem,
    toggleFavoriteLibraryItem,
    projects,
    activeProjectId,
    setActiveTab,
    createConversation,
    sendMessage,
    createMemory,
    settings,
    setMobileMenuOpen,
  } = useAngel();

  const isLight = settings.theme === 'light';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New item modal form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<LibraryCategory>('documents');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('Core, Reference');
  const [newLinkedProject, setNewLinkedProject] = useState<string>('');

  const categories: Array<{ id: string; label: string; count: number }> = useMemo(() => {
    return [
      { id: 'all', label: 'All Artifacts', count: libraryItems.length },
      { id: 'documents', label: 'Documents', count: libraryItems.filter((i) => i.category === 'documents').length },
      { id: 'files', label: 'Code & Files', count: libraryItems.filter((i) => i.category === 'files').length },
      { id: 'media', label: 'Generated Media', count: libraryItems.filter((i) => i.category === 'media').length },
      { id: 'references', label: 'References', count: libraryItems.filter((i) => i.category === 'references').length },
      { id: 'materials', label: 'Project Materials', count: libraryItems.filter((i) => i.category === 'materials').length },
      { id: 'resources', label: 'Resources & Prompts', count: libraryItems.filter((i) => i.category === 'resources').length },
    ];
  }, [libraryItems]);

  const filteredItems = useMemo(() => {
    return libraryItems.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedProjectId !== 'all' && item.projectId !== selectedProjectId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }
      return true;
    });
  }, [libraryItems, selectedCategory, selectedProjectId, searchQuery]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createLibraryItem({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      category: newCategory,
      type: newCategory === 'media' ? 'media' : newCategory === 'files' ? 'file' : 'document',
      content: newContent.trim() || undefined,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      projectId: newLinkedProject || undefined,
      sizeBytes: newContent.length * 2 || 1024,
    });

    setNewTitle('');
    setNewDescription('');
    setNewContent('');
    setIsCreateModalOpen(false);
  };

  const handleUseInChat = (item: LibraryItem) => {
    const convId = createConversation(undefined, item.projectId, `Discussion: ${item.title}`);
    setActiveTab('chat');
    sendMessage(`I am referencing **${item.title}** from my Library:\n\n${item.description || item.content || ''}`);
  };

  const handleSaveToMemory = (item: LibraryItem) => {
    createMemory({
      title: item.title,
      content: item.description || item.content || `Referenced library asset (${item.category}).`,
      type: 'saved_knowledge',
      confidence: 1.0,
      tags: ['library-saved', ...item.tags],
      projectId: item.projectId,
    });
  };

  const handleCopyLink = (item: LibraryItem) => {
    navigator.clipboard?.writeText(item.url || item.title);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: LibraryCategory) => {
    switch (category) {
      case 'documents':
      case 'materials':
        return FileText;
      case 'media':
        return ImageIcon;
      case 'files':
        return FileCode;
      case 'references':
        return BookOpen;
      default:
        return Layers;
    }
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 animate-in fade-in duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Sticky Header Bar with open sidebar icon on mobile/tablet */}
        <div
          className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs backdrop-blur-xl ${
            isLight
              ? 'bg-white/80 border-slate-200/80 text-slate-900'
              : 'bg-[#0B1020]/80 border-indigo-500/20 text-neutral-100 shadow-lg shadow-indigo-950/30'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Open sidebar trigger on mobile/tablet attached directly to header */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`md:hidden p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/10'
              }`}
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu className="w-5 h-5 text-indigo-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <span
                className={`p-1.5 rounded-xl border ${
                  isLight
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">Library</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search library documents, media, code, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none transition-colors ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                  : 'bg-white/5 border-white/10 text-white focus:border-indigo-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-white/5 border-white/10 text-white'
              }`}
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div
              className={`p-1 rounded-xl border flex items-center gap-1 ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
              }`}
            >
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? isLight
                      ? 'bg-white shadow-xs font-semibold'
                      : 'bg-white/15 font-semibold text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? isLight
                      ? 'bg-white shadow-xs font-semibold'
                      : 'bg-white/15 font-semibold text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10'
              }`}
            >
              <span>{c.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === c.id
                    ? 'bg-white/20 text-white'
                    : isLight
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-white/10 text-neutral-400'
                }`}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content Display */}
        {filteredItems.length === 0 ? (
          <div
            className={`p-12 text-center rounded-3xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <BookOpen className="w-10 h-10 mx-auto text-neutral-400 opacity-60 mb-3" />
            <h3 className="text-sm font-semibold mb-1">No Library Artifacts Found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
              Add documents, link project code, or generate media in Media Studio to populate your permanent Angel library.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
            >
              Add First Resource
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const Icon = getCategoryIcon(item.category);
              const linkedProj = projects.find((p) => p.id === item.projectId);

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between hover:shadow-lg ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-indigo-400 text-slate-900'
                      : 'bg-[#10141E] border-white/10 hover:border-indigo-500/40 text-neutral-100'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-2 rounded-xl border ${
                            isLight
                              ? 'bg-slate-100 border-slate-200 text-slate-700'
                              : 'bg-white/5 border-white/10 text-neutral-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] uppercase font-medium tracking-wider opacity-60">
                          {item.category}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleFavoriteLibraryItem(item.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          item.isFavorite
                            ? 'text-amber-400 bg-amber-400/10'
                            : 'text-neutral-400 hover:text-amber-400'
                        }`}
                        title="Toggle Favorite"
                      >
                        <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* Preview Image if Media */}
                    {item.category === 'media' && item.url && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-neutral-900">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Title & Desc */}
                    <h3 className="text-sm font-semibold leading-snug line-clamp-1 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                      {item.description || item.content || 'Durable knowledge resource.'}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {item.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className={`text-[10px] px-2 py-0.5 rounded-md ${
                            isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-neutral-300'
                          }`}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Meta & Actions */}
                  <div
                    className={`pt-3 border-t flex items-center justify-between text-[11px] text-neutral-400 ${
                      isLight ? 'border-slate-100' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {linkedProj && (
                        <span className="flex items-center gap-1 font-medium text-[10px] text-indigo-400">
                          <FolderGit2 className="w-3 h-3" />
                          {linkedProj.name.slice(0, 12)}
                        </span>
                      )}
                      <span>{(item.sizeBytes ? item.sizeBytes / 1024 : 1).toFixed(1)} KB</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-neutral-300'
                        }`}
                        title="Inspect Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUseInChat(item)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-neutral-300'
                        }`}
                        title="Use in Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteLibraryItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List Mode Table */
          <div
            className={`rounded-2xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
            }`}
          >
            <div className="divide-y divide-white/5">
              {filteredItems.map((item) => {
                const Icon = getCategoryIcon(item.category);
                const linkedProj = projects.find((p) => p.id === item.projectId);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleFavoriteLibraryItem(item.id)}
                        className="text-neutral-400 hover:text-amber-400 cursor-pointer"
                      >
                        <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <span
                        className={`p-2 rounded-xl border ${
                          isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold truncate">{item.title}</h4>
                        <p className="text-[11px] text-neutral-400 truncate">{item.description || item.content}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {linkedProj && (
                        <span className="hidden sm:inline-flex text-[10px] text-indigo-400 font-medium">
                          {linkedProj.name}
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400 font-medium">
                        {(item.sizeBytes ? item.sizeBytes / 1024 : 1).toFixed(1)} KB
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUseInChat(item)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteLibraryItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg h-full p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar border-l shadow-2xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E121B] border-white/10 text-neutral-100'
            }`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-400">
                  {selectedItem.category} Artifact
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-lg font-bold">{selectedItem.title}</h2>
                <p className="text-xs text-neutral-400 mt-1">{selectedItem.description}</p>
              </div>

              {selectedItem.url && selectedItem.category === 'media' && (
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <img src={selectedItem.url} alt={selectedItem.title} className="w-full object-cover max-h-64" />
                </div>
              )}

              {/* Content Body Viewer */}
              {selectedItem.content && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Content</label>
                  <pre
                    className={`p-3.5 rounded-xl text-xs font-medium overflow-x-auto whitespace-pre-wrap ${
                      isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/5 text-neutral-200'
                    }`}
                  >
                    {selectedItem.content}
                  </pre>
                </div>
              )}

              {/* Metadata Grid */}
              <div
                className={`p-4 rounded-2xl border space-y-2 text-xs font-medium ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex justify-between">
                  <span className="opacity-60">Artifact ID</span>
                  <span>{selectedItem.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Category</span>
                  <span className="capitalize">{selectedItem.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">MIME Type</span>
                  <span>{selectedItem.mimeType || 'application/octet-stream'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">File Size</span>
                  <span>{(selectedItem.sizeBytes ? selectedItem.sizeBytes / 1024 : 1).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Created</span>
                  <span>{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Drawer Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={() => handleUseInChat(selectedItem)}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reference in Chat</span>
              </button>
              <button
                onClick={() => handleSaveToMemory(selectedItem)}
                className="px-3.5 py-2 rounded-xl border border-purple-500/30 hover:bg-purple-500/10 text-purple-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save to Memory</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Resource Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E121B] border-white/10 text-neutral-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Add Library Resource</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Resource Title</label>
                <input
                  type="text"
                  placeholder="e.g., API Authentication Spec v2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as LibraryCategory)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    <option value="documents">Document</option>
                    <option value="files">Code / File</option>
                    <option value="references">Reference</option>
                    <option value="materials">Material</option>
                    <option value="resources">Resource / Prompt</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Link Project</label>
                  <select
                    value={newLinkedProject}
                    onChange={(e) => setNewLinkedProject(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    <option value="">No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <input
                  type="text"
                  placeholder="Brief summary of the artifact"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Content / Markdown / Code</label>
                <textarea
                  rows={4}
                  placeholder="Paste or write document content here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Engineering, Architecture, Spec"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
