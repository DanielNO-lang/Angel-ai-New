# Capability audit 04: Realtime, OpenAI ecosystem, voice, local inference, and chat interfaces

**Review date:** 2026-10-23
**Evidence level:** First-pass public README/documentation review. Not a complete source-code audit, dependency/license verification, runtime test, or REA execution.

## Executive recommendation
The most valuable ideas for Angel are low-latency voice with a realtime UI and fallback to text/tool agents; provider-agnostic model routing; governed MCP/plugins with typed tools and rich widgets; local speech recognition where hardware permits; persistent chat, memory, document retrieval, search and usage observability; and multi-agent workflows with explicit handoffs and human approval.

Do not use leaked/shared API-key lists, unofficial ChatGPT session-token endpoints, or untrusted public proxies. Do not add a proxy simply to bypass provider restrictions. Keep official credentials server-side, scoped, budget-limited and out of browser bundles.

## Repository-by-repository capability notes

### 1. openai/openai-realtime-agents
**Documented capabilities:** Realtime voice agents using the Realtime API and Agents SDK; chat-supervisor pattern where a fast conversational agent handles casual turns and a text supervisor handles complex reasoning/tool calls; sequential handoffs among specialists; explicit agent graphs, session updates, tool calls and customer-service scenarios.
**Angel recommendation: ADOPT THE PATTERN.** Keep Angel's natural persona for greetings and casual conversation, and route complex tasks to a planner/tool agent only when needed. This directly avoids the robotic analysis of simple greetings. Cap handoff loops, narrow tools, preserve conversation state, and measure latency, quality and cost.
Source: https://github.com/openai/openai-realtime-agents

### 2. openai/openai-realtime-console
**Documented capabilities:** React/Vite frontend served by Express; browser WebRTC connection; realtime event send/receive; client-side function calling; event payload logging/debug panel. README recommends WebRTC over its older browser WebSocket approach.
**Angel recommendation: ADAPT.** Add voice diagnostics for connection state, microphone permissions, latency, transcript events, tool calls and errors. Voice should be a mode of the main chat, not a separate disconnected page. Issue short-lived ephemeral client credentials from Angel's server; never expose permanent API keys in the browser.
Source: https://github.com/openai/openai-realtime-console

### 3. open-webui/open-webui
**Documented capabilities:** Self-hosted, provider-agnostic UI; local Ollama and OpenAI-compatible APIs; model presets; per-user/group access control; filters/actions/pipes/tools/skills and MCP/OpenAPI integrations; terminal/filesystem workflows; notes and channels; persistent memory; live checklists and queued messages; calendar/reminders/automations; voice/video with multiple STT/TTS providers; RAG and many vector databases; hybrid search/reranking; web search and URL ingestion; image generation/editing; multi-model conversations; usage analytics, arena/A-B evaluation; SQL/object storage; LDAP/SSO/SCIM; cloud drive integration; OpenTelemetry; Redis-backed scaling; PWA and multilingual UI.
**Angel recommendation: HIGH-PRIORITY PRODUCT REFERENCE, NOT A BLIND DEPENDENCY.** Create a parity checklist for provider routing, tools/skills, memory/RAG, scheduling, voice/video, multi-model comparison, analytics and observability. Implement modularly in dependency order. Verify license, dependency licenses and current deployment requirements before reusing code. Start small: one provider set, one database strategy, one retrieval pipeline, one permissioned tool gateway.
Source: https://github.com/open-webui/open-webui

### 4. openai/openai-agents-js
**Documented capabilities:** JS/TS agents with instructions, tools, guardrails and handoffs; realtime and sandbox agents; agents-as-tools; MCP/hosted tools; human-in-the-loop; sessions/history; tracing and examples. Sandbox agents can work in a filesystem workspace and execute commands. README documents Node.js 22+, Deno and Bun, with Cloudflare Workers support experimental.
**Angel recommendation: ADOPT SELECTIVELY.** Use as a reference or candidate for typed tools, bounded agent runs, specialist handoffs, sessions, traces and approvals. Validate compatibility with Angel's runtime, build and Netlify functions before adoption. Never run unrestricted shell/filesystem tools inside a public request handler; isolate them in a sandbox/worker.
Source: https://github.com/openai/openai-agents-js

