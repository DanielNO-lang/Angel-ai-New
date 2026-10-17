# Angel AI roadmap implementation status and release gates

Date: 2026-10-17
Branch: `feat/filtered-angel-backend-foundation`
Pull request: #10 (draft)
Production policy: no production deployment, merge, or production-database migration is performed by this workstream.

This document distinguishes code present in the branch from behavior verified by automated checks and from runtime/infrastructure work that still needs approval or external configuration. A successful build does not prove that a browser, Supabase project, provider credential, scheduler, or two physical devices behave correctly in production.

## A. Existing bug-fix workstream (separate from research-derived features)

| Area | Implementation state | Verification / release gate |
| --- | --- | --- |
| Chat request lifecycle | Failed requests remain visible and offer retry; server stream failures and empty results are surfaced. | Exercise network disconnect, timeouts, provider errors, empty streams and retry without duplicate user messages. |
| Shared backdrop/theme | Single low-opacity shared brand layer, calmer global transitions and reduced-motion treatment. | Visual regression across Home, Chat, Settings, Memory, Library, Research, Automation and small mobile screens. |
| Sidebar and gestures | Collapsed sidebar preview overlays rather than pushing the workspace; edge-swipe opening is limited to Home and Chat. | Verify on touch hardware and ensure section back control restores the sidebar in other views. |
| Creation suggestions | Three randomized compact suggestions route to relevant capabilities. | Confirm every destination consumes only a fresh matching handoff and never runs an external action automatically. |
| Settings and behavior | Navigation includes account/profile, appearance/theme, workspace, voice, visual mode, memory, notifications, connections, skills, plugins and security; conversational delivery sliders are separate from core identity. | Manual persistence test for every control; remove or clearly disable settings without a functioning service behind them. |
| Performance | Reduced decorative motion and streaming scroll animation churn; development-only startup timing diagnostics already exist. | Record baseline and post-change startup, time-to-first-response, interaction latency, render and request counts in a real browser. No numeric improvement is claimed until measured. |

## B. Research-derived feature implementation

### 1. Intelligent model routing

**Implemented in code:** provider capability registry; task-aware selection for streaming, tool calls, single-shot generation, structured output, visual inspection and embeddings; process-local outcome/latency telemetry; cost ranking that uses input and output prices in the correct direction; neutral median fallback for missing prices.

**Acceptance tests**
- Ineligible or unconfigured providers are excluded.
- Structured-output, visual and embedding routes require the corresponding capability.
- With otherwise equal candidates, the cheaper eligible model ranks ahead of the more expensive one.
- Provider failures are observable and telemetry stores aggregates only, not prompts.
- Explicit user provider/model settings are respected.

**Limitations:** live provider capability and price metadata must be checked against actual provider accounts. Telemetry resets when the server process restarts, and current prompt-to-task classification is heuristic. Cross-provider embedding choice is limited by the models actually present in the registry. Do not promise optimal routing until evaluated with representative tasks and measured cost/latency.

### 2. Research workspace

**Implemented in code:** multi-angle grounded research, per-step answers and failures, source links/snippets, merged source list, saved reports, open/delete endpoints and user-owned report archive.

**Acceptance tests**
- Source links open independently; no unsupported source is manufactured when grounding fails.
- Incomplete research remains labeled partial/failed.
- Reports persist across reload and authorized devices once the migration is applied.
- User A cannot list, open, or delete user B's reports.

**External gate:** review and apply `20261017100000_research_artifacts.sql` in an approved test Supabase environment. Server-side search can use Gemini Google Search grounding (`GEMINI_API_KEY`) with an optional Brave Search fallback (`BRAVE_SEARCH_API_KEY`). When only Brave is available or Gemini grounding fails, Angel returns real, attributed search snippets and labels them as unsynthesized; this is a degraded research path, not a substitute for a model-generated synthesis.

### 3. Persistent work artifacts

