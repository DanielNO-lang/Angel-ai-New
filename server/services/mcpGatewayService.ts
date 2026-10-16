/**
 * Stateless Streamable-HTTP-style MCP endpoint implementation for Angel.
 * Supports initialize, ping, tools/list, tools/call, resources/list, resources/read.
 * Only allowlisted tool handlers are exposed. Authentication is enforced by server.ts.
 */
import { listAngelSkills, getAngelSkill } from './angelSkillsService';

export interface McpGatewayHandlers {
  getCapabilities: () => unknown;
  translate: (args: Record<string, unknown>) => Promise<unknown>;
  generateImage: (args: Record<string, unknown>) => Promise<unknown>;
  runPython: (args: Record<string, unknown>) => Promise<unknown>;
  runAdk: (args: Record<string, unknown>) => Promise<unknown>;
}

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, any>;
}

const TOOL_LIST = [
  {
    name: 'angel_capabilities_list',
    description: 'List Angel model, agent-runtime, Python, MCP, skill and infrastructure capability status without exposing credentials.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'angel_skills_list',
    description: 'List Angel curated skill packs available for agent execution.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'angel_skills_get',
    description: 'Read one allowlisted Angel skill pack by id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', minLength: 1, maxLength: 100 } }, required: ['id'], additionalProperties: false },
  },
  {
    name: 'angel_translate',
    description: 'Translate text using configured Tencent Hy-MT2 inference. This may incur provider cost.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', minLength: 1, maxLength: 30000 },
        sourceLanguage: { type: 'string', maxLength: 80 },
        targetLanguage: { type: 'string', minLength: 1, maxLength: 80 },
        style: { type: 'string', maxLength: 500 },
        context: { type: 'string', maxLength: 2000 },
      },
      required: ['text', 'targetLanguage'],
      additionalProperties: false,
    },
  },
  {
    name: 'angel_generate_image',
    description: 'Generate an image using the configured image-generation provider. This may incur provider cost.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', minLength: 1, maxLength: 12000 },
        modelId: { type: 'string', enum: ['gemini-3.1-flash-image', 'qwen-image-2.1-turbo', 'qwen-image-2.1-pro'] },
        aspectRatio: { type: 'string', enum: ['1:1', '16:9', '4:3', '9:16', '3:2', '2:3'] },
        negativePrompt: { type: 'string', maxLength: 3000 },
        style: { type: 'string', maxLength: 500 },
      },
      required: ['prompt'],
      additionalProperties: false,
    },
  },
  {
    name: 'angel_python_execute',
    description: 'Run user-requested Python code in Angel’s configured isolated external sandbox. Never for secrets or untrusted production data.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', minLength: 1, maxLength: 20000 },
        stdin: { type: 'string', maxLength: 5000 },
        timeoutMs: { type: 'integer', minimum: 1000, maximum: 10000 },
      },
      required: ['code'],
      additionalProperties: false,
    },
  },
  {
    name: 'angel_adk_run',
    description: 'Send a request to Angel’s configured Google ADK Python agent runtime.',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', minLength: 1, maxLength: 20000 },
        sessionId: { type: 'string', maxLength: 160 },
      },
      required: ['message'],
      additionalProperties: false,
    },
  },
];

function reply(id: JsonRpcRequest['id'], result: unknown) {
  return { jsonrpc: '2.0', id, result };
}
function rpcError(id: JsonRpcRequest['id'], code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}
function textResult(value: unknown, isError = false) {
  const serialized = JSON.stringify(value);
  return {
    content: [{ type: 'text', text: serialized.length > 60_000 ? serialized.slice(0, 60_000) : serialized }],
    ...(isError ? { isError: true } : {}),
  };
}

function validateToolArguments(toolName: string, args: Record<string, unknown>): string | null {
  const tool = TOOL_LIST.find((item) => item.name === toolName);
  if (!tool) return 'Tool is not in Angel’s allowlist.';
  const schema = tool.inputSchema as any;
  const properties = schema.properties || {};
  if (schema.additionalProperties === false) {
    const extra = Object.keys(args).find((key) => !Object.prototype.hasOwnProperty.call(properties, key));
    if (extra) return 'Unknown argument: ' + extra;
  }
  for (const required of (schema.required || []) as string[]) {
    if (!Object.prototype.hasOwnProperty.call(args, required)) return 'Missing required argument: ' + required;
  }
  for (const [key, value] of Object.entries(args)) {
    const rule = properties[key];
    if (!rule) continue;
    if (rule.type === 'string') {
      if (typeof value !== 'string') return key + ' must be a string.';
      if (typeof rule.minLength === 'number' && value.length < rule.minLength) return key + ' is too short.';
      if (typeof rule.maxLength === 'number' && value.length > rule.maxLength) return key + ' exceeds the maximum length of ' + rule.maxLength + '.';
      if (Array.isArray(rule.enum) && !rule.enum.includes(value)) return key + ' has an unsupported value.';
    } else if (rule.type === 'integer') {
      if (!Number.isInteger(value)) return key + ' must be an integer.';
      if (typeof rule.minimum === 'number' && Number(value) < rule.minimum) return key + ' is below the minimum of ' + rule.minimum + '.';
      if (typeof rule.maximum === 'number' && Number(value) > rule.maximum) return key + ' exceeds the maximum of ' + rule.maximum + '.';
    } else if (rule.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
      return key + ' must be a finite number.';
    } else if (rule.type === 'boolean' && typeof value !== 'boolean') {
      return key + ' must be a boolean.';
    } else if (rule.type === 'array' && !Array.isArray(value)) {
      return key + ' must be an array.';
    } else if (rule.type === 'object' && (!value || typeof value !== 'object' || Array.isArray(value))) {
      return key + ' must be an object.';
    }
  }
  return null;
}

