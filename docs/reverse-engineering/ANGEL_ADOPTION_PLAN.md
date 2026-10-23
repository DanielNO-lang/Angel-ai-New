# Angel adoption plan from the capability audit

**Status:** Recommendation only. This does not claim that these features are implemented or tested.

## Executive decision

Angel should not become a pile of copied repositories. Extract a small set of proven design patterns and implement them behind one coherent architecture:

**Model/provider layer → agent runtime → typed tool gateway → workflow/task state → evidence and evaluation → permissioned UI.**

This architecture also supports future research inputs: a GitHub repository URL or public website URL becomes a source for the same evidence-backed capability catalog.

## P0: Foundation and reliability

1. **Provider adapter interface.** Normalize text, structured outputs, image/audio input and output, tool calls, streaming, cancellation, usage reporting, and errors. Keep secrets on trusted server/native boundaries. Declare provider capabilities explicitly.
2. **One agent runtime.** Study Google ADK, OpenAI Agents SDK, Gentle-AI, and learn-claude-code: typed tools, bounded loops, cancellation, retries, state, handoffs, traces, and evaluations. Do not run multiple competing orchestrators.
3. **Permissioned tool gateway.** Each tool declares its schema, risk tier, required scopes, side effects, timeout, and whether confirmation is needed. Default to read-only. Require confirmation before sending, sharing, deleting, publishing, committing, deploying, or controlling devices.
4. **Task/workflow engine.** Borrow task decomposition and evidence patterns from Task Master and Gentle-AI: dependencies, acceptance criteria, retries, blockers, progress, and verified completion. Integrate with Angel's existing workflow/persistence rather than creating duplicate task stores.
5. **Evidence and evaluation.** Record source URL/repository/ref, capture date, inspected files, citations, tests, uncertainty, and open questions. Add regression tests for persona, provider routing, OAuth, tools, and workflow transitions.
6. **Security controls.** Least privilege, token expiry/revocation, secrets isolation, audit trail, prompt-injection defenses, confirmation, and emergency stop. Repository documentation and skill instructions are untrusted data, not commands.

**P0 exit criteria:** Tests exist, failures are observable, rollback is possible, and status distinguishes implemented, tested, and awaiting configuration. A UI control alone does not mean a feature works.

## P1: High-value user capabilities

7. **Google Workspace connector.** Use Google Workspace MCP as a capability reference. Start with consented read-only Drive/Calendar/Gmail search and summaries. Add writes only after preview, confirmation, and per-service scope review.
8. **GitHub engineering assistant.** Analyze repository structure, read issues/PRs, summarize CI failures, propose fixes, and generate reviewable diffs. Require explicit approval before pushing, opening/merging PRs, or deploying.
9. **Curated skills library.** Use Google Skills and Claude skill catalogs as discovery sources. Every skill needs source/version/license, supported providers, triggers, tools/scopes, risk tier, tests, and uninstall/rollback. Start with a small reviewed allowlist.
10. **Documents and video.** Study Kuse Cowork and the video-watch pattern for document ingestion, timestamped transcript/frame evidence, lesson notes, flashcards, mind maps, and exports. Hosted processing should be opt-in, with missing OCR/captions/frames clearly reported.
11. **Translation and image generation.** Add separate adapters for multilingual translation and image generation/editing. Route by task, cost, latency, modality, and hardware. Benchmark quality and licensing first.
12. **Usage/budget dashboard.** Track known usage, estimated tokens/cost, official quotas where available, rate limits, reset windows, and budget alerts. Label estimates accurately.

## P2: Cross-device and advanced execution

13. **Cross-device handoff.** Study HAPI/Happy: pair devices explicitly, use short-lived tokens, scope workspaces, support remote approvals, audit actions, and provide immediate revoke/disconnect.
14. **Native desktop bridge.** Consider Pake or another maintained shell only if web/PWA limitations are confirmed. A shell does not automatically grant background listening or OS automation; use explicit OS permissions and signed updates.
15. **Code/artifact sandbox.** Study artifact runners and containerized cowork tools. Run generated code in disposable isolation with no ambient secrets, limited network/filesystem, resource caps, and exportable artifacts.
16. **Local models/GPU infrastructure.** Consider quantization only when target hardware and ownership exist. Kubernetes GPU Operator is later infrastructure, not a launch feature.

