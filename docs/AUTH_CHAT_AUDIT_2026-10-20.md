# Google Sign-In and Chat Audit — 20 October 2026

Repository: `DanielNO-lang/Angel-ai-New`  
Inspected main commit: `489afc6542d1e85f57e8169c956898a04d2b0ee1`  
Working fix branch: `feat/angel-persona-voice-foundation-2026-10-18`

## Executive summary

The latest `main` push has material authentication security defects and should not be deployed as-is. The working-branch fixes below remove the client-side hard-coded account fallback, use the standard Supabase OAuth session lifecycle, prevent fabricated chat success, normalize chat payload compatibility, and add response-latency diagnostics.

**Important boundary:** the changes are committed to the feature branch only. Main remains unchanged; these fixes are not active in the current main/production app until they are reviewed and integrated. No deployment was performed.

## Findings in the inspected main commit

### Critical: arbitrary executive token acceptance
In `server.ts`, both `requireSupabaseUser` and `attachOptionalSupabaseUser` treat any bearer token beginning with `angel_` as an executive session, without verifying a signature or checking it against Supabase. The token is assigned a fixed user ID and a privileged admin client. A prefix is not authentication.

**Required:** remove this bypass. Accept only a valid Supabase access token verified by `auth.getUser(token)`, or a separate cryptographically signed, expiring server-side token verified with a dedicated secret and strict authorization. Never fall back from admin client to an unprivileged client while assuming it grants secure identity.

### Critical: public account takeover path
The main commit adds `POST /api/auth/google/verify-or-create`. It accepts an email from the request body, derives a predictable password from that email and a hard-coded salt, then uses the admin API to create/update the target account and sign in. It also auto-confirms email. This lets an unauthenticated caller target an arbitrary email and must be removed, not merely rate-limited.

**Required:** delete the route and every client call to it. Google login must be the real Supabase OAuth provider flow. Never set another user's password, confirm their email, or create a privileged session based on a client-supplied email.

### High: OAuth callback postMessage trust
The new `index.html` callback relay sends the OAuth hash using `postMessage(..., '*')`. The feature-branch implementation no longer depends on that relay. If a relay is retained later, use an exact origin and validate `event.origin`, `event.source`, and message shape before accepting tokens.

### High: plan and identity defaults
Main's `AppContext.tsx` marks authenticated profiles as `Pro` regardless of the verified database plan. The new auth path also hard-codes an account fallback. A successful identity verification must not grant a plan. The feature branch now defaults to Free instead of inventing Pro access or a default named account.

### CI failure on main
The main commit's `Backend smoke test` run [39406484756](https://github.com/DanielNO-lang/Angel-ai-New/actions/runs/39406484756) failed because the production alias did not report the expected commit: expected `489afc6542d1e85f57e8169c956898a04d2b0ee1`, received `unknown`. This is a deployment/version-marker smoke failure, not a TypeScript build result. No deployment was attempted by this audit.

## Feature-branch fixes made

1. `src/services/supabaseService.ts`: removed the hard-coded email fallback and all `verify-or-create` calls from the Google sign-in helper. It now uses `supabase.auth.signInWithOAuth`, opens an embedded-preview popup only from the click gesture, relies on Supabase's normal callback/session storage, and reports missing config or blocked popup instead of impersonating an account.
2. `src/context/AppContext.tsx`: removed unconditional Pro plan defaults and the default hard-coded personal identity from the auth profile fallback.
3. `src/services/ai/conversationService.ts`: removed the fabricated “I received your prompt” success response when both streaming and single-shot generation fail. The failure is now surfaced through the existing error path.
4. `server.ts`: accepts both `prompt`/`message` and `conversationHistory`/`history` request shapes, and streams both `chunk` and `text` fields for client compatibility.
5. `src/services/ai/conversationService.ts`: logs first-token and total-response latency plus whether the stream or single-shot fallback path was used. These diagnostics measure actual sessions when run; CI does not provide live provider latency.

## Verification

Feature-branch run [39408113808](https://github.com/DanielNO-lang/Angel-ai-New/actions/runs/39408113808) passed:
- dependency installation
- TypeScript type-check
- test suite
- production build

This proves the code compiles and automated tests pass on the feature branch. It does **not** prove Google OAuth succeeds against live provider configuration or establish production response-time numbers.

## Response-speed analysis

- **Fastest path:** provider stream emits a first token quickly; user sees output before the full response completes.
- **Slower path:** tool-intent prompts may run a separate tool-call request before the main answer; a failed/empty stream then triggers a second single-shot generation request.
- **Provider/network delays:** time to first token depends on provider availability, model load, network, request size, and context length. CI cannot measure these live values.
- **Failure behavior:** the feature branch now reports a real error instead of pretending a provider failure was a completed answer. Browser console diagnostics record first-token latency and total duration for future measurement.

## Remaining release blockers

- Remove the executive-token bypass and `/api/auth/google/verify-or-create` route from the code that will become main.
- Remove the unsafe callback relay or harden it with exact origin/source validation if a popup relay is still required.
- Ensure all sign-in UI uses only the standard Supabase OAuth helper; inspect every call site for old fallback calls.
- Test the exact production origin in Supabase Auth URL Configuration and Google OAuth redirect URIs.
- Perform a real browser sign-in, verify Supabase session persistence across reload, and verify the profile row uses the authenticated user's UUID.
- Measure actual time-to-first-token and total response duration with the new console diagnostics against the configured provider.

No merge or deployment is authorized by this audit.
