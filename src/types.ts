/**
 * ANGEL AI — Core Domain Data Models & Type Definitions
 * Designed for cross-environment portability (AI Studio, Supabase, GitHub, Vercel)
 */

export type NavigationTab =
  | 'home'
  | 'chat'
  | 'voice'
  | 'visual_mode'
  | 'canvas'
  | 'data_analysis'
  | 'automation'
  | 'skills'
  | 'plugins'
  | 'agent_lab'
  | 'projects'
  | 'tasks'
  | 'schedule'
  | 'library'
  | 'memories'
  | 'media_studio'
  | 'assistants'
  | 'marketplace'
  | 'more'
  | 'settings'
  | 'profile'
  | 'recycle_bin';

export type SettingsSubSection =
  | 'account'
  | 'profile'
  | 'appearance'
  | 'theme'
  | 'workspace'
  | 'voice'
  | 'visual'
  | 'memory'
  | 'privacy'
  | 'notifications'
  | 'connections'
  | 'security';

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
  audioUrl?: string;
  audioDuration?: number;
}

export type ProjectStatus = 'active' | 'planning' | 'completed' | 'on_hold';

export interface ProjectHistoryItem {
  id: string;
  action: string;
  timestamp: string;
  detail?: string;
  userId?: string;
}

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
  workflowIds?: string[];
  assetIds?: string[];
  goals: string[];
  instructions?: string;
  history?: ProjectHistoryItem[];
  startDate?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error' | 'offline_queued';

export type WorkflowTriggerType = 'manual' | 'schedule' | 'webhook' | 'task_event' | 'agent';

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'exists';
  value: unknown;
  join?: 'and' | 'or';
}

export interface WorkflowExecutionChainStep {
  stepId: string;
  order: number;
  onSuccess?: 'next' | 'stop' | string;
  onFailure?: 'retry' | 'skip' | 'stop' | string;
  retryCount?: number;
}

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config?: Record<string, unknown>;
  scheduleCron?: string;
  webhookPath?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type:
    | 'agent'
    | 'tool'
    | 'action'
    | 'wait'
    | 'condition'
    | 'transform'
    | 'notification'
    | 'retry'
    | 'completion';
  agentId?: string;
  toolName?: string;
  config?: Record<string, unknown>;
  action?: string;
  condition?: string;
  retryCount?: number;
  timeoutSeconds?: number;
}

export interface Workflow {
  id: string;
  name: string;
  userId?: string;
  ownerId?: string;
  codename?: string;
  category: 'research' | 'code' | 'creative' | 'security' | 'operations' | 'general';
  description: string;
  tagline?: string;
  version: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  steps: WorkflowStep[];
  executionChain?: WorkflowExecutionChainStep[];
  stages?: string[];
  permissions: string[];
  projectId?: string;
  agentId?: string;
  systemInstructions?: string;
  isTemplate?: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
}

export interface ScheduledJob {
  id: string;
  title: string;
  type: 'task_reminder' | 'agent_execution' | 'workflow' | 'automation';
  scheduleType: 'one_time' | 'recurring';
  runAt: string; // ISO
  recurrence?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom_cron' | null;
  cronExpression?: string;
  timezone: string;
  targetId?: string; // agentId, workflowId, taskId
  payload?: Record<string, unknown>;
  status: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  lastRunAt?: string;
  nextRunAt?: string;
  missedRuns: number;
  retryCount: number;
  maxRetries: number;
  executionHistory: string[];
  createdAt: string;
  updatedAt: string;
}

export type MarketplaceCategory = 'agents' | 'tools' | 'workflows' | 'templates';
export type MarketplaceItemType = 'agent' | 'tool' | 'template' | 'integration' | 'workflow';

export interface MarketplaceReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MarketplaceItem {
  id: string;
  type: MarketplaceItemType;
  category: MarketplaceCategory;
  name: string;
  author: string;
  authorAvatar?: string;
  authorVerified?: boolean;
  description: string;
  rating: number;
  reviewCount: number;
  installs: number;
  tags: string[];
  isOfficial: boolean;
  version: string;
  permissionsRequired?: string[];
  compatibility?: string;
  reviews?: MarketplaceReview[];
  configSchema?: Record<string, unknown>;
  icon: string;
  installed: boolean;
  featured?: boolean;
}

export type LibraryCategory =
  | 'files'
  | 'documents'
  | 'media'
  | 'references'
  | 'materials'
  | 'resources'
  | 'assets'
  | 'artifacts';

export interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  type: 'file' | 'document' | 'media' | 'reference' | 'material' | 'resource' | 'asset' | 'artifact';
  category: LibraryCategory;
  url?: string;
  content?: string;
  mimeType?: string;
  sizeBytes?: number;
  projectId?: string;
  conversationId?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantEntity {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'Engineering' | 'Research' | 'Vision' | 'Creative' | 'Operations' | 'Productivity';
  version: string;
  modelId: string;
  systemInstructions: string;
  avatarUrl?: string;
  accentColor?: string;
  permissions: {
    readMemory: boolean;
    writeTasks: boolean;
    executeCode: boolean;
    webAccess: boolean;
    runTools: boolean;
  };
  allowedToolIds: string[];
  memoryScope: 'shared' | 'isolated' | 'read_only';
  isPublished: boolean;
  isArchived: boolean;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
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
  trigger?: 'manual' | 'schedule' | 'webhook' | 'composer' | 'agent';
  workflowId?: string;
  projectId?: string;
  inputs?: Record<string, unknown> | string;
  outputs?: Record<string, unknown> | string;
  artifacts?: Array<{ id: string; name: string; type: string; url?: string }>;
  durationMs?: number;
  retryCount?: number;
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

export type ThemeMode = 'dark' | 'light' | 'system' | 'midnight';
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
  title?: string;
  bio?: string;
  timezone?: string;
}

export interface AngelSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  fontSize: FontSize;
  compactMode: boolean;
  focusMode?: boolean;
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

/* ========================================================
   1. AUTOMATION PLATFORM MODELS
   ======================================================== */
export type AutomationTriggerEventType =
  | 'task.created'
  | 'task.completed'
  | 'project.created'
  | 'message.sent'
  | 'webhook.received'
  | 'scheduled.cron'
  | 'data.analyzed'
  | 'file.uploaded'
  | 'manual.trigger';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'exists'
  | 'regex';

export interface AutomationCondition {
  id: string;
  field: string; // e.g. "task.priority", "trigger.type"
  operator: ConditionOperator;
  value: any;
  join?: 'and' | 'or';
}

export type AutomationStepType =
  | 'agent_execution'
  | 'tool_call'
  | 'action'
  | 'webhook'
  | 'delay'
  | 'branch';

export interface AutomationStep {
  id: string;
  name: string;
  type: AutomationStepType;
  // For agent_execution
  agentId?: string;
  promptTemplate?: string;
  // For tool_call
  toolName?: string;
  toolArgs?: Record<string, any>;
  // For action
  actionType?: 'create_task' | 'send_notification' | 'write_memory' | 'export_data' | 'update_project_status';
  actionPayload?: Record<string, any>;
  // For webhook (outbound)
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET' | 'PUT';
  webhookHeaders?: Record<string, string>;
  // For delay & retry
  delayMs?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  // For branching
  branchConfig?: {
    conditionField: string;
    operator: ConditionOperator;
    conditionValue: any;
    thenStepIds: string[];
    elseStepIds: string[];
  };
}

export interface AutomationDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    type: AutomationTriggerEventType;
    eventFilter?: Record<string, any>;
    cronSchedule?: string; // e.g. "0 9 * * 1"
    webhookPath?: string;
  };
  conditions: AutomationCondition[];
  steps: AutomationStep[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  ownerId?: string;
}

export interface AutomationStepExecutionLog {
  stepId: string;
  stepName: string;
  stepType: AutomationStepType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  inputs?: any;
  outputs?: any;
  error?: string;
  decision?: string; // What Angel decided (branch or condition outcome)
  retryCount?: number;
}

export interface AutomationExecutionRecord {
  id: string;
  automationId: string;
  automationName: string;
  triggerEvent: AutomationTriggerEventType;
  triggerPayload: Record<string, any>;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  stepLogs: AutomationStepExecutionLog[];
  decisionSummary: string; // What triggered -> What Angel decided -> What ran -> Result
  resultSummary?: string;
  error?: string;
}

/* ========================================================
   2. DATA ANALYSIS DEDICATED CAPABILITY MODELS
   ======================================================== */
export type DataColumnType = 'string' | 'number' | 'boolean' | 'date';

export interface DataColumnMeta {
  name: string;
  type: DataColumnType;
  sampleValues: any[];
  nullCount: number;
  uniqueCount: number;
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    sum?: number;
    stdDev?: number;
  };
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  rowCount: number;
  columnCount: number;
  columns: DataColumnMeta[];
  rawData: Record<string, any>[];
  isSample: boolean; // Clearly distinguishes real user data from sample/demo data!
  createdAt: string;
  updatedAt: string;
  tags: string[];
  projectId?: string;
}

export interface DataFilterCondition {
  id: string;
  column: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_null' | 'is_not_null';
  value: any;
}

