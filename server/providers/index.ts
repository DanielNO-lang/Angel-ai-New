/**
 * ANGEL AI — Provider Registry & Router
 * Central registry isolating all model providers behind the AIProvider interface.
 */

import { GeminiProvider } from './geminiProvider';
import { AIProvider } from './types';

export * from './types';
export { GeminiProvider } from './geminiProvider';

export class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProviderId: string = 'gemini';

  constructor() {
    const gemini = new GeminiProvider();
    this.providers.set(gemini.id, gemini);
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId?: string): AIProvider {
    if (providerId && this.providers.has(providerId)) {
      const p = this.providers.get(providerId)!;
      if (p.isConfigured()) return p;
    }

    // Default to Gemini as primary
    const primary = this.providers.get(this.primaryProviderId);
    if (!primary) {
      throw new Error(`Primary provider '${this.primaryProviderId}' is not registered.`);
    }
    return primary;
  }

  getAvailableProviders(): Array<{ id: string; name: string; configured: boolean; defaultModel: string }> {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      configured: p.isConfigured(),
      defaultModel: p.defaultModelId,
    }));
  }
}

export const providerRegistry = new ProviderRegistry();
export const modelRouter = providerRegistry; // Alias for backward compatibility
