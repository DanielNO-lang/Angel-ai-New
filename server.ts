/**
 * ANGEL AI — Core Full-Stack Application Server & API Engine
 * Portable, framework-standard Express server supporting:
 *  - Standard Node.js / Docker container execution (Port 3000 or $PORT)
 *  - Netlify Functions compatibility (via exported createApp / netlify/functions/api.ts)
 *  - Google Cloud Run & universal PaaS deployment
 *  - Full AI Provider & Tool Registry
 *  - Automation & Webhook Dispatch Architecture
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import { createHash } from 'node:crypto';
import { executeAgentPipeline } from './server/orchestrator';
import { providerRegistry } from './server/providers';
import { getSupabaseServerStatus, getSupabaseAuthClient, getSupabaseClient, getSupabaseClientForUser, getTasksVelocity, syncTasksToSupabase, syncAllEntitiesToSupabase, getSupabaseDDL } from './server/supabase_service';
import { automationService, AutomationEventType } from './server/services/automationService';
import { dispatchZapierEvent } from './server/zapier_service';
import { mediaService } from './server/services/mediaService';
import { voiceService } from './server/services/voiceService';
import { intelligenceService } from './server/services/intelligenceService';
import { readingService } from './server/services/readingService';
import { researchService } from './server/services/researchService';
import { getHyMT2Status, HyMT2Error, translateWithHyMT2 } from './server/services/hymt2TranslationService';
import { getAdkBridgeStatus, AdkBridgeError, runAdkAgent } from './server/services/adkBridgeService';
import { getPythonSandboxStatus, PythonSandboxError, executePythonSandbox } from './server/services/pythonExecutionBridge';
import { listAngelSkills, getAngelSkill, buildAngelSkillContext } from './server/services/angelSkillsService';
import { getAngelCapabilityCatalog } from './server/services/angelCapabilityCatalog';
import { handleAngelMcpMessage } from './server/services/mcpGatewayService';
import { runWorkflowExecution, approveWorkflowExecution, triggerMatchingWorkflows } from './server/services/workflowService';
import { githubService } from './server/services/githubService';
import { vercelService } from './server/services/vercelService';

export interface CreateAppOptions {
  isServerless?: boolean;
}

export async function createApp(options: CreateAppOptions = {}): Promise<Express> {
  const app = express();
  // Trust the hosting edge's immediate proxy hop so per-client rate limits can use the forwarded client IP.
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '32mb' }));

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Distributed rate limiting uses Supabase RPC when the server-role client is available.
  // A local per-instance fallback keeps preview/dev environments usable without privileged credentials.
  const ipCounters = new Map<string, { count: number; resetAt: number }>();
  const rateLimit = (maxRequests: number = 60) => async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown-client';
    const route = String((req as any).route?.path || req.path || '/');
    const now = Date.now();
    const fallbackKey = `${ip}:${route}`;
    if (ipCounters.size > 5000) {
      for (const [key, value] of ipCounters) {
        if (now > value.resetAt) ipCounters.delete(key);
      }
    }

    try {
      const serviceStatus = getSupabaseServerStatus();
      const serviceClient = serviceStatus.hasServiceRoleKey ? getSupabaseClient() : null;
      if (serviceClient) {
        const key = createHash('sha256').update(fallbackKey).digest('hex');
        const { data, error } = await serviceClient.rpc('consume_api_rate_limit', {
          p_key: key,
          p_limit: maxRequests,
          p_window_seconds: 60,
        });
        if (!error && data && typeof data.allowed === 'boolean') {
          res.setHeader('X-RateLimit-Limit', String(maxRequests));
          res.setHeader('X-RateLimit-Remaining', String(data.remaining ?? 0));
          if (data.resetAt) res.setHeader('X-RateLimit-Reset', String(Math.ceil(Date.parse(data.resetAt) / 1000)));
          if (!data.allowed) return res.status(429).json({ error: 'Too many requests. Please slow down.' });
          return next();
        }
        if (error) console.error('[RateLimit] Durable limiter unavailable; using local fallback:', error.message);
      }
    } catch (error) {
      console.error('[RateLimit] Durable limiter failed; using local fallback:', error);
    }

    const entry = ipCounters.get(fallbackKey);
    if (!entry || now > entry.resetAt) {
      ipCounters.set(fallbackKey, { count: 1, resetAt: now + 60000 });
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(maxRequests - 1, 0)));
      return next();
    }
    if (entry.count >= maxRequests) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    entry.count++;
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(maxRequests - entry.count, 0)));
    return next();
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
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null,
      supabase,
      providers,
      environment: process.env.NODE_ENV || 'development',
      isServerless: Boolean(options.isServerless || process.env.VERCEL),
      platform: process.env.NETLIFY ? 'netlify' : process.env.VERCEL ? 'vercel' : 'node',
    });
  });

  // 2. Integrations Status Summary
  app.get('/api/integrations/status', (req: Request, res: Response) => {
    const supabase = getSupabaseServerStatus();
    const isVercelRuntime = Boolean(process.env.VERCEL);
    const isVercelApiConfigured = vercelService.isConfigured();
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
        configured: isVercelApiConfigured,
        apiConfigured: isVercelApiConfigured,
        isVercelRuntime,
        projectId: process.env.VERCEL_PROJECT_ID ? `${process.env.VERCEL_PROJECT_ID.slice(0, 6)}...` : null,
        statusText: isVercelApiConfigured
          ? 'Vercel API token configured; project and deployment operations are available.'
          : isVercelRuntime
            ? 'Running on Vercel, but VERCEL_TOKEN is missing; project and deployment API actions are disabled.'
            : 'Vercel API token is not configured.',
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
  // EXECUTION HISTORY & CANCELLATION
  // ============================================================================

  app.get('/api/executions', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const requestedLimit = Number(req.query.limit || 30);
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 30;
    try {
      const { data, error } = await auth.client.from('executions')
        .select('id, workflow_id, agent_id, status, input, output, error, started_at, completed_at, created_at')
        .eq('user_id', auth.userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ executions: data || [] });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/workflows/:id/executions', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const requestedLimit = Number(req.query.limit || 30);
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 30;
    try {
      const { data, error } = await auth.client.from('executions')
        .select('id, workflow_id, agent_id, status, input, output, error, started_at, completed_at, created_at')
        .eq('user_id', auth.userId)
        .eq('workflow_id', req.params.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ executions: data || [] });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/executions/:id/cancel', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    try {
      const { data: execution, error: lookupError } = await auth.client.from('executions')
        .select('id, status')
        .eq('id', req.params.id)
        .eq('user_id', auth.userId)
        .maybeSingle();
      if (lookupError) return res.status(500).json({ error: lookupError.message });
      if (!execution) return res.status(404).json({ error: 'Execution not found.' });
      if (execution.status === 'running') {
        const { error } = await auth.client.from('executions').update({ status: 'cancel_requested' })
          .eq('id', execution.id).eq('user_id', auth.userId).eq('status', 'running');
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true, status: 'cancel_requested', id: execution.id });
      }
      if (execution.status === 'awaiting_approval') {
        const { error } = await auth.client.from('executions').update({
          status: 'cancelled',
          error: 'Execution cancelled by the user.',
          completed_at: new Date().toISOString(),
        }).eq('id', execution.id).eq('user_id', auth.userId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true, status: 'cancelled', id: execution.id });
      }
      return res.status(409).json({ error: `Execution cannot be cancelled from status "${execution.status}".` });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ============================================================================
  // TENCENT HY-MT2 SPECIALIST TRANSLATION API
  // ============================================================================

  app.get('/api/translation/status', (_req: Request, res: Response) => {
    res.json(getHyMT2Status());
  });

  // Dedicated translation specialist; provider tokens remain server-side.
  app.post('/api/translation/translate', rateLimit(10), async (req: Request, res: Response) => {
    const body = req.body || {};
    const text = typeof body.text === 'string' ? body.text : '';
    const targetLanguage = typeof body.targetLanguage === 'string' ? body.targetLanguage.trim() : '';
    const sourceLanguage = typeof body.sourceLanguage === 'string' ? body.sourceLanguage.trim() : 'Auto-detect';
    const style = typeof body.style === 'string' ? body.style : undefined;
    const context = typeof body.context === 'string' ? body.context : undefined;

    if (!text.trim()) return res.status(400).json({ error: 'text is required.' });
    if (text.length > 30000) return res.status(413).json({ error: 'text must be 30,000 characters or fewer per request.' });
    if (!targetLanguage || targetLanguage.length > 80) return res.status(400).json({ error: 'targetLanguage is required and must be 80 characters or fewer.' });
    if (!sourceLanguage || sourceLanguage.length > 80) return res.status(400).json({ error: 'sourceLanguage must be 80 characters or fewer.' });
    if (style && style.length > 500) return res.status(400).json({ error: 'style must be 500 characters or fewer.' });
    if (context && context.length > 2000) return res.status(400).json({ error: 'context must be 2,000 characters or fewer.' });

    try {
      const result = await translateWithHyMT2({ text, sourceLanguage, targetLanguage, style, context });
      return res.json({ success: true, ...result });
    } catch (error) {
      if (error instanceof HyMT2Error) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code, provider: 'hymt2' });
      }
      console.error('[Hy-MT2 Translation]', error);
      return res.status(502).json({ error: 'Hy-MT2 translation failed.', code: 'translation_failed', provider: 'hymt2' });
    }
  });

  // ============================================================================
  // MODEL CATALOG & CAPABILITY ROUTING
  // ============================================================================

  app.get('/api/integrations/capabilities', (_req: Request, res: Response) => {
    res.json(getAngelCapabilityCatalog());
  });

  app.get('/api/agents/adk/status', (_req: Request, res: Response) => {
    res.json(getAdkBridgeStatus());
  });

  app.post('/api/agents/adk/run', requireSupabaseUser, rateLimit(10), async (req: Request, res: Response) => {
    const body = req.body || {};
    if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 20000) {
      return res.status(400).json({ error: 'message must contain 1 to 20,000 characters.' });
    }
    if (body.sessionId !== undefined && (typeof body.sessionId !== 'string' || body.sessionId.length > 160)) {
      return res.status(400).json({ error: 'sessionId must be a string of no more than 160 characters.' });
    }
    try {
      const auth = (req as any).angelAuth;
      const result = await runAdkAgent({ message: body.message.trim(), sessionId: body.sessionId }, auth.userId);
      return res.json(result);
    } catch (error) {
      if (error instanceof AdkBridgeError) return res.status(error.statusCode).json({ error: error.message, code: error.code });
      console.error('[ADK bridge]', error);
      return res.status(502).json({ error: 'Google ADK request failed.', code: 'adk_request_failed' });
    }
  });

  app.get('/api/python/status', (_req: Request, res: Response) => {
    res.json(getPythonSandboxStatus());
  });

  app.post('/api/python/execute', requireSupabaseUser, rateLimit(5), async (req: Request, res: Response) => {
    const body = req.body || {};
    if (typeof body.code !== 'string' || !body.code.trim()) {
      return res.status(400).json({ error: 'code is required.' });
    }
    if (body.code.length > 20000) return res.status(413).json({ error: 'Python code must be 20,000 characters or fewer.' });
    if (body.stdin !== undefined && (typeof body.stdin !== 'string' || body.stdin.length > 5000)) {
      return res.status(400).json({ error: 'stdin must be a string of no more than 5,000 characters.' });
    }
    if (body.timeoutMs !== undefined && (!Number.isInteger(body.timeoutMs) || body.timeoutMs < 1000 || body.timeoutMs > 10000)) {
      return res.status(400).json({ error: 'timeoutMs must be an integer between 1,000 and 10,000.' });
    }
    try {
      const auth = (req as any).angelAuth;
      const result = await executePythonSandbox({
        code: body.code,
        stdin: body.stdin,
        timeoutMs: body.timeoutMs,
      }, auth.userId);
      return res.json({ success: true, language: 'python', ...result });
    } catch (error) {
      if (error instanceof PythonSandboxError) return res.status(error.statusCode).json({ error: error.message, code: error.code });
      console.error('[Python sandbox bridge]', error);
      return res.status(502).json({ error: 'Python execution failed.', code: 'sandbox_request_failed' });
    }
  });

  app.get('/api/skills/catalog', requireSupabaseUser, (_req: Request, res: Response) => {
    res.json({ skills: listAngelSkills(), count: listAngelSkills().length });
  });

  app.get('/api/skills/:id', requireSupabaseUser, (req: Request, res: Response) => {
    const skill = getAngelSkill(String(req.params.id || ''));
    if (!skill) return res.status(404).json({ error: 'Angel skill not found.' });
    return res.json({ skill });
  });

  // Validate Streamable HTTP transport headers and Origin before processing MCP messages.
  // Native clients with no Origin may connect with a Bearer token; browser origins must be allowlisted.
  const validateMcpTransportHeaders = (req: Request, res: Response): boolean => {
    const origin = req.headers.origin;
    if (typeof origin === 'string' && origin.trim()) {
      let normalizedOrigin: string;
      try {
        normalizedOrigin = new URL(origin).origin;
      } catch {
        res.status(403).json({ error: 'Invalid MCP Origin header.' });
        return false;
      }

      const configuredOrigins = (process.env.ANGEL_MCP_ALLOWED_ORIGINS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const allowedOrigins = new Set<string>([
        'https://angel-ai-new.netlify.app',
        'https://main--angel-ai-new.netlify.app',
        ...configuredOrigins,
      ]);
      try {
        if (process.env.APP_URL) allowedOrigins.add(new URL(process.env.APP_URL).origin);
      } catch {
        // Invalid optional APP_URL does not widen the origin allowlist.
      }
      if (!allowedOrigins.has(normalizedOrigin)) {
        res.status(403).json({ error: 'MCP requests from this Origin are not allowed.' });
        return false;
      }
    }

    const protocolVersion = req.headers['mcp-protocol-version'];
    const supportedVersions = ['2025-11-25', '2025-06-18', '2025-03-26'];
    if (typeof protocolVersion === 'string' && !supportedVersions.includes(protocolVersion)) {
      res.status(400).json({ error: 'Unsupported MCP-Protocol-Version.' });
      return false;
    }
    return true;
  };

  // Stateless authenticated MCP endpoint. All operations use an allowlisted handler table.
  app.post('/api/mcp', requireSupabaseUser, rateLimit(30), async (req: Request, res: Response) => {
    if (!validateMcpTransportHeaders(req, res)) return;
    if (process.env.ANGEL_MCP_ENABLED === 'false') {
      return res.status(503).json({ error: 'Angel MCP gateway is disabled by configuration.' });
    }
    const auth = (req as any).angelAuth;
    const result = await handleAngelMcpMessage(req.body, {
      getCapabilities: getAngelCapabilityCatalog,
      translate: async (args) => translateWithHyMT2({
        text: String(args.text || ''),
        sourceLanguage: typeof args.sourceLanguage === 'string' ? args.sourceLanguage : 'Auto-detect',
        targetLanguage: String(args.targetLanguage || ''),
        style: typeof args.style === 'string' ? args.style : undefined,
        context: typeof args.context === 'string' ? args.context : undefined,
      }),
      generateImage: async (args) => {
        const artifact = await mediaService.generateImage({
          prompt: String(args.prompt || ''),
          negativePrompt: typeof args.negativePrompt === 'string' ? args.negativePrompt : undefined,
          modelId: typeof args.modelId === 'string' ? args.modelId : undefined,
          aspectRatio: typeof args.aspectRatio === 'string' ? args.aspectRatio as any : undefined,
          style: typeof args.style === 'string' ? args.style : undefined,
        });
        try {
          if (artifact.status !== 'completed') throw new Error(artifact.error || 'Image generation failed.');
          return await persistMediaArtifact(auth, artifact);
        } finally {
          mediaService.deleteArtifact(artifact.id);
        }
      },
      runPython: async (args) => executePythonSandbox({
        code: String(args.code || ''),
        stdin: typeof args.stdin === 'string' ? args.stdin : undefined,
        timeoutMs: typeof args.timeoutMs === 'number' ? args.timeoutMs : undefined,
      }, auth.userId),
      runAdk: async (args) => runAdkAgent({
        message: String(args.message || ''),
        sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined,
      }, auth.userId),
    });
    if (result.statusCode === 202) return res.status(202).end();
    return res.status(result.statusCode).json(result.body);
  });

  app.get('/api/mcp', (req: Request, res: Response) => {
    if (!validateMcpTransportHeaders(req, res)) return;
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Angel MCP does not offer server-sent event streams; use authenticated POST requests with JSON-RPC.' });
  });

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

  // Grounded web research — Google Search is executed by Gemini and sources are returned explicitly.
  const webResearchHandler = async (req: Request, res: Response) => {
    const body = req.body || {};
    if (typeof body.query !== 'string' || body.query.trim().length < 3 || body.query.trim().length > 2000) {
      return res.status(400).json({ error: 'query must contain 3 to 2,000 characters.' });
    }
    try {
      const result = await researchService.search(body.query, {
        modelId: 'gemini-3.8-flash',
        maxSources: Number(body.maxSources) || 6,
      });
      if (!result.answer) return res.status(502).json({ error: 'The research provider returned no answer.' });
      return res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Web research failed.';
      console.error('[Web Research]', message);
      return res.status(message.includes('not configured') ? 503 : 502).json({ error: message });
    }
  };

  app.post('/api/research/search', attachOptionalSupabaseUser, rateLimit(8), webResearchHandler);
  app.post('/api/web/search', attachOptionalSupabaseUser, rateLimit(8), webResearchHandler);

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
        systemInstructions: [
          systemInstructions || 'You are an Angel AI specialized agent.',
          buildAngelSkillContext(req.body?.skillIds),
        ].filter(Boolean).join('\n\n'),
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

  // ============================================================================
  // CONVERSATION HISTORY API — persistent, user-owned chat records
  // All operations use the verified user's JWT so Supabase RLS remains active.
  // ============================================================================

  app.get('/api/conversations', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || '50'), 10) || 50));
    try {
      const { data, error } = await auth.client.from('conversations')
        .select('*')
        .eq('user_id', auth.userId)
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) return res.status(500).json({ error: 'Could not load conversation history.' });
      return res.json({ conversations: data || [], count: data?.length || 0 });
    } catch (err) {
      console.error('[Conversations List]', err);
      return res.status(500).json({ error: 'Could not load conversation history.' });
    }
  });

  app.post('/api/conversations', requireSupabaseUser, rateLimit(20), async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 240) : 'New conversation';
    const allowedModes = ['chat', 'agent', 'research', 'reading'];
    const mode = allowedModes.includes(body.mode) ? body.mode : 'chat';
    const id = typeof body.id === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(body.id)
      ? body.id
      : `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();
    try {
      const { data, error } = await auth.client.from('conversations').insert({
        id, user_id: auth.userId, title, mode,
        model: typeof body.model === 'string' ? body.model.slice(0, 120) : null,
        metadata: body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {},
        created_at: now, updated_at: now,
      }).select('*').single();
      if (error) return res.status(400).json({ error: 'Could not create conversation. The ID may already exist.' });
      return res.status(201).json({ conversation: data });
    } catch (err) {
      console.error('[Conversations Create]', err);
      return res.status(500).json({ error: 'Could not create conversation.' });
    }
  });

  app.get('/api/conversations/:id/messages', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const limit = Math.min(500, Math.max(1, Number.parseInt(String(req.query.limit || '100'), 10) || 100));
    try {
      const { data: conversation, error: conversationError } = await auth.client.from('conversations')
        .select('id').eq('id', req.params.id).eq('user_id', auth.userId).maybeSingle();
      if (conversationError) return res.status(500).json({ error: 'Could not verify conversation ownership.' });
      if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
      let query = auth.client.from('messages').select('*')
        .eq('conversation_id', req.params.id).eq('user_id', auth.userId)
        .order('created_at', { ascending: true }).limit(limit);
      if (typeof req.query.before === 'string' && !Number.isNaN(Date.parse(req.query.before))) {
        query = query.lt('created_at', new Date(req.query.before).toISOString());
      }
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: 'Could not load conversation messages.' });
      return res.json({ messages: data || [], count: data?.length || 0 });
    } catch (err) {
      console.error('[Conversation Messages List]', err);
      return res.status(500).json({ error: 'Could not load conversation messages.' });
    }
  });

  app.post('/api/conversations/:id/messages', requireSupabaseUser, rateLimit(60), async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const body = req.body || {};
    if (!['user', 'assistant'].includes(body.role)) {
      return res.status(400).json({ error: 'Message role must be user or assistant.' });
    }
    if (typeof body.content !== 'string' || !body.content.trim() || body.content.length > 100000) {
      return res.status(400).json({ error: 'Message content must contain 1 to 100,000 characters.' });
    }
    try {
      const { data: conversation, error: conversationError } = await auth.client.from('conversations')
        .select('id,title').eq('id', req.params.id).eq('user_id', auth.userId).maybeSingle();
      if (conversationError) return res.status(500).json({ error: 'Could not verify conversation ownership.' });
      if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
      const now = new Date().toISOString();
      const { data, error } = await auth.client.from('messages').insert({
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        conversation_id: conversation.id,
        user_id: auth.userId,
        role: body.role,
        content: body.content,
        attachments: Array.isArray(body.attachments) ? body.attachments.slice(0, 20) : [],
        metadata: body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {},
        created_at: now,
      }).select('*').single();
      if (error) return res.status(400).json({ error: 'Could not save message.' });
      const title = body.role === 'user' && (!conversation.title || conversation.title === 'New conversation')
        ? body.content.trim().replace(/\s+/g, ' ').slice(0, 72)
        : conversation.title;
      await auth.client.from('conversations').update({ title, updated_at: now })
        .eq('id', conversation.id).eq('user_id', auth.userId);
      return res.status(201).json({ message: data });
    } catch (err) {
      console.error('[Conversation Message Create]', err);
      return res.status(500).json({ error: 'Could not save message.' });
    }
  });

  app.delete('/api/conversations/:id', requireSupabaseUser, rateLimit(10), async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    try {
      const { data: conversation, error: lookupError } = await auth.client.from('conversations')
        .select('id').eq('id', req.params.id).eq('user_id', auth.userId).maybeSingle();
      if (lookupError) return res.status(500).json({ error: 'Could not verify conversation ownership.' });
      if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
      const { error: messagesError } = await auth.client.from('messages').delete()
        .eq('conversation_id', conversation.id).eq('user_id', auth.userId);
      if (messagesError) return res.status(500).json({ error: 'Could not delete conversation messages.' });
      const { error: deleteError } = await auth.client.from('conversations').delete()
        .eq('id', conversation.id).eq('user_id', auth.userId);
      if (deleteError) return res.status(500).json({ error: 'Could not delete conversation.' });
      return res.json({ success: true, id: conversation.id });
    } catch (err) {
      console.error('[Conversation Delete]', err);
      return res.status(500).json({ error: 'Could not delete conversation.' });
    }
  });

  // ============================================================================
  // PRIVATE MEDIA ARTIFACTS — Supabase Storage + RLS-scoped metadata
  // ============================================================================
  const mediaRowToArtifact = async (auth: any, row: any) => {
    let url = typeof row.url === 'string' ? row.url : '';
    if (row.storage_path) {
      const { data, error } = await auth.client.storage.from('angel-media')
        .createSignedUrl(row.storage_path, 3600);
      url = !error && data?.signedUrl ? data.signedUrl : '';
    }
    return {
      id: row.id,
      title: row.title,
      prompt: row.prompt,
      negativePrompt: row.negative_prompt || undefined,
      type: row.type,
      category: row.category,
      url,
      mimeType: row.mime_type,
      aspectRatio: row.aspect_ratio,
      modelId: row.model_id,
      status: row.status,
      progress: row.progress,
      tags: row.tags || [],
      projectId: row.project_id || undefined,
      taskId: row.task_id || undefined,
      conversationId: row.conversation_id || undefined,
      fileSizeBytes: row.file_size_bytes || undefined,
      width: row.width || undefined,
      height: row.height || undefined,
      durationSec: row.duration_sec || undefined,
      seed: row.seed || undefined,
      metadata: row.metadata || {},
      error: row.error || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  };

  const persistMediaArtifact = async (auth: any, artifact: any) => {
    let storagePath: string | null = null;
    let storedUrl = '';
    const dataUri = typeof artifact.url === 'string'
      ? artifact.url.match(/^data:([^;]+);base64,([\s\S]+)$/)
      : null;
    if (dataUri) {
      const mimeType = dataUri[1].toLowerCase();
      const extensions: Record<string, string> = {
        'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
        'video/mp4': 'mp4', 'application/pdf': 'pdf',
      };
      const extension = extensions[mimeType];
      if (!extension) throw new Error('Generated media type is not supported for private storage.');
      const bytes = Buffer.from(dataUri[2], 'base64');
      if (bytes.byteLength > 20 * 1024 * 1024) throw new Error('Generated media exceeds the 20 MB storage limit.');
      storagePath = `${auth.userId}/${artifact.id}.${extension}`;
      const { error: uploadError } = await auth.client.storage.from('angel-media').upload(storagePath, bytes, {
        contentType: mimeType,
        upsert: true,
      });
      if (uploadError) throw new Error(`Could not store generated media: ${uploadError.message}`);
    } else if (artifact.url && /^https:\/\//i.test(artifact.url)) {
      // Only provider-originated HTTPS URLs may be stored as external assets.
      storedUrl = artifact.url;
    }

    const row = {
      id: artifact.id,
      user_id: auth.userId,
      title: String(artifact.title || 'Untitled media').slice(0, 240),
      prompt: String(artifact.prompt || '').slice(0, 12000),
      negative_prompt: artifact.negativePrompt || null,
      type: artifact.type,
      category: artifact.category,
      storage_path: storagePath,
      url: storedUrl,
      mime_type: artifact.mimeType || 'application/octet-stream',
      aspect_ratio: artifact.aspectRatio || '16:9',
      model_id: String(artifact.modelId || 'unknown').slice(0, 160),
      status: artifact.status || 'failed',
      progress: Math.min(100, Math.max(0, Number(artifact.progress) || 0)),
      tags: Array.isArray(artifact.tags) ? artifact.tags.filter((tag: unknown) => typeof tag === 'string').slice(0, 30) : [],
      project_id: artifact.projectId || null,
      task_id: artifact.taskId || null,
      conversation_id: artifact.conversationId || null,
      file_size_bytes: storagePath ? undefined : artifact.fileSizeBytes || null,
      width: artifact.width || null,
      height: artifact.height || null,
      duration_sec: artifact.durationSec || null,
      seed: artifact.seed || null,
      metadata: artifact.metadata && typeof artifact.metadata === 'object' ? artifact.metadata : {},
      error: artifact.error ? String(artifact.error).slice(0, 2000) : null,
      created_at: artifact.createdAt || new Date().toISOString(),
      updated_at: artifact.updatedAt || new Date().toISOString(),
    };
    const { data, error } = await auth.client.from('media_artifacts')
      .upsert(row, { onConflict: 'id' }).select('*').single();
    if (error) throw new Error(`Could not persist media artifact: ${error.message}`);
    return mediaRowToArtifact(auth, data);
  };

  app.get('/api/media/artifacts', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    const { category, projectId, taskId, search } = req.query as Record<string, string>;
    try {
      let query = auth.client.from('media_artifacts').select('*')
        .eq('user_id', auth.userId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (category && category !== 'all') query = query.eq('category', category);
      if (projectId) query = query.eq('project_id', projectId);
      if (taskId) query = query.eq('task_id', taskId);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: 'Could not load media artifacts.' });
      let rows = data || [];
      if (search) {
        const needle = search.toLowerCase();
        rows = rows.filter((row: any) => String(row.title).toLowerCase().includes(needle)
          || String(row.prompt).toLowerCase().includes(needle)
          || (row.tags || []).some((tag: string) => tag.toLowerCase().includes(needle)));
      }
      const artifacts = await Promise.all(rows.map((row: any) => mediaRowToArtifact(auth, row)));
      return res.json({ artifacts, count: artifacts.length });
    } catch (err) {
      console.error('[Media Artifact List]', err);
      return res.status(500).json({ error: 'Could not load media artifacts.' });
    }
  });

  app.get('/api/media/artifacts/:id', requireSupabaseUser, async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    try {
      const { data, error } = await auth.client.from('media_artifacts').select('*')
        .eq('id', req.params.id).eq('user_id', auth.userId).maybeSingle();
      if (error) return res.status(500).json({ error: 'Could not load media artifact.' });
      if (!data) return res.status(404).json({ error: 'Media artifact not found.' });
      return res.json(await mediaRowToArtifact(auth, data));
    } catch (err) {
      console.error('[Media Artifact Detail]', err);
      return res.status(500).json({ error: 'Could not load media artifact.' });
    }
  });

  app.post('/api/media/artifacts/:id/poll', requireSupabaseUser, rateLimit(20), async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    try {
      const { data: row, error } = await auth.client.from('media_artifacts').select('*')
        .eq('id', req.params.id).eq('user_id', auth.userId).maybeSingle();
      if (error) return res.status(500).json({ error: 'Could not load media job.' });
      if (!row) return res.status(404).json({ error: 'Media job not found.' });
      if (row.type !== 'video') return res.status(400).json({ error: 'Only video jobs can be polled.' });
      if (row.status !== 'queued' && row.status !== 'processing') {
        return res.json(await mediaRowToArtifact(auth, row));
      }
      const artifact = await mediaRowToArtifact(auth, row);
      const updated = await mediaService.pollVideoGeneration(artifact);
      const saved = await persistMediaArtifact(auth, updated);
      mediaService.deleteArtifact(updated.id);
      const status = updated.status === 'completed' ? 200 : updated.status === 'failed' ? 502 : 202;
      return res.status(status).json(saved);
    } catch (err) {
      console.error('[Media Video Poll]', err);
      return res.status(502).json({ error: err instanceof Error ? err.message : 'Could not update video generation status.' });
    }
  });

  app.post('/api/media/generate-image', attachOptionalSupabaseUser, rateLimit(8), async (req: Request, res: Response) => {
    const { prompt } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 12000) {
      return res.status(400).json({ error: 'prompt must contain 1 to 12,000 characters.' });
    }
    const auth = (req as any).angelAuth;
    if (typeof req.body?.modelId === 'string' && req.body.modelId.startsWith('qwen-image-2.1-') && !auth) {
      return res.status(401).json({ error: 'Sign in before using the hosted Qwen Image provider.' });
    }
    try {
      const artifact = await mediaService.generateImage(req.body);
      const saved = auth ? await persistMediaArtifact(auth, artifact) : artifact;
      mediaService.deleteArtifact(artifact.id);
      return res.status(artifact.status === 'completed' ? 200 : 502).json(saved);
    } catch (err) {
      console.error('[Media Image Generation]', err);
      return res.status(502).json({ error: err instanceof Error ? err.message : 'Image generation failed.' });
    }
  });

  app.post('/api/media/generate-video', requireSupabaseUser, rateLimit(3), async (req: Request, res: Response) => {
    const { prompt } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 12000) {
      return res.status(400).json({ error: 'prompt must contain 1 to 12,000 characters.' });
    }
    try {
      const auth = (req as any).angelAuth;
      const artifact = await mediaService.generateVideo(req.body);
      const persisted = await persistMediaArtifact(auth, artifact);
      mediaService.deleteArtifact(artifact.id);
      return res.status(artifact.status === 'completed' ? 200 : artifact.status === 'processing' || artifact.status === 'queued' ? 202 : 502).json(persisted);
    } catch (err) {
      console.error('[Media Video Generation]', err);
      return res.status(502).json({ error: err instanceof Error ? err.message : 'Video generation failed.' });
    }
  });

  app.post('/api/media/edit', attachOptionalSupabaseUser, rateLimit(8), async (req: Request, res: Response) => {
    const { baseImageBase64, prompt } = req.body || {};
    if (typeof baseImageBase64 !== 'string' || !baseImageBase64 || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'baseImageBase64 and prompt are required.' });
    }
    if (baseImageBase64.length > 28_000_000 || prompt.length > 12000) {
      return res.status(413).json({ error: 'Image or prompt exceeds the supported size limit.' });
    }
    const auth = (req as any).angelAuth;
    if (typeof req.body?.modelId === 'string' && req.body.modelId.startsWith('qwen-image-2.1-') && !auth) {
      return res.status(401).json({ error: 'Sign in before using the hosted Qwen Image provider.' });
    }
    try {
      const artifact = await mediaService.editImage(req.body);
      const saved = auth ? await persistMediaArtifact(auth, artifact) : artifact;
      mediaService.deleteArtifact(artifact.id);
      return res.status(artifact.status === 'completed' ? 200 : 502).json(saved);
    } catch (err) {
      console.error('[Media Image Edit]', err);
      return res.status(502).json({ error: err instanceof Error ? err.message : 'Image editing failed.' });
    }
  });

  app.delete('/api/media/artifacts/:id', requireSupabaseUser, rateLimit(10), async (req: Request, res: Response) => {
    const auth = (req as any).angelAuth;
    try {
      const { data: artifact, error: lookupError } = await auth.client.from('media_artifacts').select('id,storage_path')
        .eq('id', req.params.id).eq('user_id', auth.userId).maybeSingle();
      if (lookupError) return res.status(500).json({ error: 'Could not verify media artifact ownership.' });
      if (!artifact) return res.status(404).json({ error: 'Media artifact not found.' });
      if (artifact.storage_path) {
        const { error: storageError } = await auth.client.storage.from('angel-media').remove([artifact.storage_path]);
        if (storageError) return res.status(500).json({ error: 'Could not delete the stored media file.' });
      }
      const { error } = await auth.client.from('media_artifacts').delete()
        .eq('id', artifact.id).eq('user_id', auth.userId);
      if (error) return res.status(500).json({ error: 'Could not delete media artifact metadata.' });
      return res.json({ success: true, id: artifact.id });
    } catch (err) {
      console.error('[Media Artifact Delete]', err);
      return res.status(500).json({ error: 'Could not delete media artifact.' });
    }
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

// Avoid starting a listening server inside Netlify Functions or another serverless host.
if (!process.env.NETLIFY && !process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('[Angel AI Server Fatal Startup Error]', err);
  });
}
