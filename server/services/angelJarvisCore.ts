/**
 * Angel's local fallback.
 *
 * This module must never impersonate a configured model, invent observations,
 * or present planned actions as completed actions. Normal chat requests should
 * surface a provider error instead of silently substituting this fallback.
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

export class AngelJarvisCore {
  generateResponse(options: JarvisResponseOptions): {
    text: string;
    modelId: string;
    tokensUsed: { promptTokens: number; completionTokens: number; totalTokens: number };
  } {
    const prompt = (options.prompt || '').trim();
    const isGreeting = /^(hi|hello|hey|hiya|yo|good morning|good afternoon|good evening|howdy)[!.?,\s]*$/i.test(prompt);
    const text = isGreeting
      ? "Hey! I'm here. What's on your mind?"
      : "I couldn't get a response from the configured AI model just now. Please try again or select another available model. I haven't completed any external actions.";
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(text.length / 4);
    return {
      text,
      modelId: 'angel-local-fallback',
      tokensUsed: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
    };
  }

  async streamResponse(
    options: JarvisResponseOptions,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const { text } = this.generateResponse(options);
    onChunk(text);
    return text;
  }

  inspectVision(_options: JarvisVisionOptions): { analysis: string; modelId: string } {
    return {
      analysis: "I couldn't analyze this image because the configured vision model is unavailable. Please retry after checking provider configuration.",
      modelId: 'vision-unavailable',
    };
  }
}

export const angelJarvisCore = new AngelJarvisCore();
