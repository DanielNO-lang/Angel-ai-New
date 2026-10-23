# Capability audit 01: Models, agents, and engineering

**Evidence level:** Public README/documentation review. This is not a claim that REA was executed or that every source file, test, dependency, license, and runtime path has been audited. Feature statements are based on repository documentation fetched for this review. Validate exact versions, source, licensing, security, costs, and performance before adoption.

## 1. Tencent-Hunyuan/Hy-MT2
**Capabilities:** Multilingual translation model family in 1.8B, 7B, and 30B-A3B mixture-of-experts sizes; supports 33 languages and instruction-conditioned translation for general, business, and domain-specific tasks. README describes an AngelSlim 1.25-bit quantized 1.8B variant around 440 MB with claimed speed improvements.
**Architecture:** Model weights and inference path distributed through model hubs; model size and quantization are central deployment choices.
**Angel recommendation:** Add a translation provider behind a common model interface for multilingual chat, document translation, lessons, and potentially offline translation. Benchmark language pairs, memory, latency, and quality. Do not assume the smallest quantized model matches a hosted model on every task.

## 2. QwenLM/Qwen-Image-2.1
**Capabilities:** Text-to-image generation and image editing; transparent RGBA output, editing transparent layers, subject extraction, up to 10 reference images, localized edits using circles/painted annotations/masks, and improved text and texture rendering.
**Architecture:** A 7B-parameter visual-generation component with diffusion-transformer layers; README describes mixed-granularity attention and prefix KV-cache reuse.
**Angel recommendation:** Add an image workspace for Angel reactions, transparent assets, lesson illustrations, and editing user-provided images. Keep it behind a provider adapter, protect uploads, and validate licensing, GPU/RAM needs, and cost before promising local generation.

## 3. NVIDIA/Model-Optimizer
**Capabilities:** Quantization, pruning, neural architecture search, distillation, speculative decoding, and sparsity. Accepts Hugging Face, PyTorch, or ONNX models and exports optimized checkpoints for inference.
**Architecture:** Python optimization APIs that compose model transformations and integrate with NVIDIA training/inference tools.
**Angel recommendation:** Reference for future self-hosted model optimization only. It is infrastructure, not a user-facing feature and not something to bundle into Netlify's web runtime. Test quality loss and hardware compatibility.

## 4. NVIDIA/gpu-operator
**Capabilities:** Kubernetes operator automating NVIDIA drivers, CUDA, GPU device plugins, container runtime, node labels, and GPU monitoring.
**Architecture:** Cluster-level operator manages GPU software components on Kubernetes nodes.
**Angel recommendation:** Defer unless Angel operates a Kubernetes GPU fleet. It does not create GPU capacity and adds no value to a small web deployment by itself.

## 5. google/adk-python
**Capabilities:** Code-first framework to build, evaluate, and deploy agents; agent composition, tools, workflow orchestration, evaluation, deployment, sample recipes, and language variants.
**Architecture:** Python agent framework with explicit agent definitions and integrations.
**Angel recommendation:** Study separation of agent definitions, tools, orchestration, and evaluations. Implement in Angel's existing TypeScript stack unless a separate Python service is justified. Compare current APIs, licenses, dependencies, and deployment needs before selecting specific concepts.

## 6. Gentleman-Programming/gentle-ai
**Capabilities:** Deterministic engineering environment for existing agents; emphasizes project memory, workflow, and evidence. README advertises multiple agents and Windows/macOS/Linux support.
**Architecture:** Engineering harness around an agent with repeatable workflow and evidence-oriented execution.
**Angel recommendation:** Strong pattern for Agent Lab: scoped tasks, project context, staged execution, test evidence, reviewable diffs, and commit summaries. Do not permit opaque autonomous edits; require permissions, rollback, and visible test output.

## 7. google-research/google-research
**Capabilities:** Large collection of independent research projects across ML and scientific topics, not one cohesive application or stable product API.
**Architecture:** Many separate project directories with their own requirements, data, methods, and maturity.
**Angel recommendation:** Use as a discovery index for specific algorithms only after defining a problem. Do not integrate the whole repository. Check project-specific license, data terms, and reproducibility.

