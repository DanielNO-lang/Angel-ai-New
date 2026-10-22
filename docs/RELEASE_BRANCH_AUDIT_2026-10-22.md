# Angel AI branch consolidation and pre-deployment audit

**Audit date:** 2026-10-22  
**Release branch:** `release/angel-consolidated-predeploy-2026-10-22`  
**Production branch:** `main`  
**Deployment rule:** Do not publish from this branch or merge it to `main` until the manual OAuth settings and remaining release gates are resolved.

## Release status

- Current `main`: `22f3fd33b3b33544ec08f0b2ee60bb2ce82004e1`.
- The release branch is based directly on current `main` and contains an additive pre-deployment hardening set. It is not deployed and has not been merged into `main`.
- Latest recorded application validation before this report's commit: [Angel branch verification](https://github.com/DanielNO-lang/Angel-ai-New/actions/runs/39745270955) passed type-check, build, tests, and the Netlify-function bundle test.
- Latest Python validation: [Python capability-service checks](https://github.com/DanielNO-lang/Angel-ai-New/actions/runs/39744451129) passed dependency installation, module import/app initialization, and Python compilation.
- These are CI results, not proof of live OAuth, AI-provider, or Netlify-Lambda success.

## Verified fixes in the consolidation branch

### Netlify API runtime

The production Netlify site served the static homepage but emitted HTTP 500 responses from API routes on 2026-10-21 and 2026-10-22, including `/api/integrations/status`, `/api/auth/session`, `/api/ai/generate`, and `/api/ai/stream`. The latest production smoke workflow failed because the health endpoint did not become healthy.

The prior function wrapper tried to dynamically import `server-build/server.js` and could fall back to raw `server.ts` if the build output was absent. This was not being exercised by tests because the old workflow ran tests before building. The release branch now:
- emits the server bundle as unambiguously ESM `server-build/server.mjs`;
- includes that exact artifact in the Netlify function package;
- resolves the bundle using the deployment task root and function-module paths;
- fails explicitly in a real Lambda if the compiled artifact is missing instead of silently trying to import TypeScript;
- builds before tests; and
- calls the actual Netlify function handler against the compiled artifact for health, integration status, and provider-status routes.

CI passes for this candidate fix. **The live site has not been redeployed, so the production HTTP 500 fix remains unverified until a later, authorized deploy.**

### Google OAuth

The app's server OAuth endpoint correctly requests Supabase Google OAuth with the canonical app return URL `https://angel-ai-new.netlify.app/auth/callback`. The client now refuses to fall back to the embedded preview origin if the server cannot supply a canonical URL. The setup document has the expected Google provider callback for the active Supabase project:

`https://qltiogotxbxwzwmnypwu.supabase.co/auth/v1/callback`

The screenshot's `Error 400: redirect_uri_mismatch` comes from Google before Supabase finishes authentication. **This cannot be fully fixed in repository code.** In Google Cloud Console, the authorized redirect URI must exactly match the callback above on the same Web OAuth client ID configured in Supabase. Separately, Supabase Authentication URL Configuration must allow `https://angel-ai-new.netlify.app/auth/callback`. The exact callback and redirect allowlist have not been read back from the external provider configuration, and a real browser sign-in has not succeeded yet.

### Authentication and profile safety

Current main no longer contains the unauthenticated `angel_` bearer-token shortcut or the public `/api/auth/google/verify-or-create` admin account-creation route. The wildcard OAuth token relay is also absent. The release branch preserves these removals. Login flows default profile plan to Free instead of granting Pro, and the client-side OAuth fallback is no longer allowed to guess the app origin when used inside an iframe.

### Chat and ADK

- The truthful empty-provider-response fix from `fix/chat-empty-provider-response-2026-10-20` was selectively integrated into this release branch instead of wholesale merging the stale source branch.
- The optional Google ADK 2.12 Python service has been selectively ported, with bounded HTTPS endpoint validation, a constant-time shared service-token check, request-scoped MCP tool access using the already verified Supabase user token, an allowlisted tool set, explicit session-persistence reporting, and a test that rejects insecure remote HTTP.
- The ADK runtime remains **optional/not live-connected**: the Netlify site currently has no `ANGEL_ADK_RUN_URL` or `ANGEL_ADK_API_KEY` value. No external Python runtime or durable ADK database has been provisioned by this change. The code must report this as unconfigured rather than pretend it is active.

## Infrastructure and configuration review

### Netlify

Site: `angel-ai-new` (`2b97ecaf-f9d9-427b-ad69-b1f4f3de17b0`). The published deploy is currently marked ready, but observed API failures mean “ready” is not equivalent to healthy. Relevant existing variables were present for Supabase, Gemini, OpenAI and GitHub. Secret values were not exposed during this audit. No deployment has been triggered by this work.

### Supabase

Active project: `qltiogotxbxwzwmnypwu`, status reported active/healthy. The project's public tables report RLS enabled. The migration history includes the owner-scoped workspace, service-only rate limiting, audit logging, user-RLS hardening and Library content-metadata work. The Secure Vault and the larger research/background-job/push/browser-control/device-presence migrations from older branches are **not all applied** to the active project; UI/service code for those features must not be treated as live merely because an old branch contains it.

The Supabase security advisor reports **Leaked Password Protection Disabled**. Enable it manually under Authentication → Security and Protection; this tool connection cannot flip that Auth setting. See [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Unused-index advisories were informational and no indexes were dropped.

### Firebase

No Firebase SDK, Firebase configuration files, or Firestore/Firebase Auth integration was found in the current repository tree, and there are no Firebase-specific site environment variables. Current Google sign-in is implemented through **Supabase Auth + the Google provider**, not Firebase. There is nothing Firebase-specific to “verify functioning” in this repo; adding Firebase would be a separate architecture decision, not a release fix.

## Branch-by-branch disposition

The repository had 33 branch refs at the time of the audit. Tips, common ancestry / ahead-behind relationships and linked PR state were checked for the full branch inventory. High-risk auth/backend paths and high-conflict feature diffs were inspected; stale branches were not blindly merged, because their old file snapshots would overwrite newer main behavior. This table records a release disposition, not a claim that every historical commit from every obsolete branch independently passed CI.

| Branch | Disposition |
|---|---|
| `main` | Current production source; preserve as release base until the gates below pass. |
| `release/angel-consolidated-predeploy-2026-10-22` | Active integration branch; contains pre-deploy API runtime hardening, OAuth fallback hardening, ADK selective port and tests. |
| `release/predeploy-hardening-2026-10-20` | Its approved security changes were already merged to main through PR #21; older release head, do not re-merge. |
| `feat/angel-capability-foundation` | PR #13 merged into main; already represented in current code. |
| `feat/backend-persistence-and-hardening` | PR #9 merged; already represented in current code. |
| `feat/hymt2-translation-backend` | PR #12 merged; translation integration already represented. |
| `feat/qwen-pro-multi-reference-edit` | PR #16 merged; Qwen multi-reference changes already represented. |
| `feat/visual-mode-screen-share-cross-device-2026-10-09` | PR #5 merged; already represented in main. |
| `fix/auth-guest-home-2026-10-09` | PR #3 merged; do not merge again. |
| `fix/build-dependency-conflict-2026-10-09` | PR #2 merged; do not merge again. |
| `fix/google-oauth-profile-persistence-2026-10-09` | PR #6 merged; profile persistence changes already represented. |
| `fix/home-truthful-activity-2026-10-09` | PR #4 merged; truthful activity changes already represented. |
| `fix/netlify-production-smoke` | PR #14 merged; monitor the still-failing live API smoke separately from source CI. |
| `migration/netlify-preview` | PR #11 merged; current deployment target remains Netlify. |
| `research/angel-capability-audit-2026-10-17` | PR #15 merged; capability audit already represented. |
| `fix/chat-empty-provider-response-2026-10-20` | Its one-commit fix was selectively integrated into this release branch through PR #23. It should reach main only via this consolidated release. |
| `feat/adk-durable-mcp-runtime` | Selectively ported to release. Do not merge the stale branch wholesale because server/tests/docs conflict with later main; external deployment/secrets/database remain pending. |
| `feat/angel-auth-security-hud` | Unique Secure Vault/System HUD/encryption code reviewed. Deferred from this release because it needs separate UI integration, migration review and verified behavior. Its vault migration has not been applied live. |
| `feat/angel-auth-encryption-hud-2026-10-17` | Historical/duplicate reference; no separate current diff to integrate. |
| `feat/angel-persona-voice-foundation-2026-10-18` | Persona prompt intent partly already exists in main. The separate character/expression component is a candidate for later integration, but portrait/reaction assets are placeholders and the old HomeView is a large stale rewrite; do not replace current HomeView wholesale. |
| `feat/angel-roadmap-implementation-2026-10-17` | Stale, overlapping HomeView/Settings/AppContext rewrite. Current main already has its own research workspace. Unique research changes need file-level comparison, not a whole-branch merge. |
| `feat/filtered-angel-backend-foundation` | Large (384 commits ahead / 214 behind in its comparison snapshot) and high-conflict. Several migrations and services are not applied/configured in live Supabase; never merge this branch wholesale. Extract features one at a time with migration, auth and tests. |
| `fix/mobile-single-sidebar-guest-and-auth-2026-10-10` | Its desktop/mobile sidebar classes and explicit viewport CSS are already in current main. No additional code port needed. |
| `fix/angel-mobile-pwa-auth-and-ux-2026-10-11` | Old, broad UI/chat rewrite and Vercel-era configuration; do not wholesale merge over newer main. |
| `fix/angel-vercel-ui-model-2026-10-03` | Historical Vercel-focused draft; not aligned to the current Netlify deployment target and based on stale UI. |
| `fix/angel-final-ui-2026-10-03` | Historical UI snapshot; stale, do not replace current HomeView/Settings. |
| `fix/final-preview-safe-2026-10-03` | Historical preview snapshot; stale. |
| `fix/final-ui-preserve-main-2026-10-03` | Historical UI-preservation snapshot; no wholesale merge. |
| `fix/preserve-main-ui-2026-10-03` | Historical UI snapshot; superseded by current main. |
| `fix/vercel-supabase-connection-2026-10-03` | Old Vercel-era branch, no new commits relative to the current release base snapshot; not a Netlify release source. |
| `fix/google-oauth-ui-recovery-2026-10-09` | Rejected from merge: it contains the old unsafe fallback to `/api/auth/google/verify-or-create`, which is intentionally removed from current main. |
| `angel-fix-audit-2026-10-03` | Historical fix/audit snapshot; stale. No wholesale merge. |
| `migration/aws-amplify-preview` | AWS-specific migration path, not relevant to the selected Netlify release; no AWS deploy was attempted. |

## Remaining release gates (do not deploy until cleared)

1. **Manual Google OAuth setting:** in Google Cloud Console → Google Auth Platform → Clients, add exactly `https://qltiogotxbxwzwmnypwu.supabase.co/auth/v1/callback` to Authorized redirect URIs on the same Web OAuth client configured under Supabase → Authentication → Providers → Google. In Supabase URL Configuration, confirm Site URL `https://angel-ai-new.netlify.app` and Redirect URL `https://angel-ai-new.netlify.app/auth/callback`. Then perform a real browser sign-in. The configured provider details are not accessible through the connected project tools, so this cannot be verified from code alone.
2. **Manual Supabase security setting:** enable leaked-password protection as noted above.
3. Wait for green CI on the latest release head after all final edits.
4. Before any authorized release, validate the compiled function using a Netlify **Deploy Preview** only if the user explicitly approves creating one; current production API 500s cannot be conclusively ruled out by GitHub CI alone.
5. Test real Google sign-in, session restore, chat generation/streaming, profile persistence, and logout; confirm production health and integration-status routes return 200 after an approved rollout. No such live end-to-end verification is claimed here.
6. Do not merge the release branch into main yet. With Netlify continuous deployment, that merge may publish a production deploy, and the user explicitly asked for no deployment at this stage.
