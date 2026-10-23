# First-pass capability map: representative targets

- **Date:** 2026-10-23
- **Status:** Initial README/documentation-based mapping only. Not a completed REA run and not a full source-code audit.
- **Rule:** These are capability candidates for Angel, not decisions to adopt dependencies.

## 1. Google Agent Development Kit (ADK Python)

Source: [README](https://github.com/google/adk-python/blob/main/README.md)

### Publicly documented capabilities
- Code-first agent definitions.
- Graph-based workflow runtime with routing, fan-out/fan-in, loops, retries, state, dynamic nodes, nested workflows and human-in-the-loop.
- Agent-to-agent task delegation, including multi-turn and controlled single-turn modes.
- Multi-agent composition.
- Tools via custom functions, OpenAPI specifications and MCP.
- Agent configuration without code.
- Tool confirmation flow.
- Local CLI and development web UI for testing, evaluation, debugging and demonstration.
- Deployment options documented for container/cloud environments.

### Angel opportunity
Build an explicit workflow/task engine with durable task states, controlled delegation, retry policy, tool registry, and human approval. Reuse concepts and public interfaces only after checking license, framework fit, operational cost and compatibility with Angel's TypeScript/Netlify/Supabase stack.

### Key questions for deeper inspection
- Which workflow and session features can be integrated across languages without adopting the whole Python runtime?
- How are state, retries, cancellation and tool failures represented?
- What evaluation primitives can become regression tests for Angel?
- Which parts require Gemini/Google Cloud and which are model/provider-agnostic?

## 2. OpenAI Agents SDK for Python

Source: [README](https://github.com/openai/openai-agents-python/blob/main/README.md)

### Publicly documented capabilities
- Agent instructions, tools, guardrails and handoffs.
- Sandbox agents for longer tasks that inspect files, run commands, apply patches and preserve workspace state.
- Realtime and voice-agent patterns.
- Agents callable as tools and specialist handoffs.
- Human-in-the-loop controls.
- Session history management.
- Tracing of agent runs for debugging and optimization.
- Provider flexibility is described in the README; exact supported providers and feature parity require deeper validation.

### Angel opportunity
Create provider-independent interfaces for specialist agents, tool handoffs, guarded actions, durable sessions, tracing, and sandboxed code tasks. Do not make OpenAI-specific behavior the identity layer or assume every feature works with every model.

### Key questions
- What is supported by the TypeScript SDK versus Python-only packages?
- What is the security boundary for sandbox execution?
- Which tracing data is safe to retain, and how are secrets redacted?
- How are interruptions, timeouts, retries and handoff failures handled?

## 3. Google Workspace MCP

Source: [README](https://github.com/taylorwilsdon/google_workspace_mcp/blob/main/README.md)

### Publicly documented capabilities
- MCP access to Google Workspace services such as Calendar, Drive, Gmail, Docs, Sheets, Slides, Forms, Tasks, Contacts and Chat.
- OAuth 2.1 and multi-user support are described.
- Read-only mode, progressive tool tiers, CLI support and stateless deployment options are documented.
- Local stdio and remote streamable HTTP transports are described.

### Angel opportunity
Provide user-approved workflows over a user's own Workspace account: search, summarize, draft, organize, schedule, and perform edits only with the correct scopes and confirmation rules. Start read-only and least-privilege. Keep each user's OAuth tokens isolated and out of model prompts/logs.

### Key questions
- Which services and tools are available without paid Workspace plans?
- How are scopes selected and refreshed?
- Can every mutation be constrained by per-action approval?
- How are quotas, pagination, partial failure and multi-user isolation handled?
- Does the license and hosting model fit Angel's target deployment?

## 4. Tencent Hunyuan Hy-MT2

Source: [README](https://github.com/Tencent-Hunyuan/Hy-MT2/blob/main/README.md)

### Publicly documented capabilities
- A family of multilingual translation models with model sizes listed as 1.8B, 7B and 30B-A3B.
- Support for translation among 33 languages and multilingual translation instructions is described.
- Multiple quantized/model packaging options are linked.
- The repository references an instruction-following translation benchmark and translator skill.

### Angel opportunity
Add translation as a specialist capability, with model-size routing based on task complexity, privacy requirements and available hardware. Do not assume the larger weights can run economically on Angel's current hosting. Evaluate API, local inference, quantized options, licensing and language-quality tests before integration.

### Key questions
- What are the exact license terms for code and weights?
- What hardware/RAM/VRAM is needed for each quantization?
- Which languages and domain-specific translation pairs are best supported?
- How should translation quality be tested against a fixed benchmark?

## 5. Qwen-Image-2.1

Source: [README](https://github.com/QwenLM/Qwen-Image-2.1/blob/main/README.md)

### Publicly documented capabilities
- Text-to-image generation and image editing.
- Native transparent/RGBA generation and transparent-layer editing are described.
- Up to 10 reference images are described for conditioning.
- Local edits via circles, painted annotations or masks are described.
- Multiple inference ecosystem integrations and a Turbo variant are listed.

### Angel opportunity
Design a media-generation adapter with distinct operations for generate, edit, transparent output and reference-conditioned output. Treat image generation as an optional external/local service with explicit compute and cost estimates. Never promise this model runs inside a free serverless function.

### Key questions
- What are the exact model/code licenses and usage terms?
- What GPU memory, latency and image limits are required?
- Which features are supported by each inference backend?
- Can reference images and user uploads be handled without unnecessary retention?

## 6. Gentle-AI

Source: [README](https://github.com/Gentleman-Programming/gentle-ai/blob/main/README.md)

### Publicly documented capabilities
- A deterministic engineering workflow around an existing coding agent.
- Project memory and reusable workflows.
- Evidence of completed engineering work, with a focus on reviewed commits.
- Integrations across multiple coding-agent environments.

### Angel opportunity
Borrow the operating pattern: durable project decisions, a prescribed engineering workflow, evidence of changes, and a reviewed diff before calling code work complete. This directly supports Angel's requirement that implementation claims be test-backed.

### Key questions
- How is memory scoped per project and updated?
- What evidence is captured for edits and tests?
- How are workflows installed and kept compatible across agents?
- Which integrations are generic versus tied to a particular coding agent?

## Cross-target design conclusions

The first sample points toward shared Angel subsystems rather than dozens of unrelated features:

1. **Provider/model router** for text, translation and image tasks.
2. **Agent/workflow engine** for delegation, task state, retries and approvals.
3. **MCP/tool gateway** for typed tool contracts and controlled integrations.
4. **Workspace connector layer** with OAuth scopes, per-user isolation and audit history.
5. **Engineering agent mode** with repository context, sandbox boundaries, diffs and tests.
6. **Evidence store** that tracks sources, coverage, confidence, limitations and provenance.
7. **Capability catalog** mapping each researched feature to an Angel roadmap stage and test plan.

## Not yet done

No target in this document has been tested by running its code. This report does not assert that the listed repositories have compatible licenses, are safe to install, or can run within Angel's free-tier infrastructure. Those are mandatory follow-up checks before adoption.
