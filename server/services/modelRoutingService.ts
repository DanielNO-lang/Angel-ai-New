/**
 * Angel model router.
 *
 * This service ranks only models the server has confirmed are configured.
 * Live latency/reliability signals are process-local observations, not promises
 * about future requests. Unknown metrics are left neutral rather than guessed.
 */
import type { ModelMetadata } from '../providers/modelRegistry.js';

export type RoutingTask = 'chat' | 'research' | 'vision' | 'tool_calling' | 'embeddings' | 'coding' | 'reasoning' | 'structured_output';

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
  structured_output: 'structuredOutput',
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
  const eligible = candidates.filter((model) => model.isAvailable && capabilityScore(model, task) > -1000);
  const median = (values: number[]): number | undefined => {
    if (!values.length) return undefined;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  // Use the median among eligible providers when one price component is unknown;
  // missing price data must not make an expensive/unknown model appear free.
  const inputCostBaseline = median(eligible.map((model) => model.costPer1kInput)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0));
  const outputCostBaseline = median(eligible.map((model) => model.costPer1kOutput)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0));

  return eligible
    .map((model, originalIndex) => {
      const signals = runtimeSignals[model.id];
      const total = signals ? signals.successes + signals.failures : 0;
      const reliability = total > 0 ? signals!.successes / total : undefined;
      const inputCost = typeof model.costPer1kInput === 'number' && Number.isFinite(model.costPer1kInput) && model.costPer1kInput >= 0
        ? model.costPer1kInput : (inputCostBaseline ?? 0);
      const outputCost = typeof model.costPer1kOutput === 'number' && Number.isFinite(model.costPer1kOutput) && model.costPer1kOutput >= 0
        ? model.costPer1kOutput : (outputCostBaseline ?? 0);
      // Cost metadata is USD per 1k tokens; scaling makes ordinary model price
      // differences visible next to latency and reliability without dominating them.
      const costPenalty = Math.min(100, (inputCost + outputCost) * 1000);
      const score =
        (reliability === undefined ? 0 : (1 - reliability) * 100) +
        (signals?.averageLatencyMs === undefined ? 0 : Math.min(60_000, Math.max(0, signals.averageLatencyMs)) / 1000) +
        costPenalty -
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
