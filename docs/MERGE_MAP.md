# Angel AI Merge Map and Backend Delivery Plan

**Baseline:** `DanielNO-lang/Angel-ai-New`  
**Reference repository:** `MercyT-stack/Damien`  
**Decision source:** `Claude-Complete-Reference(1).md`, especially Part V (repository audit), Part VII (Filtered Plan, supersedes Parts II–VI), and Part VIII (voice/device constraints).  
**Rule:** Angel-ai-New remains the product baseline. Damien is a source of selected ideas and patterns, not a codebase to merge wholesale.

## Acceptance rules

1. No feature may report success unless the operation actually succeeded and its result can be verified.
2. Text in web pages, documents, messages, tool output, and memory is untrusted data, not instructions.
3. Any action that sends, spends, deletes, publishes, or changes settings must be protected by a server-side policy and an approval step.
4. Permissions must be derived and checked server-side, never trusted from a client-supplied `permissions`, `allowedTools`, or `userConfirmationGranted` flag.
5. Secrets remain server-side. Never expose API keys, service-role credentials, webhook secrets, or OAuth tokens to the browser.
6. Guest mode must remain a clearly scoped local workspace. Cloud persistence and cross-user data require a real authenticated identity.
7. Mark unsupported, unconfigured, simulated, or preview capabilities honestly. Do not invent news, search results, integration deliveries, or task completion.
8. Preserve Angel's natural, warm, witty character. She does not claim real degrees or licenses; if sincerely asked whether she is AI, she answers honestly.

## Merge ledger

| Capability | Best source | Decision | Guardrails / completion evidence |
|---|---|---|---|
| Product identity and personality | Damien persona patterns + filtered reference | Adopt, rewrite baseline spec | No false credentials or AI denial; conversational, warm, concise; no robotic process narration |
| Streaming chat and persistence | Damien patterns; current Angel server/provider architecture | Adopt selectively | Authenticated ownership checks; stream errors are explicit; persist only to the current user's conversation |
| Memory extraction and summaries | Damien memory extractor | Adopt selectively | Four classes: profile/preferences, facts, episodes, skills; provenance, confidence, sensitivity; validator; memory writes after response; user can inspect/delete |
| Memory retrieval | Current Angel database foundation | Simplify | Start with keyword/full-text relevance + recency and a small top-k; embeddings deferred until a suitable affordable model is verified |
| Grounded web search | Damien Gemini grounding approach | Top priority | Use real Google Search grounding/source metadata; citations and source dates; label confirmed/developing/reported/unconfirmed/rumored; remove constructed-link-only search |
| Tool calling | Current provider abstraction | Replace brittle phrase detection | Use provider-native function calling in the same model interaction; validate every tool schema and permission server-side |
| Agent orchestration | Damien classify/plan/replan/verify patterns + current Angel orchestrator | Simplify/adopt | One-pass for ordinary chat; replan/verify for large tasks; bounded steps, timeout, budget, and honest final status |
| Action permissions | Filtered Autonomy Engine design | Build before meaningful autonomy | Suggest / draft / act-with-approval; server policy, approval record, audit log, pause/stop, kill switch; default deny for sensitive effects |
| External integrations | Damien registry metadata only | Keep metadata, do not port fake executor | Real OAuth/API connector per provider; idempotency, retries, timeout, delivery evidence; “drafted, not sent” until confirmed |
| Webhooks | Current Angel signed webhook service | Keep and harden | Authenticated admin/config routes; constant-time signature check; validate destination URLs; prevent SSRF; redact payloads; bounded retry and audit |
| Voice | Damien + VOICE-MODEL patterns | Free pipeline first; Live deferred | Voice is inside chat; browser recognition + streamed answer + speech synthesis; interruptible; visible mic/camera/screen indicators; device limitations shown |
| Voice biometrics | Damien | Reject as security | Voice is personalization only. Sensitive actions need a secure approval mechanism, not voice recognition |
| Visual perception | Damien vision + current Angel visual flow | Merge selectively | User-granted camera/screen capture only; clear indicator; no background capture claims; mobile browser screen sharing is unsupported, offer screenshot upload |
| PWA/offline sync | Current Angel | Keep selectively | One service-worker strategy; no-cache for service worker and HTML; conflict handling and sync status; no silent overwrite |
| Morning brief/nightly tidy | Filtered plan | Keep lite | Schedule only where hosting supports it; grounded brief, dedupe memories without dropping facts; no always-on long-running jobs on serverless |
| World Pulse/news feed | VOICE-MODEL | Cut as-is | Rebuild only on top of real grounded search; delete invented fallback stories |
| 3D avatar, mood math, model council every reply | Earlier plans/repos | Defer/cut | Not worth latency/cost before core reliability |
| Knowledge connectors | Damien registry patterns | Phase later | Read-only and consent-first; per-connector permission display, last use, and revoke |
| Craft / career skills | Filtered Plan | Add after safety and memory | Start with six skill files: Researcher, Software Engineer, Product/UX Designer, Data Analyst, Writer, Teacher; add more after rubric tests |
| Visual redesign | Filtered presence design, amended by Part VII | Later phase | Keep current usable layout until backend trust and basic flows are stable; no wall of quick-action buttons |

