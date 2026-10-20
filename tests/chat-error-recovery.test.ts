import test from 'node:test';
import assert from 'node:assert/strict';
import { safeChatErrorMessage } from '../src/services/ai/requestErrors';

test('chat failures are reported without pretending execution succeeded', () => {
  const message = safeChatErrorMessage(new Error('Gemini request failed'));
  assert.equal(message, 'Gemini request failed');
  assert.doesNotMatch(message, /executed|100% operational|synchronized/i);
});

test('chat error messages redact credentials and are bounded', () => {
  const message = safeChatErrorMessage(new Error('API key=supersecret Authorization: Bearer abc123'));
  assert.doesNotMatch(message, /supersecret|abc123/);
  assert.match(message, /\[redacted\]/);
  assert.ok(safeChatErrorMessage(new Error('x'.repeat(2000))).length <= 240);
});

test('unknown errors never stringify arbitrary objects into the chat', () => {
  assert.equal(safeChatErrorMessage({ secret: 'do-not-display' }), 'An unexpected provider failure occurred.');
});
