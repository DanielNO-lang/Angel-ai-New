# Function-Level Deep Dives: Angel Operating-Core Candidates

**Branch:** research/rea-reverse-engineering-catalog  
**Review date:** 2026-10-23  
**Evidence boundary:** source files and symbol declarations inspected through GitHub. No target repository was cloned, executed, built, or runtime-tested in this ChatGPT session. Function names and file references below are source-inspection evidence; behavior outside the inspected paths remains unverified.

## 1. REA: Reverse Engineer Anything

- Repository: https://github.com/morluto/rea
- Installation documentation: https://github.com/morluto/rea/blob/main/docs/installation.md
- Website browser observation: https://github.com/morluto/rea/blob/main/docs/browser-observation.md
- Browser scenario contract: https://github.com/morluto/rea/blob/main/docs/browser-scenario-contract.md
- MCP contracts: https://github.com/morluto/rea/blob/main/docs/mcp-contracts.md
- CLI/evidence reference: https://github.com/morluto/rea/blob/main/docs/cli.md

### Workflow surfaces established by documentation
- CLI and MCP expose source/artifact analysis workflows.
- For website/browser analysis the docs list list_browser_targets, inspect_web_page, observe_web_session, capture_web_screenshot, discover_webmcp_tools, capture_browser_scenario and compare_web_captures.
- The browser observation guide describes CDP attachment to a user-owned Chrome-family browser and emphasizes that the observation interface is passive. Browser scenarios are declared explicitly: start URL, actions, expected conditions and captured evidence.
- REA records structured Evidence, identities, coverage and limitations. Missing or truncated evidence must not be treated as proof that two implementations are equivalent.
- REA's README covers static JavaScript/Electron analysis of extracted folders/ASAR; native analysis requires an appropriate configured analyzer. An arbitrary public website URL does not reveal private server implementation; it yields observable behavior and public assets only.

### Angel adoption plan
Build the future Reverse Engineering workspace around a neutral target contract:
- input classification and scope;
- canonical target URL/repo/ref;
- source snapshot/commit identity;
- bounded analysis steps and progress;
- retained evidence objects with source file, symbol, line range, URL, capture ID or test;
- coverage and unknowns;
- capability dossiers and comparisons;
- license/security assessment;
- exportable dossier bundle and resumable status.

Do not claim REA has run here. Its docs require Node.js 22.19+, 24.11+, or 26+, while the current container did not have the required Node version and cannot fetch GitHub from its shell. The local REA process must be set up separately following its official installation guide.

## 2. Google Agent Development Kit (ADK Python)

Repository: https://github.com/google/adk-python  
Main source root: https://github.com/google/adk-python/tree/main/src/google/adk

### Source map reviewed

| Capability layer | Source entry | Observed functions/classes | Angel relevance |
|---|---|---|---|
| Agent base/lifecycle | src/google/adk/agents/base_agent.py | BaseAgent, run_async, run_live, _run_with_lifecycle, _run_async_impl, _run_live_impl, root_agent, find_agent, find_sub_agent, callback handlers, clone, name validation | Common execution contract, subagent hierarchy, lifecycle callbacks |
| Model-backed agent | src/google/adk/agents/llm_agent.py | LlmAgent, canonical_model_async, canonical_live_model_async, canonical_instruction, canonical_global_instruction, canonical_tools, model/tool before/after/error callbacks, agent transfer helpers | Model/provider boundary, tool construction, streaming and handoff patterns |
| Execution/session runner | src/google/adk/runners.py | Runner, run, run_async, run_live, event processing/appending, session lookup/create, cancellation/cleanup, rewind_async, plugin callbacks, post-invocation compaction | Durable session lifecycle, ordered events, cancellation and resumability |
| Sequential orchestration | src/google/adk/agents/sequential_agent.py | SequentialAgent._run_async_impl, _get_start_index, state that records current_sub_agent | Sequential execution and resume position |
| Parallel orchestration | src/google/adk/agents/parallel_agent.py | ParallelAgent._run_async_impl/_run_live_impl, _merge_agent_run, _cancel_tasks | Parallel work, result merge and task cancellation |
| Loop orchestration | src/google/adk/agents/loop_agent.py | LoopAgent._run_async_impl, _get_start_state, _run_live_impl | Bounded looping and resume state |
| Tool catalogue | src/google/adk/tools | function_tool.py, base_tool.py, base_toolset.py, skill_toolset.py, tool_confirmation.py, transfer_to_agent_tool.py, load_web_page.py, google_search_tool.py, MCP tool modules | Typed tools, skill/toolsets, confirmation, web/context tools |
| Workflow engine | src/google/adk/workflow | _workflow.py, _graph.py, _node_runner.py, _node_state.py, _node_status.py, _retry_config.py, _parallel_worker.py, _dynamic_node_scheduler.py | Typed graph execution, retry policy, status and concurrency concepts |