## 8. anthropics/claude-code
**Capabilities:** Agentic coding tool that understands a local codebase, explains code, performs routine work, and handles Git workflows from terminal, IDE, or GitHub.
**Architecture:** Model plus tool/execution harness and developer interfaces.
**Angel recommendation:** Study project-aware context retrieval, tool permissions, iterative test/fix loops, Git diffs, and progress reporting. Angel code mode must be explicitly enabled and scoped; a web page cannot freely control a user's device without a local bridge and OS permissions.

## 9. claude-code-best/claude-code
**Capabilities:** Third-party project claiming a reimplementation/extension of Claude Code-like behavior, workflow and goal features, and broad configuration compatibility.
**Architecture:** Community coding-agent harness.
**Angel recommendation:** Treat as a hypothesis source for workflow and goal management, not as an authoritative specification of Anthropic internals. Do not adopt account/access-control circumvention or undocumented API workarounds.

## 10. shareAI-lab/learn-claude-code
**Capabilities:** Educational material about agent harness engineering: tools, context, loops, and execution machinery surrounding a model.
**Architecture:** Progressive teaching examples rather than a drop-in production framework.
**Angel recommendation:** Learn the agent loop, tool execution, state, and error recovery, then implement concepts as tested Angel modules. Example code is not automatically production-ready.

## 11. google/skills
**Capabilities:** Reusable agent skills for Google products and technologies, including Cloud authentication/IAM, onboarding, architecture, analytics, and agent deployment.
**Architecture:** Skill packages selected and installed into compatible agent hosts.
**Angel recommendation:** Build a curated Angel Skills catalog with metadata, triggers, required permissions, provider compatibility, versioning, and tests. Treat skill instructions as untrusted until reviewed; never let a skill silently obtain credentials or broaden permissions.

## 12. anthropics/claude-cookbooks
**Capabilities:** Example code and guides for common Claude API tasks and prompt/agent patterns.
**Architecture:** Cookbook examples and notebooks, primarily Python.
**Angel recommendation:** Research structured outputs, retrieval, tools, multimodal inputs, and evaluation. Convert concepts into provider-neutral implementations with tests. Many examples require a paid API key and are not production-hardened.

## 13. eyaltoledano/claude-task-master
**Capabilities:** Task management for AI-driven development, helping decompose work and coordinate task execution across AI chat/coding tools.
**Architecture:** Task records and workflow layered over coding-agent interactions.
**Angel recommendation:** Use the pattern requirements → dependency graph → small tasks → acceptance criteria → progress → verification. Integrate with Angel's existing task/workflow storage instead of duplicating it.

## 14. anthropics/claude-code-action
**Capabilities:** GitHub Action that answers repository questions, reviews pull requests, implements code changes, responds to mentions/assignments, tracks progress, and returns structured results. README documents multiple provider/authentication options.
**Architecture:** CI trigger → agent run → GitHub context/tools → review or patch output.
**Angel recommendation:** Add GitHub issue triage, PR summaries, CI failure analysis, and draft fixes. Start read-only; require approval before pushing, opening, or merging PRs. Scope secrets carefully and treat untrusted PR text as prompt-injection risk.

## 15. anthropics/claude-for-legal
**Capabilities:** Reference agents, skills, and connectors for commercial, privacy, product, corporate, employment, litigation, regulatory, AI governance, IP, and legal education. README emphasizes citations, surfaced jurisdiction assumptions, conservative defaults, and human gates before consequential use.
**Architecture:** Domain-specific skills/connectors portable across supported agent hosts.
**Angel recommendation:** Adopt the design pattern of specialized, source-cited modes and explicit review. Legal outputs must remain drafts/information, not legal conclusions; surface jurisdiction assumptions and require qualified human review.

