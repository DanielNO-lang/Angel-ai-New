/**
 * ANGEL AI — Multimodal Visual Mode Studio
 * Comprehensive perception workspace supporting:
 *  - Camera input (with multi-device selection, resolution presets, and periodic sampling)
 *  - Screen interaction (with interactive bounding box region-of-interest selection)
 *  - Multimodal context understanding (UI audit, code debug, diagram deconstruction, OCR, scene analysis)
 *  - Unified pluggable architecture (multimodal channels registry)
 *  - Context bridging (send to Optic chat, create task, store memory)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Crop,
  Download,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  Monitor,
  MousePointer,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  Square,
  Tag,
  Trash2,
  Video,
  VideoOff,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import {
  BoundingBoxRegion,
  MultimodalChannel,
  VisualInspectionIntent,
  VisualResolutionPreset,
  VisualSourceType,
} from '../../services/visual/types';
import { multimodalRegistry } from '../../services/visual/multimodalRegistry';
import { cropFrameToRegion, VISUAL_INTENTS } from '../../services/visual/visualContextBridge';
import { Button, StatusIndicator, EmptyState, LoadingState } from '../ui';
import { AngelLogo } from '../ui/AngelLogo';

export const VisualModeView: React.FC = () => {
  const {
    inspectVisualFrame,
    agents,
    createConversation,
    sendMessage,
    setActiveConversationId,
    setSelectedAgentId,
    setActiveTab,
    createTask,
    createMemory,
    settings,
    isIncognitoActive,
    setIsIncognitoActive,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Active Stream Source & Media State
  const [streamSource, setStreamSource] = useState<VisualSourceType>('camera');
  const [isActive, setIsActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [resolutionPreset, setResolutionPreset] = useState<VisualResolutionPreset>('720p');
  const [availableVideoDevices, setAvailableVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [streamFps, setStreamFps] = useState<number>(30);
  const [feedDimensions, setFeedDimensions] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });

  // Periodic Auto-Sampling State
  const [isAutoSampling, setIsAutoSampling] = useState(false);
  const [autoSampleIntervalSec, setAutoSampleIntervalSec] = useState<number>(15);
  const autoSampleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Region of Interest (Bounding Box Selection)
  const [isRegionSelectMode, setIsRegionSelectMode] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<BoundingBoxRegion | null>(null);
  const [isDraggingRegion, setIsDraggingRegion] = useState(false);
  const [dragStartCoord, setDragStartCoord] = useState<{ x: number; y: number } | null>(null);
  const [cropOnly, setCropOnly] = useState(false);

  // Multimodal Analysis State
  const [selectedIntent, setSelectedIntent] = useState<VisualInspectionIntent>('ui_ux_audit');
  const [visualPrompt, setVisualPrompt] = useState(VISUAL_INTENTS.ui_ux_audit.defaultPrompt);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [isLastAnalysisPendingConfig, setIsLastAnalysisPendingConfig] = useState(false);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);

  // History & Channels Drawer
  const [analysisHistory, setAnalysisHistory] = useState<
    Array<{
      id: string;
      timestamp: string;
      intent: VisualInspectionIntent;
      prompt: string;
      result: string;
      dataUrl: string;
      isPendingConfig: boolean;
      region?: BoundingBoxRegion;
    }>
  >([]);
  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);
  const [registeredChannels, setRegisteredChannels] = useState<MultimodalChannel[]>([]);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Enumerate video devices on mount
  useEffect(() => {
    setRegisteredChannels(multimodalRegistry.getAllChannels());

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          setAvailableVideoDevices(videoDevs);
          if (videoDevs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        })
        .catch((err) => console.warn('[VisualMode] Could not enumerate devices:', err));
    }
  }, [selectedDeviceId]);

  // Sync prompt when intent changes (if user hasn't heavily customized)
  const handleSelectIntent = (intent: VisualInspectionIntent) => {
    setSelectedIntent(intent);
    setVisualPrompt(VISUAL_INTENTS[intent].defaultPrompt);
  };

  // Stop active stream cleanly
  const stopStream = useCallback(() => {
    if (autoSampleTimerRef.current) {
      clearInterval(autoSampleTimerRef.current);
      autoSampleTimerRef.current = null;
    }
    setIsAutoSampling(false);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsRegionSelectMode(false);
    setSelectedRegion(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Start media stream (Camera or Screen)
  const startStream = async (source: VisualSourceType, deviceId?: string) => {
    stopStream();
    setPermissionError(null);
    setAnalysisError(null);

    const widthConstraint =
      resolutionPreset === '1080p' ? 1920 : resolutionPreset === '720p' ? 1280 : 1280;
    const heightConstraint =
      resolutionPreset === '1080p' ? 1080 : resolutionPreset === '720p' ? 720 : 720;

    try {
      let stream: MediaStream;

      if (source === 'camera') {
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: widthConstraint },
          height: { ideal: heightConstraint },
          frameRate: { ideal: 30 },
        };
        if (deviceId) {
          videoConstraints.deviceId = { exact: deviceId };
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } else {
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
          throw new Error('Screen sharing is not supported by your browser or environment.');
        }
        try {
          // Standard cross-browser invocation
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });
        } catch (displayErr: any) {
          if (displayErr.name === 'NotAllowedError' || displayErr.name === 'AbortError') {
            console.info('[VisualMode] Screen sharing cancelled by user.');
            return;
          }
          console.warn('[VisualMode] Standard getDisplayMedia failed, trying fallback:', displayErr);
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        }
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('[VisualMode] Video play error (ignoring autoplay policy):', e);
        }
        setFeedDimensions({
          width: videoRef.current.videoWidth || 1280,
          height: videoRef.current.videoHeight || 720,
        });
      }

      setStreamSource(source);
      setIsActive(true);

      const track = stream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        if (settings.frameRate) setStreamFps(Math.round(settings.frameRate));
        track.onended = () => {
          stopStream();
        };
      }
    } catch (err: any) {
      console.error('[VisualMode] Stream acquisition failed:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setPermissionError(
        isDenied
          ? `Permission was denied for ${source}. Check browser site permissions to allow access.`
          : `Stream acquisition error: ${err.message || 'Device unavailable'}`
      );
      setIsActive(false);
    }
  };

  // Capture frame from video element
  const captureCurrentFrameDataUrl = async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const actualWidth = video.videoWidth || 1280;
    const actualHeight = video.videoHeight || 720;
    canvas.width = actualWidth;
    canvas.height = actualHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, actualWidth, actualHeight);
    let fullFrameDataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // If region of interest is selected and cropOnly is enabled, crop to region!
    if (cropOnly && selectedRegion && viewportRef.current) {
      // Map viewport coordinates to actual video coordinate space
      const vpRect = viewportRef.current.getBoundingClientRect();
      const scaleX = actualWidth / vpRect.width;
      const scaleY = actualHeight / vpRect.height;

      const scaledRegion: BoundingBoxRegion = {
        x: Math.max(0, selectedRegion.x * scaleX),
        y: Math.max(0, selectedRegion.y * scaleY),
        width: Math.min(actualWidth, selectedRegion.width * scaleX),
        height: Math.min(actualHeight, selectedRegion.height * scaleY),
      };

      if (scaledRegion.width > 10 && scaledRegion.height > 10) {
        fullFrameDataUrl = await cropFrameToRegion(fullFrameDataUrl, scaledRegion);
      }
    }

    return fullFrameDataUrl;
  };

  // Inspect Frame Directive Trigger
  const handleInspectFrame = async () => {
    if (!isActive || isAnalyzing) return;
    setAnalysisError(null);

    const frameDataUrl = await captureCurrentFrameDataUrl();
    if (!frameDataUrl) {
      setAnalysisError('Unable to extract frame buffer from active video stream.');
      return;
    }

    setLastCapturedImage(frameDataUrl);
    setIsAnalyzing(true);

    try {
      const intentMeta = VISUAL_INTENTS[selectedIntent];
      const result = await inspectVisualFrame(frameDataUrl, visualPrompt, streamSource, {
        systemInstruction: intentMeta.systemInstruction,
        intent: selectedIntent,
        region: selectedRegion || undefined,
      });

      const analysisText = typeof result === 'string' ? result : result.analysis;
      const isPending = typeof result === 'object' ? Boolean(result.isPendingConfig) : false;

      setLastAnalysis(analysisText);
      setIsLastAnalysisPendingConfig(isPending);

      const historyItem = {
        id: `vis-hist-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        intent: selectedIntent,
        prompt: visualPrompt,
        result: analysisText,
        dataUrl: frameDataUrl,
        isPendingConfig: isPending,
        region: selectedRegion || undefined,
      };

      setAnalysisHistory((prev) => [historyItem, ...prev.slice(0, 19)]);
    } catch (err: any) {
      console.error('[VisualMode] Frame inspection error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAnalysisError(`Inspection failed: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-sampling toggle
  useEffect(() => {
    if (isAutoSampling && isActive) {
      autoSampleTimerRef.current = setInterval(() => {
        handleInspectFrame();
      }, autoSampleIntervalSec * 1000);
    } else {
      if (autoSampleTimerRef.current) {
        clearInterval(autoSampleTimerRef.current);
        autoSampleTimerRef.current = null;
      }
    }
    return () => {
      if (autoSampleTimerRef.current) {
        clearInterval(autoSampleTimerRef.current);
      }
    };
  }, [isAutoSampling, isActive, autoSampleIntervalSec, selectedIntent, visualPrompt]);

  // Interactive Bounding Box Handlers (Dragging on Viewport)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRegionSelectMode || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setDragStartCoord({ x: startX, y: startY });
    setIsDraggingRegion(true);
    setSelectedRegion({
      x: startX,
      y: startY,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRegion || !dragStartCoord || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const currentX = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const currentY = Math.min(Math.max(0, e.clientY - rect.top), rect.height);

    const x = Math.min(dragStartCoord.x, currentX);
    const y = Math.min(dragStartCoord.y, currentY);
    const width = Math.abs(currentX - dragStartCoord.x);
    const height = Math.abs(currentY - dragStartCoord.y);

    setSelectedRegion({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDraggingRegion) return;
    setIsDraggingRegion(false);
    setDragStartCoord(null);

    // If region was too small, clear it
    if (selectedRegion && (selectedRegion.width < 15 || selectedRegion.height < 15)) {
      setSelectedRegion(null);
    } else {
      setCropOnly(true);
    }
  };

  // Cross-Agent & Workspace Bridges
  const handleSendToOpticChat = () => {
    if (!lastAnalysis) return;
    const opticAgent = agents.find((a) => a.id === 'agent-optic') || agents[0];
    setSelectedAgentId(opticAgent.id);
    createConversation(opticAgent.id, undefined, `Visual Audit: ${selectedIntent}`);

    const messageBody = `### Visual Context Inspection Attached\n\n**Source**: ${streamSource.toUpperCase()} • **Intent**: ${
      VISUAL_INTENTS[selectedIntent].label
    }\n**Prompt Directive**: "${visualPrompt}"\n\n**Visual Perception Analysis**:\n${lastAnalysis}\n\nPlease advise on next operational steps based on this visual context.`;

    sendMessage(messageBody);
    setActiveTab('chat');
  };

  const handleCreateTaskFromAnalysis = () => {
    if (!lastAnalysis) return;
    const firstLine = lastAnalysis.split('\n')[0].replace(/^[#*\s-]+/, '').slice(0, 60);
    const taskTitle = `Resolve Visual Finding: ${firstLine || selectedIntent}`;

    createTask({
      title: taskTitle,
      description: `Discovered via Visual Mode (${streamSource}):\n\n${lastAnalysis.slice(0, 500)}...`,
      priority: 'high',
      status: 'todo',
      agentId: 'agent-optic',
      tags: ['visual-audit', streamSource],
      subtasks: [
        { id: `st-${Date.now()}-1`, title: 'Audit visual discrepancy identified by Optic', completed: false },
        { id: `st-${Date.now()}-2`, title: 'Implement recommended design/code adjustments', completed: false },
        { id: `st-${Date.now()}-3`, title: 'Re-verify frame in Visual Mode', completed: false },
      ],
    });

    setActiveTab('tasks');
  };

  const handleSaveToMemory = () => {
    if (!lastAnalysis) return;
    createMemory({
      title: `Visual Audit: ${VISUAL_INTENTS[selectedIntent].label} (${streamSource})`,
      content: lastAnalysis,
      type: 'agent_memory',
      agentId: 'agent-optic',
      source: `Visual Mode Snapshot (${new Date().toLocaleDateString()})`,
      confidence: 0.94,
      tags: ['visual-mode', selectedIntent, streamSource],
    });

    setActiveTab('memories');
  };

  const handleCopyAnalysis = () => {
    if (!lastAnalysis) return;
    navigator.clipboard.writeText(lastAnalysis);
    setCopiedAnalysis(true);
    setTimeout(() => setCopiedAnalysis(false), 2000);
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 bg-transparent transition-colors duration-150 animate-in fade-in duration-150 ${
        isLight ? 'text-slate-800' : 'text-neutral-100'
      }`}
    >
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Bar - Fixed Non-Transparent */}
      <div
        className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0B0E14] border-white/10 text-neutral-100'
        }`}
      >
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('chat')}
              className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs cursor-pointer ${
                isLight
                  ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs'
                  : 'border-white/10 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300'
              }`}
              title="Back to Chat"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2.5">
              <AngelLogo size={28} glow={true} />
              <h1 className="text-xl font-bold tracking-tight">Multimedia Vision</h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : isLight
                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                    : 'bg-neutral-800 text-neutral-400 border-white/5'
                }`}
              >
                {isActive ? 'Live Stream' : 'Standby'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isActive ? (
            <div className="flex items-center gap-2">
              {/* Camera Trigger */}
              <button
                id="btn-start-camera"
                onClick={() => startStream('camera', selectedDeviceId)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-colors shadow-xs ${
                  isLight
                    ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                    : 'border-white/10 bg-neutral-900 hover:bg-neutral-800 text-neutral-100'
                }`}
              >
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Start Camera</span>
              </button>

              {/* Screen Trigger */}
              <button
                id="btn-start-screen"
                onClick={() => startStream('screen')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium transition-all shadow-xs"
              >
                <Monitor className="w-4 h-4" />
                <span>Share Screen</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl border text-[11px] font-mono ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-neutral-900 border-white/10 text-neutral-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="capitalize">{streamSource} Active</span>
                <span className="opacity-40">•</span>
                <span>{streamFps} FPS</span>
                <span className="opacity-40">•</span>
                <span>{feedDimensions.width}×{feedDimensions.height}</span>
              </div>

              <button
                id="btn-stop-stream"
                onClick={stopStream}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Stream</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Permission / Hardware Error Notice */}
      {permissionError && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-800 text-xs text-red-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div className="space-y-1">
            <span className="font-semibold">Media Stream Authorization Notice</span>
            <p className="text-red-300/90 leading-relaxed">{permissionError}</p>
          </div>
        </div>
      )}

      {/* Main Two-Column Perception Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Viewport & Interaction Arena */}
        <div className="lg:col-span-7 space-y-4">
          {/* Video Container with Interactive Region Overlay */}
          <div className="space-y-2">
            <div
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`relative aspect-video rounded-3xl overflow-hidden border flex items-center justify-center select-none shadow-md ${
                isLight ? 'bg-slate-900 border-slate-200' : 'bg-[#090C12] border-white/10'
              } ${
                isRegionSelectMode ? 'cursor-crosshair' : 'cursor-default'
              }`}
            >
              {/* High-tech HUD corner reticle lines */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400/60 pointer-events-none" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400/60 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400/60 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400/60 pointer-events-none" />

              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${!isActive ? 'hidden' : 'block'}`}
              />

              {/* Inactive Empty Feed Banner */}
              {!isActive && (
                <div className="text-center p-8 space-y-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                      isLight ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-neutral-900 border-white/10 text-neutral-400'
                    }`}
                  >
                    <VideoOff className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Visual Pipeline Standby
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                      Connect your camera or share a desktop screen to inspect live UI interfaces, code syntax, architectural diagrams, and physical scenes.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => startStream('camera', selectedDeviceId)}
                      className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-xs text-white transition-colors"
                    >
                      Connect Camera
                    </button>
                    <button
                      onClick={() => startStream('screen')}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-xs transition-all"
                    >
                      Share Screen
                    </button>
                  </div>
                </div>
              )}

              {/* Active Overlay Status Badges */}
              {isActive && (
                <>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-xs border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center gap-2 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="capitalize">{streamSource} Stream</span>
                  </div>

                  {/* Region Select Active Badge */}
                  {isRegionSelectMode && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-neutral-900/90 backdrop-blur-xs border border-neutral-700 text-[11px] font-mono text-neutral-200 flex items-center gap-1.5 pointer-events-none">
                      <MousePointer className="w-3 h-3 text-neutral-400" />
                      <span>Drag to select Region of Interest</span>
                    </div>
                  )}

                  {/* Render Bounding Box */}
                  {selectedRegion && selectedRegion.width > 0 && selectedRegion.height > 0 && (
                    <div
                      style={{
                        left: `${selectedRegion.x}px`,
                        top: `${selectedRegion.y}px`,
                        width: `${selectedRegion.width}px`,
                        height: `${selectedRegion.height}px`,
                      }}
                      className="absolute border-2 border-neutral-100 bg-neutral-100/10 pointer-events-none transition-none shadow-sm"
                    >
                      <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-neutral-950 text-neutral-200 text-[9px] font-mono rounded border border-neutral-800 whitespace-nowrap">
                        ROI: {Math.round(selectedRegion.width)}×{Math.round(selectedRegion.height)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Stream Settings & Region Selector Toolbar */}
            {isActive && (
              <div
                className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border text-xs flex-wrap ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700 shadow-xs'
                    : 'bg-[#121622] border-white/5 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Region Selector Toggle */}
                  <button
                    onClick={() => {
                      setIsRegionSelectMode(!isRegionSelectMode);
                      if (isRegionSelectMode && selectedRegion) {
                        setSelectedRegion(null);
                        setCropOnly(false);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors ${
                      isRegionSelectMode
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-neutral-900 border-white/10 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>{isRegionSelectMode ? 'Selecting ROI' : 'Select Region'}</span>
                  </button>

                  {/* Crop to Region Checkbox */}
                  {selectedRegion && (
                    <label className="flex items-center gap-1.5 text-[11px] font-mono cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cropOnly}
                        onChange={(e) => setCropOnly(e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <span>Crop to Selection</span>
                    </label>
                  )}

                  {/* Clear Region Button */}
                  {selectedRegion && (
                    <button
                      onClick={() => {
                        setSelectedRegion(null);
                        setCropOnly(false);
                      }}
                      className="text-[11px] font-mono text-red-500 hover:underline"
                    >
                      Clear ROI
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Camera Device Switcher (when camera source) */}
                  {streamSource === 'camera' && availableVideoDevices.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        startStream('camera', e.target.value);
                      }}
                      className={`border rounded-xl px-2 py-1 text-[11px] font-mono outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-neutral-900 border-white/10 text-neutral-200'
                      }`}
                    >
                      {availableVideoDevices.map((dev) => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.label || `Camera ${dev.deviceId.slice(0, 6)}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Periodic Auto-Sampling Toggle */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono opacity-80">
                    <Repeat className="w-3 h-3" />
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAutoSampling}
                        onChange={(e) => setIsAutoSampling(e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <span>Auto-Sample</span>
                    </label>
                    {isAutoSampling && (
                      <select
                        value={autoSampleIntervalSec}
                        onChange={(e) => setAutoSampleIntervalSec(Number(e.target.value))}
                        className={`border rounded-lg px-1.5 py-0.5 text-[10px] outline-none ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/10'
                        }`}
                      >
                        <option value={10}>10s</option>
                        <option value={20}>20s</option>
                        <option value={30}>30s</option>
                        <option value={60}>60s</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Visual Intent & Directive Panel */}
          <div
            className={`p-5 rounded-3xl border space-y-4 shadow-sm ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-slate-200/50'
                : 'bg-[#121622] border-white/5 shadow-black/40'
            }`}
          >
            {/* Intent Selector Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider opacity-60">
                  Perception Intent & Focus
                </span>
                <span className="text-[10px] font-mono text-indigo-500">
                  Gemini 3.8 Flash Multimodal
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(VISUAL_INTENTS) as VisualInspectionIntent[]).map((intentKey) => {
                  const meta = VISUAL_INTENTS[intentKey];
                  const isSelected = selectedIntent === intentKey;

                  return (
                    <button
                      key={intentKey}
                      onClick={() => handleSelectIntent(intentKey)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? isLight
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold shadow-xs'
                            : 'bg-indigo-600/20 border-indigo-500/50 text-white font-semibold shadow-xs'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'bg-neutral-900/60 border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-850'
                      }`}
                    >
                      <span className="text-xs font-semibold block truncate">{meta.label}</span>
                      <span className="text-[10px] opacity-60 line-clamp-1 mt-0.5">
                        {meta.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Directive Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block opacity-80">
                Instruction Directive for Visual Reasoner
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={visualPrompt}
                  onChange={(e) => setVisualPrompt(e.target.value)}
                  placeholder="Specify what Angel should observe, critique, or extract..."
                  className={`flex-1 border rounded-xl px-3.5 py-2 text-xs outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-neutral-900 border-white/10 text-neutral-200 focus:border-indigo-500'
                  }`}
                />
                <button
                  id="btn-inspect-frame"
                  onClick={handleInspectFrame}
                  disabled={!isActive || isAnalyzing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reasoning...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Inspect Frame</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Visual Context, Reasoning, & Cross-Module Bridges */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`p-6 rounded-3xl border space-y-4 min-h-[560px] flex flex-col shadow-md ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-slate-200/50'
                : 'bg-[#121622] border-white/5 shadow-black/60'
            }`}
          >
            {/* Header & Status */}
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  Visual Perception & Context
                </h3>
              </div>

              {isAnalyzing ? (
                <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Multimodal Synthesis...
                </span>
              ) : isLastAnalysisPendingConfig ? (
                <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Pending Configuration
                </span>
              ) : lastAnalysis ? (
                <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Analysis Verified
                </span>
              ) : null}
            </div>

            {/* Analysis Error Notification */}
            {analysisError && (
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-800/80 text-xs text-red-300">
                {analysisError}
              </div>
            )}

            {/* Last Captured Frame Snapshot Thumbnail */}
            {lastCapturedImage && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>LAST CAPTURED FRAME</span>
                  <span>{cropOnly && selectedRegion ? 'Region of Interest (Cropped)' : 'Full Viewport'}</span>
                </div>
                <img
                  src={lastCapturedImage}
                  alt="Captured Frame Snapshot"
                  className="w-full h-32 object-contain bg-neutral-950 rounded-lg border border-neutral-800"
                />
              </div>
            )}

            {/* Analysis Content or Empty State */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {lastAnalysis ? (
                <div className="space-y-3">
                  <div
                    className={`markdown-body text-xs leading-relaxed font-sans ${
                      isLight ? 'text-slate-700' : 'text-neutral-200'
                    }`}
                  >
                    <Markdown>{lastAnalysis}</Markdown>
                  </div>

                  {/* Cross-Module Workspace Bridges Toolbar */}
                  <div className="pt-3 border-t border-inherit space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 block">
                      Bridge Context to Workspace
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Send to Optic Chat */}
                      <button
                        onClick={handleSendToOpticChat}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-neutral-900 border-white/5 text-neutral-300 hover:bg-neutral-800'
                        }`}
                        title="Open thread with Optic agent pre-loaded with this analysis"
                      >
                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Chat Optic</span>
                      </button>

                      {/* Create Task */}
                      <button
                        onClick={handleCreateTaskFromAnalysis}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-neutral-900 border-white/5 text-neutral-300 hover:bg-neutral-800'
                        }`}
                        title="Create actionable task from this visual observation"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Create Task</span>
                      </button>

                      {/* Store as Memory */}
                      <button
                        onClick={handleSaveToMemory}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-neutral-900 border-white/5 text-neutral-300 hover:bg-neutral-800'
                        }`}
                        title="Store this finding into the persistent Memory Vault"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Save Memory</span>
                      </button>
                    </div>

                    {/* Copy Output Button */}
                    <button
                      onClick={handleCopyAnalysis}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] font-mono transition-colors ${
                        isLight
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          : 'border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {copiedAnalysis ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied Markdown</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-indigo-400" />
                          <span>Copy Markdown Analysis</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-center p-4 space-y-2 opacity-60">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-neutral-900 border-white/5 text-neutral-400'
                    }`}
                  >
                    <Eye className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-semibold">
                    No visual frame analyzed yet
                  </h4>
                  <p className="text-[11px] max-w-xs leading-relaxed">
                    Activate the camera or screen stream, choose an intent, and click "Inspect Frame" to submit visual context to Gemini 3.8 Flash.
                  </p>
                </div>
              )}
            </div>

            {/* Analysis History Reel */}
            {analysisHistory.length > 1 && (
              <div className="pt-3 border-t border-neutral-800/80">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1.5">
                  Recent Visual Inspections ({analysisHistory.length})
                </span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar text-[11px] font-mono">
                  {analysisHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setLastAnalysis(item.result);
                        setLastCapturedImage(item.dataUrl);
                        setIsLastAnalysisPendingConfig(item.isPendingConfig);
                        setSelectedIntent(item.intent);
                      }}
                      className="p-2 rounded-lg bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="truncate flex items-center gap-1.5">
                        <span className="text-neutral-500">[{item.timestamp}]</span>
                        <span className="text-neutral-300 font-semibold">{item.intent}</span>
                        <span className="truncate text-neutral-400">- {item.prompt}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multimodal Architecture Channels Modal */}
      {isChannelsModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-100">
                  Multimodal Architecture & Channel Registry
                </h3>
                <p className="text-xs text-neutral-400">
                  Unified structure enabling future multimodal capabilities to plug in without creating separate, disconnected "modes".
                </p>
              </div>
              <button
                onClick={() => setIsChannelsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {registeredChannels.map((channel) => {
                const isActive = channel.status === 'active';
                const isPending = channel.status === 'pending_configuration';

                return (
                  <div
                    key={channel.id}
                    className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-100">
                          {channel.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          ({channel.type})
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                          isActive
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                            : isPending
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        {channel.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {channel.description}
                    </p>

                    {channel.statusReason && (
                      <div className="text-[11px] font-mono text-neutral-500">
                        Status Note: <span className="text-neutral-400">{channel.statusReason}</span>
                      </div>
                    )}

                    {channel.configKeysRequired && channel.configKeysRequired.length > 0 && (
                      <div className="text-[11px] font-mono text-neutral-500">
                        Required Config:{' '}
                        <code className="text-neutral-300 bg-neutral-900 px-1 py-0.5 rounded">
                          {channel.configKeysRequired.join(', ')}
                        </code>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {channel.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setIsChannelsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-medium transition-colors"
              >
                Close Architecture View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