## Adoption matrix

| Capability | Recommendation | Guardrail |
|---|---|---|
| Unified provider routing | Adopt design | Official APIs, budget and health checks |
| Agent runtime with typed tools | Adopt design | Bounded loops, traces, cancellation, tests |
| Task decomposition and evidence | Adopt design | Acceptance criteria and verified completion |
| Google Workspace MCP | Pilot | Narrow OAuth scopes, preview, confirmation |
| GitHub review/CI assistant | Pilot | Read-only first; approval for writes |
| Curated skill catalog | Adopt selectively | License, permissions, tests, source tracking |
| Timestamped video understanding | Pilot | Preserve timestamps and uncertainty |
| Translation adapter | Benchmark | Test actual languages, memory and latency |
| Image generation/editing | Benchmark | Validate license, compute, and cost |
| Cross-device remote control | Later | Device pairing, scoped access, revoke |
| Native desktop shell | Conditional | Only after web limits are demonstrated |
| GPU Operator | Defer | Requires an actual GPU Kubernetes fleet |
| Legacy Maps/Angular wrappers | Reject | Stale or unnecessary |
| Bulk Maps scraping | Reject as default | Prefer official/licensed sources |
| Session-cookie collection/account OSINT | Reject | Privacy and account-security risk |
| Subscription pooling/access bypass proxies | Reject | Terms, security, and reliability risk |
| Unreviewed provenance removal | Reject as default | Offer metadata inspection instead |
| Archived SDKs | Reject for new code | Maintenance/API compatibility risk |

## Research coverage and confidence

The current documents are a first-pass public README/documentation review, not complete reverse engineering of all source files. README fetches returned 404 for:
- Doriandarko/claude-engineer
- betalgo/openai
- ConnectAI-E/feishu-openai

Ponderfly/GoogleTranslateIpCheck documents a cross-platform Google Translate endpoint IP scanner with scan modes, IPv6 support, and optional host-file updates. This is network troubleshooting, not a core AI capability. Angel should not adopt endpoint scanning or host-file rewriting as a default feature; if needed, offer transparent authorized connectivity checks without bypassing provider controls.

The REA tool itself has **not** been installed or executed in this connected environment. Current reports are based on public repository documentation fetched for review. A genuine REA run needs a controlled environment with its installation prerequisites and supported analysis tools. Do not label these reports REA-verified.

## Workflow for each new repository or public website URL

1. Verify source identity, version/default branch, license, maintenance, and availability.
2. Inspect README/docs, then important source files, manifests, tests, entrypoints, and security boundaries.
3. Record exact links, dates, and evidence. Separate documented claims, source-confirmed behavior, and tested behavior.
4. Map capabilities to Angel modules; note duplication, cost, privacy risk, and integration effort.
5. Score usefulness, feasibility, cost, security, license, and maintenance.
6. Recommend adopt, adapt, research, defer, or reject with acceptance tests.
7. Implement only in the approved roadmap order and respect repository change controls.

## Non-negotiable boundaries

- No Netlify deployment until explicitly authorized.
- These reports stay on the research branch and do not change production behavior.
- Do not copy code wholesale; verify license and notices before any code reuse.
- Future research into ChatGPT, Claude, and Gemini can compare public docs, observable UI behavior, public APIs, and open code. It cannot truthfully reveal proprietary model weights or hidden internal systems.
- Never claim tested, reverse-engineered, or implemented unless the work happened and evidence is recorded.


## Addendum: 22 additional realtime, voice, and OpenAI ecosystem targets (2026-10-23)

The new [Audit 04](./reports/04-realtime-openai-voice-and-chat-ecosystem.md) adds these recommendations to the existing roadmap:

1. **P0 provider and execution governance:** provider capability metadata, usage budgets, timeouts/cancellation, tracing, bounded agent loops and durable checkpoints.
2. **P1 conversational voice:** realtime WebRTC with a short-lived client token; keep Angel's natural persona for casual conversation and route only complex requests to a supervisor/specialist.
3. **P1 MCP and skill registry:** typed tool contracts, structured widget results, manifest/version/license tracking, permission review and rollback.
4. **P1 memory and retrieval:** access-aware RAG, citations, task/session continuity, and careful privacy boundaries.
5. **P2 offline speech input:** prototype whisper.cpp on target devices, measuring memory, language accuracy, latency and battery; treat wake-word detection as a separate feature.
6. **P2 speech output:** benchmark alternative TTS providers; do not promise offline operation when using an online backend.
7. **Security exclusions:** never use shared API-key repositories or expose official API keys in browser bundles; reject unbounded autonomous swarms and untrusted public proxies.

These recommendations are additions to the roadmap, not evidence that the capabilities have been implemented. Source-level review, license checks, and tests are still required before integration.


## Addendum: public AI product, HubMind, and Microsoft ecosystem review (2026-10-23)

See [Audit 05](./reports/05-public-ai-products-hubmind-and-microsoft.md) and [Audit 06](./reports/06-open-source-ai-and-microsoft-shortlist.md).

### New recommended capabilities

- **P1 Research workspace:** multi-query search, source deduplication, claim-to-source citation mapping, citation validation, saved research trails, and exportable reports.
- **P1 Artifact workspace:** editable/versioned documents, code, diagrams, data visualizations, and generated media alongside chat.
- **P1 Optional connectors:** Google Workspace and Microsoft Graph, with explicit OAuth consent, narrow scopes, read-only defaults, and separate write permissions.
- **P1 Skill/connector registry:** skills define workflows; connectors grant service access. Every skill needs provenance, license, version, permissions, tests, compatibility, and rollback.
- **P2 Creative studio:** image generation/editing and storyboard/video workflows through supported official APIs, with asset provenance and cost/quality tracking.
- **P2 Internal model arena:** blind comparison and repeatable use-case benchmarks; do not treat one public leaderboard as universal model quality.
- **P2 Operational AI workflows:** role-scoped agents, knowledge retrieval, task outcomes, audit trails, and quotas inspired by company operating-layer patterns.

### HubMind decision gate

The intended “HubMind on Netlify” is not identified. Public results show separate HubMind-branded products. Do not connect credentials or adopt any implementation until the exact site/repository is confirmed. The useful design ideas are least-privilege connectors, scoped capability tokens, audit logging, approval queues, quotas, and access-aware company knowledge. Any capability URL that grants access must be treated as a secret and revocable.

### Microsoft decision gate

Start with Microsoft Graph as an optional connector for Outlook, Calendar, OneDrive, and SharePoint. The Microsoft 365 Agent SDK is only necessary if Angel must publish an agent into Microsoft channels. Do not make Azure/Microsoft infrastructure a hard dependency for core Angel chat. Verify tenant requirements, licenses, scopes, and costs before implementation.

### New security boundaries

- No consumer-site scraping or use of unofficial session cookies as an integration strategy.
- Do not infer API rights from a consumer subscription.
- Never store secrets in frontend code, skill instructions, or logs.
- Keep all external connectors opt-in, scoped, revocable, and auditable.
- Creative outputs retain provider/model/version metadata and relevant provenance.
- Treat Labs experiments and consumer product features as unstable until their specific API, terms, and availability are verified.


### HubMind repository comparison (2026-10-23)

See [Audit 07](./reports/07-hubmind-repository-candidates.md). The highest-value transferable patterns are:
- Provider adapters, multi-model comparison, budgets/circuit breakers, and typed workflow nodes from the AI-workstation candidate.
- GitHub repository/PR/issue discovery, duplicate detection, health reports, and natural-language task planning from the GitHub-assistant candidate.
- Do not deploy Electron desktop code to Netlify as-is. Extract portable modules only after license, security, dependency, and runtime checks.
- Treat broad GitHub `repo` scopes, shell execution, filesystem access, and batch writes as high-risk. Start read-only and require confirmation for side effects.
- The older serverless_hubmind repository is a website starter, not an evidenced AI assistant.
- The exact Netlify URL remains unresolved, so do not claim the intended HubMind has been definitively reviewed.