The source declares Apache 2.0 licensing in the inspected agent files; re-check repository license and any dependency licenses before code reuse.

### Specific source-backed behaviors
- SequentialAgent stores current subagent state when an invocation is resumable, yields a state event, and can restart from the stored subagent. Its README/source marks SequentialAgent deprecated in favor of Workflow, so new design should study the Workflow subsystem rather than copy the deprecated abstraction.
- ParallelAgent has task-cancellation and result-merge helpers. This is a pattern to study, not proof that every parallel task failure or external side effect is safe.
- Runner explicitly takes session, artifact, memory, credentials and plugin services. This is a strong separation between orchestration and services.
- LlmAgent provides callback hooks before/after model and tool execution, plus error paths. This offers clear audit/approval/measurement extension points.

### Proposed mapping into Angel
- Map Angel's existing ConversationService and toolRegistry to a single run lifecycle.
- Add typed run records with statuses such as requested, planning, waiting_for_approval, running, retry_wait, paused, completed, failed and cancelled.
- Store step/event records durably so refreshes and server restarts do not erase work.
- Store resume cursor/checkpoint and tool outputs; do not rerun successful external writes blindly.
- Add a concurrency cap, overall wall-clock budget, provider budget and cancellation propagation.
- Use callback/event hooks for telemetry, policy checks and trace logs.
- Treat workflow/task inputs and tool results as untrusted content; permission checks happen server-side.

### Decision
**Adapt concepts, not framework:** Angel is a React/TypeScript application with an existing server and tool registry. Do not add a second Python agent service unless a specific capability cannot reasonably be implemented in TypeScript and hosting/maintenance has been assessed.

## 3. OpenAI Agents SDK for Python

Repository: https://github.com/openai/openai-agents-python  
Source root: https://github.com/openai/openai-agents-python/tree/main/src/agents

### Source map reviewed

| Capability layer | Source entry | Observed symbols | Angel relevance |
|---|---|---|---|
| Agent configuration | src/agents/agent.py | AgentBase, Agent, clone, as_tool, get_mcp_tools, get_all_tools, get_system_prompt | Agent configuration, subagents-as-tools, MCP discovery |
| Execution engine | src/agents/run.py | Runner.run, run_sync, run_streamed; AgentRunner.run and _run_impl | Multi-turn loop, result tracking, sync/async/streaming modes |
| Tool invocation | src/agents/tool.py | FunctionTool, function tool wrapper/invoker, failure handlers, ToolOutputText/Image/FileContent, computer providers | Typed tool outputs, failure normalization, execution metadata |
| Guardrails | src/agents/guardrail.py | InputGuardrail, OutputGuardrail, input_guardrail and output_guardrail decorators | Input screening and final-output validation |
| Callable schema | src/agents/function_schema.py | FuncSchema, function_schema, generate_func_documentation, to_call_args | Parameter schema generation and validated conversion |

The inspected source shows that the runner has a max_turns limit and raises a MaxTurnsExceeded error when the loop exceeds it, unless the error is handled. The run loop ends on final output, follows handoffs to a different agent, or executes tool calls and re-runs the model. The source also exposes guardrail tripwire errors and a tool-invocation failure handling layer.

### Important caution
The SDK docs mention provider-agnostic integrations, but response/conversation storage APIs can be provider-specific. The inspected comments for conversation_id warn that non-OpenAI providers may not write to an OpenAI Conversation object and the stored conversation can therefore be partial. Angel should own its canonical conversation/task record independently of any provider-specific session store.

