/**
 * ANGEL AI — Core Conversation Service
 * Orchestrates the full interaction lifecycle:
 * Request -> Deliberate Context Assembly -> Tool Calling / Discovery -> Model Streaming -> Response Synthesis
 */

import { agentExecutionLifecycle } from './agentExecutionLifecycle';
import { contextBuilder } from './contextBuilder';
import { toolRegistry } from './toolRegistry';
import {
  SendMessageOptions,
  SendMessageResult,
  ToolExecutionContext,
} from './types';

export class ConversationService {
  /**
   * Dispatches a user message through the context builder, tool discovery, and streaming model pipeline.
   */
  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const {
      prompt,
      agent,
      conversationHistory,
      contextState,
      onToken,
      onToolStart,
      onToolComplete,
      onError,
    } = options;

    // 1. LIFECYCLE: Initialize Session
    const lifecycleSession = agentExecutionLifecycle.createSession(agent.id, agent.name);

    // 2. CONTEXT BUILDER: Assemble Deliberate Context
    const assembledContext = contextBuilder.buildContext({
      userPrompt: prompt,
      conversationMessages: conversationHistory,
      agent,
      allMemories: contextState.memories,
      allTasks: contextState.tasks,
      allProjects: contextState.projects,
      activeProjectId: contextState.activeProjectId,
      availableTools: toolRegistry.getAllTools(),
    });

    agentExecutionLifecycle.advanceStage(
      lifecycleSession.sessionId,
      'context_preparation',
      'Context Assembled',
      `Curated ${assembledContext.relevantMemories.length} relevant memories, ${assembledContext.recentMessages.length} prior turns. Estimated tokens: ~${assembledContext.totalTokensEstimated}.`,
      {
        relevantMemories: assembledContext.relevantMemories.map((m) => m.title),
        tokensEstimated: assembledContext.totalTokensEstimated,
      }
    );

    // 3. TOOL DISCOVERY & EXECUTION PIPELINE
    const toolCallsExecuted: SendMessageResult['toolCallsExecuted'] = [];
    const discoverableTools = toolRegistry.getDiscoverableDeclarations();

    // Check if prompt requires a workspace tool (intent detection)
    const toolContext: ToolExecutionContext = {
      tasks: contextState.tasks,
      memories: contextState.memories,
      projects: contextState.projects,
      activeProjectId: contextState.activeProjectId,
      createTask: contextState.createTask,
      updateTask: contextState.updateTask,
      createMemory: contextState.createMemory,
    };

    let toolAugmentedInstruction = assembledContext.systemInstruction;

    // Attempt model tool evaluation if prompt suggests tool usage
    const toolKeywords = [
      'create task',
      'add task',
      'new task',
      'search workspace',
      'web search',
      'search the web',
      'search online',
      'research online',
      'look up',
      'latest news',
      'find sources',
      'find task',
      'remember that',
      'store memory',
      'save preference',
      'what time',
      'current date',
    ];
    const promptHasToolIntent = toolKeywords.some((kw) => prompt.toLowerCase().includes(kw));

