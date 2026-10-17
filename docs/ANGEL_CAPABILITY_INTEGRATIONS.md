# Angel capability integrations and deployment boundaries

Last updated: 2026-10-16

Angel remains hosted on Netlify. The Express API has adapters for model and agent services, but large model weights and isolated Python execution must be deployed outside a short-lived web function.

## Quick status checks

- `GET /api/integrations/capabilities`: capability inventory and which external connections are configured. It deliberately does not return secrets or private endpoint URLs.
- `GET /api/models`: AI model catalog, including Qwen Image 2.1 availability.
- `GET /api/translation/status`: Hy-MT2 runtime configuration status.
- `GET /api/agents/adk/status`: Google ADK Python bridge status.
- `GET /api/python/status`: isolated Python sandbox connection status.
- `POST /api/mcp`: authenticated Model Context Protocol JSON-RPC endpoint.

Status means configured, not that a vendor account has quota or every production side effect has passed. Use real test requests after configuring provider credentials.

## 1. Qwen Image 2.1

Angel's Media Studio offers `qwen-image-2.1-turbo` and `qwen-image-2.1-pro`. Both generation and image-edit requests use the Alibaba Cloud Model Studio Images API; returned image URLs are fetched server-side immediately and converted to bytes before the usual authenticated-media persistence path stores results in Supabase Storage.

**Multi-reference editing is now wired end to end.** In Media Studio → Edit & Variations, select up to ten saved images. Angel converts them to bounded image data URIs in the browser, keeps the selection order, and sends the first image as the primary source plus the remaining images as `referenceImageDataUrls`. Selecting a second reference automatically chooses Qwen Image 2.1 Pro. The backend passes the ordered reference array as Model Studio's `image` field, rejects multi-reference requests to Turbo or Gemini rather than silently changing models, limits each source to 10 MB and combined image data to 20 MB, and enforces the ten-image maximum. The editing route remains rate-limited, and Qwen requests require a signed-in Supabase user.

For the hosted API, use the region-specific Model Studio workspace base URL and a key from that same region. The model repository URL itself is not an inference endpoint.

Set the following variables under Netlify's **Functions** scope and redeploy:

| Variable | Required | Value |
| --- | --- | --- |
| `QWEN_IMAGE_API_BASE_URL` | Yes | Workspace endpoint base, e.g. `https://<WorkspaceId>.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |
| `QWEN_IMAGE_API_KEY` | Yes | Model Studio API key for that same region |
| `QWEN_IMAGE_MODEL_ID` | No | `qwen-image-2.1-turbo` (default) or `qwen-image-2.1-pro` |

The client can only select the model ID from the allowlist. The client cannot choose the endpoint or API key. Hosted Qwen API use follows Model Studio's service terms. The released Qwen model weights have a separate Qwen Research License that restricts use of those materials to non-commercial purposes unless separate commercial permission has been obtained.

## 2. Tencent Hy-MT2 translation

The already-integrated translation adapter calls a configured OpenAI-compatible chat-completions inference service. It cannot load Hy-MT2 weights into Netlify. Set `HYMT2_API_BASE_URL`, `HYMT2_API_KEY` (when the endpoint requires it), and `HYMT2_MODEL_ID`; see [HY-MT2-INTEGRATION.md](./HY-MT2-INTEGRATION.md).

## 3. Google ADK Python runtime

The repository now includes a separate FastAPI service in `python/adk_service`. It uses Google ADK's `Agent` and `InMemoryRunner`, and exposes an authenticated `POST /run` contract. Deploy that service to a container runtime such as Cloud Run, not as part of the Netlify function.

Set on the ADK service:
- `ANGEL_ADK_SERVICE_TOKEN`: strong shared service token
- `GOOGLE_API_KEY`: Google AI API key for the selected model
- optionally `ANGEL_ADK_APP_NAME`, `ANGEL_ADK_MODEL`

Set in Netlify:
- `ANGEL_ADK_RUN_URL`: exact deployed `/run` URL
- `ANGEL_ADK_API_KEY`: same token as `ANGEL_ADK_SERVICE_TOKEN`
- optionally `ANGEL_ADK_APP_NAME`

The example runner uses in-memory ADK sessions and is suitable for a first deployment/proof of connection, not horizontally scaled durable sessions. Before production multi-instance use, replace it with an ADK persistent SessionService and durable session mapping.

Authenticated API use:
```http
POST /api/agents/adk/run
Authorization: Bearer <Supabase access token>
Content-Type: application/json

