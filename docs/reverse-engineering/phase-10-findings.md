# Phase 10 Findings: Claude Code Best V5 Workflow Engine and Remote Control

**Repository:** https://github.com/claude-code-best/claude-code  
**Pinned revision:** 77a7934e15d69da13879112ed7db695c9ee7a52a (2026-08-24)  
**Evidence level:** selected workflow engine, workflow persistence, task types, agent tool registry and remote-control authentication/config modules inspected. No packages were installed or executed. This is an unofficial repository, and provenance, license compatibility, supply-chain health and relationship to any upstream product must be assessed before adoption.

## 1. Standalone workflow-engine package

Source root: https://github.com/claude-code-best/claude-code/tree/77a7934e15d69da13879112ed7db695c9ee7a52a/packages/workflow-engine

The package describes a deterministic JavaScript workflow engine with an explicit port boundary. Agent provider, journal storage, progress events, permissions and host-specific operations are injected rather than hard-coded into the workflow core.

### Key files and functions
- engine/runWorkflow.ts: runWorkflow; parses the script, resolves workflow metadata, loads prior journal entries when resuming, invalidates the journal when the script changed, creates a run context and executes subworkflows under shared budget/concurrency resources.
- engine/script.ts: extractMeta, validateMeta, parseScript and deterministic Date/Math shims.
- engine/journal.ts: agentCallKey, createFileJournalStore; deterministic SHA-256 key from prompt plus canonical parameters, JSONL journal persistence and stable ordering by sequence when replaying parallel operations.
- engine/budget.ts: Budget and BudgetExhaustedError; tracks accumulated output tokens and raises when the configured total is reached.
- engine/concurrency.ts: Semaphore.acquire(signal), release, maxConcurrency and clampMaxConcurrency; bounds parallel calls and removes cancelled waiters without consuming a permit.
- engine/structuredOutput.ts: assertValidJsonSchema and validateAgainstSchema; validates schemas before backend execution and validates returned objects with Ajv.
- tool/WorkflowTool.ts: createWorkflowTool; parses a typed input contract, resolves inline/named scripts, allocates run IDs, uses injected host permissions and supports resuming a prior run.
- types.ts and ports.ts: typed workflow metadata, agent parameters/results, journal, progress events, run result and ports for agent runner, task registry, progress, journal, permission gate and logger.
- src/workflow/persistence.ts: writeRunState, readRunState, listPersistedRuns, cleanupOldRuns and attachRunStatePersistence; writes state through temporary-file-then-rename, stores a schema version and caps retained run directories.
- src/workflow/service.ts: getWorkflowService and makeService; wires service, progress bus/store, ports, host context and persisted run hydration.
- src/Task.ts: isTerminalTaskStatus, generateTaskId and createTaskStateBase; defines task types and terminal statuses.

### Angel adoption
- Model long goals as named, versioned workflows with typed inputs and observable phases.
- Make deterministic steps replayable and external/model calls journaled by stable identity.
- Share one run-level budget, cancellation signal, progress stream and concurrency limit across nested workflows.
- Validate output schemas at the host boundary and persist a compact run snapshot plus detailed step journal.
- Keep tool permissions, credentials and host objects behind injected, server-controlled ports.
- Use hard caps on active concurrency and retention so a stuck goal loop cannot consume all resources.
- On resume, compare the workflow source hash. Do not replay successful non-idempotent side effects blindly; store idempotency keys or require operator reconciliation.

### Important security boundary

The source comments are explicit that the script sandbox is intended to preserve deterministic replay, not to establish a security boundary. It disallows obvious escapes such as dynamic import, but the workflow script executes as code at the same trust level as the agent. Angel must not execute user/remote-provided workflow scripts in the main web server or with production credentials. Use an isolated worker/container with strict filesystem/network/process permissions, or expose only a safe declarative workflow DSL.

The inline-script feature is useful for trusted internally authored tasks; it is not permission to run arbitrary scripts discovered online.

## 2. Remote Control Server (RCS)

Source root: https://github.com/claude-code-best/claude-code/tree/77a7934e15d69da13879112ed7db695c9ee7a52a/packages/remote-control-server

The README declares remote session management, real-time WebSocket/SSE transport, browser permission approval, multiple environments with heartbeat/reconnect, API-key and JWT authentication.

### Relevant source functions
- auth/middleware.ts: apiKeyAuth, sessionIngressAuth, uuidAuth, extractBearerToken and extractWebSocketAuthToken; supports a Sec-WebSocket-Protocol token path for clients that cannot send custom auth headers.
- auth/api-key.ts: hashes keys with SHA-256 and uses timingSafeEqual when validating configured values.
- auth/jwt.ts: generateWorkerJwt and verifyWorkerJwt; signs/checks a short-lived worker JWT using a configured API-key-derived signing key.
- auth/token.ts: issueToken and resolveToken; creates random session tokens and looks up the associated user.
- store.ts: in-memory maps for users, tokens, environments, sessions, work items, workers and session-owner associations; helpers include storeBindSession, storeIsSessionOwner, storeGetSessionOwners and storeListSessionsByOwnerUuid.
- config.ts: host, port, allowed CORS origins, API key list, WebSocket idle timeout/keepalive, poll timeout and token-expiry configuration.
- transport/: event bus, SSE writers, WebSocket handlers and payload normalization.

### Angel adoption
- Separate web-session auth from worker/session-ingress auth.
- Use short-lived scoped tokens and explicit ownership binding for each remote session.
- Provide device/session revocation, disconnect cleanup, heartbeat status and visible last activity.
- Protect remote session operations with authenticated user/project/session ownership checks, not just possession of a resource ID.
- Use constant-time comparison for configured API-key checks and never put long-lived tokens in query strings.
- Define CORS origins explicitly for browser UI; validate WebSocket origins and authenticate before accepting a session.
- Keep state persistence and multi-instance consistency in Angel-owned storage rather than copying the reference's in-memory maps.

### Production gate

The RCS example configuration uses 0.0.0.0 as the default host while its API-key list defaults to empty. That combination requires fail-closed startup validation before public use; Angel should refuse an externally bound remote-control server unless authentication secrets, allowed origins, TLS/reverse-proxy assumptions, rate limits and owner checks are configured. The README's claim of layered auth is not by itself a complete security audit.

## 3. Angel design decisions after this review

1. Workflow scripts are trusted code, not content. Remote website/repository instructions never become executable workflow scripts automatically.
2. Port boundaries are useful. Use adapters for model calls, progress, persistence, task registry, permission prompts and audit log.
3. Replay is a correctness tool, not a blanket retry. External writes require idempotency, confirmation or reconciliation.
4. Budgets and concurrency are first-class run state. They cannot be only UI-level preferences.
5. Remote control requires a separate threat model. Pairing, token scoping, origin validation, expiry/revocation and multi-user isolation precede a background/mobile control feature.

## 4. Decision

Adapt the workflow engine's architecture; defer the unofficial remote-control server as a direct dependency. Implement native TypeScript contracts in Angel, reuse only well-scoped compatible library code after license review, and do not run workflow scripts without a dedicated execution boundary.
