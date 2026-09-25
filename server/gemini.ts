/**
 * ANGEL AI — Gemini Proxy Layer
 * Bridges legacy helpers to the unified AIProvider abstraction.
 * All direct @google/genai SDK usage is strictly encapsulated inside GeminiProvider.
 */

import { providerRegistry } from './providers';

export interface ChatGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  temperature?: number;
}

/**
 * Generate a complete response using the Gemini AIProvider
 */
export async function generateGeminiResponse(options: ChatGenerateOptions): Promise<string> {
  const provider = providerRegistry.getProvider('gemini');
  const result = await provider.generate({
    prompt: options.prompt,
    systemInstruction: options.systemInstruction,
    modelId: options.model,
    conversationHistory: options.conversationHistory?.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: options.temperature,
  });

  return result.text;
}

/**
 * Inspect visual frames using the Gemini AIProvider vision() method
 */
export async function inspectVisualFrame(
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const provider = providerRegistry.getProvider('gemini');
  const result = await provider.vision({
    base64Data,
    mimeType,
    prompt,
    systemInstruction:
      'You are Optic, Angel AI multimodal perception specialist. Provide rigorous, structured, factual visual analysis. Highlight actionable observations clearly.',
  });

  return result.analysis;
}
