/**
 * Angel Autonomous Decision Engine
 *
 * Separates goal planning from permission enforcement. Model-generated plans are
 * proposals; this policy engine decides which actions may proceed.
 */
export type AutonomyMode = 'assist' | 'supervised' | 'bounded' | 'proactive';
export type ActionKind =
  | 'read'
  | 'reversible_write'
  | 'external_message'
  | 'financial'
  | 'destructive'
  | 'security'
  | 'deployment'
  | 'code_change';

export type DecisionOutcome = 'allow' | 'approval_required' | 'deny';

export interface PlannedStep {
  id: string;
  title: string;
  description: string;
  actionKind: ActionKind;
  priority: number;
  reversible: boolean;
  requiresExternalSideEffect: boolean;
  requiredPermission?: string;
}

export interface AutonomyPolicy {
  mode: AutonomyMode;
  allowedPermissions: string[];
  deniedActionKinds?: ActionKind[];
  maxSteps?: number;
  maxAutomaticWrites?: number;
  allowExternalSideEffects?: boolean;
}

export interface DecisionRequest {
  step: PlannedStep;
  policy: AutonomyPolicy;
  explicitlyApproved?: boolean;
}

export interface ActionDecision {
  outcome: DecisionOutcome;
  reason: string;
  requiresUserApproval: boolean;
  policyMode: AutonomyMode;
}

const ALWAYS_REQUIRE_APPROVAL: ActionKind[] = [
  'financial',
  'destructive',
  'security',
  'deployment',
];

export function evaluateAutonomousAction(request: DecisionRequest): ActionDecision {
  const { step, policy } = request;
  const deny = (reason: string): ActionDecision => ({
    outcome: 'deny',
    reason,
    requiresUserApproval: false,
    policyMode: policy.mode,
  });
  const approve = (reason: string): ActionDecision => ({
    outcome: 'approval_required',
    reason,
    requiresUserApproval: true,
    policyMode: policy.mode,
  });
  const allow = (reason: string): ActionDecision => ({
    outcome: 'allow',
    reason,
    requiresUserApproval: false,
    policyMode: policy.mode,
  });

  if (!step.title.trim() || !step.description.trim()) return deny('The proposed action is incomplete.');
  if (policy.deniedActionKinds?.includes(step.actionKind)) return deny('This action category is explicitly denied by policy.');
  if (step.requiredPermission && !policy.allowedPermissions.includes(step.requiredPermission)) {
    return deny('The required permission has not been granted.');
  }
  if (ALWAYS_REQUIRE_APPROVAL.includes(step.actionKind) && !request.explicitlyApproved) {
    return approve('This action has consequential or hard-to-reverse effects and needs explicit approval.');
  }
  if (step.requiresExternalSideEffect && policy.allowExternalSideEffects !== true && !request.explicitlyApproved) {
    return approve('External side effects are not enabled for this autonomy policy.');
  }
  if (policy.mode === 'assist') return approve('Assist mode proposes actions but does not execute them autonomously.');
  if (policy.mode === 'supervised' && step.actionKind !== 'read' && !request.explicitlyApproved) {
    return approve('Supervised mode requires approval before changes are made.');
  }
  if (policy.mode === 'proactive' && step.requiresExternalSideEffect && !request.explicitlyApproved) {
    return approve('Proactive mode may prepare external actions but cannot commit them without approval.');
  }
  if (step.actionKind !== 'read' && !step.reversible && !request.explicitlyApproved) {
    return approve('The action is not safely reversible and needs explicit approval.');
  }
  return allow('The action is within the granted permissions and current autonomy policy.');
}

/**
 * Normalizes a proposed plan. This does not execute actions and does not trust
 * model-supplied permissions. Every step is evaluated against the caller policy.
 */
export function evaluatePlan(steps: PlannedStep[], policy: AutonomyPolicy): {
  accepted: PlannedStep[];
  decisions: Array<{ stepId: string; decision: ActionDecision }>;
  truncated: boolean;
} {
  const maxSteps = Math.max(1, Math.min(20, Math.floor(policy.maxSteps ?? 8)));
  const ranked = [...steps]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxSteps);
  const maxWrites = Math.max(0, Math.min(10, Math.floor(policy.maxAutomaticWrites ?? 3)));
  let automaticWrites = 0;
  const decisions = ranked.map((step) => {
    let decision = evaluateAutonomousAction({ step, policy });
    if (step.actionKind !== 'read' && decision.outcome === 'allow') {
      if (automaticWrites >= maxWrites) {
        decision = {
          outcome: 'approval_required',
          reason: 'The automatic write budget for this plan has been reached.',
          requiresUserApproval: true,
          policyMode: policy.mode,
        };
      } else {
        automaticWrites++;
      }
    }
    return { stepId: step.id, decision };
  });
  const allowedIds = new Set(decisions.filter((item) => item.decision.outcome === 'allow').map((item) => item.stepId));
  return {
    accepted: ranked.filter((step) => allowedIds.has(step.id)),
    decisions,
    truncated: steps.length > ranked.length,
  };
}
