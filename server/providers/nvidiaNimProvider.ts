/**
 * NVIDIA NIM OpenAI-compatible inference adapter.
 * Credentials and endpoints are server-only. NIM is optional; no key means unavailable.
 */
import type {
  AIProvider, GenerateOptions, GenerateResult, StreamOptions, StructuredOutputOptions,
  ToolCallOptions, ToolCallResult, VisionOptions, VisionResult,
} from './types';

type ChatMessage = { role: string; content: any; name?: string; tool_call_id?: string };

export class NvidiaNimProvider implements AIProvider {
  readonly id = 'nvidia-nim';
  readonly name = 'NVIDIA NIM';
  readonly defaultModelId: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY || '';
    this.baseUrl = (process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
    this.defaultModelId = process.env.NVIDIA_NIM_MODEL_ID || 'meta/llama-3.1-8b-instruct';
  }

  isConfigured(): boolean {
    return this.apiKey.trim().length > 8 && /^https:\/\//i.test(this.baseUrl);
  }

  private messages(options: { prompt: string; systemInstruction?: string; conversationHistory?: Array<{ role: string; content: string }> }): ChatMessage[] {
    return [
      ...(options.systemInstruction ? [{ role: 'system', content: options.systemInstruction }] : []),
      ...(options.conversationHistory || []).map((message) => ({ role: message.role, content: message.content })),
      { role: 'user', content: options.prompt },
    ];
  }

  private async request(path: string, body: Record<string, unknown>): Promise<any> {
    if (!this.isConfigured()) throw new Error('NVIDIA NIM is not configured. Set NVIDIA_NIM_API_KEY and optionally NVIDIA_NIM_BASE_URL.');
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 1200);
      throw new Error(`NVIDIA NIM request failed (${response.status}): ${detail}`);
    }
    return response.json();
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const data = await this.request('/chat/completions', {
      model: options.modelId || this.defaultModelId,
      messages: this.messages(options),
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 2048,
      top_p: options.topP,
      stream: false,
    });
    const choice = data.choices?.[0];
    const text = typeof choice?.message?.content === 'string' ? choice.message.content : '';
    return {
      text, provider: this.id, modelId: data.model || options.modelId || this.defaultModelId,
      tokensUsed: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice?.finish_reason,
    };
  }

  async stream(options: StreamOptions, onChunk: (chunk: string) => void): Promise<string> {
    if (!this.isConfigured()) throw new Error('NVIDIA NIM is not configured.');
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: options.modelId || this.defaultModelId, messages: this.messages(options),
        temperature: options.temperature ?? 0.4, max_tokens: options.maxTokens ?? 2048, stream: true,
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`NVIDIA NIM streaming failed (${response.status}).`);
    if (!response.body) throw new Error('NVIDIA NIM returned no streaming response body.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) { fullText += delta; onChunk(delta); }
        } catch { /* Ignore malformed keep-alive fragments. */ }
      }
    }
    return fullText;
  }

  async structuredOutput<T = unknown>(options: StructuredOutputOptions<T>): Promise<T> {
    const result = await this.generate({
      prompt: `${options.prompt}\n\nReturn only valid JSON matching this schema:\n${JSON.stringify(options.jsonSchema)}`,
      systemInstruction: `${options.systemInstruction || ''}\nReturn raw JSON only, with no Markdown fences.`,
      conversationHistory: options.conversationHistory, modelId: options.modelId, temperature: 0.1,
    });
    return JSON.parse(result.text.replace(/```(?:json)?/gi, '').trim()) as T;
  }

  async toolCall(options: ToolCallOptions): Promise<ToolCallResult> {
    const data = await this.request('/chat/completions', {
      model: options.modelId || this.defaultModelId,
      messages: this.messages(options),
      tools: options.tools.map((tool) => ({ type: 'function', function: {
        name: tool.name, description: tool.description, parameters: tool.inputSchema,
      } })),
      tool_choice: options.toolChoice || 'auto',
      temperature: 0.1,
    });
    const message = data.choices?.[0]?.message;
    const toolCalls = (message?.tool_calls || []).map((call: any) => ({
      id: String(call.id || ''), name: String(call.function?.name || ''),
      args: JSON.parse(call.function?.arguments || '{}'),
    }));
    return { text: message?.content || undefined, toolCalls, provider: this.id, modelId: data.model || options.modelId || this.defaultModelId };
  }

  async vision(options: VisionOptions): Promise<VisionResult> {
    const data = await this.request('/chat/completions', {
      model: options.modelId || this.defaultModelId,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: options.prompt },
          { type: 'image_url', image_url: { url: `data:${options.mimeType};base64,${options.base64Data}` } },
        ],
      }],
      temperature: 0.2,
    });
    return { analysis: data.choices?.[0]?.message?.content || '', provider: this.id, modelId: data.model || options.modelId || this.defaultModelId };
  }

  async embeddings(texts: string[] | string): Promise<number[][]> {
    const data = await this.request('/embeddings', {
      model: process.env.NVIDIA_NIM_EMBEDDING_MODEL_ID || 'nvidia/nv-embedqa-e5-v5',
      input: Array.isArray(texts) ? texts : [texts],
    });
    return (data.data || []).map((item: any) => item.embedding as number[]);
  }
}
