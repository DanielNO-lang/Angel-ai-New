# Angel ADK Python bridge

This is an optional, separately deployed Google ADK 2.0 service. It is not run inside the Netlify Function. It exposes an authenticated `POST /run` endpoint, a multi-agent `Agent`/ `Runner` runtime, durable-session support through ADK's `DatabaseSessionService`, and an optional request-scoped connection to Angel's authenticated MCP endpoint.

## Local setup

Requires Python 3.11+ and a reachable Google model API.

```bash
cd python/adk_service
uv sync
export GOOGLE_API_KEY="your-server-side-Google-API-key"
export ANGEL_ADK_SERVICE_TOKEN="a-long-random-shared-service-token"
# For a local in-memory test, leave ANGEL_ADK_DATABASE_URL and
# ANGEL_ADK_MCP_SERVER_URL unset.
uv run uvicorn main:app --host 0.0.0.0 --port 8080
```

Health check: `GET /health`. It reports whether session persistence is in-memory or database-backed and whether MCP tools are configured, without exposing endpoints or credentials.

## Optional durable sessions

Set `ANGEL_ADK_DATABASE_URL` in the external service's secret store to a SQLAlchemy async database URL. For a shared production deployment, use PostgreSQL, for example:

```text
postgresql+asyncpg://<user>:<password>@<host>:5432/<database>
```

The database must be reachable from every ADK instance, use TLS where supported, have backups, and be restricted to this service. ADK persists its session/events; the application no longer relies on an in-memory external-to-internal session map. Without this setting, `/health` reports `in-memory (single instance only)` and sessions are lost when the process restarts.

## Optional Angel MCP tools

Set `ANGEL_ADK_MCP_SERVER_URL=https://angel-ai-new.netlify.app/api/mcp` in the external ADK service. Angel's Netlify endpoint requires a verified user's Supabase Bearer token. When a signed-in user calls `/api/agents/adk/run`, the backend forwards that user's access token over HTTPS for this request only. ADK places it in the MCP HTTP Authorization header and never adds it to the conversation or stored session state.

The request-scoped MCP toolset exposes the allowlisted capability/skill lookup, Hy-MT2 translation, Qwen/image generation, and isolated Python execution tools. It excludes `angel_adk_run` so an ADK agent cannot recursively invoke itself. Each invocation gets its own toolset and closes it when the request finishes.

If `ANGEL_ADK_MCP_SERVER_URL` is configured but no user token is supplied, the request fails closed instead of using shared credentials to access user data. The shared `ANGEL_ADK_SERVICE_TOKEN` authenticates Angel to this service; it is not the same as the user's Supabase token.

## Run contract

Request (Bearer service token required):

```json
{
  "appName": "angel-adk-bridge",
  "userId": "verified-user-id",
  "sessionId": "optional-session-id",
  "message": "Plan a safe test-first implementation",
  "mcpAccessToken": "per-request-user-token-if-MCP-enabled"
}
```

The `mcpAccessToken` property is optional only when MCP is not enabled; do not use it as a general agent prompt or save it as session state.

Response:

```json
{
  "success": true,
  "response": "...",
  "sessionId": "optional-session-id",
  "appName": "angel-adk-bridge",
  "durationMs": 100,
  "sessionPersistence": "database",
  "mcpToolsUsed": true
}
```

## Configure Angel / Netlify

In the Netlify project environment settings, set:

- `ANGEL_ADK_RUN_URL=https://<your-service>/run`
- `ANGEL_ADK_API_KEY=<same value as ANGEL_ADK_SERVICE_TOKEN>`
- optionally `ANGEL_ADK_APP_NAME=angel-adk-bridge`

Never put these values in browser variables or source control. Keep the database URL, Google API key, user MCP token and ADK service token in server-side secret stores only.

## Operational boundaries

- Netlify remains Angel's web/API host. ADK and its SQLAlchemy database run in a separate runtime.
- The Python runtime does not automatically run a GPU model. NVIDIA Model Optimizer/GPU Operator are still an external GPU build/serving path, not part of this bridge.
- This branch adds the implementation and compile/build checks; live multi-agent responses, database persistence, and MCP calls still require an external deployment plus valid secrets and must be verified against that deployment.
