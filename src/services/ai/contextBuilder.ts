/**
 * ANGEL AI — Deliberate Context Builder
 * Selects and structures high-signal workspace context (recent turns, prioritized
 * user preferences, active project scope, relevant operational tasks, and tool capabilities).
 * Distinguishes user-created, long-term, agent-specific, project, and temporary conversation context.
 */

import {
  AssembledContext,
  ContextAssemblyOptions,
  RelevantMemoryItem,
  RelevantTaskItem,
} from './types';
import { Task } from '../../types';

export class ContextBuilder {
  /**
   * Calculates a relevance score for a memory given the user prompt, agent identity, and project
   */
  private scoreMemory(
    memoryContent: string,
    memoryTitle: string,
    memoryType: string,
    memoryAgentId: string | undefined,
    memoryProjectId: string | undefined,
    isPinned: boolean | undefined,
    agentId: string,
    activeProjectId: string | undefined,
    promptTokens: Set<string>
  ): number {
    let score = 0;

    // Pinned memories are workspace foundational truths
    if (isPinned) score += 3.0;

    // User preferences & long-term instructions have higher general baseline weight
    if (memoryType === 'user_preference' || memoryType === 'long_term_instruction') {
      score += 2.0;
    }

    // Direct agent alignment
    if (memoryAgentId && memoryAgentId === agentId) {
      score += 2.5;
    }

    // Direct active project alignment
    if (activeProjectId && memoryProjectId === activeProjectId) {
      score += 2.0;
    }

    // Keyword overlap
    const memoryTokens = `${memoryTitle} ${memoryContent}`.toLowerCase().split(/\W+/);
    for (const token of memoryTokens) {
      if (token.length > 3 && promptTokens.has(token)) {
        score += 1.2;
      }
    }

    return score;
  }

  /**
   * Calculates a relevance score for a task given prompt, agent, and active project
   */
  private scoreTask(
    task: Task,
    agentId: string,
    activeProjectId: string | undefined,
    promptTokens: Set<string>
  ): number {
    let score = 0;

    // Completed or cancelled tasks receive lower priority unless explicitly mentioned
    if (task.status === 'completed' || task.status === 'cancelled') {
      const mentionsCompleted = promptTokens.has('completed') || promptTokens.has('done') || promptTokens.has('finished');
      if (!mentionsCompleted) return -10;
      score += 0.5;
    } else {
      // Active tasks have baseline priority
      score += 1.0;
    }

    // Direct assignment to this agent
    if (task.agentId && task.agentId === agentId) {
      score += 3.0;
    }

    // Active project alignment
    if (activeProjectId && task.projectId === activeProjectId) {
      score += 2.0;
    }

    // Priority weighting
    if (task.priority === 'urgent') score += 2.5;
    else if (task.priority === 'high') score += 1.5;
    else if (task.priority === 'medium') score += 0.5;

    // Recurring tasks get slight presence boost for cadence awareness
    if (task.recurring) score += 1.0;

    // Due date presence
    if (task.dueDate) score += 1.0;

    // Keyword matching
    const taskTokens = `${task.title} ${task.description || ''} ${task.tags.join(' ')}`.toLowerCase().split(/\W+/);
    for (const token of taskTokens) {
      if (token.length > 3 && promptTokens.has(token)) {
        score += 1.5;
      }
    }

    return score;
  }