### Proposed mapping into Angel
- Typed run state and cancellation/result semantics.
- Explicit tool contracts and normalized tool errors.
- Input/output guardrails and named guardrail audit events.
- Subagents exposed as tools only where recursion and permissions are bounded.
- Strict parameter-schema validation for tool calls.
- Max-turns and resource-budget equivalents for all providers.

### Decision
**Reference and selectively adapt.** Compare implementation ideas with ADK; do not embed both runners as competing orchestrators. If a Python runtime is later selected, it should be an isolated service behind the same Angel-owned task and tool contracts.

## 4. Google Workspace MCP

Repository: https://github.com/taylorwilsdon/google_workspace_mcp

### Source map reviewed

| Capability layer | File | Observed symbols / design |
|---|---|---|
| Permission levels | auth/permissions.py | is_action_denied, set_permissions, get_permissions, get_scopes_for_permission, get_scopes_for_union, get_allowed_scopes_set, parse_permissions_arg; cumulative service-specific read/write levels |
| OAuth scope configuration | auth/scopes.py | has_required_scopes, set_enabled_tools, set_read_only, is_read_only_mode, get_all_read_only_scopes, get_scopes_for_tools |
| Tool registration/filtering | core/tool_registry.py | set_enabled_tools, set_disabled_tools, resolve_disabled_tools, is_tool_enabled, conditional_tool, wrap_server_tool_method, get_tool_components, filter_server_tools |
| OAuth provider | auth/google_oauth_provider.py | GoogleProvider.authorize; fills configured default scopes when request does not specify scopes while preserving explicit client scope selection |
| Gmail tools | gmail/gmail_tools.py | search_gmail_messages, get_gmail_message_content, get_gmail_messages_content_batch, get_gmail_attachment_content, send_gmail_message, draft_gmail_message, get_gmail_thread_content, attachment parsing/validation/redaction helpers |
| Core service | core/server.py and fastmcp_server.py | server and service registration entry points, to inspect further |
| Tests | tests/ | repository includes test directory; relevant test paths to identify during the next pass |

### Source-backed lessons
- Tool registration can be conditional, and an explicit disabled-tool list takes precedence over the configured enabled set.
- Permission levels are per service and map to OAuth scopes; Gmail has separate levels for read-only, organize, draft and send. Scopes and action denials are represented separately, which is important because a tool should not infer broad rights from the existence of a login session.
- Gmail tools include explicit attachment size/storage logic and message/thread helpers. Sending mail is a distinct write action, not simply the inverse of reading.
- The OAuth provider’s behavior distinguishes default scopes from explicitly requested client scopes. That matters for least-privilege onboarding and consent UX.

### Angel adoption map
For any Google Workspace integration, use the following authorization pipeline:

1. User explicitly connects a Google account.
2. Angel requests only the scopes for the capability being enabled.
3. Server stores tokens securely; frontend never receives client secrets.
4. Each exposed tool declares required scopes, risk level, side effects and whether confirmation is required.
5. At runtime, server checks user/session ownership, provider connection, scopes and tool policy.
6. Reads may execute directly within the granted scope; send/delete/share/modify actions show an approval summary where appropriate.
7. Result, target object and confirmed action status are logged. A failed write is not reported as successful.
8. The user can revoke the connection and see/review action history.

### Decision
**High-value integration reference; not a drop-in dependency.** Google Workspace MCP is Python/FastMCP-oriented and may need a standalone bridge if adopted. First design an Angel-owned integration contract and decide whether individual official APIs or a verified MCP server is the smaller and safer route.

## 5. Cross-repository conclusion

The reviewed source converges on a few requirements for Angel's reliable operating core:
- one durable run/task orchestrator;
- one normalized tool contract and provider adapter layer;
- bounded loops/concurrency/budgets with cancellation;
- typed schemas and consistent error handling;
- server-side authorization, scoped OAuth and explicit action confirmations;
- persistent session/task/event history;
- evidence-based completion and tests;
- no dependency on a specific provider's private session storage as Angel's source of truth.

A future implementation should turn these into small, testable TypeScript changes first. The next concrete repository tasks are to add run/task schema designs, a permission-policy contract, feature acceptance tests and a source-linked comparison of provider adapters. No adoption or runtime success is claimed by this source review.


## 5. Gentle-AI: planning, staged execution, rollback and skill registry

