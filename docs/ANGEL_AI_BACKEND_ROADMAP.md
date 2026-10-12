# Angel AI Backend Implementation Roadmap

Last updated: 2026-10-12

This document tracks backend behavior in the `Angel-ai-New` repository. A route or service is only considered complete after a real request and its persistence side effects have been verified.

## Architecture

- **Frontend:** React/PWA, local-first workspace and offline mutation queue.
- **API runtime:** Express server bundled as native ESM for Vercel serverless execution.
- **Identity and persistence:** Supabase Auth + Postgres RLS. User-facing data access uses the caller's Supabase JWT, not the service-role key.
- **AI providers:** provider registry and capability/model catalog; Gemini is the configured primary. OpenAI-compatible provider is available when configured.
- **Agent execution:** orchestration pipeline with execution records, context retrieval, permission-aware task/memory tools and execution logs.
- **Automation:** configured outbound webhook service, signed inbound webhook validation and event-triggered workflows.
- **Reading / voice / media:** separate server-side services and API endpoints.

## Implemented in code

### Runtime and reliability
- Vercel API entry imports the generated ESM server bundle.
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

## Verification record

- The tested Vercel deployment returned HTTP 200 for `/api/health`, `/api/ai/providers`, `/api/integrations/status` and `/api/models`.
- At that check, Supabase and Gemini were detected as configured; OpenAI, GitHub and outbound webhook integrations reported as unconfigured.
- A successful health check proves the API runtime boots. It does **not** prove that model generation, stream transport, workflow execution or cloud sync passes end-to-end tests.
