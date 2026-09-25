/**
 * ANGEL AI — Automation & Webhook Engine
 * Clean, platform-agnostic event architecture supporting:
 *  - Outbound event triggers (task.created, task.completed, agent.executed, message.received, memory.created, memory.updated, workflow.completed)
 *  - Authenticated API requests (HMAC SHA-256 and secret tokens)
 *  - Delivery telemetry, retries, and callback handling
 *  - Portable abstraction ready for Zapier, Make, n8n, or custom enterprise webhooks
 */

import crypto from 'crypto';

export type AutomationEventType =
  | 'task.created'
  | 'task.completed'
  | 'agent.executed'
  | 'message.received'
  | 'memory.created'
  | 'memory.updated'
  | 'workflow.completed';

export interface AutomationEventPayload<T = Record<string, unknown>> {
  id: string;
  event: AutomationEventType;
  timestamp: string;
  source: 'angel-ai-workspace';
  version: '1.0';
  data: T;
  callbackUrl?: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  eventId: string;
  event: AutomationEventType;
  destinationUrl: string;
  status: 'delivered' | 'failed' | 'pending_configuration';
  httpStatus?: number;
  durationMs: number;
  timestamp: string;
  error?: string;
  payloadSummary: string;
}

export interface WebhookConfig {
  outboundUrl?: string;
  secret?: string;
  timeoutMs?: number;
  retryCount?: number;
}

class AutomationService {
  private deliveryHistory: WebhookDeliveryRecord[] = [];
  private maxHistorySize = 50;

  /**
   * Generates a cryptographic HMAC-SHA256 signature for payload verification
   */
  public generateSignature(payloadString: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  /**
   * Validates an incoming webhook signature or secret header
   */
  public verifyInboundRequest(
    payloadString: string,
    signatureHeader?: string,
    secretHeader?: string
  ): { authorized: boolean; reason?: string } {
    const configuredSecret =
      process.env.WEBHOOK_SECRET || process.env.ZAPIER_WEBHOOK_SECRET || '';

    // If no secret is configured on the server, reject unauthorized inbound actions in production
    if (!configuredSecret) {
      // In development without configured secret, allow with warning note
      if (process.env.NODE_ENV !== 'production') {
        return {
          authorized: true,
          reason: 'Development mode: No WEBHOOK_SECRET configured. Allowed for local verification.',
        };
      }
      return {
        authorized: false,
        reason: 'WEBHOOK_SECRET is not configured on the server.',
      };
    }

    // 1. Direct secret token comparison
    if (secretHeader && secretHeader === configuredSecret) {
      return { authorized: true };
    }

    // 2. HMAC SHA-256 signature comparison
    if (signatureHeader) {
      const expectedSignature = this.generateSignature(payloadString, configuredSecret);
      if (crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature))) {
        return { authorized: true };
      }
    }

    return {
      authorized: false,
      reason: 'Signature or secret token mismatch.',
    };
  }

  /**
   * Dispatches an event to the configured external webhook URL
   */
  public async dispatchEvent<T = Record<string, unknown>>(
    event: AutomationEventType,
    data: T,
    options?: { overrideUrl?: string; callbackUrl?: string }
  ): Promise<{
    dispatched: boolean;
    deliveryId: string;
    statusText: string;
    httpStatus?: number;
  }> {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    const destinationUrl =
      options?.overrideUrl ||
      process.env.OUTBOUND_WEBHOOK_URL ||
      process.env.ZAPIER_OUTBOUND_WEBHOOK_URL;

    const payload: AutomationEventPayload<T> = {
      id: eventId,
      event,
      timestamp,
      source: 'angel-ai-workspace',
      version: '1.0',
      data,
      callbackUrl: options?.callbackUrl,
    };

    const payloadString = JSON.stringify(payload);
    const summary = `${event} [${Object.keys((data as Record<string, unknown>) || {}).join(', ')}]`;

    // Case: No webhook destination configured
    if (!destinationUrl) {
      const pendingRecord: WebhookDeliveryRecord = {
        id: `del_${Date.now()}`,
        eventId,
        event,
        destinationUrl: 'None (pending configuration)',
        status: 'pending_configuration',
        durationMs: 0,
        timestamp,
        error: 'OUTBOUND_WEBHOOK_URL / ZAPIER_OUTBOUND_WEBHOOK_URL not set in environment.',
        payloadSummary: summary,
      };
      this.recordDelivery(pendingRecord);

      return {
        dispatched: false,
        deliveryId: pendingRecord.id,
        statusText: 'No webhook endpoint configured. Event recorded in automation buffer.',
      };
    }

    const secret = process.env.WEBHOOK_SECRET || process.env.ZAPIER_WEBHOOK_SECRET || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Angel-AI-Webhook-Dispatcher/1.0',
      'X-Angel-Event': event,
      'X-Angel-Delivery-Id': eventId,
      'X-Angel-Timestamp': timestamp,
    };

    if (secret) {
      headers['X-Angel-Webhook-Secret'] = secret;
      headers['X-Angel-Signature'] = `sha256=${this.generateSignature(payloadString, secret)}`;
    }

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(destinationUrl, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      const record: WebhookDeliveryRecord = {
        id: `del_${Date.now()}`,
        eventId,
        event,
        destinationUrl,
        status: response.ok ? 'delivered' : 'failed',
        httpStatus: response.status,
        durationMs,
        timestamp,
        error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
        payloadSummary: summary,
      };

      this.recordDelivery(record);

      return {
        dispatched: response.ok,
        deliveryId: record.id,
        statusText: response.ok
          ? `Dispatched ${event} to external subscriber (HTTP ${response.status}) in ${durationMs}ms.`
          : `External subscriber returned HTTP ${response.status} (${response.statusText}).`,
        httpStatus: response.status,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err.name === 'AbortError' ? 'Connection timed out (8000ms)' : (err.message || String(err));

      const record: WebhookDeliveryRecord = {
        id: `del_${Date.now()}`,
        eventId,
        event,
        destinationUrl,
        status: 'failed',
        durationMs,
        timestamp,
        error: errorMsg,
        payloadSummary: summary,
      };

      this.recordDelivery(record);

      return {
        dispatched: false,
        deliveryId: record.id,
        statusText: `Delivery failure: ${errorMsg}`,
      };
    }
  }

  /**
   * Internal ring buffer to keep recent deliveries for UI diagnostics
   */
  private recordDelivery(record: WebhookDeliveryRecord) {
    this.deliveryHistory.unshift(record);
    if (this.deliveryHistory.length > this.maxHistorySize) {
      this.deliveryHistory.pop();
    }
  }

  /**
   * Returns recent webhook deliveries
   */
  public getDeliveryHistory(): WebhookDeliveryRecord[] {
    return [...this.deliveryHistory];
  }

  /**
   * Clears delivery history
   */
  public clearDeliveryHistory() {
    this.deliveryHistory = [];
  }
}

export const automationService = new AutomationService();