export async function handleAngelMcpMessage(
  input: unknown,
  handlers: McpGatewayHandlers,
): Promise<{ statusCode: number; body?: unknown }> {
  const req = input as JsonRpcRequest;
  const hasId = req && Object.prototype.hasOwnProperty.call(req, 'id');
  const id = req?.id;
  if (!req || req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
    return { statusCode: 200, body: rpcError(hasId ? id : null, -32600, 'Invalid JSON-RPC request.') };
  }

  if (req.method === 'notifications/initialized' || req.method === 'notifications/cancelled') {
    return { statusCode: 202 };
  }
  if (req.method === 'initialize') {
    const requested = typeof req.params?.protocolVersion === 'string' ? req.params.protocolVersion : '2025-06-18';
    const supported = ['2025-11-25', '2025-06-18', '2025-03-26'];
    const protocolVersion = supported.includes(requested) ? requested : '2025-11-25';
    return {
      statusCode: 200,
      body: reply(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false } },
        serverInfo: { name: 'angel-ai', version: '1.0.0' },
        instructions: 'Angel exposes allowlisted workspace tools. Paid or mutating operations must only be called when requested by the authenticated user.',
      }),
    };
  }
  if (req.method === 'ping') return { statusCode: 200, body: reply(id, {}) };
  if (req.method === 'tools/list') return { statusCode: 200, body: reply(id, { tools: TOOL_LIST }) };
  if (req.method === 'resources/list') {
    return {
      statusCode: 200,
      body: reply(id, {
        resources: [
          { uri: 'angel://capabilities', name: 'Angel capability status', description: 'Current configured state of integrated models and external runtimes.', mimeType: 'application/json' },
          ...listAngelSkills().map((skill) => ({
            uri: 'angel://skills/' + skill.id,
            name: skill.name,
            description: skill.description,
            mimeType: 'text/markdown',
          })),
        ],
      }),
    };
  }
  if (req.method === 'resources/read') {
    const uri = typeof req.params?.uri === 'string' ? req.params.uri : '';
    if (uri === 'angel://capabilities') {
      return { statusCode: 200, body: reply(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(handlers.getCapabilities()) }] }) };
    }
    const prefix = 'angel://skills/';
    if (uri.startsWith(prefix)) {
      const skill = getAngelSkill(uri.slice(prefix.length));
      if (!skill) return { statusCode: 200, body: rpcError(id, -32602, 'Unknown skill resource.') };
      return { statusCode: 200, body: reply(id, { contents: [{ uri, mimeType: 'text/markdown', text: `# ${skill.name}\n\n${skill.description}\n\n${skill.instructions}` }] }) };
    }
    return { statusCode: 200, body: rpcError(id, -32602, 'Unknown resource URI.') };
  }
  if (req.method === 'tools/call') {
    const name = typeof req.params?.name === 'string' ? req.params.name : '';
    const args = req.params?.arguments && typeof req.params.arguments === 'object' && !Array.isArray(req.params.arguments)
      ? req.params.arguments as Record<string, unknown>
      : {};
    const validationError = validateToolArguments(name, args);
    if (validationError) return { statusCode: 200, body: rpcError(id, -32602, validationError) };
    try {
      let value: unknown;
      switch (name) {
        case 'angel_capabilities_list':
          value = handlers.getCapabilities();
          break;
        case 'angel_skills_list':
          value = listAngelSkills();
          break;
        case 'angel_skills_get': {
          const skill = getAngelSkill(String(args.id || ''));
          if (!skill) return { statusCode: 200, body: reply(id, textResult({ error: 'Unknown skill id.' }, true)) };
          value = skill;
          break;
        }
        case 'angel_translate':
          if (typeof args.text !== 'string' || !args.text.trim() || typeof args.targetLanguage !== 'string' || !args.targetLanguage.trim()) {
            return { statusCode: 200, body: rpcError(id, -32602, 'text and targetLanguage are required.') };
          }
          value = await handlers.translate(args);
          break;
        case 'angel_generate_image':
          if (typeof args.prompt !== 'string' || !args.prompt.trim()) return { statusCode: 200, body: rpcError(id, -32602, 'prompt is required.') };
          value = await handlers.generateImage(args);
          break;
        case 'angel_python_execute':
          if (typeof args.code !== 'string' || !args.code.trim()) return { statusCode: 200, body: rpcError(id, -32602, 'code is required.') };
          value = await handlers.runPython(args);
          break;
        case 'angel_adk_run':
          if (typeof args.message !== 'string' || !args.message.trim()) return { statusCode: 200, body: rpcError(id, -32602, 'message is required.') };
          value = await handlers.runAdk(args);
          break;
        default:
          return { statusCode: 200, body: rpcError(id, -32602, 'Tool is not in Angel’s allowlist.') };
      }
      return { statusCode: 200, body: reply(id, textResult(value)) };
    } catch (error) {
      return {
        statusCode: 200,
        body: reply(id, textResult({ error: error instanceof Error ? error.message : 'MCP tool call failed.' }, true)),
      };
    }
  }

  return { statusCode: 200, body: rpcError(hasId ? id : null, -32601, 'Method not found.') };
}
