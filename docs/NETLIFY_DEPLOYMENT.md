# Angel AI New: Netlify deployment checklist

This setup uses the existing Supabase project and the GitHub repository `DanielNO-lang/Angel-ai-New`. It does not require a new database.

## 1. Connect GitHub to the new Netlify project

In the Netlify dashboard, open the `angel-ai-new` project, then open **Project configuration → Build & deploy → Continuous deployment** and choose **Link repository**. Select GitHub, authorize Netlify if prompted, select `DanielNO-lang/Angel-ai-New`, and choose `migration/netlify-preview` for the first validation deploy. The root `netlify.toml` supplies the build configuration.

After the preview passes smoke checks, set the production branch to `main`.

## 2. Supabase

Use the existing Supabase project:

- URL: `<SUPABASE_URL>` (use the project's configured URL from the Netlify environment variables; do not hard-code it in documentation)
- Browser variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Server variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

The public variables are already set in the new Netlify project. Add the following private values through Netlify's environment-variable screen; never commit them:

- `GEMINI_API_KEY` (required for the AI features)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required only for the server operations that use elevated Supabase access)
- `OPENAI_API_KEY` (optional secondary provider)
- `GITHUB_TOKEN` (optional in-app GitHub controls)
- `OUTBOUND_WEBHOOK_URL` and `WEBHOOK_SECRET` (optional automations)

The repository defaults `GITHUB_REPO_OWNER=DanielNO-lang` and `GITHUB_REPO_NAME=Angel-ai-New`.

In Supabase, go to **Authentication → URL Configuration** and add `https://angel-ai-new.netlify.app/**` to the allowed redirect URLs. Do not replace the configured Supabase OAuth callback URL. Leave the existing Site URL unchanged until any old app that shares this Supabase project has been checked, because that setting also influences email-link redirects.

## 3. Netlify build

The root `netlify.toml` configures:

- `npm run build`
- publish directory `dist`
- Node 22
- Express API through `netlify/functions/api.ts`
- `/api/*` routing before the SPA fallback

The build writes the server bundle to `server-build/`, outside the public `dist/` publish directory. The server startup guard checks the Netlify runtime so the function does not try to start a separate port listener.

## 4. Verification still required after linking

- Netlify build succeeds and the published URL loads.
- `/api/models` responds with provider status.
- `/api/ai/providers` responds with the available AI providers.
- `/api/ai/generate` succeeds after `GEMINI_API_KEY` is set.
- Sign-in and return-to-app redirects work against the existing Supabase project.
- Authenticated sync endpoints return expected results under existing database RLS policies.
