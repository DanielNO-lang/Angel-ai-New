import test from 'node:test';
import assert from 'node:assert/strict';
import { describeRequestFailure, describeUnknownFailure, buildDeliveryPreferenceInstruction } from '../src/services/ai/conversationService';

test('provider request failures expose helpful status and message details', () => {
  assert.equal(
    describeRequestFailure('{"error":"Rate limit exceeded"}', 429, 'Streaming request failed'),
    'Streaming request failed (HTTP 429): Rate limit exceeded',
  );
  assert.equal(
    describeRequestFailure('', 503, 'Single-shot generation failed'),
    'Single-shot generation failed (HTTP 503).',
  );
});

test('provider request failures redact credential-like values and bound long messages', () => {
  const safe = describeRequestFailure('{"error":"API key=supersecret should not be shown"}', 401, 'Provider request failed');
  assert.match(safe, /\[redacted\]/);
  assert.doesNotMatch(safe, /supersecret/);
  const long = describeRequestFailure(JSON.stringify({ error: 'x'.repeat(1000) }), 502, 'Provider request failed');
  assert.ok(long.length < 300);
});

test('unknown request failures preserve useful network detail without throwing raw values', () => {
  assert.equal(describeUnknownFailure(new Error('Failed to fetch'), 'Fallback failed'), 'Failed to fetch');
  assert.equal(describeUnknownFailure('private-object', 'Fallback failed'), 'Fallback failed');
});

test('conversational delivery preferences are clamped and preserve Angel identity', () => {
  const instruction = buildDeliveryPreferenceInstruction({
    warmth: 100, humor: 0, directness: 90, empathy: 70, emotionalTone: 'playful',
  });
  assert.match(instruction, /stable identity, honesty, safety boundaries, and independent judgement unchanged/);
  assert.match(instruction, /warm and personable/);
  assert.match(instruction, /minimal humor/);
  assert.match(instruction, /concise, candid, and action-oriented/);
  assert.match(instruction, /serious or urgent topics override playful delivery/);
  assert.match(buildDeliveryPreferenceInstruction({
    warmth: -500, humor: 900, directness: Number.NaN, empathy: 50, emotionalTone: 'balanced',
  }), /occasional situational humor|playful when appropriate/);
});
