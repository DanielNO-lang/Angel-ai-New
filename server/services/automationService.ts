/**
 * ANGEL AI — Automation & Webhook Engine
 * Clean, platform-agnostic event architecture supporting:
 *  - Outbound event triggers (task.created, task.completed, agent.executed, message.received, memory.created, memory.updated, workflow.completed)
 *  - Authenticated API requests (HMAC SHA-256 and secret tokens)
 *  - Delivery telemetry, retries, and callback handling
 *  - Portable abstraction ready for Zapier, Make, n8n, or custom enterprise webhooks
 */

import crypto from 'crypto';
import { getSupabaseClient } from '../supabase_service.js';

function constantTimeStringEqual(left: string, right: string): boolean {
  // Hashing both inputs to fixed-length buffers avoids timingSafeEqual throwing
  // on unequal lengths while keeping the comparison constant-time.
  const a = crypto.createHash('sha256').update(left, 'utf8').digest();
  const b = crypto.createHash('sha256').update(right, 'utf8').digest();
  return crypto.timingSafeEqual(a, b);
}

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

    // 1. Direct secret token comparison; tolerate standard Authorization syntax.
    if (secretHeader) {
      const presented = secretHeader.replace(/^Bearer\s+/i, '').trim();
      if (presented && constantTimeStringEqual(presented, configuredSecret)) {
        return { authorized: true };
      }
    }

    // 2. HMAC SHA-256 signature comparison. Accept prefixed or bare hex signatures.
    if (signatureHeader) {
      const presented = signatureHeader.replace(/^sha256=/i, '').trim().toLowerCase();
      const expected = this.generateSignature(payloadString, configuredSecret).toLowerCase();
      if (presented && constantTimeStringEqual(presented, expected)) {
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
    // Never let an unauthenticated request choose an arbitrary outbound destination.
    // Per-request override URLs are intentionally ignored; configure the destination server-side.
    const destinationUrl =
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
      await this.recordDelivery(pendingRecord);

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
        destinationUrl: this.destinationHost(destinationUrl),
        status: response.ok ? 'delivered' : 'failed',
        httpStatus: response.status,
        durationMs,
        timestamp,
        error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
        payloadSummary: summary,
      };

      await this.recordDelivery(record);

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
        destinationUrl: this.destinationHost(destinationUrl),
        status: 'failed',
        durationMs,
        timestamp,
        error: errorMsg,
        payloadSummary: summary,
      };

      await this.recordDelivery(record);

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
  private async recordDelivery(record: WebhookDeliveryRecord): Promise<void> {
    this.deliveryHistory.unshift(record);
    if (this.deliveryHistory.length > this.maxHistorySize) this.deliveryHistory.pop();

    // The delivery ledger is durable in production. Never store full webhook URLs,
    // query strings, or payloads because they can contain credentials or personal data.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      const destinationHost = this.destinationHost(record.destinationUrl);
      const { error } = await supabase.from('webhook_deliveries').upsert({
        id: record.id,
        event_id: record.eventId,
        event: record.event,
        destination_host: destinationHost,
        status: record.status,
        http_status: record.httpStatus ?? null,
        duration_ms: record.durationMs,
        timestamp: record.timestamp,
        error: record.error ?? null,
        payload_summary: record.payloadSummary,
      }, { onConflict: 'id' });
      if (error) console.error('[Automation] Could not persist delivery history:', error.message);
    } catch (error) {
      console.error('[Automation] Durable delivery history unavailable:', error);
    }
  }

  private destinationHost(value: string): string {
    try {
      return new URL(value).hostname.slice(0, 255);
    } catch {
      return 'unconfigured';
    }
  }

  /**
   * Returns recent webhook deliveries from durable storage where configured.
   */
  public async getRecentDeliveryHistory(limit = 50): Promise<WebhookDeliveryRecord[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('webhook_deliveries')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(safeLimit);
          if (!error && Array.isArray(data)) {
            return data.map((row: any) => ({
              id: row.id,
              eventId: row.event_id,
              event: row.event,
              destinationUrl: row.destination_host || 'unknown',
              status: row.status,
              httpStatus: row.http_status ?? undefined,
              durationMs: row.duration_ms ?? 0,
              timestamp: row.timestamp,
              error: row.error ?? undefined,
              payloadSummary: row.payload_summary || '',
            }));
          }
          if (error) console.error('[Automation] Could not read durable delivery history:', error.message);
        } catch (error) {
          console.error('[Automation] Durable delivery history read failed:', error);
        }
      }
    }
    return this.deliveryHistory.slice(0, safeLimit);
  }

  public getDeliveryHistory(): WebhookDeliveryRecord[] {
    return [...this.deliveryHistory];
  }

  public async clearDeliveryHistory(): Promise<void> {
    this.deliveryHistory = [];
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('webhook_deliveries').delete().neq('id', '');
    if (error) throw error;
  }
}

export const automationService = new AutomationService();
