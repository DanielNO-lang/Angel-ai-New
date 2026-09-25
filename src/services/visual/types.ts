/**
 * ANGEL AI — Multimodal Visual Perception Architecture
 * Core type definitions for camera feeds, screen interaction, region of interest selection,
 * visual reasoning, and pluggable multimodal channel capabilities.
 */

export type VisualSourceType = 'camera' | 'screen' | 'snapshot_upload';

export type VisualResolutionPreset = '720p' | '1080p' | 'auto';

export type VisualInspectionIntent =
  | 'general_scene'
  | 'ui_ux_audit'
  | 'code_terminal_debug'
  | 'diagram_architecture'
  | 'text_ocr'
  | 'custom';

export interface BoundingBoxRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface VisualFrameCapture {
  id: string;
  timestamp: string;
  source: VisualSourceType;
  dataUrl: string;
  dimensions: {
    width: number;
    height: number;
  };
  regionOfInterest?: BoundingBoxRegion;
  intent: VisualInspectionIntent;
  prompt: string;
  analysis?: string;
  isPendingConfig?: boolean;
  modelUsed?: string;
  agentId?: string;
}

export type MultimodalChannelType =
  | 'camera_feed'
  | 'screen_pipe'
  | 'frame_vision'
  | 'live_api_stream'
  | 'audio_telemetry'
  | 'continuous_ocr';

export type MultimodalChannelStatus =
  | 'active'
  | 'ready'
  | 'pending_configuration'
  | 'unsupported';

export interface MultimodalChannel {
  id: string;
  name: string;
  type: MultimodalChannelType;
  description: string;
  status: MultimodalChannelStatus;
  statusReason?: string;
  configKeysRequired?: string[];
  capabilities: string[];
}

export interface VisualStreamState {
  isActive: boolean;
  source: VisualSourceType;
  selectedDeviceId?: string;
  resolution: VisualResolutionPreset;
  fps: number;
  isCapturing: boolean;
  permissionGranted: boolean;
  errorMessage?: string;
}
