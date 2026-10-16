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

  const invalidResearch = await fetch(`${baseUrl}/api/research/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '' }),
  });
  assert.equal(invalidResearch.status, 400, 'research endpoint must validate input before calling paid search');
});
