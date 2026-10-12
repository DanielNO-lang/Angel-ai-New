/**
 * ANGEL AI — Core Full-Stack Application Server & API Engine
 * Portable, framework-standard Express server supporting:
 *  - Standard Node.js / Docker container execution (Port 3000 or $PORT)
 *  - Vercel Serverless Function compatibility (via exported createApp / api/index.ts)
 *  - Google Cloud Run & universal PaaS deployment
 *  - Full AI Provider & Tool Registry
 *  - Automation & Webhook Dispatch Architecture
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import { executeAgentPipeline } from './server/orchestrator';
import { providerRegistry } from './server/providers';
import { getSupabaseServerStatus, getSupabaseAuthClient, getSupabaseClientForUser, getTasksVelocity, syncTasksToSupabase, syncAllEntitiesToSupabase, getSupabaseDDL } from './server/supabase_service';
import { automationService, AutomationEventType } from './server/services/automationService';
import { dispatchZapierEvent } from './server/zapier_service';
import { mediaService } from './server/services/mediaService';
import { voiceService } from './server/services/voiceService';
import { intelligenceService } from './server/services/intelligenceService';
import { readingService } from './server/services/readingService';
import { runWorkflowExecution, approveWorkflowExecution, triggerMatchingWorkflows } from './server/services/workflowService';
import { githubService } from './server/services/githubService';
import { vercelService } from './server/services/vercelService';

export interface CreateAppOptions {
  isServerless?: boolean;
}

export async function createApp(options: CreateAppOptions = {}): Promise<Express> {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Rate Limiting Map
  const ipCounters = new Map<string, { count: number; resetAt: number }>();
  const rateLimit = (maxRequests: number = 60) => (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'client';
    const now = Date.now();
    const entry = ipCounters.get(ip);
    if (!entry || now > entry.resetAt) {
      ipCounters.set(ip, { count: 1, resetAt: now + 60000 });
      return next();
    }
    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    entry.count++;
    next();
  };

  // Supabase JWT authentication for user-owned cloud persistence routes.
  // All database reads/writes below use the caller's JWT so PostgreSQL RLS applies.
  const requireSupabaseUser = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || '';
    const accessToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!accessToken) {
      return res.status(401).json({ error: 'Sign in to synchronize your workspace.' });
    }

    const client = getSupabaseClientForUser(accessToken);
    if (!client) {
      return res.status(503).json({ error: 'Supabase authentication is not configured on the server.' });
    }

    try {
      const { data, error } = await client.auth.getUser(accessToken);
      if (error || !data.user) {
        return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
      }
      (req as any).angelAuth = { userId: data.user.id, accessToken, client };
      return next();
    } catch (error) {
      console.error('[Supabase Auth] Token verification failed:', error);
      return res.status(401).json({ error: 'Your session could not be verified.' });
    }
  };

  const attachOptionalSupabaseUser = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || '';
    const accessToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!accessToken) return next();

    const client = getSupabaseClientForUser(accessToken);
    if (!client) return res.status(503).json({ error: 'Supabase authentication is not configured on the server.' });
    try {
      const { data, error } = await client.auth.getUser(accessToken);
      if (error || !data.user) return res.status(401).json({ error: 'Your session is invalid or expired.' });
      (req as any).angelAuth = { userId: data.user.id, accessToken, client };
      return next();
    } catch {
      return res.status(401).json({ error: 'Your session could not be verified.' });
    }
  };

  // Privileged integrations are restricted to verified Supabase identities
  // explicitly listed in ADMIN_EMAILS. No public client can trigger deploys,
  // mutate GitHub issues, or dispatch arbitrary outbound webhooks.
  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || '';
    const accessToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!accessToken) return res.status(401).json({ error: 'Sign in with an authorized administrator account.' });

    const client = getSupabaseClientForUser(accessToken);
    if (!client) return res.status(503).json({ error: 'Supabase authentication is not configured on the server.' });

    try {
      const { data, error } = await client.auth.getUser(accessToken);
      if (error || !data.user) return res.status(401).json({ error: 'Your session is invalid or expired.' });
      const allowlist = (process.env.ADMIN_EMAILS || '')
        .split(/[,;\s]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      if (allowlist.length === 0) return res.status(503).json({ error: 'Administrative access is not configured.' });
      if (!data.user.email || !allowlist.includes(data.user.email.toLowerCase())) {
        return res.status(403).json({ error: 'Administrator permission is required for this operation.' });
      }
      (req as any).angelAuth = { userId: data.user.id, accessToken, client, email: data.user.email, isAdmin: true };
      return next();
    } catch (err) {
      console.error('[Admin Auth] Authorization check failed:', err);
      return res.status(401).json({ error: 'Your session could not be verified.' });
    }
  };

  // ============================================================================
  // API ROUTES
  // ============================================================================

  // 1. Health & Workspace Diagnostics
  app.get('/api/health', (req: Request, res: Response) => {
    const supabase = getSupabaseServerStatus();
    const providers = providerRegistry.getAvailableProviders();
    res.json({
      status: 'ok',
      workspace: 'Angel AI',
      timestamp: new Date().toISOString(),
      supabase,
      providers,
      environment: process.env.NODE_ENV || 'development',
      isServerless: Boolean(options.isServerless || process.env.VERCEL),
      platform: process.env.VERCEL ? 'vercel' : 'node',
    });
  });

  // 2. Integrations Status Summary
  app.get('/api/integrations/status', (req: Request, res: Response) => {
    const supabase = getSupabaseServerStatus();
    const isVercelRuntime = Boolean(process.env.VERCEL);
    const hasGithubToken = Boolean(process.env.GITHUB_TOKEN);
    const hasGithubRepo = Boolean(process.env.GITHUB_REPO_NAME);
    const outboundUrl = process.env.OUTBOUND_WEBHOOK_URL || process.env.ZAPIER_OUTBOUND_WEBHOOK_URL;
    const hasWebhookSecret = Boolean(process.env.WEBHOOK_SECRET || process.env.ZAPIER_WEBHOOK_SECRET);

    res.json({
      gemini: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: 'gemini-3.8-flash',
      },
      supabase: {
        configured: supabase.isConfigured,
        hasUrl: supabase.hasUrl,
        hasAnonKey: supabase.hasAnonKey,
        hasServiceRoleKey: supabase.hasServiceRoleKey,
        mode: supabase.mode,
      },
      openai: {
        configured: Boolean(process.env.OPENAI_API_KEY),
      },
      zapier: {
        configured: Boolean(outboundUrl),
        hasSecret: hasWebhookSecret,
        statusText: outboundUrl
          ? 'Outbound webhook destination active.'
          : 'Pending Configuration: Set OUTBOUND_WEBHOOK_URL or ZAPIER_OUTBOUND_WEBHOOK_URL.',
      },
      github: {
        configured: hasGithubToken,
        hasRepo: hasGithubRepo,
        owner: process.env.GITHUB_REPO_OWNER || null,
        repo: process.env.GITHUB_REPO_NAME || null,
        statusText: hasGithubToken
          ? `GitHub PAT configured${hasGithubRepo ? ` for ${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}` : ''}.`
          : 'Pending Configuration: Set GITHUB_TOKEN in environment secrets.',
      },
      vercel: {
        configured: isVercelRuntime || Boolean(process.env.VERCEL_PROJECT_ID),
        isVercelRuntime,
        projectId: process.env.VERCEL_PROJECT_ID ? `${process.env.VERCEL_PROJECT_ID.slice(0, 6)}...` : null,
        statusText: isVercelRuntime
          ? 'Running on Vercel Serverless runtime.'
          : 'Vercel-ready: Configured with framework-standard vercel.json and portable api router.',
      },
      automation: {
        configured: Boolean(outboundUrl),
        outboundUrl: outboundUrl ? 'Configured' : 'Pending Configuration',
        hasSecret: hasWebhookSecret,
        recentDeliveriesCount: automationService.getDeliveryHistory().length,
        supportedEvents: [
          'task.created',
          'task.completed',
          'agent.executed',
          'message.received',
          'memory.created',
          'memory.updated',
          'workflow.completed',
        ],
      },
    });
  });

  // 3. Supabase Real-Time Project Velocity & Completion Status
  app.get('/api/supabase/velocity', requireSupabaseUser, async (req: Request, res: Response) => {
    try {
      const metrics = await getTasksVelocity([], (req as any).angelAuth.client);
      res.json(metrics);
    } catch (err) {
      console.error('[API /api/supabase/velocity Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/supabase/velocity', requireSupabaseUser, async (req: Request, res: Response) => {
    try {
      const { tasks } = req.body || {};
      const fallbackTasks = Array.isArray(tasks) ? tasks : [];
      const metrics = await getTasksVelocity(fallbackTasks, (req as any).angelAuth.client);
      res.json(metrics);
    } catch (err) {
      console.error('[API /api/supabase/velocity POST Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/supabase/sync', requireSupabaseUser, async (req: Request, res: Response) => {
    try {
      const { tasks } = req.body || {};
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: 'tasks array is required' });
      }
      const auth = (req as any).angelAuth;
      const result = await syncTasksToSupabase(tasks, auth.userId, auth.accessToken);
      res.json(result);
    } catch (err) {
      console.error('[API /api/supabase/sync Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/supabase/sync-all', requireSupabaseUser, async (req: Request, res: Response) => {
    try {
      const auth = (req as any).angelAuth;
      const result = await syncAllEntitiesToSupabase(req.body || {}, auth.userId, auth.accessToken);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/supabase/ddl', (_req: Request, res: Response) => {
    res.type('text/plain').send(getSupabaseDDL());
  });

  // ============================================================================
  // PERSISTENT WORKFLOW API
  // ============================================================================

  app.get('/api/workflows', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    try {
      const { data, error } = await auth.client.from('workflows')
        .select('*')
        .eq('user_id', auth.userId)
        .order('updated_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ workflows: data || [] });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/workflows', requireSupabaseUser, rateLimit(20), async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const body = req.body || {};
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ error: 'Workflow name is required.' });
    }
    if (!Array.isArray(body.steps) || body.steps.length > 25) {
      return res.status(400).json({ error: 'Workflow steps must be an array containing no more than 25 steps.' });
    }
    const now = new Date().toISOString();
    const workflow = {
      id: String(body.id || `workflow_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
      user_id: auth.userId,
      name: body.name.trim().slice(0, 240),
      description: String(body.description || '').slice(0, 5000),
      status: body.status === 'active' ? 'active' : 'draft',
      trigger: body.trigger && typeof body.trigger === 'object' ? body.trigger : { type: 'manual' },
      conditions: Array.isArray(body.conditions) ? body.conditions : [],
      steps: body.steps,
      schedule: typeof body.schedule === 'string' ? body.schedule : null,
      codename: typeof body.codename === 'string' ? body.codename.slice(0, 120) : null,
      category: typeof body.category === 'string' ? body.category.slice(0, 80) : 'general',
      version: typeof body.version === 'string' ? body.version.slice(0, 40) : '1.0.0',
      enabled: body.enabled === true,
      execution_chain: Array.isArray(body.executionChain) ? body.executionChain : [],
      stages: Array.isArray(body.stages) ? body.stages : [],
      permissions: Array.isArray(body.permissions) ? body.permissions.filter((p: unknown) => typeof p === 'string').slice(0, 50) : [],
      project_id: typeof body.projectId === 'string' ? body.projectId : null,
      agent_id: typeof body.agentId === 'string' ? body.agentId : null,
      system_instructions: typeof body.systemInstructions === 'string' ? body.systemInstructions.slice(0, 12000) : null,
      is_template: false,
      tags: Array.isArray(body.tags) ? body.tags.filter((tag: unknown) => typeof tag === 'string').slice(0, 30) : [],
      created_at: now,
      updated_at: now,
    };
    try {
      const { data, error } = await auth.client.from('workflows').insert(workflow).select('*').single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ workflow: data });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.put('/api/workflows/:id', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const body = req.body || {};
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowed: Record<string, string> = {
      name: 'name', description: 'description', status: 'status', trigger: 'trigger',
      conditions: 'conditions', steps: 'steps', schedule: 'schedule', codename: 'codename',
      category: 'category', version: 'version', enabled: 'enabled', permissions: 'permissions',
      projectId: 'project_id', agentId: 'agent_id', systemInstructions: 'system_instructions',
      tags: 'tags', executionChain: 'execution_chain', stages: 'stages',
    };
    for (const [inputKey, dbKey] of Object.entries(allowed)) {
      if (Object.prototype.hasOwnProperty.call(body, inputKey)) updates[dbKey] = body[inputKey];
    }
    if (updates.steps !== undefined && (!Array.isArray(updates.steps) || updates.steps.length > 25)) {
      return res.status(400).json({ error: 'Workflow steps must contain no more than 25 steps.' });
    }
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) {
      return res.status(400).json({ error: 'Workflow name cannot be empty.' });
    }
    try {
      const { data, error } = await auth.client.from('workflows').update(updates)
        .eq('id', req.params.id).eq('user_id', auth.userId).select('*').maybeSingle();
      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Workflow not found.' });
      return res.json({ workflow: data });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.delete('/api/workflows/:id', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    try {
      // Archive instead of hard-delete so execution history and audit trails remain intact.
      const { data, error } = await auth.client.from('workflows').update({
        enabled: false,
        status: 'archived',
        updated_at: new Date().toISOString(),
      }).eq('id', req.params.id).eq('user_id', auth.userId).select('id').maybeSingle();
      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Workflow not found.' });
      return res.json({ success: true, archived: true, id: data.id });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/workflows/:id/run', requireSupabaseUser, rateLimit(10), async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    try {
      const { data: workflow, error } = await auth.client.from('workflows').select('*')
        .eq('id', req.params.id).eq('user_id', auth.userId).maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      if (!workflow) return res.status(404).json({ error: 'Workflow not found.' });
      if (workflow.status === 'archived') return res.status(409).json({ error: 'Archived workflows cannot run.' });
      const result = await runWorkflowExecution({
        client: auth.client,
        userId: auth.userId,
        accessToken: auth.accessToken,
        workflow,
        input: req.body?.input && typeof req.body.input === 'object' ? req.body.input : {},
      });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/workflows/:id/approve', requireSupabaseUser, rateLimit(10), async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const { executionId, decision } = req.body || {};
    if (typeof executionId !== 'string' || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'executionId and decision (approve or reject) are required.' });
    }
    try {
      const { data: workflow, error } = await auth.client.from('workflows').select('*')
        .eq('id', req.params.id).eq('user_id', auth.userId).maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      if (!workflow) return res.status(404).json({ error: 'Workflow not found.' });
      const result = await approveWorkflowExecution({
        client: auth.client,
        userId: auth.userId,
        accessToken: auth.accessToken,
        workflow,
        executionId,
        decision,
      });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ============================================================================
  // MODEL CATALOG & CAPABILITY ROUTING
  // ============================================================================

  app.get('/api/models', (_req: Request, res: Response) => {
    res.json(providerRegistry.getModelCatalog());
  });

  // ============================================================================
  // GITHUB REAL INTEGRATION ENDPOINTS
  // ============================================================================

  app.get('/api/integrations/github/test', requireAdmin, async (_req: Request, res: Response) => {
    const result = await githubService.testConnection();
    res.json(result);
  });

  app.get('/api/integrations/github/repo_details', requireAdmin, async (req: Request, res: Response) => {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER || 'angel-ai';
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME || 'angel-workspace';
    try {
      const details = await githubService.getRepoDetails(owner, repo);
      res.json(details);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/integrations/github/list_branches', requireAdmin, async (req: Request, res: Response) => {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER || 'angel-ai';
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME || 'angel-workspace';
    try {
      const branches = await githubService.listBranches(owner, repo);
      res.json(branches);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/integrations/github/list_files', requireAdmin, async (req: Request, res: Response) => {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER || 'angel-ai';
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME || 'angel-workspace';
    const path = (req.query.path as string) || '';
    const branch = req.query.branch as string | undefined;
    try {
      const files = await githubService.listFiles(owner, repo, path, branch);
      res.json(files);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/integrations/github/file_content', requireAdmin, async (req: Request, res: Response) => {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER || 'angel-ai';
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME || 'angel-workspace';
    const path = req.query.path as string;
    const branch = req.query.branch as string | undefined;
    if (!path) return res.status(400).json({ error: 'path is required' });
    try {
      const content = await githubService.getFileContent(owner, repo, path, branch);
      res.json(content);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/integrations/github/list_issues', requireAdmin, async (req: Request, res: Response) => {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER || 'angel-ai';
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME || 'angel-workspace';
    try {
      const issues = await githubService.listIssues(owner, repo);
      res.json(issues);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/integrations/github/create_issue', requireAdmin, async (req: Request, res: Response) => {
    const { owner, repo, title, body } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });
    try {
      const issue = await githubService.createIssue(
        owner || process.env.GITHUB_REPO_OWNER || 'angel-ai',
        repo || process.env.GITHUB_REPO_NAME || 'angel-workspace',
        title,
        body || ''
      );
      res.json(issue);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/integrations/github/list_prs', requireAdmin, async (req: Request, res: Response) => {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER || 'angel-ai';
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME || 'angel-workspace';
    try {
      const prs = await githubService.listPullRequests(owner, repo);
      res.json(prs);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ============================================================================
  // VERCEL REAL INTEGRATION ENDPOINTS
  // ============================================================================

  app.get('/api/integrations/vercel/test', requireAdmin, async (_req: Request, res: Response) => {
    const result = await vercelService.testConnection();
    res.json(result);
  });

  app.get('/api/integrations/vercel/projects', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const projects = await vercelService.listProjects();
      res.json(projects);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/integrations/vercel/deployments', requireAdmin, async (req: Request, res: Response) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const deployments = await vercelService.listDeployments(projectId);
      res.json(deployments);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/integrations/vercel/trigger_deploy', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body || {};
      const result = await vercelService.triggerRedeployment(projectId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ============================================================================
  // UNIVERSAL AI PROVIDER ENDPOINTS
  // ============================================================================

  // Provider listing
  app.get('/api/ai/providers', (req: Request, res: Response) => {
    res.json(providerRegistry.getAvailableProviders());
  });

  // Streaming Text Generation (Server-Sent Events)
  app.post(['/api/ai/stream', '/api/chat/stream'], rateLimit(30), async (req: Request, res: Response) => {
    const { prompt, systemInstruction, conversationHistory, modelId, providerId, temperature, maxTokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const provider = providerRegistry.getProvider(providerId);

      await provider.stream(
        {
          prompt,
          systemInstruction,
          conversationHistory,
          modelId,
          temperature,
          maxTokens,
        },
        (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      );

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      console.error('[API /api/ai/stream Error]', err);
      const msg = err instanceof Error ? err.message : String(err);
      res.write(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`);
      res.end();
    }
  });

  // Single-Shot Generation
  app.post(['/api/ai/generate', '/api/chat/generate'], rateLimit(25), async (req: Request, res: Response) => {
    const { prompt, systemInstruction, conversationHistory, modelId, providerId, temperature, maxTokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      const result = await provider.generate({
        prompt,
        systemInstruction,
        conversationHistory,
        modelId,
        temperature,
        maxTokens,
      });

      res.json(result);
    } catch (err) {
      console.error('[API /api/ai/generate Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Structured Output Enforcement
  app.post('/api/ai/structured', rateLimit(15), async (req: Request, res: Response) => {
    const { prompt, systemInstruction, conversationHistory, jsonSchema, schemaName, modelId, providerId, temperature } = req.body;

    if (!prompt || !jsonSchema) {
      return res.status(400).json({ error: 'Prompt and jsonSchema are required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      const result = await provider.structuredOutput({
        prompt,
        systemInstruction,
        conversationHistory,
        jsonSchema,
        schemaName,
        modelId,
        temperature,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      console.error('[API /api/ai/structured Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Discoverable Tool Call
  app.post('/api/ai/tool-call', rateLimit(15), async (req: Request, res: Response) => {
    const { prompt, systemInstruction, conversationHistory, tools, modelId, providerId, temperature } = req.body;

    if (!prompt || !tools || !Array.isArray(tools)) {
      return res.status(400).json({ error: 'Prompt and tools array are required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      const result = await provider.toolCall({
        prompt,
        systemInstruction,
        conversationHistory,
        tools,
        modelId,
        temperature,
      });

      res.json(result);
    } catch (err) {
      console.error('[API /api/ai/tool-call Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Multimodal Vision Inspection
  app.post(['/api/ai/vision', '/api/visual/inspect'], rateLimit(15), async (req: Request, res: Response) => {
    const { base64Data, mimeType, prompt, modelId, providerId, systemInstruction } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data image frame is required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      const result = await provider.vision({
        base64Data,
        mimeType: mimeType || 'image/jpeg',
        prompt: prompt || 'Analyze this frame and describe its key elements concisely.',
        systemInstruction,
        modelId,
      });

      res.json({
        analysis: result.analysis,
        provider: result.provider,
        modelId: result.modelId,
        isPendingConfig: Boolean(result.isPendingConfig),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[API /api/ai/vision Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Vector Embeddings
  app.post('/api/ai/embeddings', rateLimit(20), async (req: Request, res: Response) => {
    const { texts, modelId, providerId } = req.body;

    if (!texts) {
      return res.status(400).json({ error: 'texts string or array is required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      const embeddings = await provider.embeddings(texts);
      res.json({ embeddings, count: embeddings.length });
    } catch (err) {
      console.error('[API /api/ai/embeddings Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Agent Lab 9-Step Execution Pipeline
  app.post('/api/agent/execute', attachOptionalSupabaseUser, rateLimit(10), async (req: Request, res: Response) => {
    const {
      agentId,
      agentName,
      systemInstructions,
      taskPrompt,
      modelConfig,
      context,
      memories,
      allowedTools,
      permissions,
      memoryAccess,
    } = req.body;

    if (!taskPrompt || !agentId) {
      return res.status(400).json({ error: 'agentId and taskPrompt are required' });
    }
    const auth = (req as any).angelAuth;
    const requestedTools = Array.isArray(allowedTools) ? allowedTools : [];
    const writeTools = ['task_manager', 'task_create', 'tasks', 'memory_vault', 'memory_write', 'memory'];
    if (!auth && requestedTools.some((tool: string) => writeTools.includes(tool))) {
      return res.status(401).json({ error: 'Sign in to enable persistent task and memory tools.' });
    }

    try {
      const result = await executeAgentPipeline({
        userId: auth?.userId,
        accessToken: auth?.accessToken,
        agentId,
        agentName: agentName || 'Specialized Agent',
        systemInstructions: systemInstructions || 'You are an Angel AI specialized agent.',
        taskPrompt,
        modelConfig,
        context,
        memories,
        allowedTools,
        permissions,
        memoryAccess,
      });

      res.json(result);
    } catch (err) {
      console.error('[API /api/agent/execute Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ============================================================================
  // AUTOMATION & WEBHOOK ARCHITECTURE
  // ============================================================================

  // Outbound Dispatch API (Internal workspace & client events)
  app.post('/api/automation/dispatch', requireSupabaseUser, rateLimit(30), async (req: Request, res: Response) => {
    const { event, data, overrideUrl, callbackUrl } = req.body;

    const allowedEvents: AutomationEventType[] = [
      'task.created', 'task.completed', 'agent.executed', 'message.received',
      'memory.created', 'memory.updated', 'workflow.completed',
    ];
    if (!event || !allowedEvents.includes(event as AutomationEventType)) {
      return res.status(400).json({ error: 'A supported event type is required.' });
    }
    // Destinations are server-controlled. User payloads cannot turn this route
    // into an arbitrary outbound request or override the configured webhook.
    if (overrideUrl || callbackUrl) {
      return res.status(400).json({ error: 'Custom webhook destinations are not allowed on this endpoint.' });
    }

    try {
      const result = await automationService.dispatchEvent(
        event as AutomationEventType,
        data || {}
      );
      const auth = (req as any).angelAuth;
      let triggeredWorkflows: any[] = [];
      let workflowTriggerError: string | undefined;
      try {
        triggeredWorkflows = await triggerMatchingWorkflows({
          client: auth.client,
          userId: auth.userId,
          accessToken: auth.accessToken,
          event: event as AutomationEventType,
          data: data && typeof data === 'object' ? data : {},
        });
      } catch (triggerError) {
        workflowTriggerError = triggerError instanceof Error ? triggerError.message : String(triggerError);
        console.error('[Workflow Event Trigger Error]', workflowTriggerError);
      }
      res.json({ ...result, triggeredWorkflows, workflowTriggerError });
    } catch (err) {
      console.error('[Automation Dispatch Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Automation Delivery Telemetry & History
  app.get('/api/automation/history', requireAdmin, (req: Request, res: Response) => {
    const history = automationService.getDeliveryHistory();
    res.json({
      history,
      totalCount: history.length,
      timestamp: new Date().toISOString(),
    });
  });

  // Inbound Webhook Listener (Zapier / Make / n8n / GitHub / custom services)
  app.post('/api/webhooks/inbound', async (req: Request, res: Response) => {
    const signatureHeader = req.headers['x-angel-signature'] as string | undefined;
    const secretHeader = (req.headers['x-angel-webhook-secret'] || req.headers['authorization']) as string | undefined;
    const payloadString = JSON.stringify(req.body);

    const authCheck = automationService.verifyInboundRequest(payloadString, signatureHeader, secretHeader);

    if (!authCheck.authorized) {
      return res.status(401).json({
        error: 'Unauthorized inbound webhook request',
        reason: authCheck.reason,
      });
    }

    const { event, data, callbackUrl } = req.body;
    console.log(`[Angel Inbound Webhook Received] Event: ${String(event || 'custom.event').slice(0, 100)}`);

    // Callback destinations must be explicitly allowlisted to prevent SSRF.
    if (callbackUrl && typeof callbackUrl === 'string') {
      try {
        const target = new URL(callbackUrl);
        const allowedHosts = (process.env.WEBHOOK_CALLBACK_ALLOWLIST || '')
          .split(/[,;\s]+/)
          .map((host) => host.trim().toLowerCase())
          .filter(Boolean);
        if (['https:', 'http:'].includes(target.protocol) && allowedHosts.includes(target.hostname.toLowerCase())) {
          fetch(target.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'acknowledged',
              event,
              receivedAt: new Date().toISOString(),
              source: 'angel-ai-workspace',
            }),
          }).catch((e) => console.warn('[Callback Notification Failed]', e));
        } else {
          console.warn('[Angel Webhook] Callback omitted because its host is not allowlisted.');
        }
      } catch {
        console.warn('[Angel Webhook] Callback omitted because the URL is invalid.');
      }
    }

    res.json({
      received: true,
      event: event || 'custom.event',
      authorized: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Trigger Test Webhook Outbound
  app.post('/api/webhooks/test-dispatch', requireAdmin, async (req: Request, res: Response) => {
    const { event, data, overrideUrl } = req.body;
    const result = await automationService.dispatchEvent(
      (event as AutomationEventType) || 'task.created',
      data || { test: true, triggeredBy: 'manual_test_console' },
      { overrideUrl }
    );
    res.json(result);
  });

  // ============================================================================
  // AUTHENTICATION & USER DATA OWNERSHIP
  // ============================================================================

  const profileFromAuthUser = (user: any) => {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Angel User';
    return {
      id: user.id,
      email: user.email || '',
      name,
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
      title: user.user_metadata?.title || undefined,
      role: 'user' as const,
      createdAt: user.created_at || new Date().toISOString(),
    };
  };

  app.post('/api/auth/signup', rateLimit(8), async (req: Request, res: Response) => {
    const { email, password, name } = req.body || {};
    if (typeof email !== 'string' || !email.includes('@') || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'A valid email and password of at least 8 characters are required.' });
    }
    const client = getSupabaseAuthClient();
    if (!client) return res.status(503).json({ error: 'Supabase Auth is not configured on the server.' });
    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: typeof name === 'string' ? name.trim() : '' } },
      });
      if (error) return res.status(400).json({ error: error.message });
      if (!data.user) return res.status(400).json({ error: 'Supabase did not return a user record.' });
      const profile = profileFromAuthUser(data.user);
      return res.status(data.session ? 200 : 202).json({
        success: true,
        profile,
        token: data.session?.access_token || null,
        requiresEmailConfirmation: !data.session,
        message: data.session ? 'Account created.' : 'Check your email to confirm your account before signing in.',
      });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/auth/signin', rateLimit(12), async (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const client = getSupabaseAuthClient();
    if (!client) return res.status(503).json({ error: 'Supabase Auth is not configured on the server.' });
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error || !data.user || !data.session) {
        return res.status(401).json({ error: error?.message || 'Unable to establish an authenticated session.' });
      }
      return res.json({ success: true, profile: profileFromAuthUser(data.user), token: data.session.access_token });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/auth/signout', requireSupabaseUser, (_req: Request, res: Response) => {
    // The browser Supabase client owns and revokes its session. This endpoint
    // intentionally does not maintain a second, in-memory server session store.
    res.json({ success: true, message: 'Use the active Supabase client to complete sign-out.' });
  });

  app.get('/api/auth/session', requireSupabaseUser, async (req: Request, res: Response) => {
    try {
      const auth = (req as any).angelAuth;
      const { data, error } = await auth.client.auth.getUser(auth.accessToken);
      if (error || !data.user) return res.status(401).json({ authenticated: false, error: 'Session expired or invalid.' });
      return res.json({ authenticated: true, profile: profileFromAuthUser(data.user) });
    } catch (err) {
      return res.status(401).json({ authenticated: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/auth/recovery', rateLimit(5), async (req: Request, res: Response) => {
    const email = req.body?.email;
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    const client = getSupabaseAuthClient();
    if (!client) return res.status(503).json({ error: 'Supabase Auth is not configured on the server.' });
    try {
      const redirectTo = process.env.AUTH_RECOVERY_REDIRECT_URL || process.env.APP_URL;
      const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), redirectTo ? { redirectTo } : undefined);
      if (error) console.warn('[Supabase Auth] Recovery request could not be completed:', error.message);
      // Keep the response generic to prevent account enumeration.
      return res.json({ success: true, message: 'If an account exists for this email, password reset instructions will be sent.' });
    } catch {
      return res.json({ success: true, message: 'If an account exists for this email, password reset instructions will be sent.' });
    }
  });

  app.put('/api/auth/profile', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const updates = req.body || {};
    try {
      const { data: authData, error: authError } = await auth.client.auth.getUser(auth.accessToken);
      if (authError || !authData.user) return res.status(401).json({ error: 'Your session is invalid or expired.' });
      const user = authData.user;
      const existingName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Angel User';
      const name = typeof updates.name === 'string' ? updates.name.trim().slice(0, 120) : existingName;
      const avatarUrl = typeof updates.avatarUrl === 'string' ? updates.avatarUrl.slice(0, 2048) : (user.user_metadata?.avatar_url || null);
      const title = typeof updates.title === 'string' ? updates.title.trim().slice(0, 120) : (user.user_metadata?.title || undefined);
      const initials = name.split(/\s+/).map((part: string) => part[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'AU';
      const { data: existing } = await auth.client.from('profiles').select('plan').eq('id', user.id).maybeSingle();
      const { error: dbError } = await auth.client.from('profiles').upsert({
        id: user.id,
        name,
        email: user.email || '',
        initials,
        avatar_url: avatarUrl,
        status: 'online',
        plan: existing?.plan || 'Free',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (dbError) return res.status(500).json({ error: dbError.message });
      // The client updates Supabase user_metadata directly; this endpoint persists the
      // public profile row without pretending a server-side auth session is stored.
      return res.json({ success: true, profile: { id: user.id, email: user.email || '', name, avatarUrl, title, role: 'user', createdAt: user.created_at } });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/user/cloud-data', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const tables = [
      ['profile', 'profiles', 'id'],
      ['settings', 'settings', 'user_id'],
      ['tasks', 'tasks', 'user_id'],
      ['memories', 'memories', 'user_id'],
      ['projects', 'projects', 'user_id'],
      ['agents', 'agents', 'user_id'],
      ['conversations', 'conversations', 'user_id'],
      ['messages', 'messages', 'user_id'],
      ['workflows', 'workflows', 'user_id'],
      ['libraryItems', 'library_items', 'user_id'],
    ] as const;
    try {
      const entries = await Promise.all(tables.map(async ([key, table, ownerColumn]) => {
        const query = auth.client.from(table).select('*').eq(ownerColumn, auth.userId);
        const { data, error } = key === 'profile' || key === 'settings'
          ? await query.maybeSingle()
          : await query;
        if (error) throw new Error(`${table}: ${error.message}`);
        return [key, data || (key === 'profile' || key === 'settings' ? null : [])] as const;
      }));
      return res.json({ success: true, userId: auth.userId, data: Object.fromEntries(entries) });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/user/cloud-data', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const body = req.body || {};
    const aliases: Record<string, string> = {
      task: 'tasks', memory: 'memories', project: 'projects', workflow: 'workflows',
      conversation: 'conversations', message: 'messages', library_item: 'libraryItems', agent: 'agents',
    };
    const payload: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      const target = aliases[key] || key;
      if (Array.isArray(value)) payload[target] = value;
      else if (value && typeof value === 'object') payload[target] = [value];
    }
    try {
      const result = await syncAllEntitiesToSupabase(payload, auth.userId, auth.accessToken);
      return res.status(result.success ? 200 : 500).json(result);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/media/artifacts', (req: Request, res: Response) => {
    const { category, projectId, taskId, search } = req.query as Record<string, string>;
    const artifacts = mediaService.listArtifacts({ category, projectId, taskId, search });
    res.json({ artifacts, count: artifacts.length });
  });

  app.get('/api/media/artifacts/:id', (req: Request, res: Response) => {
    const artifact = mediaService.getArtifact(req.params.id);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    res.json(artifact);
  });

  app.post('/api/media/generate-image', rateLimit(8), async (req: Request, res: Response) => {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }
    try {
      const artifact = await mediaService.generateImage(req.body);
      res.json(artifact);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/media/generate-video', rateLimit(3), async (req: Request, res: Response) => {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }
    try {
      const artifact = await mediaService.generateVideo(req.body);
      res.json(artifact);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/media/edit', rateLimit(8), async (req: Request, res: Response) => {
    const { baseImageBase64, prompt } = req.body || {};
    if (!baseImageBase64 || !prompt) {
      return res.status(400).json({ error: 'baseImageBase64 and prompt are required' });
    }
    try {
      const artifact = await mediaService.editImage(req.body);
      res.json(artifact);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.delete('/api/media/artifacts/:id', (req: Request, res: Response) => {
    const deleted = mediaService.deleteArtifact(req.params.id);
    res.json({ success: deleted });
  });

  // ============================================================================
  // READING & DOCUMENT UNDERSTANDING
  // ============================================================================

  app.post(['/api/reading/analyze', '/api/documents/read'], rateLimit(10), async (req: Request, res: Response) => {
    try {
      const result = await readingService.analyze(req.body || {});
      res.json({ success: true, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const clientInputError = /provide document|exceeds the|unsupported file type/i.test(message);
      res.status(clientInputError ? 400 : 502).json({ error: message });
    }
  });

  // ============================================================================
  // VOICE & AUDIO INTELLIGENCE
  // ============================================================================

  app.post('/api/voice/transcribe', rateLimit(15), async (req: Request, res: Response) => {
    const { base64Audio } = req.body || {};
    if (!base64Audio) {
      return res.status(400).json({ error: 'base64Audio is required' });
    }
    try {
      const result = await voiceService.transcribeAudio(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/voice/tts', rateLimit(15), async (req: Request, res: Response) => {
    const { text, voiceName, stylePrompt } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    try {
      const result = await voiceService.synthesizeSpeech({ text, voiceName, stylePrompt });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ============================================================================
  // INTELLIGENCE CONTEXT PIPELINE
  // ============================================================================

  app.post('/api/intelligence/build-context', (req: Request, res: Response) => {
    try {
      const built = intelligenceService.buildContext(req.body || { query: '' });
      res.json(built);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  return app;
}

async function startServer() {
  // In AI Studio and preview environments, the dev server must always listen on port 3000.
  const PORT = 3000;
  const app = await createApp();

  // ============================================================================
  // VITE / STATIC FILE SERVING
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    // Load Vite only for the standalone development server. Keeping this as a
    // dynamic import prevents serverless production functions from loading Vite's
    // native Rolldown bindings during cold start.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Angel AI] Server listening on http://0.0.0.0:${PORT} (Node ${process.version})`);
  });
}

// Only launch standalone server if not running inside a serverless environment (e.g. Vercel)
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('[Angel AI Server Fatal Startup Error]', err);
  });
}
