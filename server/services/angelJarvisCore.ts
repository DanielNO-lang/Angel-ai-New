/**
 * Deprecated compatibility shim for legacy imports.
 *
 * Angel is a personal AI companion, not a Jarvis-style operating system.
 * This module intentionally produces no synthetic AI answers or simulated
 * vision results. Callers must use a configured provider and surface errors
 * honestly when that provider is unavailable.
 *
 * Remove this shim once all legacy imports have been migrated.
 */
export interface JarvisResponseOptions {
  prompt: string;
  systemInstruction?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system' | 'tool' | string; content: string }>;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface JarvisVisionOptions {
  base64Data: string;
  mimeType?: string;
  prompt?: string;
  systemInstruction?: string;
}

function unavailable(): Error {
  return new Error('Synthetic fallback responses are disabled. Configure a supported AI provider and retry.');
}

export class AngelJarvisCore {
  generateResponse(_options: JarvisResponseOptions): {
    text: string;
    modelId: string;
    tokensUsed: { promptTokens: number; completionTokens: number; totalTokens: number };
  } {
    throw unavailable();
  }

  async streamResponse(
    _options: JarvisResponseOptions,
    _onChunk: (chunk: string) => void,
  ): Promise<string> {
    throw unavailable();
  }

  inspectVision(_options: JarvisVisionOptions): { analysis: string; modelId: string } {
    throw unavailable();
  }
}

export const angelJarvisCore = new AngelJarvisCore();
