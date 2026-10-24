/**
 * ANGEL AI — Universal Model Registry & Capabilities Catalog
 * Defines real model metadata, multimodal capabilities, context windows,
 * and cost/token attributes across Gemini, OpenAI, Anthropic, and Local models.
 */

export interface ModelCapability {
  vision: boolean;
  audioInput: boolean;
  audioOutput: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
  streaming: boolean;
  embeddings: boolean;
  thinking: boolean;
}

export interface ModelMetadata {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'local' | 'qwen' | 'nvidia-nim';
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: ModelCapability;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  isAvailable: boolean;
  isDefault?: boolean;
  tier: 'free' | 'pro' | 'enterprise';
}

export const UNIVERSAL_MODEL_CATALOG: ModelMetadata[] = [
  // Google Gemini Models
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    description: 'Next-gen workhorse for multimodal reasoning, high-speed streaming, and complex tool orchestration.',
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    capabilities: {
      vision: true,
      audioInput: true,
      audioOutput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      embeddings: false,
      thinking: true,
    },
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004,
    isAvailable: true,
    isDefault: true,
    tier: 'free',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    provider: 'gemini',
    description: 'Preview reasoning model for deep technical analysis, complex problem solving, and multi-agent synthesis.',
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    capabilities: {
      vision: true,
      audioInput: true,
      audioOutput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      embeddings: false,
      thinking: true,
    },
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
    isAvailable: true,
    tier: 'pro',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'gemini',
    description: 'Ultra-low latency model optimized for instantaneous conversational turns and high-throughput routing.',
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    capabilities: {
      vision: true,
      audioInput: false,
      audioOutput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      embeddings: false,
      thinking: false,
    },
    costPer1kInput: 0.000075,
    costPer1kOutput: 0.0003,
    isAvailable: true,
    tier: 'free',
  },
  {
    id: 'gemini-3.1-flash-image',
    name: 'Gemini 3.1 Flash Image',
    provider: 'gemini',
    description: 'Multimodal generation model for high-resolution asset creation and canvas editing.',
    contextWindow: 131072,
    maxOutputTokens: 4096,
    capabilities: {
      vision: true,
      audioInput: false,
      audioOutput: false,
      toolCalling: false,
      structuredOutput: false,
      streaming: false,
      embeddings: false,
      thinking: false,
    },
    isAvailable: true,
    tier: 'pro',
  },
  {
    id: 'text-embedding-004',
    name: 'Text Embedding 004',
    provider: 'gemini',
    description: '768-dimensional semantic embedding model powering neural memory indexing and similarity retrieval.',
    contextWindow: 2048,
    maxOutputTokens: 768,
    capabilities: {
      vision: false,
      audioInput: false,
      audioOutput: false,
      toolCalling: false,
      structuredOutput: false,
      streaming: false,
      embeddings: true,
      thinking: false,
    },
    isAvailable: true,
    tier: 'free',
  },

  // OpenAI Compatible Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: 'openai',
    description: 'Flagship multimodal model with native reasoning and vision comprehension.',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: {
      vision: true,
      audioInput: false,
      audioOutput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      embeddings: false,
      thinking: false,
    },
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
    isAvailable: false, // Activated when OPENAI_API_KEY is detected
    tier: 'pro',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast, lightweight intelligence model for quick task execution.',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: {
      vision: true,
      audioInput: false,
      audioOutput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      embeddings: false,
      thinking: false,
    },
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    isAvailable: false,
    tier: 'free',
  },

  // Anthropic Compatible Models
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    description: 'Hybrid reasoning model with extended thinking capabilities and deep architectural understanding.',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    capabilities: {
      vision: true,
      audioInput: false,
      audioOutput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      embeddings: false,
      thinking: true,
    },
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    isAvailable: false, // Activated when ANTHROPIC_API_KEY is detected
    tier: 'enterprise',
  },

  // Qwen Image 2.1 (image-only provider; requires Alibaba Cloud Model Studio configuration)
  {
    id: 'qwen-image-2.1-turbo',
    name: 'Qwen Image 2.1 Turbo',
    provider: 'qwen',
    description: 'Fast hosted image generation and reference-image editing, including complex typography and transparent-layer workflows.',
    contextWindow: 4500,
    maxOutputTokens: 1,
    capabilities: {
      vision: true,
      audioInput: false,
      audioOutput: false,
      toolCalling: false,
      structuredOutput: false,
      streaming: false,
      embeddings: false,
      thinking: false,
    },
    isAvailable: false,
    tier: 'pro',
  },
  {
    id: 'qwen-image-2.1-pro',
    name: 'Qwen Image 2.1 Pro',
    provider: 'qwen',
    description: 'Higher-fidelity hosted image generation and editing with up to ten reference images on supported endpoints.',
    contextWindow: 4500,
    maxOutputTokens: 1,
    capabilities: {
      vision: true,
      audioInput: false,
      audioOutput: false,
      toolCalling: false,
      structuredOutput: false,
      streaming: false,
      embeddings: false,
      thinking: false,
    },
    isAvailable: false,
    tier: 'enterprise',
  },

  // NVIDIA NIM (optional hosted or self-hosted OpenAI-compatible inference)
  {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct (NVIDIA NIM)',
    provider: 'nvidia-nim',
    description: 'Optional NVIDIA NIM chat model. Availability depends on NVIDIA endpoint access and the configured model ID.',
    contextWindow: 131072,
    maxOutputTokens: 4096,
    capabilities: {
      vision: false,
      audioInput: false,
      audioOutput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      embeddings: false,
      thinking: false,
    },
    isAvailable: false,
    tier: 'free',
  },

  // Local / Self-Hosted Models
  {
    id: 'llama-3.3-70b-local',
    name: 'Llama 3.3 70B (Local/Ollama)',
    provider: 'local',
    description: 'Self-hosted private model running locally via Ollama or vLLM endpoint without third-party telemetry.',
    contextWindow: 131072,
    maxOutputTokens: 4096,
    capabilities: {
      vision: false,
      audioInput: false,
      audioOutput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      embeddings: false,
      thinking: false,
    },
    isAvailable: false,
    tier: 'free',
  },
];

export function getAvailableModels(configuredProviders: Record<string, boolean>): ModelMetadata[] {
  return UNIVERSAL_MODEL_CATALOG.map((model) => {
    const isConfigured = Boolean(configuredProviders[model.provider]);
    return {
      ...model,
      isAvailable: isConfigured,
    };
  });
}
