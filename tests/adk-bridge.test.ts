import test from 'node:test';
import assert from 'node:assert/strict';
import { runAdkAgent, AdkBridgeError } from '../server/services/adkBridgeService';

test('ADK bridge forwards a verified user token only for request-scoped MCP and never returns it', async () => {
  const priorRunUrl = process.env.ANGEL_ADK_RUN_URL;
  const priorApiKey = process.env.ANGEL_ADK_API_KEY;
  const priorAppName = process.env.ANGEL_ADK_APP_NAME;
  const nativeFetch = globalThis.fetch;
  let captured: { url: string; authorization: string | null; body?: Record<string, unknown> } | undefined;

  process.env.ANGEL_ADK_RUN_URL = 'https://adk-test.example/run';
  process.env.ANGEL_ADK_API_KEY = 'test-only-adk-service-secret';
  process.env.ANGEL_ADK_APP_NAME = 'angel-adk-bridge';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured = {
      url: input instanceof Request ? input.url : String(input),
      authorization: new Headers(init?.headers).get('authorization'),
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    return new Response(JSON.stringify({
      success: true,
      response: 'ADK test response',
      sessionId: 'test-session',
      appName: 'angel-adk-bridge',
      durationMs: 7,
      sessionPersistence: 'in-memory (single instance only)',
      mcpToolsUsed: true,
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const result = await runAdkAgent({
      message: 'List my Angel capabilities',
      sessionId: 'test-session',
      mcpAccessToken: 'test-user-supabase-jwt',
    }, 'server-verified-user-id');

    assert.equal(result.response, 'ADK test response');
    assert.equal(captured?.url, 'https://adk-test.example/run');
    assert.equal(captured?.authorization, 'Bearer test-only-adk-service-secret');
    assert.equal(captured?.body?.userId, 'server-verified-user-id');
    assert.equal(captured?.body?.mcpAccessToken, 'test-user-supabase-jwt');
    assert.equal(result.sessionPersistence, 'in-memory (single instance only)');
    assert.equal(result.mcpToolsUsed, true);
    assert.equal(JSON.stringify(result).includes('test-user-supabase-jwt'), false);
  } finally {
    globalThis.fetch = nativeFetch;
    if (priorRunUrl === undefined) delete process.env.ANGEL_ADK_RUN_URL; else process.env.ANGEL_ADK_RUN_URL = priorRunUrl;
    if (priorApiKey === undefined) delete process.env.ANGEL_ADK_API_KEY; else process.env.ANGEL_ADK_API_KEY = priorApiKey;
    if (priorAppName === undefined) delete process.env.ANGEL_ADK_APP_NAME; else process.env.ANGEL_ADK_APP_NAME = priorAppName;
  }
});

test('ADK bridge rejects an unencrypted remote runtime endpoint', async () => {
  const priorRunUrl = process.env.ANGEL_ADK_RUN_URL;
  const priorApiKey = process.env.ANGEL_ADK_API_KEY;
  process.env.ANGEL_ADK_RUN_URL = 'http://adk.example/run';
  process.env.ANGEL_ADK_API_KEY = 'test-only-adk-service-secret';
  try {
    await assert.rejects(
      runAdkAgent({ message: 'test' }, 'server-verified-user-id'),
      (error: unknown) => error instanceof AdkBridgeError && error.code === 'insecure_endpoint',
    );
  } finally {
    if (priorRunUrl === undefined) delete process.env.ANGEL_ADK_RUN_URL; else process.env.ANGEL_ADK_RUN_URL = priorRunUrl;
    if (priorApiKey === undefined) delete process.env.ANGEL_ADK_API_KEY; else process.env.ANGEL_ADK_API_KEY = priorApiKey;
  }
});
