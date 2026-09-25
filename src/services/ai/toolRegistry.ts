/**
 * ANGEL AI — Tool Call Registry & Architecture
 * Makes tools discoverable by models with formal input/output schemas,
 * parameter validation, and safe workspace execution handlers.
 */

import {
  ModelDiscoverableTool,
  ToolExecutionContext,
  ToolExecutionResult,
  WorkspaceTool,
} from './types';

// ============================================================================
// REAL CONCRETE WORKSPACE TOOLS
// ============================================================================

/**
 * 1. workspace_search
 * Finds tasks, memories, and projects matching a query string.
 */
export const workspaceSearchTool: WorkspaceTool = {
  id: 'workspace_search',
  name: 'workspace_search',
  description:
    'Search tasks, memories, and projects across the Angel workspace using keyword matching and optional scope filters.',
  category: 'workspace',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to match against titles, descriptions, and tags.',
      },
      scope: {
        type: 'string',
        description: 'Optional search scope: "all", "tasks", "memories", or "projects". Defaults to "all".',
        enum: ['all', 'tasks', 'memories', 'projects'],
      },
      limit: {
        type: 'number',
        description: 'Maximum number of items to return per category (default 4).',
      },
    },
    required: ['query'],
  },
  outputSchema: {
    type: 'object',
    description: 'Found tasks, memories, and projects with match snippets.',
  },
  execute: async (input, context): Promise<ToolExecutionResult> => {
    const query = String(input.query || '').toLowerCase().trim();
    const scope = (input.scope || 'all') as string;
    const limit = typeof input.limit === 'number' ? input.limit : 4;

    if (!query) {
      return {
        success: false,
        data: null,
        summary: 'Search query was empty.',
        error: 'Query parameter is required',
      };
    }

    const matchedTasks =
      scope === 'all' || scope === 'tasks'
        ? context.tasks
            .filter(
              (t) =>
                t.title.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.tags.some((tag) => tag.toLowerCase().includes(query))
            )
            .slice(0, limit)
            .map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority }))
        : [];

    const matchedMemories =
      scope === 'all' || scope === 'memories'
        ? context.memories
            .filter(
              (m) =>
                m.title.toLowerCase().includes(query) ||
                m.content.toLowerCase().includes(query) ||
                m.tags.some((tag) => tag.toLowerCase().includes(query))
            )
            .slice(0, limit)
            .map((m) => ({ id: m.id, title: m.title, content: m.content.slice(0, 120), type: m.type }))
        : [];

    const matchedProjects =
      scope === 'all' || scope === 'projects'
        ? context.projects
            .filter(
              (p) =>
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.tags.some((tag) => tag.toLowerCase().includes(query))
            )
            .slice(0, limit)
            .map((p) => ({ id: p.id, name: p.name, status: p.status }))
        : [];

    const totalFound = matchedTasks.length + matchedMemories.length + matchedProjects.length;

    return {
      success: true,
      data: {
        tasks: matchedTasks,
        memories: matchedMemories,
        projects: matchedProjects,
        totalFound,
      },
      summary: `Found ${totalFound} workspace item(s) matching "${query}" (${matchedTasks.length} tasks, ${matchedMemories.length} memories, ${matchedProjects.length} projects).`,
    };
  },
};

/**
 * 2. task_manager
 * Allows the model to inspect, create, or update workspace tasks.
 */