**Implemented in code:** user-owned editable document/code/plan/research artifacts, media references, download/export, delete, version numbers, and optimistic concurrency: stale edits return HTTP 409 rather than overwriting newer work.

**Acceptance tests**
- New artifacts persist after reload and are only visible to their owner.
- Two editors saving version N cannot both silently overwrite one another.
- Version conflicts preserve the current user's draft and explain how to recover.
- Delete and export work for each supported text artifact kind.

**Limitations:** `asset_url` currently represents a media reference; it is not a generated-media binary upload pipeline. Storage-provider setup and migration approval are required.

### 4. User-controlled memory

**Implemented in code:** Memory Vault can view/search, edit, scope entries by agent/project, export JSON, pin, and request deletion; Settings links memory management to the dedicated vault.

**Acceptance tests**
- Edited scope affects subsequent retrieval.
- User can export and delete selected entries.
- Sensitive memories stay excluded from ordinary retrieval.
- Deleting a memory removes it from active retrieval and relevant derived indexes, with retention limits disclosed.

**External gate:** validate deletion propagation across local cache, Supabase sync, and search/index representations before stating deletion is globally complete.

### 5. Verified agent workflows and background jobs

**Implemented in code:** state-transition and permission helpers; deny-by-default confirmation policy; durable queue; progress events; stage and attempt count in UI; bounded exponential retry schedule; server checks the actual pipeline status and non-empty output before marking completion; user-owned cancellation; cancellation request for currently running work.

**Acceptance tests**
- A job only reaches completed when the pipeline succeeded and returned a result that passes validation.
- Retry count never exceeds `max_attempts`; scheduled retry times use backoff.
- Cancellation before execution stops the job; a running task records a cancellation request and suppresses its result after the current model request returns.
- A task belonging to another user cannot be listed or cancelled.
- An invalid worker secret returns 401.
- The UI shows stage, progress, attempt count, terminal status and error.

**Important limits:** running cancellation is best-effort at the model-call boundary, not an immediate interruption of every SDK request. Tools and memory remain disabled for background jobs by default. Apply `20261017130000_verified_workflow_jobs.sql` only after the base durable-job migration has been reviewed and applied in the intended environment. An external scheduler or an eligible hosting plan is required before queued work runs automatically.

### 6. Computer and browser control

**Implemented in the branch:** a separate Playwright container worker under `browser-worker/`; server-mediated APIs; owner-scoped exact-host grants; persistent session records; single-use, time-limited action challenges bound to a payload hash and target; per-action audit events; and a Connections → Browser Control UI. Supported actions are navigate within approved hosts, read visible page text, capture screenshots, click selected elements, and fill ordinary non-sensitive fields. Clicks and form submissions require an explicit confirmation after a review step. Passwords, payment details, identity values, OTPs, API keys, and token-like fields are refused. The UI and API report setup failures rather than pretending the worker is available.

**Not operational until configured:** the browser migration must be reviewed and applied to an approved test database; the worker container must be deployed separately; server-only `ANGEL_BROWSER_WORKER_URL` and `ANGEL_BROWSER_WORKER_SECRET` must be configured; and ingress/egress network restrictions must be in place. Browser control stays unavailable while any required dependency is missing.

**Security qualification:** application-level DNS checks are defense-in-depth, not a substitute for host-level egress isolation. DNS rebinding and redirect paths need adversarial validation in the actual deployment environment. Treat arbitrary page content as untrusted data, not policy or instructions. This worker currently refuses uploads, downloads, automated credential entry, purchasing, destructive operations, and operating-system control. The UI does not advertise those as working.

**Acceptance tests before enabling for users:** deploy into a non-production environment; test SSRF against private/loopback/link-local/cloud metadata destinations, DNS rebinding, redirect chains, asset/subresource targets, prompt injection, credential leakage, stale action challenges, double-click/replay, host-grant revocation, cancellation/close, and cross-user isolation. Verify with two accounts that session identifiers and grants cannot be reused by another account. Only enable after an independent security review and read-after-write checks on actual supported websites.

