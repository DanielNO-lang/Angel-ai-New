import { getAdkBridgeStatus } from './adkBridgeService';
import { getHyMT2Status } from './hymt2TranslationService';
import { getPythonSandboxStatus } from './pythonExecutionBridge';
import { getQwenImageStatus } from './qwenImageService';
import { listAngelSkills } from './angelSkillsService';

export interface AngelCapabilityStatus {
  id: string;
  name: string;
  category: 'model' | 'agent-runtime' | 'developer-tooling' | 'voice' | 'infrastructure';
  status: 'ready' | 'configured' | 'needs-configuration' | 'external-runtime-required' | 'browser-limited';
  summary: string;
  runtime: string;
  configured: boolean;
  endpoints?: string[];
  notes: string[];
}

export function getAngelCapabilityCatalog(): {
  checkedAt: string;
  hosting: string;
  skillsCount: number;
  capabilities: AngelCapabilityStatus[];
} {
  const qwen = getQwenImageStatus();
  const hymn = getHyMT2Status();
  const adk = getAdkBridgeStatus();
  const python = getPythonSandboxStatus();
  const gpuRuntime = Boolean(process.env.ANGEL_GPU_INFERENCE_BASE_URL?.trim());
  const mcpEnabled = process.env.ANGEL_MCP_ENABLED !== 'false';

  const capabilities: AngelCapabilityStatus[] = [
    {
      id: 'qwen-image-2.1',
      name: 'Qwen Image 2.1',
      category: 'model',
      status: qwen.configured ? 'configured' : 'needs-configuration',
      summary: 'Image generation and reference-image editing through Model Studio hosted inference.',
      runtime: 'Alibaba Cloud Model Studio or compatible hosted endpoint',
      configured: qwen.configured,
      endpoints: ['/api/media/generate-image', '/api/media/edit'],
      notes: ['The endpoint and key must be from the same Model Studio region.', 'Hosted API use is governed by provider terms; self-hosted model weights have a separate license.'],
    },
    {
      id: 'hy-mt2',
      name: 'Tencent Hy-MT2',
      category: 'model',
      status: hymn.configured ? 'configured' : 'needs-configuration',
      summary: 'Specialist multilingual translation with source/target language, style and terminology context.',
      runtime: 'External OpenAI-compatible inference endpoint',
      configured: hymn.configured,
      endpoints: ['/api/translation/status', '/api/translation/translate'],
      notes: ['Netlify does not host the model weights.', 'The model repository URL is not an inference endpoint.'],
    },
    {
      id: 'google-adk-python',
      name: 'Google Agent Development Kit (Python)',
      category: 'agent-runtime',
      status: adk.configured ? 'configured' : 'external-runtime-required',
      summary: 'A remote Python ADK runner for stateful agent sessions and workflow execution.',
      runtime: 'External Python service, recommended Cloud Run or container runtime',
      configured: adk.configured,
      endpoints: ['/api/agents/adk/status', '/api/agents/adk/run'],
      notes: ['The included Python bridge is a separate service, not a Netlify Function.', 'Use a persistent session service before multi-instance production use.'],
    },
    {
      id: 'mcp-gateway',
      name: 'Model Context Protocol gateway',
      category: 'agent-runtime',
      status: mcpEnabled ? 'ready' : 'needs-configuration',
      summary: 'Authenticated streamable-HTTP MCP endpoint exposing allowlisted Angel tools and skill resources.',
      runtime: 'Angel Express API',
      configured: mcpEnabled,
      endpoints: ['/api/mcp'],
      notes: ['A verified Supabase Bearer token is required.', 'Only the tools explicitly listed by Angel are exposed.'],
    },
    {
      id: 'python-sandbox',
      name: 'Isolated Python execution',
      category: 'developer-tooling',
      status: python.configured ? 'configured' : 'external-runtime-required',
      summary: 'Bounded Python execution using a separately deployed disposable sandbox.',
      runtime: 'External isolation service',
      configured: python.configured,
      endpoints: ['/api/python/status', '/api/python/execute'],
      notes: ['Angel never evaluates user code inside the web server.', 'The sandbox must enforce CPU, memory, wall-time, output, filesystem and network limits.'],
    },
    {
      id: 'agent-skills',
      name: 'Angel skills catalog',
      category: 'developer-tooling',
      status: 'ready',
      summary: 'Curated, allowlisted skill prompts that can be attached to agent execution requests.',
      runtime: 'Angel backend',
      configured: true,
      endpoints: ['/api/skills/catalog', '/api/skills/:id'],
      notes: ['The catalog adapts selected practices instead of copying full third-party skill libraries.', 'At most four skills are attached to one agent execution request.'],
    },
    {
      id: 'model-optimization',
      name: 'NVIDIA Model Optimizer',
      category: 'infrastructure',
      status: gpuRuntime ? 'configured' : 'external-runtime-required',
      summary: 'Optimization workflow planning and model serving handoff for quantized/pruned/distilled checkpoints.',
      runtime: 'External GPU build and inference runtime',
      configured: gpuRuntime,
      endpoints: ['/api/integrations/capabilities'],
      notes: ['Quantization and distillation are offline GPU build steps, not per-request Netlify work.', 'No checkpoint is optimized until an external build pipeline is configured.'],
    },
    {
      id: 'gpu-operator',
      name: 'NVIDIA GPU Operator',
      category: 'infrastructure',
      status: 'external-runtime-required',
      summary: 'Operational path for GPU nodes if Angel later runs inference in Kubernetes.',
      runtime: 'Kubernetes cluster with compatible NVIDIA GPU nodes',
      configured: false,
      endpoints: ['/api/integrations/capabilities'],
      notes: ['GPU Operator installs and manages GPU drivers/device plugins/monitoring in Kubernetes.', 'It is not needed for the current Netlify-hosted backend.'],
    },
    {
      id: 'rea-analysis',
      name: 'REA evidence workflow',
      category: 'developer-tooling',
      status: 'ready',
      summary: 'Source-first feature reconstruction with explicit evidence, uncertainty and parity tracking.',
      runtime: 'Angel skills catalog and repository workflows',
      configured: true,
      endpoints: ['/api/skills/evidence-driven-reverse-engineering'],
      notes: ['Native binary or live-runtime inspection requires REA CLI/MCP and the required local analysis engine.', 'Angel does not claim full REA tool parity without a connected REA runtime.'],
    },
    {
      id: 'wheelhouse-voice',
      name: 'Wheelhouse-inspired voice command workflow',
      category: 'voice',
      status: 'browser-limited',
      summary: 'Dictation and intent-aware commands within Angel’s browser workspace.',
      runtime: 'Browser microphone and supported Web Speech APIs',
      configured: true,
      endpoints: ['/api/skills/voice-accessibility-commands'],
      notes: ['Web apps cannot directly control arbitrary desktop windows or inject global keyboard/mouse input.', 'Global desktop control requires a user-installed native companion with explicit permissions.'],
    },
    {
      id: 'gentle-ai-workflow',
      name: 'Evidence-first resumable development workflow',
      category: 'developer-tooling',
      status: 'ready',
      summary: 'Scoped plans, checkpoints, test-first verification and honest completion receipts.',
      runtime: 'Angel agent skill pack',
      configured: true,
      endpoints: ['/api/skills/agent-workflow-designer', '/api/skills/test-first-debugging'],
      notes: ['This provides workflow guidance, not automatic Git writes or independent proof of deployment.'],
    },
  ];

  return {
    checkedAt: new Date().toISOString(),
    hosting: 'Netlify Functions + external model/agent runtimes where required',
    skillsCount: listAngelSkills().length,
    capabilities,
  };
}
