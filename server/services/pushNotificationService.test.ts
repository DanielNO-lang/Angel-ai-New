import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePushEndpoint } from './pushNotificationService.js';

const endpoint = (host: string) => `https://${host}/send/${'x'.repeat(48)}`;

test('allows known HTTPS browser push service endpoints', () => {
  for (const host of [
    'fcm.googleapis.com',
    'updates.push.services.mozilla.com',
    'push.services.mozilla.com',
    'web.push.apple.com',
    'device-123.notify.windows.com',
  ]) {
    const result = validatePushEndpoint(endpoint(host));
    assert.equal(result.allowed, true, host);
  }
});

test('rejects arbitrary hosts, deceptive suffixes, local targets and non-HTTPS ports', () => {
  for (const raw of [
    endpoint('google.com'),
    endpoint('fcm.googleapis.com.attacker.example'),
    endpoint('push.services.mozilla.com.attacker.example'),
    'http://fcm.googleapis.com/send/' + 'x'.repeat(48),
    'https://user:pass@fcm.googleapis.com/send/' + 'x'.repeat(48),
    'https://fcm.googleapis.com:444/send/' + 'x'.repeat(48),
    'https://127.0.0.1/send/' + 'x'.repeat(48),
    'https://localhost/send/' + 'x'.repeat(48),
    'https://evilnotify.windows.com/send/' + 'x'.repeat(48),
    'https://fcm.googleapis.com/send/' + 'x'.repeat(2048),
  ]) assert.equal(validatePushEndpoint(raw).allowed, false, raw.slice(0, 100));
});

test('normalizes a valid service endpoint and rejects malformed values', () => {
  const raw = endpoint('fcm.googleapis.com');
  const result = validatePushEndpoint(raw);
  assert.equal(result.allowed, true);
  if (result.allowed) assert.equal(result.endpoint, new URL(raw).href);
  assert.equal(validatePushEndpoint(null).allowed, false);
  assert.equal(validatePushEndpoint('https://fcm.googleapis.com').allowed, false);
});
