/**
 * Angel AI Qwen Image 2.1 provider adapter.
 * Calls Alibaba Cloud Model Studio's OpenAI-compatible Images API.
 * Qwen weights are hosted externally; no diffusion weights are loaded in Netlify.
 */
export interface QwenImageInput {
  prompt: string;
  negativePrompt?: string;
  modelId?: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16' | '3:2' | '2:3';
  style?: string;
  imageDataUrl?: string;
}

export interface QwenImageResult {
  url: string;
  mimeType: string;
  model: string;
}

export class QwenImageError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'QwenImageError';
  }
}

function config() {
  return {
    baseUrl: (process.env.QWEN_IMAGE_API_BASE_URL || '').trim().replace(/\/+$/, ''),
    apiKey: (process.env.QWEN_IMAGE_API_KEY || '').trim(),
    defaultModel: (process.env.QWEN_IMAGE_MODEL_ID || 'qwen-image-2.1-turbo').trim(),
  };
}

export function getQwenImageStatus() {
  const c = config();
  return {
    provider: 'qwen-image',
    models: ['qwen-image-2.1-turbo', 'qwen-image-2.1-pro'],
    defaultModel: c.defaultModel,
    configured: Boolean(c.baseUrl && c.apiKey),
    endpointConfigured: Boolean(c.baseUrl),
    credentialConfigured: Boolean(c.apiKey),
    endpointType: 'Alibaba Cloud Model Studio OpenAI-compatible Images API',
    weightsHostedBy: 'external inference provider',
  };
}

function imageSize(aspectRatio: QwenImageInput['aspectRatio']): string {
  switch (aspectRatio) {
    case '16:9': return '1536x864';
    case '9:16': return '864x1536';
    case '4:3': return '1280x960';
    case '3:2': return '1536x1024';
    case '2:3': return '1024x1536';
    case '1:1':
    default: return '1024x1024';
  }
}

function normalizeBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new QwenImageError('QWEN_IMAGE_API_BASE_URL must be a valid absolute URL.', 503, 'invalid_endpoint');
  }
  const localHttp = url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]');
  if (url.protocol !== 'https:' && !localHttp) {
    throw new QwenImageError('The Qwen Image endpoint must use HTTPS (HTTP is allowed only for localhost development).', 503, 'insecure_endpoint');
  }
  return raw.replace(/\/+$/, '');
}

async function imagePayload(result: any, fallbackModel: string): Promise<QwenImageResult> {
  const first = Array.isArray(result?.data) ? result.data[0] : undefined;
  const model = typeof result?.model === 'string' ? result.model : fallbackModel;
  if (typeof first?.url === 'string' && /^https:\/\//i.test(first.url)) {
    let imageResponse: Response;
    try {
      imageResponse = await fetch(first.url, { signal: AbortSignal.timeout(15_000) });
    } catch {
      throw new QwenImageError('Qwen Image returned a temporary image URL that Angel could not download before expiry.', 502, 'image_download_failed');
    }
    if (!imageResponse.ok) throw new QwenImageError('Qwen Image image download failed with HTTP ' + imageResponse.status + '.', 502, 'image_download_failed');
    const mimeType = (imageResponse.headers.get('content-type') || 'image/png').split(';')[0].trim().toLowerCase();
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
      throw new QwenImageError('Qwen Image returned an unsupported image content type.', 502, 'unsupported_image_type');
    }
    const declaredSize = Number(imageResponse.headers.get('content-length') || 0);
    if (declaredSize > 20 * 1024 * 1024) throw new QwenImageError('Generated image exceeds the 20 MB artifact size limit.', 502, 'image_too_large');
    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > 20 * 1024 * 1024) {
      throw new QwenImageError('Generated image is empty or exceeds the 20 MB artifact size limit.', 502, 'image_too_large');
    }
    return { url: `data:${mimeType};base64,${bytes.toString('base64')}`, mimeType, model };
  }
  if (typeof first?.b64_json === 'string' && first.b64_json.length > 0) {
    const bytes = Buffer.from(first.b64_json, 'base64');
    if (bytes.byteLength > 20 * 1024 * 1024) throw new QwenImageError('Generated image exceeds the 20 MB artifact size limit.', 502, 'image_too_large');
    return { url: 'data:image/png;base64,' + first.b64_json, mimeType: 'image/png', model };
  }
  throw new QwenImageError('Qwen Image returned no usable image URL or image data.', 502, 'empty_provider_response');
}

export async function generateWithQwenImage(input: QwenImageInput): Promise<QwenImageResult> {
  const c = config();
  if (!c.baseUrl || !c.apiKey) {
    throw new QwenImageError(
      'Qwen Image is integrated but not configured. Set QWEN_IMAGE_API_BASE_URL and QWEN_IMAGE_API_KEY in the server environment.',
      503,
      'provider_not_configured',
    );
  }

  const baseUrl = normalizeBaseUrl(c.baseUrl);
  const model = input.modelId || c.defaultModel;
  if (!['qwen-image-2.1-turbo', 'qwen-image-2.1-pro'].includes(model)) {
    throw new QwenImageError('Unsupported Qwen Image 2.1 model. Use qwen-image-2.1-turbo or qwen-image-2.1-pro.', 400, 'unsupported_model');
  }

  const prompt = [input.prompt.trim(), input.style?.trim() ? 'Style: ' + input.style.trim() : '']
    .filter(Boolean).join('\n\n');
  const body: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
    size: imageSize(input.aspectRatio),
    prompt_extend: true,
    watermark: false,
  };
  if (input.negativePrompt?.trim()) body.negative_prompt = input.negativePrompt.trim();
  if (input.imageDataUrl) body.image = input.imageDataUrl;

  let response: Response;
  try {
    response = await fetch(baseUrl + '/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + c.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55_000),
    });
  } catch (error) {
    const timeout = error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name);
    throw new QwenImageError(
      timeout ? 'Qwen Image generation timed out.' : 'Could not connect to the configured Qwen Image endpoint.',
      timeout ? 504 : 502,
      timeout ? 'provider_timeout' : 'provider_unreachable',
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new QwenImageError('Qwen Image rejected its API key or region configuration.', 502, 'provider_auth_failed');
    }
    if (response.status === 429) {
      throw new QwenImageError('Qwen Image is rate-limiting requests. Try again shortly.', 429, 'provider_rate_limited');
    }
    throw new QwenImageError('Qwen Image returned HTTP ' + response.status + '.', 502, 'provider_request_failed');
  }

  let result: any;
  try {
    result = await response.json();
  } catch {
    throw new QwenImageError('Qwen Image returned invalid JSON.', 502, 'invalid_provider_response');
  }
  return await imagePayload(result, model);
}