## 16. google/google-ctf
**Capabilities:** Historical Capture-the-Flag challenges and infrastructure, including intentionally vulnerable environments.
**Architecture:** Challenge directories by year/topic and supporting deployment infrastructure.
**Angel recommendation:** Security education only in isolated, disposable environments. Never run intentionally vulnerable infrastructure on production or a public network.

## 17. openai/openai-agents-python
**Capabilities:** Multi-agent framework with agents, tools, guardrails, handoffs, sandbox agents, voice/realtime pipelines, and tracing/evaluation concepts; supports OpenAI APIs and other model providers.
**Architecture:** Agent definitions + tool/guardrail layer + orchestration/handoffs + traces.
**Angel recommendation:** One of the strongest architecture references for a reliable agent runtime. Adopt typed tools, explicit handoffs, guardrails, traces, and voice workflow separation. Prefer one orchestration layer, not competing frameworks in the same app.

## 18. openai/openai-cookbook
**Capabilities:** Example code and guides for common OpenAI API tasks.
**Architecture:** Cookbook pages and code samples, primarily Python.
**Angel recommendation:** Reference structured outputs, retrieval, tools, multimodal workflows, batch jobs, and evaluations. Examples need security review and tests before production use.

## 19. openai/openai-python
**Capabilities:** Official Python API client with typed request/response models and synchronous/asynchronous clients; README highlights current Responses API patterns.
**Architecture:** API client generated from OpenAPI specifications plus shared transport.
**Angel recommendation:** Use only if Angel has a Python service. For the TypeScript app, use the official TypeScript SDK or a server-side provider adapter. Never expose API keys in browser code.

## 20. PublicAffairs/openai-gemini
**Capabilities:** OpenAI-compatible endpoint backed by Gemini, deployable locally or serverlessly.
**Architecture:** Compatibility proxy translating request/response shapes between client API and Gemini provider.
**Angel recommendation:** Adopt the provider-neutral interface idea, but prefer a native Gemini SDK adapter inside Angel over a third-party proxy by default. Requires a Gemini API key and remains subject to quotas and terms; serverless does not mean unlimited or guaranteed free.

## 21. MacPaw/OpenAI
**Capabilities:** Swift community-maintained implementation of the OpenAI public API; README lists text responses/chat, function calling, tools/MCP, images, and cancellation.
**Architecture:** Swift Package Manager library with typed API wrappers and transport.
**Angel recommendation:** Relevant only for a Swift-native companion app, not the current web app. Validate compatibility before use.

## 22. sashabaranov/go-openai
**Capabilities:** Unofficial Go API client covering Responses, chat, tool calling, embeddings, images, audio, moderation, files, fine-tuning, batches, vector stores, and legacy APIs.
**Architecture:** Go package with typed request/response structures.
**Angel recommendation:** Use only if a Go backend is deliberately chosen. The coverage list is not a reason to introduce another language.

## 23. TheoKanning/openai-java
**Capabilities/status:** Archived/unmaintained Java client for older OpenAI APIs; README warns that Engine-based APIs are deprecated and says the project was archived in 2024.
**Architecture:** Java API models, Retrofit client, service wrapper, and examples.
**Angel recommendation:** Do not adopt for new development; use maintained official SDKs or current APIs.

## 24. betalgo/openai
**Status:** README fetch returned 404 in this pass. Repository identity, default branch, and current features remain unverified.
**Angel recommendation:** No adoption decision until repository identity and source are confirmed.

## What Angel should build from this group
- One agent runtime with typed tools, permissions, cancellation, retries, state, tracing, and measurable evaluations.
- A workflow planner that turns requests into small steps with dependencies and acceptance criteria.
- A project-aware engineering mode with reviewable diffs, tests, and human approval for writes.
- A skill registry with versioning, source/license metadata, permission declarations, and automated tests.
- A provider adapter layer so model choice and fallback do not leak across the UI.
- Specialized modes such as translation, image generation, legal-information drafting, and security education, each with domain-specific guardrails.
- Keep GPU orchestration and local model optimization as later infrastructure work, not launch blockers.
