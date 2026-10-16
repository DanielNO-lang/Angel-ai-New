# Angel AI Backend Implementation Roadmap

Last updated: 2026-10-16

This document tracks backend behavior in the `Angel-ai-New` repository. A route or service is only considered complete after a real request and its persistence side effects have been verified.

## Architecture

- **Frontend:** React/PWA, local-first workspace and offline mutation queue.
- **API runtime:** Express server bundled as native ESM and hosted through Netlify Functions (`netlify/functions/api.ts`).
- **Identity and persistence:** Supabase Auth + Postgres RLS. User-facing data access uses the caller's Supabase JWT, not the service-role key.
- **AI providers:** provider registry and capability/model catalog; Gemini is the configured primary. OpenAI-compatible provider is available when configured.
- **Agent execution:** orchestration pipeline with execution records, context retrieval, permission-aware task/memory tools and execution logs.
- **Automation:** configured outbound webhook service, signed inbound webhook validation and event-triggered workflows.
- **Reading / voice / media:** separate server-side services and API endpoints.

## Implemented in code

### Runtime and reliability
- Netlify's API Function imports the generated ESM server bundle from `server-build/`.
- Vite is dynamically imported only by the standalone development server, avoiding production cold-start loading of development bindings.
- Health, provider, model and integration status endpoints are available.
- Per-instance rate limits are applied to authentication, AI, agent, media, voice and automation endpoints.

### Authentication and ownership
- Server fallback sign-up, password sign-in and password recovery use Supabase Auth rather than an in-memory user/session map.
- Removed the obsolete in-memory authentication service and seeded credentials.
- Protected cloud synchronization, profile and cloud-data routes verify Supabase access tokens.
- Privileged GitHub/Vercel and webhook-test routes require a Supabase user whose email is listed in `ADMIN_EMAILS`.
- Cloud-sync writes use a request-scoped publishable/anon-key client with the user's JWT so RLS enforces `auth.uid() = user_id`.

### Persistence and sync
- Cloud sync supports profiles, agents, conversations, messages, tasks, memories, projects, library items, workflows and settings.
- Task velocity reads are user-scoped and report an empty live task list as a valid connected state.
- Offline queued mutations go through authenticated server sync and are not marked successful when the API rejects the write.
- Sync preserves the database-owned account plan instead of trusting a client payload.

### AI and agent execution
- Provider selection falls back to another configured provider if the requested provider is unavailable.
- Agent runs can persist to `public.executions`.
- Agent context can retrieve recent user memories and active tasks from Supabase.
- Task and memory tools write to the authenticated user's tables and require the configured tool/permission checks.
- Workspace search and time utility tools return actual results to the model context.
- Agent Lab execution requests include the Supabase session token.

### Workflows and approvals
- Authenticated workflow CRUD APIs use user-scoped RLS.
- Workflow runs persist to `public.executions`, execute steps sequentially and store step results.
- Supported step families include AI/agent generation, task creation, memory save, outbound event dispatch, variable assignment and safe template transformation.
- Steps can pause in `awaiting_approval`; an authenticated user can approve or reject a pending run.
- User-scoped execution history and cancellation APIs are available.
- Matching enabled event-triggered workflows are invoked from authenticated workspace event dispatch.

### Reading, voice and media APIs
- Reading API accepts supplied text or supported base64 PDF/image/text formats and returns evidence-led analysis.
- Existing voice transcription/TTS, visual inspection, image/video generation and media artifact endpoints remain available.

### Webhooks and security
- Inbound webhooks validate the configured secret/signature.
- Public automation dispatch accepts only known event types, requires a signed-in user and does not accept arbitrary destination overrides.
- Callback URLs are only called when their hostname is listed in `WEBHOOK_CALLBACK_ALLOWLIST`.
- Inbound payload contents are not written to application logs.

## Remaining work / not yet verified

1. **Live request tests:** send a real prompt to the production generate and streaming endpoints; verify Gemini model availability, stream completion, errors and token usage.
2. **Persistence end-to-end:** sign in, create/edit a task and memory, sync an offline mutation, reload the workspace and confirm the same user sees the saved data while another user cannot.
3. **Workflow end-to-end:** create a workflow, run it, pause at approval, approve/reject, cancel a running workflow, and verify every transition in `public.executions`.
4. **Scheduler:** scheduled workflow execution still needs a trusted scheduler/cron integration and duplicate-run protection.
5. **Agent tool protocol:** expand the current deterministic tools into a registered, schema-validated model tool loop with per-tool timeout, retries, cancellation and auditable permission checks.
6. **Reading breadth:** add robust DOCX/office-file extraction, larger file handling, source citations/page references, and saved reading artifacts.
7. **Media durability:** move generated artifact bytes/URLs and job state from process memory into durable storage; add ownership checks and retryable job polling.
8. **Memory quality:** add embeddings-backed semantic retrieval, explicit user controls for saved memory and retention/deletion behavior.
9. **Additional providers:** implement and test native Anthropic/Claude support and any additional provider adapters; a model catalog entry alone is not a provider implementation.
10. **Distributed rate limits and tests:** use a shared rate limiter for serverless instances and add automated API, RLS, provider, workflow and sync regression tests.
11. **Integration credentials:** configure and test the user's chosen GitHub, Vercel and outbound webhook credentials; current status endpoints must be rechecked after configuration.
12. **Security hardening:** review every API route for authentication, ownership, input limits, SSRF, secret exposure and error redaction.

## Capability integrations added from source-repository research

- Qwen Image 2.1: server-only hosted inference adapter and Media Studio model selection; outputs are downloaded immediately for authenticated artifact persistence.
- Python: authenticated remote-execution bridge. Angel's Netlify function never evaluates submitted Python directly.
- Google ADK: separate FastAPI/Python runtime sample and authenticated Angel API bridge. The sample uses in-memory sessions until a persistent ADK SessionService is configured.
- MCP: authenticated JSON-RPC gateway with capability/skill resources, a narrow tool allowlist, schema validation, request-size limits, and origin/protocol-version validation.
- Skills: curated, Angel-authored code review, test-first debugging, Python, MCP, ADK, translation, image, voice-accessibility, reverse-engineering and model-serving instruction packs. At most four selected packs are attached to one backend agent execution.
- Model optimization / GPU Operator: documented external GPU build and serving path; neither component is falsely treated as a Netlify request-time dependency.
- Voice: finalized-transcript routing for Angel workspace navigation and controls, with standalone farewell detection. This does not grant a browser global desktop input access.

## Verification record

- The repository includes backend smoke tests for the core API, Hy-MT2's mocked upstream contract, capability discovery, unauthenticated access control, voice-intent boundaries, skill selection limits, and MCP schema validation.
- GitHub Actions must pass after the current feature branch is opened as a pull request before the work is treated as build-verified.
- Capability/configuration status is not proof of live model inference. Real Qwen/Hy-MT2 calls require provider credentials; Python requires an independently deployed sandbox; ADK requires its own deployed Python service.
- Netlify remains Angel's hosting target. The optional Vercel integration API is not a hosting/deployment path for this work.
