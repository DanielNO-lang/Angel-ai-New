/**
 * ANGEL AI — Provider Registry & Router
 * Central registry isolating all model providers behind the AIProvider interface.
 * Implements model capability awareness, dynamic fallback, and multi-provider orchestration.
 */

import { GeminiProvider } from './geminiProvider.js';
import { OpenAICompatibleProvider } from './openAICompatibleProvider.js';
import { AIProvider } from './types.js';
import { UNIVERSAL_MODEL_CATALOG, ModelMetadata, getAvailableModels } from './modelRegistry.js';
import { rankAvailableModels, modelRoutingTelemetry, RoutingTask } from '../services/modelRoutingService.js';

export * from './types.js';
export { GeminiProvider } from './geminiProvider.js';
export { OpenAICompatibleProvider } from './openAICompatibleProvider.js';
export { UNIVERSAL_MODEL_CATALOG, getAvailableModels } from './modelRegistry.js';
export { rankAvailableModels, modelRoutingTelemetry } from '../services/modelRoutingService.js';
export type { ModelMetadata, ModelCapability } from './modelRegistry.js';

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
    if (providerId) {
      const provider = this.providers.get(providerId);
      if (!provider) throw new Error(`Provider "${providerId}" is not registered.`);
      if (!provider.isConfigured()) throw new Error(`Provider "${providerId}" is not configured on the server.`);
      return provider;
    }

    const primary = this.providers.get(this.primaryProviderId);
    if (primary?.isConfigured()) return primary;
    const fallback = Array.from(this.providers.values()).find((candidate) => candidate.isConfigured());
    if (fallback) return fallback;
    throw new Error('No AI provider is configured on the server.');
  }

  /**
   * Capability-aware model routing: finds the best available provider for a given model or capability
   */
  routeForCapability(capability: 'vision' | 'toolCalling' | 'embeddings', preferredModelId?: string): AIProvider {
    const task: RoutingTask = capability === 'toolCalling' ? 'tool_calling' : capability;
    if (preferredModelId) {
      const metadata = this.getModelCatalog().find((model) => model.id === preferredModelId);
      const preferredProvider = metadata && this.providers.get(metadata.provider);
      if (metadata?.isAvailable && metadata.capabilities[capability] && preferredProvider?.isConfigured()) {
        return preferredProvider;
      }
    }
    return this.routeForTask(task).provider;
  }

  routeForTask(task: RoutingTask, preferredProvider?: string): { provider: AIProvider; model: ModelMetadata } {
    const ranked = rankAvailableModels(this.getModelCatalog(), task, modelRoutingTelemetry.snapshot(), preferredProvider);
    for (const model of ranked) {
      const provider = this.providers.get(model.provider);
      if (provider?.isConfigured()) return { provider, model };
    }
    throw new Error(`No configured model is currently eligible for task "${task}". Configure an eligible provider or choose an available model.`);
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
    // Configuration status must reflect real server credentials; never advertise an unconfigured model as ready.
    return getAvailableModels(statusMap);
  }
}

export const providerRegistry = new ProviderRegistry();
export const modelRouter = providerRegistry;
