/**
 * Remote Python sandbox bridge.
 * Angel/Netlify never evals submitted code inside the web server process.
 * The configured executor MUST run each request in a disposable, isolated sandbox.
 */
export class PythonSandboxError extends Error {
  constructor(message: string, readonly statusCode: number, readonly code: string) {
    super(message);
    this.name = 'PythonSandboxError';
  }
}

function config() {
  return {
    url: (process.env.ANGEL_PYTHON_RUN_URL || '').trim(),
    token: (process.env.ANGEL_PYTHON_RUN_TOKEN || '').trim(),
  };
}

export function getPythonSandboxStatus() {
  const c = config();
  return {
    provider: 'angel-python-sandbox',
    configured: Boolean(c.url && c.token),
    endpointConfigured: Boolean(c.url),
    credentialConfigured: Boolean(c.token),
    executionMode: 'external disposable sandbox',
    serverExecutesUntrustedCodeLocally: false,
  };
}

export interface PythonExecutionRequest {
  code: string;
  stdin?: string;
  timeoutMs?: number;
}
export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs?: number;
}

export async function executePythonSandbox(
  input: PythonExecutionRequest,
  userId: string,
): Promise<PythonExecutionResult> {
  const c = config();
  if (!c.url || !c.token) {
    throw new PythonSandboxError(
      'Python execution is not connected yet. Configure ANGEL_PYTHON_RUN_URL and ANGEL_PYTHON_RUN_TOKEN for an isolated execution service.',
      503,
      'sandbox_not_configured',
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(c.url);
  } catch {
    throw new PythonSandboxError('ANGEL_PYTHON_RUN_URL must be a valid absolute URL.', 503, 'invalid_endpoint');
  }
  const localHttp = endpoint.protocol === 'http:' &&
    (endpoint.hostname === 'localhost' || endpoint.hostname === '127.0.0.1' || endpoint.hostname === '[::1]');
  if (endpoint.protocol !== 'https:' && !localHttp) {
    throw new PythonSandboxError('The Python execution endpoint must use HTTPS (HTTP is allowed only for localhost development).', 503, 'insecure_endpoint');
  }

  const timeoutMs = Math.min(10_000, Math.max(1_000, Number(input.timeoutMs || 5_000)));
  let response: Response;
  try {
    response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + c.token,
      },
      body: JSON.stringify({
        language: 'python',
        code: input.code,
        stdin: typeof input.stdin === 'string' ? input.stdin.slice(0, 5000) : '',
        timeoutMs,
        limits: { memoryMb: 128, networkAccess: false, filesystemAccess: 'ephemeral-only', maxOutputChars: 20000 },
        requestId: userId,
      }),
      signal: AbortSignal.timeout(timeoutMs + 2_000),
    });
  } catch (error) {
    const timeout = error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name);
    throw new PythonSandboxError(
      timeout ? 'Python execution timed out.' : 'Could not reach the isolated Python sandbox.',
      timeout ? 504 : 502,
      timeout ? 'sandbox_timeout' : 'sandbox_unreachable',
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new PythonSandboxError('The Python sandbox rejected its service credentials.', 502, 'sandbox_auth_failed');
    }
    if (response.status === 429) throw new PythonSandboxError('Python sandbox capacity is busy. Try again shortly.', 429, 'sandbox_rate_limited');
    throw new PythonSandboxError('The Python sandbox returned HTTP ' + response.status + '.', 502, 'sandbox_request_failed');
  }

  let payload: any;
  try {
    payload = await response.json();
  } catch {
    throw new PythonSandboxError('Python sandbox returned invalid JSON.', 502, 'invalid_sandbox_response');
  }
  if (typeof payload?.stdout !== 'string' || typeof payload?.stderr !== 'string' || !Number.isInteger(payload?.exitCode)) {
    throw new PythonSandboxError('Python sandbox response must include stdout, stderr and integer exitCode.', 502, 'invalid_sandbox_response');
  }
  return {
    stdout: payload.stdout.slice(0, 20_000),
    stderr: payload.stderr.slice(0, 20_000),
    exitCode: payload.exitCode,
    durationMs: Number.isFinite(payload.durationMs) ? payload.durationMs : undefined,
  };
}
