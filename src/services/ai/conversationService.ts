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
      modelId,
      providerId,
      mode,
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

    // Operating modes shape the work, never Angel's personality.
    if (mode === 'think') {
      toolAugmentedInstruction += '\n\nReasoning mode: think carefully before answering. Keep private chain-of-thought internal and present a clear conclusion with concise key steps or assumptions when useful. For greetings and simple questions, answer naturally without unnecessary analysis.';
    } else if (mode === 'search') {
      toolAugmentedInstruction += '\n\nSearch mode: use available search or workspace tools when relevant. Ground factual claims in returned evidence, distinguish evidence from uncertainty, and cite sources when the tool supplies source references. Do not claim to have searched if no search tool ran.';
    } else if (mode === 'browse') {
      toolAugmentedInstruction += '\n\nBrowse mode: use available browsing/research tools to inspect current or user-requested material, summarise findings in Angel’s normal voice, and cite source URLs when available. Do not imply web access if no browser/search tool ran.';
    }

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

    if (promptHasToolIntent || mode === 'search' || mode === 'browse') {
      try {
        const toolRes = await fetch('/api/ai/tool-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            systemInstruction: toolAugmentedInstruction,
            conversationHistory: assembledContext.recentMessages,
            tools: discoverableTools,
            modelId: modelId || agent.modelConfig.modelId,
            providerId: providerId || agent.modelConfig.provider || 'gemini',
            mode,
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
      `Routing to ${providerId || agent.modelConfig.provider} (${modelId || agent.modelConfig.modelId}).`
    );

    let accumulatedText = '';
    let providerFailureMessage: string | null = null;

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
            modelId: modelId || agent.modelConfig.modelId || 'gemini-3.8-flash',
            providerId: providerId || agent.modelConfig.provider || 'gemini',
            mode,
            temperature: agent.modelConfig.temperature,
          }),
        });

        if (response.ok && response.body) {
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
                  if (parsed.error && !accumulatedText) providerFailureMessage = String(parsed.error);
                  const token = parsed.chunk || parsed.text;
                  if (token) {
                    accumulatedText += token;
                    streamSucceeded = true;
                    if (onToken) {
                      onToken(token, accumulatedText);
                    }
                  } else if (parsed.error && !accumulatedText) {
                    console.warn('[ConversationService] Stream reported warning:', parsed.error);
                  }
                } catch (parseErr) {
                  // Non-fatal parse issue on fragmented SSE boundary
                }
              }
            }
          }
        } else {
          const errorBody = await response.json().catch(() => ({}));
          providerFailureMessage = typeof errorBody?.error === 'string'
            ? errorBody.error
            : 'Streaming request failed with HTTP ' + response.status + '.';
        }
      } catch (streamErr) {
        providerFailureMessage = streamErr instanceof Error ? streamErr.message : String(streamErr);
        console.warn('[ConversationService] Stream attempt failed; trying single-response fallback:', providerFailureMessage);
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
              modelId: modelId || agent.modelConfig.modelId || 'gemini-3.8-flash',
              providerId: providerId || agent.modelConfig.provider || 'gemini',
              mode,
              temperature: agent.modelConfig.temperature,
            }),
          });
          const genData = await genRes.json().catch(() => ({}));
          if (genRes.ok && typeof genData.text === 'string' && genData.text.trim()) {
            accumulatedText = genData.text.trim();
            if (onToken) onToken(accumulatedText, accumulatedText);
          } else {
            providerFailureMessage = typeof genData.error === 'string'
              ? genData.error
              : 'Single-response fallback failed with HTTP ' + genRes.status + '.';
          }
        } catch (genErr) {
          providerFailureMessage = genErr instanceof Error ? genErr.message : String(genErr);
          console.warn('[ConversationService] Generate fallback failed:', providerFailureMessage);
        }
      }

      // An upstream failure must remain a failure. Never synthesize a fake success.
      if (!accumulatedText.trim()) {
        throw new Error(providerFailureMessage
          ? 'Angel could not reach the selected AI model: ' + providerFailureMessage
          : 'The selected AI model returned no response. Check its configuration and try again.');
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
