# Angel AI — Personal AI Workspace & Agent Platform

Angel is a personal AI workspace and multi-agent system designed for autonomous task execution, deep memory retrieval, visual perception, and cross-platform automation.

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Angel AI Client (React 19)                      │
│   Chat • Agent Lab • Task Matrix • Memory Vault • Visual Mode • Search │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP / SSE / JSON
┌────────────────────────────────────▼───────────────────────────────────┐
│                 Full-Stack API Server (Node / Express)                 │
│  • Provider Abstraction (Gemini 3.8 Flash, OpenAI, Mock fallbacks)     │
│  • 9-Step Autonomous Agent Execution Orchestrator                      │
│  • Multi-Channel Visual Perception & ROI Processing Pipeline          │
│  • Portable Serverless Adapter (`api/index.ts` for Vercel)             │
│  • Automation & Webhook Dispatcher (HMAC SHA-256 signed events)        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼──────────────┐   ┌─────────────▼───────────────────┐
│    Supabase Cloud Persistence    │   │  Automation Subscribers & APIs │
│  PostgreSQL • pgvector • RLS     │   │  Zapier • Make • n8n • Webhooks │
└──────────────────────────────────┘   └─────────────────────────────────┘
```

---

## 2. Quickstart & Local Development

### Prerequisites
- Node.js >= 20.0.0
- npm or pnpm

### Installation
```bash
# Clone repository
git clone https://github.com/<your-org>/angel-ai-workspace.git
cd angel-ai-workspace

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY
```

### Running Locally
```bash
# Start full-stack development server on port 3000
npm run dev

# Run TypeScript typecheck
npm run lint

# Build production bundle (Vite client + standalone Node server)
npm run build

# Start production server
npm start
```

---

## 3. Deploy to Netlify

Angel AI New is configured for Netlify hosting. The frontend is built by Vite into `dist`; the Express API runs as a Netlify Function and `/api/*` requests are routed to it.

### Netlify build settings

The repository's `netlify.toml` defines the build command, publish directory, Function directory, API rewrite, and SPA fallback:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node.js:** 22
- **Function entry:** `netlify/functions/api.ts`

Connect the Netlify project to the GitHub repository `DanielNO-lang/Angel-ai-New`. Deploy the `migration/netlify-preview` branch first to validate the preview before switching production deployment to `main`.

### Environment variables

Store variables in Netlify's project environment settings, never in source control.

| Variable | Purpose |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Public Supabase URL used by the browser |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Supabase publishable key used by the browser |
| `SUPABASE_URL` | Supabase URL used by server code |
| `SUPABASE_ANON_KEY` | Public/anon key used by server code |
| `GEMINI_API_KEY` | **Secret.** Required for Gemini chat, streaming, and multimodal AI features |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Server-only elevated database access, when needed |
| `OPENAI_API_KEY` | Optional secret for the secondary AI provider |
| `GITHUB_TOKEN` | Optional secret for in-app GitHub operations |
| `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` | Default repository for in-app GitHub operations |
| `OUTBOUND_WEBHOOK_URL` / `WEBHOOK_SECRET` | Optional automation/webhook integration |

Never use a `VITE_` prefix for private keys. Public Supabase keys are protected by the database's Row Level Security policies; a service-role key is never safe to expose in browser code.

### Connecting Supabase authentication

Keep the existing Supabase project and OAuth provider callback. In Supabase **Authentication → URL Configuration**, add the new production origin to the allowed redirect URLs:

`https://angel-ai-new.netlify.app/**`

Do not change the provider callback URL. Add a preview URL pattern only if preview deployments need sign-in.

### Hy-MT2 translation backend

Angel exposes a dedicated translation API powered by Tencent Hy-MT2 when an OpenAI-compatible inference endpoint is configured. The model weights are hosted separately; the Netlify Function proxies requests to that endpoint without downloading weights into Netlify.

- `GET /api/translation/status` reports the model and endpoint configuration state.
- `POST /api/translation/translate` accepts `{ "text": "Hello", "sourceLanguage": "English", "targetLanguage": "Chinese" }` and returns the translated text.
- Optional `style` and `context` fields guide specialist translation.
- Set `HYMT2_API_BASE_URL`, `HYMT2_API_KEY` (if required), and `HYMT2_MODEL_ID` in Netlify's **server-side** environment settings. Never prefix these values with `VITE_`.

See [the Hy-MT2 backend integration guide](./docs/HY-MT2-INTEGRATION.md) for setup and test examples.

## 4. Automation & Webhook Architecture

Angel features an event-driven automation layer with cryptographic HMAC SHA-256 payload signing.

### Supported Event Triggers
| Event Type | Trigger Condition |
| :--- | :--- |
| `task.created` | New task created manually or autonomously by an agent |
| `task.completed` | Task status changed to completed |
| `agent.executed` | Agent completes 9-step execution lifecycle |
| `message.received` | AI assistant generates an approved response |
| `memory.created` | Knowledge stored in persistent Memory Vault |
| `memory.updated` | Existing memory edited or re-indexed |
| `workflow.completed` | Multi-agent sequence finishes all stages |

### Outbound Webhook Security
When `WEBHOOK_SECRET` is configured, all outbound HTTP POST requests include:
- `X-Angel-Event`: Name of the event trigger (e.g. `task.created`)
- `X-Angel-Delivery-Id`: Unique event UUID (`evt_<timestamp>_<hash>`)
- `X-Angel-Timestamp`: ISO-8601 UTC timestamp
- `X-Angel-Signature`: `sha256=<hmac_hex_digest>`
- `X-Angel-Webhook-Secret`: Shared secret token

### Inbound Webhook Listener
External automation tools (Zapier, Make, custom backends) can dispatch commands into Angel:
- **Endpoint**: `POST /api/webhooks/inbound`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Angel-Webhook-Secret: <your_secret>` or `X-Angel-Signature: <signature>`
- **Payload Example**:
  ```json
  {
    "event": "external.trigger",
    "data": {
      "action": "create_task",
      "title": "Review deployment pipeline",
      "priority": "high"
    },
    "callbackUrl": "https://hooks.zapier.com/hooks/catch/12345/callback"
  }
  ```

---

## 5. Environment Variables Reference

Refer to `.env.example` for the full schema of configuration variables. All secrets are strictly server-side and never bundled into client assets.