### 7. Task and profession templates

**Implemented in code:** six starter templates for research/fact-checking, education/lesson planning, coding/debugging, content creation, project planning and everyday work. A template populates the workflow builder; the user can edit its name, condition, and instruction.

**Safety rule:** template-generated workflows are stored disabled pending review. They do not silently obtain extra permissions, and a default workflow now shows a notification rather than writing to long-term memory.

**Acceptance tests**
- A selected template fills the declared fields and can be edited before save.
- Template-generated automation is disabled until the user explicitly enables it.
- Trigger/condition behavior matches a real event payload in an integration test.
- The notification step is visible and failure is recorded rather than silently marked successful.

**Limitation:** these are starter configurations for the existing automation engine, not a managed marketplace of versioned server-run professional workflows.

### 8. Proactive assistance

**Implemented in code:** durable job queue API, task status, retry scheduling, in-page status polling, opt-in browser notifications and pause/cancel boundary for queued work.

**Not yet operational until configured:** approved Supabase migrations, server-only `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and a real external scheduler/eligible host plan. The branch intentionally does not add a scheduler configuration that the current hosting tier rejects.

**Acceptance tests**
- Pause/cancel stops queued/retrying jobs from starting.
- Scheduled retries are claimed only when due.
- Duplicate event delivery does not duplicate side effects.
- Notifications require explicit permission and omit sensitive output where inappropriate.
- A missing worker/scheduler is reported truthfully and is never presented as “working in the background.”

### 9. Contextual voice and visual intelligence

**Implemented in code:** chat composer dictation, Live Voice panel within Chat, and camera/screen Visual Mode popup with explicit browser permission, visible source state, stop control, frame-based analysis, and a prompt tied to the current frame. Cross-device WebRTC session signaling and explicit viewer connection are also present.

**Acceptance tests**
- Dictation stays in the composer for review before send.
- Voice playback can be stopped/interrupted and errors remain visible.
- Camera/screen are never captured without user action and browser permission.
- Permission denial, browser stop, tab close and disconnect release capture tracks and peer connections.
- Visual answers distinguish observable evidence from inference.
- Cross-device sharing only connects explicitly authorized sessions and cleans up when a participant leaves.

**External limits:** physical-device and cross-network tests have not been executed. A TURN relay with short-lived credentials is needed for reliability on some networks. Browser screen capture support varies by browser/device. This is not remote operating-system control.

## C. Deployment gates

1. **Automated gate:** GitHub Actions type-check, unit tests and production build pass for the exact head commit.
2. **Review gate:** inspect source diff, permission boundaries, migration order, logs and secrets.
3. **Test environment gate:** apply new migrations to a non-production Supabase environment, then test owner-scoped data and row-level security.
4. **Integration gate:** exercise live research, model routing, artifact edits/concurrency, worker retry/cancel, browser policy and notification permissions against configured providers.
5. **Device gate:** physical-device mobile/desktop visual session, capture revocation and cross-network TURN tests.
6. **Performance gate:** collect browser measurements on an identified build; compare with recorded baseline and report values with environment details.
7. **Release gate:** rollback plan, operational limits and explicit owner approval.

## D. Current verification snapshot

- CI was passing for the earlier fixes and model-routing changes on commit `6347ee7df09b0c671a4c9a3626c2621e1d331714`.
- Subsequent commits add workflow progress/retry handling, cancellation UI, workflow starters, isolated browser worker and Connections UI. The type-check/template issue was fixed; CI must be green on the exact latest head before merge or preview acceptance.
- No production deployment, browser-worker deployment, or production DB migration has been performed. Browser functionality is code-complete for the limited supported actions but remains gated by isolated deployment, approved migration, network controls, and integration/security testing.
- A live preview URL is not evidence of the current code unless the deployed commit SHA matches the reviewed feature-branch head.
