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
import {
  ArrowUp,
  Bot,
  Brain,
  Check,
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
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Video,
  Wrench,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { Attachment } from '../../types';
import { AngelLogo } from '../ui/AngelLogo';

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
  } = useAngel();

  const isLight = settings.theme === 'light';

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [isThreadsOpen, setIsThreadsOpen] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeChip, setActiveChip] = useState<'think' | 'search' | 'browse' | 'model'>('think');

  // Web Speech API Dictation (Speech to Text)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput((prev) => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            const next = prev + separator + transcript;
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
            }
            return next;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

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

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(textToSend, filesToSend);
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

  const filteredConversations = conversations.filter((c) => {
    if (c.isSecret) return false;
    if (!threadSearch.trim()) return true;
    return c.title.toLowerCase().includes(threadSearch.toLowerCase());
  });

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      renameConversation(id, editingTitle.trim());
    }
    setEditingConvId(null);
  };

  const quickSearchSuggestions = [
    { label: 'Latest tech news', prompt: 'Summarize the latest major tech and AI breakthroughs today.' },
    { label: 'Design a marketing plan', prompt: 'Outline a go-to-market product launch marketing strategy.' },
    { label: 'Python tutorial', prompt: 'Provide a beginner-friendly tutorial for building a fast REST API with FastAPI in Python.' },
    { label: 'Healthy meal ideas', prompt: 'Suggest 5 quick high-protein nutritious meal prep ideas with recipes.' },
  ];

  return (
    <div
      className={`flex h-full min-h-screen w-full overflow-hidden transition-colors ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      {/* Optional Recent Conversations Panel */}
      <aside
        className={`${
          isThreadsOpen ? 'w-72' : 'w-0'
        } transition-all duration-200 shrink-0 overflow-hidden flex flex-col border-r ${
          isLight
            ? 'bg-white border-slate-200/80 text-slate-800'
            : 'bg-[#0E121B] border-white/5 text-neutral-200'
        }`}
      >
        <div className="p-3 border-b border-inherit flex items-center justify-between">
          <span className="text-xs font-semibold">Conversations</span>
          <button
            onClick={() => createConversation()}
            className="p-1 rounded-lg text-indigo-500 hover:text-indigo-600 transition-colors"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2">
          <input
            type="text"
            placeholder="Search threads..."
            value={threadSearch}
            onChange={(e) => setThreadSearch(e.target.value)}
            className={`w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                : 'bg-neutral-900 border-neutral-800 text-white focus:border-indigo-400'
            }`}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                activeConversationId === conv.id
                  ? isLight
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'bg-indigo-600/20 text-indigo-300 font-medium'
                  : isLight
                  ? 'hover:bg-slate-100 text-slate-700'
                  : 'hover:bg-neutral-900 text-neutral-300'
              }`}
            >
              <span className="truncate">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Conversational Workspace */}
      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full min-w-0">
        {/* Top Conversation Status Header */}
        <div
          className={`px-4 py-2.5 border-b flex items-center justify-between text-xs transition-colors ${
            isLight
              ? 'border-slate-200/80 bg-white/80 text-slate-600'
              : 'border-white/5 bg-[#0E121B]/60 text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`md:hidden p-1.5 rounded-xl transition-colors ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-900'
              }`}
              aria-label="Open navigation drawer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsThreadsOpen(!isThreadsOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors ${
                isThreadsOpen
                  ? isLight
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'bg-neutral-800 text-white'
                  : isLight
                  ? 'hover:bg-slate-100 text-slate-600'
                  : 'hover:bg-neutral-900 text-neutral-300'
              }`}
              title="Toggle threads"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Threads</span>
              <span className="text-[10px] font-mono opacity-60">({conversations.length})</span>
            </button>

            {/* Agent Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-colors ${
                  isLight
                    ? 'bg-white border-slate-200/80 text-slate-800 hover:border-slate-300'
                    : 'bg-neutral-900/80 border-white/5 text-neutral-200 hover:border-white/10'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold">{activeAgent.name}</span>
                <span className="text-[10px] font-mono opacity-60">
                  ({activeAgent.modelConfig.modelId})
                </span>
              </button>

              {isAgentMenuOpen && (
                <div
                  className={`absolute left-0 top-full mt-1.5 w-64 rounded-2xl shadow-xl py-1 z-30 animate-in fade-in duration-100 ${
                    isLight
                      ? 'bg-white border border-slate-200 text-slate-800'
                      : 'bg-[#0E121B] border border-white/10 text-neutral-100'
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 border-b text-[10px] font-semibold uppercase tracking-wider ${
                      isLight ? 'border-slate-100 text-slate-400' : 'border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Select Agent
                  </div>
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgentId(agent.id);
                        setIsAgentMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        agent.id === selectedAgentId
                          ? isLight
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'bg-neutral-800 text-white font-medium'
                          : isLight
                          ? 'hover:bg-slate-50 text-slate-700'
                          : 'hover:bg-neutral-900 text-neutral-300'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{agent.name}</p>
                        <p className="text-[10px] opacity-60 truncate">{agent.tagline}</p>
                      </div>
                      {agent.id === selectedAgentId && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Context & Memory Indicators */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('memories')}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              title="Active Long-Term Memories"
            >
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-[11px]">{memories.length} memories</span>
            </button>
            <button
              onClick={() => setActiveTab('visual_mode')}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              title="Visual Context & Multimodal"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Visual Context</span>
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            /* ========================================================
               IMAGE 1: "New Chat (Empty State)"
               Emblem + "Hello again, Danny 🔮" + 4 Filter Pills + "Try searching for:"
               ======================================================== */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-lg mx-auto animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 shadow-md">
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

              {/* Action Filter Pills Row (Image 1: Think, Search Engine, Browse Web, GPT-4o) */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setActiveChip('think')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeChip === 'think'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Think</span>
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
                  onClick={() => setActiveChip('model')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeChip === 'model'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/5'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Gemini 3.8 Flash</span>
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
                      onClick={() => sendMessage(sug.prompt)}
                      className={`p-3 rounded-xl transition-all duration-200 transform-gpu hover:-translate-y-0.5 ${
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
            /* Render Messages */
            messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
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
                            className={`p-2 rounded-xl text-xs font-mono border ${
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
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  tc.status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-amber-500/10 text-amber-500'
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
                    ) : (
                      <div className="markdown-body leading-relaxed text-sm">
                        <Markdown>{message.content}</Markdown>
                      </div>
                    )}

                    {/* Streaming indicator */}
                    {message.isStreaming && (
                      <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse" />
                    )}

                    {/* Copy Button */}
                    {!isUser && !message.isStreaming && message.content && (
                      <div className="absolute right-2 -bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Console (Image 1 Bottom Dock) */}
        <div
          className={`p-3 md:p-4 border-t transition-colors ${
            isLight
              ? 'border-slate-200/80 bg-white/95'
              : 'border-white/5 bg-[#0B0E14]/90'
          }`}
        >
          {/* Pending Attachments Strip */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-slate-100/80 dark:bg-neutral-900">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 text-xs shadow-2xs"
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

          <form
            onSubmit={handleSend}
            className={`relative flex items-center gap-2 rounded-2xl p-2 transition-all shadow-sm ${
              isLight
                ? 'bg-slate-50 border border-slate-300/80 focus-within:border-indigo-600 focus-within:bg-white'
                : 'bg-[#121622] border border-white/10 focus-within:border-indigo-500/60'
            }`}
          >
            {/* File Attachment Trigger (+) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                isLight
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Attach file or image"
              aria-label="Attach file or image"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Visual Mode in Chat Bar */}
            <button
              type="button"
              onClick={() => setActiveTab('visual_mode')}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                isLight
                  ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60'
                  : 'text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800'
              }`}
              title="Visual Mode (Camera & Screen Perception)"
              aria-label="Visual Mode"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Textarea Input (Placeholder: "Message Angel...") */}
            <textarea
              ref={textareaRef}
              id="textarea-chat-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={isListening ? 'Listening... speak into your microphone' : 'Message Angel...'}
              className={`flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm outline-none py-2 px-1 max-h-40 custom-scrollbar ${
                isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-neutral-500'
              }`}
            />

            {/* Browser Web Speech API Dictate Icon (Speech to Text) */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40'
                  : isLight
                  ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={isListening ? 'Stop dictation' : 'Dictate hands-free (Speech to Text)'}
              aria-label="Dictate message"
            >
              <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
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
                onClick={() => setActiveTab('voice')}
                className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer transform-gpu active:scale-95 animate-in zoom-in-90 duration-150 ${
                  isLight
                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/80 shadow-2xs'
                    : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/30 shadow-xs'
                }`}
                title="Activate Voice Mode"
                aria-label="Activate Voice Mode"
              >
                <Headphones className="w-4 h-4" />
              </button>
            )}
          </form>

          <div
            className={`flex items-center justify-between px-2 pt-2 text-[10px] font-mono ${
              isLight ? 'text-slate-400' : 'text-neutral-400'
            }`}
          >
            <span>Routing: Google Gemini 3.8 Flash • Hardware Secured</span>
            <span>Enter to send • Shift+Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
