/**
 * ANGEL AI — Plugins & Extensibility Layer Manager
 * Manages plugin lifecycle, manifest validation, permission boundaries,
 * configuration forms, and architectural role clarity.
 */

import { PluginDefinition, AngelArchitectureConcept } from '../../types';

const PLUGINS_STORAGE_KEY = 'angel_saved_plugins';

/**
 * Architectural Boundary Clarity Matrix
 * Explicitly separates Skills, Tools, Plugins, Integrations, and Agents.
 */
export const ANGEL_ARCHITECTURE_CONCEPTS: AngelArchitectureConcept[] = [
  {
    concept: 'Agent',
    definition: 'An autonomous or assisted persona with a distinct identity, system instructions, memory access, and assigned capabilities.',
    primaryRole: 'Interacts with users, plans solutions, and coordinates tools to accomplish complex goals.',
    inputOutput: 'Takes natural language user intents / prompts; produces reasoning, conversations, tasks, and artifacts.',
    executionModel: 'LLM loop with tool-calling, reflection, and memory persistence.',
    example: 'Angel Core, Optic Vision, Code Composer, Sentinel Security.',
  },
  {
    concept: 'Skill',
    definition: 'A specialized cognitive reasoning pattern, behavioral instructions, and tool orchestration workflow.',
    primaryRole: 'Instructs an Agent how to reason through domain-specific problems (e.g. quantitative analysis, refactoring).',
    inputOutput: 'Takes structured parameters or prompts; guides agent step-by-step to execute dependent tools and formulate conclusions.',
    executionModel: 'Cognitive prompt template executed within the agent context with declared permissions.',
    example: 'Strategic Data Synthesis, Deep Research, UI Accessibility Audit.',
  },
  {
    concept: 'Tool',
    definition: 'An atomic, executable programmatic function with a typed JSON schema, input parameters, and deterministic return value.',
    primaryRole: 'Provides concrete capabilities that agents or workflows can call (e.g. search workspace, calculate formula, fetch URL).',
    inputOutput: 'Takes JSON arguments matching ModelToolDefinition schema; returns structured JSON result or error.',
    executionModel: 'Direct code execution in sandbox or browser runtime.',
    example: 'workspace_search, task_manager, memory_vault, time_utility.',
  },
  {
    concept: 'Plugin',
    definition: 'A packaged extensibility bundle that provides connectors, lifecycle hooks, configuration forms, and registers tools and skills.',
    primaryRole: 'Extends Angel AI runtime with third-party service drivers, authenticated endpoints, and domain packages.',
    inputOutput: 'Manages lifecycle states (install, configure, activate, disable); exposes tools and skills to the ecosystem.',
    executionModel: 'Installed module with verified manifest permissions and lifecycle state machine.',
    example: 'PostgreSQL Realtime Sync Plugin, GitHub Bridge Plugin, Zapier Outbound Hub Plugin.',
  },
  {
    concept: 'Integration',
    definition: 'A configured connection instance with credentials, OAuth tokens, or webhook endpoints targeting external services.',
    primaryRole: 'Bridges Angel data and execution to external platforms (e.g. GitHub repos, Vercel deployments, Supabase tables).',
    inputOutput: 'Authenticated API requests, event webhooks, and telemetry synchronization.',
    executionModel: 'Secure OAuth/PAT token handling with token refresh and endpoint health verification.',
    example: 'GitHub OAuth Connection, Vercel Deploy Token, Supabase Project Link.',
  },
];

/**
 * Certified built-in and ecosystem plugins
 */
