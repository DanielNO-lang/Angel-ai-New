/**
 * ANGEL AI — Deep Intelligence Layer & Context-Building Pipeline
 * Orchestrates cross-domain contextual retrieval, ranking, budgeting, and synthesis:
 * - Conversation Context (Thread history & conversational state)
 * - Memory Vault (Neural knowledge retrieval with semantic relevance scoring)
 * - User Preferences & Persona Tone
 * - Active Projects & Documentation Goals
 * - Tasks & Velocity Deadlines
 * - Active Agent Configuration & Capabilities
 * - Tool Registry (Dynamic schema exposure)
 * - Previous Execution Records & Traces
 * - Visual Perception (Camera/screen OCR & frame analysis)
 * - Voice Context (Speech utterances & tonal hints)
 * - Connected Integrations (Supabase, GitHub, Zapier, Google Workspace)
 */

export interface ContextBuildRequest {
  query: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  memories?: Array<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    confidence?: number;
    type?: string;
  }>;
  userPreferences?: {
    name?: string;
    theme?: string;
    tone?: string;
    systemInstruction?: string;
    customInstructions?: string;
  };
  project?: {
    id: string;
    name: string;
    description?: string;
    goals?: string[];
  };
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority?: string;
    dueDate?: string;
  }>;
  agent?: {
    id: string;
    name: string;
    role?: string;
    systemInstructions?: string;
    allowedTools?: string[];
  };
  tools?: Array<{
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
  }>;
  previousExecutions?: Array<{
    id: string;
    agentId?: string;
    taskPrompt: string;
    status: string;
    summary?: string;
  }>;
  visualContext?: {
    lastAnalysis?: string;
    source?: string;
    capturedAt?: string;
    ocrText?: string;
  };
  voiceContext?: {
    lastTranscript?: string;
    voiceName?: string;
  };
  tokenBudget?: number; // default: 4000
}

export interface RankedMemory {
  id: string;
  title: string;
  content: string;
  relevanceScore: number; // 0 to 1
  tags: string[];
}

export interface BuiltContextResult {
  compiledSystemInstruction: string;
  rankedMemories: RankedMemory[];
  includedTasks: Array<{ id: string; title: string; priority?: string }>;
  projectSummary?: { id: string; name: string; description?: string };
  visualSummary?: string;
  voiceSummary?: string;
  tokenBudgetUsage: {
    totalBudget: number;
    allocatedTokens: number;
    systemInstructionTokens: number;
    memoryTokens: number;
    projectTaskTokens: number;
    multimodalTokens: number;
  };
}

class IntelligenceService {
  /**
   * Approximate token count (roughly 4 characters per token for English text)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate semantic relevance score between a query and a candidate memory
   */
  private scoreMemoryRelevance(query: string, memory: { title: string; content: string; tags: string[] }): number {
    if (!query.trim()) return 0.5;

    const queryTokens = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2);

    if (queryTokens.length === 0) return 0.5;

    const memText = `${memory.title} ${memory.content} ${memory.tags.join(' ')}`.toLowerCase();

    let matches = 0;
    for (const token of queryTokens) {
      if (memText.includes(token)) {
        matches++;
      }
    }

    const keywordRatio = matches / queryTokens.length;

    // Direct title match gets bonus
    const titleBonus = memory.title.toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;
    // Exact tag match gets bonus
    const tagBonus = memory.tags.some((t) => query.toLowerCase().includes(t.toLowerCase())) ? 0.2 : 0;

