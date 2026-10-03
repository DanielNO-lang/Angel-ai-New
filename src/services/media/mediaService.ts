/**
 * ANGEL AI — Client-Side Media Studio & Generation Service
 * Calls server-side /api/media/* endpoints for:
 * - Image Generation
 * - Video Generation
 * - Image Variations / Inpainting
 * - Artifact Storage & Project/Task Linking
 */

export interface MediaArtifactDTO {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  type: 'image' | 'video' | 'document' | 'creation';
  category: 'images' | 'documents' | 'creations' | 'templates';
  url: string;
  mimeType: string;
  aspectRatio: '1:1' | '16:9' | '4:3' | '9:16' | '3:2' | '2:3';
  modelId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  tags: string[];
  projectId?: string;
  taskId?: string;
  conversationId?: string;
  fileSizeBytes?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export const mediaClient = {
  async listArtifacts(filters?: {
    category?: string;
    projectId?: string;
    taskId?: string;
    search?: string;
  }): Promise<MediaArtifactDTO[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.taskId) params.append('taskId', filters.taskId);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`/api/media/artifacts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch media artifacts');
    const data = await res.json();
    return data.artifacts || [];
  },

  async getArtifact(id: string): Promise<MediaArtifactDTO> {
    const res = await fetch(`/api/media/artifacts/${id}`);
    if (!res.ok) throw new Error('Artifact not found');
    return await res.json();
  },

  async generateImage(payload: {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16' | '3:2' | '2:3';
    modelId?: string;
    style?: string;
    projectId?: string;
    taskId?: string;
    category?: 'images' | 'creations' | 'templates';
    tags?: string[];
  }): Promise<MediaArtifactDTO> {
    const res = await fetch('/api/media/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Generation failed' }));
      throw new Error(err.error || 'Failed to start image generation');
    }
    return await res.json();
  },

  async generateVideo(payload: {
    prompt: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    durationSeconds?: number;
    modelId?: string;
    projectId?: string;
    taskId?: string;
  }): Promise<MediaArtifactDTO> {
    const res = await fetch('/api/media/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Generation failed' }));
      throw new Error(err.error || 'Failed to start video generation');
    }
    return await res.json();
  },

  async editImage(payload: {
    baseImageBase64: string;
    prompt: string;
    mimeType?: string;
    modelId?: string;
    projectId?: string;
  }): Promise<MediaArtifactDTO> {
    const res = await fetch('/api/media/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Edit failed' }));
      throw new Error(err.error || 'Failed to edit image');
    }
    return await res.json();
  },

  async deleteArtifact(id: string): Promise<boolean> {
    const res = await fetch(`/api/media/artifacts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  },
};
