export type SystemLogLevel = 'info' | 'warn' | 'error';

export interface SystemLogEvent {
  id: string;
  at: string;
  level: SystemLogLevel;
  category: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
}

const MAX_EVENTS = 200;
const startedAt = Date.now();
const events: SystemLogEvent[] = [];
let requestCount = 0;
let errorRequestCount = 0;
let cumulativeDurationMs = 0;
let lastRequestAt: string | null = null;
const statusCounts: Record<string, number> = {};

function safeMessage(value: string): string {
  return value
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/(?:sk|pk|rk|sb_secret|sb_publishable)_[A-Za-z0-9_-]{8,}/gi, '[credential redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]')
    .slice(0, 240);
}

function addEvent(level: SystemLogLevel, category: string, message: string, metadata?: Record<string, string | number | boolean>) {
  events.push({
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    level,
    category: safeMessage(category).slice(0, 40),
    message: safeMessage(message),
    ...(metadata ? { metadata } : {}),
  });
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
}

export function recordSystemEvent(
  category: string,
  level: SystemLogLevel,
  message: string,
  metadata?: Record<string, string | number | boolean>,
): void {
  addEvent(level, category, message, metadata);
}

/** Request middleware reports route templates and aggregate timings only, never headers or request bodies. */
export function recordSystemRequest(method: string, route: string, statusCode: number, durationMs: number): void {
  requestCount += 1;
  cumulativeDurationMs += Math.max(0, durationMs);
  lastRequestAt = new Date().toISOString();
  const bucket = String(Math.floor(statusCode / 100)) + 'xx';
  statusCounts[bucket] = (statusCounts[bucket] || 0) + 1;
  if (statusCode >= 400) errorRequestCount += 1;
  if (statusCode >= 500) {
    addEvent('error', 'http', 'API request returned a server error', {
      method: safeMessage(method).slice(0, 8),
      route: safeMessage(route).slice(0, 90),
      statusCode,
    });
  }
}

export function getSystemDiagnostics() {
  return {
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
    requestCount,
    errorRequestCount,
    averageRequestDurationMs: requestCount ? Math.round(cumulativeDurationMs / requestCount) : 0,
    statusCounts: { ...statusCounts },
    lastRequestAt,
    recentEventCount: events.length,
    capacity: MAX_EVENTS,
  };
}

export function getRecentSystemEvents(limit = 50) {
  const take = Number.isFinite(limit) ? Math.min(MAX_EVENTS, Math.max(1, Math.floor(limit))) : 50;
  return events.slice(-take).reverse();
}