    if (promptHasToolIntent) {
      try {
        const toolRes = await fetch('/api/ai/tool-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            systemInstruction: assembledContext.systemInstruction,
            conversationHistory: assembledContext.recentMessages,
            tools: discoverableTools,
            modelId: agent.isBuiltIn ? 'auto' : agent.modelConfig.modelId,
            providerId: agent.isBuiltIn ? 'auto' : agent.modelConfig.provider,
          }),
        });

        if (toolRes.ok) {
          const data = await toolRes.json();
          if (data.toolCalls && Array.isArray(data.toolCalls) && data.toolCalls.length > 0) {
            for (const call of data.toolCalls) {
              agentExecutionLifecycle.advanceStage(
                lifecycleSession.sessionId,
                'execution',
                `Invoking Tool: ${call.name}`,
                `Tool args: ${JSON.stringify(call.args)}`
              );

              if (onToolStart) {
                onToolStart(call.name, call.args);
              }

              const result = await toolRegistry.executeTool(call.name, call.args, toolContext);

              if (onToolComplete) {
                onToolComplete(call.name, result);
              }

              toolCallsExecuted.push({
                toolName: call.name,
                input: call.args,
                output: result.data,
                status: result.success ? 'completed' : 'failed',
              });

              // Augment system prompt with the tool execution result
              toolAugmentedInstruction += `\n\n[TOOL EXECUTION REPORT]: Tool "${call.name}" was executed with result: ${result.summary}. Data: ${JSON.stringify(result.data)}. Reflect this result in your response to the user.`;
            }
          }
        }
      } catch (toolErr) {
        console.warn('[ConversationService] Tool call negotiation skipped or failed:', toolErr);
      }
    }

    // 4. MODEL EVALUATION & RESPONSE SYNTHESIS: Stream from AIProvider
    agentExecutionLifecycle.advanceStage(
      lifecycleSession.sessionId,
      'execution',
      'Initiating Intelligence Stream',
      `Routing to ${agent.modelConfig.provider} (${agent.modelConfig.modelId}).`
    );

    let accumulatedText = '';
    const controller = new AbortController();
    let timeoutReason: 'idle' | 'total' | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const requestTimer = setTimeout(() => {
      timeoutReason = 'total';
      controller.abort();
    }, 180_000);
    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        timeoutReason = 'idle';
        controller.abort();
      }, 45_000);
    };
    resetIdleTimer();

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: toolAugmentedInstruction,
          conversationHistory: assembledContext.recentMessages,
          modelId: agent.isBuiltIn ? 'auto' : agent.modelConfig.modelId,
          providerId: agent.isBuiltIn ? 'auto' : agent.modelConfig.provider,
          temperature: agent.modelConfig.temperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const details = await response.text().catch(() => '');
        const message = details.trim().slice(0, 500);
        throw new Error(`Angel stream request failed (HTTP ${response.status})${message ? `: ${message}` : ''}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamError: string | null = null;
      let streamFinished = false;

      agentExecutionLifecycle.advanceStage(
        lifecycleSession.sessionId,
        'response',
        'Streaming Response',
        'Receiving token stream from provider.'
      );

      const processSseLine = (line: string) => {
        if (!line.startsWith('data:')) return;
        const payload = line.slice(5).trim();
        if (!payload) return;
        if (payload === '[DONE]') {
          streamFinished = true;
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) streamError = String(parsed.error);
          if (parsed.chunk) {
            const token = String(parsed.chunk);
            accumulatedText += token;
            onToken?.(token, accumulatedText);
          }
          if (parsed.done) streamFinished = true;
        } catch {
          // Keep partial events in the buffer until their newline arrives.
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        resetIdleTimer();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        let newline = buffer.indexOf('\n');
        while (newline >= 0) {
          processSseLine(buffer.slice(0, newline).replace(/\r$/, ''));
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf('\n');
        }
        if (done) break;
      }
      if (buffer.trim()) processSseLine(buffer.trim());
      if (streamError) throw new Error(streamError);
      if (!streamFinished) {
        throw new Error(accumulatedText.trim()
          ? 'Angel stream disconnected before the response was marked complete. Retry to request a complete answer.'
          : 'Angel stream ended before a response was received. Check the connection and retry.');
      }
      if (!accumulatedText.trim()) {
        throw new Error('Angel completed the stream without returning any text. Check the configured model and provider.');
      }

      agentExecutionLifecycle.advanceStage(
        lifecycleSession.sessionId,
        'completed',
        'Execution Completed',
        `Synthesis completed (${accumulatedText.length} characters emitted).`
      );

      return {
        content: accumulatedText || 'Angel acknowledged your prompt.',
        toolCallsExecuted,
        contextSummary: {
          memoriesCount: assembledContext.relevantMemories.length,
          messagesIncluded: assembledContext.recentMessages.length,
          tokensEstimated: assembledContext.totalTokensEstimated,
        },
      };
    } catch (err) {
      const failure = timeoutReason === 'idle'
        ? new Error('Angel response stalled for 45 seconds. The request was stopped so you can retry.')
        : timeoutReason === 'total'
          ? new Error('Angel response exceeded the 3-minute request limit. The request was stopped so you can retry.')
          : err instanceof Error ? err : new Error(String(err));
      const errorMsg = failure.message;
      agentExecutionLifecycle.advanceStage(
        lifecycleSession.sessionId,
        'failed',
        'Execution Failed',
        errorMsg
      );

      if (onError) {
        onError(errorMsg);
      }

      throw failure;
    } finally {
      if (idleTimer) clearTimeout(idleTimer);
      clearTimeout(requestTimer);
    }
  }
}

export const conversationService = new ConversationService();
