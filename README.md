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

## 3. Platform Deployment

### Deploy to Vercel
This repository is pre-configured with a framework-standard `vercel.json` and a serverless API adapter (`api/index.ts`).

1. Push your repository to GitHub or GitLab.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Set the Framework Preset to **Vite**.
4. Configure Environment Variables in Project Settings:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` (optional)
   - `OUTBOUND_WEBHOOK_URL` & `WEBHOOK_SECRET` (optional)
5. Deploy. Vercel routes `/api/*` to the serverless function and all other routes to the Vite single-page application.

Alternatively, deploy using the Vercel CLI:
```bash
npm install -g vercel
vercel
vercel --prod
```

### Deploy to Docker / Google Cloud Run / Container Platforms
The standalone server binds to `0.0.0.0:$PORT` (defaults to port 3000):
```bash
npm run build
npm start
```

---

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
