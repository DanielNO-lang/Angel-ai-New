import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// Prevent the standalone development listener from starting when importing server.ts.
process.env.NETLIFY = 'true';
const { createApp } = await import('../server.ts');

test('Angel backend smoke contract', async (t) => {
  const app = await createApp({ isServerless: true });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  const healthBody = await health.json() as { status?: string; workspace?: string };
  assert.equal(healthBody.status, 'ok');
  assert.equal(healthBody.workspace, 'Angel AI');

  const providers = await fetch(`${baseUrl}/api/ai/providers`);
  assert.equal(providers.status, 200);
  assert.ok(Array.isArray(await providers.json()));

  const models = await fetch(`${baseUrl}/api/models`);
  assert.equal(models.status, 200);
  assert.ok(Array.isArray(await models.json()));

  const conversations = await fetch(`${baseUrl}/api/conversations`);
  assert.equal(conversations.status, 401, 'conversation history must require a verified user');

  const artifacts = await fetch(`${baseUrl}/api/media/artifacts`);
  assert.equal(artifacts.status, 401, 'private media must require a verified user');

  const translationStatus = await fetch(`${baseUrl}/api/translation/status`);
  assert.equal(translationStatus.status, 200);
  const translationStatusBody = await translationStatus.json() as { provider?: string; model?: string; endpointConfigured?: boolean };
  assert.equal(translationStatusBody.provider, 'hymt2');
  assert.equal(translationStatusBody.model, 'tencent/Hy-MT2-1.8B');

  const invalidTranslation = await fetch(`${baseUrl}/api/translation/translate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Hello', targetLanguage: '' }),
  });
  assert.equal(invalidTranslation.status, 400, 'translation endpoint must validate target language');

  // Exercise the Hy-MT2 adapter using a mocked upstream OpenAI-compatible endpoint.
  const priorBaseUrl = process.env.HYMT2_API_BASE_URL;
  const priorApiKey = process.env.HYMT2_API_KEY;
  const priorModelId = process.env.HYMT2_MODEL_ID;
  const nativeFetch = globalThis.fetch;
  let upstreamRequest: { url: string; authorization?: string; body?: any } | undefined;
  process.env.HYMT2_API_BASE_URL = 'https://hymt2-test.example/v1';
  process.env.HYMT2_API_KEY = 'test-only-secret';
  process.env.HYMT2_MODEL_ID = 'tencent/Hy-MT2-1.8B';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = input instanceof Request ? input.url : String(input);
    if (!requestUrl.startsWith('https://hymt2-test.example/')) return nativeFetch(input as any, init);
    upstreamRequest = {
      url: requestUrl,
      authorization: new Headers(init?.headers).get('authorization') || undefined,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    return new Response(JSON.stringify({ model: 'tencent/Hy-MT2-1.8B', choices: [{ message: { content: '你好' } }] }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  try {
    const translated = await nativeFetch(`${baseUrl}/api/translation/translate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Hello', sourceLanguage: 'English', targetLanguage: 'Chinese' }),
    });
    assert.equal(translated.status, 200);
    const translatedBody = await translated.json() as { success?: boolean; translation?: string; provider?: string };
    assert.equal(translatedBody.success, true);
    assert.equal(translatedBody.translation, '你好');
    assert.equal(translatedBody.provider, 'hymt2');
    assert.equal(upstreamRequest?.url, 'https://hymt2-test.example/v1/chat/completions');
    assert.equal(upstreamRequest?.authorization, 'Bearer test-only-secret');
    assert.match(upstreamRequest?.body?.messages?.[0]?.content || '', /English into Chinese/);
  } finally {
    globalThis.fetch = nativeFetch;
    if (priorBaseUrl === undefined) delete process.env.HYMT2_API_BASE_URL; else process.env.HYMT2_API_BASE_URL = priorBaseUrl;
    if (priorApiKey === undefined) delete process.env.HYMT2_API_KEY; else process.env.HYMT2_API_KEY = priorApiKey;
    if (priorModelId === undefined) delete process.env.HYMT2_MODEL_ID; else process.env.HYMT2_MODEL_ID = priorModelId;
  }

  const invalidResearch = await fetch(`${baseUrl}/api/research/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '' }),
  });
  assert.equal(invalidResearch.status, 400, 'research endpoint must validate input before calling paid search');
});
