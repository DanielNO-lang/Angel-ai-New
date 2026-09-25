/**
 * ANGEL AI — Core Full-Stack Application Server & API Engine
 * Portable, framework-standard Express server supporting:
 *  - Standard Node.js / Docker container execution (Port 3000 or $PORT)
 *  - Vercel Serverless Function compatibility (via exported createApp / api/index.ts)
 *  - Google Cloud Run & universal PaaS deployment
 *  - Full AI Provider & Tool Registry
 *  - Automation & Webhook Dispatch Architecture
 */

import express, { Express, Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { executeAgentPipeline } from './server/orchestrator';
import { providerRegistry } from './server/providers';
import { getSupabaseServerStatus } from './server/supabase_service';
import { automationService, AutomationEventType } from './server/services/automationService';
import { dispatchZapierEvent } from './server/zapier_service';

export interface CreateAppOptions {
  isServerless?: boolean;
}

export async function createApp(options: CreateAppOptions = {}): Promise<Express> {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

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
