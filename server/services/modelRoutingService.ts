/**
 * Angel model router.
 *
 * This service ranks only models the server has confirmed are configured.
 * Live latency/reliability signals are process-local observations, not promises
 * about future requests. Unknown metrics are left neutral rather than guessed.
 */
import type { ModelMetadata } from '../providers/modelRegistry.js';

export type RoutingTask = 'chat' | 'research' | 'vision' | 'tool_calling' | 'embeddings' | 'coding' | 'reasoning';

export interface ModelRuntimeSignals {
  successes: number;
  failures: number;
  averageLatencyMs?: number;
}

export type ModelRuntimeSignalMap = Record<string, ModelRuntimeSignals>;

const requiredCapability: Partial<Record<RoutingTask, keyof ModelMetadata['capabilities']>> = {
  vision: 'vision',
  tool_calling: 'toolCalling',
  embeddings: 'embeddings',
  research: 'toolCalling',
};

function capabilityScore(model: ModelMetadata, task: RoutingTask): number {
  if (task === 'research') return model.capabilities.toolCalling ? 2 : 0;
  if (task === 'coding' || task === 'reasoning') return model.capabilities.thinking ? 2 : 1;
  if (task === 'chat') return model.capabilities.streaming ? 1 : 0;
  const required = requiredCapability[task];
  return required ? (model.capabilities[required] ? 2 : -1000) : 0;
}

/** Lower score is better. Invalid or unavailable models are excluded, not penalized into eligibility. */
export function rankAvailableModels(
  candidates: ModelMetadata[],
  task: RoutingTask,
  runtimeSignals: ModelRuntimeSignalMap = {},
  preferredProvider?: string,
): ModelMetadata[] {
  return candidates
    .filter((model) => model.isAvailable && capabilityScore(model, task) > -1000)
    .map((model, originalIndex) => {
      const signals = runtimeSignals[model.id];
      const total = signals ? signals.successes + signals.failures : 0;
      const reliability = total > 0 ? signals!.successes / total : undefined;
      const score =
        (reliability === undefined ? 0 : (1 - reliability) * 100) +
        (signals?.averageLatencyMs === undefined ? 0 : Math.min(60_000, Math.max(0, signals.averageLatencyMs)) / 1000) -
        (model.costPer1kInput === undefined ? 0 : Math.min(1, model.costPer1kInput) * 10) -
        capabilityScore(model, task) * 5 -
        (preferredProvider && model.provider === preferredProvider ? 1 : 0);
      return { model, score, originalIndex };
    })
    .sort((a, b) => a.score - b.score || a.originalIndex - b.originalIndex)
    .map(({ model }) => model);
}

/** Lightweight process-local performance sampler; no prompts or user content are retained. */
export class ModelRoutingTelemetry {
  private signals: ModelRuntimeSignalMap = {};

  record(modelId: string, succeeded: boolean, elapsedMs: number): void {
    if (!modelId || !Number.isFinite(elapsedMs) || elapsedMs < 0) return;
    const existing = this.signals[modelId] || { successes: 0, failures: 0 };
    const sampleCount = existing.successes + existing.failures;
    const averageLatencyMs = existing.averageLatencyMs === undefined
      ? elapsedMs
      : existing.averageLatencyMs * 0.8 + elapsedMs * 0.2;
    this.signals = {
      ...this.signals,
      [modelId]: {
        successes: existing.successes + (succeeded ? 1 : 0),
        failures: existing.failures + (succeeded ? 0 : 1),
        averageLatencyMs: sampleCount > 0 ? averageLatencyMs : elapsedMs,
      },
    };
  }

  snapshot(): ModelRuntimeSignalMap {
    return Object.fromEntries(Object.entries(this.signals).map(([id, value]) => [id, { ...value }]));
  }

  reset(): void {
    this.signals = {};
  }
}

export const modelRoutingTelemetry = new ModelRoutingTelemetry();
