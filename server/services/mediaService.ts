/**
 * ANGEL AI — Media Studio & Generation Engine
 * Model-backed generation pipeline supporting:
 * - Text-to-Image generation via Gemini multimodal image models (gemini-3.1-flash-image / gemini-3.1-flash-lite-image)
 * - Image variations and multi-turn inpainting/editing
 * - Video generation pipeline (veo-3.1-lite-generate-preview)
 * - Durable artifact storage, project linking, task linking, status polling, and retry
 */

import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

export type MediaJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type MediaType = 'image' | 'video' | 'document' | 'creation';

export interface MediaArtifact {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  type: MediaType;
  category: 'images' | 'documents' | 'creations' | 'templates';
  url: string;
  mimeType: string;
  aspectRatio: '1:1' | '16:9' | '4:3' | '9:16' | '3:2' | '2:3';
  modelId: string;
  status: MediaJobStatus;
  progress: number; // 0 - 100
  tags: string[];
  projectId?: string;
  taskId?: string;
  conversationId?: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
  durationSec?: number;
  seed?: number;
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateImageRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16' | '3:2' | '2:3';
  modelId?: string;
  style?: string;
  projectId?: string;
  taskId?: string;
  category?: 'images' | 'creations' | 'templates';
  tags?: string[];
}

export interface EditImageRequest {
  baseImageBase64: string;
  prompt: string;
  mimeType?: string;
  modelId?: string;
  projectId?: string;
}

export interface GenerateVideoRequest {
  prompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  durationSeconds?: number;
  modelId?: string;
  projectId?: string;
  taskId?: string;
}

class MediaService {
  private artifacts: Map<string, MediaArtifact> = new Map();

  constructor() {
    // Production artifacts must come from real generation jobs, not seeded demo assets.
  }

  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY || 'unconfigured-key';
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  private hasApiKey(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  }

