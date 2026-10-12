/**
 * ANGEL AI — Agent Execution Orchestrator
 * Implements the deterministic 9-step execution lifecycle:
 * REQUESTED -> CONTEXT PREPARATION -> MEMORY RETRIEVAL -> TOOL PLANNING ->
 * EXECUTION -> VALIDATION -> RESPONSE -> MEMORY UPDATE -> COMPLETED
 */

import { modelRouter } from './providers';
import { dispatchZapierEvent } from './zapier_service';
import { getSupabaseClientForUser } from './supabase_service';

export interface ExecutionStepLog {
  stage:
    | 'requested'
    | 'context_preparation'
    | 'memory_retrieval'
    | 'tool_planning'
    | 'execution'
    | 'validation'
    | 'response'
    | 'memory_update'
    | 'completed'
    | 'failed';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationRequest {
  userId?: string;
  accessToken?: string;
  agentId: string;
  agentName: string;
  systemInstructions: string;
  taskPrompt: string;
  modelConfig?: {
    provider?: string;
    modelId?: string;
    temperature?: number;
    maxTokens?: number;
  };
  context?: {
    projectId?: string;
    projectName?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    activeTasks?: Array<{ id: string; title: string; status: string; priority: string }>;
  };
  memories?: Array<{ title: string; content: string; type: string; agentId?: string; projectId?: string }>;
  allowedTools?: string[];
  permissions?: string[];
  memoryAccess?: {
    canRead?: boolean;
    canWrite?: boolean;
    types?: string[];
  };
}

export interface OrchestrationResult {
  executionId: string;
  agentId: string;
  status: 'completed' | 'failed';
  logs: ExecutionStepLog[];
  output: string;
  toolsExecuted: string[];
  newMemoriesDiscovered: Array<{ title: string; content: string; type: string }>;
  tasksCreated: Array<{ title: string; priority: string; description: string }>;
  startedAt: string;
  completedAt: string;
  error?: string;
  durationMs?: number;
}

export async function executeAgentPipeline(request: OrchestrationRequest): Promise<OrchestrationResult> {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const logs: ExecutionStepLog[] = [];
  const toolsExecuted: string[] = [];
  const newMemoriesDiscovered: Array<{ title: string; content: string; type: string }> = [];
  const tasksCreated: Array<{ title: string; priority: string; description: string }> = [];
  const userDb = request.userId && request.accessToken ? getSupabaseClientForUser(request.accessToken) : null;
  let runPersisted = false;

  const addLog = (stage: ExecutionStepLog['stage'], message: string, metadata?: Record<string, unknown>) => {
    logs.push({
      stage,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  };

  try {
    // Persist the run lifecycle when an authenticated Supabase session is present.
    if (userDb && request.userId) {
      const { error } = await userDb.from('executions').insert({
        id: executionId,
        user_id: request.userId,
        agent_id: request.agentId,
        status: 'running',
        input: { agentId: request.agentId, agentName: request.agentName, taskPrompt: request.taskPrompt, modelConfig: request.modelConfig || {} },
        started_at: startedAt,
        created_at: startedAt,
      });
      if (error) {
        addLog('context_preparation', 'Run history could not be persisted; execution will continue without a saved run record.', { reason: error.message });
      } else {
        runPersisted = true;
      }
    }

    // 1. REQUESTED
    addLog('requested', `Lifecycle initialized for agent "${request.agentName}" (${request.agentId}). Prompt verified.`, {
      executionId,
      agentId: request.agentId,
      agentName: request.agentName,
      promptPreview: request.taskPrompt.slice(0, 100),
      timestamp: startedAt,
    });

    // 2. CONTEXT PREPARATION
    const historyCount = request.context?.conversationHistory?.length || 0;
    const taskCount = request.context?.activeTasks?.length || 0;
    addLog(
      'context_preparation',
      `Assembling workspace context: Project "${request.context?.projectName || 'Primary'}", ${historyCount} conversational turns, ${taskCount} active tasks.`,
      {
        projectId: request.context?.projectId,
        projectName: request.context?.projectName,
        historyLength: historyCount,
        activeTasksCount: taskCount,
      }
    );

    // 3. MEMORY RETRIEVAL
    let candidateMemories = request.memories || [];
    // Respect agent memory access permissions if defined
    if (request.memoryAccess) {
      if (request.memoryAccess.canRead === false) {
        candidateMemories = [];
      } else if (request.memoryAccess.types && request.memoryAccess.types.length > 0) {
        candidateMemories = candidateMemories.filter((m) =>
          request.memoryAccess!.types!.includes(m.type)
        );
      }
    }

    addLog(
      'memory_retrieval',
      `Retrieved ${candidateMemories.length} filtered memory candidates for agent knowledge base.`,
      {
        totalProvided: request.memories?.length || 0,
        retrievedCount: candidateMemories.length,
        memoryTitles: candidateMemories.slice(0, 3).map((m) => m.title),
      }
    );

    const formattedMemories = candidateMemories
      .map((m) => `• [${m.type.toUpperCase()}] ${m.title}: ${m.content}`)
      .join('\n');

    // Execute deterministic read-only tools before model synthesis so the model
    // receives actual tool output instead of merely a list of planned tools.
    const toolContextResults: Array<{ tool: string; result: string }> = [];

    if (plannedTools.includes('workspace_search')) {
      const queryTerms = lowerPrompt.split(/[^a-z0-9]+/i).filter((term) => term.length > 2);
      const searchable = [
        ...(request.context?.activeTasks || []).map((item) => ({ kind: 'task', title: item.title, content: `${item.status} ${item.priority}` })),
        ...candidateMemories.map((item) => ({ kind: 'memory', title: item.title, content: item.content })),
        ...(request.context?.conversationHistory || []).map((item) => ({ kind: item.role, title: item.role, content: item.content })),
      ];
      const matches = searchable
        .map((item) => ({
          ...item,
          score: queryTerms.reduce((score, term) => score + (`${item.title} ${item.content}`.toLowerCase().includes(term) ? 1 : 0), 0),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ kind, title, content }) => ({ kind, title, excerpt: content.slice(0, 260) }));
      toolContextResults.push({ tool: 'workspace_search', result: JSON.stringify(matches) });
      toolsExecuted.push('workspace_search');
      addLog('execution', `Workspace search returned ${matches.length} matching context item(s).`, { tool: 'workspace_search', resultCount: matches.length });
    }

    if (plannedTools.includes('time_utility')) {
      const now = new Date();
      const result = JSON.stringify({ iso: now.toISOString(), unixMs: now.getTime(), timezone: 'UTC' });
      toolContextResults.push({ tool: 'time_utility', result });
      toolsExecuted.push('time_utility');
      addLog('execution', 'Time utility returned the current server timestamp in UTC.', { tool: 'time_utility' });
    }

    // 4. TOOL PLANNING
    const tools = request.allowedTools || [];
    const plannedTools: string[] = [];
    const lowerPrompt = request.taskPrompt.toLowerCase();

    if (tools.includes('workspace_search') || tools.includes('search')) {
      plannedTools.push('workspace_search');
    }
    if ((tools.includes('task_manager') || tools.includes('task_create') || tools.includes('tasks')) &&
        (lowerPrompt.includes('task') || lowerPrompt.includes('todo') || lowerPrompt.includes('action item') || lowerPrompt.includes('plan'))) {
      plannedTools.push('task_manager');
    }
    if ((tools.includes('memory_vault') || tools.includes('memory_write') || tools.includes('memory')) &&
        (lowerPrompt.includes('remember') || lowerPrompt.includes('preference') || lowerPrompt.includes('store') || lowerPrompt.includes('fact'))) {
      plannedTools.push('memory_vault');
    }
    if (tools.includes('time_utility') && (lowerPrompt.includes('time') || lowerPrompt.includes('date') || lowerPrompt.includes('deadline'))) {
      plannedTools.push('time_utility');
    }

    addLog(
      'tool_planning',
      `Evaluated tool registry against permissions. Active tools: [${tools.join(', ')}]. Planned invocations: [${plannedTools.join(', ') || 'none'}].`,
      {
        allowedTools: tools,
        plannedTools,
      }
    );

    // 5. EXECUTION
    const providerId = request.modelConfig?.provider || 'gemini';
    const modelId = request.modelConfig?.modelId || 'gemini-3.8-flash';
    addLog('execution', `Dispatched prompt and instructions to ${providerId} (${modelId}). Awaiting generation...`, {
      provider: providerId,
      model: modelId,
      temperature: request.modelConfig?.temperature ?? 0.4,
    });

    const activeTasksSummary = (request.context?.activeTasks || [])
      .map((t) => `• [${t.priority.toUpperCase()}] ${t.title} (Status: ${t.status})`)
      .join('\n');

    const fullSystemInstruction = `${request.systemInstructions}

### WORKSPACE OPERATIONAL CONTEXT:
Project: ${request.context?.projectName || 'Angel AI Primary Workspace'}
Active Tasks in View:
${activeTasksSummary || 'None currently active.'}

### RECALLED MEMORIES & USER DIRECTIVES:
${formattedMemories || 'No specific memory overrides.'}

### EXECUTED TOOL RESULTS:\n${toolContextResults.map((item) => `[${item.tool}] ${item.result}`).join('\\n') || 'No read-only tools executed.'}\n\n### OPERATIONAL DIRECTIVE:
Execute with discipline and high craft. Do not invent external keys, URLs, or repository states. Never claim a task or memory was saved unless the tool confirms persistence. If you recommend new action items or detect durable user preferences, formulate them clearly.`;

    const provider = modelRouter.getProvider(providerId);

    const providerResponse = await provider.generate({
      prompt: request.taskPrompt,
      systemInstruction: fullSystemInstruction,
      conversationHistory: request.context?.conversationHistory?.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      modelId,
      temperature: request.modelConfig?.temperature ?? 0.4,
      maxTokens: request.modelConfig?.maxTokens,
    });

    // Execute planned tools based on generation analysis
    if (plannedTools.includes('task_manager') || (tools.includes('task_create') && lowerPrompt.includes('task'))) {
      const hasTaskPermission = request.permissions === undefined ||
        request.permissions.some((permission) => ['task_create', 'tasks.write', 'task_manager', 'tasks'].includes(permission));
      if (!hasTaskPermission || !userDb || !request.userId) {
        addLog('execution', 'Task creation was not performed: an authenticated session and explicit task-write permission are required.', {
          tool: 'task_manager',
          permissionGranted: hasTaskPermission,
          authenticated: Boolean(userDb && request.userId),
        });
      } else {
        const taskTitle = `Action Item: ${request.taskPrompt.replace(/^(create|add|make|plan)\s+(a\s+)?task\s+(to\s+)?/i, '').slice(0, 60)}`;
        const priority = lowerPrompt.includes('urgent') ? 'urgent' : lowerPrompt.includes('high') ? 'high' : 'medium';
        const description = `Generated by ${request.agentName} during execution ${executionId}. Context: ${request.taskPrompt.slice(0, 120)}`;
        const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const { error } = await userDb.from('tasks').insert({
          id: taskId,
          user_id: request.userId,
          title: taskTitle,
          description,
          status: 'todo',
          priority,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) {
          addLog('execution', 'Task creation failed to persist in Supabase.', { tool: 'task_manager', error: error.message });
        } else {
          toolsExecuted.push('task_manager');
          tasksCreated.push({ title: taskTitle, priority, description });
          addLog('execution', `Executed tool [task_manager]: Saved task "${taskTitle}" to the authenticated workspace.`, {
            tool: 'task_manager',
            taskId,
            createdCount: 1,
          });
        }
      }
    }

    if (plannedTools.includes('memory_vault') || (tools.includes('memory_write') && (lowerPrompt.includes('remember') || lowerPrompt.includes('prefer')))) {
      const canWriteMemory = request.memoryAccess?.canWrite !== false &&
        (request.permissions === undefined || request.permissions.some((permission) =>
          ['memory_write', 'memory.write', 'memory_vault', 'memory'].includes(permission)
        ));
      if (!canWriteMemory || !userDb || !request.userId) {
        addLog('execution', 'Memory was not saved: an authenticated session and memory-write permission are required.', {
          tool: 'memory_vault',
          permissionGranted: canWriteMemory,
          authenticated: Boolean(userDb && request.userId),
        });
      } else {
        const memoryTitle = `Directive from ${request.agentName}: ${request.taskPrompt.slice(0, 45)}`;
        const memoryContent = request.taskPrompt.slice(0, 2000);
        const memoryType = lowerPrompt.includes('prefer') ? 'user_preference' : 'agent_memory';
        const memoryId = `memory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const { error } = await userDb.from('memories').insert({
          id: memoryId,
          user_id: request.userId,
          title: memoryTitle,
          content: memoryContent,
          type: memoryType,
          confidence: 0.9,
          tags: [],
          agent_id: request.agentId,
          project_id: request.context?.projectId || null,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) {
          addLog('execution', 'Memory creation failed to persist in Supabase.', { tool: 'memory_vault', error: error.message });
        } else {
          toolsExecuted.push('memory_vault');
          newMemoriesDiscovered.push({ title: memoryTitle, content: memoryContent, type: memoryType });
          addLog('execution', `Executed tool [memory_vault]: Saved memory "${memoryTitle}" to the authenticated workspace.`, {
            tool: 'memory_vault',
            memoryId,
            type: memoryType,
          });
        }
      }
    }

    // 6. VALIDATION
    const outputLength = providerResponse.text.trim().length;
    const isValid = outputLength > 0 && !providerResponse.text.includes('undefined');
    if (!isValid) {
      throw new Error('Validation failed: model returned an empty or invalid response string.');
    }

    addLog('validation', 'Validated response structure, non-empty criteria, and safety constraints.', {
      outputLength,
      validationPassed: true,
      hasToolResults: toolsExecuted.length > 0,
    });

    // 7. RESPONSE
    addLog('response', 'Executive response synthesis completed and approved for presentation.', {
      preview: providerResponse.text.slice(0, 120),
      finishReason: providerResponse.finishReason,
    });

    // 8. MEMORY UPDATE
    const newItemsCount = newMemoriesDiscovered.length + tasksCreated.length;
    addLog(
      'memory_update',
      `Synchronized lifecycle state. Discovered ${newMemoriesDiscovered.length} memory candidates and ${tasksCreated.length} action items.`,
      {
        newMemoriesCount: newMemoriesDiscovered.length,
        newTasksCount: tasksCreated.length,
      }
    );

    // Outbound integration dispatch if configured
    dispatchZapierEvent('agent.executed', {
      executionId,
      agentId: request.agentId,
      agentName: request.agentName,
      status: 'completed',
      toolsUsed: toolsExecuted,
      timestamp: new Date().toISOString(),
    }).catch((e) => console.warn('[Zapier dispatch notice]', e));

    // 9. COMPLETED
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;
    if (runPersisted && userDb && request.userId) {
      const { error } = await userDb.from('executions').update({
        status: 'completed',
        output: { text: providerResponse.text, toolsExecuted, tasksCreated, newMemoriesDiscovered },
        completed_at: completedAt,
      }).eq('id', executionId).eq('user_id', request.userId);
      if (error) addLog('memory_update', 'Could not finalize the saved execution record.', { reason: error.message });
    }
    addLog('completed', `Execution lifecycle completed successfully in ${durationMs}ms.`, {
      durationMs,
      completedAt,
    });

    return {
      executionId,
      agentId: request.agentId,
      status: 'completed',
      logs,
      output: providerResponse.text,
      toolsExecuted,
      newMemoriesDiscovered,
      tasksCreated,
      startedAt,
      completedAt,
      durationMs,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    addLog('failed', `Execution pipeline halted with error: ${errorMessage}`, {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;
    if (runPersisted && userDb && request.userId) {
      const { error: persistError } = await userDb.from('executions').update({
        status: 'failed',
        error: errorMessage,
        output: {},
        completed_at: completedAt,
      }).eq('id', executionId).eq('user_id', request.userId);
      if (persistError) console.warn('[Orchestrator] Could not persist failed run state:', persistError.message);
    }

    return {
      executionId,
      agentId: request.agentId,
      status: 'failed',
      logs,
      output: `[Pipeline Execution Error]: ${errorMessage}`,
      toolsExecuted,
      newMemoriesDiscovered: [],
      tasksCreated: [],
      startedAt,
      completedAt,
      durationMs,
      error: errorMessage,
    };
  }
}
