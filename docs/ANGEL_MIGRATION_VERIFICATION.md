# Angel AI New — Migration and eight-workstream verification ledger

Updated: 2026-10-16
Target repository: `DanielNO-lang/Angel-ai-New`
Migration branch: `migration/aws-amplify-preview`

## Deployment safety rules

- Production is not to be deployed or changed until the owner explicitly authorizes it.
- No claim of real-device functionality without testing on a real device.
- AWS Amplify/App Runner resources and credentials have not been created by this branch. The connected tools available to this session do not expose AWS account resource creation.
- The user reports 300 AWS credits remaining; this balance has not been independently read from AWS.
- Supabase remains the existing data/auth provider. The migration must not create a replacement project or rotate credentials without a separate decision.
- A successful frontend build is not proof that the API, authentication, AI provider, persistent data, workers, or mobile features work end to end.

## Status vocabulary

- **Implemented in code**: code/config exists in the repository.
- **Automated-tested**: the relevant automated test passes on the migration branch.
- **Live-tested**: a real deployed endpoint/service was exercised.
- **Awaiting configuration**: needs credentials, AWS console actions, Supabase settings, scheduler/worker infrastructure, or another external setup.
- **Not yet verified**: no adequate test evidence is available.

## Eight requested workstreams

| # | Workstream | Current evidence/status | Required proof / remaining work |
|---|---|---|---|
| 1 | Chat request lifecycle, visible errors and reliable recovery | **Implemented in code; not yet verified end-to-end.** The backend has provider/streaming endpoints and error paths. | Pass automated tests, then exercise a real prompt and streaming response with a configured AI key; confirm parse/provider/network failures are visible and retry/recovery works. |
| 2 | Unified theme/backdrop; remove obstructive layers; collapsed sidebar overlays content | **Not yet verified.** Existing UI components are present, but no fresh visual/browser audit was performed for this branch. | Inspect all sections at desktop and narrow mobile widths; verify one consistent backdrop and no content push when collapsed. |
| 3 | Navigation simplification; swipe-to-open only on Home/Chat; other sections return via back control | **Not yet verified.** | Verify the actual touch gestures and section-specific back controls on real mobile devices; guest and signed-in states both required. |
| 4 | Three compact randomized capability suggestions | **Not yet verified.** | Inspect the current Home/chat suggestion implementation, confirm exactly three compact suggestions and stable, sensible randomization without obscuring chat. |
| 5 | Rebuilt, user-focused Settings | **Not yet verified.** | Audit Settings against actual user tasks, verify persistence and export, and test each control rather than relying on appearance. |
| 6 | Configurable warmth, humour, directness, empathy and emotional tone | **Not yet verified.** | Confirm settings persist and measurably alter system instructions/response style without overriding safety, user intent or explicit task tone. |
| 7 | Staged voice, authorized tasks and background notifications | **Partially implemented in code; awaiting configuration and end-to-end tests.** Voice APIs and workflow execution exist. | Validate voice permissions and wake/stop behavior, authorization/approval boundaries, durable job execution, scheduler/worker configuration and notifications. Physical-device testing is mandatory for device claims. |
| 8 | Performance optimization and measurement | **Not yet verified.** | Establish baseline build/runtime metrics, measure initial load and chat latency, profile expensive sections, and compare before/after results. |

## Additional backend work from the two most recent work areas

### Chat reliability, authentication and data
- **Implemented in code:** server routes for provider/model status, chat/streaming, Supabase-authenticated cloud data, conversations/messages, workflows, reading, voice, media and webhooks.
- **Changed on this migration branch:** media-artifact listing now requires a verified Supabase user instead of returning an anonymous empty result. This aligns private media access with the existing backend smoke-test contract.
- **Automated-tested:** awaiting the current GitHub Actions run. Earlier test execution found the anonymous media-artifact listing returned HTTP 200 where the security contract expected HTTP 401; the route has been corrected, but the corrected run must pass before this can be marked tested.
- **Awaiting configuration:** valid Supabase environment values, AI provider keys, webhook values where used, and verified Auth redirect URLs for the new preview host.

### AWS hosting migration
- **Implemented in code/config:** `amplify.yml` for a static Vite/PWA build, `apprunner.yaml` for the Express API service, Node.js 22 runtime alignment, a managed-runtime `PORT` fix, and a non-deploying GitHub Actions validation workflow.
- **Automated-tested:** current validation run is linked from the repository Actions page; do not mark the build/test gate as passed until the run concludes successfully.
- **Awaiting configuration:** create the new Amplify app and App Runner service from the AWS Console, connect both to `migration/aws-amplify-preview`, add environment variables/secrets, configure Amplify API rewrite to the actual App Runner HTTPS hostname, and verify health/auth/AI/data flows.
- **Production:** untouched. Do not merge to `main` or promote a production deploy without explicit authorization.

## Required end-to-end acceptance sequence

1. Amplify frontend build and PWA load pass.
2. App Runner `/api/health` returns HTTP 200 with the expected Angel AI status.
3. Amplify `/api/health` reaches App Runner through the configured API rewrite.
4. `/api/ai/providers` works; a real Gemini request and stream complete with valid errors/recovery.
5. Google/email auth and session persistence work against the existing Supabase project.
6. User-owned conversations, messages, tasks and memories persist across reloads and remain isolated by RLS.
7. Workflow approval/rejection/cancellation, reading, voice, media and webhook flows are individually tested.
8. The eight UI/behavior workstreams are checked on desktop and real mobile devices; only observed results are marked tested.
9. Performance measurements are recorded before/after changes.
10. Owner explicitly authorizes production migration; only then may the production route be changed.

## Secrets handling

Use `.env.example` as the variable-name inventory. Put browser-safe `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Amplify. Put server secrets such as `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN` and webhook secrets in App Runner's secret/environment configuration. Never commit actual values or put private keys in `VITE_*` variables.
