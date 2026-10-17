import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { automationService } from './automationService.js';

const originalEnv = {
  webhookSecret: process.env.WEBHOOK_SECRET,
  zapierSecret: process.env.ZAPIER_WEBHOOK_SECRET,
  nodeEnv: process.env.NODE_ENV,
  outboundUrl: process.env.OUTBOUND_WEBHOOK_URL,
  zapierUrl: process.env.ZAPIER_OUTBOUND_WEBHOOK_URL,
};

afterEach(() => {
  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  restore('WEBHOOK_SECRET', originalEnv.webhookSecret);
  restore('ZAPIER_WEBHOOK_SECRET', originalEnv.zapierSecret);
  restore('NODE_ENV', originalEnv.nodeEnv);
  restore('OUTBOUND_WEBHOOK_URL', originalEnv.outboundUrl);
  restore('ZAPIER_OUTBOUND_WEBHOOK_URL', originalEnv.zapierUrl);
});

test('webhook HMAC accepts a valid signature', () => {
  process.env.WEBHOOK_SECRET = 'unit-test-secret';
  process.env.NODE_ENV = 'production';
  const payload = JSON.stringify({ event: 'task.created', id: 'test-1' });
  const signature = automationService.generateSignature(payload, 'unit-test-secret');
  assert.equal(automationService.verifyInboundRequest(payload, signature).authorized, true);
  assert.equal(automationService.verifyInboundRequest(payload, `sha256=${signature}`).authorized, true);
  assert.equal(automationService.verifyInboundRequest(payload, `SHA256=${signature.toUpperCase()}`).authorized, true);
});

test('Bearer-prefixed shared secret is accepted', () => {
  process.env.WEBHOOK_SECRET = 'unit-test-secret';
  process.env.NODE_ENV = 'production';
  assert.equal(automationService.verifyInboundRequest('{}', undefined, 'Bearer unit-test-secret').authorized, true);
});

test('malformed webhook signature is rejected without throwing', () => {
  process.env.WEBHOOK_SECRET = 'unit-test-secret';
  process.env.NODE_ENV = 'production';
  assert.doesNotThrow(() => {
    const result = automationService.verifyInboundRequest('{}', 'short');
    assert.equal(result.authorized, false);
  });
});

test('missing production webhook secret denies inbound requests', () => {
  delete process.env.WEBHOOK_SECRET;
  delete process.env.ZAPIER_WEBHOOK_SECRET;
  process.env.NODE_ENV = 'production';
  assert.equal(automationService.verifyInboundRequest('{}').authorized, false);
});

test('per-request destination override cannot configure outbound delivery', async () => {
  delete process.env.OUTBOUND_WEBHOOK_URL;
  delete process.env.ZAPIER_OUTBOUND_WEBHOOK_URL;
  const result = await automationService.dispatchEvent(
    'task.created',
    { test: true },
    { overrideUrl: 'https://attacker-controlled.example/collect' }
  );
  assert.equal(result.dispatched, false);
  assert.match(result.statusText, /No webhook endpoint configured/);
});
