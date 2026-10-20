# Angel Branch Consolidation and Release Audit
Date: 2026-10-20
Target deployment: Netlify project `angel-ai-new`
Repository: `DanielNO-lang/Angel-ai-New`
Release candidate branch: `release/predeploy-hardening-2026-10-20`

## Release decision

**Do not merge to `main` or deploy production yet.** The current release-candidate branch's code checks are passing, but Google sign-in has an external configuration blocker: the Google OAuth Web Client must have the active Supabase callback URI registered exactly. This repository/tool connection cannot inspect or edit the OAuth client inside Google Cloud Console. A production release also needs post-build live verification. Production has not been deployed by this audit.

## Verified fixes on the release candidate

- Removed the unverified `angel_` token privilege shortcut from required and optional Supabase authentication middleware.
- Removed `POST /api/auth/google/verify-or-create`, which accepted user-supplied identity data and used administrative Supabase APIs to change accounts and issue sessions.
- Removed the remaining iframe popup fallback that called that unsafe route.
- Removed the wildcard `postMessage(..., '*')` OAuth callback token relay.
- Replaced unconditional Pro defaults with Free and a generic fallback identity.
- Normalized Supabase URLs ending in `/rest/v1` to the project base URL before constructing browser and server Supabase clients. This matters because `/rest/v1` is the REST endpoint path, not the project URL used by `createClient`.
- Added automated test coverage for Supabase URL normalization, rejected unverified executive tokens, and removal of the unsafe account-creation route.
- Applied a focused single-sidebar-at-a-time CSS fix without merging the entire old mobile UI branch.

## OAuth configuration

Active Supabase project base URL:
`<SUPABASE_URL>` (use the value stored in Netlify environment variables; do not hard-code it in documentation)

Register this exact URI in the **Google Cloud OAuth Web Client used by Supabase Auth > Providers > Google**:
`<SUPABASE_URL>/auth/v1/callback` (replace the placeholder with the configured project URL in Google Cloud Console)

In Supabase Auth > URL Configuration, ensure the site URL is `https://angel-ai-new.netlify.app` and that the post-auth callback is allowed, including:
`https://angel-ai-new.netlify.app/auth/callback`

For Netlify preview deployment URLs, add only the preview wildcard appropriate to this app and hosting account. Do not copy Google provider callback URLs into the application's post-sign-in redirect allow-list, or vice versa; these are different settings.

The project URL variables in Netlify were found to contain a `/rest/v1/` suffix in some contexts and were corrected where the available Netlify management operation permits it. The application now also normalizes the path to tolerate a stale value in the uneditable `dev-server` context. Environment changes do not modify the already-published build. No deploy was triggered.

## Platform/configuration review

- Netlify site `angel-ai-new` exists and its last published deploy reports Ready. The main-branch backend smoke test nevertheless fails because the live alias reports the commit marker as `unknown`, not the expected SHA. This needs post-release verification; it must not be “fixed” by weakening the smoke assertion.
- Current Netlify configuration uses `npm run build`, publishes `dist`, uses `netlify/functions`, and rewrites `/api/*` to the Netlify function. The release branch passed type-check, backend smoke tests, and production build at SHA `b65803d2e2da1b0f1bf4abbb47a4de75f107b705`.
- Supabase project is ACTIVE_HEALTHY. The listed live migration history includes `20261019041809_harden_user_rls_policies`.
- Supabase Leaked Password Protection is a Pro-only setting and is deferred while the project is on Free. Revisit it after upgrading; it is not a release-blocking code change.
- Supabase performance advisor reports unused indexes. These are informational and should not be dropped during this release without query-plan and production-use analysis.
- The repository and Netlify site configuration use Supabase as the implemented auth/data platform. The main branch does not contain a Firebase SDK or `FIREBASE_*` runtime configuration; Firebase is therefore not part of the current app path and cannot be certified as integrated.
- Paid official OpenAI usage is guarded by explicit opt-in in backend code; do not enable it by default because this project is credit-sensitive.
- Secrets were inspected only as presence/masked metadata; secret values are not included in this report.

