export type WorkflowStatus =
  | 'queued' | 'running' | 'awaiting_approval' | 'retrying' | 'completed' | 'failed' | 'cancelled';

const transitions: Record<WorkflowStatus, WorkflowStatus[]> = {
  queued: ['running', 'cancelled'],
  running: ['awaiting_approval', 'retrying', 'completed', 'failed', 'cancelled'],
  awaiting_approval: ['running', 'failed', 'cancelled'],
  retrying: ['running', 'failed', 'cancelled'],
  completed: [],
  failed: ['queued'],
  cancelled: [],
};

export function canTransitionWorkflow(from: WorkflowStatus, to: WorkflowStatus): boolean {
  return transitions[from].includes(to);
}

export function assertWorkflowTransition(from: WorkflowStatus, to: WorkflowStatus): void {
  if (!canTransitionWorkflow(from, to)) {
    throw new Error('Invalid workflow state transition from ' + from + ' to ' + to + '.');
  }
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}
export function calculateRetryDelay(retryNumber: number, policy: RetryPolicy): number {
  if (!Number.isInteger(retryNumber) || retryNumber < 1) throw new Error('retryNumber must be a positive integer.');
  if (!Number.isInteger(policy.maxRetries) || policy.maxRetries < 0 ||
      !Number.isFinite(policy.baseDelayMs) || policy.baseDelayMs < 0 ||
      !Number.isFinite(policy.maxDelayMs) || policy.maxDelayMs < 0) {
    throw new Error('Retry policy values must be finite and non-negative.');
  }
  if (retryNumber > policy.maxRetries) throw new Error('Retry limit exceeded.');
  return Math.min(policy.maxDelayMs, policy.baseDelayMs * (2 ** (retryNumber - 1)));
}

export interface ActionPermission {
  action: string;
  requiredScope: string;
  grantedScopes: string[];
  needsConfirmation?: boolean;
  confirmedActionId?: string;
  actionId: string;
}
/** Permission evaluation is deny-by-default and binds confirmations to one action ID. */
export function evaluateWorkflowActionPermission(input: ActionPermission): {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
} {
  if (!input.action || !input.requiredScope || !input.actionId) {
    return { allowed: false, requiresConfirmation: false, reason: 'Action metadata is incomplete.' };
  }
  if (!input.grantedScopes.includes(input.requiredScope)) {
    return { allowed: false, requiresConfirmation: Boolean(input.needsConfirmation), reason: 'Required permission is missing: ' + input.requiredScope + '.' };
  }
  if (input.needsConfirmation && input.confirmedActionId !== input.actionId) {
    return { allowed: false, requiresConfirmation: true, reason: 'This action needs a matching, explicit user confirmation.' };
  }
  return { allowed: true, requiresConfirmation: Boolean(input.needsConfirmation) };
}

export function verifyWorkflowOutcome(output: unknown): { verified: boolean; evidence?: { kind: 'text'; length: number }; reason?: string } {
  if (typeof output !== 'string' || !output.trim()) {
    return { verified: false, reason: 'No usable result was returned; this workflow cannot be marked completed.' };
  }
  const trimmed = output.trim();
  if (trimmed.includes('\u0000') || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
    return { verified: false, reason: 'The returned result failed basic content validation.' };
  }
  return { verified: true, evidence: { kind: 'text', length: trimmed.length } };
}