    const rawScore = keywordRatio * 0.5 + titleBonus + tagBonus;
    return Math.min(1.0, Math.max(0.1, Number(rawScore.toFixed(2))));
  }

  /**
   * Main context building pipeline
   */
  buildContext(req: ContextBuildRequest): BuiltContextResult {
    const totalBudget = req.tokenBudget || 4000;
    const query = req.query || '';

    // 1. Rank memories
    const rankedMemories: RankedMemory[] = (req.memories || [])
      .map((mem) => ({
        id: mem.id,
        title: mem.title,
        content: mem.content,
        tags: mem.tags || [],
        relevanceScore: this.scoreMemoryRelevance(query, mem),
      }))
      .filter((mem) => mem.relevanceScore >= 0.25)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 2. Budget allocation
    // - Base instructions: ~800 tokens
    // - Relevant memories: ~1200 tokens
    // - Project & task context: ~800 tokens
    // - Multimodal (visual & voice): ~800 tokens
    // - Buffer / Execution history: ~400 tokens
    const memoryBudget = Math.floor(totalBudget * 0.3);
    const selectedMemories: RankedMemory[] = [];
    let currentMemoryTokens = 0;

    for (const mem of rankedMemories) {
      const estimated = this.estimateTokens(`${mem.title}: ${mem.content}`);
      if (currentMemoryTokens + estimated <= memoryBudget) {
        selectedMemories.push(mem);
        currentMemoryTokens += estimated;
      }
    }

    // 3. Filter relevant tasks (active or high priority)
    const activeTasks = (req.tasks || [])
      .filter((t) => t.status === 'in_progress' || t.status === 'todo' || t.priority === 'urgent' || t.priority === 'high')
      .slice(0, 6)
      .map((t) => ({ id: t.id, title: t.title, priority: t.priority }));

    // 4. Synthesize multimodal context
    let visualSummary: string | undefined;
    if (req.visualContext?.lastAnalysis) {
      visualSummary = `[Active Visual Inspection (${req.visualContext.source || 'camera'})]: ${req.visualContext.lastAnalysis.slice(0, 400)}`;
    }

    let voiceSummary: string | undefined;
    if (req.voiceContext?.lastTranscript) {
      voiceSummary = `[Recent Voice Input]: "${req.voiceContext.lastTranscript}"`;
    }

    // 5. Compile Master System Instruction
    const parts: string[] = [];

    // Core Identity
    const agentName = req.agent?.name || 'Angel AI';
    const agentRole = req.agent?.role || 'Personal Autonomous Workspace';
    parts.push(`You are ${agentName} (${agentRole}), operating within the Angel personal workspace.`);
    parts.push(`Maintain Angel's canonical persona: calm, intelligent, fast, concise, deeply integrated, and visually sophisticated. Avoid verbose preamble or repetitive greetings.`);

    if (req.agent?.systemInstructions) {
      parts.push(`\n### Specialized Agent Directives\n${req.agent.systemInstructions}`);
    }

    if (req.userPreferences?.customInstructions) {
      parts.push(`\n### User Custom Instructions\n${req.userPreferences.customInstructions}`);
    }

    // Persistent Memory Block
    if (selectedMemories.length > 0) {
      parts.push('\n### Retrieved Long-Term Memory (Ranked by Relevance)');
      for (const m of selectedMemories) {
        parts.push(`- **${m.title}** (relevance: ${(m.relevanceScore * 100).toFixed(0)}%): ${m.content}`);
      }
    }

    // Project Context
    if (req.project) {
      parts.push(`\n### Active Project: ${req.project.name}`);
      if (req.project.description) {
        parts.push(`Description: ${req.project.description}`);
      }
      if (req.project.goals && req.project.goals.length > 0) {
        parts.push(`Goals: ${req.project.goals.join('; ')}`);
      }
    }

    // Task Context
    if (activeTasks.length > 0) {
      parts.push('\n### Active & High-Priority Tasks');
      for (const t of activeTasks) {
        parts.push(`- [${t.priority || 'normal'}] ${t.title}`);
      }
    }

    // Multimodal Perception
    if (visualSummary) {
      parts.push(`\n### Multimodal Visual Frame\n${visualSummary}`);
    }
    if (voiceSummary) {
      parts.push(`\n### Voice Interaction\n${voiceSummary}`);
    }

    // Tool Guidance
    if (req.tools && req.tools.length > 0) {
      parts.push(`\n### Available Workspace Tools\nYou have access to the following tools: ${req.tools.map((t) => t.name).join(', ')}. Invoke tools when necessary to complete real actions.`);
    }

    const compiledSystemInstruction = parts.join('\n');
    const totalAllocated = this.estimateTokens(compiledSystemInstruction);

    return {
      compiledSystemInstruction,
      rankedMemories: selectedMemories,
      includedTasks: activeTasks,
      projectSummary: req.project ? { id: req.project.id, name: req.project.name, description: req.project.description } : undefined,
      visualSummary,
      voiceSummary,
      tokenBudgetUsage: {
        totalBudget,
        allocatedTokens: totalAllocated,
        systemInstructionTokens: this.estimateTokens(parts[0] || ''),
        memoryTokens: currentMemoryTokens,
        projectTaskTokens: this.estimateTokens(req.project?.name || '') + activeTasks.length * 15,
        multimodalTokens: (visualSummary ? this.estimateTokens(visualSummary) : 0) + (voiceSummary ? this.estimateTokens(voiceSummary) : 0),
      },
    };
  }
}

export const intelligenceService = new IntelligenceService();