## Findings from source review

### Damien patterns worth mining
- Its server uses Gemini generation/streaming, memory extraction and conversation summaries, embeddings, vision, and classify/plan/replan/verify orchestration.
- Its database migrations were described in the reference audit as having user-scoped RLS for profiles, conversations, messages, memories, voice preferences, and voice sessions. Reuse concepts and migration patterns only after comparing schema and ownership assumptions.
- Its live voice and memory work are useful prototypes, but require adaptation to the current hosting model and verified authentication.

### Known risks to resolve in Angel-ai-New
- `server.ts` exposes many API routes; an explicit route-by-route auth/ownership policy is required before multi-user data or sensitive actions are safe.
- `/api/agent/execute` accepts `allowedTools`, `permissions`, and `memoryAccess` from request data. These must not be treated as authoritative authorization.
- `/api/automation/dispatch` accepts a client-supplied `overrideUrl`; outbound destinations need an allowlist/SSRF guard and admin-only policy.
- `/api/webhooks/inbound` accepts a callback URL from the payload and sends a fetch to it. This needs strict destination validation and a safe callback policy to avoid SSRF.
- The webhook service stores delivery history in memory, so history is lost on cold starts and is not durable audit evidence.
- The Gemini provider has a local fallback response when called without configuration. That response must never be presented as a real model result; callers should return an explicit pending-configuration/error state.
- The orchestrator logs stages and selects tools partly from English keyword checks. Use native model function calls for ordinary tool selection; keep deterministic policies and validators outside the model.
- The current `ANGEL_SPEC.md` describes Angel primarily as an executive workspace. The filtered plan says to rewrite it as a personal AI companion with memory and tools, natural speed, honesty rules, and voice inside chat.

These are code-review findings, not proof of a live production exploit. Confirm route usage and hosting configuration before enabling enforcement that could break guest mode.

## Delivery order

### P0 — Secure and honest baseline
- Audit every API route and classify it as public health, guest-safe, authenticated-user, or admin-only.
- Add server-side authentication and per-record ownership checks to all user-data routes; keep guest data local and isolated.
- Remove production DDL/admin endpoints or guard them with admin authorization.
- Rate-limit costly model and media endpoints; validate request sizes and schemas.
- Disable any workflow that commits generated changes directly to `main`.
- Ensure missing credentials return an explicit non-success status and never a fabricated answer.
- Add tests for unauthenticated access, cross-user access, oversized requests, provider-not-configured, and safe error messages.

### P1 — Durable data foundation
- Verify live Supabase RLS table-by-table before claiming production security.
- Make Supabase the durable source for authenticated conversations/messages and user-owned memories.
- Add memory provenance/source, confidence, sensitivity, and updated timestamps.
- Add ownership constraints for conversation/message relationships and verify them in integration tests.
- Preserve offline/local guest workspaces without syncing them into another account.

### P2 — Fast model pools and function calling
- Fast, Deep, Background pools with provider fallback on transient failures and per-pool usage tracking.
- One model call for normal chat; no router or critic on every message.
- Native function calling in the same stream, with a strict server-side tool registry and permission checks.
- Background memory writes only after the user-facing response completes.

### P3 — Voice in chat
- Composer-level Live toggle, browser speech recognition, streaming answer, speech synthesis, interruption.
- Clear microphone/camera/screen indicators and a plain fallback when browser capabilities or providers are unavailable.
- Gemini Live token/session work only when the hosting and quota support it; no unauthenticated long-lived WebSocket.

### P4 — Grounded search
- Real provider-grounded search with source extraction, dates, and citations.
- Delete constructed-link-only search results and invented news fallbacks.
- Tests verify citations are derived from provider results, not generated URLs.

