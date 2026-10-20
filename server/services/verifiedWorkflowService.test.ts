import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertWorkflowTransition, calculateRetryDelay, canTransitionWorkflow, evaluateWorkflowActionPermission, verifyWorkflowOutcome } from './verifiedWorkflowService.js';

test('workflow state machine permits expected progress and blocks terminal-state mutation', () => {
  assert.equal(canTransitionWorkflow('queued', 'running'), true);
  assert.equal(canTransitionWorkflow('running', 'awaiting_approval'), true);
  assert.equal(canTransitionWorkflow('completed', 'running'), false);
  assert.throws(() => assertWorkflowTransition('completed', 'running'), /Invalid workflow state transition/);
});
test('retry delays are bounded exponential backoff and retries are capped', () => {
  const policy = { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 250 };
  assert.equal(calculateRetryDelay(1, policy), 100);
  assert.equal(calculateRetryDelay(2, policy), 200);
  assert.equal(calculateRetryDelay(3, policy), 250);
  assert.throws(() => calculateRetryDelay(4, policy), /Retry limit exceeded/);
});
test('workflow actions deny missing scope and mismatched confirmation', () => {
  const base = { action: 'send message', requiredScope: 'browser:submit', grantedScopes: ['browser:read'], needsConfirmation: true, actionId: 'send-1' };
  assert.equal(evaluateWorkflowActionPermission(base).allowed, false);
  assert.equal(evaluateWorkflowActionPermission({ ...base, grantedScopes: ['browser:submit'] }).allowed, false);
  assert.equal(evaluateWorkflowActionPermission({ ...base, grantedScopes: ['browser:submit'], confirmedActionId: 'send-1' }).allowed, true);
});
test('workflow completion requires non-empty valid evidence', () => {
  assert.equal(verifyWorkflowOutcome('').verified, false);
  assert.equal(verifyWorkflowOutcome(undefined).verified, false);
  assert.equal(verifyWorkflowOutcome('undefined').verified, false);
  assert.deepEqual(verifyWorkflowOutcome(' report saved '), { verified: true, evidence: { kind: 'text', length: 12 } });
});