export interface DataTransformConfig {
  filters: DataFilterCondition[];
  groupByColumn?: string;
  aggregateColumn?: string;
  aggregateFunction?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  sortByColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter';

export interface DataChartConfig {
  chartType: ChartType;
  title: string;
  xAxisColumn: string;
  yAxisColumn: string;
  seriesName?: string;
  color?: string;
}

export interface DataInsightSummary {
  headline: string;
  keyFindings: string[];
  anomaliesDetected: string[];
  recommendations: string[];
  calculatedMetrics: Record<string, number | string>;
}

/* ========================================================
   3. CANVAS / BUILD WORKSPACE MODELS
   ======================================================== */
export type CanvasBlockType =
  | 'markdown'
  | 'code'
  | 'data_table'
  | 'artifact_preview'
  | 'callout'
  | 'system_architecture';

export interface CanvasBlock {
  id: string;
  type: CanvasBlockType;
  title?: string;
  content: string; // Markdown text or code string or JSON serialized table
  language?: string; // For code blocks: 'typescript' | 'javascript' | 'python' | 'html' | 'json' | 'sql'
  output?: string; // Execution or evaluation output
  meta?: Record<string, any>;
}

export interface CanvasVersion {
  version: number;
  timestamp: string;
  title: string;
  diffSummary?: string;
  blocks: CanvasBlock[];
}

export interface CanvasArtifact {
  id: string;
  title: string;
  type: 'document' | 'code' | 'data' | 'system_architecture' | 'workflow_spec';
  blocks: CanvasBlock[];
  version: number;
  history: CanvasVersion[];
  projectId?: string;
  linkedConversationId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/* ========================================================
   4. SKILLS SYSTEM MODELS
   ======================================================== */
export type SkillCategory =
  | 'analysis'
  | 'coding'
  | 'research'
  | 'productivity'
  | 'multimodal'
  | 'integration'
  | 'custom';

export type SkillPermission =
  | 'network_access'
  | 'filesystem_read'
  | 'state_mutation'
  | 'execute_code'
  | 'sensitive_data';

export interface SkillParameter {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

export interface SkillDefinition {
  id: string;
  name: string;
  codename: string;
  description: string;
  author: string;
  version: string;
  category: SkillCategory;
  icon: string;
  instructions: string; // Executable cognitive prompt pattern
  requiredTools: string[]; // Tool IDs required from Tool Registry
  permissions: SkillPermission[];
  modelRequirements?: {
    minContext?: number;
    visionRequired?: boolean;
    recommendedModel?: string;
    thinkingBudget?: number;
  };
  isActive: boolean;
  isBuiltIn: boolean;
  parametersSchema: Record<string, SkillParameter>;
  testPrompts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillTestExecution {
  skillId: string;
  timestamp: string;
  inputParams: Record<string, any>;
  toolsInvoked: Array<{ toolName: string; args: any; output: any; status: string }>;
  outputResult: string;
  durationMs: number;
  success: boolean;
}

/* ========================================================
   5. PLUGINS EXTENSIBILITY LAYER MODELS
   ======================================================== */
export type PluginStatus = 'active' | 'disabled' | 'error' | 'installing';

export type PluginPermission =
  | 'network_access'
  | 'storage_read'
  | 'storage_write'
  | 'auth_delegation'
  | 'tool_injection';

export type PluginAuthType = 'none' | 'oauth2' | 'api_key' | 'webhook_secret';

export interface PluginSettingField {
  key: string;
  label: string;
  type: 'string' | 'password' | 'boolean' | 'select' | 'number';
  options?: string[];
  description?: string;
  required?: boolean;
  defaultValue?: any;
}

export interface PluginDefinition {
  id: string;
  name: string;
  codename: string;
  description: string;
  version: string;
  angelVersionCompat: string; // e.g. ">=1.0.0"
  author: string;
  homepageUrl?: string;
  icon: string;
  status: PluginStatus;
  permissions: PluginPermission[];
  authType: PluginAuthType;
  authConfigured: boolean;
  settingsSchema: PluginSettingField[];
  settingsValues: Record<string, any>;
  providedTools: string[]; // Tool IDs registered into the Tool Registry
  providedSkills: string[]; // Skill IDs registered into Skills system
  lifecycleHooks: {
    onInstall?: boolean;
    onActivate?: boolean;
    onDeactivate?: boolean;
  };
  lastError?: string;
  healthStatus: 'healthy' | 'warning' | 'error';
  createdAt: string;
  updatedAt: string;
}

/* ========================================================
   6. ARCHITECTURAL BOUNDARY CLARITY MODEL
   ======================================================== */
export interface AngelArchitectureConcept {
  concept: 'Skill' | 'Tool' | 'Plugin' | 'Integration' | 'Agent';
  definition: string;
  primaryRole: string;
  inputOutput: string;
  executionModel: string;
  example: string;
}

