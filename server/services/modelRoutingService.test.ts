import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rankAvailableModels, ModelRoutingTelemetry } from './modelRoutingService.js';
import type { ModelMetadata } from '../providers/modelRegistry.js';

function model(overrides: Partial<ModelMetadata> = {}): ModelMetadata {
  return {
    id: 'model-a',
    name: 'Model A',
    provider: 'gemini',
    description: 'test model',
    contextWindow: 1000,
    maxOutputTokens: 100,
    capabilities: {
      vision: false, audioInput: false, audioOutput: false, toolCalling: false,
      structuredOutput: false, streaming: true, embeddings: false, thinking: false,
    },
    isAvailable: true,
    tier: 'free',
    costPer1kInput: 0.001,
    costPer1kOutput: 0.002,
    ...overrides,
  };
}

test('routing excludes unavailable models', () => {
  assert.deepEqual(rankAvailableModels([model({ isAvailable: false })], 'chat'), []);
});

test('vision routing only returns models that support vision', () => {
  const eligible = model({ id: 'vision', capabilities: { ...model().capabilities, vision: true } });
  assert.deepEqual(rankAvailableModels([model(), eligible], 'vision').map((m) => m.id), ['vision']);
});

test('routing favors observed reliability and lower latency without retaining request content', () => {
  const candidates = [model({ id: 'slow' }), model({ id: 'fast', costPer1kInput: 0.0001 })];
  const result = rankAvailableModels(candidates, 'chat', {
    slow: { successes: 8, failures: 2, averageLatencyMs: 5000 },
    fast: { successes: 19, failures: 1, averageLatencyMs: 200 },
  });
  assert.equal(result[0].id, 'fast');
});

test('preference is a tie-breaker, not a way to select unavailable providers', () => {
  const result = rankAvailableModels([
    model({ id: 'a', provider: 'gemini' }),
    model({ id: 'b', provider: 'openai' }),
    model({ id: 'not-ready', provider: 'openai', isAvailable: false }),
  ], 'chat', {}, 'openai');
  assert.equal(result[0].id, 'b');
  assert.equal(result.some((m) => m.id === 'not-ready'), false);
});

test('runtime telemetry tracks only bounded aggregate model outcomes', () => {
  const telemetry = new ModelRoutingTelemetry();
  telemetry.record('x', true, 100);
  telemetry.record('x', false, 300);
  assert.equal(telemetry.snapshot().x.successes, 1);
  assert.equal(telemetry.snapshot().x.failures, 1);
  assert.equal(telemetry.snapshot().x.averageLatencyMs, 140);
  telemetry.reset();
  assert.deepEqual(telemetry.snapshot(), {});
});
