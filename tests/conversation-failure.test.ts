import test from 'node:test';
import assert from 'node:assert/strict';
import { describeRequestFailure, describeUnknownFailure } from '../src/services/ai/conversationService';

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
