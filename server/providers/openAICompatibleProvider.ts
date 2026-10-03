/**
 * ANGEL AI — OpenAI-Compatible Model Provider
 * Supports OpenAI (GPT-4o, GPT-4o-mini), Groq, Together, and local Ollama/vLLM servers.
 */

import {
  AIProvider,
  GenerateOptions,
  GenerateResult,
  StreamOptions,
  StructuredOutputOptions,
  ToolCallOptions,
  ToolCallResult,
  VisionOptions,
  VisionResult,
} from './types';

export class OpenAICompatibleProvider implements AIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI / Compatible Provider';
  readonly defaultModelId = 'gpt-4o-mini';

  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured with an API key.');
    }

    const messages = [
      ...(options.systemInstruction ? [{ role: 'system', content: options.systemInstruction }] : []),
      ...(options.conversationHistory?.map((m) => ({ role: m.role, content: m.content })) || []),
      { role: 'user', content: options.prompt },
    ];

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.modelId || this.defaultModelId,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      text: choice?.message?.content || '',
      provider: this.id,
      modelId: data.model || options.modelId || this.defaultModelId,
      tokensUsed: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice?.finish_reason,
    };
  }

  async stream(options: StreamOptions, onChunk: (chunk: string) => void): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured.');
    }

    const messages = [
      ...(options.systemInstruction ? [{ role: 'system', content: options.systemInstruction }] : []),
      ...(options.conversationHistory?.map((m) => ({ role: m.role, content: m.content })) || []),
      { role: 'user', content: options.prompt },
    ];

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.modelId || this.defaultModelId,
        messages,
        temperature: options.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI streaming error (${res.status})`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (!reader) return fullText;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter((l) => l.startsWith('data: '));
      for (const line of lines) {
        const payload = line.replace('data: ', '').trim();
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // ignore non-json keepalives
        }
      }
    }

    return fullText;
  }

  async structuredOutput<T = unknown>(options: StructuredOutputOptions<T>): Promise<T> {
    const res = await this.generate({
      prompt: `${options.prompt}\n\nYou must return valid JSON matching this schema:\n${JSON.stringify(options.jsonSchema)}`,
      systemInstruction: `${options.systemInstruction || ''}\nOutput strictly valid raw JSON without code fences or commentary.`,
      conversationHistory: options.conversationHistory,
      modelId: options.modelId,
      temperature: 0.1,
    });

    const cleaned = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as T;
  }

  async toolCall(options: ToolCallOptions): Promise<ToolCallResult> {
    const tools = options.tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    }));

    const messages = [
      ...(options.systemInstruction ? [{ role: 'system', content: options.systemInstruction }] : []),
      ...(options.conversationHistory?.map((m) => ({ role: m.role, content: m.content })) || []),
      { role: 'user', content: options.prompt },
    ];

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.modelId || this.defaultModelId,
        messages,
        tools,
        tool_choice: options.toolChoice || 'auto',
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI tool call error (${res.status})`);
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    const toolCalls = (msg?.tool_calls || []).map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      args: JSON.parse(tc.function.arguments || '{}'),
    }));

    return {
      text: msg?.content || undefined,
      toolCalls,
      provider: this.id,
      modelId: data.model,
    };
  }

  async vision(options: VisionOptions): Promise<VisionResult> {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: options.prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${options.mimeType};base64,${options.base64Data}`,
            },
          },
        ],
      },
    ];

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI vision error (${res.status})`);
    }

    const data = await res.json();
    return {
      analysis: data.choices?.[0]?.message?.content || '',
      provider: this.id,
      modelId: 'gpt-4o',
    };
  }

  async embeddings(texts: string[] | string): Promise<number[][]> {
    const input = Array.isArray(texts) ? texts : [texts];
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI embeddings error (${res.status})`);
    }

    const data = await res.json();
    return data.data.map((item: any) => item.embedding);
  }
}
