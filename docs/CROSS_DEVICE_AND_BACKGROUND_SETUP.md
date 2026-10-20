# Enable cross-device visual sessions and background work

This feature branch adds the application code and migrations. Do not treat these services as active until the migration and server environment prerequisites below are completed.

## 1. Database migrations

Review and apply both migrations to the intended Supabase project using the project's normal migration/review process:

- `supabase/migrations/20261016110000_private_device_presence_realtime.sql`
- `supabase/migrations/20261016130000_durable_background_jobs.sql`
- `supabase/migrations/20261017130000_verified_workflow_jobs.sql` (apply after the base durable-job migration)

The first scopes private Realtime messages to a topic containing the signed-in user's auth UUID. The second creates a user-owned background-job table and an atomic claim function. The third adds persistent progress, attempt counts, bounded retry state, due-time scheduling, and cancellation requests. Review and apply migrations in timestamp order. Do not paste service-role keys into client-side environment variables.

## 2. Vercel server environment

The server needs:
- `SUPABASE_URL` (or the existing `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret
- `CRON_SECRET` as a long, random server-only secret

The protected worker endpoint is `/api/jobs/worker`. It accepts GET and POST but rejects requests without the bearer value matching `CRON_SECRET`. The connected Vercel Hobby account rejected a once-per-minute cron schedule because Hobby permits only daily cron jobs. Therefore this branch intentionally does not configure a misleading daily schedule. To run jobs automatically, configure an external scheduler (or upgrade the Vercel plan) to call this endpoint every minute with `Authorization: Bearer <CRON_SECRET>`. Never expose `CRON_SECRET` or the service-role key to the browser.

## 3. Background job API

- `POST /api/jobs` with a verified Supabase bearer token and `{ "kind": "agent_execution", "taskPrompt": "..." }` queues a durable task.
- `GET /api/jobs` lists only the current user's jobs.
- `POST /api/jobs/:id/cancel` cancels a queued/retrying job, or records a cancellation request for a running job.
- `GET /api/jobs/worker` claims up to three queued or due retrying jobs and executes them. It requires the cron secret.

The worker reports lifecycle progress, checks the actual pipeline status and non-empty result, and schedules bounded retries (up to the configured job maximum) with backoff. Cancellation cannot always interrupt a model SDK call already in progress: the worker discards its result once the call returns and will not retry it. The default background pipeline has no tools or private memory access.

Jobs are not scheduled to execute until the migration is applied, the server environment is configured, and a scheduler is configured. Without an external scheduler or a suitable Vercel plan, jobs remain queued. The worker currently runs an agent pipeline without memory access or enabled tools by default. This is deliberate: a queued task cannot silently inherit broad account access.

## 4. Remote camera/screen

Both devices must be signed in to the same Angel account, have Angel open, and have the private Realtime channel working. On the sharing device, the user must explicitly choose camera or screen and approve the browser permission prompt. The viewer must explicitly choose Connect. Stop sharing in Angel or stop the browser's native capture to end the stream.

Media is sent peer-to-peer through WebRTC, not through Supabase broadcast. Supabase is used only for session discovery/signaling. The default ICE configuration includes a public STUN server; some restrictive corporate, mobile, or symmetric-NAT networks require a TURN relay. A production TURN service with short-lived credentials is a follow-up reliability requirement. The application must not claim cross-network success until tested on the actual devices/networks.

## 5. Verification checklist

- Apply migrations to a non-production/test Supabase project first.
- Verify user A can discover only sessions on user A's account, never user B's.
- Verify camera/screen prompts appear only after explicit user action.
- Verify denied permission, browser capture stop, tab close, and network disconnect all clean up tracks and peer connections.
- Test two physically separate devices and networks; same-browser tabs are not sufficient.
- Queue a background task, check it persists across refresh, verify progress and attempt count, confirm completion requires a valid pipeline result, trigger bounded retry on a failed run, and cancel queued/retrying/running work.
- Confirm unauthorized worker calls return 401 and a user cannot list/cancel another user's job.
- Confirm Vercel cron is configured and logs show scheduled invocations before describing background work as operational.

## Current boundary

This implementation provides remote visual transport and a durable background-agent job queue, not general remote desktop control. It cannot silently click, type, access files, unlock a device, or operate the operating system. Those capabilities require a separately installed, authenticated local companion agent with per-action consent and a stronger threat model.


## Additional release checks

- Review `docs/ROADMAP_ACCEPTANCE_AND_RELEASE_GATES.md` for the status and acceptance tests of all roadmap features.
- Template-generated workflows are saved disabled and use a notification step by default; they must not write persistent memory without an explicit workflow step.
- The current branch includes an isolated browser-worker implementation and server APIs, but it is not operational until the separately deployed worker, server-only secret, browser migration, ingress/egress restrictions, and adversarial security tests are completed.
- The added retry/progress migration has not been applied to the connected project by this change. Apply to a dedicated test project first, then verify the claim function, RLS, retry timing, and cancellation behavior.

## 6. Controlled browser sessions

The feature branch includes an isolated Playwright container in `browser-worker/`, authenticated backend endpoints, host grants, one-time action challenges, audit events, and a Connections → Browser Control screen. The browser worker is a separate service, not part of the Vercel frontend/serverless bundle.

Before enabling it in a test environment:

1. Review and apply `supabase/migrations/20261017150000_browser_control_permissions.sql` after the earlier migrations in timestamp order. Do not apply it to production as part of this code-only branch change.
2. Deploy `browser-worker/` as a container service. Its Dockerfile is based on the matching Playwright image and runs the worker as the non-root `pwuser`.
3. Generate a strong random secret (at least 32 random bytes). Configure it as `ANGEL_BROWSER_WORKER_SECRET` inside the worker and the same value as a **server-only** secret in Angel. Configure `ANGEL_BROWSER_WORKER_URL` to the worker's HTTPS origin. Never use a `VITE_` prefix.
4. Restrict network ingress to Angel's server where the hosting platform allows it. Add host/firewall egress policy that blocks loopback, private, link-local, cloud metadata, internal service networks, and all unapproved destinations. The in-process URL and DNS checks are defense-in-depth; DNS rebinding and redirect behavior need adversarial deployment testing.
5. Sign in to Angel, open Connections → Browser Control, grant an exact hostname and only the scopes that are required, then create a session. New sessions snapshot the current host grants. Review each proposed action. Actions must be prepared and then executed through a single-use challenge; clicks/submissions require explicit confirmation.

Supported in this initial slice: approved HTTPS navigation, visible page text, screenshots, clicking a selected element, filling ordinary non-sensitive form fields, and closing a session. Sensitive credential fields are refused. File upload/download, credential management, purchasing, destructive actions and OS-level control are intentionally not enabled. Sessions are temporary, held in worker memory, and expire after 20 minutes by default; worker restarts close them. Do not deploy multiple replicas without addressing session affinity/shared session state.

### Browser verification checklist

- Test in a non-production account and use test pages, never a live purchase or destructive action.
- Test a user with no grants, a revoked grant, expired/replayed confirmation, duplicate execution, cross-user session identifiers, and a worker with the wrong secret.
- Test redirect chains, DNS changes/rebinding, private IP and cloud metadata requests, and subresource requests with network-level egress controls enabled.
- Confirm sensitive input fields are refused, page changes invalidate prepared actions, every action has a visible audit record, and stop/close releases the browser context.
- The browser feature remains disabled unless the migration, server secret, worker URL, container service, and network policy are all ready.


## 7. Scheduled assistance and worker setup

Scheduled tasks use the same durable background queue as manually queued tasks. They currently perform analysis, planning, and drafting only: browser tools and private-memory access are intentionally disabled in the worker pipeline.

Before creating schedules in a test environment:

1. Review the migrations in `supabase/migrations/` and apply all required migrations to a **non-production** Supabase project in timestamp order. For the newest features, the order includes `20261017130000_verified_workflow_jobs.sql`, `20261017150000_browser_control_permissions.sql`, `20261017170000_proactive_scheduled_tasks.sql`, then `20261017180000_web_push_notifications.sql`. Review dependencies in the preceding migration files as well.
2. Configure server-only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET`. Never expose service-role or cron secrets to browser JavaScript or any `VITE_` variable.
3. Run a trusted external scheduler at least once per minute and invoke `GET /api/jobs/worker` using `Authorization: Bearer $CRON_SECRET`. Keep the endpoint secret server-side. A Vercel Hobby deployment cannot use a once-per-minute native cron schedule, so use an eligible scheduling plan or an external scheduler.
4. Confirm the worker response reports `scheduledTasks.configured: true` and reports any number of due schedules enqueued. Confirm ordinary background tasks continue to process if the new scheduled-task migration is absent. Check server logs for scheduler/worker errors.
5. Test one-time execution, an interval with a small maximum-run count, idempotency across repeated scheduler requests, pause/resume, delete/cancel, run-limit exhaustion, and task failure/retry.

The interval cadence is bounded to 15 minutes through 30 days, with 1–100 runs and at most 20 enabled schedules per account. Missed intervals are coalesced rather than replayed in a burst. A scheduled occurrence is de-duplicated by its schedule ID and due time.

**Important:** the code does not create a hosted scheduler by itself. Until a scheduler is configured and database migrations are applied, scheduled tasks may be saved but will not run. Production must remain gated until preview verification succeeds.

## 8. Grounded web search fallback

The research workspace prefers Gemini Google Search grounding when `GEMINI_API_KEY` is configured. To add a real search fallback for Gemini quota/rate-limit outages, configure `BRAVE_SEARCH_API_KEY` as a server-only secret. The code calls Brave Search's documented web-search endpoint and only keeps valid HTTP(S) source links returned by the provider. If fallback search is used, the report labels the content as attributed source snippets, not an AI-generated synthesis. Never prefix the key with `VITE_`, expose it in browser code, or commit it. Test provider quota errors, empty results, malformed URLs, and successful fallback in the approved preview environment before release.

## 9. Background push notifications

Background push is separate from the existing in-tab browser notification monitor. Push requires a service worker, user consent, a valid server-side VAPID key pair, the push subscription migration, and a running background worker.

1. Generate keys in a trusted terminal using `npx web-push generate-vapid-keys`. Do not paste private keys into chat or commit them.
2. Configure `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in the server environment. Use a monitored `mailto:` contact or an HTTPS contact page for the subject. The private key must remain server-only; the public key is returned to signed-in clients only for subscription setup.
3. Apply `20261017180000_web_push_notifications.sql` after its dependent migrations. The `angel_push_subscriptions` table is managed by the server so clients cannot register other users' subscription endpoints or read endpoint credentials.
4. Open Settings → Notifications while signed in and enable “Background push notifications” on each browser profile. Approve browser notification permission. The server sends a generic notification title/body and an internal Angel URL, never task output or prompt text.
5. Run a test job to completion and another to final failure. Verify delivery when the app tab is closed, endpoint removal after HTTP 404/410, disable/unsubscribe behavior, and that no other account receives the event.

Allowed endpoints are restricted in the server to known browser push-service hostnames. Keep endpoint payloads and subscription keys out of logs. Push is considered configured only when server VAPID settings and subscription storage are available. Expired service-worker subscriptions should be removed after the browser push service reports them expired.

Current limitation: browser push delivery does not make the task scheduler run, and push permission does not grant Angel background computer control. The worker and external scheduler remain separately required.