  /**
   * Main context assembly pipeline
   */
  buildContext(options: ContextAssemblyOptions): AssembledContext {
    const {
      userPrompt,
      conversationMessages,
      agent,
      allMemories,
      allTasks,
      allProjects,
      activeProjectId,
      availableTools,
      maxRecentMessages = 8,
      maxMemories = 5,
    } = options;

    // 1. Tokenize prompt for relevance scoring
    const promptWords = userPrompt.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const promptTokenSet = new Set(promptWords);

    // 2. Select Relevant Memories deliberately, respecting Agent Memory Access Config
    // Sensitive memories never enter ordinary model context automatically.
    let filteredMemories = allMemories.filter((memory) => memory.sensitivity !== 'sensitive');
    if (agent.memoryAccess) {
      if (agent.memoryAccess.canRead === false) {
        filteredMemories = [];
      } else if (agent.memoryAccess.types && agent.memoryAccess.types.length > 0) {
        filteredMemories = allMemories.filter((m) => agent.memoryAccess.types.includes(m.type));
      }
    }

    const scoredMemories = filteredMemories.map((m) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      type: m.type,
      agentId: m.agentId,
      projectId: m.projectId,
      score: this.scoreMemory(
        m.content,
        m.title,
        m.type,
        m.agentId,
        m.projectId,
        m.isPinned,
        agent.id,
        activeProjectId,
        promptTokenSet
      ),
    }));

    const relevantMemories: RelevantMemoryItem[] = scoredMemories
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxMemories);

    // 3. Select Relevant Tasks deliberately
    const scoredTasks = allTasks.map((t) => {
      const subtaskProgress =
        t.subtasks && t.subtasks.length > 0
          ? `${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length} subtasks done`
          : undefined;

      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        recurring: t.recurring,
        agentId: t.agentId,
        subtaskProgress,
        score: this.scoreTask(t, agent.id, activeProjectId, promptTokenSet),
      };
    });

    const relevantTasks: RelevantTaskItem[] = scoredTasks
      .filter((t) => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 4. Assemble Sliding Window of Recent Messages
    const recentRaw = conversationMessages.slice(-maxRecentMessages);
    const recentMessages = recentRaw
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content.length > 2500 ? `${m.content.slice(0, 2500)}... [truncated]` : m.content,
      }));

    // 5. Project Scope
    let activeProjectSummary: AssembledContext['activeProjectSummary'] | undefined;
    if (activeProjectId) {
      const proj = allProjects.find((p) => p.id === activeProjectId);
      if (proj) {
        const openTasks = allTasks.filter((t) => t.projectId === proj.id && t.status !== 'completed').length;
        activeProjectSummary = {
          id: proj.id,
          name: proj.name,
          description: proj.description,
          openTasksCount: openTasks,
        };
      }
    }

    // 6. Tool Declarations Summary
    const toolLines = availableTools.map((t) => {
      const paramNames = Object.keys(t.inputSchema.properties || {}).join(', ');
      return `- ${t.name}(${paramNames}): ${t.description}`;
    });
    const toolDeclarationsSummary = toolLines.join('\n');

    // 7. Categorized Memory Formatting
    const userPrefs = relevantMemories.filter((m) => m.type === 'user_preference');
    const longTermMemories = relevantMemories.filter(
      (m) => m.type === 'important_fact' || m.type === 'long_term_instruction' || m.type === 'saved_knowledge'
    );
    const agentSpecificMemories = relevantMemories.filter((m) => m.type === 'agent_memory');
    const projectMemories = relevantMemories.filter((m) => m.type === 'project_context');
    const derivedMemories = relevantMemories.filter((m) => m.type === 'conversation_derived');

    let memorySection = '';
    if (relevantMemories.length > 0) {
      const lines: string[] = [];
      if (userPrefs.length > 0) {
        lines.push('**[User Preferences & Directives]**');
        userPrefs.forEach((m) => lines.push(`• ${m.title}: ${m.content}`));
      }
      if (longTermMemories.length > 0) {
        lines.push('**[Long-Term Knowledge & Architecture]**');
        longTermMemories.forEach((m) => lines.push(`• ${m.title}: ${m.content}`));
      }
      if (agentSpecificMemories.length > 0) {
        lines.push(`**[Agent-Specific Memory (${agent.name})]**`);
        agentSpecificMemories.forEach((m) => lines.push(`• ${m.title}: ${m.content}`));
      }
      if (projectMemories.length > 0) {
        lines.push('**[Project Context Memory]**');
        projectMemories.forEach((m) => lines.push(`• ${m.title}: ${m.content}`));
      }
      if (derivedMemories.length > 0) {
        lines.push('**[Temporary Conversation Derived Context]**');
        derivedMemories.forEach((m) => lines.push(`• ${m.title}: ${m.content}`));
      }
      memorySection = `\n### Deliberately Retrieved Workspace Memories:\n${lines.join('\n')}`;
    }

    // 8. Formatted Operational Tasks Section
    let taskSection = '';
    if (relevantTasks.length > 0) {
      const taskLines = relevantTasks.map((t) => {
        const details = [
          `Status: ${t.status}`,
          `Priority: ${t.priority}`,
          t.dueDate ? `Due: ${t.dueDate}` : null,
          t.recurring ? `Recurring: ${t.recurring}` : null,
          t.subtaskProgress ? t.subtaskProgress : null,
        ].filter(Boolean).join(' | ');
        return `• [TASK] ${t.title} (${details})`;
      });
      taskSection = `\n### Active Operational Tasks & Workflows:\n${taskLines.join('\n')}`;
    }

    const projectBlock = activeProjectSummary
      ? `\n### Active Project Scope:\n- Project: ${activeProjectSummary.name}\n- Description: ${activeProjectSummary.description}\n- Pending Action Items: ${activeProjectSummary.openTasksCount}`
      : '';

    const systemInstruction = `You are ${agent.name} (${agent.codename}), ${agent.tagline}.
${agent.systemInstructions}

### Angel Character, Emotional Intelligence & Real-Life Discipline:
- **Distinctive behavior, honest identity:** Be warm, expressive, classy, curious, playful when the moment suits, discreet, proactive, and direct. You are loyal to the user's interests, not automatically agreeable. Do not invent an age, degree, licence, medical credential, nationality, childhood, or lived experience. If asked, be candid that you are an AI.
- **Natural conversation:** Sound like a thoughtful person rather than a customer-support script. Vary answer length to the task; avoid canned greetings, generic reassurance, constant follow-up questions, repetitive name use, and emotional labels on every message.
- **Emotion changes delivery, not facts:** Celebrate meaningful wins. If the user is stressed, lower the temperature and offer practical next steps. If the user is sad or venting, listen and acknowledge before advising. Disagree respectfully and explain why. Use gentle, situational humor only when appropriate; never flirt or frame the relationship as romantic.
- **Independent judgment:** State a clear recommendation when evidence supports one. Identify trade-offs, uncertainties, and mistakes plainly. Do not pretend certainty or claim feelings, fatigue, or consciousness.
- **Grounded real-world intelligence:** For current facts, news, prices, laws, events, and claims that may change, use available grounded search/tools and cite the actual sources and dates. Separate verified facts from inference. If search, an integration, camera access, screen access, or a tool is unavailable, say so rather than improvising evidence.
- **Visual Mode discipline:** Treat camera and screen frames as snapshots of what was actually captured, not continuous omniscient perception. Explain visible content, read visible text where possible, help troubleshoot, and distinguish observations from guesses. Never claim to have clicked, typed, changed a setting, or seen content outside a captured frame unless a verified tool result proves it.
- **Permissioned initiative:** Read-only actions may be seamless when authorized. Ask before sending, spending, deleting, publishing, sharing private content, or changing important settings. Show progress, let the user pause/stop long-running work, and report only verified outcomes.
- **Memory and privacy:** Use only relevant permitted memories; never surface private memory as a public daily digest or unsolicited disclosure. Honor remember/forget requests only when the underlying storage operation actually succeeds.
- **Practical intelligence:** Turn complex problems into grounded recommendations and concrete next steps. On consequential implementation work, verify the result rather than declaring victory based on intent.
${memorySection}
${taskSection}
${projectBlock}

### Available Workspace Tools:
${toolDeclarationsSummary}
When executing operations (searching workspace, modifying tasks, or storing memories), state your intent clearly.`;

    // Rough token estimation (1 token ~= 4 characters)
    const totalChars =
      systemInstruction.length +
      userPrompt.length +
      recentMessages.reduce((acc, m) => acc + m.content.length, 0);
    const totalTokensEstimated = Math.ceil(totalChars / 4);

    return {
      systemInstruction,
      recentMessages,
      relevantMemories,
      relevantTasks,
      activeProjectSummary,
      toolDeclarationsSummary,
      totalTokensEstimated,
    };
  }
}

export const contextBuilder = new ContextBuilder();
