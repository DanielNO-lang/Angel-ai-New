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
            modelId: agent.modelConfig.modelId,
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

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: toolAugmentedInstruction,
          conversationHistory: assembledContext.recentMessages,
          modelId: agent.modelConfig.modelId,
          providerId: agent.modelConfig.provider,
          temperature: agent.modelConfig.temperature,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: Failed to connect to Angel intelligence stream`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      agentExecutionLifecycle.advanceStage(
        lifecycleSession.sessionId,
        'response',
        'Streaming Response',
        'Receiving token stream from provider.'
      );

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        const lines = textChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                if (onToken) {
                  onToken(parsed.chunk, accumulatedText);
                }
              }
              if (parsed.done) {
                break;
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
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
      const errorMsg = err instanceof Error ? err.message : String(err);
      agentExecutionLifecycle.advanceStage(
        lifecycleSession.sessionId,
        'failed',
        'Execution Failed',
        errorMsg
      );

      if (onError) {
        onError(errorMsg);
      }

      throw err;
    }
  }
}

export const conversationService = new ConversationService();
