/**
 * ANGEL AI — Multi-Model Provider Abstraction Layer
 * Defines the unified AIProvider interface and standardized data contracts.
 * Isolates model provider mechanics (Gemini, Anthropic, OpenAI, etc.) from the rest of the application.
 */

export interface ProviderMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ModelToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  outputSchema?: {
    type: string;
    description?: string;
    properties?: Record<string, unknown>;
  };
}

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  conversationHistory?: ProviderMessage[];
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface GenerateResult {
  text: string;
  provider: string;
  modelId: string;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface StreamOptions {
  prompt: string;
  systemInstruction?: string;
  conversationHistory?: ProviderMessage[];
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StructuredOutputOptions<T = unknown> {
  prompt: string;
  systemInstruction?: string;
  conversationHistory?: ProviderMessage[];
  modelId?: string;
  temperature?: number;
  jsonSchema: Record<string, unknown>;
  schemaName?: string;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolCallOptions {
  prompt: string;
  systemInstruction?: string;
  conversationHistory?: ProviderMessage[];
  tools: ModelToolDefinition[];
  modelId?: string;
  temperature?: number;
  toolChoice?: 'auto' | 'any' | 'none';
}

export interface ToolCallResult {
  text?: string;
  toolCalls: ToolCallRequest[];
  provider: string;
  modelId: string;
}

export interface VisionOptions {
  base64Data: string;
  mimeType: string;
  prompt: string;
  systemInstruction?: string;
  modelId?: string;
}

export interface VisionResult {
  analysis: string;
  provider: string;
  modelId: string;
  isPendingConfig?: boolean;
}

export interface EmbeddingOptions {
  texts: string[];
  modelId?: string;
  dimensions?: number;
}

export interface EmbeddingResult {
  embeddings: number[][];
  modelId: string;
  dimensions: number;
}

/**
 * Universal AI Provider Interface
 * Must be implemented by any concrete model provider (Gemini, OpenAI, Anthropic, etc.).
 * Nothing outside provider implementations should ever call underlying provider SDKs directly.
 */
export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly defaultModelId: string;

  isConfigured(): boolean;

  /**
   * Generates a complete text completion.
   */
  generate(options: GenerateOptions): Promise<GenerateResult>;

  /**
   * Streams generation chunks back through the provided callback.
   */
  stream(options: StreamOptions, onChunk: (chunk: string) => void): Promise<string>;

  /**
   * Enforces strict structured JSON schema output from the model.
   */
  structuredOutput<T = unknown>(options: StructuredOutputOptions<T>): Promise<T>;

  /**
   * Evaluates prompt against discoverable tool definitions and extracts model function calls.
   */
  toolCall(options: ToolCallOptions): Promise<ToolCallResult>;

  /**
   * Evaluates multimodal visual frames with contextual prompts.
   */
  vision(options: VisionOptions): Promise<VisionResult>;

  /**
   * Generates dense vector embeddings for semantic similarity and memory retrieval.
   */
  embeddings(texts: string[] | string): Promise<number[][]>;
}