  /**
   * List all stored media artifacts with optional filters
   */
  listArtifacts(filters?: {
    category?: string;
    projectId?: string;
    taskId?: string;
    search?: string;
  }): MediaArtifact[] {
    let items = Array.from(this.artifacts.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (filters?.category && filters.category !== 'all') {
      items = items.filter((item) => item.category === filters.category);
    }
    if (filters?.projectId) {
      items = items.filter((item) => item.projectId === filters.projectId);
    }
    if (filters?.taskId) {
      items = items.filter((item) => item.taskId === filters.taskId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.prompt.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return items;
  }

  getArtifact(id: string): MediaArtifact | undefined {
    return this.artifacts.get(id);
  }

  deleteArtifact(id: string): boolean {
    return this.artifacts.delete(id);
  }

  /**
   * Real Model-Backed Image Generation
   */
  async generateImage(req: GenerateImageRequest): Promise<MediaArtifact> {
    const id = 'art_' + crypto.randomBytes(8).toString('hex');
    const modelId = req.modelId || 'gemini-3.1-flash-image';
    const aspectRatio = req.aspectRatio || '16:9';

    // Create durable artifact record in processing state
    const artifact: MediaArtifact = {
      id,
      title: req.prompt.slice(0, 48) + (req.prompt.length > 48 ? '...' : ''),
      prompt: req.prompt,
      negativePrompt: req.negativePrompt,
      type: 'image',
      category: req.category || 'images',
      url: '',
      mimeType: 'image/png',
      aspectRatio,
      modelId,
      status: 'processing',
      progress: 25,
      tags: req.tags || ['Generated', 'AI Art'],
      projectId: req.projectId,
      taskId: req.taskId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.artifacts.set(id, artifact);

    // Await the provider result so the API can persist a final, truthful artifact
    // instead of returning a process-local job that disappears between serverless calls.
    await this.executeImageGeneration(artifact, req);
    return artifact;
  }

  private async executeImageGeneration(artifact: MediaArtifact, req: GenerateImageRequest): Promise<void> {
    if (!this.hasApiKey()) {
      artifact.status = 'failed';
      artifact.progress = 0;
      artifact.error = 'Image generation is unavailable because GEMINI_API_KEY is not configured.';
      artifact.updatedAt = new Date().toISOString();
      return;
    }

    try {
      const ai = this.getClient();
      artifact.progress = 50;
      artifact.updatedAt = new Date().toISOString();

      const response = await ai.models.generateContent({
        model: artifact.modelId,
        contents: {
          parts: [{ text: req.prompt + (req.style ? ` Style: ${req.style}` : '') }],
        },
        config: {
          imageConfig: {
            aspectRatio: artifact.aspectRatio,
            imageSize: '1K',
          },
        },
      });

      const candidates = (response as any).candidates;
      const parts = candidates?.[0]?.content?.parts;
      const imagePart = Array.isArray(parts) ? parts.find((part: any) => part.inlineData?.data) : undefined;
      if (!imagePart) {
        throw new Error('The selected model returned no image data. No placeholder was substituted.');
      }

      artifact.url = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
      artifact.mimeType = imagePart.inlineData.mimeType || 'image/png';
      artifact.status = 'completed';
      artifact.progress = 100;
      artifact.updatedAt = new Date().toISOString();
    } catch (err) {
      console.error('[executeImageGeneration Error]', err);
      artifact.status = 'failed';
      artifact.progress = 0;
      artifact.error = err instanceof Error ? err.message : String(err);
      artifact.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Image Inpainting / Variations / Editing
   */
  async editImage(req: EditImageRequest): Promise<MediaArtifact> {
    const id = 'art_' + crypto.randomBytes(8).toString('hex');
    const modelId = req.modelId || 'gemini-3.1-flash-image';

    const cleanBase64 = req.baseImageBase64.includes('base64,')
      ? req.baseImageBase64.split('base64,')[1]
      : req.baseImageBase64;

    const artifact: MediaArtifact = {
      id,
      title: 'Edit: ' + req.prompt.slice(0, 40),
      prompt: req.prompt,
      type: 'image',
      category: 'creations',
      url: '',
      mimeType: req.mimeType || 'image/png',
      aspectRatio: '16:9',
      modelId,
      status: 'processing',
      progress: 30,
      tags: ['Edited', 'Variation'],
      projectId: req.projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.artifacts.set(id, artifact);

    if (!this.hasApiKey()) {
      artifact.status = 'failed';
      artifact.progress = 0;
      artifact.error = 'Image editing is unavailable because GEMINI_API_KEY is not configured.';
      artifact.updatedAt = new Date().toISOString();
      return artifact;
    }

    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: req.mimeType || 'image/png',
              },
            },
            {
              text: req.prompt,
            },
          ],
        },
      });

      let found = false;
      const candidates = (response as any).candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            artifact.url = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        throw new Error('The selected model returned no edited image data.');
      }

      artifact.status = 'completed';
      artifact.progress = 100;
      artifact.updatedAt = new Date().toISOString();
    } catch (err) {
      artifact.status = 'failed';
      artifact.error = err instanceof Error ? err.message : String(err);
      artifact.updatedAt = new Date().toISOString();
    }

