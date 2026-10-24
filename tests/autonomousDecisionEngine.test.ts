import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAutonomousAction, evaluatePlan, type PlannedStep } from '../server/services/autonomousDecisionEngine';

const readStep: PlannedStep = {
  id: 'read-1', title: 'Inspect status', description: 'Read current status',
  actionKind: 'read', priority: 5, reversible: true, requiresExternalSideEffect: false,
};
const writeStep: PlannedStep = {
  id: 'write-1', title: 'Update draft', description: 'Save a reversible draft',
  actionKind: 'reversible_write', priority: 4, reversible: true,
  requiresExternalSideEffect: false, requiredPermission: 'draft.write',
};

test('bounded mode allows read-only actions without asking repeatedly', () => {
  const result = evaluateAutonomousAction({
    step: readStep,
    policy: { mode: 'bounded', allowedPermissions: [] },
  });
  assert.equal(result.outcome, 'allow');
});

test('missing permission denies a write instead of trusting the model', () => {
  const result = evaluateAutonomousAction({
    step: writeStep,
    policy: { mode: 'bounded', allowedPermissions: [] },
  });
  assert.equal(result.outcome, 'deny');
});

test('deployment always requires explicit approval', () => {
  const result = evaluateAutonomousAction({
    step: { ...writeStep, actionKind: 'deployment', requiredPermission: undefined },
    policy: { mode: 'proactive', allowedPermissions: [], allowExternalSideEffects: true },
  });
  assert.equal(result.outcome, 'approval_required');
});

test('plan is priority ordered and bounded by maxSteps', () => {
  const result = evaluatePlan([
    { ...readStep, id: 'low', priority: 1 },
    { ...readStep, id: 'high', priority: 10 },
  ], { mode: 'bounded', allowedPermissions: [], maxSteps: 1 });
  assert.deepEqual(result.accepted.map((step) => step.id), ['high']);
  assert.equal(result.truncated, true);
});

test('denied steps are excluded from the executable plan', () => {
  const result = evaluatePlan([
    { ...writeStep, id: 'denied-write', priority: 9 },
    { ...readStep, id: 'allowed-read', priority: 5 },
  ], { mode: 'bounded', allowedPermissions: [], maxSteps: 5 });
  assert.deepEqual(result.accepted.map((step) => step.id), ['allowed-read']);
  assert.equal(result.decisions.find((item) => item.stepId === 'denied-write')?.decision.outcome, 'deny');
});

test('automatic write budget sends excess writes to approval', () => {
  const permittedWrite = { ...writeStep, requiredPermission: 'draft.write' };
  const result = evaluatePlan([
    { ...permittedWrite, id: 'write-1', priority: 9 },
    { ...permittedWrite, id: 'write-2', priority: 8 },
  ], { mode: 'bounded', allowedPermissions: ['draft.write'], maxAutomaticWrites: 1 });
  assert.deepEqual(result.accepted.map((step) => step.id), ['write-1']);
  assert.equal(result.decisions.find((item) => item.stepId === 'write-2')?.decision.outcome, 'approval_required');
});
