import React, { useState } from 'react';
import {
  X,
  Search,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  Film,
  Download,
  Share2,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface MediaStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const MediaStudioModal: React.FC<MediaStudioModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const { settings, setActiveTab, sendMessage, createConversation } = useAngel();
  const isLight = settings.theme === 'light';

  const [activeTab, setActiveTabMode] = useState<'images' | 'videos'>('images');
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  const trendingItems = [
    {
      id: 'trend-1',
      title: 'Nature Vibes',
      type: 'Image',
      gradient: 'from-emerald-500/80 via-teal-600/70 to-indigo-700/80',
      prompt: 'Lush biometric rainforest canopy with ethereal mist and solar flare lighting',
    },
    {
      id: 'trend-2',
      title: 'Abstract Art',
      type: 'Image',
      gradient: 'from-purple-600/80 via-pink-600/70 to-amber-500/80',
      prompt: 'Vibrant fluid chromatic spheres floating in zero-gravity obsidian void, 8k render',
    },
    {
      id: 'trend-3',
      title: 'Product Shot',
      type: 'Image',
      gradient: 'from-blue-600/80 via-cyan-600/70 to-slate-800/90',
      prompt: 'Minimalist luxury glass cologne bottle on volcanic stone podium with soft warm spotlight',
    },
  ];

  const popularTemplates = [
    {
      id: 'tmpl-1',
      title: 'Social Media',
      type: 'Image',
      gradient: 'from-rose-500/80 via-orange-500/70 to-amber-600/80',
      prompt: 'Dynamic modern marketing card with bold typography and geometric 3D shapes',
    },
    {
      id: 'tmpl-2',
      title: 'Wallpaper',
      type: 'Image',
      gradient: 'from-indigo-600/80 via-purple-700/70 to-pink-500/80',
      prompt: 'Epic neon synthwave twilight mountain ridge with celestial galaxy aurora',
    },
    {
      id: 'tmpl-3',
      title: 'Banner',
      type: 'Image',
      gradient: 'from-cyan-600/80 via-blue-600/70 to-indigo-800/80',
      prompt: 'Futuristic wide panoramic cybernetic cityscape under crystalline starfield',
    },
  ];

  const handleGenerate = (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) return;

    if (onSelectPrompt) {
      onSelectPrompt(textToUse);
    } else {
      createConversation('agent-optic', undefined, textToUse.slice(0, 30));
      sendMessage(
        `[${activeTab === 'images' ? 'Generate Image' : 'Generate Video'}]: ${textToUse}`
      );
      setActiveTab('chat');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog (Image 3: Media Studio) */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-white text-slate-800 border border-slate-200'
            : 'bg-[#0E121B] text-neutral-100 border border-white/10'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'border-slate-100 bg-slate-50/70' : 'border-neutral-800/80 bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Media Studio</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Create high-fidelity visuals & dynamic motion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Top Segmented Controls: Images vs Videos */}
          <div
            className={`p-1 rounded-xl flex items-center max-w-xs mx-auto ${
              isLight ? 'bg-slate-100' : 'bg-neutral-900/80 border border-white/5'
            }`}
          >
            <button
              onClick={() => setActiveTabMode('images')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'images'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Images</span>
            </button>
            <button
              onClick={() => setActiveTabMode('videos')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'videos'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Videos</span>
            </button>
          </div>

          {/* Search / Generation Prompt Input */}
          <div className="relative">
            <input
              type="text"
              placeholder={`Describe what you want to create in ${activeTab}...`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              className={`w-full pl-10 pr-24 py-3 rounded-xl text-xs outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                  : 'bg-neutral-900/90 border border-white/10 text-white focus:border-indigo-500/50'
              }`}
            />
            <Search
              className={`absolute left-3.5 top-3.5 w-4 h-4 ${
                isLight ? 'text-slate-400' : 'text-neutral-500'
              }`}
            />
            <button
              onClick={() => handleGenerate()}
              className="absolute right-2 top-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Create</span>
            </button>
          </div>

          {/* Trending Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-tight">Trending</h3>
              <button
                onClick={() => alert('Viewing all trending prompts')}
                className="text-[11px] text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-medium"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {trendingItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleGenerate(item.prompt)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    isLight ? 'bg-slate-50 border border-slate-200/80' : 'bg-neutral-900 border border-white/5'
                  }`}
                >
                  <div
                    className={`h-24 w-full bg-gradient-to-tr ${item.gradient} flex items-center justify-center p-3 relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <Sparkles className="w-6 h-6 text-white/80 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate">{item.title}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        isLight ? 'text-slate-500' : 'text-neutral-400'
                      }`}
                    >
                      {item.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Templates Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-tight">Popular Templates</h3>
              <button
                onClick={() => alert('Viewing all template layouts')}
                className="text-[11px] text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-medium"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {popularTemplates.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleGenerate(item.prompt)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    isLight ? 'bg-slate-50 border border-slate-200/80' : 'bg-neutral-900 border border-white/5'
                  }`}
                >
                  <div
                    className={`h-24 w-full bg-gradient-to-tr ${item.gradient} flex items-center justify-center p-3 relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <ImageIcon className="w-6 h-6 text-white/80 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate">{item.title}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        isLight ? 'text-slate-500' : 'text-neutral-400'
                      }`}
                    >
                      {item.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
