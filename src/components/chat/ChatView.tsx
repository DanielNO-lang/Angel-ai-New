/**
 * ANGEL AI — Conversational Intelligence Workspace
 * Matches Image 1 ("New Chat (Empty State)"), Image 4, and Image 5 Panel 10:
 * - Empty state with Angel Emblem, "Hello again, Danny 🔮", action chips (Think, Search Engine, Browse Web, Model)
 * - "Try searching for:" suggestions: Latest tech news, Design a marketing plan, Python tutorial, Healthy meal ideas
 * - Streaming chat with tool inspection, agent selection, attachments, and rich markdown
 * - Composer dock with attachments, mic, Voice Node, and submission
 * - 100% reactive Light Mode and Dark Mode support
 */

import React, { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUp,
  Bot,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit2,
  Eye,
  FileCode,
  FileText,
  Globe,
  Headphones,
  Lightbulb,
  Menu,
  MessageSquare,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Video,
  Wrench,
  X,
  PenTool,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { Attachment, Conversation, CanvasBlock } from '../../types';
import { AngelLogo } from '../ui/AngelLogo';
import { AddSectionMenu } from './AddSectionMenu';
import { useVoiceDictation } from '../../services/voice/useVoiceDictation';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { getSavedCanvases, saveCanvases, setActiveCanvasId } from '../../services/canvas/canvasService';
import { VisualModePopup } from './VisualModePopup';
import { VoiceModeView } from '../voice/VoiceModeView';

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Fastest • Multimodal', badge: 'Default' },
  { id: 'gemini-3.5-pro', name: 'Gemini 3.5 Pro', tag: 'Deep Logic & Code Mastery', badge: 'Pro' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tag: 'Balanced Everyday', badge: 'Standard' },
  { id: 'gemini-3.1-pro-thinking', name: 'Gemini 3.1 Pro Thinking', tag: 'Extreme Reasoning & Proofs', badge: 'Reasoning' },
];

