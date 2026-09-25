/**
 * ANGEL AI — Media Studio View (Full Workspace View)
 * Matches Image 2 Panel 8/9 & Image 3 Panel 9:
 * - Subtabs: Images, Documents, Creations, Templates
 * - Search bar: "Search your library..."
 * - "Generate Image" prompt synthesis
 * - "Create amazing visuals" banner
 * - Grid of image cards with glowing borders, prompt tags, and actions
 * - 100% Light Mode and Dark Mode fidelity
 */

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Search,
  Download,
  Eye,
  Plus,
  Filter,
  Layers,
  Wand2,
  Copy,
  Check,
  FolderOpen,
  Film,
  FileText,
  Sliders,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

export const MediaStudioView: React.FC = () => {
  const { settings } = useAngel();
  const isLight = settings.theme === 'light';

  const [activeSubTab, setActiveSubTab] = useState<'images' | 'documents' | 'creations' | 'templates'>('images');
  const [searchQuery, setSearchQuery] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '9:16'>('16:9');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [mediaItems, setMediaItems] = useState([
    {
      id: 'media-1',
      title: 'Neural Core Visualization',
      prompt: 'Futuristic glowing neural intelligence core, ethereal holographic AI orb pulsating with violet data streams',
      category: 'images',
      url: '/src/assets/images/ai_intelligence_clip_1790265840519.jpg',
      ratio: '16:9',
      tags: ['AI', 'Neural', 'Cybernetic'],
      createdAt: '2 mins ago',
    },
    {
      id: 'media-2',
      title: 'Cyberpunk Metropolis Sunrise',
      prompt: 'Neon cyberpunk city skyline at golden hour with flying vehicles and volumetric fog reflections',
      category: 'images',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      ratio: '16:9',
      tags: ['Sci-Fi', 'Cityscape', 'Architecture'],
      createdAt: '1 hour ago',
    },
    {
      id: 'media-3',
      title: 'Futuristic Bioluminescent Landscape',
      prompt: 'Bioluminescent alien flora in deep mystical valley with aurora borealis and reflective crystalline lakes',
      category: 'images',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      ratio: '16:9',
      tags: ['Nature', 'Alien', 'Fantasy'],
      createdAt: 'Yesterday',
    },
    {
      id: 'media-4',
      title: 'Holographic User Interface System',
      prompt: '3D floating spatial computing UI with data visualizations, glowing glassmorphism dials and nodes',
      category: 'creations',
      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      ratio: '4:3',
      tags: ['Interface', 'HUD', 'Glass'],
      createdAt: '2 days ago',
    },
    {
      id: 'media-5',
      title: 'Cybernetic Female Avatar Portrait',
      prompt: 'Cinematic portrait of neural avatar with glowing fiber-optic hair and iridescent wings in midnight violet',
      category: 'templates',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      ratio: '1:1',
      tags: ['Portrait', 'Avatar', 'Wings'],
      createdAt: '3 days ago',
    },
  ]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const newItem = {
        id: `media-${Date.now()}`,
        title: promptInput.slice(0, 30) + '...',
        prompt: promptInput,
        category: 'images',
        url: '/src/assets/images/ai_intelligence_clip_1790265840519.jpg',
        ratio: aspectRatio,
        tags: ['Generated', 'AI Art'],
        createdAt: 'Just now',
      };
      setMediaItems((prev) => [newItem, ...prev]);
      setPromptInput('');
      setIsGenerating(false);
    }, 1200);
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredMedia = mediaItems.filter((item) => {
    if (activeSubTab !== 'images' && item.category !== activeSubTab) return false;
    if (!searchQuery.trim()) return true;
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 transition-colors border-inherit">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-xl border ${
                isLight
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
            </span>
            <span
              className={`text-xs font-mono uppercase tracking-wider ${
                isLight ? 'text-indigo-600 font-semibold' : 'text-indigo-400'
              }`}
            >
              Visual Generation & Canvas
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Media Studio</h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
            Generate, organize, and edit high-fidelity AI visuals, concepts, and media assets.
          </p>
        </div>

        {/* Subtab Switcher */}
        <div
          className={`flex items-center p-1 rounded-2xl border text-xs self-start sm:self-auto ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-neutral-900/80 border-white/5'
          }`}
        >
          {(['images', 'documents', 'creations', 'templates'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-xl font-medium capitalize transition-all ${
                activeSubTab === tab
                  ? isLight
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-[#151926] text-white font-semibold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Banner (Matching Image 2 Panel 8) */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-lg transition-all ${
          isLight
            ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-200/80'
            : 'bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-neutral-950 border-white/10'
        }`}
      >
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Sparkles className="w-3 h-3" />
            Studio Engine 3.0
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Create amazing visuals</h2>
          <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
            Turn your prompts into photorealistic scenes, 3D interfaces, and artistic concepts with real-time latent diffusion.
          </p>
        </div>

        {/* Prompt Input Generator Bar */}
        <form onSubmit={handleGenerate} className="relative z-10 mt-5 flex flex-col sm:flex-row gap-2 max-w-2xl">
          <div
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl border transition-colors ${
              isLight
                ? 'bg-white border-slate-300 focus-within:border-indigo-500 shadow-sm'
                : 'bg-neutral-900/90 border-white/10 focus-within:border-indigo-400'
            }`}
          >
            <Wand2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Describe what you want to create (e.g. ethereal cybernetic avatar in neon fog)..."
              className={`w-full bg-transparent text-xs outline-none ${
                isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-neutral-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as any)}
              className={`px-3 py-2 rounded-2xl text-xs font-medium border outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700'
                  : 'bg-neutral-900 border-white/10 text-neutral-300'
              }`}
            >
              <option value="16:9">16:9 Landscape</option>
              <option value="1:1">1:1 Square</option>
              <option value="4:3">4:3 Standard</option>
              <option value="9:16">9:16 Portrait</option>
            </select>

            <button
              type="submit"
              disabled={isGenerating || !promptInput.trim()}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 shrink-0 transform-gpu hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : 'Generate Image'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
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
            placeholder="Search your library..."
            className="w-full bg-transparent text-xs outline-none"
          />
        </div>

        <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
          Showing {filteredMedia.length} assets
        </span>
      </div>

      {/* Media Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className={`group rounded-3xl overflow-hidden border transition-all duration-200 transform-gpu hover:-translate-y-1 shadow-md hover:shadow-xl ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-slate-200/50 hover:border-indigo-400'
                : 'bg-[#121622] border-white/5 shadow-black/60 hover:border-indigo-500/40'
            }`}
          >
            {/* Visual Thumbnail */}
            <div className="relative aspect-video bg-neutral-950 overflow-hidden">
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                <span className="text-[10px] font-mono text-white/90 bg-black/50 px-2 py-0.5 rounded-lg backdrop-blur-xs">
                  {item.ratio}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyPrompt(item.id, item.prompt)}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 transition-colors"
                    title="Copy prompt"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={item.url}
                    download
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 transition-colors"
                    title="Download asset"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-semibold truncate group-hover:text-indigo-500 transition-colors">
                  {item.title}
                </h3>
                <span className={`text-[10px] shrink-0 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                  {item.createdAt}
                </span>
              </div>

              <p className={`text-[11px] line-clamp-2 leading-relaxed ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                {item.prompt}
              </p>

              {/* Tags */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-medium border ${
                      isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-neutral-900 text-neutral-400 border-white/5'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
