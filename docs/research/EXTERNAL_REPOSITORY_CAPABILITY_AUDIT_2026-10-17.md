# Angel AI external repository capability audit

Date: 2026-10-17
Target repository: DanielNO-lang/Angel-ai-New
Working branch: research/angel-capability-audit-2026-10-17
Deployment policy: GitHub branch only. Do not merge, deploy, or modify Netlify/Supabase configuration without explicit user approval.

## Scope

Reviewed the README-level architecture and intended use of all eight repositories supplied for Angel:
1. https://github.com/QwenLM/Qwen-Image-2.1
2. https://github.com/NVIDIA/Model-Optimizer
3. https://github.com/NVIDIA/gpu-operator
4. https://github.com/google/adk-python
5. https://github.com/alirezarezvani/claude-skills
6. https://github.com/Gentleman-Programming/gentle-ai
7. https://github.com/morluto/rea
8. https://github.com/wheelhouse-project/Wheelhouse

This is an architecture and README review, not a claim that every source file, dependency tree, license obligation, or runtime has been exhaustively tested. Follow-up implementation must inspect the exact relevant files and licenses before copying/adapting code.

## Decisions: what belongs in Angel

### 1. Qwen-Image-2.1: adopt the capability through a provider adapter, not model weights in the web app
Useful product features:
- Text-to-image generation and image editing.
- Transparent/RGBA asset generation and subject extraction.
- Multiple reference images and mask/region-guided editing.
- Preserve user-supplied reference identity where supported.

Implementation direction:
- Keep the browser and Netlify function lightweight. Do not bundle 7B model weights or CUDA dependencies into Netlify.
- Use the official hosted Qwen/Alibaba API when configured, or a separately provisioned GPU inference service. Treat this as an optional image provider behind Angel's provider registry.
- Require server-side credentials, validate image MIME type and size, pass reference images/masks only with user consent, and return provider/job status.
- Do not expose an integration as available until a real provider call succeeds.

### 2. NVIDIA Model Optimizer: infrastructure capability, not a production runtime dependency
Useful concept: model quantization, pruning, distillation, and KV-cache optimization can lower inference cost/latency for self-hosted models.
Decision:
- Document as an optimization path for a future self-hosted GPU inference service.
- Do not install into the Netlify API bundle. It depends on Python/PyTorch/NVIDIA-oriented model workflows and should run in a separate GPU build/deployment environment.
- Benchmark quality and latency before changing production model artifacts.

### 3. NVIDIA GPU Operator: not applicable to Netlify hosting
Useful only if Angel later operates a Kubernetes cluster with NVIDIA GPU nodes.
Decision:
- Do not deploy it or add Kubernetes assumptions to Angel's current Netlify architecture.
- If a GPU service is later adopted, document cluster prerequisites and isolate it from the web/API deployment.

### 4. Google ADK Python: use as an optional external agent runtime
Useful capabilities: deterministic workflows, multi-agent delegation, retries, state, human approval, and MCP/OpenAPI/custom tools.
Implementation direction:
- Keep Angel's existing TypeScript orchestration as the primary web backend unless a measured use case requires ADK.
- If ADK is enabled, run it as a separately deployed Python service with authenticated requests, timeouts, trace/correlation IDs, bounded retries, schema-validated inputs/outputs, and explicit approval gates for consequential actions.
- Do not pretend a bridge is connected merely because code exists. Add a health/capability probe and test a real agent task.

### 5. claude-skills: curated skills catalog, not wholesale import of hundreds of packages
Useful capabilities: modular SKILL.md instructions, domain-specific workflows, reusable checklists and scripts.
Implementation direction:
- Create a reviewed skill registry with metadata, provenance, license, required tools, permissions, and trust level.
- Import only individually reviewed skills that Angel needs. Treat all skill content as untrusted instructions; never let a skill override system policy, leak secrets, or execute scripts without explicit authorization.
- Prefer a compatible skill format and adapter over copying the full repository.
- Require validation and tests for any scripts; restrict filesystem/network access and redact secrets from tool outputs.

### 6. Gentle-AI: adopt evidence-driven agent workflow principles
Useful capabilities: project memory, defined phases, deterministic checklists, evidence of work, and reviewed commits.
Implementation direction:
- Use these principles in Angel's internal task execution: plan, execute in an isolated branch/workspace, run checks, report evidence and unresolved blockers.
- Do not import an external agent's entire runtime blindly. Preserve Angel's own permission model and user experience.
- Every claimed success should be backed by a test/log/result, and deployment remains user-authorized.

### 7. REA: opt-in reverse-engineering tool integration with strict authorization
Useful capability: MCP tools for analyzing binaries, applications, and runtime behavior.
Implementation direction:
- Treat REA as a powerful optional developer tool, not a default enabled tool.
- Require the user to identify/authorize the target and confirm ownership or permission before analysis.
- Isolate analysis jobs, impose resource/time limits, and never execute unknown binaries on the API host.
- Inspect the MCP contract and tool schemas before registering any tools. Expose a minimal allowlisted subset and record audit events.

### 8. Wheelhouse: voice control and accessibility inspiration, not a direct web dependency
Useful capabilities: voice dictation, spoken punctuation, keyboard/window control, named/numbered control selection, editable command patterns, and checking that the focused control accepts text.
Implementation direction:
- Translate compatible ideas into Angel's permissioned voice/visual interaction model: dictation, customizable voice commands, accessible control targeting, and a confirmation boundary before consequential actions.
- Wheelhouse is a Windows desktop application; do not claim its local keyboard/mouse/window-control functionality works in Angel's browser or on mobile without a separate native/desktop agent.
- Keep OS-level control in a separately installed, explicitly permissioned local companion, if built. Use visible indicators, scoped permissions, stop controls, and logs.

## Cross-cutting architecture recommendations

1. Provider adapters: image generation, LLMs, speech, translation and external agent runtimes are optional adapters with capability probes.
2. MCP: discover tools from a configured server, validate schemas, require allowlists and permission checks, apply per-tool timeouts, and return structured results with provenance.
3. Skills: metadata + version + source/license + permissions + integrity hash + validation status. Never auto-execute downloaded scripts.
4. Voice/desktop: browser permissions do not grant OS-level control. Separate web microphone/camera/screen-share permissions from any local companion's keyboard/mouse authority.
5. Background jobs: persist job state, retries, cancellation, and progress in durable storage; do not rely on in-memory serverless state.
6. Observability: correlate request ID, job ID, provider ID, timing, status, and sanitized error codes. Never log tokens, prompts containing secrets, or private media URLs.
7. Runtime fit: Netlify Functions are suitable for API orchestration, not large GPU model inference, persistent Python workers, Kubernetes operators, or long-running desktop automation.

## Verification plan before merge

- Run TypeScript checks, unit tests, and build in CI for this branch.
- Add targeted tests for integration-status health, missing credentials, provider timeouts, MCP schema validation, and skill permission enforcement.
- Verify Netlify preview health and a real Gemini request only when credentials are already available; do not deploy production.
- Validate Supabase migrations/RLS separately; do not modify production database without approval.
- Report each capability as: implemented, tested, awaiting configuration, or not applicable.

## Explicitly not done

- No third-party repository code has been copied into Angel merely because it exists upstream.
- No GPU/Kubernetes resources have been provisioned.
- No provider secrets have been created or changed.
- No merge to main and no Netlify production deployment have been performed.
