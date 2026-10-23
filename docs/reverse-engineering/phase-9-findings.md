# Phase 9 Findings: ClaudeCodeUI / CloudCLI Browser, Agent Sessions and Worktrees

**Repository:** https://github.com/siteboon/claudecodeui  
**Pinned revision:** `7238368fca24e90938e9a6736d38af8b86575eb9` (2026-10-22)  
**Evidence level:** selected server, browser-service, authentication, Electron and worktree route source inspected; no app build or runtime test.

## 1. Architecture map

The repository is a TypeScript/React application with modular Express services and an Electron desktop host:
- Server modules separate agent runs, auth, browser use, projects, worktrees, providers, settings, scheduled messages, tasks, WebSockets and other features.
- The agent API accepts runs for Claude, Cursor, Codex and OpenCode and connects those runs to a shared session registry.
- Browser Use has a separate service, API routes, MCP bridge and Playwright runtime.
- Electron starts or discovers a local server and uses a preload bridge.
- The UI has modules for chat, browser use, shell/terminal, Git, worktrees, file tree, skills, plugins, MCP, task master and settings.

Source root: https://github.com/siteboon/claudecodeui/tree/7238368fca24e90938e9a6736d38af8b86575eb9/server/modules

## 2. Agent-run API and GitHub repository flow

Source: https://github.com/siteboon/claudecodeui/blob/7238368fca24e90938e9a6736d38af8b86575eb9/server/modules/agent/agent.routes.ts

Key implementation points:
- `createAgentRouter(dependencies)`: dependency-injected route factory for filesystem, crypto, subprocess, users/API keys, GitHub tokens, projects, model catalog, sessions, run registry, provider adapters and GitHub client.
- `validateExternalApiKey`: selects platform-mode trust or validates a self-hosted API key.
- `getGitRemoteUrl`, `normalizeGitHubUrl`, `parseGitHubUrl`: recognize and compare GitHub remotes.
- `autogenerateBranchName`, `validateBranchName`, `getCommitMessages`: support generated branches and commit-message style.
- `createGitHubPR`: creates a pull request through Octokit.
- `cloneGitHubRepo`: checks URL protocol/host, validates existing target path's remote, builds a shallow HTTPS clone command and passes a private token through temporary environment-based Git credential configuration rather than embedding it directly in the URL.
- The route registers running agent jobs with the same session registry used by the app, and supports streaming or collected output.

**Angel use:** this is a strong reference for project/session integration and multi-provider coding sessions. Use a dedicated GitHub connector, keep credentials out of URL strings/logs, validate repo identities and paths, and place every clone/branch/PR operation behind explicit authorization. Push, merge and deploy must remain separate privileges.

## 3. Browser Use: controlled Playwright sessions exposed through MCP

Sources:
- https://github.com/siteboon/claudecodeui/blob/7238368fca24e90938e9a6736d38af8b86575eb9/server/modules/browser-use/browser-use.service.ts
- https://github.com/siteboon/claudecodeui/blob/7238368fca24e90938e9a6736d38af8b86575eb9/server/modules/browser-use/browser-use-mcp.ts
- https://github.com/siteboon/claudecodeui/blob/7238368fca24e90938e9a6736d38af8b86575eb9/server/modules/browser-use/browser-use.routes.ts

Key functions and controls observed:
- Settings use a persisted enabled flag; default is disabled.
- `getOrCreateMcpToken` generates a random 32-byte token for the local MCP bridge.
- Runtime readiness probes Playwright/Chromium and caches the result briefly.
- `runCommand` uses spawn with `shell: false`, captures output and enforces an install-command timeout.
- `installRuntime` installs Playwright and Chromium through bounded commands.
- `normalizeUrl` accepts HTTP(S) only.
- `ownerSessions`, `closeHandle`, `expireStaleSessions` implement owner scoping, resource cleanup and inactivity expiry.
- `createAgentSession` creates a headless Playwright Chromium session, blocks service workers, enforces a per-owner active-session count and records a screenshot/title/URL.
- `getAgentSession`, `agentNavigate` and other action handlers retrieve sessions and enforce the agent owner identity before acting.
- Browser session TTL defaults to 30 minutes and maximum active sessions per owner defaults to three.
- `browser-use-mcp.ts` exposes typed MCP tool definitions, parses arguments, calls the local API with a bearer token and timeout, and serializes JSON-RPC output.
- API routes return a consistent success/error envelope with stable machine-readable error codes.

