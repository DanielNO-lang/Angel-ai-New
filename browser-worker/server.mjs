import express from 'express';
import crypto from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { validateBrowserUrl, validateNetworkUrl } from './policy.mjs';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '128kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const PORT = Math.max(1, Number(process.env.PORT) || 8787);
const WORKER_SECRET = process.env.ANGEL_BROWSER_WORKER_SECRET || '';
const SESSION_TTL_MS = Math.max(60_000, Math.min(60 * 60_000, Number(process.env.ANGEL_BROWSER_SESSION_TTL_MS) || 20 * 60_000));
const MAX_SESSIONS = Math.max(1, Math.min(100, Number(process.env.ANGEL_BROWSER_MAX_SESSIONS) || 20));
const sessions = new Map();
let browserPromise;

function isAuthorized(req) {
  const header = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!WORKER_SECRET || !token) return false;
  const expectedDigest = crypto.createHash('sha256').update(WORKER_SECRET).digest();
  const presentedDigest = crypto.createHash('sha256').update(token).digest();
  return crypto.timingSafeEqual(expectedDigest, presentedDigest);
}
function auth(req, res, next) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'A valid server-to-worker credential is required.' });
  next();
}
function cleanHosts(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20 ||
      value.some((host) => typeof host !== 'string' || host.length > 253)) return null;
  const hosts = [...new Set(value.map((host) => host.trim().toLowerCase().replace(/\.$/, '')))];
  if (hosts.some((host) => !host || host.includes('*') || host.includes('/') || host.includes(':'))) return null;
  return hosts;
}
async function getBrowser() {
  if (!browserPromise) browserPromise = chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
  }).catch((error) => { browserPromise = undefined; throw error; });
  return browserPromise;
}
async function ensureSessionRequestAllowed(route, approvedHosts) {
  const result = await validateNetworkUrl(route.request().url(), approvedHosts);
  if (!result.allowed) return route.abort('blockedbyclient');
  return route.continue();
}
async function closeSession(id) {
  const entry = sessions.get(id);
  if (!entry) return;
  sessions.delete(id);
  try { await entry.context.close(); } catch {}
}
function getSession(req, res) {
  const id = String(req.params.id || '');
  const entry = sessions.get(id);
  if (!entry) { res.status(404).json({ error: 'Browser session was not found or expired. Start a new session.' }); return null; }
  if (entry.expiresAt <= Date.now()) {
    void closeSession(id);
    res.status(410).json({ error: 'Browser session expired. Start a new session.' });
    return null;
  }
  if (typeof req.body.ownerId !== 'string' || req.body.ownerId !== entry.ownerId) {
    res.status(404).json({ error: 'Browser session was not found.' });
    return null;
  }
  const hosts = cleanHosts(req.body.approvedHosts);
  if (!hosts || hosts.some((host) => !entry.originallyGrantedHosts.includes(host))) {
    res.status(403).json({ error: 'The updated approved-host list exceeds the grants issued when this session started.' });
    return null;
  }
  entry.approvedHosts = hosts;
  entry.expiresAt = Date.now() + SESSION_TTL_MS;
  return entry;
}
function safeError(error) {
  const name = error instanceof Error ? error.name : 'Error';
  const message = error instanceof Error ? error.message : 'Unknown browser worker error.';
  return (name === 'TimeoutError' ? 'Browser action timed out.' : message).slice(0, 500);
}

app.get('/health', (_req, res) => res.json({ status: 'ok', configured: Boolean(WORKER_SECRET), activeSessions: sessions.size, maxSessions: MAX_SESSIONS }));

