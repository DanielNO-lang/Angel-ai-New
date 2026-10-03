/**
 * ANGEL AI — Provider Registry & Router
 * Central registry isolating all model providers behind the AIProvider interface.
 * Implements model capability awareness, dynamic fallback, and multi-provider orchestration.
 */

import { GeminiProvider } from './geminiProvider';
import { OpenAICompatibleProvider } from './openAICompatibleProvider';
import { AIProvider } from './types';
import { UNIVERSAL_MODEL_CATALOG, ModelMetadata, getAvailableModels } from './modelRegistry';

export * from './types';
export { GeminiProvider } from './geminiProvider';
export { OpenAICompatibleProvider } from './openAICompatibleProvider';
export { UNIVERSAL_MODEL_CATALOG, getAvailableModels } from './modelRegistry';
export type { ModelMetadata, ModelCapability } from './modelRegistry';

export class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProviderId: string = 'gemini';

  constructor() {
    const gemini = new GeminiProvider();
    const openai = new OpenAICompatibleProvider();
    this.providers.set(gemini.id, gemini);
    this.providers.set(openai.id, openai);
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

  /**
   * Capability-aware model routing: finds the best available provider for a given model or capability
   */
  routeForCapability(capability: 'vision' | 'toolCalling' | 'embeddings', preferredModelId?: string): AIProvider {
    // 1. If preferredModelId matches a known model, check its provider
    if (preferredModelId) {
      const meta = UNIVERSAL_MODEL_CATALOG.find((m) => m.id === preferredModelId);
      if (meta && this.providers.has(meta.provider)) {
        const prov = this.providers.get(meta.provider)!;
        if (prov.isConfigured()) return prov;
      }
    }

    // 2. Fall back to primary (Gemini supports vision, toolCalling, and embeddings)
    const primary = this.getProvider('gemini');
    if (primary.isConfigured()) return primary;

    // 3. Fall back to any configured provider
    for (const prov of this.providers.values()) {
      if (prov.isConfigured()) return prov;
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

  getModelCatalog(): ModelMetadata[] {
    const statusMap: Record<string, boolean> = {};
    for (const [id, prov] of this.providers.entries()) {
      statusMap[id] = prov.isConfigured();
    }
    // Gemini is our primary server-side provider in AI Studio
    statusMap['gemini'] = true;
    return getAvailableModels(statusMap);
  }
}

export const providerRegistry = new ProviderRegistry();
export const modelRouter = providerRegistry;
