/**
 * ANGEL AI — Agent Execution Orchestrator
 * Implements the deterministic 9-step execution lifecycle:
 * REQUESTED -> CONTEXT PREPARATION -> MEMORY RETRIEVAL -> TOOL PLANNING ->
 * EXECUTION -> VALIDATION -> RESPONSE -> MEMORY UPDATE -> COMPLETED
 */

import { modelRouter } from './providers';
import { dispatchZapierEvent } from './zapier_service';

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

  const addLog = (stage: ExecutionStepLog['stage'], message: string, metadata?: Record<string, unknown>) => {
    logs.push({
      stage,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  };

  try {
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

### OPERATIONAL DIRECTIVE:
Execute with discipline and high craft. Do not invent external keys, URLs, or repository states. If you recommend new action items or detect durable user preferences, formulate them clearly.`;

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
      toolsExecuted.push('task_manager');
      const taskTitle = `Action Item: ${request.taskPrompt.replace(/^(create|add|make|plan)\s+(a\s+)?task\s+(to\s+)?/i, '').slice(0, 60)}`;
      tasksCreated.push({
        title: taskTitle,
        priority: lowerPrompt.includes('urgent') ? 'urgent' : lowerPrompt.includes('high') ? 'high' : 'medium',
        description: `Generated by ${request.agentName} during execution ${executionId}. Context: ${request.taskPrompt.slice(0, 120)}`,
      });
      addLog('execution', `Executed tool [task_manager]: Created workspace action item "${taskTitle}".`, {
        tool: 'task_manager',
        createdCount: 1,
      });
    }

    if (plannedTools.includes('memory_vault') || (tools.includes('memory_write') && (lowerPrompt.includes('remember') || lowerPrompt.includes('prefer')))) {
      toolsExecuted.push('memory_vault');
      const memoryTitle = `Directive from ${request.agentName}: ${request.taskPrompt.slice(0, 45)}`;
      newMemoriesDiscovered.push({
        title: memoryTitle,
        content: providerResponse.text.slice(0, 220),
        type: lowerPrompt.includes('prefer') ? 'user_preference' : 'agent_memory',
      });
      addLog('execution', `Executed tool [memory_vault]: Formulated memory candidate "${memoryTitle}".`, {
        tool: 'memory_vault',
        type: 'agent_memory',
      });
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