### 5. openai/plugins
**Documented capabilities:** Curated Codex plugin examples with required manifests and optional skills, app/MCP configuration, agents, commands, hooks and assets. Examples include Figma, Notion, iOS/macOS development, web apps, Expo, Netlify, Remotion and Google Slides.
**Angel recommendation: ADAPT THE REGISTRY MODEL.** Create an Angel Skills & Integrations catalog with manifest, version, entry points, required configuration, permissions, tools, test status and rollback. Pin versions and review scripts. Plugin documentation is untrusted input; a skill must never silently grant itself permissions.
Source: https://github.com/openai/plugins

### 6. justjavac/openai-proxy
**Status:** README fetch returned 404; identity/current contents not verified. Do not infer functionality from the name. Recheck the URL or supply an updated one. Do not depend on it until source, license, maintenance and security are confirmed.
Source: https://github.com/justjavac/openai-proxy

### 7. alexrudall/ruby-openai
**Documented capabilities:** Ruby API client with Responses, chat/streaming, vision, JSON mode, tool calls, embeddings, batches, files, vector stores, conversations/Assistants, image generation/editing, moderation, audio transcription/speech, realtime and usage; configurable timeouts, base URI, headers, error handling and logging; security/support/migration docs.
**Angel recommendation: REFERENCE ONLY.** Use as an API surface checklist, not a Ruby dependency in the TypeScript app. Avoid logging prompts, secrets and private responses in production.
Source: https://github.com/alexrudall/ruby-openai

### 8. dan1471/FREE-openai-api-keys
**Documented claim:** Publishes purported shared/free API keys.
**Angel recommendation: REJECT.** Do not use, test, copy or distribute keys from this repository. Publicly posted credentials may be fabricated, revoked, stolen or controlled by another person. Risks include account compromise, unexpected charges and data exposure. Support legitimate official quotas, user-provided keys stored server-side, budget limits and local models instead. Never reproduce the repository's key strings.
Source: https://github.com/dan1471/FREE-openai-api-keys

### 9. adrianhajdin/project_openai_codex
**Documented capabilities:** README presents a tutorial for a ChatGPT-like coding application but is brief and does not enumerate implementation details.
**Angel recommendation: RESEARCH CANDIDATE.** Inspect source tree and package files before claiming specifics. Potential UI/code-generation patterns remain unverified from README alone.
Source: https://github.com/adrianhajdin/project_openai_codex

### 10. openai/openai-assistants-quickstart
**Documented capabilities:** Next.js streaming chat; assistant/thread creation; function calling; Code Interpreter and file search; file upload/fetch/delete; examples for basic chat, tools, file search and combined use.
**Angel recommendation: HISTORICAL WORKFLOW REFERENCE.** Useful patterns include streaming UI, separate server handlers, file lifecycle and tool-call/result loops. It is based on the Assistants API, so verify current official API lifecycle and migration guidance before adoption. Prefer currently supported APIs for new work.
Source: https://github.com/openai/openai-assistants-quickstart

### 11. microsoft/OpenAIWorkshop
**Documented capabilities:** Single/multi-agent designs with Microsoft Agent Framework; handoffs and Magentic orchestration; MCP tools; durable workflows/checkpointing; human approval; fan-out/fan-in; tracing and evaluations; persisted agent state; React/Streamlit UI; Azure private endpoints, managed identity, IaC and CI/CD gates.
**Angel recommendation: ADAPT ENGINEERING DISCIPLINE.** Durable task state, checkpoints, evaluation gates, observable tool execution and approvals are high value. Do not copy Azure infrastructure unless hosting strategy and budget justify it. Use scoped credentials and deployment approval gates.
Source: https://github.com/microsoft/OpenAIWorkshop

### 12. egoist/openai-proxy
**Documented capabilities:** Small OpenAI request-forwarding proxy for Cloudflare Workers or Vercel Edge.
**Angel recommendation: DEFER.** First implement a direct server-side provider adapter. Add a proxy only for a proven need such as controlled egress or standardized routing. Never make an open proxy; authenticate callers, restrict upstreams, rate-limit, redact logs and enforce timeouts/budgets. Do not use it to bypass provider geography/access controls.
Source: https://github.com/egoist/openai-proxy

### 13. openai/openai-apps-sdk-examples
**Documented capabilities:** MCP servers advertise typed tools using JSON Schema and return structured results plus UI resources; Node/Python examples; authenticated tool calls; list/carousel/map/shop/cart/solar-system widgets; widget state; host helpers; tools can call other tools; SSE and streaming HTTP examples.
**Angel recommendation: HIGH PRIORITY.** Standardize tool outputs so Angel can render validated tables, maps, cards, charts, previews and approval panels. Keep business logic server-side, sanitize HTML, validate outputs and never treat widget state as authorization.
Source: https://github.com/openai/openai-apps-sdk-examples