**Angel use:** this is a practical pattern for a separate browser worker with explicit enablement, one-time setup/readiness reporting, owner-scoped sessions, timeout, inactivity expiry, concurrency caps and MCP adapter. Angel should add a clear read-only/interactive mode, approved-origin policy, per-action confirmation for consequential website actions and capture redaction.

**Boundary to verify:** the inspected browser route file shows routes while their authentication may be supplied by the parent server mounting middleware. Do not infer that these routes are unauthenticated from the router file alone; inspect the server mount and middleware chain before integration. The browser MCP bridge uses a local bearer token, but token storage, process boundaries, allowed origins and all exposed actions still require a complete security pass.

## 4. Electron local server and session security

Sources:
- https://github.com/siteboon/claudecodeui/blob/7238368fca24e90938e9a6736d38af8b86575eb9/electron/localServer.js
- https://github.com/siteboon/claudecodeui/blob/7238368fca24e90938e9a6736d38af8b86575eb9/electron/preload.cjs
- https://github.com/siteboon/claudecodeui/blob/7238368fca24e90938e9a6736d38af8b86575eb9/server/modules/auth/auth.middleware.ts

Observed patterns:
- Electron local server defaults to binding `127.0.0.1`; it has controlled startup/health timeouts, port selection, server marker files and packaged/runtime path discovery.
- `requestJson`, `isCloudCliServer`, `isPortAvailable`, `getFreePort`, `chooseServerPort`, `getNodeRuntime`, and `LocalServerController` support predictable server startup.
- Auth middleware signs/verifies JWTs, verifies that the user remains in the database, refreshes a token after half its lifetime and supports WebSocket authentication.
- The middleware also accepts a JWT in a query parameter for SSE endpoints, with a comment explaining EventSource header limitations. Query-string tokens can be exposed to logs/history/referrers in some deployments, so Angel should prefer a short-lived scoped SSE token or a safer header/cookie transport where possible.
- Platform mode assumes an upstream proxy already authenticated the request and maps it to a default user. That requires a trusted proxy boundary and rejection of direct, untrusted access.
- Agent API key auth allows the key in either header or query string in the inspected agent routes. Angel should prefer headers and avoid long-lived secrets in URLs.

## 5. Worktree routes

Source: https://github.com/siteboon/claudecodeui/blob/7238368fca24e90938e9a6736d38af8b86575eb9/server/modules/worktrees/worktrees.routes.ts

`createWorktreesRouter` uses injected services and typed request parsing for list, create, open, merge and remove. Functions parse a required project identifier and strings, then delegate path resolution to the application service. Merge/remove expose options such as squash, post-merge removal, force and branch deletion.

**Angel use:** isolate parallel repository tasks in Git worktrees rather than making multiple agents edit the same checkout. A server policy should bind the worktree to an authorized repository/project, validate canonical paths, show branch/merge effects and ask for approval before destructive cleanup or merge. The presence of a service call alone does not show that all downstream path checks are correct; inspect the injected worktree service and tests before copying.

## 6. Recommended Angel adaptations

1. Browser workbench: separate Browser Read/Observe from Browser Act, with scoped origin list, timeout, screenshot/DOM evidence, owner-based sessions, expiry and cancellation.
2. Agent sessions: one durable task/session ID shared between UI, streaming, run registry and history; distinguish running, idle, paused, waiting for approval and finished.
3. Repository coding: support provider adapters but keep one Angel task store, one GitHub authorization boundary, and explicit branch/PR capabilities.
4. Local companion: use loopback-only local service binding by default, authenticated pairing and revocable session tokens. Do not expose localhost-control capabilities to remote pages.
5. Safe Git operations: branch creation and read-only inspection can be separate from stage/commit/push/merge/deploy.
6. Security: never put long-lived access keys in query parameters; validate external URLs and redirect destinations; scrub secrets from subprocess output and logs.
7. Error handling: use structured error codes and operation IDs; provide partial evidence and cleanup errors instead of a generic false success.

## 7. Decision

**High-value architecture reference for Angel's browser workbench and future desktop/remote coding surfaces.** Adapt modular services, provider-run registry, browser-session lifecycle, MCP tool adapter, loopback local server and worktree-based isolation. Do not copy privileges or assume this repository's complete auth/security story has been verified.
