/**
 * ANGEL AI — Multimodal Channel Registry
 * Unified structural registry enabling future multimodal perception capabilities
 * (Live API WebSocket streaming, spatial audio, background OCR indexing)
 * to plug directly into Angel without fragmenting into disconnected "modes".
 */

import { MultimodalChannel } from './types';

class MultimodalChannelRegistry {
  private channels: Map<string, MultimodalChannel> = new Map();

  constructor() {
    this.registerDefaultChannels();
  }

  private registerDefaultChannels() {
    // 1. Camera Visual Perception Channel
    this.register({
      id: 'channel-camera',
      name: 'Camera Optical Stream',
      type: 'camera_feed',
      description: 'Webcam capture pipeline supporting multi-camera switching, resolution control, and instant frame extraction.',
      status: 'active',
      statusReason: 'Connected via browser MediaDevices API.',
      capabilities: ['Webcam video feed', 'Frame extraction', 'Facing mode selection', 'Resolution scaling'],
    });

    // 2. Screen Perception & Interaction Channel
    this.register({
      id: 'channel-screen',
      name: 'Display & Screen Interaction Pipe',
      type: 'screen_pipe',
      description: 'Display media stream for full desktop, application window, or browser tab inspection with bounding-box cropping.',
      status: 'active',
      statusReason: 'Connected via browser getDisplayMedia API.',
      capabilities: ['Full desktop sharing', 'Application window capture', 'Interactive ROI selection', 'Sub-pixel coordinate mapping'],
    });

    // 3. Frame Vision Reasoning Channel (Gemini 3.8 Flash)
    this.register({
      id: 'channel-frame-vision',
      name: 'Frame Vision Reasoning (Gemini 3.8 Flash)',
      type: 'frame_vision',
      description: 'High-speed multimodal snapshot reasoning via Gemini 3.8 Flash. Analyzes UI layouts, error traces, code, diagrams, and scenes.',
      status: 'active',
      statusReason: 'Routed via server-side Gemini Provider with inline image payload.',
      configKeysRequired: ['GEMINI_API_KEY'],
      capabilities: ['Scene decomposition', 'UI/UX layout critique', 'Code/Terminal OCR & error triage', 'Architecture diagram extraction'],
    });

    // 4. Real-Time Gemini Live Audio/Video Channel (Pending Configuration)
    this.register({
      id: 'channel-live-stream',
      name: 'Gemini Live Bidirectional Stream',
      type: 'live_api_stream',
      description: 'Continuous low-latency WebRTC/WebSocket streaming for real-time visual-audio conversational interaction.',
      status: 'pending_configuration',
      statusReason: 'Pending Gemini Live API WebSocket gateway configuration and bidirectional audio pipe.',
      configKeysRequired: ['GEMINI_LIVE_ENDPOINT', 'WEBRTC_SIGNALING_SECRET'],
      capabilities: ['Sub-second latency', 'Continuous video streaming', 'Interruption handling', 'Natural audio dialogue'],
    });

    // 5. Spatial Audio Perception Channel (Pending Configuration)
    this.register({
      id: 'channel-spatial-audio',
      name: 'Spatial & Environmental Audio Telemetry',
      type: 'audio_telemetry',
      description: 'Microphone ambient audio stream transcription and acoustic environment classification.',
      status: 'pending_configuration',
      statusReason: 'Pending audio worklet capture pipeline and transcription model binding.',
      configKeysRequired: ['AUDIO_CAPTURE_DEVICE'],
      capabilities: ['Voice activity detection (VAD)', 'Acoustic scene classification', 'Multi-speaker identification'],
    });

    // 6. Continuous Screen OCR & DOM Indexer (Pending Configuration)
    this.register({
      id: 'channel-continuous-ocr',
      name: 'Continuous Background Screen Indexer',
      type: 'continuous_ocr',
      description: 'WebWorker-based background frame sampling that maintains a live searchable visual vector index of on-screen workspace activity.',
      status: 'pending_configuration',
      statusReason: 'Pending background WebWorker OCR engine and local vector embedding pipeline.',
      configKeysRequired: ['LOCAL_EMBEDDING_MODEL'],
      capabilities: ['Continuous 1Hz screen indexing', 'Semantic search over screen history', 'Automated meeting notes synthesis'],
    });
  }

  public register(channel: MultimodalChannel) {
    this.channels.set(channel.id, channel);
  }

  public getChannel(id: string): MultimodalChannel | undefined {
    return this.channels.get(id);
  }

  public getAllChannels(): MultimodalChannel[] {
    return Array.from(this.channels.values());
  }

  public getActiveChannels(): MultimodalChannel[] {
    return this.getAllChannels().filter((c) => c.status === 'active');
  }

  public getPendingChannels(): MultimodalChannel[] {
    return this.getAllChannels().filter((c) => c.status === 'pending_configuration');
  }

  public updateChannelStatus(id: string, status: MultimodalChannel['status'], reason?: string) {
    const channel = this.channels.get(id);
    if (channel) {
      channel.status = status;
      if (reason) channel.statusReason = reason;
      this.channels.set(id, { ...channel });
    }
  }
}

export const multimodalRegistry = new MultimodalChannelRegistry();
