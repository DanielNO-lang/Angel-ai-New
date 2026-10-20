import crypto from 'crypto';
import { getSupabaseClient } from '../supabase_service.js';

export interface AdminAuditEventInput {
  userId: string;
  email: string;
  method: string;
  route: string;
  statusCode: number;
  requestId?: string;
  ip?: string;
}

/**
 * Best-effort durable audit logging for privileged integration routes.
 * Never persist request bodies, access tokens, secrets, or raw IP addresses.
 */
export async function recordAdminAuditEvent(event: AdminAuditEventInput): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const ipHash = event.ip
    ? crypto.createHash('sha256').update(event.ip).digest('hex')
    : null;

  try {
    const { error } = await supabase.from('admin_audit_events').insert({
      id: crypto.randomUUID(),
      user_id: event.userId,
      user_email: event.email.slice(0, 320),
      method: event.method.slice(0, 12),
      route: event.route.slice(0, 500),
      status_code: event.statusCode,
      request_id: event.requestId?.slice(0, 200) || null,
      ip_hash: ipHash,
    });
    if (error) console.error('[AdminAudit] Could not persist audit event:', error.message);
  } catch (error) {
    console.error('[AdminAudit] Audit persistence unavailable:', error);
  }
}
