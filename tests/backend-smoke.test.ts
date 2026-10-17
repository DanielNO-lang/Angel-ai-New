import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { routeAngelVoiceUtterance } from '../src/services/voice/voiceCommandRouter';
import { listAngelSkills, buildAngelSkillContext } from '../server/services/angelSkillsService';
import { handleAngelMcpMessage } from '../server/services/mcpGatewayService';
import { generateWithQwenImage, QwenImageError } from '../server/services/qwenImageService';


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
  const modelCatalog = await models.json() as Array<{ id?: string; provider?: string }>;
  assert.ok(Array.isArray(modelCatalog));
  assert.ok(modelCatalog.some((model) => model.id === 'qwen-image-2.1-turbo' && model.provider === 'qwen'));
  assert.ok(modelCatalog.some((model) => model.id === 'qwen-image-2.1-pro' && model.provider === 'qwen'));

  const capabilityRes = await fetch(`${baseUrl}/api/integrations/capabilities`);
  assert.equal(capabilityRes.status, 200);
  const capabilityPayload = await capabilityRes.json() as { skillsCount?: number; capabilities?: Array<{ id: string; status: string; configured: boolean }> };
  assert.ok((capabilityPayload.skillsCount || 0) >= 8);
  for (const expected of ['qwen-image-2.1', 'hy-mt2', 'google-adk-python', 'mcp-gateway', 'python-sandbox', 'gpu-operator', 'wheelhouse-voice']) {
    assert.ok(capabilityPayload.capabilities?.some((capability) => capability.id === expected), `missing capability status: ${expected}`);
  }
  assert.doesNotMatch(JSON.stringify(capabilityPayload), /QWEN_IMAGE_API_KEY|ANGEL_ADK_API_KEY|SUPABASE_SERVICE_ROLE_KEY/);

  const pythonStatus = await fetch(`${baseUrl}/api/python/status`);
  assert.equal(pythonStatus.status, 200);
  const pythonStatusBody = await pythonStatus.json() as { configured?: boolean; serverExecutesUntrustedCodeLocally?: boolean };
  assert.equal(pythonStatusBody.serverExecutesUntrustedCodeLocally, false);

  const adkStatus = await fetch(`${baseUrl}/api/agents/adk/status`);
  assert.equal(adkStatus.status, 200);
  const adkStatusBody = await adkStatus.json() as { provider?: string; runtime?: string };
  assert.equal(adkStatusBody.provider, 'google-adk-python');
  assert.equal(adkStatusBody.runtime, 'external Python service');

  const protectedCalls = [
    fetch(`${baseUrl}/api/python/execute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'print(1 + 1)' }),
    }),
    fetch(`${baseUrl}/api/agents/adk/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'hello' }),
    }),
    fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } }),
    }),
    fetch(`${baseUrl}/api/skills/catalog`),
  ];
  for (const response of await Promise.all(protectedCalls)) {
    assert.equal(response.status, 401, 'sensitive tool and skill endpoints require a verified Supabase user');
  }

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

  const invalidMultiReference = await fetch(`${baseUrl}/api/media/edit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      baseImageBase64: 'data:image/png;base64,YWJj',
      referenceImageDataUrls: ['data:image/png;base64,ZGVm'],
      prompt: 'Combine these references',
      modelId: 'qwen-image-2.1-turbo',
    }),
  });
  assert.equal(invalidMultiReference.status, 400, 'multiple image references must require Qwen Image 2.1 Pro');

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



test('Angel voice routing, skills, and MCP schema validation', async () => {
  assert.deepEqual(routeAngelVoiceUtterance('Hello Angel, open Media Studio.'), {
    kind: 'navigate',
    target: 'media_studio',
  });
  assert.deepEqual(routeAngelVoiceUtterance('Hey Angel, end conversation.'), { kind: 'end-session' });
  assert.deepEqual(routeAngelVoiceUtterance('Angel, pause listening.'), { kind: 'control', action: 'pause-listening' });
  assert.deepEqual(routeAngelVoiceUtterance('Hey Angel, what is on my task list?'), {
    kind: 'prompt',
    prompt: 'what is on my task list?',
  });
  assert.deepEqual(routeAngelVoiceUtterance('I want to end this conversation with a summary.'), {
    kind: 'prompt',
    prompt: 'I want to end this conversation with a summary.',
  });

  const skills = listAngelSkills();
  assert.ok(skills.length >= 8);
  assert.ok(skills.some((skill) => skill.id === 'mcp-integration-builder'));
  assert.ok(skills.some((skill) => skill.id === 'python-service-engineering'));
  const skillContext = buildAngelSkillContext([
    'secure-code-review',
    'test-first-debugging',
    'mcp-integration-builder',
    'python-service-engineering',
    'agent-workflow-designer',
  ]);
  assert.ok(skillContext.includes('ANGEL SKILL PACKS'));
  assert.equal((skillContext.match(/^## /gm) || []).length, 4, 'an execution receives at most four selected skill packs');

  const handlers = {
    getCapabilities: () => ({ capabilities: [{ id: 'python-sandbox', configured: false }] }),
    translate: async (args: Record<string, unknown>) => ({ translation: 'translated:' + String(args.text) }),
    generateImage: async (args: Record<string, unknown>) => ({ image: 'test-artifact', prompt: args.prompt }),
    runPython: async () => ({ stdout: '2\\n', stderr: '', exitCode: 0 }),
    runAdk: async () => ({ response: 'test-response' }),
  };

  const initialize = await handleAngelMcpMessage({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test-client', version: '1.0' } },
  }, handlers);
  assert.equal(initialize.statusCode, 200);
  assert.equal((initialize.body as any).result?.serverInfo?.name, 'angel-ai');

  const toolList = await handleAngelMcpMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, handlers);
  const toolNames = ((toolList.body as any).result?.tools || []).map((tool: any) => tool.name);
  assert.ok(toolNames.includes('angel_python_execute'));
  assert.ok(toolNames.includes('angel_adk_run'));
  assert.ok(toolNames.includes('angel_translate'));

  const invalidCall = await handleAngelMcpMessage({
    jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: { name: 'angel_translate', arguments: { text: 'x'.repeat(30001), targetLanguage: 'French' } },
  }, handlers);
  assert.equal((invalidCall.body as any).error?.code, -32602, 'MCP schema validation must reject oversized input before invoking a provider');

  const validCall = await handleAngelMcpMessage({
    jsonrpc: '2.0', id: 4, method: 'tools/call',
    params: { name: 'angel_translate', arguments: { text: 'Hello', targetLanguage: 'French' } },
  }, handlers);
  assert.equal((validCall.body as any).result?.content?.[0]?.type, 'text');
  assert.match((validCall.body as any).result?.content?.[0]?.text || '', /translated:Hello/);
});


test('Qwen Image 2.1 Pro sends ordered multi-reference images and enforces provider limits', async () => {
  const priorBaseUrl = process.env.QWEN_IMAGE_API_BASE_URL;
  const priorApiKey = process.env.QWEN_IMAGE_API_KEY;
  const priorModelId = process.env.QWEN_IMAGE_MODEL_ID;
  const nativeFetch = globalThis.fetch;
  const references = [
    'data:image/png;base64,' + Buffer.from('reference-one').toString('base64'),
    'data:image/jpeg;base64,' + Buffer.from('reference-two').toString('base64'),
  ];
  let capturedRequest: { url: string; authorization?: string; body?: any } | undefined;
  let upstreamCalls = 0;
  process.env.QWEN_IMAGE_API_BASE_URL = 'https://qwen-test.example/compatible-mode/v1';
  process.env.QWEN_IMAGE_API_KEY = 'test-only-qwen-secret';
  process.env.QWEN_IMAGE_MODEL_ID = 'qwen-image-2.1-pro';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    upstreamCalls += 1;
    const requestUrl = input instanceof Request ? input.url : String(input);
    capturedRequest = {
      url: requestUrl,
      authorization: new Headers(init?.headers).get('authorization') || undefined,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    return new Response(JSON.stringify({
      model: 'qwen-image-2.1-pro',
      data: [{ b64_json: Buffer.from('generated-image-bytes').toString('base64') }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const generated = await generateWithQwenImage({
      prompt: 'Keep the character identity consistent across both references.',
      modelId: 'qwen-image-2.1-pro',
      referenceImageDataUrls: references,
    });
    assert.equal(generated.model, 'qwen-image-2.1-pro');
    assert.match(generated.url, /^data:image\\/png;base64,/);
    assert.equal(capturedRequest?.url, 'https://qwen-test.example/compatible-mode/v1/images/generations');
    assert.equal(capturedRequest?.authorization, 'Bearer test-only-qwen-secret');
    assert.deepEqual(capturedRequest?.body?.image, references, 'reference order must be preserved');
    assert.equal(capturedRequest?.body?.model, 'qwen-image-2.1-pro');

    await assert.rejects(
      generateWithQwenImage({
        prompt: 'Should reject multi-reference use on Turbo',
        modelId: 'qwen-image-2.1-turbo',
        referenceImageDataUrls: references,
      }),
      (error: unknown) => error instanceof QwenImageError && error.code === 'multi_reference_requires_pro',
    );
    assert.equal(upstreamCalls, 1, 'unsupported multi-reference requests must be rejected before upstream inference');

    await assert.rejects(
      generateWithQwenImage({
        prompt: 'Too many references',
        modelId: 'qwen-image-2.1-pro',
        referenceImageDataUrls: Array.from({ length: 11 }, () => references[0]),
      }),
      (error: unknown) => error instanceof QwenImageError && error.code === 'too_many_reference_images',
    );
    assert.equal(upstreamCalls, 1, 'over-limit requests must be rejected before upstream inference');
  } finally {
    globalThis.fetch = nativeFetch;
    if (priorBaseUrl === undefined) delete process.env.QWEN_IMAGE_API_BASE_URL; else process.env.QWEN_IMAGE_API_BASE_URL = priorBaseUrl;
    if (priorApiKey === undefined) delete process.env.QWEN_IMAGE_API_KEY; else process.env.QWEN_IMAGE_API_KEY = priorApiKey;
    if (priorModelId === undefined) delete process.env.QWEN_IMAGE_MODEL_ID; else process.env.QWEN_IMAGE_MODEL_ID = priorModelId;
  }
});
