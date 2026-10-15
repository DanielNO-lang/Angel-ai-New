# Angel AI backend setup and remaining operator steps

This branch hardens the backend and adds an owner-scoped Supabase migration. It is deliberately not merged to production automatically.

## 1. Apply the database migration

In Supabase, open the project used by Angel, then **SQL Editor → New query**. Open the repository file `supabase/migrations/20261015000100_owner_scoped_workspace.sql`, copy its contents into the SQL Editor, and run it.

Before running it against a database with existing user data, take a database backup. Existing rows with a NULL `user_id` are intentionally hidden by the new RLS policies. Do not bulk-assign those rows to the first user. Review and map legacy rows to their actual owner first.

The migration creates missing core workspace tables, adds owner columns, and replaces owner policies for tasks, memories, projects, workflows, library items, agents, conversations, and messages.

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

## 5. Verification status

The repository includes CI for tests, type-checking, and production build. Do not merge until the GitHub Actions results are green and the Vercel Preview has been checked. A successful Git commit is not proof of a successful build or production deployment.
