# Enable cross-device visual sessions and background work

This feature branch adds the application code and migrations. Do not treat these services as active until the migration and server environment prerequisites below are completed.

## 1. Database migrations

Review and apply both migrations to the intended Supabase project using the project's normal migration/review process:

- `supabase/migrations/20261016110000_private_device_presence_realtime.sql`
- `supabase/migrations/20261016130000_durable_background_jobs.sql`

The first scopes private Realtime messages to a topic containing the signed-in user's auth UUID. The second creates a user-owned background-job table and an atomic claim function. Do not paste service-role keys into client-side environment variables.

## 2. Vercel server environment

The server needs:
- `SUPABASE_URL` (or the existing `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret
- `CRON_SECRET` as a long, random server-only secret

The scheduled endpoint is `/api/jobs/worker`, configured to run once per minute. Vercel cron requests use GET; the endpoint accepts GET and POST but rejects requests without the bearer value matching `CRON_SECRET`. Confirm the selected Vercel plan supports cron and that the secret is configured in the target environment. Never expose `CRON_SECRET` or the service-role key to the browser.

## 3. Background job API

- `POST /api/jobs` with a verified Supabase bearer token and `{ "kind": "agent_execution", "taskPrompt": "..." }` queues a durable task.
- `GET /api/jobs` lists only the current user's jobs.
- `POST /api/jobs/:id/cancel` cancels only a job that is still queued.
- `GET /api/jobs/worker` claims up to three queued jobs and executes them. It requires the cron secret.

Jobs are not scheduled to execute until the migration is applied and the server environment is configured. The worker currently runs an agent pipeline without memory access or enabled tools by default. This is deliberate: a queued task cannot silently inherit broad account access.

## 4. Remote camera/screen

Both devices must be signed in to the same Angel account, have Angel open, and have the private Realtime channel working. On the sharing device, the user must explicitly choose camera or screen and approve the browser permission prompt. The viewer must explicitly choose Connect. Stop sharing in Angel or stop the browser's native capture to end the stream.

Media is sent peer-to-peer through WebRTC, not through Supabase broadcast. Supabase is used only for session discovery/signaling. The default ICE configuration includes a public STUN server; some restrictive corporate, mobile, or symmetric-NAT networks require a TURN relay. A production TURN service with short-lived credentials is a follow-up reliability requirement. The application must not claim cross-network success until tested on the actual devices/networks.

## 5. Verification checklist

- Apply migrations to a non-production/test Supabase project first.
- Verify user A can discover only sessions on user A's account, never user B's.
- Verify camera/screen prompts appear only after explicit user action.
- Verify denied permission, browser capture stop, tab close, and network disconnect all clean up tracks and peer connections.
- Test two physically separate devices and networks; same-browser tabs are not sufficient.
- Queue a background task, check it persists across refresh, verify the worker changes queued → running → completed/failed, and cancel a queued task.
- Confirm unauthorized worker calls return 401 and a user cannot list/cancel another user's job.
- Confirm Vercel cron is configured and logs show scheduled invocations before describing background work as operational.

## Current boundary

This implementation provides remote visual transport and a durable background-agent job queue, not general remote desktop control. It cannot silently click, type, access files, unlock a device, or operate the operating system. Those capabilities require a separately installed, authenticated local companion agent with per-action consent and a stronger threat model.
