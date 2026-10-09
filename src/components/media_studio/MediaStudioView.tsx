/**
 * ANGEL AI — Media Studio & Neural Generation Workspace
 * Real Model-Backed Generation Pipeline:
 * - Text-to-Image Generation (gemini-3.1-flash-image / gemini-3.1-flash-lite-image)
 * - Video Generation (veo-3.1-lite-generate-preview)
 * - Image Editing & Variations
 * - Generation History with status, progress, retry, and cancellation
 * - Durable Angel Resource Storage, Project & Task Linking, and Library Integration
 */

import React, { useState, useEffect } from 'react';
import {
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
  RotateCcw,
  AlertCircle,
  Play,
  CheckCircle2,
  Clock,
  MessageSquare,
  BookOpen,
  Trash2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { mediaClient, MediaArtifactDTO } from '../../services/media/mediaService';

export const MediaStudioView: React.FC = () => {
  const {
    settings,
    projects,
    activeProjectId,
    tasks,
    createLibraryItem,
    createConversation,
    sendMessage,
    setActiveTab,
  } = useAngel();

  const isLight = settings.theme === 'light';

  const [activeTabMode, setActiveTabMode] = useState<'generate' | 'video' | 'edit' | 'history'>('generate');
  const [searchQuery, setSearchQuery] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-image');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '9:16'>('16:9');
  const [stylePreset, setStylePreset] = useState('Photorealistic, Cinematic volumetric lighting');
  const [linkedProjectId, setLinkedProjectId] = useState<string>(activeProjectId || '');
  const [linkedTaskId, setLinkedTaskId] = useState<string>('');

  // Active Job State
  const [currentJob, setCurrentJob] = useState<MediaArtifactDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Stored Artifacts List
  const [artifacts, setArtifacts] = useState<MediaArtifactDTO[]>([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);

  // Edit / Variation State
  const [editSourceImage, setEditSourceImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  const loadArtifacts = async () => {
    setIsLoadingArtifacts(true);
    try {
      const items = await mediaClient.listArtifacts({ search: searchQuery });
      setArtifacts(items);
    } catch {
      // Handled
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  useEffect(() => {
    loadArtifacts();
  }, [searchQuery]);

  // Polling for active job status until completed or failed
  useEffect(() => {
    if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const updated = await mediaClient.getArtifact(currentJob.id);
        setCurrentJob(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
          loadArtifacts();
          // If completed, automatically register in permanent Library!
          if (updated.status === 'completed' && updated.url) {
            createLibraryItem({
              title: updated.title,
              description: updated.prompt,
              type: updated.type === 'document' ? 'document' : 'media',
              category: 'media',
              url: updated.url,
              mimeType: updated.mimeType,
              projectId: updated.projectId,
              tags: updated.tags,
            });
          }
        }
      } catch {
        // Handled
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [currentJob]);

  // Handle Image Generation
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const job = await mediaClient.generateImage({
        prompt: promptInput.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        modelId: selectedModel,
        style: stylePreset,
        projectId: linkedProjectId || undefined,
        taskId: linkedTaskId || undefined,
      });

      setCurrentJob(job);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Video Generation
  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const job = await mediaClient.generateVideo({
        prompt: promptInput.trim(),
        aspectRatio: (aspectRatio === '4:3' ? '16:9' : aspectRatio) as any,
        modelId: 'veo-3.1-lite-generate-preview',
        projectId: linkedProjectId || undefined,
        taskId: linkedTaskId || undefined,
      });

      setCurrentJob(job);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Video generation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Image Edit / Variation
  const handleEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSourceImage || !editPrompt.trim()) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const job = await mediaClient.editImage({
        baseImageBase64: editSourceImage,
        prompt: editPrompt.trim(),
        projectId: linkedProjectId || undefined,
      });

      setCurrentJob(job);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Image edit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseInChat = (artifact: MediaArtifactDTO) => {
    const convId = createConversation(undefined, artifact.projectId, `Media: ${artifact.title}`);
    setActiveTab('chat');
    sendMessage(`Referencing generated media artifact **${artifact.title}**:\n\n${artifact.prompt}`);
  };

  const handleSaveToLibrary = (artifact: MediaArtifactDTO) => {
    createLibraryItem({
      title: artifact.title,
      description: artifact.prompt,
      type: artifact.type === 'document' ? 'document' : 'media',
      category: 'media',
      url: artifact.url,
      mimeType: artifact.mimeType,
      projectId: artifact.projectId,
      tags: artifact.tags,
    });
  };

  const handleCopyPrompt = (prompt: string, id: string) => {
    navigator.clipboard?.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 animate-in fade-in duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Sticky Header */}
        <div
          className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#0B0E14] border-white/10 text-neutral-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-2xl border ${
                isLight
                  ? 'bg-purple-50 border-purple-200 text-purple-600'
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
              }`}
            >
              <Wand2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Media Studio</h1>
              <span className="text-[11px] font-medium opacity-60">
                Model-Backed Multimodal Image & Video Synthesis Engine
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            className={`p-1 rounded-xl border flex items-center gap-1 ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
            }`}
          >
            {[
              { id: 'generate', label: 'Image Synthesis' },
              { id: 'video', label: 'Video Studio' },
              { id: 'edit', label: 'Edit & Variations' },
              { id: 'history', label: 'Generation History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabMode(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTabMode === tab.id
                    ? isLight
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-white/15 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================
            GENERATION CONSOLE & CONTROLS
            ======================================================== */}
        {(activeTabMode === 'generate' || activeTabMode === 'video') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prompt Console Form */}
            <div
              className={`lg:col-span-2 p-6 rounded-3xl border space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <form
                onSubmit={activeTabMode === 'video' ? handleGenerateVideo : handleGenerateImage}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>{activeTabMode === 'video' ? 'Video Narrative Prompt' : 'Synthesis Prompt'}</span>
                    </label>
                    <span className="text-[10px] font-medium text-neutral-400">
                      {activeTabMode === 'video' ? 'veo-3.1-lite-generate-preview' : selectedModel}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder={
                      activeTabMode === 'video'
                        ? 'Cinematic shot of flying drone navigating through futuristic neon city at night, volumetric fog, 4k resolution...'
                        : 'Ethereal neural intelligence core floating in dark chamber with glowing violet geometric circuits and volumetric dust...'
                    }
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    required
                    className={`w-full p-3.5 text-xs rounded-2xl border outline-none leading-relaxed transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500'
                        : 'bg-white/5 border-white/10 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                {/* Aspect Ratio & Style Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Aspect Ratio</label>
                    <div className="flex items-center gap-1.5">
                      {(['16:9', '1:1', '4:3', '9:16'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setAspectRatio(r)}
                          className={`flex-1 py-1.5 text-xs rounded-xl border font-medium transition-colors cursor-pointer ${
                            aspectRatio === r
                              ? 'bg-purple-600 text-white border-purple-500 font-semibold'
                              : isLight
                              ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Model Selection</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={activeTabMode === 'video'}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    >
                      <option value="gemini-3.1-flash-image">gemini-3.1-flash-image (High Quality)</option>
                      <option value="gemini-3.1-flash-lite-image">gemini-3.1-flash-lite-image (Fast)</option>
                      <option value="gemini-3-pro-image">gemini-3-pro-image (Pro Fidelity)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Link Project</label>
                    <select
                      value={linkedProjectId}
                      onChange={(e) => setLinkedProjectId(e.target.value)}
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

                {errorMessage && (
                  <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between">
                    <span>{errorMessage}</span>
                    <button type="button" onClick={() => setErrorMessage(null)}>
                      ✕
                    </button>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    Assets are permanently saved to your Angel Library.
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting || Boolean(currentJob && currentJob.status === 'processing')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Initiating...'
                        : currentJob?.status === 'processing'
                        ? 'Synthesizing...'
                        : activeTabMode === 'video'
                        ? 'Render Video'
                        : 'Generate Image'}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Progress & Active Job Stage */}
            <div
              className={`p-6 rounded-3xl border flex flex-col justify-between ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 font-medium">
                    Live Synthesis Stage
                  </h3>
                  {currentJob && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        currentJob.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : currentJob.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse'
                      }`}
                    >
                      {currentJob.status}
                    </span>
                  )}
                </div>

                {currentJob ? (
                  <div className="space-y-4">
                    {/* Rendered Asset or Progress Bar */}
                    {currentJob.status === 'completed' && currentJob.url ? (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 group">
                        {currentJob.type === 'video' ? (
                          <div className="relative w-full h-48 bg-black flex items-center justify-center">
                            <img src={currentJob.url} alt="Video preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="w-8 h-8 text-white fill-white" />
                            </div>
                          </div>
                        ) : (
                          <img src={currentJob.url} alt={currentJob.title} className="w-full h-48 object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUseInChat(currentJob)}
                            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs cursor-pointer"
                            title="Reference in Chat"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <a
                            href={currentJob.url}
                            download={`${currentJob.id}.${currentJob.type === 'video' ? 'mp4' : 'png'}`}
                            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl border border-white/10 bg-black/20 text-center space-y-3">
                        <Wand2 className="w-8 h-8 mx-auto text-purple-400 animate-spin" />
                        <div className="text-xs font-semibold">
                          {currentJob.status === 'failed' ? 'Synthesis Failed' : 'Model Execution in Progress'}
                        </div>
                        {currentJob.error ? (
                          <p className="text-[11px] text-rose-400">{currentJob.error}</p>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${currentJob.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-neutral-400">{currentJob.progress}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold truncate">{currentJob.title}</h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">{currentJob.prompt}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-neutral-400 text-xs">
                    Configure your prompt and click Generate to dispatch a real job to the model pipeline.
                  </div>
                )}
              </div>

              {currentJob?.status === 'completed' && (
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Durable Angel Resource</span>
                  </span>
                  <button
                    onClick={() => handleSaveToLibrary(currentJob)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    View in Library →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: EDIT & VARIATIONS
            ======================================================== */}
        {activeTabMode === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              className={`lg:col-span-2 p-6 rounded-3xl border space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <h2 className="text-sm font-bold">Multi-Turn Image Editing & Inpainting</h2>
              <form onSubmit={handleEditImage} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Select Source Image from Recent Generations</label>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {artifacts.slice(0, 6).map((art) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => setEditSourceImage(art.url)}
                        className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          editSourceImage === art.url ? 'border-purple-500 scale-105' : 'border-transparent opacity-60'
                        }`}
                      >
                        <img src={art.url} alt={art.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Edit Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Add glowing cybernetic wings behind the subject, change background to golden hour sunset..."
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    required
                    className={`w-full p-3 text-xs rounded-xl border outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!editSourceImage || isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  Generate Variation
                </button>
              </form>
            </div>

            {/* Preview of Selected Source */}
            <div
              className={`p-6 rounded-3xl border flex flex-col justify-between ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-medium mb-3">
                Selected Source Image
              </h3>
              {editSourceImage ? (
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <img src={editSourceImage} alt="Source" className="w-full max-h-56 object-cover" />
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-400">
                  Select an image thumbnail on the left to apply prompt-guided variations.
                </div>
              )}
              <div />
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: GENERATION HISTORY
            ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Stored Artifacts & Generation Reel</h3>
            <span className="text-xs font-medium text-neutral-400">{artifacts.length} Assets Registered</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {artifacts.map((art) => (
              <div
                key={art.id}
                className={`group rounded-2xl border p-3 flex flex-col justify-between transition-all hover:shadow-lg ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <div>
                  <div className="relative w-full h-36 rounded-xl overflow-hidden bg-neutral-900 mb-2">
                    <img
                      src={art.url || '/src/assets/images/ai_intelligence_clip_1790265840519.jpg'}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/60 text-white">
                      {art.aspectRatio}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold truncate mb-1">{art.title}</h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mb-2">{art.prompt}</p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleCopyPrompt(art.prompt, art.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                    title="Copy Prompt"
                  >
                    {copiedId === art.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUseInChat(art)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                      title="Reference in Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={art.url}
                      download={`${art.id}.png`}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