## Branch-by-branch disposition

The branches are not all merge candidates. A branch may contain useful individual commits while being hundreds of commits behind current main. To protect current main's later fixes, integrate reviewed files/patches into one release branch rather than blindly merging old branch heads.

| Branch | Comparison against main (latest inspected) | Audit/disposition |
|---|---:|---|
| `main` | baseline | Contains the unsafe executive token bypass, unsafe Google account-creation endpoint, wildcard OAuth relay, and automatic Pro defaults; fixed in release candidate, not yet main. |
| `release/predeploy-hardening-2026-10-20` | 5+ reviewed commits ahead, not behind at creation | Primary consolidation branch. Security, URL normalization, tests, sidebar fix. Build/test jobs pass as of SHA noted above. Recheck latest head before merge. |
| `feat/angel-persona-voice-foundation-2026-10-18` | 28 ahead / 2 behind | Valuable Angel persona/voice/AngelPresence work, documentation, RLS migration and tests. Earlier branch CI passed. Review and selectively integrate the persona and voice changes while keeping the secure OAuth implementation and Free defaults. |
| `feat/angel-roadmap-implementation-2026-10-17` | 40 ahead / 2 behind | Useful Research Workspace, Library persistence, settings/chat lifecycle and home improvements; PR #18 is draft. Large overlapping UI diffs, so not safe to merge as a whole. Selectively port after regression review. |
| `feat/adk-durable-mcp-runtime` | 10 ahead / 68 behind | ADK durability/MCP improvements; branch CI passed on the old head. Current main already contains ADK/MCP foundations. Compare the actual service delta and port only missing pieces; verify service deployment, token, DB and external endpoint prerequisites. |
| `feat/angel-capability-foundation` | 41 ahead / 71 behind | Python sandbox, capability catalog, ADK bridge, routing and source matrix. Historical CI passed. Current main already includes substantial capability infrastructure; avoid duplicating older versions. |
| `feat/filtered-angel-backend-foundation` | 383 ahead / 133 behind | Broad backend implementation with an earlier-base, oversized diff. CI fails type-check at `src/components/search/CommandPalette.tsx` due to wrong import `../utils/useIsLightTheme`; helper is under `src/utils`, so the path should be `../../utils/useIsLightTheme`. Do not merge this branch whole. Fix isolated, relevant defects only if the affected feature is selected. |
| `feat/backend-persistence-and-hardening` | 28 ahead / 79 behind | Persistence, media/research, rate-limiting and migrations. Too far behind and overlaps current server/database implementation. Port only missing, independently tested capability deltas. |
| `feat/hymt2-translation-backend` | 8 ahead / 72 behind | Translation backend and status surface. Historical Netlify readiness passed on its newest inspected commit. Verify provider endpoint/credential and runtime response before marketing as working. |
| `feat/qwen-pro-multi-reference-edit` | 16 ahead / 69 behind | Qwen Image service and multi-reference media UI; historical branch checks passed. Review external endpoint/key, timeout/size limits and actual image result. Do not import older server.ts wholesale. |
| `feat/visual-mode-screen-share-cross-device-2026-10-09` | 5 ahead / 163 behind | Updated visual/screen-share UI and voice requirements. Very old base; manually compare its VisualMode changes with current main before porting. Two-device and browser permission tests remain needed. |
| `feat/angel-auth-security-hud` | 18 ahead / 2 behind | Secure Vault, local encryption, offline persistence, HUD and a SQL migration. The current code has multiple Pro defaults on this branch, and its migration has not been applied by this audit. Do not ship vault UI until encryption key lifecycle, recovery, RLS and migration are tested. |
| `feat/angel-auth-encryption-hud-2026-10-17` | 0 ahead / 2 behind | No unique commit delta vs main when inspected; no separate code to merge. |
| `fix/mobile-single-sidebar-guest-and-auth-2026-10-10` | 2 ahead / 133 behind | Narrow sidebar visibility fix selected and applied as a focused patch on the release branch. Do not merge the stale history. |
| `fix/angel-mobile-pwa-auth-and-ux-2026-10-11` | 46 ahead / 133 behind | PWA/auth/home/chat changes on an older base, overlaps much newer current files. Review selected functionality only; avoid the whole merge. |
| `fix/auth-guest-home-2026-10-09` | 12 ahead / 165 behind | Guest/auth/home fixes; very old AppContext changes overlap modern branch. Use only as reference if a current regression is reproduced. |
| `fix/google-oauth-profile-persistence-2026-10-09` | 5 ahead / 162 behind | OAuth profile persistence changes and setup guide. Needs comparison against current OAuth/session lifecycle; do not restore obsolete callback or identity fallback code. |
| `fix/google-oauth-ui-recovery-2026-10-09` | 17 ahead / 160 behind | OAuth UX changes; old auth code. Use for user-facing recovery ideas only after checking with hardened flow. |
| `fix/home-truthful-activity-2026-10-09` | 1 ahead / 164 behind | One DailyDigest change; small old patch, not a branch merge. |
| `angel-fix-audit-2026-10-03` | 2 ahead / 168 behind | Mostly old backdrop/CSS changes with a large CSS diff. Superseded by current UI; no full merge. |
| `fix/angel-final-ui-2026-10-03` | 28 ahead / 168 behind | Old ChatComposer/Chat/Home/Sidebar/CSS implementation; overlaps other stale UI branches. Do not merge. |
| `fix/angel-vercel-ui-model-2026-10-03` | 16 ahead / 168 behind | Old UI and Vercel config. User selected Netlify, so Vercel changes are out of scope; no merge. |
| `fix/final-preview-safe-2026-10-03` | 23 ahead / 168 behind | Another overlapping old Chat/Home/Sidebar implementation; no merge. |
| `fix/final-ui-preserve-main-2026-10-03` | 12 ahead / 168 behind | Duplicated UI overrides on an old base; no merge. |
| `fix/preserve-main-ui-2026-10-03` | 17 ahead / 168 behind | Old UI/CSS and Vercel config; duplicate work. Do not merge. |
| `fix/build-dependency-conflict-2026-10-09` | 6 ahead / 166 behind | Old package/lock and small CSS changes; superseded by current dependency config. Do not merge. |
| `fix/vercel-supabase-connection-2026-10-03` | 0 ahead / 168 behind | No unique commits relative to main; stale. |
| `fix/netlify-production-smoke` | 5 ahead / 70 behind | Older smoke workflow/script. Do not lower the verification bar to green the current live alias; fix/revalidate the deployed version marker after release. |
| `migration/netlify-preview` | 12 ahead / 73 behind | Older Netlify config/function path. Current main already has Netlify function config, build and rewrite; compare only if fixing deploy-specific failures. |
| `migration/aws-amplify-preview` | 25 ahead / 73 behind | AWS migration branch. Not the selected target; do not merge AWS deployment/configuration into Netlify release. |
| `research/angel-capability-audit-2026-10-17` | 0 ahead / 3 behind | No unique commits to merge. |
| `fix/mobile-single-sidebar-guest-and-auth-2026-10-10` | 2 ahead / 133 behind | Narrow fix already applied above; no raw merge. |

## Remaining readiness gates

1. Register the exact Supabase OAuth callback URL in Google Cloud Console (manual action).
2. Confirm Supabase Auth URL Configuration allows the Netlify site callback.
3. Enable leaked-password protection in Supabase Auth settings.
4. Re-run CI against the final consolidation head and review branch diff/security grep.
5. Perform real Google OAuth testing after the external configuration change.
6. Verify critical backend routes and real AI generation in the deployed preview or controlled browser environment. CI alone does not prove third-party provider credentials work.
7. Re-check the main live deployment version marker; do not weaken the smoke test.
8. Only after every release gate passes, merge to main and ask for/execute production deployment according to the user's explicit approval. **No production deployment is done by this report.**
