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
- Browser-action policy helpers are not a deployed browser executor. Do not enable live interaction until an isolated executor, server-owned grants/host allowlist, audit log, cancellation path, and security tests are delivered.
- The added retry/progress migration has not been applied to the connected project by this change. Apply to a dedicated test project first, then verify the claim function, RLS, retry timing, and cancellation behavior.
