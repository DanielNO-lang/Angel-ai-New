# Angel AI backend setup and remaining operator steps

This branch hardens the backend and adds an owner-scoped Supabase migration. It is deliberately not merged to production automatically.

## 1. Database migration status

**Completed:** The migrations `angel_owner_scoped_workspace`, `memory_provenance_sensitivity`, `api_rate_limits_service_only`, `distributed_api_rate_limit_rpc_hardening`, `durable_webhook_history`, and `admin_audit_events` were applied to the active Angel Supabase project `qltiogotxbxwzwmnypwu` on 2026-10-15 and confirmed in the migration history. Before applying it, the core workspace tables were verified to contain zero rows, so there were no existing task/memory/project/chat records to reassign.

For a new environment, apply the repository migrations in order: `supabase/migrations/20261015000100_owner_scoped_workspace.sql`, `supabase/migrations/20261015193000_memory_provenance_sensitivity.sql`, then `supabase/migrations/20261015194000_api_rate_limits_service_only.sql`, and `supabase/migrations/20261015195000_distributed_rate_limit_rpc.sql`, using Supabase migrations or **SQL Editor → New query**. Back up any database with existing user data first. Existing rows with a NULL `user_id` are intentionally hidden by owner policies; never bulk-assign those rows to the first user. Review and map legacy rows to their actual owner first.

The migration creates missing core workspace tables, adds owner columns and current workspace fields, and applies owner policies for tasks, memories, projects, workflows, library items, agents, conversations, and messages.

## 2. Verify Vercel environment configuration

The current Vercel project already reports these variable names in its environment inventory: `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_EMAILS`. Secret values were not read or displayed.

Confirm:
- `VITE_SUPABASE_URL` points to the intended Supabase project.
- `VITE_SUPABASE_PUBLISHABLE_KEY` is the publishable/anon key for that same project.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are server-only and point to the same project. Never prefix the service-role key with `VITE_`.
- `GEMINI_API_KEY` exists in Production and Preview, and is the real key, not a placeholder.
- `ADMIN_EMAILS` contains the exact email address(es) allowed to administer private integrations. Admin access additionally requires a verified Supabase Auth session.
- After changing any Vite-prefixed variable, redeploy because Vite variables are baked into the client bundle at build time.

Do not paste secret values into chat or commit them to GitHub.

## 3. Verify Auth and data isolation

After the migration and deployment:
1. Create/sign in to account A.
2. Create one task, one memory, one project, and one conversation.
3. Confirm the records have account A's Supabase Auth UUID in `user_id`.
4. Sign out and sign in as account B.
5. Confirm account B cannot read, update, or delete account A's records.
6. Confirm guest mode still works locally and does not create cloud records.
7. Check the browser Network panel for RLS/auth errors. Do not resolve them by exposing the service-role key to the browser.

## 4. Features intentionally restricted until the next implementation pass

- The old server-side bulk sync endpoints return 503 because they used a privileged service-role client without verified per-user ownership. The browser sync path now derives `user_id` from the verified Supabase session and sends owner-scoped records.
- Private GitHub/Vercel integration endpoints require a verified Supabase user whose email is listed in `ADMIN_EMAILS`. The UI must send the active Supabase access token in `Authorization: Bearer <token>`; until that integration call path is verified, the endpoints should remain unavailable rather than be made public.
- Agent tool execution still needs the full server-side approval/policy engine before consequential actions can be enabled.
- Grounded search, durable webhook audit history, and the full approval ledger remain future implementation work.

## 5. Gemini grounded-search quota blocker

The real `POST /api/search/web` endpoint was tested against Vercel Preview. Google returned `429 RESOURCE_EXHAUSTED` with a quota/billing message. The endpoint now returns an explicit 429 explanation and does not manufacture results. This is an external Gemini project quota issue, not a failed code build.

Fix it in Google AI Studio:
1. Open [Google AI Studio](https://aistudio.google.com/) and select the Google project associated with the `GEMINI_API_KEY` used by Vercel.
2. Open **Dashboard → Usage** and **Rate limits**. Check the selected project, the configured model, and the separate Search grounding limits. Gemini quotas are project-based, not per API key.
3. If you hit a temporary per-minute limit, wait for the reset and retry. If you exhausted free-tier/day quota or a spend cap, open **Billing**, link an active billing account or add prepaid credits if prompted, and review the project's spend cap. Request a rate-limit increase only if the normal workload consistently exceeds the current tier.
4. Confirm the API key used by Vercel belongs to that same project. Keep the key server-side and do not paste it into chat or commit it to GitHub.
5. Retry the grounded-search feature from the signed-in Angel Preview after AI Studio shows quota available.

Official guidance: [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [Gemini API billing](https://ai.google.dev/gemini-api/docs/billing), and [Gemini troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting).

## 6. Remaining Supabase dashboard setting

The Supabase security advisor currently reports **Leaked Password Protection Disabled**. Enable it in the Supabase Dashboard under **Authentication → Settings / Security and Protection** (the exact section label can vary), then save. This is an Auth configuration setting, not a SQL migration.

The `api_rate_limits` table now has an explicit `service_role`-only RLS policy, and the atomic `consume_api_rate_limit` RPC is restricted to `service_role`; the latest security advisor no longer reports the table as policy-less. Webhook delivery history and privileged admin access audits are also stored in service-role-only tables.

## 7. Verification status

The repository includes CI for tests, type-checking, and production build. Do not merge until the GitHub Actions results are green and the Vercel Preview has been checked. A successful Git commit is not proof of a successful build or production deployment.