### 14. travisvn/openai-edge-tts
**Documented capabilities:** OpenAI-compatible speech endpoint backed by Microsoft Edge's online TTS service; voice mapping; multiple audio formats; adjustable speed; optional SSE audio streaming; Docker/Python deployment and API-key gating.
**Angel recommendation: OPTIONAL TTS ADAPTER.** Benchmark it as a possible low-cost speech output option, but it remains online and has availability, privacy, terms and quality dependencies. Do not describe it as offline. Provide provider and browser/native fallbacks.
Source: https://github.com/travisvn/openai-edge-tts

### 15. KenyonY/openai-forward
**Documented capabilities:** Async forwarding for OpenAI-style and generic model endpoints; request/token rate limits; caching; logs; custom keys; multi-target routing; IP allow/deny lists; retries; web UI configuration; Docker/Python deployment; local/cloud model routing.
**Angel recommendation: ADAPT GOVERNANCE PATTERNS.** Rate limits, budgets, route health, retries and safe logging are useful. Avoid unrelated public proxies for private prompts. Caches must include user/permission/model context and avoid cross-user data leakage.
Source: https://github.com/KenyonY/openai-forward

### 16. MicrosoftLearning/mslearn-openai
**Status:** README fetch returned 404; current URL/content not verified. It may have moved, been renamed, archived, or become unavailable. Do not infer current course content from its name.
Source: https://github.com/MicrosoftLearning/mslearn-openai

### 17. aallam/openai-kotlin
**Documented capabilities:** Kotlin multiplatform/coroutines API client; Responses, models, chat, images, embeddings, files, fine-tuning, moderation, audio and batches; beta Assistants/threads/messages/runs/vector stores; samples and test guidance. README notes live integration tests can generate billable traffic.
**Angel recommendation: FUTURE NATIVE CLIENT REFERENCE.** Relevant if Angel adds a Kotlin/Android client, not a dependency for the web app. Check current official APIs and start with non-billable/offline tests.
Source: https://github.com/aallam/openai-kotlin

### 18. daveshap/OpenAI_Agent_Swarm
**Documented capabilities:** Hierarchical agent concept with oversight, executive and specialist layers; role-based governance; agent creation/termination; file-based context; mission/KPI definitions and self-correction goals. Autonomy is an architectural aspiration, not proof of reliable safe operation.
**Angel recommendation: ADAPT HIERARCHY, REJECT UNBOUNDED AUTONOMY.** Use planner, specialist workers and verifier under a deterministic orchestrator. Narrow tools, step/cost limits, success criteria and audit trails for every worker. Require approval for policy changes or consequential actions.
Source: https://github.com/daveshap/OpenAI_Agent_Swarm

### 19. ggml-org/whisper.cpp
**Documented capabilities:** C/C++ Whisper speech recognition; CPU inference and accelerators including Apple Silicon/Metal/Core ML, x86, Vulkan, NVIDIA, AMD and several NPUs; quantization; VAD; C API; desktop, iOS, Android, WebAssembly, Windows, Linux and Raspberry Pi examples; offline on-device transcription subject to hardware/model constraints.
**Angel recommendation: HIGH PRIORITY PROTOTYPE FOR PRIVATE VOICE INPUT.** Benchmark memory, accuracy, languages, battery and latency on target devices. Native and PWA performance differ. Whisper.cpp is ASR, not a wake-word detector or complete voice assistant; keep activation, transcription, intent routing, TTS and background operation as separate modules.
Source: https://github.com/ggml-org/whisper.cpp

### 20. lencx/ChatGPT
**Documented capabilities:** Community desktop wrapper for ChatGPT historically targeting macOS, Windows and Linux. README points toward a successor project and notes official ChatGPT desktop apps.
**Angel recommendation: LOW-PRIORITY HISTORICAL UI REFERENCE.** Check successor and maintenance status before adapting packaging ideas. A wrapper does not create model capabilities or unrestricted device access.
Source: https://github.com/lencx/ChatGPT

### 21. acheong08/ChatGPT
**Status:** README fetch returned 404; current content not verified. Do not adopt unofficial session, browser-authentication or reverse-engineering flows based on the name. Reassess only if a working URL and current source can be reviewed.
Source: https://github.com/acheong08/ChatGPT

