/**
 * Curated Angel skill catalog inspired by reusable, portable agent-skill patterns.
 * These are Angel-authored instructions rather than bulk copies of third-party skill files.
 */
export interface AngelSkill {
  id: string;
  name: string;
  category: 'engineering' | 'agentic' | 'multimodal' | 'accessibility' | 'research';
  description: string;
  sourceRepos: string[];
  instructions: string;
}

const SKILLS: AngelSkill[] = [
  {
    id: 'secure-code-review',
    name: 'Secure Code Review',
    category: 'engineering',
    description: 'Review code for correctness, auth boundaries, secret leakage, unsafe network calls, and regression risk.',
    sourceRepos: ['https://github.com/alirezarezvani/claude-skills', 'https://github.com/Gentleman-Programming/gentle-ai'],
    instructions: [
      'Review the requested change before editing. Identify the behavior contract, security boundaries, and existing tests.',
      'Check authentication/authorization, ownership and RLS, secret exposure, SSRF, injection, resource limits, retries, timeouts, and error redaction where relevant.',
      'Prefer the smallest safe change. Do not claim an integration works merely because configuration or a catalog entry exists.',
      'Add or update a regression test for each meaningful behavior. Run the narrowest relevant test, then build/typecheck if available.',
      'Report verified findings separately from assumptions and unresolved deployment dependencies.',
    ].join('\n'),
  },
  {
    id: 'test-first-debugging',
    name: 'Test-First Debugging',
    category: 'engineering',
    description: 'Reproduce a defect, add a targeted regression test, make it pass, and retain evidence.',
    sourceRepos: ['https://github.com/alirezarezvani/claude-skills', 'https://github.com/Gentleman-Programming/gentle-ai'],
    instructions: [
      'Trace the actual execution path and establish a minimal reproducible failure before changing code.',
      'Write a regression assertion that fails for the observed defect and does not rely on implementation details.',
      'Fix the root cause rather than suppressing the test. Preserve error propagation and visible recovery states.',
      'Run the focused test and broader checks. Capture the exact command, result, and any skipped checks.',
      'Summarize changed files, verification evidence, risks, and the specific conditions needed for production readiness.',
    ].join('\n'),
  },
  {
    id: 'mcp-integration-builder',
    name: 'MCP Integration Builder',
    category: 'agentic',
    description: 'Design interoperable Model Context Protocol tools with typed schemas, auth, bounded execution, and explicit errors.',
    sourceRepos: ['https://github.com/google/adk-python', 'https://github.com/alirezarezvani/claude-skills'],
    instructions: [
      'Use MCP JSON-RPC methods and version negotiation; expose tool name, description and JSON input schema.',
      'Separate discovery from execution. Validate every tool argument against an allowlisted schema before invoking a handler.',
      'Protect user data and paid or mutating operations with verified identity, rate limits and ownership checks.',
      'Never expose secrets in tool results. Convert provider failures into readable tool errors without returning upstream response bodies.',
      'Add tests for initialize, tools/list, tools/call, unknown tools, invalid arguments, unauthenticated calls and upstream failures.',
    ].join('\n'),
  },
  {
    id: 'python-service-engineering',
    name: 'Python Service Engineering',
    category: 'engineering',
    description: 'Build typed Python microservices with validated request contracts, timeouts, isolated execution, and health checks.',
    sourceRepos: ['https://github.com/google/adk-python', 'https://github.com/alirezarezvani/claude-skills'],
    instructions: [
      'Use type-annotated request/response models, explicit configuration, startup validation and a health endpoint.',
      'Keep long-running Python/model work outside short-lived Netlify Functions and expose a narrow authenticated HTTPS contract.',
      'If running user-provided code, use a disposable sandbox with CPU, memory, time, output, filesystem and network limits; never use eval or exec in Angel’s API process.',
      'Bound requests and outputs, normalize errors, redact credentials, and make session/persistence semantics explicit.',
      'Provide unit tests and a reproducible local run command. Document which external runtime still needs deployment.',
    ].join('\n'),
  },
  {
    id: 'agent-workflow-designer',
    name: 'Resumable Agent Workflow Designer',
    category: 'agentic',
    description: 'Plan multi-step agent work as explicit states with approval gates, retries, durable session identity, and evidence.',
    sourceRepos: ['https://github.com/google/adk-python', 'https://github.com/Gentleman-Programming/gentle-ai'],
    instructions: [
      'Break a complex task into ordered steps with clear inputs, outputs, dependencies, and success criteria.',
      'Keep simple understood tasks lightweight. Use a recoverable plan and durable execution record for broad or risky work.',
      'Separate proposal, approval, execution, verification and completion. Never claim a step completed before its result is observed.',
      'Make retries idempotent where possible, preserve session/workflow IDs, and surface partial failure instead of hiding it.',
      'Attach concise evidence for changed behavior, tests, and deployment state.',
    ].join('\n'),
  },
  {
    id: 'evidence-driven-reverse-engineering',
    name: 'Evidence-Driven Reverse Engineering',
    category: 'research',
    description: 'Reconstruct feature behavior from source, tests, runtime observations, and versioned evidence without inventing parity.',
    sourceRepos: ['https://github.com/morluto/rea', 'https://github.com/Gentleman-Programming/gentle-ai'],
    instructions: [
      'Start from the exact target repository, branch and version. Prefer source and tests when they establish behavior; use binary/runtime inspection only where necessary.',
      'Create a feature inventory with evidence references and label each finding implemented, partially implemented, missing, incompatible, or unverified.',
      'For every proposed reconstruction, record input, state transition, side effects, errors, permission boundary, and testable acceptance criteria.',
      'Do not copy proprietary assets or code merely because behavior is visible. Respect source and model licenses; implement interoperable behavior where appropriate.',
      'Test the reconstructed behavior and list known gaps honestly.',
    ].join('\n'),
  },
  {
    id: 'voice-accessibility-commands',
    name: 'Voice Accessibility and Command Safety',
    category: 'accessibility',
    description: 'Implement reliable dictation, intent-aware voice commands, command boundaries, and transparent browser capability limits.',
    sourceRepos: ['https://github.com/wheelhouse-project/Wheelhouse', 'https://github.com/Gentleman-Programming/gentle-ai'],
    instructions: [
      'Separate finalized speech from interim recognition. Deduplicate hypotheses and never act on interim transcript text.',
      'Distinguish an explicit command from the same words embedded in ordinary dictation. Require confirmation for destructive or externally visible actions.',
      'Support corrections, punctuation, keyboard-navigation commands, cancellation, wake phrases, and clear paused/listening/speaking states.',
      'Ignore Angel’s own playback to avoid feedback loops. Do not retain voiceprints/audio by default; describe any speaker verification as best-effort.',
      'A browser cannot safely control arbitrary desktop windows, global mouse/keyboard input or elevated applications. Keep desktop-control features inside a user-installed native companion or report the limitation.',
    ].join('\n'),
  },
  {
    id: 'qwen-image-generation',
    name: 'Image Creation and Editing',
    category: 'multimodal',
    description: 'Use Qwen Image 2.1 for image generation and reference-image editing through a configured hosted inference endpoint.',
    sourceRepos: ['https://github.com/QwenLM/Qwen-Image-2.1'],
    instructions: [
      'Write prompts that specify subject, composition, typography, palette, lighting, texture, aspect ratio and constraints.',
      'For edits, state what must change and what must remain invariant. Use reference images only when the provider and route support them.',
      'Return actual provider URLs or bytes and preserve model/provenance metadata. Never substitute a sample image when generation fails.',
      'Treat model-provider URLs as potentially temporary and persist output bytes to user-owned storage before promising durable retrieval.',
      'The Qwen model-weight license currently restricts use of the released materials to non-commercial purposes unless separate commercial permission is obtained; hosted API use is governed by its own service terms.',
    ].join('\n'),
  },
  {
    id: 'model-serving-optimization',
    name: 'Model Serving and Optimization Planner',
    category: 'engineering',
    description: 'Choose an external serving approach and evaluate quantization, pruning, distillation, and GPU operations.',
    sourceRepos: ['https://github.com/NVIDIA/Model-Optimizer', 'https://github.com/NVIDIA/gpu-operator'],
    instructions: [
      'Do not try to load GPU model weights into a Netlify Function. Separate control-plane API, inference runtime, model artifact storage and GPU infrastructure.',
      'For candidate models, record baseline quality/latency/memory and compare quantization, pruning or distillation with a held-out evaluation before deployment.',
      'Use NVIDIA Model Optimizer as an offline Python/GPU build step where supported, then export an artifact for vLLM, SGLang or TensorRT-LLM.',
      'Use NVIDIA GPU Operator only when the chosen runtime is on a compatible Kubernetes cluster with GPU nodes; it is infrastructure, not an Angel request-time library.',
      'Track model, quantization, driver/runtime versions, GPU requirements, benchmark results and rollback path.',
    ].join('\n'),
  },
  {
    id: 'hymt2-translation',
    name: 'Multilingual Translation Specialist',
    category: 'multimodal',
    description: 'Translate and localize text with terminology, style and structure preservation using Tencent Hy-MT2.',
    sourceRepos: ['https://github.com/Tencent-Hunyuan/Hy-MT2'],
    instructions: [
      'Select the full source/target language names, or request auto-detection. Keep translator instructions separate from the source text.',
      'Preserve placeholders, links, code, markup, keys and delimiters exactly unless the user explicitly asks to translate them.',
      'Use terminology examples and brief context for domain-specific terms. Preserve paragraphs, lists, tone and formatting.',
      'Return the translated result without a preamble. Surface a provider configuration or failure message instead of silently falling back to another model.',
      'Use a hosted or dedicated inference runtime; the Git repository URL is not an inference endpoint.',
    ].join('\n'),
  },
];

export function listAngelSkills(): Omit<AngelSkill, 'instructions'>[] {
  return SKILLS.map(({ instructions: _instructions, ...skill }) => ({ ...skill }));
}

export function getAngelSkill(id: string): AngelSkill | undefined {
  return SKILLS.find((skill) => skill.id === id);
}

export function buildAngelSkillContext(ids: unknown): string {
  if (!Array.isArray(ids)) return '';
  const selected = [...new Set(ids.filter((id): id is string => typeof id === 'string'))]
    .slice(0, 4)
    .map((id) => getAngelSkill(id))
    .filter((skill): skill is AngelSkill => Boolean(skill));
  if (!selected.length) return '';
  return [
    'ANGEL SKILL PACKS (follow only those relevant to the current task):',
    ...selected.map((skill) => `## ${skill.name}\n${skill.instructions}`),
  ].join('\n\n');
}