app.post('/v1/sessions', auth, async (req, res) => {
  const { ownerId, startUrl } = req.body || {};
  const approvedHosts = cleanHosts(req.body?.approvedHosts);
  if (typeof ownerId !== 'string' || ownerId.length < 16 || ownerId.length > 100 || !approvedHosts) {
    return res.status(400).json({ error: 'ownerId and a bounded approvedHosts list are required.' });
  }
  if (sessions.size >= MAX_SESSIONS) return res.status(429).json({ error: 'Browser worker is at its active-session limit. Close an existing session and retry.' });
  const target = await validateNetworkUrl(startUrl, approvedHosts);
  if (!target.allowed) return res.status(403).json({ error: target.reason });
  let context;
  try {
    const browser = await getBrowser();
    context = await browser.newContext({
      acceptDownloads: false,
      javaScriptEnabled: true,
      serviceWorkers: 'block',
      viewport: { width: 1280, height: 900 },
    });
    context.setDefaultTimeout(10000);
    const entry = {
      ownerId,
      context,
      page: await context.newPage(),
      approvedHosts,
      originallyGrantedHosts: [...approvedHosts],
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    await context.route('**/*', (route) => ensureSessionRequestAllowed(route, entry.approvedHosts).catch(() => route.abort('blockedbyclient')));
    await entry.page.goto(target.url.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const finalTarget = validateBrowserUrl(entry.page.url(), entry.approvedHosts);
    if (!finalTarget.allowed) throw new Error('The final page URL did not pass the approved-host check.');
    const id = crypto.randomUUID();
    sessions.set(id, entry);
    entry.page.on('close', () => { sessions.delete(id); });
    return res.status(201).json({ sessionId: id, url: entry.page.url(), title: await entry.page.title(), expiresAt: new Date(entry.expiresAt).toISOString() });
  } catch (error) {
    try { await context?.close(); } catch {}
    return res.status(502).json({ error: 'Could not start an isolated browser session.', detail: safeError(error) });
  }
});

app.post('/v1/sessions/:id/actions', auth, async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const body = req.body || {};
  if (typeof body.actionId !== 'string' || body.actionId.length > 100 || typeof body.kind !== 'string') {
    return res.status(400).json({ error: 'actionId and kind are required.' });
  }
  const page = session.page;
  try {
    if (body.kind === 'navigate') {
      const target = await validateNetworkUrl(body.url, session.approvedHosts);
      if (!target.allowed) return res.status(403).json({ error: target.reason });
      await page.goto(target.url.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const finalTarget = validateBrowserUrl(page.url(), session.approvedHosts);
      if (!finalTarget.allowed) return res.status(403).json({ error: 'Navigation ended outside the approved-host list.' });
      return res.json({ actionId: body.actionId, kind: body.kind, url: page.url(), title: await page.title(), text: (await page.locator('body').innerText({ timeout: 5000 })).slice(0, 12000) });
    }
    if (body.kind === 'read_page') {
      return res.json({ actionId: body.actionId, kind: body.kind, url: page.url(), title: await page.title(), text: (await page.locator('body').innerText({ timeout: 5000 })).slice(0, 12000) });
    }
    if (body.kind === 'screenshot') {
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 55, fullPage: false, timeout: 5000 });
      if (screenshot.length > 900_000) return res.status(413).json({ error: 'Screenshot exceeds the response size limit.' });
      return res.json({ actionId: body.actionId, kind: body.kind, url: page.url(), image: screenshot.toString('base64') });
    }
    if (body.kind === 'click' || body.kind === 'submit_form') {
      if (typeof body.selector !== 'string' || !body.selector.trim() || body.selector.length > 500) return res.status(400).json({ error: 'A selector between 1 and 500 characters is required.' });
      await page.locator(body.selector).first().click({ timeout: 10000 });
      await delay(250);
      return res.json({ actionId: body.actionId, kind: body.kind, url: page.url(), title: await page.title(), text: (await page.locator('body').innerText({ timeout: 5000 })).slice(0, 12000) });
    }
    if (body.kind === 'fill_form') {
      if (typeof body.selector !== 'string' || !body.selector.trim() || body.selector.length > 500 ||
          typeof body.value !== 'string' || body.value.length > 10000) {
        return res.status(400).json({ error: 'fill_form needs a selector (max 500 characters) and value (max 10,000 characters).' });
      }
      const locator = page.locator(body.selector).first();
      const protectedField = await locator.evaluate((element) => {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return true;
        const input = element instanceof HTMLInputElement ? element : null;
        const hints = [input?.type, input?.name, input?.autocomplete, element.getAttribute('aria-label'), element.getAttribute('placeholder')]
          .filter(Boolean).join(' ').toLowerCase();
        return Boolean(input && (input.type === 'password' || /credit.?card|cc-number|cvc|cvv|ssn|social.?security|one.?time.?password|otp|access.?token|api.?key/.test(hints)));
      }, { timeout: 5000 });
      if (protectedField) return res.status(403).json({ error: 'This field appears to contain a password, payment, identity, or secret value. Credential entry is disabled in this worker.' });
      await locator.fill(body.value, { timeout: 10000 });
      return res.json({ actionId: body.actionId, kind: body.kind, url: page.url(), filled: true, message: 'Field filled. Review the page before submitting.' });
    }
    if (body.kind === 'close') {
      const id = req.params.id;
      await closeSession(id);
      return res.json({ actionId: body.actionId, closed: true });
    }
    return res.status(501).json({ error: 'This browser action is not implemented in the isolated worker.' });
  } catch (error) {
    return res.status(502).json({ error: 'Browser action failed.', detail: safeError(error), url: page.url() });
  }
});

app.delete('/v1/sessions/:id', auth, async (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session || typeof req.body?.ownerId !== 'string' || req.body.ownerId !== session.ownerId) {
    return res.status(404).json({ error: 'Browser session was not found.' });
  }
  await closeSession(req.params.id);
  return res.status(204).end();
});

const expiryTimer = setInterval(() => {
  for (const [id, session] of sessions) if (session.expiresAt <= Date.now()) void closeSession(id);
}, 30_000);
expiryTimer.unref();

if (!WORKER_SECRET && process.env.NODE_ENV === 'production') {
  console.error('ANGEL_BROWSER_WORKER_SECRET must be configured. Worker will reject all calls until configured.');
}
app.listen(PORT, '0.0.0.0', () => console.log('[Angel Browser Worker] listening on port ' + PORT));