export const taskManagerTool: WorkspaceTool = {
  id: 'task_manager',
  name: 'task_manager',
  description:
    'Manage workspace action items: create a new task, update an existing task status or priority, or list pending tasks.',
  category: 'tasks',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform: "create", "update_status", or "list_pending".',
        enum: ['create', 'update_status', 'list_pending'],
      },
      title: {
        type: 'string',
        description: 'Task title (required for "create" action).',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the task requirements.',
      },
      priority: {
        type: 'string',
        description: 'Priority level of the task.',
        enum: ['low', 'medium', 'high', 'urgent'],
      },
      taskId: {
        type: 'string',
        description: 'Task ID to update (required for "update_status").',
      },
      status: {
        type: 'string',
        description: 'New status for the task.',
        enum: ['todo', 'in_progress', 'completed'],
      },
      dueDate: {
        type: 'string',
        description: 'Optional due date string (e.g. "2026-09-30").',
      },
    },
    required: ['action'],
  },
  outputSchema: {
    type: 'object',
    description: 'Result of the task operation.',
  },
  execute: async (input, context): Promise<ToolExecutionResult> => {
    const action = input.action as string;

    if (action === 'list_pending') {
      const pending = context.tasks
        .filter((t) => t.status !== 'completed')
        .slice(0, 8)
        .map((t) => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, dueDate: t.dueDate }));

      return {
        success: true,
        data: { pendingTasks: pending, totalPending: pending.length },
        summary: `Retrieved ${pending.length} pending task(s) from backlog.`,
      };
    }

    if (action === 'create') {
      const title = String(input.title || '').trim();
      if (!title) {
        return {
          success: false,
          data: null,
          summary: 'Task creation failed: title is missing.',
          error: 'Title is required for task creation',
        };
      }

      if (context.createTask) {
        context.createTask({
          title,
          description: input.description || 'Generated during conversation.',
          status: (input.status as any) || 'todo',
          priority: (input.priority as any) || 'medium',
          dueDate: input.dueDate,
          tags: ['assistant-created'],
          subtasks: [],
          projectId: context.activeProjectId,
        });

        return {
          success: true,
          data: { title, priority: input.priority || 'medium' },
          summary: `Successfully created task: "${title}" [${input.priority || 'medium'} priority].`,
        };
      }

      return {
        success: false,
        data: null,
        summary: 'Workspace task dispatcher is not available in current context.',
        error: 'createTask handler not provided',
      };
    }

    if (action === 'update_status') {
      const taskId = String(input.taskId || '').trim();
      const status = String(input.status || '').trim();

      if (!taskId || !status) {
        return {
          success: false,
          data: null,
          summary: 'Task update failed: taskId and status are required.',
          error: 'Missing taskId or status',
        };
      }

      const existingTask = context.tasks.find((t) => t.id === taskId);
      if (!existingTask) {
        return {
          success: false,
          data: null,
          summary: `Task not found with ID: ${taskId}`,
          error: 'Task not found',
        };
      }

      if (context.updateTask) {
        context.updateTask(taskId, { status: status as any });
        return {
          success: true,
          data: { taskId, oldStatus: existingTask.status, newStatus: status },
          summary: `Updated task "${existingTask.title}" status to "${status}".`,
        };
      }
    }

    return {
      success: false,
      data: null,
      summary: `Unsupported task_manager action: ${action}`,
      error: `Unknown action: ${action}`,
    };
  },
};

/**
 * 3. memory_vault
 * Allows storing or searching user preferences and factual records.
 */
export const memoryVaultTool: WorkspaceTool = {
  id: 'memory_vault',
  name: 'memory_vault',
  description:
    'Store permanent user preferences, project architectural decisions, or query remembered facts from the memory bank.',
  category: 'memory',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Operation to perform: "store", "retrieve", or "list_pinned".',
        enum: ['store', 'retrieve', 'list_pinned'],
      },
      title: {
        type: 'string',
        description: 'Brief title for the memory item (e.g. "User coding convention").',
      },
      content: {
        type: 'string',
        description: 'Detailed content of the preference, fact, or instruction.',
      },
      type: {
        type: 'string',
        description: 'Category of memory.',
        enum: ['user_preference', 'important_fact', 'project_context', 'long_term_instruction'],
      },
      query: {
        type: 'string',
        description: 'Search keyword when action is "retrieve".',
      },
    },
    required: ['action'],
  },
  outputSchema: {
    type: 'object',
    description: 'Memory records or confirmation of stored preference.',
  },
  execute: async (input, context): Promise<ToolExecutionResult> => {
    const action = input.action as string;

    if (action === 'list_pinned') {
      const pinned = context.memories
        .filter((m) => m.isPinned)
        .map((m) => ({ id: m.id, title: m.title, content: m.content, type: m.type }));

      return {
        success: true,
        data: { pinnedMemories: pinned },
        summary: `Retrieved ${pinned.length} pinned workspace memories.`,
      };
    }

    if (action === 'retrieve') {
      const q = String(input.query || '').toLowerCase().trim();
      const results = context.memories
        .filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.content.toLowerCase().includes(q) ||
            m.tags.some((t) => t.toLowerCase().includes(q))
        )
        .slice(0, 5)
        .map((m) => ({ id: m.id, title: m.title, content: m.content, type: m.type }));

      return {
        success: true,
        data: { matchedMemories: results },
        summary: `Found ${results.length} memory records matching "${q}".`,
      };
    }

    if (action === 'store') {
      const content = String(input.content || '').trim();
      const title = String(input.title || 'Recorded Preference').trim();

      if (!content) {
        return {
          success: false,
          data: null,
          summary: 'Cannot store empty memory content.',
          error: 'Content is required for memory storage',
        };
      }

      if (context.createMemory) {
        context.createMemory({
          title,
          content,
          type: (input.type as any) || 'user_preference',
          confidence: 0.95,
          tags: ['assistant-memorized'],
          source: 'conversation',
          isPinned: false,
        });

        return {
          success: true,
          data: { title, content },
          summary: `Stored memory: "${title}" into persistent memory bank.`,
        };
      }

      return {
        success: false,
        data: null,
        summary: 'Memory vault creation hook unavailable.',
        error: 'createMemory handler not available',
      };
    }

    return {
      success: false,
      data: null,
      summary: `Invalid memory_vault action: ${action}`,
      error: `Unknown action: ${action}`,
    };
  },
};