Repository: https://github.com/Gentleman-Programming/gentle-ai  
Revision reviewed: eaff4d5a06900b4fed721abe82c0a58a6c78de03  
README: https://github.com/Gentleman-Programming/gentle-ai/blob/eaff4d5a06900b4fed721abe82c0a58a6c78de03/README.md

The project is a Go-based coding-agent harness with explicit modules for planning, staged pipeline execution, rollback, recovery traces, skill registry, component contracts, state management and agent building. Source tree inspected at the reviewed revision.

### Source paths and function-level evidence

| Module | Inspected symbols | Potential reusable idea |
|---|---|---|
| internal/pipeline/orchestrator.go | Orchestrator, WithFailurePolicy, WithProgressFunc, WithTerminalCleanup, NewOrchestrator, Execute, Rollback, indexSteps | Stage-plan execution, progress callbacks, explicit failure policy and rollback entry points |
| internal/pipeline/runner.go | Runner.Run, emitProgress | Each step emits running state; records start/end times and step result; stages have results instead of only a final chat response |
| internal/planner/graph.go | Graph, NewGraph, Has, DependenciesOf, MVPGraph, SoftOrderingConstraints | Dependency graph and softer ordering preferences |
| internal/planner/resolver.go | NewResolver, Resolve, expandDependencies | Expand selected work into required dependent tasks and reject unknown components |
| internal/skillregistry/registry.go | UserSkillDirs, ProjectSkillDirs, Regenerate, List, Fingerprint, LoadSkill, RenderRegistry, parseFrontmatter, ScopeForPath, dedupeBySkillName | Skill discovery across user/project scopes, metadata parsing, deterministic inventory and fingerprint cache |
| internal/skillregistry/guard.go | Guard module and corresponding tests exist in the same package | A dedicated policy/guard boundary exists; inspect individual decisions before adopting |
| internal/recoverytrace | generate.go, import.go, model.go, rows.go, validate.go and tests | Structured recovery evidence and validation rather than opaque run logs |
| internal/state | home.go, manifest.go, state.go and tests | Explicit project home/state and manifest model |

### What this means for Angel
1. **Plan dependencies before executing:** represent each action as a task node, prerequisites and ordering constraints.
2. **Make execution observable:** every step should report pending/running/succeeded/failed/skipped/cancelled, timestamps, and sanitized output/evidence.
3. **Use an explicit failure policy:** distinguish stop-on-failure from allowed independent continuation; never guess whether a dependent step should run.
4. **Rollback is a compensating action, not magic:** a local patch can be reverted; an email already sent or an external publication may not be. Track reversible and irreversible side effects separately.
5. **Skill registry should be curated:** store path/origin, version, license, scope, input/output schema, permissions, tests and a fingerprint; never auto-execute discovered skill code.
6. **Preserve evidence:** save changed paths, test results, command summaries, and review decisions with the task. Redact secrets and do not record entire credentials or sensitive response bodies.

### Decision
**High-value architectural reference.** Implement a compact TypeScript task graph and execution result contract inside Angel first. Do not introduce a Go sidecar solely because this reference is written in Go. Deep-dive the guard, review-transaction and consent-envelope modules before reusing any of the security details.

## 6. Official Claude Code repository: public-source boundary

Repository: https://github.com/anthropics/claude-code  
Revision examined: 65823ec0034ed0aa0266bc43903fefd3ff94a327  
README: https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/README.md

The public repository tree inspected contains documentation, changelog, scripts, examples, plugins, mods and configuration directories. The README describes the official Claude Code coding tool as a terminal/IDE/GitHub agent, but the public tree inspected does **not** present a complete implementation of the entire commercial runtime as readable source modules. Therefore we can reverse engineer and test the public plugins, skills, scripts, examples, workflows and observable behavior, but must not state that we inspected Claude Code's full internal runtime.

### How to investigate this target correctly
- Catalog visible public files and license terms.
- Trace public plugins, example scripts, commands and configuration schemas.
- Use official documentation to record declared capabilities.
- For black-box UI/CLI behavior, test only an installation and account the user is authorized to use; use REA observation/evidence and keep credentials out of captures.
- Record inaccessible implementation details as **Unknown / not publicly exposed**, not inferred from marketing claims.
- Do not decompile or bypass product access controls, license checks or account restrictions.

