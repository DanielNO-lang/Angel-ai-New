/**
 * Bridge to a separately hosted Google Agent Development Kit (ADK) Python runtime.
 * Netlify remains the Angel API layer; ADK sessions/model execution live externally.
 */
export class AdkBridgeError extends Error {
  constructor(message: string, readonly statusCode: number, readonly code: string) {
    super(message);
    this.name = 'AdkBridgeError';
  }
}

function config() {
  return {
    runUrl: (process.env.ANGEL_ADK_RUN_URL || '').trim(),
    token: (process.env.ANGEL_ADK_API_KEY || '').trim(),
    appName: (process.env.ANGEL_ADK_APP_NAME || 'angel-adk-bridge').trim(),
  };
}

export function getAdkBridgeStatus() {
  const c = config();
  return {
    provider: 'google-adk-python',
    configured: Boolean(c.runUrl && c.token),
    endpointConfigured: Boolean(c.runUrl),
    credentialConfigured: Boolean(c.token),
    runtime: 'external Python service',
    defaultAppName: c.appName,
  };
}

export interface AdkRunInput {
  message: string;
  sessionId?: string;
}

export async function runAdkAgent(input: AdkRunInput, userId: string): Promise<{
  success: boolean;
  response: string;
  sessionId?: string;
  appName?: string;
  durationMs: number;
}> {
  const c = config();
  if (!c.runUrl || !c.token) {
    throw new AdkBridgeError(
      'Google ADK is integrated but not connected. Deploy the Python ADK bridge and configure ANGEL_ADK_RUN_URL and ANGEL_ADK_API_KEY.',
      503,
      'adk_not_configured',
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(c.runUrl);
  } catch {
    throw new AdkBridgeError('ANGEL_ADK_RUN_URL must be a valid absolute URL.', 503, 'invalid_endpoint');
  }
  const localHttp = endpoint.protocol === 'http:' &&
    (endpoint.hostname === 'localhost' || endpoint.hostname === '127.0.0.1' || endpoint.hostname === '[::1]');
  if (endpoint.protocol !== 'https:' && !localHttp) {
    throw new AdkBridgeError('The ADK bridge endpoint must use HTTPS (HTTP is allowed only for localhost development).', 503, 'insecure_endpoint');
  }

  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.token },
      body: JSON.stringify({
        appName: c.appName,
        userId,
        sessionId: input.sessionId?.trim().slice(0, 160) || undefined,
        message: input.message,
      }),
      signal: AbortSignal.timeout(50_000),
    });
  } catch (error) {
    const timeout = error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name);
    throw new AdkBridgeError(
      timeout ? 'The ADK agent exceeded its 50-second response window.' : 'Could not connect to the ADK runtime.',
      timeout ? 504 : 502,
      timeout ? 'adk_timeout' : 'adk_unreachable',
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new AdkBridgeError('The ADK service rejected its bridge credentials.', 502, 'adk_auth_failed');
    if (response.status === 429) throw new AdkBridgeError('The ADK service is at capacity. Try again shortly.', 429, 'adk_rate_limited');
    throw new AdkBridgeError('The ADK runtime returned HTTP ' + response.status + '.', 502, 'adk_request_failed');
  }

  let payload: any;
  try {
    payload = await response.json();
  } catch {
    throw new AdkBridgeError('The ADK runtime returned invalid JSON.', 502, 'invalid_adk_response');
  }

  const answer = typeof payload?.response === 'string'
    ? payload.response
    : typeof payload?.text === 'string' ? payload.text : '';
  if (!answer.trim()) throw new AdkBridgeError('The ADK runtime returned an empty response.', 502, 'empty_adk_response');
  return {
    success: payload.success !== false,
    response: answer.slice(0, 50_000),
    sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : input.sessionId,
    appName: typeof payload.appName === 'string' ? payload.appName : c.appName,
    durationMs: Date.now() - started,
  };
}
