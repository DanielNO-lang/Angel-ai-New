/**
 * ANGEL AI — Core Domain Data Models & Type Definitions
 * Designed for cross-environment portability (AI Studio, Supabase, GitHub, Vercel)
 */

export type NavigationTab =
  | 'home'
  | 'chat'
  | 'voice'
  | 'visual_mode'
  | 'agent_lab'
  | 'projects'
  | 'tasks'
  | 'memories'
  | 'media_studio'
  | 'assistants'
  | 'marketplace'
  | 'more'
  | 'settings'
  | 'profile'
  | 'recycle_bin';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'code' | 'video_frame';
  size?: number;
  mimeType: string;
  dataUrl?: string; // base64 or object URL for client preview
  content?: string; // parsed text content
}

export interface ToolCallRecord {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  timestamp: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  agentId?: string;
  attachments?: Attachment[];
  toolCalls?: ToolCallRecord[];
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  agentId?: string;
  projectId?: string;
  pinned?: boolean;
  isArchived?: boolean;
  isSecret?: boolean;
  messageCount?: number;
  lastMessagePreview?: string;
}

export type AgentExecutionMode = 'autonomous' | 'assisted' | 'supervised';
export type AgentStatus = 'active' | 'draft' | 'archived';

export interface AgentModelConfig {
  provider: 'gemini' | 'openai_compatible' | 'anthropic_compatible';
  modelId: string;
  temperature: number;
  maxTokens?: number;
  topP?: number;
  thinkingBudget?: number;
}

export interface Agent {
  id: string;
  name: string;
  codename: string;
  tagline: string;
  description: string;
  systemInstructions: string;
  modelConfig: AgentModelConfig;
  tools: string[]; // Tool IDs
  permissions: string[]; // e.g. ['web_search', 'tasks_write', 'memory_access', 'code_execution']
  memoryAccess: {
    canRead: boolean;
    canWrite: boolean;
    types: MemoryType[];
  };
  executionMode: AgentExecutionMode;
  status: AgentStatus;
  ownerId: string;
  avatarIcon: string; // Lucide icon name or emoji
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  agentId?: string; // Associated agent
  conversationId?: string;
  projectId?: string;
  subtasks: Subtask[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  executionLog?: string[];
}

export type MemoryType =
  | 'user_preference'
  | 'important_fact'
  | 'project_context'
  | 'conversation_derived'
  | 'long_term_instruction'
  | 'saved_knowledge'
  | 'agent_memory';

export interface Memory {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  confidence: number; // 0 to 1
  source?: string; // conversation ID, manual input, or agent
  tags: string[];
  agentId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export type ProjectStatus = 'active' | 'planning' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  tags: string[];
  activeAgentIds: string[];
  agentIds: string[];
  taskIds: string[];
  memoryIds: string[];
  conversationIds: string[];
  goals: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MarketplaceCategory = 'agents' | 'tools' | 'workflows' | 'templates';
export type MarketplaceItemType = 'agent' | 'tool' | 'template' | 'integration' | 'workflow';

export interface MarketplaceItem {
  id: string;
  type: MarketplaceItemType;
  category: MarketplaceCategory;
  name: string;
  author: string;
  description: string;
  rating: number;
  reviewCount: number;
  installs: number;
  tags: string[];
  isOfficial: boolean;
  version: string;
  configSchema?: Record<string, unknown>;
  icon: string;
  installed: boolean;
  featured?: boolean;
}

export type ToolCategory = 'core' | 'memory' | 'tasks' | 'visual' | 'web' | 'automation';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  parameters: Record<string, unknown>;
  requiresPermission: boolean;
  authType: 'none' | 'api_key' | 'oauth';
  isAvailable: boolean;
}

export type ExecutionLifecycleStatus =
  | 'requested'
  | 'context_preparation'
  | 'memory_retrieval'
  | 'tool_planning'
  | 'execution'
  | 'executing'
  | 'validation'
  | 'validating'
  | 'response'
  | 'memory_update'
  | 'completed'
  | 'failed';

export interface ExecutionLog {
  stage: ExecutionLifecycleStatus;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentExecutionRecord {
  id: string;
  agentId: string;
  agentName: string;
  taskPrompt: string;
  status: ExecutionLifecycleStatus;
  logs: ExecutionLog[];
  result?: string;
  toolsUsed: string[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface IntegrationService {
  id: string;
  name: string;
  category: 'database' | 'deployment' | 'version_control' | 'automation' | 'ai_model';
  description: string;
  status: 'configured' | 'pending_configuration' | 'mock_fallback';
  requiredKeys: string[];
  configuredKeys: string[];
  setupDocsUrl: string;
}

export interface VisualModeCapture {
  id: string;
  timestamp: string;
  source: 'camera' | 'screen' | 'canvas' | 'snapshot_upload';
  dataUrl: string;
  analysis?: string;
  detectedInsights?: string[];
  isPendingConfig?: boolean;
  intent?: string;
  region?: { x: number; y: number; width: number; height: number };
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'blue' | 'indigo' | 'purple' | 'emerald' | 'rose' | 'amber';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'online' | 'away' | 'offline';
  avatarUrl?: string;
}

export interface AngelSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  fontSize: FontSize;
  compactMode: boolean;
  personality: {
    tone: 'balanced' | 'strategic' | 'direct' | 'creative';
    verbosity: 'concise' | 'balanced' | 'thorough';
    memoryStrictness: 'high' | 'medium' | 'broad';
  };
  models: {
    primaryProvider: 'gemini' | 'openai_compatible';
    geminiModel: string;
    enableThinking: boolean;
    secondaryModel?: string;
  };
  supabase: {
    connected: boolean;
    url?: string;
    hasAnonKey: boolean;
  };
  zapier: {
    webhookEnabled: boolean;
    outboundWebhookUrl?: string;
  };
}

export type CommandPaletteScope = 'all' | 'tasks' | 'memories' | 'projects' | 'agents' | 'actions';

export interface CommandPaletteResultItem {
  id: string;
  type: 'task' | 'memory' | 'project' | 'agent' | 'action';
  title: string;
  subtitle?: string;
  description?: string;
  categoryLabel: string;
  metadata: string[];
  shortcut?: string;
  score?: number;
  onSelect: () => void;
  quickAction?: {
    label: string;
    action: (e: React.MouseEvent) => void;
  };
  secondaryAction?: {
    label: string;
    action: (e: React.MouseEvent) => void;
  };
}
