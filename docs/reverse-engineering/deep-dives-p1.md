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
