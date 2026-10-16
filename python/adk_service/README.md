# Angel ADK Python bridge

This is an optional, separately deployed Python service. It is not installed into the Netlify function. It exposes an authenticated `POST /run` endpoint for the Angel backend bridge.

## Local setup

Requires Python 3.11+.

```bash
cd python/adk_service
uv sync
export GOOGLE_API_KEY="your-server-side-Google-API-key"
export ANGEL_ADK_SERVICE_TOKEN="a-long-random-shared-service-token"
uv run uvicorn main:app --host 0.0.0.0 --port 8080
```

Health check: `GET /health`

Run request (Bearer token required):
```json
{"appName":"angel-adk-bridge","userId":"verified-user-id","sessionId":"optional-session","message":"Plan a safe test-first implementation"}
```

Response:
```json
{"success":true,"response":"...","sessionId":"optional-session","appName":"angel-adk-bridge","durationMs":100}
```

## Configure Angel

In the Netlify project environment settings, set:
- `ANGEL_ADK_RUN_URL=https://<your-service>/run`
- `ANGEL_ADK_API_KEY=<same value as ANGEL_ADK_SERVICE_TOKEN>`
- optionally `ANGEL_ADK_APP_NAME`

Never put these values in browser variables or source control.

## Production notes

- This example uses an in-memory ADK runner/session map to prove the call contract. Sessions are lost on process restart and are not shared between instances.
- For production, configure a persistent ADK `SessionService`, durable external-session mapping, appropriate credential storage and a service identity. Store the shared token in the deployment platform's secret manager.
- Add tools only after they have explicit schemas, timeouts, authentication, permissions and tests.
- Do not send arbitrary hidden credentials from Angel into agent prompts.