### Decision
**Study public extensions and user-visible workflows.** Use this reference to learn interaction patterns and public integration contracts, not as a fully open-source implementation to copy.


## 7. Claude Task Master: project planning and MCP task tools

Repository: https://github.com/eyaltoledano/claude-task-master  
Revision reviewed: c0c98d367c55296bfe69e65680625b6db437af02  
Source root: https://github.com/eyaltoledano/claude-task-master/tree/c0c98d367c55296bfe69e65680625b6db437af02/mcp-server/src

### Source map reviewed

- mcp-server/src/index.js: TaskMasterMCPServer, start/stop lifecycle, FastMCP server initialization, tool registration and provider registry.
- mcp-server/src/tools/tool-registry.js: toolRegistry, coreTools, standardTools, getAvailableTools, getToolCounts, getToolCategories, getToolRegistration, isValidTool.
- mcp-server/src/tools/add-task.js: registerAddTaskTool; uses schema validation, project-root normalization, tag resolution, direct task service and normalized error/result handling.
- mcp-server/src/tools/parse-prd.js: registerParsePRDTool; parses product requirement docs into task work items and uses progress capability checks.
- mcp-server/src/tools/next-task.js: registerNextTaskTool; queries tasks/status/dependencies and selects a next candidate.
- src/provider-registry/index.js: ProviderRegistry singleton for dynamic AI provider registration while preserving a compatibility path for static provider configuration.
- src/schemas/registry.js: central output schema mapping for add-task, analyze-complexity, expand-task, parse-prd, update-subtask and update-task commands.
- src/progress/progress-tracker-builder.js: configured progress tracker builder for reporting phases/progress features.
- mcp-server/src/tools contains add/remove dependencies, subtasks and tasks; tags; expand-task/expand-all; fix/validate dependencies; next-task; parse-prd; research; scope up/down; operation status and task updates.

### Angel adoption
- Keep one canonical Angel task store and have task decomposition produce tasks in that store. Do not run Task Master as a second task database.
- Bring over the strong concept of schema-validated operations: task create/update/reorder/expand endpoints should validate inputs and return a defined success/error response.
- Add dependency-graph checks and a next-eligible-task selection rule to Angel's task service.
- Use progress events for long operations; store operation ID, current step and failure summary so a user can resume or inspect a run.
- Turn PRD-to-tasks into a skill that drafts a proposed plan first. It should not overwrite the roadmap without approval.
- Do not expose file-system project-root operations to the public web client unless a local trusted runner is paired and scoped.

### Decision
**Adapt planning and tool-contract patterns.** Keep Angel's existing task context as the source of truth; implement a small dependency graph, typed operations and progress tracker rather than introducing all of Task Master's packages.

## 8. Claude Code Router: provider-aware model routing

Repository: https://github.com/musistudio/claude-code-router  
Revision reviewed: 057abaa1f95519ab8faf999e1ccef2b80ccdeb9e  
Routing source: https://github.com/musistudio/claude-code-router/tree/057abaa1f95519ab8faf999e1ccef2b80ccdeb9e/packages/core/src/routing

### Source map reviewed

| Module | Inspected symbols | Potential lesson |
|---|---|---|
| routing/config-compiler.ts | compileRouterConfig, compileRouterRule, compileProfileRoutings, configuredProfileDiagnostics, scriptRuleDiagnostics, fallbackModelDiagnostics | Compile mutable user config to a validated execution representation and surface diagnostics early |
| routing/execution-plan.ts | createRouteExecutionPlan, routeAttempt, clamp, uniqueStrings | Build a deterministic attempt list before sending a request; enforce maximum retry bounds |
| routing/failure-classifier.ts | classifyRouteFailure, classifyStatus | Classify client errors vs rate-limit/retryable/server failures and make retry decisions by policy |
| routing/model-registry.ts | ModelRegistry.resolve, findProvider, isConfigured, normalizeRouteSelector, parseProviderModelSelector, modelRegistryForConfig | Resolve aliases and model names against registered provider configuration |
| routing/policy-engine.ts | RoutePolicy, RoutePolicyEngine.evaluate | Evaluate policies in order and return the first matching decision with policy identity |
| routing/contracts.ts | route-related contract types | Keep runtime routing data typed |
| routing/protocol-adapter.ts and protocol-endpoints.ts | provider/protocol compatibility modules | Keep protocol translation separate from business/task logic |
| routing/token-estimator.ts | token-estimation module | Make usage estimates a routing concern, while labeling estimates as estimates |

