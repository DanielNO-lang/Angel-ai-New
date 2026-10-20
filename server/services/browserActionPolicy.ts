import { isIP } from 'node:net';
export type BrowserActionKind =
  | 'navigate' | 'read_page' | 'click' | 'fill_form' | 'submit_form'
  | 'send_message' | 'download_file' | 'upload_file' | 'purchase' | 'delete' | 'manage_credentials';

export interface BrowserActionRequest {
  actionId: string;
  kind: BrowserActionKind;
  url: string;
  grantedScopes: string[];
  approvedHosts: string[];
  confirmation?: { actionId: string; host: string; approvedAt: number };
  now?: number;
}
export interface BrowserActionDecision { allowed: boolean; requiresConfirmation: boolean; host?: string; reason?: string; }

const requiredScope: Record<BrowserActionKind, string> = {
  navigate: 'browser:read', read_page: 'browser:read', click: 'browser:interact',
  fill_form: 'browser:interact', submit_form: 'browser:submit', send_message: 'browser:submit',
  download_file: 'browser:download', upload_file: 'browser:upload', purchase: 'browser:purchase',
  delete: 'browser:delete', manage_credentials: 'browser:credentials',
};
const confirmationRequired = new Set<BrowserActionKind>([
  'submit_form', 'send_message', 'download_file', 'upload_file', 'purchase', 'delete', 'manage_credentials',
]);
function isPrivateIpv4(host: string): boolean {
  const octets = host.split('.');
  if (octets.length !== 4 || octets.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return false;
  const [a, b] = octets.map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || a >= 224;
}
/** Exact host allowlist by design; wildcard and suffix matching are deliberately not supported. */
export function validateApprovedBrowserUrl(rawUrl: string, approvedHosts: string[]): { allowed: boolean; host?: string; reason?: string } {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return { allowed: false, reason: 'The browser target is not a valid URL.' }; }
  if (url.protocol !== 'https:' || url.username || url.password) {
    return { allowed: false, reason: 'Browser automation accepts HTTPS URLs without embedded credentials.' };
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  // URL parsers may keep brackets around IPv6 literals. Block IPv6 literals
  // altogether until the browser executor can normalize and verify their
  // resolved address safely; this also closes ULA, loopback, link-local,
  // IPv4-mapped and alternative IPv6 encodings.
  const ipLiteral = host.replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      ipLiteral.includes(':') || isIP(ipLiteral) !== 0 || isPrivateIpv4(host)) {
    return { allowed: false, host, reason: 'Local, private-network, and IPv6-literal targets are not allowed in browser automation.' };
  }
  if (url.port && url.port !== '443') return { allowed: false, reason: 'Non-standard browser target ports are not allowed.' };
  const allowedHosts = new Set(approvedHosts.map((item) => item.trim().toLowerCase().replace(/\.$/, '')).filter(Boolean));
  if (!allowedHosts.has(host)) return { allowed: false, host, reason: 'This host has not been approved for browser automation.' };
  return { allowed: true, host };
}
export function evaluateBrowserAction(request: BrowserActionRequest): BrowserActionDecision {
  const target = validateApprovedBrowserUrl(request.url, request.approvedHosts);
  if (!target.allowed) return { allowed: false, requiresConfirmation: false, host: target.host, reason: target.reason };
  const scope = requiredScope[request.kind];
  if (!request.grantedScopes.includes(scope)) {
    return { allowed: false, requiresConfirmation: false, host: target.host, reason: 'The action requires the explicit ' + scope + ' permission.' };
  }
  const needsConfirmation = confirmationRequired.has(request.kind);
  if (!needsConfirmation) return { allowed: true, requiresConfirmation: false, host: target.host };
  const approval = request.confirmation;
  const now = request.now ?? Date.now();
  const confirmed = approval && approval.actionId === request.actionId &&
    approval.host.toLowerCase() === target.host && Number.isFinite(approval.approvedAt) &&
    approval.approvedAt <= now && now - approval.approvedAt <= 5 * 60 * 1000;
  if (!confirmed) return { allowed: false, requiresConfirmation: true, host: target.host, reason: 'This consequential action needs recent user confirmation for the exact action and host.' };
  return { allowed: true, requiresConfirmation: true, host: target.host };
}
