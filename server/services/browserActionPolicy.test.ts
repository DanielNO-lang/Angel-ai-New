import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateBrowserAction, validateApprovedBrowserUrl } from './browserActionPolicy.js';

test('browser URLs require HTTPS and an exact approved host', () => {
  assert.equal(validateApprovedBrowserUrl('https://docs.example.com', ['docs.example.com']).allowed, true);
  assert.equal(validateApprovedBrowserUrl('http://docs.example.com', ['docs.example.com']).allowed, false);
  assert.equal(validateApprovedBrowserUrl('https://evil.example.com', ['example.com']).allowed, false);
  assert.equal(validateApprovedBrowserUrl('https://user:secret@docs.example.com', ['docs.example.com']).allowed, false);
});
test('browser policy blocks loopback and private network destinations', () => {
  for (const url of ['https://127.0.0.1', 'https://10.0.0.2', 'https://192.168.1.10', 'https://service.local', 'https://localhost']) {
    assert.equal(validateApprovedBrowserUrl(url, [new URL(url).hostname]).allowed, false, url);
  }
});
test('browser policy blocks IPv6 literals and alternate loopback/private encodings', () => {
  for (const url of ['https://[::1]', 'https://[fc00::1]', 'https://[fe80::1]', 'https://[::ffff:127.0.0.1]', 'https://2130706433', 'https://8.8.8.8']) {
    assert.equal(validateApprovedBrowserUrl(url, [new URL(url).hostname]).allowed, false, url);
  }
});
test('read-only navigation requires an explicit read permission', () => {
  const base = { actionId: 'a1', kind: 'read_page' as const, url: 'https://docs.example.com', approvedHosts: ['docs.example.com'] };
  assert.equal(evaluateBrowserAction({ ...base, grantedScopes: [] }).allowed, false);
  assert.equal(evaluateBrowserAction({ ...base, grantedScopes: ['browser:read'] }).allowed, true);
});
test('consequential actions and clicks require recent confirmation matching exact action and host', () => {
  // Confirmations are valid for five minutes. Use controlled timestamps around both edges.
  const base = { actionId: 'send-42', kind: 'send_message' as const, url: 'https://mail.example.com', approvedHosts: ['mail.example.com'], grantedScopes: ['browser:submit'], now: 600_000 };
  const missing = evaluateBrowserAction(base);
  assert.equal(missing.allowed, false);
  assert.equal(missing.requiresConfirmation, true);
  assert.equal(evaluateBrowserAction({ ...base, confirmation: { actionId: 'other', host: 'mail.example.com', approvedAt: 420_000 } }).allowed, false);
  assert.equal(evaluateBrowserAction({ ...base, confirmation: { actionId: 'send-42', host: 'other.example.com', approvedAt: 420_000 } }).allowed, false);
  assert.equal(evaluateBrowserAction({ ...base, confirmation: { actionId: 'send-42', host: 'mail.example.com', approvedAt: 420_000 } }).allowed, true);
  assert.equal(evaluateBrowserAction({ ...base, kind: 'click', confirmation: undefined }).allowed, false);
  assert.equal(evaluateBrowserAction({ ...base, confirmation: { actionId: 'send-42', host: 'mail.example.com', approvedAt: 100_000 } }).allowed, false);
});
test('high-impact operations require their own scoped grant', () => {
  const result = evaluateBrowserAction({
    actionId: 'pay-1', kind: 'purchase', url: 'https://shop.example.com',
    approvedHosts: ['shop.example.com'], grantedScopes: ['browser:submit'],
    confirmation: { actionId: 'pay-1', host: 'shop.example.com', approvedAt: 100_000 }, now: 120_000,
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /browser:purchase/);
});
