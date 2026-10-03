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
import { createServer as createViteServer } from 'vite';
import { executeAgentPipeline } from './server/orchestrator';
import { providerRegistry } from './server/providers';
import { getSupabaseServerStatus, getTasksVelocity, syncTasksToSupabase, syncAllEntitiesToSupabase, getSupabaseDDL } from './server/supabase_service';
import { automationService, AutomationEventType } from './server/services/automationService';
import { dispatchZapierEvent } from './server/zapier_service';
import { authService } from './server/services/authService';
import { mediaService } from './server/services/mediaService';
import { voiceService } from './server/services/voiceService';
import { intelligenceService } from './server/services/intelligenceService';
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

  app.post('/api/supabase/sync', async (req: Request, res: Response) => {
    try {
      const { tasks } = req.body || {};
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: 'tasks array is required' });
      }
      const result = await syncTasksToSupabase(tasks);
      res.json(result);
    } catch (err) {
      console.error('[API /api/supabase/sync Error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/supabase/sync-all', async (req: Request, res: Response) => {
    try {
      const result = await syncAllEntitiesToSupabase(req.body || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/supabase/ddl', (_req: Request, res: Response) => {
    res.type('text/plain').send(getSupabaseDDL());
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
  app.post(['/api/ai/generate', '/api/chat/generate'], async (req: Request, res: Response) => {
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
  app.post('/api/ai/structured', async (req: Request, res: Response) => {
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
  app.post('/api/ai/tool-call', async (req: Request, res: Response) => {
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
  app.post(['/api/ai/vision', '/api/visual/inspect'], async (req: Request, res: Response) => {
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
  app.post('/api/ai/embeddings', async (req: Request, res: Response) => {
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
  app.get('/api/automation/history', (req: Request, res: Response) => {
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
    console.log(`[Angel Inbound Webhook Received] Event: ${event}`, data);

    // If caller provided a callbackUrl, report asynchronous receipt acknowledgment
    if (callbackUrl && typeof callbackUrl === 'string') {
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
      timestamp: new Date().toISOString(),
    });
  });

  // Trigger Test Webhook Outbound
  app.post('/api/webhooks/test-dispatch', async (req: Request, res: Response) => {
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
    try {
      const { email, password, name } = req.body || {};
      const result = await authService.signUp(email, password, name);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/auth/signin', async (req: Request, res: Response) => {
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
