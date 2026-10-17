import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface WebPushConfiguration {
  configured: boolean;
  publicKey?: string;
  reason?: string;
}

export type TaskPushOutcome = 'completed' | 'failed';

export function getWebPushConfiguration(): WebPushConfiguration {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || '';
  if (!publicKey || !privateKey || !subject) {
    return { configured: false, reason: 'Background push notifications are not configured on the server yet.' };
  }
  if (!/^[A-Za-z0-9_-]{80,100}$/.test(publicKey) || !/^[A-Za-z0-9_-]{40,60}$/.test(privateKey)) {
    return { configured: false, reason: 'The server VAPID keys are malformed. Regenerate a valid Web Push key pair.' };
  }
  if (!(subject.startsWith('mailto:') || subject.startsWith('https://'))) {
    return { configured: false, reason: 'VAPID_SUBJECT must be a mailto: address or HTTPS URL.' };
  }
  try {
    if (subject.startsWith('https://')) new URL(subject);
  } catch {
    return { configured: false, reason: 'VAPID_SUBJECT is not a valid HTTPS URL.' };
  }
  return { configured: true, publicKey };
}

let configuredSignature = '';

function configureWebPush(): boolean {
  const status = getWebPushConfiguration();
  if (!status.configured || !status.publicKey) return false;
  const signature = [status.publicKey, process.env.VAPID_PRIVATE_KEY || '', process.env.VAPID_SUBJECT || ''].join('|');
  if (signature !== configuredSignature) {
    try {
      webpush.setVapidDetails(process.env.VAPID_SUBJECT!, status.publicKey, process.env.VAPID_PRIVATE_KEY!);
      configuredSignature = signature;
    } catch {
      configuredSignature = '';
      return false;
    }
  }
  return true;
}

function safeNotificationText(value: string, maxLength = 110): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export async function getPushSubscriptionCount(supabase: SupabaseClient, userId: string): Promise<{ count: number | null; error?: string }> {
  const { count, error } = await supabase.from('angel_push_subscriptions')
    .select('id', { count: 'exact', head: true }).eq('user_id', userId);
  if (error) return { count: null, error: 'Push subscription storage is unavailable. Confirm the web-push migration was applied.' };
  return { count: count || 0 };
}

/** Sends minimal, non-sensitive task-status messages and purges expired endpoints. */
export async function sendTaskPushNotification(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  jobTitle: string,
  outcome: TaskPushOutcome,
): Promise<{ configured: boolean; sent: number; removed: number; reason?: string }> {
  if (!configureWebPush()) {
    const status = getWebPushConfiguration();
    return { configured: false, sent: 0, removed: 0, reason: status.reason || 'Web Push is not configured.' };
  }

  const { data, error } = await supabase.from('angel_push_subscriptions')
    .select('id,subscription').eq('user_id', userId).limit(50);
  if (error) {
    console.warn('[Web Push] Subscription lookup failed:', error.message);
    return { configured: true, sent: 0, removed: 0, reason: 'Could not load push subscriptions.' };
  }

  let sent = 0;
  let removed = 0;
  const title = outcome === 'completed' ? 'Angel task completed' : 'Angel task needs attention';
  const label = safeNotificationText(jobTitle || 'Background task');
  const body = outcome === 'completed'
    ? `${label} is ready. Open Angel to review the result.`
    : `${label} needs attention. Open Angel to review its status.`;
  const payload = JSON.stringify({
    title,
    body,
    tag: `angel-job-${jobId}`,
    url: '/?source=notification',
  });

  for (const row of data || []) {
    try {
      await webpush.sendNotification(row.subscription, payload, { TTL: 60, urgency: 'normal' });
      sent += 1;
    } catch (error) {
      const pushError = error as { statusCode?: number };
      if (pushError.statusCode === 404 || pushError.statusCode === 410) {
        const { error: deleteError } = await supabase.from('angel_push_subscriptions')
          .delete().eq('id', row.id).eq('user_id', userId);
        if (deleteError) console.warn('[Web Push] Expired subscription cleanup failed:', deleteError.message);
        else removed += 1;
      } else {
        // Never log the endpoint or auth keys from a push subscription.
        console.warn('[Web Push] Delivery failed with status:', Number(pushError.statusCode) || 'unknown');
      }
    }
  }

  return { configured: true, sent, removed };
}
