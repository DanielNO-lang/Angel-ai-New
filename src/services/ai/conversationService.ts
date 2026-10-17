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


/** Normalize transport/provider failures before displaying them to a user. */
export function describeRequestFailure(body: string, status: number, fallback: string): string {
  let detail = body.trim();
  if (detail) {
    try {
      const parsed = JSON.parse(detail);
      detail = typeof parsed?.error === 'string' ? parsed.error : typeof parsed?.message === 'string' ? parsed.message : detail;
    } catch {}
  }
  detail = detail
    .replace(/(api[_ -]?key|authorization|bearer|token|secret)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  return detail ? `${fallback} (HTTP ${status}): ${detail}` : `${fallback} (HTTP ${status}).`;
}

export function describeUnknownFailure(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.replace(/\s+/g, ' ').trim().slice(0, 240);
  return message || fallback;
}

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
    let streamFailure = '';

    try {
      let streamSucceeded = false;
      try {
        const response = await fetch('/api/ai/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            systemInstruction: toolAugmentedInstruction,
            conversationHistory: assembledContext.recentMessages,
            modelId: agent.modelConfig.modelId || 'gemini-3.8-flash',
            providerId: agent.modelConfig.provider || 'gemini',
            temperature: agent.modelConfig.temperature,
          }),
        });

        if (!response.ok) {
          const details = await response.text().catch(() => '');
          throw new Error(describeRequestFailure(details, response.status, 'Streaming request failed'));
        }
        if (!response.body) {
          throw new Error('The streaming endpoint returned no response body.');
        }
        {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          agentExecutionLifecycle.advanceStage(
            lifecycleSession.sessionId,
            'response',
            'Streaming Response',
            'Receiving token stream from provider.'
          );

          let sseBuffer = '';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split('\n');
            // Keep any trailing incomplete line in the buffer
            sseBuffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6).trim();
                if (jsonStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.error) {
                    console.warn('[ConversationService] Stream reported error:', parsed.error);
                    throw new Error(parsed.error);
                  }
                  if (parsed.chunk) {
                    accumulatedText += parsed.chunk;
                    streamSucceeded = true;
                    if (onToken) {
                      onToken(parsed.chunk, accumulatedText);
                    }
                  }
                } catch (parseErr) {
                  if (parseErr instanceof Error && !parseErr.message.includes('JSON')) {
                    throw parseErr;
                  }
                }
              }
            }
          }
        }
      } catch (streamErr) {
        streamFailure = describeUnknownFailure(streamErr, 'Streaming request failed');
        console.warn('[ConversationService] Stream attempt failed, trying single-shot generate fallback:', streamFailure);
      }

      // If streaming didn't produce text, fallback to /api/ai/generate
      if (!accumulatedText.trim()) {
        try {
          const genRes = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              systemInstruction: toolAugmentedInstruction,
              conversationHistory: assembledContext.recentMessages,
              modelId: agent.modelConfig.modelId || 'gemini-3.8-flash',
              providerId: agent.modelConfig.provider || 'gemini',
              temperature: agent.modelConfig.temperature,
            }),
          });
          if (!genRes.ok) {
            const details = await genRes.text().catch(() => '');
            throw new Error(describeRequestFailure(details, genRes.status, 'Single-shot generation failed'));
          }
          const genData = await genRes.json();
          if (typeof genData.text !== 'string' || !genData.text.trim()) {
            throw new Error('The AI provider returned an empty response.');
          }
          accumulatedText = genData.text.trim();
          streamSucceeded = true;
          if (onToken) {
            onToken(accumulatedText, accumulatedText);
          }
        } catch (genErr) {
          streamFailure = describeUnknownFailure(genErr, 'Single-shot generation failed');
          console.warn('[ConversationService] Generate fallback failed:', streamFailure);
        }
      }

      // Never present a local placeholder as a successful AI answer. Preserve the request
      // failure so AppContext can show a retry action without duplicating the user message.
      if (!accumulatedText.trim()) {
        const detail = streamFailure || 'The AI provider returned no usable response.';
        throw new Error(`Angel could not complete this response. ${detail} Please retry when the provider or connection is available.`);
      }

      agentExecutionLifecycle.advanceStage(
        lifecycleSession.sessionId,
        'completed',
        'Execution Completed',
        `Synthesis completed (${accumulatedText.length} characters emitted).`
      );

      return {
        content: accumulatedText,
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