{"message":"Summarize the next implementation steps","sessionId":"optional-session-id"}
```

## 4. Python execution

Angel does **not** run incoming Python via `eval` or `exec` inside the web server. `POST /api/python/execute` is a strict bridge to a separate isolation service. Set `ANGEL_PYTHON_RUN_URL` and `ANGEL_PYTHON_RUN_TOKEN` in Netlify only after deploying a sandbox implementing this JSON contract:

Request:
```json
{
  "language": "python",
  "code": "print(1 + 1)",
  "stdin": "",
  "timeoutMs": 5000,
  "limits": {
    "memoryMb": 128,
    "networkAccess": false,
    "filesystemAccess": "ephemeral-only",
    "maxOutputChars": 20000
  },
  "requestId": "<authenticated user id>"
}
```

Response:
```json
{"stdout":"2\n","stderr":"","exitCode":0,"durationMs":12}
```

The repository includes a reference implementation at [python/sandbox_service/README.md](../python/sandbox_service/README.md). It must be deployed separately on a dedicated Linux VM with Docker Engine and the Python image pre-pulled. This service creates one no-network, resource-limited container per snippet. The Netlify function remains only the authenticated proxy. Do not point this integration at an ordinary machine or endpoint that executes arbitrary code in its main process.

## 5. Authenticated MCP endpoint

`POST /api/mcp` implements a stateless HTTP MCP subset: `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list` and `resources/read`. The route requires a verified Supabase Bearer token.

Current allowlisted tools:
- list Angel capabilities;
- list/get the curated Angel skill packs;
- translate using Hy-MT2;
- generate images using configured image inference;
- execute Python through the configured isolation service;
- call the external Google ADK runtime.

Configure an MCP client with the deployed URL `https://angel-ai-new.netlify.app/api/mcp` and send the user's current Supabase access token as the HTTP Bearer token. Tool execution remains subject to Angel's rate limits and external provider configuration. This is not a public unauthenticated MCP endpoint.

Example initialization request:
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"angel-connected-agent","version":"1.0.0"}}}
```

## 6. NVIDIA Model Optimizer and GPU Operator

NVIDIA Model Optimizer is a Python/GPU build-time toolkit for operations such as quantization, pruning and distillation. NVIDIA GPU Operator manages NVIDIA drivers and GPU components on Kubernetes. They are complementary, not request-time libraries to import into Angel's Netlify function.

Recommended future serving path:
1. Download/select a model and verify its source license.
2. Build an isolated benchmark with quality, memory, latency, throughput and error baselines.
3. Apply a supported optimization using Model Optimizer where compatible.
4. Export a checkpoint for a runtime such as vLLM, SGLang or TensorRT-LLM.
5. Serve it on separately operated GPU hardware; use GPU Operator only if the chosen runtime runs on Kubernetes GPU nodes.
6. Configure Angel's external model endpoint and verify real requests and cost/latency.

`ANGEL_GPU_INFERENCE_BASE_URL` is an optional marker for a future connected GPU runtime. It does not install a cluster or start inference by itself.

## 7. REA, Wheelhouse, Claude Skills and Gentle-AI

Angel's curated registry applies selected patterns from the referenced repositories without bulk-copying complete skills or codebases:
- **REA**: source-first reverse engineering, evidence references, parity status and explicit unknowns.
- **Wheelhouse**: finalized speech handling, intent-aware commands and destructive-action boundaries.
- **Claude Skills**: modular instructions for code review, Python services, MCP, testing and multimodal tasks.
- **Gentle-AI**: scope-sized planning, resumable checkpoints, test-first verification and evidence-based completion.
- **ADK**: typed agents/tools and a session-aware Python runtime adapter.

A browser app cannot control arbitrary desktop windows or send global keyboard/mouse input. Wheelhouse's full Windows desktop-control feature set requires a user-installed native companion. The present integration targets Angel's own workspace and does not claim parity with the native application.

## Operational rules

- Do not add any private key with a `VITE_` prefix.
- Rotate any credential that has ever been committed or shared.
- Use secrets only in Netlify server-side environment variables or the separate runtime's secret store.
- A configured flag is not proof of working inference. Confirm by issuing a small real request and checking the returned artifact/session.
- External images, Python code and prompts may be sent to their configured provider. Make this visible to users and follow the relevant provider terms.
