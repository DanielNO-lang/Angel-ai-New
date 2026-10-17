import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { GeminiProvider } from './geminiProvider.js';

const previousKey = process.env.GEMINI_API_KEY;

afterEach(() => {
  if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = previousKey;
});

test('Gemini generate rejects missing configuration instead of inventing an answer', async () => {
  delete process.env.GEMINI_API_KEY;
  const provider = new GeminiProvider();
  await assert.rejects(
    provider.generate({ prompt: 'test prompt' }),
    /GEMINI_API_KEY is not configured/
  );
});

test('Gemini stream rejects missing configuration without streaming fake text', async () => {
  delete process.env.GEMINI_API_KEY;
  const provider = new GeminiProvider();
  const chunks: string[] = [];
  await assert.rejects(
    provider.stream({ prompt: 'test prompt' }, (chunk) => chunks.push(chunk)),
    /GEMINI_API_KEY is not configured/
  );
  assert.deepEqual(chunks, []);
});
