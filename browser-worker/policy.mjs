import net from 'node:net';
import { lookup } from 'node:dns/promises';

export function isPrivateOrReservedIpv4(address) {
  if (net.isIP(address) !== 4) return true;
  const [a,b,c] = address.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224;
}

export function isPublicResolvedAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return !isPrivateOrReservedIpv4(address);
  // Until IPv6 ranges are fully normalized by a hardened egress proxy, deny
  // IPv6 targets, including mapped/compatible representations, by default.
  return false;
}

export function validateBrowserUrl(rawUrl, approvedHosts) {
  let url;
  try { url = new URL(rawUrl); }
  catch { return { allowed: false, reason: 'Target must be a valid URL.' }; }
  if (url.protocol !== 'https:' || url.username || url.password) {
    return { allowed: false, reason: 'Only HTTPS URLs without embedded credentials are allowed.' };
  }
  if (url.port && url.port !== '443') return { allowed: false, reason: 'Only the standard HTTPS port is allowed.' };
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host.includes(':') || net.isIP(host) !== 0) {
    return { allowed: false, host, reason: 'IP literals and local/private hostnames are not allowed.' };
  }
  const hosts = new Set((Array.isArray(approvedHosts) ? approvedHosts : [])
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().toLowerCase().replace(/\.$/, '')));
  if (!hosts.has(host)) return { allowed: false, host, reason: 'Target host is not on the exact approved-host list.' };
  return { allowed: true, host, url };
}

export async function validatePublicDns(host) {
  let addresses;
  try { addresses = await lookup(host, { all: true, verbatim: true }); }
  catch { return { allowed: false, reason: 'Target DNS could not be verified; request blocked.' }; }
  if (!addresses.length || addresses.some((entry) => !isPublicResolvedAddress(entry.address))) {
    return { allowed: false, reason: 'Target resolved to a private, reserved, or unsupported address; request blocked.' };
  }
  return { allowed: true };
}

export async function validateNetworkUrl(rawUrl, approvedHosts) {
  const target = validateBrowserUrl(rawUrl, approvedHosts);
  if (!target.allowed) return target;
  const dns = await validatePublicDns(target.host);
  return dns.allowed ? target : { ...dns, host: target.host };
}
