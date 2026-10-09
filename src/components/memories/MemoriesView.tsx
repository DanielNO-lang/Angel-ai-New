/**
 * ANGEL AI — Memory Vault & Knowledge Bank
 * Dedicated memory management area supporting view, edit, and delete.
 * Distinguishes:
 *  - User-created memory (user_preference)
 *  - Long-term memory (important_fact, long_term_instruction, saved_knowledge)
 *  - Agent-specific memory (agent_memory)
 *  - Project memory (project_context)
 *  - Temporary conversation context (conversation_derived)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Archive,
  Bot,
  Brain,
  Check,
  Clock,
  Compass,
  Copy,
  Edit2,
  Filter,
  FolderGit2,
  Layers,
  MessageSquare,
  Mic,
  MicOff,
  CheckCircle2,
  Pause,
  Pin,
  Play,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Square,
  Tag,
  Trash2,
  User,
  Volume2,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { Memory, MemoryType } from '../../types';
import { Button, EmptyState } from '../ui';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useVoiceDictation } from '../../services/voice/useVoiceDictation';

// Categorical classifications for tabs
type MemoryClassificationFilter =
  | 'all'
  | 'user_created'
  | 'long_term'
  | 'agent_specific'
  | 'project'
  | 'temporary';

// High-fidelity fuzzy text matching helper (subsequence + token + edit-distance)
function fuzzyMatchText(query: string, target: string): boolean {
  if (!query) return true;
  if (!target) return false;
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();

  // 1. Direct substring
  if (t.includes(q)) return true;

  // 2. Token match
  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/[\s,._-]+/).filter(Boolean);

  const wordsMatch = qWords.every((qWord) => {
    if (t.includes(qWord)) return true;
    return tWords.some((tWord) => {
      if (isSubsequence(qWord, tWord)) return true;
      if (qWord.length >= 3 && levenshtein(qWord, tWord) <= (qWord.length > 5 ? 2 : 1)) return true;
      return false;
    });
  });

  if (wordsMatch) return true;

  // 3. Subsequence across combined text
  return isSubsequence(q.replace(/\s+/g, ''), t.replace(/\s+/g, ''));
}

function isSubsequence(pattern: string, text: string): boolean {
  let pIdx = 0;
  let tIdx = 0;
  while (pIdx < pattern.length && tIdx < text.length) {
    if (pattern[pIdx] === text[tIdx]) {
      pIdx++;
    }
    tIdx++;
  }
  return pIdx === pattern.length;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export const MemoriesView: React.FC = () => {
  const {
    memories,
    createMemory,
    updateMemory,
    deleteMemory,
    agents,
    projects,
    highlightedMemoryId,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MemoryClassificationFilter>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [memoryToDelete, setMemoryToDelete] = useState<{ id: string; title: string } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<MemoryType>('user_preference');
  const [formAgentId, setFormAgentId] = useState<string>('');
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formSource, setFormSource] = useState('Manual Entry');
  const [formConfidence, setFormConfidence] = useState<number>(0.95);
  const [formTags, setFormTags] = useState('');
  const [formPinned, setFormPinned] = useState(false);

  // Voice Note & MediaRecorder state
  const [isVoiceNoteOpen, setIsVoiceNoteOpen] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordingSeconds, setAudioRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioMeterLevels, setAudioMeterLevels] = useState<number[]>(new Array(14).fill(15));
  const [liveVoiceTranscript, setLiveVoiceTranscript] = useState('');
  const [voiceNoteToast, setVoiceNoteToast] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const previewAudioElRef = useRef<HTMLAudioElement | null>(null);
  const playingAudioElRef = useRef<HTMLAudioElement | null>(null);

  // Stop & cleanup recording
  const stopMediaRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // safe ignore
      }
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // safe ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // safe ignore
      }
    }
    setIsRecordingAudio(false);
  };

  const startMediaRecording = async () => {
    try {
      audioChunksRef.current = [];
      setRecordedAudioUrl(null);
      setRecordedAudioBlob(null);
      setLiveVoiceTranscript('');
      setAudioRecordingSeconds(0);

      // Access microphone via browser MediaDevices API
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // AudioContext & AnalyserNode for audio visualization
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          src.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const levels: number[] = [];
            const step = Math.floor(dataArray.length / 14) || 1;
            for (let i = 0; i < 14; i++) {
              const val = dataArray[i * step] || 0;
              levels.push(Math.max(15, Math.min(100, Math.round((val / 255) * 100))));
            }
            setAudioMeterLevels(levels);
            animationFrameRef.current = requestAnimationFrame(update);
          };
          update();
        }
      } catch (err) {
        console.warn('AudioContext meter setup note:', err);
      }

      // MediaRecorder initialization
      let recorder: MediaRecorder;
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      } else {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setRecordedAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecordingAudio(true);

      timerIntervalRef.current = setInterval(() => {
        setAudioRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Speech recognition for simultaneous transcription
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const sr = new SpeechRecognition();
        sr.continuous = true;
        sr.interimResults = true;
        sr.lang = 'en-US';
        sr.onresult = (evt: any) => {
          let str = '';
          for (let i = 0; i < evt.results.length; i++) {
            str += evt.results[i][0].transcript + ' ';
          }
          setLiveVoiceTranscript(str.trim());
        };
        try {
          sr.start();
          speechRecognitionRef.current = sr;
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.error('Failed to access microphone with MediaRecorder:', err);
      setVoiceNoteToast('Microphone access denied or unavailable: ' + (err.message || ''));
      setTimeout(() => setVoiceNoteToast(null), 4000);
      setIsVoiceNoteOpen(false);
    }
  };

  const handleSaveAudioNote = () => {
    stopMediaRecording();
    const content = liveVoiceTranscript.trim() || `Audio note recorded via browser MediaRecorder API (${audioRecordingSeconds}s)`;
    const title =
      liveVoiceTranscript.trim().slice(0, 48) ||
      `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

    createMemory({
      title,
      content,
      type: 'user_preference',
      source: 'MediaRecorder Audio Capture',
      confidence: 0.99,
      tags: ['audio-note', 'voice-note', 'media-recorder'],
      isPinned: false,
      audioUrl: recordedAudioUrl || undefined,
      audioDuration: audioRecordingSeconds,
    });

    setVoiceNoteToast(`Audio note saved to vault: "${title}"`);
    setTimeout(() => setVoiceNoteToast(null), 3500);
    setIsVoiceNoteOpen(false);
  };

  const togglePreviewPlayback = () => {
    if (!recordedAudioUrl) return;
    if (!previewAudioElRef.current) {
      const audio = new Audio(recordedAudioUrl);
      previewAudioElRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioElRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioElRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handlePlayMemoryAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      if (playingAudioElRef.current) {
        playingAudioElRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (playingAudioElRef.current) {
      playingAudioElRef.current.pause();
    }

    const audio = new Audio(url);
    playingAudioElRef.current = audio;
    audio.onended = () => setPlayingAudioId(null);
    audio.play().catch((err) => console.warn('Audio playback error:', err));
    setPlayingAudioId(id);
  };

  const formatAudioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync and scroll to highlighted memory if triggered from Global Search
  useEffect(() => {
    if (highlightedMemoryId) {
      setActiveFilter('all');
      setSelectedAgentFilter('all');
      setSearchQuery('');
      const timer = setTimeout(() => {
        const el = document.getElementById(`memory-card-${highlightedMemoryId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedMemoryId]);

  const openNewModal = (defaultCategory?: MemoryType) => {
    setEditingMemory(null);
    setFormTitle('');
    setFormContent('');
    setFormType(defaultCategory || 'user_preference');
    setFormAgentId('');
    setFormProjectId(projects[0]?.id || '');
    setFormSource('User Manual Configuration');
    setFormConfidence(0.98);
    setFormTags('');
    setFormPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (mem: Memory) => {
    setEditingMemory(mem);
    setFormTitle(mem.title);
    setFormContent(mem.content);
    setFormType(mem.type);
    setFormAgentId(mem.agentId || '');
    setFormProjectId(mem.projectId || '');
    setFormSource(mem.source || 'Manual Entry');
    setFormConfidence(mem.confidence ?? 0.95);
    setFormTags(mem.tags ? mem.tags.join(', ') : '');
    setFormPinned(Boolean(mem.isPinned));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const memoryPayload = {
      title: formTitle.trim(),
      content: formContent.trim(),
      type: formType,
      agentId: formType === 'agent_memory' ? (formAgentId || undefined) : (formAgentId || undefined),
      projectId: formType === 'project_context' ? (formProjectId || undefined) : (formProjectId || undefined),
      confidence: formConfidence,
      source: formSource.trim() || 'Manual configuration',
      tags: parsedTags.length > 0 ? parsedTags : ['workspace'],
      isPinned: formPinned,
    };

    if (editingMemory) {
      updateMemory(editingMemory.id, memoryPayload);
    } else {
      createMemory(memoryPayload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    setMemoryToDelete({ id, title });
  };

  const handleTogglePin = (mem: Memory) => {
    updateMemory(mem.id, { isPinned: !mem.isPinned });
  };

  const handleCopyContent = (mem: Memory) => {
    navigator.clipboard.writeText(`${mem.title}\n\n${mem.content}`);
    setCopiedId(mem.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Memory Classification Matcher
  const matchesClassification = (mem: Memory, filter: MemoryClassificationFilter): boolean => {
    switch (filter) {
      case 'all':
        return true;
      case 'user_created':
        return mem.type === 'user_preference';
      case 'long_term':
        return (
          mem.type === 'long_term_instruction' ||
          mem.type === 'important_fact' ||
          mem.type === 'saved_knowledge'
        );
      case 'agent_specific':
        return mem.type === 'agent_memory' || Boolean(mem.agentId);
      case 'project':
        return mem.type === 'project_context' || Boolean(mem.projectId);
      case 'temporary':
        return mem.type === 'conversation_derived';
      default:
        return true;
    }
  };

  // Helper for category badge styling and human readable label
  const getCategoryMeta = (mem: Memory) => {
    if (mem.type === 'user_preference') {
      return {
        label: 'User-Created',
        sublabel: 'Preference',
        badgeClass: isLight
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-neutral-800 text-neutral-100 border-neutral-700',
        icon: <User className={`w-3 h-3 ${isLight ? 'text-indigo-600' : 'text-neutral-300'}`} />,
      };
    }
    if (mem.type === 'agent_memory' || mem.agentId) {
      const boundAgent = agents.find((a) => a.id === mem.agentId);
      return {
        label: 'Agent-Specific',
        sublabel: boundAgent ? boundAgent.name : 'Dedicated Agent',
        badgeClass: isLight
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-neutral-900 text-neutral-200 border-neutral-700',
        icon: <Bot className={`w-3 h-3 ${isLight ? 'text-purple-600' : 'text-neutral-400'}`} />,
      };
    }
    if (mem.type === 'project_context' || mem.projectId) {
      const boundProject = projects.find((p) => p.id === mem.projectId);
      return {
        label: 'Project Memory',
        sublabel: boundProject ? boundProject.name : 'Project Context',
        badgeClass: isLight
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-neutral-900 text-neutral-200 border-neutral-700',
        icon: <FolderGit2 className={`w-3 h-3 ${isLight ? 'text-blue-600' : 'text-neutral-400'}`} />,
      };
    }
    if (mem.type === 'conversation_derived') {
      return {
        label: 'Temporary Context',
        sublabel: 'Derived from Chat',
        badgeClass: isLight
          ? 'bg-slate-100 text-slate-600 border-slate-200 italic'
          : 'bg-neutral-950 text-neutral-400 border-neutral-800 italic',
        icon: <MessageSquare className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`} />,
      };
    }
    // Long term categories
    return {
      label: 'Long-Term Memory',
      sublabel: mem.type.replace('_', ' '),
      badgeClass: isLight
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-neutral-900 text-neutral-200 border-neutral-750',
      icon: <Brain className={`w-3 h-3 ${isLight ? 'text-emerald-600' : 'text-neutral-400'}`} />,
    };
  };

  // Counts for each tab
  const counts = {
    all: memories.length,
    user_created: memories.filter((m) => m.type === 'user_preference').length,
    long_term: memories.filter(
      (m) =>
        m.type === 'long_term_instruction' ||
        m.type === 'important_fact' ||
        m.type === 'saved_knowledge'
    ).length,
    agent_specific: memories.filter((m) => m.type === 'agent_memory' || Boolean(m.agentId)).length,
    project: memories.filter((m) => m.type === 'project_context' || Boolean(m.projectId)).length,
    temporary: memories.filter((m) => m.type === 'conversation_derived').length,
  };

  // Filtered dataset with comprehensive fuzzy matching
  const filteredMemories = memories.filter((mem) => {
    if (!matchesClassification(mem, activeFilter)) return false;
    if (selectedAgentFilter !== 'all' && mem.agentId !== selectedAgentFilter) return false;

    if (searchQuery.trim()) {
      const boundAgent = agents.find((a) => a.id === mem.agentId);
      const agentName = boundAgent ? boundAgent.name : '';
      const boundProject = projects.find((p) => p.id === mem.projectId);
      const projectName = boundProject ? boundProject.name : '';

      const matchTitle = fuzzyMatchText(searchQuery, mem.title);
      const matchContent = fuzzyMatchText(searchQuery, mem.content);
      const matchSource = fuzzyMatchText(searchQuery, mem.source || '');
      const matchType = fuzzyMatchText(searchQuery, mem.type.replace(/_/g, ' '));
      const matchAgent = fuzzyMatchText(searchQuery, agentName);
      const matchProject = fuzzyMatchText(searchQuery, projectName);
      const matchTags = (mem.tags || []).some((t) => fuzzyMatchText(searchQuery, t));

      if (
        !matchTitle &&
        !matchContent &&
        !matchSource &&
        !matchType &&
        !matchAgent &&
        !matchProject &&
        !matchTags
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header - Fixed Non-Transparent */}
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
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
            >
              <Brain className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Memory Bank</h1>
                <span className="text-[11px] font-medium opacity-60">({memories.length} entries)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Record Audio Note Button via MediaRecorder */}
            <button
              onClick={() => {
                if (isRecordingAudio) {
                  stopMediaRecording();
                } else if (isVoiceNoteOpen) {
                  stopMediaRecording();
                  setIsVoiceNoteOpen(false);
                } else {
                  setIsVoiceNoteOpen(true);
                  startMediaRecording();
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer ${
                isRecordingAudio
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-white/10'
              }`}
              title="Record audio note directly via MediaRecorder"
            >
              {isRecordingAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Recording ({formatAudioTime(audioRecordingSeconds)})</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-pink-500" />
                  <span>Record Audio Note</span>
                </>
              )}
            </button>

            <button
              id="btn-add-memory"
              onClick={() => openNewModal()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-xs transition-all shrink-0 transform-gpu hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {/* Audio Note MediaRecorder Active Banner */}
        {isVoiceNoteOpen && (
          <div
            className={`p-4 rounded-2xl border transition-all animate-in fade-in duration-150 space-y-3 ${
              isLight
                ? 'bg-pink-50/80 border-pink-200 text-pink-950'
                : 'bg-pink-950/30 border-pink-500/30 text-pink-100'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider font-medium">
                  {isRecordingAudio ? 'MediaRecorder Active Recording' : 'Audio Note Captured'}
                </span>
                <span className="text-xs font-medium font-semibold px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-400">
                  {formatAudioTime(audioRecordingSeconds)}
                </span>
              </div>
              <button
                onClick={() => {
                  stopMediaRecording();
                  setIsVoiceNoteOpen(false);
                }}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Equalizer Visualizer Bars */}
            {isRecordingAudio && (
              <div className="flex items-center gap-1 h-7 py-1">
                {audioMeterLevels.map((lvl, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 rounded-full bg-gradient-to-t from-pink-500 to-rose-500 transition-all duration-75"
                    style={{ height: `${Math.max(15, lvl)}%` }}
                  />
                ))}
                <span className="text-[11px] opacity-70 ml-2 font-medium">
                  Listening to microphone stream with browser MediaRecorder...
                </span>
              </div>
            )}

            {/* Live speech transcript box */}
            <div
              className={`p-3 rounded-xl border text-xs font-medium min-h-[44px] flex items-center ${
                isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-white/10'
              }`}
            >
              {liveVoiceTranscript || (
                <span className="opacity-40 italic">
                  {isRecordingAudio
                    ? 'Speak directly into microphone... speech will transcribe here'
                    : 'Audio snippet captured'}
                </span>
              )}
            </div>

            {/* Audio Playback Preview if recording completed */}
            {recordedAudioUrl && !isRecordingAudio && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs">
                <button
                  type="button"
                  onClick={togglePreviewPlayback}
                  className="p-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white cursor-pointer"
                >
                  {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <span className="text-[11px] font-medium">Listen to recorded audio note</span>
                <span className="text-[10px] opacity-60 font-medium ml-auto">
                  {formatAudioTime(audioRecordingSeconds)}
                </span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  stopMediaRecording();
                  setIsVoiceNoteOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs opacity-60 hover:opacity-100 cursor-pointer"
              >
                Cancel
              </button>
              {isRecordingAudio ? (
                <button
                  type="button"
                  onClick={stopMediaRecording}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Finish Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startMediaRecording}
                  className="px-3 py-1.5 rounded-xl border border-pink-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Re-record</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveAudioNote}
                disabled={audioRecordingSeconds === 0 && !liveVoiceTranscript}
                className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Audio Note to Vault</span>
              </button>
            </div>
          </div>
        )}

        {/* Ephemeral Voice Toast */}
        {voiceNoteToast && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{voiceNoteToast}</span>
          </div>
        )}

        {/* Filter Tabs distinguishing all required memory classes */}
        <div className="space-y-3">
          {/* Classification Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            {[
              { id: 'all', label: 'All Knowledge', count: counts.all },
              { id: 'user_created', label: 'User-Created', count: counts.user_created },
              { id: 'long_term', label: 'Long-Term Memory', count: counts.long_term },
              { id: 'agent_specific', label: 'Agent-Specific', count: counts.agent_specific },
              { id: 'project', label: 'Project Context', count: counts.project },
              { id: 'temporary', label: 'Temporary Derived', count: counts.temporary },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as MemoryClassificationFilter)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeFilter === tab.id
                    ? isLight
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-semibold'
                      : 'bg-[#151926] text-white border border-indigo-500/40 shadow-xs font-semibold'
                    : isLight
                    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    activeFilter === tab.id
                      ? isLight
                        ? 'bg-indigo-100/80 text-indigo-800'
                        : 'bg-[#0E121B] text-indigo-400'
                      : isLight
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-white/5 text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Agent Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Fuzzy search memories, rules, tags, agents..."
                className={`w-full border rounded-xl px-3 py-2 pl-9 pr-8 text-xs outline-none transition-colors ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 shadow-2xs'
                    : 'bg-[#121620] border-white/10 text-neutral-200 placeholder-neutral-500 focus:border-indigo-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-2.5 top-2.5 p-0.5 rounded-md hover:bg-black/10 transition-colors ${
                    isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
              {searchQuery && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                  Fuzzy: {filteredMemories.length} match{filteredMemories.length === 1 ? '' : 'es'}
                </span>
              )}
              <span className={`text-[11px] font-medium whitespace-nowrap ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>Agent Filter:</span>
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className={`border rounded-xl px-2.5 py-2 text-xs outline-none cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500 shadow-2xs'
                    : 'bg-[#121620] border-white/10 text-neutral-300 focus:border-indigo-500'
                }`}
              >
              <option value="all">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <EmptyState
            icon={<Brain className={`w-6 h-6 ${isLight ? 'text-slate-400' : 'text-neutral-400'}`} />}
            title="No memories found"
            description="The memory vault stores verified preferences, agent operating boundaries, project directives, and temporary conversation facts."
            actionLabel="Add First Memory"
            onAction={() => openNewModal()}
          />
        ) : (
          filteredMemories.map((mem) => {
            const meta = getCategoryMeta(mem);
            const isHighlighted = highlightedMemoryId === mem.id;
            const boundAgent = agents.find((a) => a.id === mem.agentId);
            const boundProject = projects.find((p) => p.id === mem.projectId);

            return (
              <div
                key={mem.id}
                id={`memory-card-${mem.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isLight
                    ? isHighlighted
                      ? 'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-200 shadow-md'
                      : mem.isPinned
                      ? 'bg-white border-indigo-200/90 shadow-2xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    : isHighlighted
                    ? 'bg-neutral-900 border-neutral-400 ring-2 ring-neutral-300 shadow-xl'
                    : mem.isPinned
                    ? 'bg-[#121622] border-neutral-700/80 shadow-xs'
                    : 'bg-[#121622]/90 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Header Badges & Title */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Classification Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${meta.badgeClass}`}
                      >
                        {meta.icon}
                        <span>{meta.label}</span>
                        {meta.sublabel && meta.sublabel !== meta.label && (
                          <span className={`${isLight ? 'text-slate-500' : 'text-neutral-400'} font-sans`}>• {meta.sublabel}</span>
                        )}
                      </span>

                      {/* Associated Agent Pill if not already in badge */}
                      {boundAgent && mem.type !== 'agent_memory' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-600'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}>
                          <Bot className={`w-2.5 h-2.5 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`} />
                          <span>{boundAgent.name}</span>
                        </span>
                      )}

                      {/* Associated Project Pill if not already in badge */}
                      {boundProject && mem.type !== 'project_context' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-600'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}>
                          <FolderGit2 className={`w-2.5 h-2.5 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`} />
                          <span>{boundProject.name}</span>
                        </span>
                      )}

                      {/* Confidence Rating */}
                      {mem.confidence !== undefined && (
                        <span className={`text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                          Confidence: {Math.round(mem.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className={`text-sm font-semibold tracking-tight ${
                      isLight ? 'text-slate-900' : 'text-neutral-100'
                    }`}>
                      {mem.title}
                    </h3>

                    {/* Content */}
                    <p className={`text-xs leading-relaxed max-w-3xl whitespace-pre-wrap font-sans ${
                      isLight ? 'text-slate-600' : 'text-neutral-300'
                    }`}>
                      {mem.content}
                    </p>

                    {/* Audio Note Player Attachment */}
                    {mem.audioUrl && (
                      <div
                        className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                          isLight
                            ? 'bg-pink-50/70 border-pink-200 text-slate-800'
                            : 'bg-pink-950/20 border-pink-500/20 text-neutral-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handlePlayMemoryAudio(mem.id, mem.audioUrl!)}
                          className="p-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white transition-all cursor-pointer shadow-xs"
                          title="Play recorded audio note"
                        >
                          {playingAudioId === mem.id ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-pink-500 flex items-center gap-1">
                              <Volume2 className="w-3 h-3" />
                              <span>Recorded Voice Note</span>
                            </span>
                            {mem.audioDuration ? (
                              <span className="opacity-60 font-medium text-[10px]">
                                {formatAudioTime(mem.audioDuration)}
                              </span>
                            ) : null}
                          </div>
                          {/* Animated sound bars */}
                          <div className="flex items-center gap-1 h-3 mt-1">
                            {[25, 60, 90, 45, 100, 70, 35, 85, 55, 95, 40, 75].map((h, idx) => (
                              <div
                                key={idx}
                                className={`w-1 rounded-full transition-all duration-100 ${
                                  playingAudioId === mem.id
                                    ? 'bg-pink-500 animate-pulse'
                                    : 'bg-pink-400/40'
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Meta Footer: Source, Tags, Timestamps */}
                    <div className={`flex items-center gap-3 pt-2 text-[10px] font-medium flex-wrap border-t ${
                      isLight ? 'border-slate-100 text-slate-400' : 'border-neutral-850 text-neutral-500'
                    }`}>
                      {mem.source && (
                        <span className={isLight ? 'text-slate-500' : 'text-neutral-400'}>
                          Source: <strong className={isLight ? 'text-slate-700 font-medium' : 'text-neutral-300 font-normal'}>{mem.source}</strong>
                        </span>
                      )}

                      {mem.tags && mem.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className={`w-3 h-3 ${isLight ? 'text-slate-400' : 'text-neutral-600'}`} />
                          <span>{mem.tags.join(', ')}</span>
                        </div>
                      )}

                      <span>
                        Updated {new Date(mem.updatedAt || mem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Pin Toggle */}
                    <button
                      onClick={() => handleTogglePin(mem)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        mem.isPinned
                          ? isLight
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                            : 'bg-neutral-800 border-neutral-600 text-neutral-100 shadow-xs'
                          : isLight
                          ? 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
                          : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-800'
                      }`}
                      title={mem.isPinned ? 'Unpin memory' : 'Pin memory to top'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${mem.isPinned ? 'fill-current' : ''}`} />
                    </button>

                    {/* Copy Content */}
                    <button
                      onClick={() => handleCopyContent(mem)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Copy memory content"
                    >
                      {copiedId === mem.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Edit Memory */}
                    <button
                      onClick={() => openEditModal(mem)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Edit memory"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Memory */}
                    <button
                      onClick={() => handleDelete(mem.id, mem.title)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLight ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-neutral-500 hover:text-red-400'
                      }`}
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg border rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-neutral-100'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-100' : 'border-neutral-800'
            }`}>
              <div>
                <h3 className={`text-base font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                  {editingMemory ? 'Edit Memory' : 'Store New Memory'}
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Configure memory category, association, and confidence.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-neutral-100'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {/* Category / Type */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Memory Classification Category *
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as MemoryType)}
                  className={`w-full border rounded-lg px-2.5 py-2 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                  }`}
                >
                  <option value="user_preference">User-Created: Preference & Directive</option>
                  <option value="long_term_instruction">Long-Term Memory: System Instruction</option>
                  <option value="important_fact">Long-Term Memory: Architecture & Fact</option>
                  <option value="saved_knowledge">Long-Term Memory: Saved Knowledge</option>
                  <option value="agent_memory">Agent-Specific Memory: Operational Rule</option>
                  <option value="project_context">Project Memory: Architecture & Boundaries</option>
                  <option value="conversation_derived">Temporary Context: Conversation Derived</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Memory Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Visual Identity & Styling Standard"
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-hidden ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500' : 'bg-neutral-950 border-neutral-800 text-neutral-200 focus:border-neutral-500'
                  }`}
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Memory Content *</label>
                <textarea
                  rows={4}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="State the durable knowledge, constraint, or preference in clear language..."
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-hidden font-sans ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500' : 'bg-neutral-950 border-neutral-800 text-neutral-200 focus:border-neutral-500'
                  }`}
                />
              </div>

              {/* Conditional Associations: Agent / Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Associated Agent</label>
                  <select
                    value={formAgentId}
                    onChange={(e) => setFormAgentId(e.target.value)}
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <option value="">Global / Workspace-Wide</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.codename})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Associated Project</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <option value="">Global / No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source & Confidence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Provenance / Source</label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="e.g. User Configuration, PRD"
                    className={`w-full border rounded-lg px-3 py-1.5 text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                    Confidence ({Math.round(formConfidence * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={formConfidence}
                    onChange={(e) => setFormConfidence(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 mt-2"
                  />
                </div>
              </div>

              {/* Tags & Pinned */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2 space-y-1">
                  <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="e.g. design, styling, dark_mode"
                    className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-hidden ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  />
                </div>

                <div className="pt-4 flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPinned}
                      onChange={(e) => setFormPinned(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Pin to Top</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className={`flex items-center justify-end gap-2 pt-4 border-t ${
                isLight ? 'border-slate-100' : 'border-neutral-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isLight
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      : 'bg-neutral-100 hover:bg-white text-neutral-950'
                  }`}
                >
                  {editingMemory ? 'Save Changes' : 'Store Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Confirmation Dialog: Delete Memory */}
      <ConfirmDialog
        isOpen={!!memoryToDelete}
        onClose={() => setMemoryToDelete(null)}
        onConfirm={() => {
          if (memoryToDelete) {
            deleteMemory(memoryToDelete.id);
            setMemoryToDelete(null);
          }
        }}
        title="Delete Memory Item?"
        message={`"${memoryToDelete?.title}" will be permanently removed from your memory vault.`}
        confirmLabel="Delete Memory"
        isDestructive={true}
      />
    </div>
  );
};
