import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { handler } from '../netlify/functions/api';

// The verification workflow builds server-build/server.mjs before tests.
// This suite intentionally exercises that compiled artifact via the same
// handler used by Netlify instead of silently falling back to server.ts.
process.env.NETLIFY = 'true';

test('Netlify compiled server bundle exists before function runtime tests', () => {
  const bundlePath = path.resolve(process.cwd(), 'server-build/server.mjs');
  assert.equal(
    existsSync(bundlePath),
    true,
    'Run the production build before testing the Netlify function runtime.',
  );
});

test('Netlify function serves health, integrations, and provider status through compiled ESM bundle', async () => {
  const paths = ['/api/health', '/api/integrations/status', '/api/ai/providers'];

  for (const endpoint of paths) {
    const response = await handler({ path: endpoint }, {});
    assert.equal(
      response.statusCode,
      200,
      `${endpoint} should return HTTP 200 from the compiled server bundle; got ${response.statusCode}: ${String(response.body || '').slice(0, 500)}`,
    );
    const payload = JSON.parse(response.body || '{}');
    assert.ok(payload && typeof payload === 'object', `${endpoint} should return JSON`);
  }

  const health = await handler({ path: '/api/health' }, {});
  const payload = JSON.parse(health.body || '{}');
  assert.equal(payload.status, 'ok');
  assert.equal(payload.platform, 'netlify');
  assert.equal(payload.isServerless, true);
});