/**
 * 4. time_utility
 * Real-world timestamp, current time, and date math calculations.
 */
export const timeUtilityTool: WorkspaceTool = {
  id: 'time_utility',
  name: 'time_utility',
  description:
    'Get the current workspace ISO timestamp, calculate calendar deadlines, or format relative dates.',
  category: 'utility',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'Operation: "now" or "add_days".',
        enum: ['now', 'add_days'],
      },
      days: {
        type: 'number',
        description: 'Number of days to add (or subtract if negative) when operation is "add_days".',
      },
    },
    required: ['operation'],
  },
  outputSchema: {
    type: 'object',
    description: 'Formatted date/time calculation.',
  },
  execute: async (input): Promise<ToolExecutionResult> => {
    const now = new Date();

    if (input.operation === 'add_days' && typeof input.days === 'number') {
      const targetDate = new Date(now.getTime() + input.days * 24 * 60 * 60 * 1000);
      return {
        success: true,
        data: {
          computedDate: targetDate.toISOString(),
          formatted: targetDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          daysOffset: input.days,
        },
        summary: `Calculated date: ${targetDate.toISOString().slice(0, 10)} (${input.days > 0 ? '+' : ''}${input.days} days).`,
      };
    }

    return {
      success: true,
      data: {
        iso: now.toISOString(),
        utcDate: now.toUTCString(),
        localFormatted: now.toLocaleString(),
        timezoneOffsetMinutes: now.getTimezoneOffset(),
      },
      summary: `Current workspace time: ${now.toISOString()}`,
    };
  },
};

// ============================================================================
// TOOL REGISTRY CLASS
// ============================================================================

export class ToolRegistry {
  private tools: Map<string, WorkspaceTool> = new Map();

  constructor() {
    this.registerTool(workspaceSearchTool);
    this.registerTool(taskManagerTool);
    this.registerTool(memoryVaultTool);
    this.registerTool(timeUtilityTool);
  }

  registerTool(tool: WorkspaceTool): void {
    this.tools.set(tool.id, tool);
    this.tools.set(tool.name, tool);
  }

  getTool(idOrName: string): WorkspaceTool | undefined {
    return this.tools.get(idOrName);
  }

  getAllTools(): WorkspaceTool[] {
    const uniqueTools = new Set<WorkspaceTool>(this.tools.values());
    return Array.from(uniqueTools);
  }

  /**
   * Generates model-discoverable tool declarations formatted for model function calling
   */
  getDiscoverableDeclarations(): ModelDiscoverableTool[] {
    return this.getAllTools().map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
    }));
  }

  /**
   * Execute a tool safely with typed error wrapping
   */
  async executeTool(
    name: string,
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const tool = this.getTool(name);
    if (!tool) {
      return {
        success: false,
        data: null,
        summary: `Tool "${name}" is not registered in Angel workspace.`,
        error: `Tool not found: ${name}`,
      };
    }

    try {
      return await tool.execute(args, context);
    } catch (err) {
      console.error(`[ToolRegistry] Error executing tool "${name}":`, err);
      return {
        success: false,
        data: null,
        summary: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}`,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