    return artifact;
  }

  /**
   * Video Generation Pipeline (veo-3.1-lite-generate-preview)
   */
  async generateVideo(req: GenerateVideoRequest): Promise<MediaArtifact> {
    const id = 'vid_' + crypto.randomBytes(8).toString('hex');
    const requestedModel = req.modelId === 'veo-3.1-lite-generate-preview' ? 'veo-3.1-fast-generate-preview' : req.modelId;
    const modelId = requestedModel || 'veo-3.1-generate-preview';
    const requestedDuration = Number(req.durationSeconds || 8);
    const durationSeconds = [4, 6, 8].includes(requestedDuration) ? requestedDuration : 8;
    const now = new Date().toISOString();
    const artifact: MediaArtifact = {
      id,
      title: 'Video: ' + req.prompt.slice(0, 40),
      prompt: req.prompt,
      type: 'video',
      category: 'creations',
      url: '',
      mimeType: 'video/mp4',
      aspectRatio: req.aspectRatio || '16:9',
      modelId,
      status: 'queued',
      progress: 5,
      tags: ['Video', 'Cinematic', 'Veo'],
      projectId: req.projectId,
      taskId: req.taskId,
      durationSec: durationSeconds,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.hasApiKey()) {
      artifact.status = 'failed';
      artifact.progress = 0;
      artifact.error = 'Video generation is unavailable because GEMINI_API_KEY is not configured.';
      this.artifacts.set(id, artifact);
      return artifact;
    }

    try {
      const operation = await this.getClient().models.generateVideos({
        model: modelId,
        prompt: req.prompt,
        config: {
          aspectRatio: artifact.aspectRatio,
          numberOfVideos: 1,
          durationSeconds,
        },
      });
      const operationName = (operation as any).name;
      if (!operationName || typeof operationName !== 'string') {
        throw new Error('The video provider did not return a trackable operation ID.');
      }
      artifact.status = 'processing';
      artifact.progress = 10;
      artifact.metadata = { operationName };
      artifact.updatedAt = new Date().toISOString();
    } catch (err) {
      artifact.status = 'failed';
      artifact.progress = 0;
      artifact.error = err instanceof Error ? err.message : String(err);
      artifact.updatedAt = new Date().toISOString();
    }

    this.artifacts.set(id, artifact);
    return artifact;
  }

  /** Poll a persisted Veo operation; safe to call from a later serverless invocation. */
  async pollVideoGeneration(artifact: MediaArtifact): Promise<MediaArtifact> {
    const operationName = typeof artifact.metadata?.operationName === 'string'
      ? artifact.metadata.operationName
      : '';
    if (!operationName) throw new Error('This video artifact has no provider operation ID.');
    if (!this.hasApiKey()) throw new Error('Video generation is unavailable because GEMINI_API_KEY is not configured.');

    const ai = this.getClient();
    const operation = await ai.operations.getVideosOperation({
      operation: { name: operationName } as any,
    }) as any;

    artifact.updatedAt = new Date().toISOString();
    if (!operation.done) {
      artifact.status = 'processing';
      artifact.progress = Math.max(15, Math.min(90, artifact.progress + 10));
      this.artifacts.set(artifact.id, artifact);
      return artifact;
    }

    if (operation.error) {
      artifact.status = 'failed';
      artifact.progress = 0;
      artifact.error = String(operation.error.message || 'The video provider reported a generation error.');
      this.artifacts.set(artifact.id, artifact);
      return artifact;
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (typeof videoUri !== 'string' || !videoUri) {
      artifact.status = 'failed';
      artifact.progress = 0;
      artifact.error = 'The video provider completed without returning a downloadable video.';
      this.artifacts.set(artifact.id, artifact);
      return artifact;
    }

    const parsedUrl = new URL(videoUri);
    const allowedHosts = new Set(['generativelanguage.googleapis.com', 'storage.googleapis.com']);
    if (parsedUrl.protocol !== 'https:' || !allowedHosts.has(parsedUrl.hostname)) {
      throw new Error('The video provider returned an unsupported download host.');
    }
    const headers: Record<string, string> = {};
    if (parsedUrl.hostname === 'generativelanguage.googleapis.com') {
      headers['x-goog-api-key'] = process.env.GEMINI_API_KEY || '';
    }
    const download = await fetch(parsedUrl.toString(), { headers });
    if (!download.ok) throw new Error(`Video download failed with status ${download.status}.`);
    const bytes = Buffer.from(await download.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > 20 * 1024 * 1024) {
      throw new Error('The generated video is empty or exceeds the 20 MB artifact limit.');
    }

    artifact.url = `data:video/mp4;base64,${bytes.toString('base64')}`;
    artifact.mimeType = 'video/mp4';
    artifact.fileSizeBytes = bytes.byteLength;
    artifact.status = 'completed';
    artifact.progress = 100;
    artifact.metadata = { ...artifact.metadata, providerOperationDone: true };
    this.artifacts.set(artifact.id, artifact);
    return artifact;
  }
}

export const mediaService = new MediaService();
