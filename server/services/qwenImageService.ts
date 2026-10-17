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
  /** One to ten source/reference image URLs or data URIs. Multiple images require Qwen Image 2.1 Pro. */
  referenceImageDataUrls?: string[];
  /** Backward-compatible single-reference input. Do not send with referenceImageDataUrls. */
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

  const prompt = [
    input.prompt.trim(),
    input.style?.trim() ? 'Style: ' + input.style.trim() : '',
    // Qwen Image 2.1 does not support the negative_prompt request parameter.
    // Preserve this UI input as a natural-language constraint in the positive prompt.
    input.negativePrompt?.trim() ? 'Avoid including these elements: ' + input.negativePrompt.trim() : '',
  ].filter(Boolean).join('\n\n');
  if (input.referenceImageDataUrls && input.imageDataUrl) {
    throw new QwenImageError('Provide referenceImageDataUrls or imageDataUrl, not both.', 400, 'ambiguous_reference_images');
  }
  const referenceImages = input.referenceImageDataUrls?.length
    ? input.referenceImageDataUrls
    : input.imageDataUrl ? [input.imageDataUrl] : [];
  if (referenceImages.length > 10) {
    throw new QwenImageError('Qwen Image accepts at most 10 reference images per edit.', 413, 'too_many_reference_images');
  }
  if (referenceImages.length > 1 && model !== 'qwen-image-2.1-pro') {
    throw new QwenImageError('Multiple reference images require qwen-image-2.1-pro. Select Pro or provide a single image.', 400, 'multi_reference_requires_pro');
  }

  const MAX_REFERENCE_BYTES = 10 * 1024 * 1024;
  const MAX_TOTAL_REFERENCE_BYTES = 20 * 1024 * 1024;
  let totalReferenceBytes = 0;
  const validatedReferenceImages = referenceImages.map((referenceImage, index) => {
    if (typeof referenceImage !== 'string' || !referenceImage.trim()) {
      throw new QwenImageError('Reference image ' + (index + 1) + ' must be a non-empty HTTPS URL or image data URI.', 400, 'invalid_reference_image');
    }
    const value = referenceImage.trim();
    if (value.startsWith('data:')) {
      const match = value.match(/^data:(image\\/(?:png|jpeg|jpg|webp|gif|bmp|tiff));base64,([A-Za-z0-9+/]+={0,2})$/i);
      if (!match || match[2].length % 4 !== 0) {
        throw new QwenImageError('Reference image ' + (index + 1) + ' must be a valid base64 PNG, JPEG, WEBP, GIF, BMP or TIFF data URI.', 400, 'invalid_reference_image');
      }
      const bytes = Buffer.from(match[2], 'base64');
      // Reject malformed encodings that Buffer would otherwise partially decode.
      if (bytes.byteLength === 0 || bytes.toString('base64') !== match[2]) {
        throw new QwenImageError('Reference image ' + (index + 1) + ' contains invalid base64 data.', 400, 'invalid_reference_image');
      }
      if (bytes.byteLength > MAX_REFERENCE_BYTES) {
        throw new QwenImageError('Each reference image must be no larger than 10 MB.', 413, 'reference_image_too_large');
      }
      totalReferenceBytes += bytes.byteLength;
    } else {
      let referenceUrl: URL;
      try {
        referenceUrl = new URL(value);
      } catch {
        throw new QwenImageError('Reference image ' + (index + 1) + ' must be an HTTPS URL or valid image data URI.', 400, 'invalid_reference_image');
      }
      if (referenceUrl.protocol !== 'https:' || referenceUrl.username || referenceUrl.password) {
        throw new QwenImageError('Remote reference images must use HTTPS without embedded credentials.', 400, 'invalid_reference_image');
      }
    }
    return value;
  });
  if (totalReferenceBytes > MAX_TOTAL_REFERENCE_BYTES) {
    throw new QwenImageError('The combined reference-image data must be no larger than 20 MB.', 413, 'reference_images_too_large');
  }

  const body: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
    size: imageSize(input.aspectRatio),
    prompt_extend: true,
    watermark: false,
  };
  // Model Studio documents a single image or an ordered reference-image array.
  // Multi-reference edits are enabled only for Qwen Image 2.1 Pro.
  // Model Studio currently documents negative_prompt for Qwen Image 3.0, not 2.1.
  if (validatedReferenceImages.length === 1) body.image = validatedReferenceImages[0];
  if (validatedReferenceImages.length > 1) body.image = validatedReferenceImages;

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
