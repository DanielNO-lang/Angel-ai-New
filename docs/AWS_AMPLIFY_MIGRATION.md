# AWS Amplify + ECS Express Mode migration (preview only)

Status: preview configuration prepared on `migration/aws-amplify-preview`. No AWS resources were created and no production deployment was triggered.

## Hosting design

- **AWS Amplify Hosting** serves the static React/Vite/PWA frontend.
- **Amazon ECS Express Mode** runs the existing Express API as a container. AWS closed App Runner to new customers in 2026, so ECS Express Mode is the supported AWS path for a new account. See [AWS App Runner availability change](https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html) and [ECS Express Mode overview](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html).
- **Amazon ECR** stores the API container image.
- **AWS CodeBuild** builds the image from the migration branch and pushes it to ECR.
- **Supabase remains the existing data/auth provider**. Do not create a replacement Supabase project.

## 0. Confirm the AWS account can create services

Sign-in alone does not prove billing verification or service permissions are complete. Open the AWS Console and confirm you can open Amplify, CodeBuild, ECR and ECS. If AWS still presents an account activation/payment verification banner, resolve that with AWS before creating billable resources. Review the Cost Explorer/Billing dashboard and set a budget alert first; credits reported by the owner are not independently verified here.

## 1. Create a preview frontend in Amplify

