/**
 * ANGEL AI — Zapier & Webhook Bridge
 * Adapts legacy calls to the core AutomationService.
 */

import { automationService, AutomationEventType } from './services/automationService';

export type AngelEventType = AutomationEventType;

export interface WebhookEventPayload {
  event: AngelEventType;
  timestamp: string;
  source: 'angel-ai-workspace';
  data: Record<string, unknown>;
}

/**
 * Dispatch an outbound webhook event to the configured external webhook URL
 */
export async function dispatchZapierEvent(
  event: AngelEventType,
  data: Record<string, unknown>
): Promise<{ dispatched: boolean; statusText: string }> {
  const result = await automationService.dispatchEvent(event, data);
  return {
    dispatched: result.dispatched,
    statusText: result.statusText,
  };
}
