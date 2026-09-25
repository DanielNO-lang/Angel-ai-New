/**
 * ANGEL AI — Concrete Google Gemini AIProvider Implementation
 * Strictly encapsulates all @google/genai SDK operations on the server side.
 * No code outside this file interacts with the Gemini SDK directly.
 */

import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';
import {
  AIProvider,
  GenerateOptions,
  GenerateResult,
  ModelToolDefinition,
  ProviderMessage,
  StreamOptions,
  StructuredOutputOptions,
  ToolCallOptions,
  ToolCallRequest,
  ToolCallResult,
  VisionOptions,
  VisionResult,
} from './types';

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini Intelligence';
  readonly defaultModelId = 'gemini-3.8-flash';
  readonly embeddingModelId = 'gemini-embedding-2-preview';

  private client: GoogleGenAI | null = null;

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  }

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY || 'unconfigured-gemini-key';
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.client;
  }

  /**
   * Helper to format generic ProviderMessage[] into Gemini contents structure
   */
  private formatContents(prompt: string, history?: ProviderMessage[]) {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.role === 'system') continue;
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    return contents;
  }

  /**
   * Convert JSON schema types to Gemini Type enum
   */
  private mapJsonSchemaType(typeStr: unknown): Type {
    const str = String(typeStr || '').toLowerCase();
    switch (str) {
      case 'string':
        return Type.STRING;
      case 'number':
        return Type.NUMBER;
      case 'integer':
        return Type.INTEGER;
      case 'boolean':
        return Type.BOOLEAN;
      case 'array':
        return Type.ARRAY;
      case 'object':
        return Type.OBJECT;
      default:
        return Type.STRING;
    }
  }

  /**
   * Recursively convert a generic JSON schema object into Gemini-compatible schema format
   */
  private convertToGeminiSchema(schemaObj: Record<string, unknown>): Record<string, unknown> {
    if (!schemaObj || typeof schemaObj !== 'object') {
      return { type: Type.STRING };
    }

    const type = this.mapJsonSchemaType(schemaObj.type);
    const result: Record<string, unknown> = {
      type,
    };

    if (schemaObj.description && typeof schemaObj.description === 'string') {
      result.description = schemaObj.description;
    }

    if (type === Type.OBJECT) {
      const properties = (schemaObj.properties || {}) as Record<string, Record<string, unknown>>;
      const convertedProps: Record<string, unknown> = {};

      for (const [key, propDef] of Object.entries(properties)) {
        convertedProps[key] = this.convertToGeminiSchema(propDef);
      }

      result.properties = convertedProps;

      if (Array.isArray(schemaObj.required) && schemaObj.required.length > 0) {
        result.required = schemaObj.required;
      }
    } else if (type === Type.ARRAY && schemaObj.items && typeof schemaObj.items === 'object') {
      result.items = this.convertToGeminiSchema(schemaObj.items as Record<string, unknown>);
    }

    return result;
  }

  /**
   * Convert ModelToolDefinition array to Gemini FunctionDeclaration format
   */
  private convertTools(tools: ModelToolDefinition[]): FunctionDeclaration[] {
    return tools.map((tool) => {
      const properties: Record<string, unknown> = {};
      const rawProperties = tool.inputSchema?.properties || {};

      for (const [propName, propDef] of Object.entries(rawProperties)) {
        properties[propName] = this.convertToGeminiSchema(propDef as Record<string, unknown>);
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: Type.OBJECT,
          description: `Input parameters for ${tool.name}`,
          properties,
          required: tool.inputSchema?.required || [],
        },
      } as FunctionDeclaration;
    });
  }

  /**
   * 1. generate()
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const model = options.modelId || this.defaultModelId;

    if (!this.isConfigured()) {
      return {
        text: `[Angel AI Offline Fallback]: GEMINI_API_KEY is pending configuration. Request received: "${options.prompt.slice(0, 80)}". Configure API credentials in Settings > Secrets to activate live model synthesis.`,
        provider: this.id,
        modelId: model,
      };
    }

    try {
      const ai = this.getClient();
      const contents = this.formatContents(options.prompt, options.conversationHistory);

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction:
            options.systemInstruction ||
            'You are Angel, a calm, disciplined, hyper-capable personal AI operating environment. Answer concisely and with clear markdown structure.',
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens,
          topP: options.topP,
        },
      });

      const text = response.text || '';
      const usage = response.usageMetadata;

      return {
        text,
        provider: this.id,
        modelId: model,
        tokensUsed: usage
          ? {
              promptTokens: usage.promptTokenCount || 0,
              completionTokens: usage.candidatesTokenCount || 0,
              totalTokens: usage.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (err) {
      console.error('[GeminiProvider.generate error]', err);
      throw new Error(`Gemini Provider generate error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * 2. stream()
   */
  async stream(options: StreamOptions, onChunk: (chunk: string) => void): Promise<string> {
    const model = options.modelId || this.defaultModelId;

    if (!this.isConfigured()) {
      const fallback = `[Angel AI Offline Fallback]: GEMINI_API_KEY is not configured. Received query: "${options.prompt}".`;
      onChunk(fallback);
      return fallback;
    }

    try {
      const ai = this.getClient();
      const contents = this.formatContents(options.prompt, options.conversationHistory);

      const streamResponse = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens,
        },
      });

      let fullText = '';
      for await (const chunk of streamResponse) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }

      return fullText;
    } catch (err) {
      console.error('[GeminiProvider.stream error]', err);
      throw new Error(`Gemini Provider stream error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * 3. structuredOutput()
   */
  async structuredOutput<T = unknown>(options: StructuredOutputOptions<T>): Promise<T> {
    const model = options.modelId || this.defaultModelId;

    if (!this.isConfigured()) {
      throw new Error('GeminiProvider cannot produce structured output: GEMINI_API_KEY is not configured.');
    }

    try {
      const ai = this.getClient();
      const contents = this.formatContents(options.prompt, options.conversationHistory);
      const convertedSchema = this.convertToGeminiSchema(options.jsonSchema);

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.2, // lower temperature for deterministic structure
          responseMimeType: 'application/json',
          responseSchema: convertedSchema as any,
        },
      });

      const rawText = response.text?.trim() || '{}';
      try {
        const parsed = JSON.parse(rawText) as T;
        return parsed;
      } catch (parseErr) {
        console.error('[GeminiProvider.structuredOutput JSON parse error]', parseErr, rawText);
        throw new Error(`Failed to parse model output as JSON: ${rawText}`);
      }
    } catch (err) {
      console.error('[GeminiProvider.structuredOutput error]', err);
      throw new Error(`Gemini Provider structuredOutput error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * 4. toolCall()
   */
  async toolCall(options: ToolCallOptions): Promise<ToolCallResult> {
    const model = options.modelId || this.defaultModelId;

    if (!this.isConfigured()) {
      return {
        text: `[Offline Mode] Tool call dispatch skipped because GEMINI_API_KEY is not configured.`,
        toolCalls: [],
        provider: this.id,
        modelId: model,
      };
    }

    try {
      const ai = this.getClient();
      const contents = this.formatContents(options.prompt, options.conversationHistory);
      const functionDeclarations = this.convertTools(options.tools);

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction:
            options.systemInstruction ||
            'You are Angel. When the user prompt requires a tool to be called, invoke the appropriate function with accurate parameters.',
          temperature: options.temperature ?? 0.3,
          tools: [{ functionDeclarations }],
        },
      });

      const extractedToolCalls: ToolCallRequest[] = [];
      const functionCalls = response.functionCalls;

      if (functionCalls && Array.isArray(functionCalls)) {
        for (const call of functionCalls) {
          extractedToolCalls.push({
            id: (call as any).id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: call.name || 'unknown_tool',
            args: (call.args as Record<string, unknown>) || {},
          });
        }
      }

      return {
        text: response.text || undefined,
        toolCalls: extractedToolCalls,
        provider: this.id,
        modelId: model,
      };
    } catch (err) {
      console.error('[GeminiProvider.toolCall error]', err);
      throw new Error(`Gemini Provider toolCall error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * 5. vision()
   */
  async vision(options: VisionOptions): Promise<VisionResult> {
    const model = options.modelId || this.defaultModelId;

    if (!this.isConfigured()) {
      return {
        analysis:
          '### Multimodal Visual Understanding (Pending Configuration)\n\nVisual frame was captured and formatted successfully by Angel.\n\nHowever, live multimodal visual reasoning with Gemini 3.8 Flash is currently **Pending Configuration**:\n- **Missing Key**: `GEMINI_API_KEY` is not present in server environment.\n- **Action Required**: Configure your Gemini API key in **Settings > API & Model Routing** to activate real-time frame comprehension.\n\n*Note*: Visual capture pipeline, device selection, bounding box cropping, and multimodal context bridging are active and functional.',
        provider: this.id,
        modelId: model,
        isPendingConfig: true,
      };
    }

    try {
      const ai = this.getClient();
      const cleanBase64 = options.base64Data.includes('base64,')
        ? options.base64Data.split('base64,')[1]
        : options.base64Data;

      const imagePart = {
        inlineData: {
          mimeType: options.mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };

      const textPart = {
        text: options.prompt || 'Inspect this frame and describe what is visible, highlighting any notable items or UI elements.',
      };

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [imagePart, textPart],
        },
        config: {
          systemInstruction:
            options.systemInstruction ||
            'You are Optic, Angel AI multimodal visual intelligence. Be concise, accurate, and structured.',
        },
      });

      return {
        analysis: response.text || 'No visual analysis produced.',
        provider: this.id,
        modelId: model,
      };
    } catch (err) {
      console.error('[GeminiProvider.vision error]', err);
      throw new Error(`Gemini Provider vision error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * 6. embeddings()
   */
  async embeddings(texts: string[] | string): Promise<number[][]> {
    const inputTexts = Array.isArray(texts) ? texts : [texts];

    if (!this.isConfigured()) {
      // Deterministic pseudo-embedding for offline/test environments
      return inputTexts.map((txt) => {
        const vector: number[] = new Array(64).fill(0);
        for (let i = 0; i < txt.length; i++) {
          vector[i % 64] += txt.charCodeAt(i) / 1000;
        }
        return vector;
      });
    }

    try {
      const ai = this.getClient();
      const results: number[][] = [];

      for (const text of inputTexts) {
        const response = await ai.models.embedContent({
          model: this.embeddingModelId,
          contents: text,
        });

        const values = (response as any).embedding?.values || [];
        results.push(values);
      }

      return results;
    } catch (err) {
      console.error('[GeminiProvider.embeddings error]', err);
      throw new Error(`Gemini Provider embeddings error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
