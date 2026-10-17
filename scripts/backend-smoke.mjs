import { appendFileSync } from 'node:fs';

async function main() {
const baseUrl = (process.env.ANGEL_BASE_URL || 'https://angel-ai-new.netlify.app').replace(/\/$/, '');
const expectedSha = process.env.GITHUB_SHA || '';
const deadline = Date.now() + 8 * 60 * 1000;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    signal: options.signal || AbortSignal.timeout(30_000),
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
  return { response, data };
}

let health;
while (Date.now() < deadline) {
  try {
    const result = await getJson('/api/health');
    health = result.data;
    if (result.response.ok && health.status === 'ok' && (!expectedSha || health.commitSha === expectedSha)) break;
  } catch {
    // The Netlify production alias may still be switching to this commit.
  }
  await pause(10_000);
}
if (!health || health.status !== 'ok') throw new Error('Production health endpoint did not become healthy.');
if (expectedSha && health.commitSha !== expectedSha) {
  throw new Error(`Production alias did not reach the expected commit. Expected ${expectedSha}, got ${health.commitSha || 'unknown'}.`);
}
if (!health.supabase?.isConfigured) throw new Error('Supabase is not configured in production.');
if (!health.providers?.some((provider) => provider.id === 'gemini' && provider.configured)) {
  throw new Error('Gemini provider is not configured in production.');
}
console.log(`PASS health: commit ${health.commitSha || 'unknown'}; Supabase and Gemini configured`);

for (const path of ['/api/ai/providers', '/api/models', '/api/integrations/status']) {
  const { response, data } = await getJson(path);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}: ${JSON.stringify(data).slice(0, 300)}`);
  console.log(`PASS ${path}: HTTP ${response.status}`);
}

const generation = await getJson('/api/ai/generate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'Reply with the exact words ANGEL_BACKEND_OK and nothing else.',
    systemInstruction: 'Follow the user instruction exactly. Do not add commentary.',
    modelId: 'gemini-3.8-flash',
    providerId: 'gemini',
    maxTokens: 40,
  }),
  signal: AbortSignal.timeout(90_000),
});
if (!generation.response.ok) {
  throw new Error(`Live AI generation failed with HTTP ${generation.response.status}: ${JSON.stringify(generation.data).slice(0, 500)}`);
}
const answer = String(generation.data.text || '').trim();
if (!answer || /offline fallback|pending configuration|not configured/i.test(answer)) {
  throw new Error(`AI generation did not return a live model answer: ${answer.slice(0, 300)}`);
}
console.log(`PASS live generation: provider=${generation.data.provider || 'unknown'}, model=${generation.data.modelId || 'unknown'}, chars=${answer.length}`);

}

main().catch((error) => {
  const reason = String(error?.message || error).replace(/[\r\n]+/g, ' ').replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_KEY]').slice(0, 180);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `reason=${reason}\n`);
  console.error(error);
  process.exitCode = 1;
});
