/**
 * ANGEL AI — Client Intelligence Layer Type Definitions
 * Contracts for Tools, Context Assembly, Conversation Pipeline, and Agent Execution.
 */

import { Agent, Memory, Message, Project, Task } from '../../types';

// ============================================================================
// 1. TOOL CALL ARCHITECTURE SCHEMAS
// ============================================================================

export interface ToolParameterProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: {
    type: string;
    description?: string;
  };
  properties?: Record<string, ToolParameterProperty>;
}

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
}

export interface ToolOutputSchema {
  type: 'object' | 'string' | 'array';
  description?: string;
  properties?: Record<string, ToolParameterProperty>;
}

export interface ToolExecutionContext {
  tasks: Task[];
  memories: Memory[];
  projects: Project[];
  activeProjectId?: string;
  createTask?: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask?: (id: string, updates: Partial<Task>) => void;
  createMemory?: (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  sessionToken?: string | null;
  isGuest?: boolean;
}

export interface ToolExecutionResult {
  success: boolean;
  data: unknown;
  summary: string;
  error?: string;
  executionDurationMs?: number;
}

export type ToolCategory =
  | 'search'
  | 'web'
  | 'files'
  | 'library'
  | 'tasks'
  | 'projects'
  | 'memory'
  | 'data_analysis'
  | 'canvas'
  | 'media'
  | 'visual'
  | 'github'
  | 'vercel'
  | 'automation'
  | 'utility'
  | 'workspace';

export interface WorkspaceTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: ToolInputSchema;
  outputSchema: ToolOutputSchema;
  permissions?: string[];
  authRequired?: 'none' | 'user' | 'github' | 'vercel' | 'google';
  isAvailable?: boolean;
  unavailabilityReason?: string;
  execute: (input: Record<string, any>, context: ToolExecutionContext) => Promise<ToolExecutionResult>;
}

export interface ModelDiscoverableTool {
  id: string;
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  outputSchema?: ToolOutputSchema;
}

// ============================================================================
// 2. CONTEXT BUILDER
// ============================================================================

export interface ContextAssemblyOptions {
  userPrompt: string;
  conversationMessages: Message[];
  agent: Agent;
  allMemories: Memory[];
  allTasks: Task[];
  allProjects: Project[];
  activeProjectId?: string;
  availableTools: WorkspaceTool[];
  maxRecentMessages?: number;
  maxMemories?: number;
}

export interface RelevantMemoryItem {
  id: string;
  title: string;
  content: string;
  type: string;
  score: number;
  agentId?: string;
  projectId?: string;
}

export interface RelevantTaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  agentId?: string;
  subtaskProgress?: string;
  score: number;
}

export interface AssembledContext {
  systemInstruction: string;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  relevantMemories: RelevantMemoryItem[];
  relevantTasks: RelevantTaskItem[];
  activeProjectSummary?: {
    id: string;
    name: string;
    description: string;
    openTasksCount: number;
  };
  toolDeclarationsSummary: string;
  totalTokensEstimated: number;
}

// ============================================================================
// 3. CONVERSATION SERVICE PIPELINE
// ============================================================================

export interface SendMessageOptions {
  conversationId: string;
  prompt: string;
  agent: Agent;
  conversationHistory: Message[];
  contextState: {
    memories: Memory[];
    tasks: Task[];
    projects: Project[];
    activeProjectId?: string;
    createTask?: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateTask?: (id: string, updates: Partial<Task>) => void;
    createMemory?: (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  };
  onToken?: (token: string, accumulatedText: string) => void;
  onToolStart?: (toolName: string, args: Record<string, unknown>) => void;
  onToolComplete?: (toolName: string, result: ToolExecutionResult) => void;
  onError?: (error: string) => void;
}

export interface SendMessageResult {
  content: string;
  toolCallsExecuted: Array<{
    toolName: string;
    input: Record<string, unknown>;
    output: unknown;
    status: 'completed' | 'failed';
  }>;
  contextSummary: {
    memoriesCount: number;
    messagesIncluded: number;
    tokensEstimated: number;
  };
}

// ============================================================================
// 4. AGENT EXECUTION CONCEPT LIFECYCLE
// ============================================================================

export type AgentExecutionStage =
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

export interface AgentStageLog {
  stage: AgentExecutionStage;
  label: string;
  detail: string;
  timestamp: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface AgentLifecycleSession {
  sessionId: string;
  agentId: string;
  agentName: string;
  status: AgentExecutionStage;
  logs: AgentStageLog[];
  startedAt: string;
  completedAt?: string;
  result?: string;
  error?: string;
}
