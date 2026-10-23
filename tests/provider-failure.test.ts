import test from 'node:test';
import assert from 'node:assert/strict';
import { GeminiProvider } from '../server/providers/geminiProvider';

test('Gemini generation, streaming, and vision never fabricate output when unconfigured', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const provider = new GeminiProvider();

  try {
    await assert.rejects(
      provider.generate({ prompt: 'What is two plus two?' }),
      /not configured/i,
    );
    await assert.rejects(
      provider.stream({ prompt: 'What is two plus two?' }, () => undefined),
      /not configured/i,
    );
    await assert.rejects(
      provider.vision({ base64Data: 'dGVzdA==', prompt: 'Describe this image.' }),
      /not configured/i,
    );
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