export const ChatView: React.FC = () => {
  const {
    activeConversation,
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    renameConversation,
    messages,
    sendMessage,
    isChatStreaming,
    agents,
    selectedAgentId,
    setSelectedAgentId,
    memories,
    setActiveTab,
    settings,
    setMobileMenuOpen,
    isLiveVoiceOpen,
    setIsLiveVoiceOpen,
    isLiveVoiceMinimized,
    setIsLiveVoiceMinimized,
    selectedModelId,
    setSelectedModelId,
    isThinkingActive,
    setIsThinkingActive,
  } = useAngel();

  const isLight = settings.theme === 'light';

  const [input, setInput] = useState('');
  const [isVisualPanelOpen, setIsVisualPanelOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeChip, setActiveChip] = useState<'think' | 'search' | 'browse' | 'model'>('think');
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [convToDelete, setConvToDelete] = useState<Conversation | null>(null);

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  // Web Speech API Voice Dictation with anti-echo deduplication
  const voiceDictation = useVoiceDictation({
    onResult: (finalText, interimText) => {
      const combined = interimText ? `${finalText} ${interimText}`.trim() : finalText;
      setInput(combined);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
      }
    },
    onFinal: (finalText) => {
      setInput(finalText);
    },
  });

  const toggleSpeechRecognition = () => {
    if (voiceDictation.isListening) {
      voiceDictation.stopListening();
    } else {
      voiceDictation.startListening(input);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatStreaming]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isChatStreaming) return;

    const textToSend = input;
    const filesToSend = attachments;
    setInput('');
    setAttachments([]);

    let convId = activeConversationId;
    if (!convId || !conversations.some((c) => c.id === convId)) {
      convId = createConversation(selectedAgentId);
    }

    await sendMessage(textToSend, filesToSend, convId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const isImg = file.type.startsWith('image/');
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: isImg ? 'image' : 'file',
          size: file.size,
          mimeType: file.type,
          dataUrl: reader.result as string,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleOpenInCanvas = (content: string) => {
    const isCode = content.includes('```') || content.includes('function') || content.includes('import ') || content.includes('interface ');
    const cleanContent = content.replace(/^```[a-zA-Z]*\n?|```$/g, '');
    const newBlock: CanvasBlock = {
      id: `block-from-chat-${Date.now()}`,
      type: isCode ? 'code' : 'markdown',
      title: isCode ? 'Code Artifact (from Chat)' : 'Document Extract (from Chat)',
      content: cleanContent,
      language: isCode ? 'typescript' : undefined,
    };

    const savedCanvases = getSavedCanvases();
    const activeTargetCanvas = savedCanvases[0];
    if (activeTargetCanvas) {
      const updated = {
        ...activeTargetCanvas,
        blocks: [...activeTargetCanvas.blocks, newBlock],
        updatedAt: new Date().toISOString(),
      };
      saveCanvases(savedCanvases.map((c) => (c.id === updated.id ? updated : c)));
      setActiveCanvasId(updated.id);
    }
    setActiveTab('canvas');
  };

  const quickSearchSuggestions = [
    { label: 'Latest tech news', prompt: 'Summarize the latest major tech and AI breakthroughs today.' },
    { label: 'Design a marketing plan', prompt: 'Outline a go-to-market product launch marketing strategy.' },
    { label: 'Python tutorial', prompt: 'Provide a beginner-friendly tutorial for building a fast REST API with FastAPI in Python.' },
    { label: 'Healthy meal ideas', prompt: 'Suggest 5 quick high-protein nutritious meal prep ideas with recipes.' },
  ];

  return (
    <div
      className={`flex flex-col h-full w-full overflow-hidden transition-colors ${
        isLight ? 'bg-transparent text-slate-800' : 'bg-transparent text-neutral-100'
      }`}
    >
      {/* Main Conversational Workspace */}
      <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden">
        {/* Top Conversation Status Header: Fixed Glassy Header with Chat Title */}
        <div
          className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between text-xs sticky top-0 z-30 shadow-xs backdrop-blur-xl transition-colors shrink-0 ${
            isLight
              ? 'bg-white/80 border-slate-200/80 text-slate-900'
              : 'bg-[#0B1020]/80 border-indigo-500/20 text-neutral-100 shadow-lg shadow-indigo-950/30'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`md:hidden p-1.5 rounded-xl transition-colors ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-900'
              }`}
              aria-label="Open navigation drawer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`p-1.5 rounded-xl border ${
                  isLight
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
                  {activeConversation?.title || 'New Conversation'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => createConversation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all cursor-pointer"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="relative flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar overscroll-contain">
          {messages.length === 0 ? (
            /* ========================================================
               IMAGE 1: "New Chat (Empty State)"
               Emblem + "Hello again, Danny 🔮" + 4 Filter Pills + "Try searching for:"
               ======================================================== */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-lg mx-auto animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-xs">
                <AngelLogo size={46} glow={true} />
              </div>

              <div className="space-y-1.5">
                <h2
                  className={`text-xl font-bold tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Hello again, Danny 🔮
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  What would you like Angel to help you with today?
                </p>
              </div>

              {/* Action Filter Pills Row (Think, Search Engine, Browse Web, Model) */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setIsThinkingActive(!isThinkingActive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isThinkingActive
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                      : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
                  }`}
                  title="Toggle Deep Analytical Thinking"
                >
                  <Lightbulb className={`w-3.5 h-3.5 ${isThinkingActive ? 'text-amber-400 fill-amber-400/40' : 'text-amber-400'}`} />
                  <span>Think {isThinkingActive ? 'ON' : ''}</span>
                </button>

                <button
                  onClick={() => setActiveChip('search')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeChip === 'search'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>Search Engine</span>
                </button>

                <button
                  onClick={() => setActiveChip('browse')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeChip === 'browse'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Browse Web</span>
                </button>

                <button
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isModelMenuOpen
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
                  }`}
                  title="Choose Intelligence Model"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{currentModel.name}</span>
                </button>
              </div>

              {/* Suggestions Prompt (Image 1: "Try searching for:") */}
              <div className="w-full space-y-2.5 pt-2">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider block ${
                    isLight ? 'text-slate-400' : 'text-neutral-400'
                  }`}
                >
                  Try searching for:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {quickSearchSuggestions.map((sug) => (
                    <button
                      key={sug.label}
                      onClick={() => {
                        let convId = activeConversationId;
                        if (!convId || !conversations.some((c) => c.id === convId)) {
                          convId = createConversation(selectedAgentId);
                        }
                        sendMessage(sug.prompt, undefined, convId);
                      }}
                      className={`p-3 rounded-xl transition-all duration-200 transform-gpu hover:-translate-y-0.5 cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 shadow-2xs'
                          : 'bg-[#121622]/90 hover:bg-[#181E2E] border border-white/5 text-neutral-300 shadow-md'
                      }`}
                    >
                      <span className="text-xs font-semibold block">{sug.label}</span>
                      <span className="text-[10px] opacity-60 line-clamp-1 mt-0.5">{sug.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Render Messages with Framer Motion Smooth Transition & Layout Animation */
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{
                      duration: 0.24,
                      ease: [0.22, 1, 0.36, 1],
                      layout: { duration: 0.2 },
                    }}
                    className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                  {!isUser && (
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-neutral-900 text-indigo-400'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white font-normal'
                        : isLight
                        ? 'bg-white border border-slate-200/80 text-slate-800'
                        : 'bg-[#131722] border border-white/5 text-neutral-200'
                    }`}
                  >
                    {/* Attachments Preview */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mb-2 space-y-1.5">
                        {message.attachments.map((att) => (
                          <div
                            key={att.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs ${
                              isLight ? 'bg-slate-100 text-slate-700' : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {att.type === 'image' ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span className="truncate max-w-[200px]">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Discovered Tool Executions */}
                    {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mb-2.5 space-y-1.5">
                        {message.toolCalls.map((tc) => (
                          <div
                            key={tc.id}
                            className={`p-2 rounded-xl text-xs font-medium border ${
                              isLight
                                ? 'bg-slate-50 border-slate-200 text-slate-700'
                                : 'bg-neutral-950/80 border-neutral-800 text-neutral-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="font-semibold">{tc.toolName}</span>
                              </div>
                              <span
                                className={`text-[10px] font-medium ${
                                  tc.status === 'completed'
                                    ? 'text-emerald-500'
                                    : 'text-amber-500'
                                }`}
                              >
                                {tc.status}
                              </span>
                            </div>
                            {tc.output && (
                              <p className="text-[11px] mt-1.5 pt-1.5 border-t border-inherit font-sans">
                                {typeof tc.output === 'string' ? tc.output : JSON.stringify(tc.output)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Content */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : message.content ? (
                      <div className="markdown-body leading-relaxed text-sm">
                        <Markdown>{message.content}</Markdown>
                      </div>
                    ) : message.isStreaming ? (
                      <div className="flex items-center gap-2 py-1 text-xs text-indigo-400 font-medium animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Angel is thinking...</span>
                      </div>
                    ) : null}

                    {!isUser && message.isError && !message.isStreaming && (
                      <div
                        role="alert"
                        className={`mt-3 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isLight
                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                          : 'border-amber-500/30 bg-amber-500/5 text-amber-200'}`}
                      >
                        <span>Angel could not complete this response. Your message is still here.</span>
                        <button
                          type="button"
                          onClick={() => {
                            const failedIndex = messages.findIndex((item) => item.id === message.id);
                            const previousUser = failedIndex >= 0
                              ? messages.slice(0, failedIndex).reverse().find((item) => item.role === 'user')
                              : undefined;
                            if (previousUser) {
                              void sendMessage(
                                previousUser.content,
                                previousUser.attachments,
                                message.conversationId,
                                message.id,
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-current/30 px-2 py-1 font-semibold hover:bg-amber-500/10"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retry
                        </button>
                      </div>
                    )}

                    {/* Streaming indicator */}
                    {message.isStreaming && message.content && (
                      <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse" />
                    )}

                    {/* Copy & Canvas Action Buttons */}
                    {!isUser && !message.isStreaming && message.content && (
                      <div className="absolute right-2 -bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => handleOpenInCanvas(message.content)}
                          className={`p-1 rounded-md shadow-md border ${
                            isLight
                              ? 'bg-white border-slate-200 text-cyan-600 hover:text-cyan-800'
                              : 'bg-neutral-900 border-neutral-800 text-cyan-400 hover:text-cyan-300'
                          }`}
                          title="Open extract in Canvas / Build"
                        >
                          <PenTool className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleCopy(message.id, message.content)}
                          className={`p-1 rounded-md shadow-md border ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                          title="Copy message"
                        >
                          {copiedMsgId === message.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Console (Image 1 Bottom Dock) - Always anchored to bottom with safe-area support */}
        <div
          className={`sticky bottom-0 z-30 p-3 md:p-4 pb-safe border-t transition-colors shrink-0 shadow-lg backdrop-blur-xl ${
            isLight
              ? 'border-slate-200/80 bg-white/80 text-slate-900'
              : 'border-indigo-500/20 bg-[#0B1020]/85 text-neutral-100 shadow-indigo-950/40'
          }`}
        >
          {/* Pending Attachments Strip */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-slate-100/80 dark:bg-[#151D33]/80">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="truncate max-w-[140px]">{att.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="text-neutral-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* In-Chat Live Voice Dock (Embedded directly inside chat, never taking user to a separate section) */}
          {isLiveVoiceOpen && !isLiveVoiceMinimized && (
            <div className="mb-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <VoiceModeView
                embedded={true}
                onClose={() => setIsLiveVoiceOpen(false)}
                onMinimize={() => setIsLiveVoiceMinimized(true)}
              />
            </div>
          )}

          <form
            onSubmit={handleSend}
            className={`relative flex items-center gap-1.5 sm:gap-2 rounded-2xl p-2 transition-all shadow-sm ${
              isLight
                ? 'bg-slate-50 border border-slate-300/80 focus-within:border-indigo-600 focus-within:bg-white'
                : 'bg-[#151D33]/90 border border-indigo-500/30 focus-within:border-indigo-400 backdrop-blur-md'
            }`}
          >
            {/* File Attachment Trigger & Omnimodal Add Section */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />

            {/* Omnimodal Add Section Menu */}
            <AddSectionMenu
              isOpen={isAddSectionOpen}
              onClose={() => setIsAddSectionOpen(false)}
              onSelectUploadFile={() => fileInputRef.current?.click()}
              onSelectCreateImage={(prefix) => {
                setInput((prev) => prefix + prev);
                textareaRef.current?.focus();
              }}
              onSelectConnector={(connectorName, tag) => {
                setInput((prev) => tag + prev);
                textareaRef.current?.focus();
              }}
              onSelectSkill={(skillName, directive) => {
                setInput((prev) => directive + prev);
                textareaRef.current?.focus();
              }}
              onSelectAddMemory={() => {
                setActiveTab('memories');
              }}
              onSelectCreateTask={() => {
                setActiveTab('tasks');
              }}
              onSelectDataAnalysis={() => {
                setActiveTab('data_analysis');
              }}
              onSelectCanvas={() => {
                setActiveTab('canvas');
              }}
              isLight={isLight}
            />

            <button
              type="button"
              onClick={() => setIsAddSectionOpen(!isAddSectionOpen)}
              className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                isAddSectionOpen
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Add documents, connectors, images, and tools"
              aria-label="Add to workspace"
            >
              <Plus className={`w-4 h-4 transition-transform duration-150 ${isAddSectionOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* Visual Mode in Chat Bar */}
            <button
              type="button"
              onClick={() => setIsVisualPanelOpen(true)}
              className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                isLight
                  ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60'
                  : 'text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800'
              }`}
              title="Visual Mode (Camera & Screen Perception)"
              aria-label="Visual Mode"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Think Mode Toggle (Deep Analytical Reasoning) */}
            <button
              type="button"
              onClick={() => setIsThinkingActive(!isThinkingActive)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isThinkingActive
                  ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={isThinkingActive ? 'Thinking Mode is ON (Deep analytical reasoning)' : 'Enable Deep Thinking Mode'}
              aria-label="Toggle Thinking Mode"
            >
              <Lightbulb className={`w-3.5 h-3.5 ${isThinkingActive ? 'text-amber-400 fill-amber-400/30' : ''}`} />
              <span className="hidden sm:inline">Think</span>
            </button>

            {/* Intelligence Model Switcher */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isModelMenuOpen
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
                title="Switch Intelligence Model"
                aria-label="Switch Model"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline font-medium text-[11px]">{currentModel.name.replace('Gemini ', '')}</span>
                <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isModelMenuOpen && (
                <div
                  className={`absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 w-64 rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-xl animate-in zoom-in-95 duration-150 ${
                    isLight ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/40' : 'bg-[#0F1424]/95 border-indigo-500/30 text-white shadow-black/80'
                  }`}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Select Intelligence Model
                  </div>
                  <div className="space-y-1 mt-1">
                    {AVAILABLE_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModelId(m.id);
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                          selectedModelId === m.id
                            ? 'bg-indigo-600 text-white'
                            : isLight
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'hover:bg-neutral-800/80 text-neutral-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold flex items-center gap-1.5">
                            <span>{m.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/25 font-normal">{m.badge}</span>
                          </div>
                          <div className="text-[10px] opacity-75">{m.tag}</div>
                        </div>
                        {selectedModelId === m.id && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Textarea Input (Placeholder: "Message Angel...") */}
            <textarea
              ref={textareaRef}
              id="textarea-chat-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={voiceDictation.isListening ? 'Listening... speak into your microphone' : 'Message Angel...'}
              className={`flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm outline-none py-2 px-1 max-h-40 custom-scrollbar ${
                isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-neutral-500'
              }`}
            />

            {/* Browser Web Speech API Dictate Icon (Speech to Text) */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                voiceDictation.isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40'
                  : isLight
                  ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={voiceDictation.isListening ? 'Stop dictation' : 'Dictate hands-free (Speech to Text)'}
              aria-label="Dictate message"
            >
              {voiceDictation.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Alternating Voice Mode vs Send Button */}
            {input.trim().length > 0 || attachments.length > 0 ? (
              <button
                type="submit"
                id="btn-chat-send"
                disabled={isChatStreaming}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shrink-0 shadow-xs cursor-pointer transform-gpu active:scale-95 animate-in zoom-in-90 duration-150"
                aria-label="Send message"
                title="Send message"
              >
                {isChatStreaming ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            ) : (
              <button
                type="button"
                id="btn-activate-voice"
                onClick={() => {
                  setIsLiveVoiceOpen(true);
                  setIsLiveVoiceMinimized(false);
                }}
                className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer transform-gpu active:scale-95 animate-in zoom-in-90 duration-150 ${
                  isLight
                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/80 shadow-2xs'
                    : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/30 shadow-xs'
                }`}
                title="Activate In-Chat Live Voice"
                aria-label="Activate Voice Mode"
              >
                <Headphones className="w-4 h-4" />
              </button>
            )}
          </form>

          <div
            className={`flex items-center justify-between px-2 pt-2 text-[10px] font-medium ${
              isLight ? 'text-slate-400' : 'text-neutral-400'
            }`}
          >
            <span>Routing: {currentModel.name} {isThinkingActive ? '• Deep Thinking Mode' : ''} • Hardware Secured</span>
            <span>Enter to send • Shift+Enter for newline</span>
          </div>
        </div>
      </div>

      {isVisualPanelOpen && <VisualModePopup onClose={() => setIsVisualPanelOpen(false)} />}

      {/* Confirmation Dialog: Delete Thread */}
      <ConfirmDialog
        isOpen={!!convToDelete}
        onClose={() => setConvToDelete(null)}
        onConfirm={() => {
          if (convToDelete) {
            deleteConversation(convToDelete.id);
            setConvToDelete(null);
          }
        }}
        title="Delete Conversation Thread?"
        message={`"${convToDelete?.title}" will be permanently erased.`}
        confirmLabel="Delete Thread"
        isDestructive={true}
      />
    </div>
  );
};
