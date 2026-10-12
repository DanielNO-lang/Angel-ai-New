/**
 * ANGEL AI — Persistent Workflow Execution Engine
 * Executes stored workflow steps sequentially, records outcomes, and pauses at
 * explicit approval gates. Only authenticated, RLS-scoped Supabase clients are used.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { executeAgentPipeline } from '../orchestrator';
import { dispatchZapierEvent } from '../zapier_service';
import type { AutomationEventType } from './automationService';

type JsonRecord = Record<string, any>;

const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function getPath(source: any, path: string): any {
  return path.split('.').reduce((value, key) => value == null ? undefined : value[key], source);
}

function evaluateCondition(condition: JsonRecord, input: JsonRecord): boolean {
  const actual = getPath(input, String(condition.field || ''));
  const expected = condition.value;
  switch (condition.operator || 'equals') {
    case 'exists': return actual !== undefined && actual !== null;
    case 'not_exists': return actual === undefined || actual === null;
    case 'not_equals':
    case 'neq': return actual !== expected;
    case 'contains':
      return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    case 'greater_than': return Number(actual) > Number(expected);
    case 'less_than': return Number(actual) < Number(expected);
    case 'equals':
    case 'eq':
    default: return actual === expected;
  }
}

function hasPermission(permissions: string[], ...accepted: string[]): boolean {
  return permissions.some((permission) => accepted.includes(permission));
}

export interface WorkflowRunOptions {
  client: SupabaseClient;
  userId: string;
  accessToken: string;
  workflow: JsonRecord;
  input?: JsonRecord;
  executionId?: string;
  startIndex?: number;
  approvedStepIndex?: number;
  previousResults?: JsonRecord[];
  stepsSnapshot?: JsonRecord[];
  permissionsSnapshot?: string[];
}

export async function runWorkflowExecution(options: WorkflowRunOptions): Promise<JsonRecord> {
  const { client, userId, workflow } = options;
  const workflowId = String(workflow.id);
  const steps: JsonRecord[] = options.stepsSnapshot || (Array.isArray(workflow.steps) ? workflow.steps : []);
  const permissions: string[] = options.permissionsSnapshot || (Array.isArray(workflow.permissions) ? workflow.permissions : []);
  const input: JsonRecord = options.input || {};
  const results: JsonRecord[] = [...(options.previousResults || [])];
  const executionId = options.executionId || id('exec');
  const startedAt = new Date().toISOString();
  const isNewExecution = !options.executionId;

  if (steps.length === 0) throw new Error('This workflow has no steps to execute.');
  if (steps.length > 25) throw new Error('A workflow cannot execute more than 25 steps in one run.');

  if (isNewExecution) {
    const { error } = await client.from('executions').insert({
      id: executionId,
      user_id: userId,
      workflow_id: workflowId,
      agent_id: workflow.agent_id || null,
      status: 'running',
      input: { payload: input, stepsSnapshot: steps, permissionsSnapshot: permissions },
      output: { results: [] },
      started_at: startedAt,
      created_at: startedAt,
    });
    if (error) throw new Error(`Could not create workflow execution record: ${error.message}`);

    const conditions = Array.isArray(workflow.conditions) ? workflow.conditions : [];
    if (conditions.some((condition: JsonRecord) => !evaluateCondition(condition, input))) {
      const completedAt = new Date().toISOString();
      const { error: updateError } = await client.from('executions').update({
        status: 'skipped',
        output: { results: [], reason: 'Workflow conditions were not satisfied.' },
        completed_at: completedAt,
      }).eq('id', executionId).eq('user_id', userId);
      if (updateError) throw new Error(`Could not save skipped workflow state: ${updateError.message}`);
      return { executionId, workflowId, status: 'skipped', results: [], reason: 'Workflow conditions were not satisfied.' };
    }
  }

  const persistState = async (status: string, extra: JsonRecord = {}) => {
    const completedAt = ['completed', 'failed', 'rejected', 'skipped', 'cancelled'].includes(status) ? new Date().toISOString() : null;
    const { error } = await client.from('executions').update({
      status,
      input: { payload: input, stepsSnapshot: steps, permissionsSnapshot: permissions, pendingStepIndex: extra.pendingStepIndex },
      output: { results, ...extra },
      error: extra.error || null,
      completed_at: completedAt,
    }).eq('id', executionId).eq('user_id', userId);
    if (error) throw new Error(`Could not persist workflow execution state: ${error.message}`);
  };

  try {
    for (let index = options.startIndex || 0; index < steps.length; index++) {
      const { data: runState, error: stateError } = await client.from('executions')
        .select('status')
        .eq('id', executionId)
        .eq('user_id', userId)
        .maybeSingle();
      if (stateError) throw new Error(`Could not check workflow cancellation state: ${stateError.message}`);
      if (runState?.status === 'cancel_requested') {
        await persistState('cancelled', { reason: 'Execution cancelled by the user.', lastCompletedStep: index - 1 });
        return { executionId, workflowId, status: 'cancelled', results, reason: 'Execution cancelled by the user.' };
      }

      const step = steps[index] || {};
      const stepId = String(step.id || `step_${index + 1}`);
      const stepType = String(step.type || step.action || 'ai').toLowerCase();

      if (step.requiresApproval === true && options.approvedStepIndex !== index) {
        await persistState('awaiting_approval', {
          pendingStepIndex: index,
          pendingStep: { id: stepId, type: stepType, title: step.title || step.name || stepId },
          approvalMessage: step.approvalMessage || 'Approval is required before this step can run.',
        });
        return {
          executionId,
          workflowId,
          status: 'awaiting_approval',
          pendingStep: { id: stepId, type: stepType, title: step.title || step.name || stepId },
          results,
        };
      }

      let result: JsonRecord;

      if (['task.create', 'create_task', 'task_manager'].includes(stepType)) {
        if (!hasPermission(permissions, 'task_create', 'tasks.write', 'task_manager', 'tasks')) {
          throw new Error(`Step ${stepId} requires task-write permission.`);
        }
        const taskId = id('task');
        const task = {
          id: taskId,
          user_id: userId,
          title: String(step.title || step.name || input.title || 'Workflow task').slice(0, 240),
          description: String(step.description || input.description || '').slice(0, 5000),
          status: 'todo',
          priority: String(step.priority || 'medium'),
          project_id: step.projectId || workflow.project_id || null,
          agent_id: step.agentId || workflow.agent_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { error } = await client.from('tasks').insert(task);
        if (error) throw new Error(`Task step ${stepId} failed: ${error.message}`);
        result = { stepId, type: stepType, success: true, taskId, title: task.title };
      } else if (['memory.save', 'save_memory', 'memory_vault'].includes(stepType)) {
        if (!hasPermission(permissions, 'memory_write', 'memory.write', 'memory_vault', 'memory')) {
          throw new Error(`Step ${stepId} requires memory-write permission.`);
        }
        const memoryId = id('memory');
        const memory = {
          id: memoryId,
          user_id: userId,
          title: String(step.title || step.name || 'Workflow memory').slice(0, 240),
          content: String(step.content || input.content || input.text || '').slice(0, 10000),
          type: String(step.memoryType || 'important_fact'),
          confidence: 0.9,
          tags: Array.isArray(step.tags) ? step.tags : [],
          project_id: step.projectId || workflow.project_id || null,
          agent_id: step.agentId || workflow.agent_id || null,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (!memory.content) throw new Error(`Step ${stepId} requires memory content.`);
        const { error } = await client.from('memories').insert(memory);
        if (error) throw new Error(`Memory step ${stepId} failed: ${error.message}`);
        result = { stepId, type: stepType, success: true, memoryId, title: memory.title };
      } else if (['ai', 'agent', 'generate', 'llm'].includes(stepType)) {
        const prompt = String(step.prompt || step.instructions || step.description || '');
        if (!prompt) throw new Error(`AI step ${stepId} is missing a prompt.`);
        const agentResult = await executeAgentPipeline({
          userId,
          accessToken: options.accessToken,
          agentId: String(step.agentId || workflow.agent_id || `workflow_${workflowId}`),
          agentName: String(workflow.name || 'Workflow Agent'),
          systemInstructions: String(step.systemInstructions || workflow.system_instructions || 'Execute this workflow step precisely.'),
          taskPrompt: prompt,
          modelConfig: { provider: step.provider || undefined, modelId: step.modelId || undefined, temperature: 0.3 },
          context: { projectId: workflow.project_id || undefined, projectName: workflow.name || 'Workflow' },
          allowedTools: Array.isArray(step.allowedTools) ? step.allowedTools : [],
          permissions,
        });
        if (agentResult.status !== 'completed') throw new Error(agentResult.error || `AI step ${stepId} failed.`);
        result = { stepId, type: stepType, success: true, output: agentResult.output, executionId: agentResult.executionId };
      } else if (['webhook', 'dispatch_event'].includes(stepType)) {
        const event = String(step.event || 'workflow.completed') as AutomationEventType;
        const allowedEvents: AutomationEventType[] = ['task.created', 'task.completed', 'agent.executed', 'message.received', 'memory.created', 'memory.updated', 'workflow.completed'];
        if (!allowedEvents.includes(event)) throw new Error(`Step ${stepId} uses an unsupported webhook event.`);
        const dispatched = await dispatchZapierEvent(event, { workflowId, executionId, input, step: stepId });
        if (!dispatched.dispatched) throw new Error(`Webhook step ${stepId} was not delivered: ${dispatched.statusText}`);
        result = { stepId, type: stepType, success: true, statusText: dispatched.statusText };
      } else if (stepType === 'set_variable') {
        const key = String(step.key || '');
        if (!key || key.length > 120) throw new Error(`Step ${stepId} requires a valid variable key.`);
        const value = step.value !== undefined ? step.value : getPath(input, String(step.from || ''));
        input[key] = value;
        result = { stepId, type: stepType, success: true, key, value: value ?? null };
      } else if (stepType === 'transform') {
        const source = step.value ?? step.template ?? '';
        const value = typeof source === 'string'
          ? source.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match: string, path: string) => {
              const normalizedPath = path.replace(/^input\./, '').replace(/^results\./, '');
              const resolved = getPath({ input, results }, normalizedPath);
              return resolved == null ? '' : String(resolved);
            })
          : source;
        result = { stepId, type: stepType, success: true, value };
      } else {
        throw new Error(`Unsupported workflow step type "${stepType}" at step ${stepId}.`);
      }

      results.push(result);
      await persistState('running', { lastCompletedStep: index, stepCount: steps.length });
    }

    const { data: finalRunState, error: finalStateError } = await client.from('executions')
      .select('status')
      .eq('id', executionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (finalStateError) throw new Error(`Could not verify final workflow state: ${finalStateError.message}`);
    if (finalRunState?.status === 'cancel_requested') {
      await persistState('cancelled', { reason: 'Execution cancelled by the user.' });
      return { executionId, workflowId, status: 'cancelled', results, reason: 'Execution cancelled by the user.' };
    }

    const completedAt = new Date().toISOString();
    const { error: finishError } = await client.from('executions').update({
      status: 'completed',
      output: { results },
      error: null,
      completed_at: completedAt,
    }).eq('id', executionId).eq('user_id', userId);
    if (finishError) throw new Error(`Workflow completed but could not save final state: ${finishError.message}`);

    const { data: currentWorkflow } = await client.from('workflows').select('execution_count').eq('id', workflowId).eq('user_id', userId).maybeSingle();
    await client.from('workflows').update({
      last_executed_at: completedAt,
      execution_count: Number(currentWorkflow?.execution_count || 0) + 1,
      updated_at: completedAt,
    }).eq('id', workflowId).eq('user_id', userId);

    return { executionId, workflowId, status: 'completed', results, completedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await persistState('failed', { error: message });
    return { executionId, workflowId, status: 'failed', results, error: message };
  }
}

export async function approveWorkflowExecution(options: {
  client: SupabaseClient;
  userId: string;
  accessToken: string;
  workflow: JsonRecord;
  executionId: string;
  decision: 'approve' | 'reject';
}): Promise<JsonRecord> {
  const { client, userId, workflow, executionId, decision } = options;
  const { data: execution, error } = await client
    .from('executions')
    .select('id, status, input, output, workflow_id')
    .eq('id', executionId)
    .eq('user_id', userId)
    .eq('workflow_id', String(workflow.id))
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!execution || execution.status !== 'awaiting_approval') {
    throw new Error('No pending approval was found for this workflow execution.');
  }

  if (decision === 'reject') {
    const completedAt = new Date().toISOString();
    const { error: updateError } = await client.from('executions').update({
      status: 'rejected',
      error: 'Workflow step rejected by the user.',
      completed_at: completedAt,
    }).eq('id', executionId).eq('user_id', userId);
    if (updateError) throw new Error(updateError.message);
    return { executionId, workflowId: workflow.id, status: 'rejected', completedAt };
  }

  const savedInput = execution.input || {};
  const savedOutput = execution.output || {};
  return runWorkflowExecution({
    client,
    userId,
    accessToken: options.accessToken,
    workflow,
    input: savedInput.payload || {},
    executionId,
    startIndex: Number(savedInput.pendingStepIndex || 0),
    approvedStepIndex: Number(savedInput.pendingStepIndex || 0),
    previousResults: Array.isArray(savedOutput.results) ? savedOutput.results : [],
    stepsSnapshot: Array.isArray(savedInput.stepsSnapshot) ? savedInput.stepsSnapshot : undefined,
    permissionsSnapshot: Array.isArray(savedInput.permissionsSnapshot) ? savedInput.permissionsSnapshot : undefined,
  });
}

/**
 * Run enabled event-triggered workflows belonging to the authenticated user.
 * Event data is passed as workflow input; RLS scopes both discovery and writes.
 */
export async function triggerMatchingWorkflows(options: {
  client: SupabaseClient;
  userId: string;
  accessToken: string;
  event: AutomationEventType;
  data: JsonRecord;
}): Promise<JsonRecord[]> {
  const { client, userId, accessToken, event, data } = options;
  const { data: workflows, error } = await client.from('workflows')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true);
  if (error) throw new Error(`Could not load event-triggered workflows: ${error.message}`);

  const matches = (workflows || []).filter((workflow: JsonRecord) => {
    const trigger = workflow.trigger || {};
    const triggerType = String(trigger.type || '').toLowerCase();
    const configuredEvent = String(trigger.event || trigger.eventType || trigger.event_type || '').toLowerCase();
    return workflow.status !== 'archived' &&
      (triggerType === 'event' || triggerType === 'webhook' || triggerType === 'on_event') &&
      configuredEvent === event.toLowerCase();
  }).slice(0, 10);

  const results: JsonRecord[] = [];
  for (const workflow of matches) {
    results.push(await runWorkflowExecution({
      client,
      userId,
      accessToken,
      workflow,
      input: { event, data },
    }));
  }
  return results;
}
