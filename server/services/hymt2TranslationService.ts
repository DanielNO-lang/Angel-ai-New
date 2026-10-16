/**
 * Angel AI — Tencent Hy-MT2 translation adapter.
 *
 * Hy-MT2 weights must run behind a hosted OpenAI-compatible inference endpoint.
 * Netlify Functions proxy authenticated requests to that endpoint and never load
 * model weights into the serverless runtime.
 */

export interface HyMT2TranslationInput {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  style?: string;
  context?: string;
}

export interface HyMT2TranslationResult {
  translation: string;
  provider: 'hymt2';
  model: string;
  sourceLanguage: string;
  targetLanguage: string;
  durationMs: number;
}

export class HyMT2Error extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'HyMT2Error';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getConfig() {
  return {
    baseUrl: (process.env.HYMT2_API_BASE_URL || '').trim().replace(/\\/+$/, ''),
    apiKey: (process.env.HYMT2_API_KEY || process.env.HF_TOKEN || '').trim(),
    model: (process.env.HYMT2_MODEL_ID || 'tencent/Hy-MT2-1.8B').trim(),
  };
}

export function getHyMT2Status() {
  const config = getConfig();
  return {
    provider: 'hymt2' as const,
    model: config.model,
    configured: Boolean(config.baseUrl),
    endpointConfigured: Boolean(config.baseUrl),
    credentialConfigured: Boolean(config.apiKey),
    endpointType: 'OpenAI-compatible chat completions',
    weightsHostedBy: 'external inference endpoint',
  };
}

function validateEndpoint(baseUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new HyMT2Error('HYMT2_API_BASE_URL must be a valid absolute URL.', 503, 'invalid_endpoint');
  }

  const localHttp = parsed.protocol === 'http:' &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '[::1]');
  if (parsed.protocol !== 'https:' && !localHttp) {
    throw new HyMT2Error('The Hy-MT2 endpoint must use HTTPS (HTTP is allowed only for localhost development).', 503, 'insecure_endpoint');
  }
  return parsed;
}

function getMessageContent(payload: any): string {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content.map((part: any) => typeof part?.text === 'string' ? part.text : '').join('').trim();
  }
  return '';
}

export async function translateWithHyMT2(input: HyMT2TranslationInput): Promise<HyMT2TranslationResult> {
  const config = getConfig();
  if (!config.baseUrl) {
    throw new HyMT2Error(
      'Hy-MT2 is integrated but not connected to an inference endpoint yet. Set HYMT2_API_BASE_URL in the server environment.',
      503,
      'provider_not_configured',
    );
  }

  const endpoint = validateEndpoint(config.baseUrl);
  const sourceLanguage = (input.sourceLanguage || 'Auto-detect').trim();
  const targetLanguage = input.targetLanguage.trim();
  const promptParts = [
    sourceLanguage.toLowerCase() === 'auto-detect'
      ? 'Detect the source language and translate the following text into ' + targetLanguage + '.'
      : 'Translate the following text from ' + sourceLanguage + ' into ' + targetLanguage + '.',
    'Output only the translated result, without explanations or introductory text.',
    'Preserve meaning, tone, paragraph breaks, list structure, punctuation, numbers, URLs, code, markup, and placeholders exactly wherever they are not meant to be translated.',
  ];
  if (input.style?.trim()) promptParts.push('Translation style: ' + input.style.trim());
  if (input.context?.trim()) promptParts.push('Context: ' + input.context.trim());
  promptParts.push('Text to translate:\n' + input.text);

  const requestBody = {
    model: config.model,
    messages: [{ role: 'user', content: promptParts.join('\n\n') }],
    temperature: 0.7,
    top_p: config.model.toLowerCase().includes('30b') ? 1.0 : 0.6,
    max_tokens: 4096,
    stream: false,
  };

  const startedAt = Date.now();
  let response: Response;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) headers.Authorization = 'Bearer ' + config.apiKey;
    response = await fetch(config.baseUrl + '/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(50_000),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new HyMT2Error('The Hy-MT2 translation endpoint timed out. Try a shorter passage or check the inference service.', 504, 'provider_timeout');
    }
    throw new HyMT2Error('Could not connect to the configured Hy-MT2 inference endpoint.', 502, 'provider_unreachable');
  }

  if (!response.ok) {
    // Do not echo response bodies, which might contain internal service details.
    const status = response.status;
    if (status === 401 || status === 403) {
      throw new HyMT2Error('The Hy-MT2 inference endpoint rejected its credentials. Check HYMT2_API_KEY or the endpoint access policy.', 502, 'provider_auth_failed');
    }
    if (status === 429) {
      throw new HyMT2Error('The Hy-MT2 inference endpoint is rate-limiting requests. Try again shortly.', 429, 'provider_rate_limited');
    }
    throw new HyMT2Error('The Hy-MT2 inference endpoint returned HTTP ' + status + '.', 502, 'provider_request_failed');
  }

  let payload: any;
  try {
    payload = await response.json();
  } catch {
    throw new HyMT2Error('The Hy-MT2 inference endpoint returned invalid JSON.', 502, 'invalid_provider_response');
  }

  const translation = getMessageContent(payload);
  if (!translation) {
    throw new HyMT2Error('The Hy-MT2 inference endpoint returned an empty translation.', 502, 'empty_provider_response');
  }

  return {
    translation,
    provider: 'hymt2',
    model: typeof payload?.model === 'string' ? payload.model : config.model,
    sourceLanguage,
    targetLanguage,
    durationMs: Date.now() - startedAt,
  };
}