### Angel adoption
- One Angel-owned model catalogue with provider, model, supported modalities, tool-calling support, context window, max output, rate-limit metadata, known free/premium eligibility and verification timestamp.
- Compile model selection and fallbacks before a request. Each attempt has a distinct log with provider/model, attempt index, reason and result class.
- Use bounded retries with exponential backoff only for retryable failures; do not retry authentication/permission errors blindly.
- Separate fallback because of transient provider failure from fallback because a task requires a different modality/capability.
- Do not store provider credentials in selector strings or model IDs. Per-user API keys must be encrypted server-side or placed in platform secret storage.
- Never rotate users/accounts or reroute around a provider's rate limits, billing, region restrictions or usage terms. When a quota is exhausted, explain the limit and use a permitted fallback.
- Expose fallback status to the user rather than silently changing model quality for every request.

### Decision
**High-value architecture reference; implement a small native router.** This repository is much larger than Angel needs today. Its declarative execution plan, provider/model registry, bounded failures and policy contract are relevant. Its account-pool or proxy-specific functionality is not adopted as a quota-circumvention mechanism.

## 9. Google Skills: curated capability packs, not executable plug-ins by default

Repository: https://github.com/google/skills  
Revision reviewed: 6d36cc600ea36e91f911ac654e0e66161c3ebe17  
Root tree reviewed: skills categories for ads, analytics, cloud, developers and identity, plus plugins and an index.

### Angel skill contract proposal
Each skill imported from Google, Claude, Composio, Gentle-AI, or another source must be normalized into an Angel skill manifest containing:
- stable ID/name, origin repository and pinned revision;
- license, author/attribution and compatible platforms;
- intended use and disallowed use;
- typed input/output schema and expected side effects;
- provider/API dependencies, data-access scopes and estimated quota/cost;
- whether execution is read-only, local-write, external-write or destructive;
- required approvals and revocation conditions;
- test fixtures/acceptance criteria and evidence references;
- version/fingerprint and a manual enable/disable control.

A skill's Markdown instructions are untrusted content. They cannot expand privileges on their own. Code-based skills need review, dependency/license scanning and sandbox tests before registration. A skill catalog is a library of candidate procedures, not permission for Angel to run any skill found online.

### Decision
**Adopt the manifest concept.** Do not embed the entire third-party catalogue or automatically download/execute skills. Select individual skills against Angel's staged plan and test them separately.

## 10. How these source reviews change the build plan

The operating core now has four source-backed reference patterns:
- **ADK:** execution/session orchestration, lifecycle and resumability.
- **OpenAI Agents:** run loop, tools, handoffs, guardrails and schema validation.
- **Gentle-AI:** dependency planning, staged pipeline, rollback contracts, skill inventory/fingerprinting and recovery evidence.
- **Claude Task Master:** task decomposition, dependency operations, one operation registry, and progress reporting.
- **Claude Code Router:** typed model registry, precompiled fallback plan and failure classification.
- **Google Workspace MCP:** per-service scopes, read-only modes, conditional tool registration and action-specific permissions.

These should converge into Angel's own interfaces, not a set of competing frameworks:

1. Task/run lifecycle owns status, steps, cancel/pause/resume and evidence.
2. Task graph owns dependencies, readiness and retries.
3. Tool registry owns descriptions, schema, required permissions and adapter.
4. Model router chooses from eligible providers within verified limits.
5. Policy engine checks consent/scopes before every external action.
6. Persistence owns task/run/event/memory state, not the provider-specific SDK.
7. Skill registry stores reviewed manifest metadata, not arbitrary runnable code.
8. UI reflects real states and external-action approval, not optimistic mock progress.


## 11. MCP Use: typed MCP clients, server mounts and tool security metadata

Repository: https://github.com/mcp-use/mcp-use  
Revision reviewed: f877f789e7b4979e62e5cbe221bfb29ebb86d1bd  
TypeScript source: https://github.com/mcp-use/mcp-use/tree/f877f789e7b4979e62e5cbe221bfb29ebb86d1bd/libraries/typescript

