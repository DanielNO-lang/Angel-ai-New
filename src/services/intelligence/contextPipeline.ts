/**
 * ANGEL AI — Client-Side Intelligence Context Pipeline
 * Assembles and budgets cross-domain workspace context for LLM execution:
 * - Conversation Context
 * - Memory Vault (Relevance-ranked)
 * - User Preferences
 * - Projects & Tasks
 * - Active Agent Configuration
 * - Available Tools
 * - Multimodal Perception (Visual & Voice)
 * - Connected Integrations
 */

import { Memory, Project, Task, Agent, ToolDefinition, Message } from '../../types';

export interface BuildContextParams {
  query: string;
  conversationHistory?: Message[];
  memories?: Memory[];
  userPreferences?: {
    name?: string;
    theme?: string;
    customInstructions?: string;
  };
  project?: Project | null;
  tasks?: Task[];
  agent?: Agent | null;
  tools?: ToolDefinition[];
  visualContext?: {
    lastAnalysis?: string;
    source?: string;
  };
  voiceContext?: {
    lastTranscript?: string;
  };
  tokenBudget?: number;
}

export interface BuiltContextResponse {
  compiledSystemInstruction: string;
  rankedMemories: Array<{ id: string; title: string; content: string; relevanceScore: number }>;
  includedTasks: Array<{ id: string; title: string; priority?: string }>;
  tokenBudgetUsage: {
    totalBudget: number;
    allocatedTokens: number;
  };
}

export async function buildIntelligenceContext(params: BuildContextParams): Promise<BuiltContextResponse> {
  try {
    const res = await fetch('/api/intelligence/build-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query,
        conversationHistory: params.conversationHistory?.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        memories: params.memories?.map((m) => ({
          id: m.id,
          title: m.title,
          content: m.content,
          tags: m.tags,
          type: m.type,
        })),
        userPreferences: params.userPreferences,
        project: params.project
          ? {
              id: params.project.id,
              name: params.project.name,
              description: params.project.description,
            }
          : undefined,
        tasks: params.tasks?.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
        })),
        agent: params.agent
          ? {
              id: params.agent.id,
              name: params.agent.name,
              role: params.agent.tagline || params.agent.description,
              systemInstructions: params.agent.systemInstructions,
              allowedTools: params.agent.tools,
            }
          : undefined,
        tools: params.tools?.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
        visualContext: params.visualContext,
        voiceContext: params.voiceContext,
        tokenBudget: params.tokenBudget || 4000,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[buildIntelligenceContext network error, falling back locally]', err);
  }

  // Graceful client-side fallback
  const query = params.query.toLowerCase();
  const ranked = (params.memories || [])
    .map((m) => {
      let score = 0.3;
      if (m.title.toLowerCase().includes(query)) score += 0.4;
      if (m.content.toLowerCase().includes(query)) score += 0.2;
      return { id: m.id, title: m.title, content: m.content, relevanceScore: Math.min(1.0, score) };
    })
    .filter((m) => m.relevanceScore >= 0.3)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);

  const parts = [
    `You are ${params.agent?.name || 'Angel AI'}, a calm, intelligent, fast, and deeply integrated AI workspace.`,
  ];

  if (params.agent?.systemInstructions) {
    parts.push(params.agent.systemInstructions);
  }

  if (ranked.length > 0) {
    parts.push('\nRelevant Memories:');
    ranked.forEach((m) => parts.push(`- ${m.title}: ${m.content}`));
  }

  if (params.project) {
    parts.push(`\nActive Project: ${params.project.name} (${params.project.description || ''})`);
  }

  if (params.visualContext?.lastAnalysis) {
    parts.push(`\nVisual Context (${params.visualContext.source || 'camera'}): ${params.visualContext.lastAnalysis.slice(0, 300)}`);
  }

  return {
    compiledSystemInstruction: parts.join('\n'),
    rankedMemories: ranked,
    includedTasks: (params.tasks || []).slice(0, 5).map((t) => ({ id: t.id, title: t.title, priority: t.priority })),
    tokenBudgetUsage: {
      totalBudget: params.tokenBudget || 4000,
      allocatedTokens: 500,
    },
  };
}