export const INITIAL_PLUGINS: PluginDefinition[] = [
  {
    id: 'plugin-supabase-connector',
    name: 'Supabase PostgreSQL Cloud Connector',
    codename: 'supabase_connector',
    description: 'Enterprise connector enabling schema inspection, Row-Level Security policy validation, and realtime table sync.',
    version: '1.2.0',
    angelVersionCompat: '>=1.0.0',
    author: 'Angel Core Engineering',
    homepageUrl: 'https://supabase.com',
    icon: 'Database',
    status: 'active',
    permissions: ['network_access', 'storage_write', 'tool_injection'],
    authType: 'api_key',
    authConfigured: true,
    settingsSchema: [
      { key: 'supabaseUrl', label: 'Project URL', type: 'string', required: true, defaultValue: 'https://xyzcompany.supabase.co' },
      { key: 'syncIntervalSec', label: 'Realtime Sync Interval (sec)', type: 'number', required: false, defaultValue: 30 },
      { key: 'enableRlsEnforcement', label: 'Enforce Row-Level Security', type: 'boolean', defaultValue: true },
    ],
    settingsValues: {
      supabaseUrl: 'https://xyzcompany.supabase.co',
      syncIntervalSec: 30,
      enableRlsEnforcement: true,
    },
    providedTools: ['supabase_query_runner', 'supabase_schema_inspector'],
    providedSkills: ['skill-database-migration'],
    lifecycleHooks: {
      onInstall: true,
      onActivate: true,
      onDeactivate: true,
    },
    healthStatus: 'healthy',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'plugin-github-ci-bridge',
    name: 'GitHub CI/CD & Pull Request Automator',
    codename: 'github_bridge',
    description: 'Bridges Angel automated agents to GitHub repositories for branch inspection, automated PR creation, and issue triage.',
    version: '2.0.1',
    angelVersionCompat: '>=1.0.0',
    author: 'DevOps Team',
    homepageUrl: 'https://github.com',
    icon: 'GitBranch',
    status: 'active',
    permissions: ['network_access', 'auth_delegation', 'tool_injection'],
    authType: 'oauth2',
    authConfigured: true,
    settingsSchema: [
      { key: 'defaultRepo', label: 'Default Target Repository', type: 'string', defaultValue: 'organization/angel-app' },
      { key: 'autoLabelPRs', label: 'Auto-label generated Pull Requests', type: 'boolean', defaultValue: true },
      { key: 'prBranchPrefix', label: 'Branch Prefix', type: 'string', defaultValue: 'angel-ai/' },
    ],
    settingsValues: {
      defaultRepo: 'organization/angel-app',
      autoLabelPRs: true,
      prBranchPrefix: 'angel-ai/',
    },
    providedTools: ['github_repo_reader', 'github_pr_creator'],
    providedSkills: ['skill-fullstack-refactor'],
    lifecycleHooks: {
      onInstall: true,
      onActivate: true,
    },
    healthStatus: 'healthy',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'plugin-zapier-webhook-hub',
    name: 'Zapier Event Stream Hub',
    codename: 'zapier_event_hub',
    description: 'Bi-directional webhook ingestion and event dispatching linking Angel workflow automations to 5,000+ cloud applications.',
    version: '1.0.8',
    angelVersionCompat: '>=1.0.0',
    author: 'Integrations Team',
    homepageUrl: 'https://zapier.com',
    icon: 'Share2',
    status: 'active',
    permissions: ['network_access', 'tool_injection'],
    authType: 'webhook_secret',
    authConfigured: true,
    settingsSchema: [
      { key: 'webhookSecret', label: 'Inbound Verification Secret', type: 'password', required: true, defaultValue: 'whsec_live_9981' },
      { key: 'batchingWindowMs', label: 'Event Batching Window (ms)', type: 'number', defaultValue: 500 },
    ],
    settingsValues: {
      webhookSecret: 'whsec_live_9981',
      batchingWindowMs: 500,
    },
    providedTools: ['zapier_event_dispatcher'],
    providedSkills: [],
    lifecycleHooks: {
      onActivate: true,
      onDeactivate: true,
    },
    healthStatus: 'healthy',
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
  },
  {
    id: 'plugin-posthog-analytics',
    name: 'PostHog Telemetry & Feature Flag Connector',
    codename: 'posthog_telemetry',
    description: 'Tracks user workspace velocity, agent token efficiency, and evaluates dynamic feature flags without slowing UI render cycles.',
    version: '0.9.4',
    angelVersionCompat: '>=1.0.0',
    author: 'Telemetry Team',
    homepageUrl: 'https://posthog.com',
    icon: 'Activity',
    status: 'disabled',
    permissions: ['network_access'],
    authType: 'api_key',
    authConfigured: false,
    settingsSchema: [
      { key: 'projectApiKey', label: 'PostHog Project API Key', type: 'password', required: true },
      { key: 'hostUrl', label: 'PostHog Host URL', type: 'string', defaultValue: 'https://app.posthog.com' },
    ],
    settingsValues: {},
    providedTools: [],
    providedSkills: [],
    lifecycleHooks: {
      onInstall: true,
    },
    healthStatus: 'healthy',
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
  },
];

export function getSavedPlugins(): PluginDefinition[] {
  try {
    const raw = localStorage.getItem(PLUGINS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fall through
  }
  return INITIAL_PLUGINS;
}

export function savePlugins(plugins: PluginDefinition[]): void {
  try {
    localStorage.setItem(PLUGINS_STORAGE_KEY, JSON.stringify(plugins));
  } catch (err) {
    console.error('Failed to save plugins:', err);
  }
}
