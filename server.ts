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
import crypto from 'crypto';
import { executeAgentPipeline } from './server/orchestrator.js';
import { providerRegistry, rankAvailableModels, modelRoutingTelemetry } from './server/providers/index.js';
import { getSupabaseServerStatus, getSupabaseClient, getTasksVelocity, syncTasksToSupabase, syncAllEntitiesToSupabase, getSupabaseDDL } from './server/supabase_service.js';
import { automationService, AutomationEventType } from './server/services/automationService.js';
import { dispatchZapierEvent } from './server/zapier_service.js';
import { authService } from './server/services/authService.js';
import { mediaService } from './server/services/mediaService.js';
import { voiceService } from './server/services/voiceService.js';
import { intelligenceService } from './server/services/intelligenceService.js';
import { searchGroundedWeb } from './server/services/groundedSearchService.js';
import { runGroundedResearch } from './server/services/researchService.js';
import { recordAdminAuditEvent } from './server/services/auditService.js';
import { githubService } from './server/services/githubService.js';
import { vercelService } from './server/services/vercelService.js';

function isAllowedCallbackUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    if (url.port && url.port !== '443') return false;
    const allowedHosts = (process.env.ANGEL_CALLBACK_HOST_ALLOWLIST || '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
    return allowedHosts.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export interface CreateAppOptions {
  isServerless?: boolean;
}

export async function createApp(options: CreateAppOptions = {}): Promise<Express> {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Rate Limiting Map
  const ipCounters = new Map<string, { count: number; resetAt: number }>();
  const rateLimit = (maxRequests: number = 60) => async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const scope = req.baseUrl || '/api';
    const now = Date.now();
    const localKey = scope + ':' + ip;

    // Use the existing atomic Supabase RPC in production so limits are shared
    // across serverless instances. Preview/local environments fall back to memory.
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const key = crypto.createHash('sha256').update(localKey).digest('hex');
          const { data, error } = await supabase.rpc('consume_api_rate_limit', {
            p_key: key,
            p_limit: maxRequests,
            p_window_seconds: 60,
          });
          const decision = data && typeof data === 'object' && !Array.isArray(data)
            ? data as { allowed?: boolean; remaining?: number; resetAt?: string }
            : null;
          if (!error && decision && typeof decision.allowed === 'boolean') {
            res.setHeader('X-RateLimit-Limit', String(maxRequests));
            res.setHeader('X-RateLimit-Remaining', String(decision.remaining ?? 0));
            if (!decision.allowed) {
              const resetAt = decision.resetAt ? Date.parse(decision.resetAt) : now + 60000;
              const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
              res.setHeader('Retry-After', String(retryAfter));
              return res.status(429).json({ error: 'Too many requests. Please slow down.', retryAfterSeconds: retryAfter });
            }
            return next();
          }
        }
      } catch (error) {
        console.warn('[RateLimit] Distributed limiter unavailable; using local fallback.', error);
      }
    }

    if (ipCounters.size > 5000) {
      for (const [key, value] of ipCounters) {
        if (now > value.resetAt) ipCounters.delete(key);
      }
    }
    const entry = ipCounters.get(localKey);
    if (!entry || now > entry.resetAt) {
      ipCounters.set(localKey, { count: 1, resetAt: now + 60000 });
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - 1)));
      return next();
    }
    if (entry.count >= maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many requests. Please slow down.', retryAfterSeconds: retryAfter });
    }
    entry.count++;
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    return next();
  };

  // Apply shared server-side rate limits. These are a baseline, not a substitute
  // for a distributed limiter when running multiple serverless instances.
  app.use('/api', rateLimit(120));
  app.use(['/api/ai', '/api/chat', '/api/voice', '/api/media', '/api/search'], rateLimit(24));

  const requireVerifiedAdminSession = async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (!token || adminEmails.length === 0) {
      return res.status(401).json({ error: 'A verified, allowlisted administrator session is required.' });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase authentication is not configured for admin authorization.' });
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);
      const user = data?.user;
      const email = user?.email?.toLowerCase();
      const verified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
      if (error || !user || !email || !verified || !adminEmails.includes(email)) {
        return res.status(403).json({ error: 'Administrator access denied.' });
      }
      res.locals.authenticatedAdmin = { id: user.id, email };
      res.on('finish', () => {
        const admin = res.locals.authenticatedAdmin as { id: string; email: string } | undefined;
        if (!admin) return;
        void recordAdminAuditEvent({
          userId: admin.id,
          email: admin.email,
          method: req.method,
          route: (req.baseUrl + req.path).slice(0, 500),
          statusCode: res.statusCode,
          requestId: typeof req.headers['x-vercel-id'] === 'string' ? req.headers['x-vercel-id'] : undefined,
          ip: req.ip,
        });
      });
      return next();
    } catch {
      return res.status(401).json({ error: 'Unable to verify administrator session.' });
    }
  };

  // Privileged integrations can read private repositories and trigger deployments.
  app.use('/api/integrations/github', requireVerifiedAdminSession);
  app.use('/api/integrations/vercel', requireVerifiedAdminSession);
  app.use('/api/automation', requireVerifiedAdminSession);

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
  app.get('/api/supabase/velocity', async (req: Request, res: Response) => {
    try {
      const metrics = await getTasksVelocity([]);
      res.json(metrics);
    } catch (err) {
      console.error('[API /api/supabase/velocity Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/supabase/velocity', async (req: Request, res: Response) => {
    try {
      const { tasks } = req.body || {};
      const fallbackTasks = Array.isArray(tasks) ? tasks : [];
      const metrics = await getTasksVelocity(fallbackTasks);
      res.json(metrics);
    } catch (err) {
      console.error('[API /api/supabase/velocity POST Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Legacy server-side sync used a service-role client without deriving user_id
  // from a verified Supabase access token. Disable it until ownership-scoped sync exists.
  app.post('/api/supabase/sync', (_req: Request, res: Response) => {
    res.status(503).json({
      error: 'Legacy server-side sync is temporarily disabled until authenticated, user-scoped Supabase persistence is enabled. Existing local/offline workspace data remains available.',
    });
  });

  app.post('/api/supabase/sync-all', (_req: Request, res: Response) => {
    res.status(503).json({
      error: 'Legacy bulk sync is temporarily disabled until authenticated, user-scoped Supabase persistence is enabled.',
    });
  });

  app.get('/api/supabase/ddl', requireVerifiedAdminSession, (_req: Request, res: Response) => {
    res.type('text/plain').send(getSupabaseDDL());
  });

  // ============================================================================
  // MODEL CATALOG & CAPABILITY ROUTING
  // ============================================================================

  app.get('/api/models', (_req: Request, res: Response) => {
    res.json(providerRegistry.getModelCatalog());
  });

  // Explain a routing decision without exposing prompts or credentials.
  app.post('/api/models/route', (req: Request, res: Response) => {
    const task = req.body?.task;
    const allowed: string[] = ['chat', 'research', 'vision', 'tool_calling', 'embeddings', 'coding', 'reasoning'];
    if (typeof task !== 'string' || !allowed.includes(task)) {
      return res.status(400).json({ error: 'Provide a supported task type.', supportedTasks: allowed });
    }
    try {
      const preferredProvider = typeof req.body?.preferredProvider === 'string' ? req.body.preferredProvider : undefined;
      const ranked = rankAvailableModels(providerRegistry.getModelCatalog(), task as any, modelRoutingTelemetry.snapshot(), preferredProvider);
      if (!ranked.length) return res.status(503).json({ error: 'No configured model supports this task.', task });
      const selected = ranked[0];
      return res.json({
        task,
        selected: { provider: selected.provider, modelId: selected.id, name: selected.name },
        alternatives: ranked.slice(1, 4).map((model) => ({ provider: model.provider, modelId: model.id, name: model.name })),
        metricsScope: 'in-memory aggregate observations for this server process; not a guarantee of future performance',
      });
    } catch {
      return res.status(500).json({ error: 'Model routing is temporarily unavailable.' });
    }
  });

  // Real grounded web search. Sources must come from Google Search grounding metadata.
  app.post('/api/search/web', async (req: Request, res: Response) => {
    const query = req.body?.query;
    const numResults = req.body?.numResults;
    if (typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'A search query is required.' });
    }
    if (!process.env.GEMINI_API_KEY?.trim()) {
      return res.status(503).json({ success: false, error: 'Grounded web search is not configured on the server.' });
    }
    try {
      const result = await searchGroundedWeb(query, typeof numResults === 'number' ? numResults : 5);
      if (!result.success) return res.status(502).json(result);
      return res.json(result);
    } catch (err) {
      console.error('[API /api/search/web Error]', err);
      const status = typeof (err as any)?.status === 'number' ? (err as any).status : 0;
      if (status === 429) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
          success: false,
          error: 'Google Search grounding quota is exhausted for the Gemini API project used by the configured key. No search results were returned. Restore Gemini API quota/billing or configure an approved alternative search provider.',
          retryAfterSeconds: 60,
        });
      }
      if (status === 401 || status === 403) {
        return res.status(503).json({
          success: false,
          error: 'Google Search grounding is not authorized for the configured Gemini API key. Check the key, project, and grounding/model access.',
        });
      }
      return res.status(502).json({
        success: false,
        error: 'Grounded web search failed. No unverified or synthetic results were returned.',
      });
    }
  });

  // ============================================================================
  // GITHUB REAL INTEGRATION ENDPOINTS
  // ============================================================================

  app.get('/api/integrations/github/test', async (_req: Request, res: Response) => {
    const result = await githubService.testConnection();
    res.json(result);
  });

  app.get('/api/integrations/github/repo_details', async (req: Request, res: Response) => {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER || 'angel-ai';
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME || 'angel-workspace';
    try {
      const details = await githubService.getRepoDetails(owner, repo);
      res.json(details);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/integrations/github/list_branches', async (req: Request, res: Response) => {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER || 'angel-ai';
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME || 'angel-workspace';
    try {
      const branches = await githubService.listBranches(owner, repo);
      res.json(branches);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/integrations/github/list_files', async (req: Request, res: Response) => {
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

  app.get('/api/integrations/github/file_content', async (req: Request, res: Response) => {
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

  app.get('/api/integrations/github/list_issues', async (req: Request, res: Response) => {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER || 'angel-ai';
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME || 'angel-workspace';
    try {
      const issues = await githubService.listIssues(owner, repo);
      res.json(issues);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/integrations/github/create_issue', async (req: Request, res: Response) => {
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

  app.get('/api/integrations/github/list_prs', async (req: Request, res: Response) => {
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

  app.get('/api/integrations/vercel/test', async (_req: Request, res: Response) => {
    const result = await vercelService.testConnection();
    res.json(result);
  });

  app.get('/api/integrations/vercel/projects', async (_req: Request, res: Response) => {
    try {
      const projects = await vercelService.listProjects();
      res.json(projects);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/integrations/vercel/deployments', async (req: Request, res: Response) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const deployments = await vercelService.listDeployments(projectId);
      res.json(deployments);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/integrations/vercel/trigger_deploy', async (req: Request, res: Response) => {
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
  app.post(['/api/ai/stream', '/api/chat/stream'], async (req: Request, res: Response) => {
    const body = req.body || {};
    const prompt = body.prompt ?? body.message;
    const systemInstruction = body.systemInstruction;
    const conversationHistory = body.conversationHistory ?? body.history;
    const requestedModelId = body.modelId;
    const requestedProviderId = body.providerId;
    const temperature = body.temperature;
    const maxTokens = body.maxTokens;

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let selectedModelId = typeof requestedModelId === 'string' ? requestedModelId : '';
    let selectedProviderId = typeof requestedProviderId === 'string' ? requestedProviderId : '';
    let startedAt = 0;
    try {
      let provider;
      if (!selectedProviderId || selectedProviderId === 'auto') {
        const normalizedPrompt = prompt.toLowerCase();
        const task = /(research|sources|cite|citation|evidence|web search)/.test(normalizedPrompt)
          ? 'research'
          : /(write code|debug|typescript|javascript|python|implement|refactor|compile error)/.test(normalizedPrompt)
            ? 'coding'
            : /(reason through|proof|derive|complex analysis|compare trade-offs)/.test(normalizedPrompt)
              ? 'reasoning'
              : 'chat';
        const routed = providerRegistry.routeForTask(task);
        provider = routed.provider;
        selectedProviderId = provider.id;
        selectedModelId = routed.model.id;
      } else {
        provider = providerRegistry.getProvider(selectedProviderId);
      }

      if (!provider.isConfigured()) {
        return res.status(503).json({ error: \`The selected AI provider (\${provider.id}) is not configured on the server.\` });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      startedAt = Date.now();

      await provider.stream(
        { prompt, systemInstruction, conversationHistory, modelId: selectedModelId, temperature, maxTokens },
        (chunk) => { res.write(\`data: \${JSON.stringify({ chunk })}\\n\\n\`); }
      );

      modelRoutingTelemetry.record(selectedModelId || selectedProviderId || provider.id, true, Date.now() - startedAt);
      res.write(\`data: \${JSON.stringify({ done: true, provider: selectedProviderId, modelId: selectedModelId || undefined })}\\n\\n\`);
      res.end();
    } catch (err) {
      if (startedAt > 0) modelRoutingTelemetry.record(selectedModelId || selectedProviderId || 'unknown', false, Date.now() - startedAt);
      console.error('[API /api/ai/stream Error]', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (!res.headersSent) {
        res.status(503).json({ error: msg });
        return;
      }
      res.write(\`data: \${JSON.stringify({ error: msg, done: true })}\\n\\n\`);
      res.end();
    }
  });

  // Single-Shot Generation
  app.post(['/api/ai/generate', '/api/chat/generate'], async (req: Request, res: Response) => {
    const { prompt, systemInstruction, conversationHistory, modelId, providerId, temperature, maxTokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      if (!provider.isConfigured()) {
        return res.status(503).json({
          error: `The selected AI provider (${provider.id}) is not configured on the server. Add its API key to the Vercel Production environment and redeploy.`,
        });
      }
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
  app.post('/api/ai/structured', async (req: Request, res: Response) => {
    const { prompt, systemInstruction, conversationHistory, jsonSchema, schemaName, modelId, providerId, temperature } = req.body;

    if (!prompt || !jsonSchema) {
      return res.status(400).json({ error: 'Prompt and jsonSchema are required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      if (!provider.isConfigured()) {
        return res.status(503).json({
          error: `The selected AI provider (${provider.id}) is not configured on the server. Add its API key to the Vercel Production environment and redeploy.`,
        });
      }
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
  app.post('/api/ai/tool-call', async (req: Request, res: Response) => {
    const { prompt, systemInstruction, conversationHistory, tools, modelId, providerId, temperature } = req.body;

    if (!prompt || !tools || !Array.isArray(tools)) {
      return res.status(400).json({ error: 'Prompt and tools array are required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      if (!provider.isConfigured()) {
        return res.status(503).json({
          error: `The selected AI provider (${provider.id}) is not configured on the server. Add its API key to the Vercel Production environment and redeploy.`,
        });
      }
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
  app.post(['/api/ai/vision', '/api/visual/inspect'], async (req: Request, res: Response) => {
    const { base64Data, mimeType, prompt, modelId, providerId, systemInstruction } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data image frame is required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      if (!provider.isConfigured()) {
        return res.status(503).json({
          error: `The selected AI provider (${provider.id}) is not configured on the server. Add its API key to the Vercel Production environment and redeploy.`,
        });
      }
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
  app.post('/api/ai/embeddings', async (req: Request, res: Response) => {
    const { texts, modelId, providerId } = req.body;

    if (!texts) {
      return res.status(400).json({ error: 'texts string or array is required' });
    }

    try {
      const provider = providerRegistry.getProvider(providerId);
      if (!provider.isConfigured()) {
        return res.status(503).json({
          error: `The selected AI provider (${provider.id}) is not configured on the server. Add its API key to the Vercel Production environment and redeploy.`,
        });
      }
      const embeddings = await provider.embeddings(texts);
      res.json({ embeddings, count: embeddings.length });
    } catch (err) {
      console.error('[API /api/ai/embeddings Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Agent Lab 9-Step Execution Pipeline
  app.post('/api/agent/execute', async (req: Request, res: Response) => {
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

    try {
      const result = await executeAgentPipeline({
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
  // Durable background agent jobs. User endpoints verify the Supabase bearer token;
  // worker endpoint requires a separate server-only CRON_SECRET and service-role credentials.
  const authenticateJobUser = async (req: Request, res: Response): Promise<{ id: string; email?: string } | null> => {
    const authorization = req.headers.authorization;
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    if (!token) { res.status(401).json({ error: 'Sign in to manage background jobs.' }); return null; }
    const supabase = getSupabaseClient();
    if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(503).json({ error: 'Durable background jobs require server-side Supabase service-role configuration.' });
      return null;
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) { res.status(401).json({ error: 'Your session could not be verified.' }); return null; }
    return { id: data.user.id, email: data.user.email };
  };

  // Private, owner-scoped research workspace and editable artifact APIs.
  app.post('/api/research', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const query = req.body?.query;
    const followUpQueries = req.body?.followUpQueries;
    if (typeof query !== 'string' || !query.trim() || query.length > 500) {
      return res.status(400).json({ error: 'A research question of 1–500 characters is required.' });
    }
    if (followUpQueries !== undefined && (!Array.isArray(followUpQueries) || followUpQueries.length > 3 || followUpQueries.some((item: unknown) => typeof item !== 'string'))) {
      return res.status(400).json({ error: 'followUpQueries must be an array of at most three strings.' });
    }
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Research persistence requires Supabase configuration.' });
    try {
      const report = await runGroundedResearch(query, followUpQueries || []);
      const { data, error } = await supabase.from('angel_research_reports').insert({
        user_id: user.id,
        title: report.title || 'Research report',
        query: report.query,
        status: report.status,
        report,
      }).select('id,title,query,status,report,created_at,updated_at').single();
      if (error || !data) {
        console.error('[Research] Report persistence failed:', error?.message || 'No row returned');
        return res.status(503).json({ error: 'The research ran, but could not be saved. Confirm the research/artifact migration has been applied to this Supabase project.' });
      }
      return res.status(201).json(data);
    } catch (error) {
      console.error('[Research] Request failed:', error instanceof Error ? error.message : 'Unknown error');
      return res.status(502).json({ error: 'Research could not be completed. Check grounded-search configuration and try again.' });
    }
  });

  app.get('/api/research/reports', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Research persistence requires Supabase configuration.' });
    const rawLimit = Number(req.query.limit || 25);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, Math.floor(rawLimit))) : 25;
    const { data, error } = await supabase.from('angel_research_reports')
      .select('id,title,query,status,created_at,updated_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit);
    if (error) {
      console.error('[Research] Report list failed:', error.message);
      return res.status(503).json({ error: 'Could not load saved reports. Confirm the research/artifact migration is applied.' });
    }
    return res.json({ reports: data || [] });
  });

  app.get('/api/research/reports/:id', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Research persistence requires Supabase configuration.' });
    const { data, error } = await supabase.from('angel_research_reports')
      .select('id,title,query,status,report,created_at,updated_at')
      .eq('user_id', user.id).eq('id', req.params.id).maybeSingle();
    if (error) {
      console.error('[Research] Report retrieval failed:', error.message);
      return res.status(503).json({ error: 'Could not open saved report.' });
    }
    if (!data) return res.status(404).json({ error: 'Research report not found.' });
    return res.json(data);
  });

  app.delete('/api/research/reports/:id', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Research persistence requires Supabase configuration.' });
    const { data, error } = await supabase.from('angel_research_reports').delete()
      .eq('user_id', user.id).eq('id', req.params.id).select('id');
    if (error) {
      console.error('[Research] Report deletion failed:', error.message);
      return res.status(503).json({ error: 'Could not delete the report.' });
    }
    if (!data?.length) return res.status(404).json({ error: 'Research report not found.' });
    return res.status(204).end();
  });

  app.get('/api/artifacts', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Artifact persistence requires Supabase configuration.' });
    const rawLimit = Number(req.query.limit || 50);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, Math.floor(rawLimit))) : 50;
    const { data, error } = await supabase.from('angel_work_artifacts').select('*')
      .eq('user_id', user.id).order('updated_at', { ascending: false }).limit(limit);
    if (error) {
      console.error('[Artifacts] List failed:', error.message);
      return res.status(503).json({ error: 'Could not load artifacts. Confirm the research/artifact migration is applied.' });
    }
    return res.json({ artifacts: data || [] });
  });

  app.post('/api/artifacts', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const body = req.body || {};
    const validKinds = ['document', 'code', 'plan', 'media', 'research'];
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 ||
        typeof body.kind !== 'string' || !validKinds.includes(body.kind) ||
        typeof (body.content ?? '') !== 'string' || (body.content ?? '').length > 2_000_000 ||
        (body.assetUrl !== undefined && typeof body.assetUrl !== 'string')) {
      return res.status(400).json({ error: 'Provide title, a supported kind, content up to 2 MB, and an optional asset URL.' });
    }
    if (body.assetUrl) {
      try {
        const url = new URL(body.assetUrl);
        if (!['https:', 'http:'].includes(url.protocol)) return res.status(400).json({ error: 'assetUrl must use HTTP or HTTPS.' });
      } catch {
        return res.status(400).json({ error: 'assetUrl must be a valid HTTP or HTTPS URL.' });
      }
    }
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Artifact persistence requires Supabase configuration.' });
    const { data, error } = await supabase.from('angel_work_artifacts').insert({
      user_id: user.id,
      title: body.title.trim(),
      kind: body.kind,
      content: body.content || '',
      project_id: typeof body.projectId === 'string' ? body.projectId.slice(0, 128) : null,
      asset_url: body.assetUrl || null,
      mime_type: typeof body.mimeType === 'string' ? body.mimeType.slice(0, 120) : null,
      metadata: body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {},
    }).select('*').single();
    if (error || !data) {
      console.error('[Artifacts] Create failed:', error?.message || 'No row returned');
      return res.status(503).json({ error: 'Could not save the artifact. Confirm the research/artifact migration is applied.' });
    }
    return res.status(201).json(data);
  });

  app.get('/api/artifacts/:id', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Artifact persistence requires Supabase configuration.' });
    const { data, error } = await supabase.from('angel_work_artifacts').select('*')
      .eq('user_id', user.id).eq('id', req.params.id).maybeSingle();
    if (error) return res.status(503).json({ error: 'Could not open the artifact.' });
    if (!data) return res.status(404).json({ error: 'Artifact not found.' });
    return res.json(data);
  });

  app.patch('/api/artifacts/:id', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Artifact persistence requires Supabase configuration.' });
    const { data: existing, error: readError } = await supabase.from('angel_work_artifacts').select('id,version')
      .eq('user_id', user.id).eq('id', req.params.id).maybeSingle();
    if (readError) return res.status(503).json({ error: 'Could not verify artifact ownership.' });
    if (!existing) return res.status(404).json({ error: 'Artifact not found.' });
    const body = req.body || {};
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), version: existing.version + 1 };
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200) return res.status(400).json({ error: 'title must be 1–200 characters.' });
      patch.title = body.title.trim();
    }
    if (body.content !== undefined) {
      if (typeof body.content !== 'string' || body.content.length > 2_000_000) return res.status(400).json({ error: 'content must be a string up to 2 MB.' });
      patch.content = body.content;
    }
    if (body.metadata !== undefined) {
      if (!body.metadata || typeof body.metadata !== 'object' || Array.isArray(body.metadata)) return res.status(400).json({ error: 'metadata must be an object.' });
      patch.metadata = body.metadata;
    }
    const { data, error } = await supabase.from('angel_work_artifacts').update(patch)
      .eq('user_id', user.id).eq('id', req.params.id).select('*').single();
    if (error || !data) {
      console.error('[Artifacts] Update failed:', error?.message || 'No row returned');
      return res.status(503).json({ error: 'Could not update artifact.' });
    }
    return res.json(data);
  });

  app.delete('/api/artifacts/:id', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Artifact persistence requires Supabase configuration.' });
    const { data, error } = await supabase.from('angel_work_artifacts').delete()
      .eq('user_id', user.id).eq('id', req.params.id).select('id');
    if (error) return res.status(503).json({ error: 'Could not delete artifact.' });
    if (!data?.length) return res.status(404).json({ error: 'Artifact not found.' });
    return res.status(204).end();
  });

  app.post('/api/jobs', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const body = req.body as { kind?: unknown; title?: unknown; taskPrompt?: unknown; agentName?: unknown; systemInstructions?: unknown; modelConfig?: unknown; context?: unknown };
    if (body.kind !== 'agent_execution' || typeof body.taskPrompt !== 'string' || !body.taskPrompt.trim() || body.taskPrompt.length > 20000) {
      return res.status(400).json({ error: 'Provide kind=agent_execution and a taskPrompt between 1 and 20,000 characters.' });
    }
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Supabase is not configured.' });
    const input = {
      taskPrompt: body.taskPrompt.trim(),
      agentName: typeof body.agentName === 'string' ? body.agentName.slice(0, 120) : 'Angel',
      systemInstructions: typeof body.systemInstructions === 'string' ? body.systemInstructions.slice(0, 12000) : 'Complete the user request carefully. Be honest about uncertainty and tool limitations.',
      modelConfig: body.modelConfig && typeof body.modelConfig === 'object' ? body.modelConfig : {},
      context: body.context && typeof body.context === 'object' ? body.context : {},
    };
    const { data, error } = await supabase.from('angel_background_jobs').insert({
      user_id: user.id,
      kind: 'agent_execution',
      title: typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 160) : input.taskPrompt.slice(0, 100),
      input,
      status: 'queued',
    }).select('id,kind,title,status,created_at').single();
    if (error || !data) return res.status(500).json({ error: 'Could not queue the background job.', detail: error?.message });
    return res.status(202).json({ job: data, message: 'Queued. The job will run when the background worker is scheduled.' });
  });

  app.get('/api/jobs', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Supabase is not configured.' });
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const { data, error } = await supabase.from('angel_background_jobs')
      .select('id,kind,title,status,result,error,created_at,started_at,finished_at,updated_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit);
    if (error) return res.status(500).json({ error: 'Could not load background jobs.', detail: error.message });
    return res.json({ jobs: data || [] });
  });

  app.post('/api/jobs/:id/cancel', async (req: Request, res: Response) => {
    const user = await authenticateJobUser(req, res);
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Supabase is not configured.' });
    const { data, error } = await supabase.from('angel_background_jobs')
      .update({ status: 'cancelled', finished_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', req.params.id).eq('user_id', user.id).eq('status', 'queued')
      .select('id,status').maybeSingle();
    if (error) return res.status(500).json({ error: 'Could not cancel the background job.', detail: error.message });
    if (!data) return res.status(409).json({ error: 'The job was not found, is already running, or has already finished.' });
    return res.json({ job: data });
  });

  app.all('/api/jobs/worker', async (req: Request, res: Response) => {
    const expected = process.env.CRON_SECRET || '';
    const presented = typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : '';
    if (!expected || !presented || !crypto.timingSafeEqual(crypto.createHash('sha256').update(expected).digest(), crypto.createHash('sha256').update(presented).digest())) {
      return res.status(401).json({ error: 'A valid server-only CRON_SECRET is required.' });
    }
    const supabase = getSupabaseClient();
    if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({ error: 'The background worker requires SUPABASE_SERVICE_ROLE_KEY.' });
    }
    const { data: jobs, error } = await supabase.rpc('claim_angel_background_jobs', { p_limit: 3 });
    if (error) return res.status(500).json({ error: 'Could not claim queued jobs.', detail: error.message });
    const results: Array<{ id: string; status: string }> = [];
    for (const job of (jobs || []) as Array<{ id: string; user_id: string; input: Record<string, unknown> }>) {
      try {
        const input = job.input || {};
        const result = await executeAgentPipeline({
          agentId: 'background-agent',
          agentName: typeof input.agentName === 'string' ? input.agentName : 'Angel',
          systemInstructions: typeof input.systemInstructions === 'string' ? input.systemInstructions : 'Complete the user request carefully and report limitations honestly.',
          taskPrompt: typeof input.taskPrompt === 'string' ? input.taskPrompt : '',
          modelConfig: input.modelConfig && typeof input.modelConfig === 'object' ? input.modelConfig as any : undefined,
          context: input.context && typeof input.context === 'object' ? input.context as any : undefined,
          allowedTools: [],
          permissions: [],
          memoryAccess: { canRead: false, canWrite: false, types: [] },
        });
        const status = result.status === 'completed' ? 'completed' : 'failed';
        const { error: saveError } = await supabase.from('angel_background_jobs').update({
          status,
          result: { output: result.output, executionId: result.executionId, toolsExecuted: result.toolsExecuted, logs: result.logs },
          error: result.error || null,
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', job.id).eq('status', 'running');
        if (saveError) throw saveError;
        results.push({ id: job.id, status });
      } catch (jobError) {
        const message = jobError instanceof Error ? jobError.message : 'Background execution failed.';
        await supabase.from('angel_background_jobs').update({
          status: 'failed', error: message.slice(0, 2000), finished_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq('id', job.id).eq('status', 'running');
        results.push({ id: job.id, status: 'failed' });
      }
    }
    return res.json({ processed: results.length, jobs: results });
  });

  app.post('/api/automation/dispatch', async (req: Request, res: Response) => {
    const { event, data, overrideUrl, callbackUrl } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'event type is required' });
    }

    try {
      const result = await automationService.dispatchEvent(
        event as AutomationEventType,
        data || {},
        { overrideUrl, callbackUrl }
      );
      res.json(result);
    } catch (err) {
      console.error('[Automation Dispatch Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Automation Delivery Telemetry & History
  app.get('/api/automation/history', async (_req: Request, res: Response) => {
    try {
      const history = await automationService.getRecentDeliveryHistory(50);
      res.json({
        history,
        totalCount: history.length,
        timestamp: new Date().toISOString(),
        durable: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      });
    } catch (err) {
      res.status(500).json({ error: 'Unable to read webhook delivery history.' });
    }
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
    console.log(`[Angel Inbound Webhook Received] Event: ${event}`, data);

    // If caller provided a callbackUrl, report asynchronous receipt acknowledgment
    if (callbackUrl && typeof callbackUrl === 'string' && isAllowedCallbackUrl(callbackUrl)) {
      fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'acknowledged',
          event,
          receivedAt: new Date().toISOString(),
          source: 'angel-ai-workspace',
        }),
      }).catch((e) => console.warn('[Callback Notification Failed]', e));
    }

    res.json({
      received: true,
      event: event || 'custom.event',
      authorized: true,
      callbackAttempted: Boolean(callbackUrl && typeof callbackUrl === 'string' && isAllowedCallbackUrl(callbackUrl)),
      timestamp: new Date().toISOString(),
    });
  });

  // Trigger Test Webhook Outbound
  app.post('/api/webhooks/test-dispatch', requireVerifiedAdminSession, async (req: Request, res: Response) => {
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

  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Serverless fallback authentication is not durable. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY and use Supabase Auth.' });
    }
    try {
      const { email, password, name } = req.body || {};
      const result = await authService.signUp(email, password, name);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/auth/signin', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Serverless fallback authentication is not durable. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY and use Supabase Auth.' });
    }
    try {
      const { email, password } = req.body || {};
      const result = await authService.signIn(email, password);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(401).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/auth/signout', (req: Request, res: Response) => {
    const token = req.headers.authorization;
    authService.signOut(token);
    res.json({ success: true, message: 'Signed out successfully' });
  });

  app.get('/api/auth/session', (req: Request, res: Response) => {
    const token = req.headers.authorization;
    const user = authService.authenticateToken(token);
    if (!user) {
      return res.status(401).json({ authenticated: false, error: 'Session expired or invalid' });
    }
    res.json({ authenticated: true, profile: authService.toProfileDTO(user) });
  });

  app.post('/api/auth/recovery', (req: Request, res: Response) => {
    const { email } = req.body || {};
    const result = authService.requestRecovery(email);
    res.json(result);
  });

  app.put('/api/auth/profile', (req: Request, res: Response) => {
    const token = req.headers.authorization;
    const user = authService.authenticateToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const updated = authService.updateProfile(user.id, req.body || {});
      res.json({ success: true, profile: updated });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/user/cloud-data', (req: Request, res: Response) => {
    const token = req.headers.authorization;
    const user = authService.authenticateToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Sign in required for cloud persistence' });
    }
    const data = authService.getUserCloudData(user.id);
    res.json({ success: true, data });
  });

  app.post('/api/user/cloud-data', (req: Request, res: Response) => {
    const token = req.headers.authorization;
    const user = authService.authenticateToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Sign in required for cloud persistence' });
    }
    const data = authService.saveUserCloudData(user.id, req.body || {});
    res.json({ success: true, data });
  });

  // ============================================================================
  // MEDIA STUDIO & GENERATION ENGINE
  // ============================================================================

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

  app.post('/api/media/generate-image', async (req: Request, res: Response) => {
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

  app.post('/api/media/generate-video', async (req: Request, res: Response) => {
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

  app.post('/api/media/edit', async (req: Request, res: Response) => {
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
  // VOICE & AUDIO INTELLIGENCE
  // ============================================================================

  app.post('/api/voice/transcribe', async (req: Request, res: Response) => {
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

  app.post('/api/voice/tts', async (req: Request, res: Response) => {
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