1. Open [AWS Amplify](https://console.aws.amazon.com/amplify/).
2. Choose **Create new app / Host web app**, select GitHub and authorize the Amplify GitHub App for repository `DanielNO-lang/Angel-ai-New` only.
3. Choose branch `migration/aws-amplify-preview`, never `main` for this preview.
4. Confirm the repository's `amplify.yml` is used. It runs the backend smoke contract test, builds the Vite frontend, and publishes `dist/`.
5. Deploy the preview branch only. Do not merge or promote production.

Official reference: [Amplify GitHub access](https://docs.aws.amazon.com/amplify/latest/userguide/setting-up-GitHub-access.html) and [Amplify build settings](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html).

## 2. Create the ECR repository for the API image

1. Open [Amazon ECR repositories](https://console.aws.amazon.com/ecr/repositories).
2. Use the same AWS Region you plan to use for ECS.
3. Choose **Create repository → Private**.
4. Repository name: `angel-ai-api`. Keep the defaults unless AWS requires a choice.
5. Copy the repository URI; it includes the AWS account ID and region.

Official reference: [Create an ECR private repository](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-create.html).

## 3. Create a CodeBuild project to build and push the image

1. Open [AWS CodeBuild](https://console.aws.amazon.com/codesuite/codebuild/projects).
2. Create a project named `angel-ai-api-preview-build`.
3. Source provider: GitHub. Connect the repository `DanielNO-lang/Angel-ai-New` and select branch `migration/aws-amplify-preview`.
4. Environment: managed Linux image, standard image with Docker support. Enable **Privileged** mode because the build uses `docker build`.
5. Buildspec: choose a buildspec file and enter `buildspec.aws-ecr.yml`.
6. Add environment variable `ECR_REPOSITORY` = `angel-ai-api`. Use the AWS region where you created the repository as the CodeBuild region/default region.
7. In the CodeBuild service role permissions, allow the minimum required ECR push actions for that one repository: `ecr:GetAuthorizationToken` (resource `*`) and `ecr:BatchCheckLayerAvailability`, `ecr:CompleteLayerUpload`, `ecr:InitiateLayerUpload`, `ecr:PutImage`, `ecr:UploadLayerPart` scoped to the repository. Keep normal CloudWatch Logs permissions. Do not grant broad administrator access.
8. Start a build. It must finish successfully and publish the `:preview` image tag in ECR.

The repository contains a multi-stage `Dockerfile` for the Node.js 22 Express server. It listens on port 3000 and serves the built frontend files as a fallback; Amplify will host the actual frontend.

Official references: [ECR push workflow](https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html) and [ECS Express Mode](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-first-run.html).

## 4. Create the ECS Express Mode API service

1. Open [Amazon ECS](https://console.aws.amazon.com/ecs/v2/), choose **Express mode**.
2. Select the image from the private ECR repository `angel-ai-api`, tag `preview`.
3. If prompted, use the console's **Create new role** options for the task execution role and infrastructure role. Do not create access keys for these roles.
4. Set container port to `3000` and health check path to `/api/health`.
5. Configure the server environment variables listed below. Store secret values in AWS Secrets Manager where supported, rather than in Git or public frontend variables.
6. Keep the service name clearly marked as preview, e.g. `angel-ai-api-preview`. Review CPU/memory and estimated costs before creating it.
7. Create the service, wait until it is healthy, and test the provided HTTPS URL ending in `/api/health`. It must return HTTP 200 with Angel's expected health response.

ECS Express Mode provisions the supporting load balancer, TLS, scaling and monitoring, but the underlying AWS resources can incur charges. The AWS Console's defaults may use 1 vCPU and 2 GB memory; inspect the cost implications before accepting them.

Official reference: [Create an ECS Express Mode service in the console](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-first-run.html).

## 5. Configure Amplify environment variables

In Amplify → App settings → Environment variables, set only browser-safe values:

- `VITE_SUPABASE_URL`: existing Angel Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: existing publishable/legacy anon key.

Never put `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, GitHub tokens or webhook secrets in frontend variables. Vite variables beginning with `VITE_` are embedded in browser assets and are public.

## 6. Configure ECS service variables and secrets

Set server-side values in the ECS Express Mode service configuration, not in Git:

**Core AI**
- `GEMINI_API_KEY` (required for Gemini chat)
- `OPENAI_API_KEY` (optional provider fallback)

**Supabase**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (privileged, server-only)

**Admin and optional integrations**
- `ADMIN_EMAILS` (exact email allowlist for admin-only operations)
- `GITHUB_TOKEN`, `GITHUB_REPO_OWNER=DanielNO-lang`, `GITHUB_REPO_NAME=Angel-ai-New` only if GitHub integration features are needed
- `OUTBOUND_WEBHOOK_URL`, `WEBHOOK_SECRET` only if outbound automations are configured
- `WEBHOOK_CALLBACK_ALLOWLIST` with exact approved callback hostnames only if callbacks are required
- `ZAPIER_OUTBOUND_WEBHOOK_URL`, `ZAPIER_WEBHOOK_SECRET` only if using the legacy Zapier integration

### Where to obtain values

- `GEMINI_API_KEY`: Google AI Studio → **Get API key**.
- `OPENAI_API_KEY` (optional): OpenAI Platform → API keys.
- Supabase values: existing Supabase project → **Project Settings → API**. Labels may say publishable/secret in newer projects.
- `GITHUB_TOKEN` (optional): GitHub → Settings → Developer settings → Personal access tokens; use minimum permissions for the integration.
- Webhook URL: copy from the automation provider's own trigger/catch-hook page. Do not guess it.
- `WEBHOOK_SECRET`: generate a strong random secret in a password manager/secrets manager and configure the matching receiver.
- `ADMIN_EMAILS`: exact email(s) allowed to use privileged integrations, comma-separated.

Do not paste private keys into chat or commit them. If a key has already been exposed publicly, revoke it and create a replacement. Do not change the existing Supabase project or rotate its credentials as part of this hosting move.

## 7. Route Amplify API requests to ECS

Only after the ECS service passes its health check:

1. Open Amplify → **App settings → Rewrites and redirects**.
2. Add the API rule above the SPA fallback:
   - Source: `/api/<*>`
   - Target: `https://YOUR-ACTUAL-ECS-EXPRESS-URL/api/<*>`
   - Type: `200 (Rewrite)`
3. Retain the SPA fallback:
   - Source: `/<*>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`
4. Replace the placeholder with the actual HTTPS hostname returned by ECS. Never guess it.

Then add the actual Amplify preview hostname to Supabase Auth redirect URLs where required. Keep Google OAuth's callback pointed at the existing Supabase callback URL.

## 8. Acceptance checks before any production change

- Amplify preview build passes and the PWA loads.
- ECS `/api/health` returns HTTP 200.
- Amplify `/api/health` reaches ECS through the rewrite.
- `/api/ai/providers` responds; a real Gemini request/stream succeeds with a configured key.
- Google/email authentication, session persistence, chat history, memory, task sync and RLS ownership are tested against the existing Supabase project.
- Workflow approval/cancellation, reading, voice, media and webhook paths are individually tested.
- Mobile navigation and PWA installation are tested on real devices before making device-support claims.
- Performance baseline and after-change measurements are recorded.

## Remaining external steps

The connected tools available in this chat do not provide AWS account resource creation. I have prepared the branch, build configurations and deployment instructions, but no AWS service has been created or deployed by these changes. The AWS console actions, GitHub authorization, service roles, secrets, ECR image build, ECS service, Amplify rewrite and live verification still require your account access.

Do not merge this branch to `main`, change production hosting or disable the current rollback path until the preview has passed all checks and you explicitly authorize the production migration.
