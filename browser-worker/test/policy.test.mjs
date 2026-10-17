import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPublicResolvedAddress, validateBrowserUrl } from '../policy.mjs';

test('browser URLs require HTTPS and exact approved host', () => {
  assert.equal(validateBrowserUrl('https://docs.example.com', ['docs.example.com']).allowed, true);
  assert.equal(validateBrowserUrl('http://docs.example.com', ['docs.example.com']).allowed, false);
  assert.equal(validateBrowserUrl('https://child.example.com', ['example.com']).allowed, false);
  assert.equal(validateBrowserUrl('https://docs.example.com:444', ['docs.example.com']).allowed, false);
});
test('browser policy rejects local hosts, IP literals and embedded credentials', () => {
  for (const url of [
    'http://docs.example.com', 'https://localhost', 'https://x.localhost',
    'https://service.local', 'https://127.0.0.1', 'https://2130706433',
    'https://[::1]', 'https://user:secret@docs.example.com',
  ]) {
    const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
    assert.equal(validateBrowserUrl(url, [host]).allowed, false, url);
  }
});
test('resolved IPv4 must be globally routable; IPv6 is denied until hardened egress support exists', () => {
  for (const ip of ['0.0.0.0','10.0.0.1','100.64.0.1','127.0.0.1','169.254.1.2','172.16.0.2','192.168.1.1','198.18.0.2','203.0.113.10','224.0.0.1']) {
    assert.equal(isPublicResolvedAddress(ip), false, ip);
  }
  assert.equal(isPublicResolvedAddress('8.8.8.8'), true);
  assert.equal(isPublicResolvedAddress('2606:4700:4700::1111'), false);
});
