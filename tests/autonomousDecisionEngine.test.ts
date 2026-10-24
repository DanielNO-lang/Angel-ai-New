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