### P5–P7 — Persona, memory, autonomy
- Persona honesty and prompt-injection boundary.
- Memory validator/provenance, sensitivity exclusion, user-visible sources, temporary chat.
- Server-side policy engine, approvals, audit events, budgets, kill switch, and bounded retries before enabling consequential actions.

### P8–P10 — Presence, evolution, connectors
- Only after P0–P7 are verified: simplify navigation, add command/search, keep mobile-first layout and reduced motion.
- Golden evaluations and versioned skill proposals; Angel may draft a PR but must not merge it.
- Consent-first read-only connectors with explicit permission and revoke controls.

### P11 — Career / craft layer
- Begin with six skill files and rubric-based practice tasks. Add more only after measured evaluations.

## Implemented in the current hardening branch

- Removed the hard-coded demo account and master-password bypass from the server fallback authentication service.
- Production server-side fallback sign-up/sign-in now returns an explicit configuration error rather than issuing an in-memory session that disappears on a serverless cold start.
- Gemini generate/stream paths throw a configuration error instead of fabricating a response when no key is present; model catalog availability now reflects actual provider configuration.
- Added baseline API rate limits and reduced the JSON request size cap.
- Private GitHub/Vercel integrations, automation history/dispatch, the DDL endpoint, and test dispatch require a verified Supabase user whose email is in `ADMIN_EMAILS`. The Connections UI now attaches the active Supabase access token.
- Disabled legacy service-role sync endpoints that lacked verified owner scoping. The client sync path now derives `user_id` from the verified Supabase session, scopes deletes to that owner, and maps task/memory/project/workflow/conversation/message/library/agent records to database columns.
- Changed the public velocity endpoint to calculate from supplied workspace tasks rather than aggregating every user's tasks with a service-role client.
- Replaced the fabricated `web_search` tool responses with a real Google Search grounding service and `/api/search/web` endpoint. Source URLs are extracted from provider grounding metadata; if the provider does not return source metadata, the tool reports failure instead of manufacturing search links.
- Added memory provenance/sensitivity columns to Supabase, persisted those fields in the browser sync mapper, and excluded sensitive memories from automatic model context and ordinary memory retrieval.
- Prevented automatic model tool selection/execution of privileged GitHub, Vercel, and webhook tools; those remain explicit authenticated integration actions.
- Added an owner-scoped SQL migration for core workspace tables and RLS policies, a setup guide, webhook/provider tests, and CI for tests/type-check/build.
- Webhook signature verification uses constant-time comparisons, rejects malformed signatures safely, ignores client-selected outbound destinations, and only attempts callbacks to an explicit HTTPS hostname allowlist.
- Removed the one-off write-enabled workflow that performed scripted UI edits.

## Still not complete

- The owner-scoped migration and the memory provenance/sensitivity migration were applied to the active Angel Supabase project on 2026-10-15 and verified in migration history. Before applying it, the core workspace tables were confirmed empty, so there were no legacy records to reassign. New environments still need the migration applied.
- Vercel Preview for commit `283a95a2af9be70efc73bb3da752217fd8f63ca0` reached READY; `/`, `/api/health`, and `/api/ai/providers` returned HTTP 200. The newest docs-only commit must still finish its Preview deployment. GitHub Actions tests/type-check status has not reported a run, so those checks are not yet confirmed.
- Full route-by-route user authentication is still incomplete for general AI/media/voice endpoints. Rate limits reduce abuse but do not replace user-level quotas or authentication.
- Agent Lab still needs a server-side tool registry, permissions derived from server policy, approvals, durable audit events, budgets, and pause/stop controls before consequential actions can be enabled.
- Real grounded web search and citation extraction are not yet implemented in this slice.
- Durable webhook delivery history/retries and full end-to-end tests are still outstanding.
- The Supabase security advisor still reports leaked-password protection disabled; enable it in the Auth dashboard. It also reports `api_rate_limits` has RLS enabled without a policy, which keeps ordinary user access denied; retain server-only access unless the design changes.

## Definition of done for each capability
- A real implementation exists in the baseline repository.
- Success and failure states are distinguishable and never simulated as success.
- Auth/ownership and approval rules are tested.
- Relevant unit/integration tests pass.
- Build/lint passes and the deployment preview is checked.
- Environment requirements and platform limits are documented.
- No claim of production deployment until the actual deployment is verified.