### Source map reviewed
- Client entry: libraries/typescript/packages/client/src/index.ts exports MCP connection/connector patterns, transport, OAuth flow helpers such as completeOAuthFlow, isOAuthInteractionRequired and isUnauthorized, plus code-mode and telemetry modules.
- Server entry: packages/server/src/index.ts exports MCPServer, createMcpMount, fetch composition and middleware helpers such as hostValidationMiddleware, originValidationMiddleware, jsonBodyMiddleware, matchesPath and pathnameOf.
- Server tool contract: packages/server/src/tools.ts declares ToolSecurityScheme, ToolDefinition, ToolRef, ToolResult, input/output inference and resolveToolInputSchema. This separates a tool's display/inputs/security metadata from its handler.
- Client source tree contains adapters, auth, code-mode, core, React helpers, sandbox, telemetry, and transport.
- Server source tree contains OAuth, HTTP, request/context handling, MCP mount, resources, prompts, tools, skills, response conversion and middleware modules.

### Angel adoption
- Use a single typed adapter contract per MCP server: metadata, declared tools, schemas, authentication state, allowed scopes, execution risk and output schema.
- Treat all remote MCP tool descriptions, schemas and outputs as untrusted input. Validate schemas and outputs again inside Angel's server before using them in privileged actions.
- Host/origin/request validation matters when tools are exposed through a web server. Do not publish MCP endpoints without authenticating callers or validating allowed origins/hosts as appropriate to the deployment topology.
- Show required permissions and side effects before connecting; keep server-side action logging, revocation and per-user isolation.
- Avoid running arbitrary tool-generated code in code-mode without an isolated sandbox, explicit resource/network policy and time limits.

### Decision
**Adapt interface patterns after comparing with Angel's existing toolRegistry.** Do not install a second MCP stack until a concrete use case shows it reduces integration work. Prefer compatible schemas and security metadata over a new framework dependency.

## 12. Claude Code Action: GitHub-hosted coding runs

Repository: https://github.com/anthropics/claude-code-action  
Revision reviewed: ae68417a745a5df4b2124873632bd73a2255e6f6  
Source: https://github.com/anthropics/claude-code-action/tree/ae68417a745a5df4b2124873632bd73a2255e6f6/src

### Source map reviewed
- src/entrypoints/prepare.ts: parses GitHub context, detects run mode, sets up GitHub token, checks write permissions, validates trigger conditions and prepares tracking comments.
- src/entrypoints/run.ts: installs/resolves the agent executable, checks GitHub context/write permissions, prepares a prompt, runs the agent and writes the result/turn summary.
- src/entrypoints/collect-inputs.ts and format-turns.ts: input normalization and conversion of execution turns into a user-visible summary.
- src/github/validation/permissions and src/github/token: dedicated permission validation and token setup boundaries.
- src/modes/detector.ts and mode-specific modules: routes supported GitHub interaction types into an execution mode.
- action.yml and base-action define GitHub Actions integration and reusable action variants.

### Angel adoption
For Angel's GitHub integration:
- begin with repository/PR/issue read-only analysis and CI status summaries;
- give each job only the GitHub permissions it needs;
- log the trigger event, repo/PR identity, branch/ref, approved tools and changed files;
- use branch/PR patches as the review boundary;
- request explicit approval before commits, pushing, merging, editing issues/comments or deploying;
- record tests and the resulting commit/PR link as evidence.

### Decision
**Use as a design and implementation reference for GitHub workflows.** The action's environment is GitHub Actions; it does not automatically provide an Angel SaaS backend or a general-purpose device-control mechanism. Implement only the necessary behavior through Angel's own authorized GitHub integration and isolated jobs.

## 13. P1 cross-check: keep proprietary/session-specific boundaries visible

- Public code may show provider adapters, wrappers, plugins and integration tools without disclosing the entire hosted model/runtime.
- A proxy or compatibility layer can translate protocols; it does not grant access to another provider, change that provider's price or make paid quotas unlimited.
- Skill instructions are not the same as executable code, and neither one is permission to access an app.
- Browser observation is not browser-write permission. Inspecting a website and clicking “send”, “delete”, “purchase” or “publish” are different risk classes.
- The internal event/task state, memory, audit record and account ownership should remain Angel-owned, even when an external tool/framework performs part of the work.
