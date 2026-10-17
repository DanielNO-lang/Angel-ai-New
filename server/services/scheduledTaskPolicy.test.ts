import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseScheduledTaskInput } from './scheduledTaskPolicy.js';

const now = Date.parse('2026-10-17T12:00:00.000Z');
const once = {
  title: 'Daily prep',
  taskPrompt: 'Prepare a lesson outline',
  scheduleType: 'once',
  scheduledAt: '2026-10-17T14:00:00.000Z',
};

test('one-time schedules normalize the input and default notification on', () => {
  const result = parseScheduledTaskInput(once, now);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.scheduleType, 'once');
  assert.equal(result.value.maxRuns, 1);
  assert.equal(result.value.intervalMinutes, null);
  assert.equal(result.value.notifyOnCompletion, true);
});

test('repeating schedules enforce bounded cadence and maximum runs', () => {
  const valid = parseScheduledTaskInput({ ...once, scheduleType: 'interval', intervalMinutes: 60, maxRuns: 7 }, now);
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.intervalMinutes, 60);
    assert.equal(valid.value.maxRuns, 7);
  }
  for (const bad of [
    { ...once, scheduleType: 'interval', intervalMinutes: 14, maxRuns: 3 },
    { ...once, scheduleType: 'interval', intervalMinutes: 43201, maxRuns: 3 },
    { ...once, scheduleType: 'interval', intervalMinutes: 60, maxRuns: 101 },
    { ...once, scheduleType: 'interval', intervalMinutes: 60, maxRuns: 0 },
  ]) assert.equal(parseScheduledTaskInput(bad, now).ok, false);
});

test('rejects missing, oversized, or mistimed data before persistence', () => {
  assert.equal(parseScheduledTaskInput(null, now).ok, false);
  assert.equal(parseScheduledTaskInput({ ...once, title: '  ' }, now).ok, false);
  assert.equal(parseScheduledTaskInput({ ...once, taskPrompt: ' ' }, now).ok, false);
  assert.equal(parseScheduledTaskInput({ ...once, scheduledAt: '2026-10-17T12:00:20.000Z' }, now).ok, false);
  assert.equal(parseScheduledTaskInput({ ...once, scheduledAt: '2028-10-17T12:00:00.000Z' }, now).ok, false);
  assert.equal(parseScheduledTaskInput({ ...once, notifyOnCompletion: 'yes' }, now).ok, false);
});
