/**
 * ANGEL AI — Voice Memo Quick Capture
 * Records audio snippets using browser MediaRecorder & Web Speech API,
 * transcribes and structures them via AI into actionable tasks with
 * priorities, tags, and subtasks.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  X,
  RotateCcw,
  Loader2,
  Calendar,
  AlertCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { TaskPriority } from '../../types';

interface VoiceMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceMemoModal: React.FC<VoiceMemoModalProps> = ({ isOpen, onClose }) => {
  const { createTask, setActiveTab, settings } = useAngel();
  const isLight = settings.theme === 'light';

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [audioLevelsArray, setAudioLevelsArray] = useState<number[]>(new Array(16).fill(15));

  // Transcript & AI State
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [createdTaskTitle, setCreatedTaskTitle] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Structured Task Preview
  const [taskPreview, setTaskPreview] = useState<{
    title: string;
    description: string;
    priority: TaskPriority;
    tags: string[];
    dueDate?: string;
  } | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecordingSeconds(0);
      setLiveTranscript('');
      setAudioUrl(null);
      setAudioBlob(null);
      setTaskPreview(null);
      setCreatedTaskTitle(null);
      setErrorMsg(null);
      setIsProcessingAI(false);
      // Auto-start recording for quick capture
      startRecording();
    } else {
      stopRecordingCleanup();
    }
  }, [isOpen]);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // safe ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // safe ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // safe ignore
      }
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      audioChunksRef.current = [];

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Setup AudioContext and AnalyserNode for real-time waveform visualization
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            const levels: number[] = [];
            const step = Math.floor(dataArray.length / 16) || 1;
            for (let i = 0; i < 16; i++) {
              const val = dataArray[i * step] || 0;
              levels.push(Math.max(15, Math.min(100, Math.round((val / 255) * 100))));
              sum += val;
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((average / 255) * 100)));
            setAudioLevelsArray(levels);
            animationFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      } catch (err) {
        console.warn('[VoiceMemo] AudioContext analysis not available:', err);
      }

      // 3. Setup MediaRecorder
      const options = { mimeType: 'audio/webm;codecs=opus' };
      let recorder: MediaRecorder;
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(options.mimeType)) {
        recorder = new MediaRecorder(stream, options);
      } else {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // 4. Timer setup
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // 5. Speech Recognition for real-time transcription
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let full = '';
          for (let i = 0; i < event.results.length; i++) {
            full += event.results[i][0].transcript + ' ';
          }
          setLiveTranscript(full.trim());
        };

        recognition.onerror = (e: any) => {
          console.warn('[VoiceMemo] Speech recognition notice:', e.error);
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          // safe ignore
        }
      }
    } catch (err: any) {
      console.error('[VoiceMemo] Microphone access error:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : 'Could not access microphone: ' + (err.message || 'Unknown error')
      );
      setIsRecording(false);
    }
  };

  const stopAndProcessRecording = async () => {
    stopRecordingCleanup();
    setIsProcessingAI(true);
    setErrorMsg(null);

    const transcriptToProcess = liveTranscript.trim() || 'Quick audio task captured via Voice Memo';

    try {
      // Call backend structured AI endpoint to extract an actionable task
      const prompt = `You are Angel AI's task extraction engine. Analyze this spoken voice memo transcript and convert it into a structured task:
Transcript: "${transcriptToProcess}"

Respond strictly with a JSON object matching this schema:
{
  "title": "Action-oriented task title (max 60 characters)",
  "description": "Clear details extracted from the speech",
  "priority": "low" | "medium" | "high" | "urgent",
  "tags": ["tag1", "tag2"],
  "dueDate": "optional ISO string or friendly date if mentioned like 'tomorrow', 'Friday', else null"
}`;

      let parsedTask = {
        title: transcriptToProcess.slice(0, 48),
        description: transcriptToProcess,
        priority: 'medium' as TaskPriority,
        tags: ['voice-memo', 'quick-capture'],
        dueDate: undefined,
      };

      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            systemInstruction:
              'You are a precise task extraction system. Return JSON only with no backticks.',
            modelId: 'models/gemini-2.5-flash',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const cleanText = (data.text || '')
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
          const aiJson = JSON.parse(cleanText);
          if (aiJson.title) {
            parsedTask = {
              title: aiJson.title,
              description: aiJson.description || transcriptToProcess,
              priority: (['low', 'medium', 'high', 'urgent'].includes(aiJson.priority)
                ? aiJson.priority
                : 'medium') as TaskPriority,
              tags: Array.isArray(aiJson.tags) && aiJson.tags.length > 0 ? aiJson.tags : ['voice-memo'],
              dueDate: aiJson.dueDate || undefined,
            };
          }
        }
      } catch (aiErr) {
        console.warn('[VoiceMemo] AI structuring fallback to heuristic parsing:', aiErr);
        // Heuristic fallback for offline/disconnected operation
        let priority: TaskPriority = 'medium';
        const lower = transcriptToProcess.toLowerCase();
        if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical')) {
          priority = 'urgent';
        } else if (lower.includes('high priority') || lower.includes('important')) {
          priority = 'high';
        } else if (lower.includes('low priority') || lower.includes('someday') || lower.includes('when you have time')) {
          priority = 'low';
        }

        parsedTask = {
          title: transcriptToProcess.slice(0, 50),
          description: `Transcribed from Voice Memo:\n"${transcriptToProcess}"`,
          priority,
          tags: ['voice-memo', 'audio-capture'],
          dueDate: undefined,
        };
      }

      setTaskPreview(parsedTask);
    } catch (err: any) {
      console.error('[VoiceMemo] Task processing error:', err);
      setErrorMsg('Failed to process voice memo into a task. You can try again.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleConfirmSaveTask = () => {
    if (!taskPreview) return;

    createTask({
      title: taskPreview.title,
      description: taskPreview.description,
      priority: taskPreview.priority,
      status: 'todo',
      tags: taskPreview.tags,
      dueDate: taskPreview.dueDate,
      subtasks: [],
    });

    setCreatedTaskTitle(taskPreview.title);
  };

  const toggleAudioPlayback = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
            : 'bg-[#101420] border-white/10 text-white shadow-black/90'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-[#0D101A]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-xs">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Voice Memo Quick Capture</h3>
              <p className="text-[11px] opacity-60">Record speech & transcribe directly into tasks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200/70 text-slate-500' : 'hover:bg-white/10 text-neutral-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success state */}
          {createdTaskTitle ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold">Task Created Successfully!</h4>
                <p className="text-xs opacity-70 mt-1 max-w-sm mx-auto">
                  "{createdTaskTitle}" has been saved to your schedule.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setCreatedTaskTitle(null);
                    setTaskPreview(null);
                    startRecording();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isLight
                      ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'border-white/10 hover:bg-white/5 text-neutral-300'
                  }`}
                >
                  Record Another
                </button>
                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('tasks');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>View in Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : isRecording ? (
            /* Active Recording View */
            <div className="space-y-5 text-center py-3">
              {/* Dynamic Animated Waveform Visualization */}
              <div className="relative flex items-center justify-center py-4">
                <div
                  className={`absolute w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all duration-300 ${
                    isLight ? 'bg-pink-300/30' : 'bg-pink-600/20'
                  }`}
                  style={{ transform: `scale(${1 + audioLevel * 0.008})` }}
                />

                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-200 shadow-xl ${
                      isLight
                        ? 'bg-gradient-to-tr from-pink-500 to-rose-600 border-pink-300 text-white'
                        : 'bg-gradient-to-tr from-pink-600 to-rose-700 border-pink-400 text-white'
                    }`}
                    style={{ transform: `scale(${1 + audioLevel * 0.004})` }}
                  >
                    <Mic className="w-8 h-8 animate-pulse" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                  </span>
                </div>
              </div>

              {/* Timer & Status */}
              <div>
                <span className="text-2xl font-medium font-bold tracking-wider">
                  {formatTime(recordingSeconds)}
                </span>
                <p className="text-xs text-rose-500 font-medium mt-1 animate-pulse">
                  Listening & Recording... Speak your task naturally
                </p>
              </div>

              {/* Dynamic Equalizer Bars */}
              <div className="flex items-center justify-center gap-1.5 h-10 px-6">
                {audioLevelsArray.map((level, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 rounded-full bg-gradient-to-t from-pink-500 to-rose-500 transition-all duration-75"
                    style={{ height: `${Math.max(12, level)}%` }}
                  />
                ))}
              </div>

              {/* Real-time live transcript preview */}
              <div
                className={`p-3.5 rounded-2xl border text-xs text-left max-h-24 overflow-y-auto ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121D] border-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-medium tracking-wider opacity-50 mb-1">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  <span>Real-time Transcription</span>
                </div>
                <p className="italic leading-relaxed">
                  {liveTranscript || 'Start speaking (e.g., "Schedule design sync with team by Friday 3pm")...'}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopRecordingCleanup();
                    onClose();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isLight
                      ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'border-white/10 hover:bg-white/5 text-neutral-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={stopAndProcessRecording}
                  disabled={recordingSeconds === 0 && !liveTranscript}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg flex items-center gap-2 transition-all cursor-pointer transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop & Create Task</span>
                </button>
              </div>
            </div>
          ) : isProcessingAI ? (
            /* AI Processing View */
            <div className="py-12 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">AI is analyzing your voice memo...</h4>
                <p className="text-xs opacity-60">Extracting task title, priority, and structured subtasks</p>
              </div>
            </div>
          ) : taskPreview ? (
            /* Task Preview & Confirmation View */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Audio Playback Pill */}
              {audioUrl && (
                <div
                  className={`flex items-center justify-between p-3 rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121D] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAudioPlayback}
                      className="p-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white transition-all cursor-pointer"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>
                    <div>
                      <span className="text-xs font-medium">Recorded Snippet</span>
                      <p className="text-[10px] opacity-60">
                        {formatTime(recordingSeconds)} Audio Note
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setTaskPreview(null);
                      startRecording();
                    }}
                    className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Re-record</span>
                  </button>
                </div>
              )}

              {/* AI Structured Task Card */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#151928] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Extracted Task</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        taskPreview.priority === 'urgent'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : taskPreview.priority === 'high'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {taskPreview.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-medium tracking-wider opacity-60">
                    Title
                  </label>
                  <input
                    type="text"
                    value={taskPreview.title}
                    onChange={(e) =>
                      setTaskPreview({ ...taskPreview, title: e.target.value })
                    }
                    className={`w-full font-semibold text-sm rounded-xl px-3 py-1.5 border mt-0.5 outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 focus:border-indigo-600'
                        : 'bg-neutral-900 border-white/10 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-medium tracking-wider opacity-60">
                    Description & Transcript
                  </label>
                  <textarea
                    rows={2}
                    value={taskPreview.description}
                    onChange={(e) =>
                      setTaskPreview({ ...taskPreview, description: e.target.value })
                    }
                    className={`w-full text-xs rounded-xl px-3 py-1.5 border mt-0.5 outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 focus:border-indigo-600'
                        : 'bg-neutral-900 border-white/10 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {taskPreview.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isLight
                      ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'border-white/10 hover:bg-white/5 text-neutral-300'
                  }`}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveTask}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Task to Schedule</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <button
                onClick={startRecording}
                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording Voice Memo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