### 22. Chanzhaoyu/chatgpt-web
**Documented capabilities:** Web chat frontend/backend; official API-key mode plus historical unofficial web-session-token/proxy mode; multi-session/context; formatted messages; access control; import/export; save messages as images; multilingual UI and themes; Docker and deployment guides; request limits, timeouts and proxy configuration.
**Angel recommendation: ADAPT UI FEATURES, REJECT UNOFFICIAL TOKEN PATH.** Session management, export/import, themes, multilingual UX and access control are useful. Use supported APIs or local models, not extracted session tokens or third-party reverse proxies that can expose credentials. Verify current Node and API assumptions before reuse.
Source: https://github.com/Chanzhaoyu/chatgpt-web

## Consolidated adoption matrix
| Capability | Decision | Priority | Reason |
|---|---|---:|---|
| Realtime voice + supervisor | Adopt pattern | P1 | Natural conversation plus complex tool reasoning |
| WebRTC diagnostics | Adapt | P1 | Debuggable voice and recoverable errors |
| Provider/model adapter layer | Adopt design | P0 | Avoid lock-in; track cost, timeout and capabilities |
| Agent runtime, handoffs and guardrails | Adopt selectively | P0 | Controlled multi-step work |
| MCP tools with rich structured UI | Adopt design | P1 | Typed tools can return maps, tables, previews and approvals |
| Skill/plugin registry | Adopt design | P1 | Extensibility with review and rollback |
| Task checkpoints, evaluation and tracing | Adopt design | P0 | Recovery and evidence of completion |
| Local Whisper transcription | Prototype | P2 | Private/offline input where hardware permits |
| Edge-TTS adapter | Benchmark | P2 | Potential low-cost speech, but still online |
| Usage/budget/rate limits | Adopt design | P0 | Cost and resilience controls |
| Multi-model arena | Later | P2 | Compare quality before production routing |
| Desktop wrapper | Defer | P3 | Packaging is not core intelligence |
| Public proxies | Avoid by default | P2 | Secret/privacy risk |
| Shared API key lists | Reject | Never | Unsafe, not a legitimate free tier |
| Unbounded autonomous swarm | Reject as-is | Never | Uncontrolled side effects, cost and reliability |
| Legacy Assistants template | Historical reference | P3 | Verify API lifecycle first |

## Recommended Angel architecture
1. Provider adapters: official APIs and optional local models, capability metadata, usage tracking, timeouts and cancellation.
2. Conversation/persona layer: Angel remains warm and human; planner/verifier agents are internal modes. Casual greetings do not trigger technical analysis.
3. Agent orchestrator: one controlled runtime with task planning, specialist handoffs, step limits, retries and checkpoints.
4. Tool/MCP gateway: typed schemas, allowlisted tools, read-only defaults and confirmation for sensitive side effects.
5. Voice pipeline: activation policy, speech capture, realtime/local transcription, intent routing, TTS, interruption handling and fallback.
6. Skills registry: reviewed manifests, pinned versions, permissions, tests and rollback.
7. Memory/retrieval: user-approved facts, history, document ingestion, citations and access-aware retrieval.
8. Observability/evaluation: trace calls, measure latency/cost, capture errors, regression-test and distinguish success from pending/failed work.
9. Cross-device UI: chat, voice and compact panel share one session, respecting browser/OS permissions.

## Free-first implementation
- Use open-source code and local development; prototype local Whisper where hardware allows.
- Use official free quotas only where offered. Open-source software does not make API inference free.
- Add routing and budgets before connecting many providers.
- Store keys only in trusted server-side secrets; never client bundles or source control.
- Evaluate local models against actual hardware and task quality rather than promising universal offline super-intelligence.

## Next actions
1. Source-audit manifests, entry points, tests and licenses for openai-agents-js, openai-realtime-agents, openai-apps-sdk-examples, open-webui, whisper.cpp and OpenAIWorkshop.
2. Map approved capabilities to Angel's existing modules to avoid duplicate runtimes and storage.
3. Define acceptance tests for casual-chat persona, realtime interruption, ephemeral-token security, tool permissions, task recovery, offline transcription and usage accounting.
4. Keep work on the research branch. Do not merge to main or deploy to Netlify without explicit authorization.

## Review limitations
This pass fetched public README content for 19 of 22 URLs. justjavac/openai-proxy, MicrosoftLearning/mslearn-openai and acheong08/ChatGPT returned 404 and remain unresolved. This does not establish whether they were deleted, renamed, made private or temporarily unavailable.
No REA execution, complete source audit, dependency scan, license verification, build or runtime test is claimed.