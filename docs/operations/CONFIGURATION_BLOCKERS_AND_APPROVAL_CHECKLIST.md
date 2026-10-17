# Angel AI configuration blockers and operator checklist

Date: 2026-10-17
Scope: guidance only. This document does not create or change any secret, deployment, or database object.

## Deployment and branch safety

- Production host: Netlify, site `angel-ai-new`.
- Source of truth: GitHub repository `DanielNO-lang/Angel-ai-New`.
- All changes must be made on a named feature/research branch first.
- Do not merge to `main` or deploy to Netlify until the user explicitly approves both steps.
- Do not use Vercel for deployment. Remove any Vercel references from user-facing deployment controls only after reviewing the feature impact; retain legacy integration code only if it is intentionally supported and clearly labelled optional.

## Secret setup steps (operator action required)

1. Open Netlify and select the `angel-ai-new` site.
2. Open **Site configuration** (or **Project configuration**) → **Environment variables**.
3. Add or update only the variables required for the features you intend to enable. Set the scope to **Functions** / **All deploy contexts** as appropriate for the site's current UI. Do not put server-only secrets in `VITE_*` variables.
4. Save changes. Netlify environment-variable changes require a new deploy before deployed functions can read them. Do not trigger that production deploy until the user explicitly approves it.
5. After an approved deploy, run the branch's health/smoke checks and confirm the live API reports the provider configured. Never paste values into a chat, issue, commit, or log.

### Required or optional credentials

- `GEMINI_API_KEY`: required for the current Gemini generation and grounded research flow. Obtain from the authorized Google AI Studio project owner; store only in Netlify's server-side environment variables.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or the supported public-key alias): required for server-side user-scoped Supabase access. The existing public frontend URL/key should not be treated as proof that privileged backend operations are configured.
- `SUPABASE_SERVICE_ROLE_KEY`: only for server operations that explicitly require elevated privileges (for example durable server-side rate limiting). Obtain from the correct Supabase project settings. Keep server-only and never expose it to the browser. Use the least privilege alternative if the feature can work without it.
- `OPENAI_API_KEY`: optional if OpenAI is to be enabled as an additional provider.
- Qwen image API credentials: optional; required only for live Qwen Image 2.1 Pro/Turbo API use. Use the official provider account and endpoint.
- ADK external runtime URL and authentication: optional; required only if the separate Google ADK Python service is actually provisioned.
- Python sandbox endpoint and authentication: optional; required only if a separately isolated execution service is provisioned. Do not execute untrusted Python inside the Netlify API process.
- Hy-MT2 endpoint and authentication: optional; required only if the external translation provider is provisioned.
- `GITHUB_TOKEN`, repository owner/name: optional for GitHub write/read features. Use a fine-grained token restricted to the single intended repository and only the permissions required.
- `OUTBOUND_WEBHOOK_URL` and `WEBHOOK_SECRET`: optional for outbound automation. Start with a test destination, sign requests, and avoid exposing the secret in client variables.
- `VERCEL_TOKEN` and related Vercel project IDs: not required for Netlify deployment. Do not add them just to make the deployment status green. If the legacy Vercel integration remains in the product, label it as an optional external integration rather than Angel's deployment target.

## What cannot be fixed by code alone

- Missing API keys or external service accounts: the account owner must provide/configure them.
- GPU inference, NVIDIA Model Optimizer, and GPU Operator: require separately provisioned compatible GPU infrastructure; they cannot be enabled merely by adding code to Netlify.
- Google ADK and Python sandbox: require a separately hosted and secured service before the bridge can pass an end-to-end test.
- Wheelhouse OS-level keyboard/mouse/window control: requires a supported local Windows companion app and explicit user permissions; a browser-only web deployment cannot perform these actions by itself.
- Supabase security advisories: review policy semantics and test them before changes. Leaked-password protection can be enabled by a Supabase project administrator. Unused indexes should not be dropped solely because an advisor reports them unused.
- Netlify function HTTP 502s: use the request ID and timestamp in Netlify observability to inspect function runtime/build logs. The available edge-request records show failed invocations but not the underlying exception, so changing application code without the function error would be guesswork.

## Acceptance checklist before asking to merge

- [ ] Branch type-check passes.
- [ ] Unit/backend tests pass.
- [ ] Netlify preview (if enabled by the user) reports health and commit SHA correctly.
- [ ] Gemini live generation passes using a real configured credential.
- [ ] Integration status exposes configuration booleans only, never secret values.
- [ ] Authenticated Supabase persistence passes with a real user session and RLS.
- [ ] MCP calls require auth, use schema validation and tool allowlists, and reject unauthorized actions.
- [ ] External runtimes have real health checks and bounded timeouts.
- [ ] Every feature is marked implemented, tested, awaiting configuration, or not applicable.
- [ ] User explicitly approves merge to main.
- [ ] User separately explicitly approves production deployment to Netlify.
