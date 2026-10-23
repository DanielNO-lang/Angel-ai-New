# Phase 4 Findings: Cookbook Functions, Tool Loops and Reusable Skill Design

**Review date:** 2026-10-23  
**Evidence level:** selected notebook code, skill instructions and repository structures inspected. No notebook was executed. Live API examples may require provider keys and billable usage.

## 1. Anthropic Claude Cookbooks

Repository: https://github.com/anthropics/claude-cookbooks  
Pinned revision: `a162e0184e71b60290808a43961a6cbc8060123c`

### Capability families observed
The top-level cookbook layout groups examples for:
- Classification, retrieval-augmented generation and summarization.
- Tool use, function calls and customer-service agents.
- Vision, chart/diagram interpretation, forms and multimodal content.
- Agent SDK and managed-agent examples.
- Cost optimization, extended thinking, evaluation, observability and patterns.
- Third-party retrieval integrations such as vector stores and web-page reading.

These are recipes and notebooks, not a cohesive ready-to-deploy assistant. Many examples require an Anthropic API key and provider usage.

### Source-level tool-use example: calculator_tool.ipynb
Source: https://github.com/anthropics/claude-cookbooks/blob/a162e0184e71b60290808a43961a6cbc8060123c/tool_use/calculator_tool.ipynb

Key functions:
- `calculate(expression)`: normalizes a constrained expression and evaluates arithmetic for demonstration purposes.
- `process_tool_call(tool_name, tool_input)`: dispatches a declared tool name to the implementation.
- `chat_with_claude(user_message)`: sends the message and available tool schemas to the API, detects a tool-use stop reason, runs the chosen local handler, sends the tool result back and asks for the final response.

**Important security note:** this notebook's `calculate` uses Python `eval` and explicitly labels it demo-only. Angel should not reuse that implementation in a production tool. Use a math parser with an allowlisted grammar, input-length/complexity limits, and tests.

### Source-level tool-use example: customer_service_agent.ipynb
Source: https://github.com/anthropics/claude-cookbooks/blob/a162e0184e71b60290808a43961a6cbc8060123c/tool_use/customer_service_agent.ipynb

Key functions:
- `get_customer_info(customer_id)`
- `get_order_details(order_id)`
- `cancel_order(order_id)`
- `process_tool_call(tool_name, tool_input)`
- `chatbot_interaction(user_message)`

The declared tool schema defines the permitted input fields; the dispatcher chooses the local handler; the chat loop handles repeated `tool_use` responses by returning a `tool_result` message to the model until it produces a normal response. The example customer/order data and cancellation behavior are simulated. It does **not** prove a real order system is connected.

### Angel adoption
Adopt a normalized tool-loop contract:
1. Give the model a list of tools whose schemas are explicit.
2. Validate the proposed tool name and arguments server-side.
3. Check authorization and risk before execution.
4. Execute the tool, record result/error and side effects.
5. Return the result to the model and continue within a maximum-turn/budget limit.
6. Show the actual outcome and cite tool evidence; do not translate simulated data into a success claim.

Keep read-only tools separate from write tools. A model's choice of `cancel_order` must never itself constitute user consent.

## 2. OpenAI Cookbook

Repository: https://github.com/openai/openai-cookbook  
Pinned revision: `4bb93ceb583c809a5f0f6b374cb66f192dd534a0`  
License in README: MIT.

### Repository breadth observed
The example tree includes tool calling, Responses API, Agents SDK, multi-agent orchestration, agent evaluations, structured outputs, file search, web search, retrieval, embeddings, long-context summarization, image/video understanding, real-time voice/audio, rate-limit handling, caching, testing, safety guardrails and sandboxed code workflows.

Representative source examples reviewed:
- https://github.com/openai/openai-cookbook/blob/4bb93ceb583c809a5f0f6b374cb66f192dd534a0/examples/responses_api/responses_api_tool_orchestration.ipynb
- https://github.com/openai/openai-cookbook/blob/4bb93ceb583c809a5f0f6b374cb66f192dd534a0/examples/agents_sdk/building_reliable_agents_memory_compaction.ipynb
- https://github.com/openai/openai-cookbook/blob/4bb93ceb583c809a5f0f6b374cb66f192dd534a0/examples/agents_sdk/agent_improvement_loop.ipynb

### Key patterns observed in Responses API tool orchestration
- Describe native web-search and custom function tools with input schemas.
- Submit the user query, available tools and an explicit system instruction to the Responses API.
- Inspect returned tool/function-call output.
- Execute the selected adapter and add results back to the conversation/API call.
- The notebook demonstrates multiple-tool use (e.g., external search plus retrieval from a vector index) and optionally parallel tool calls.

**Review limitation:** selected code includes assumptions such as reading the first output item to find a tool call. Angel should robustly process all returned output items, validate each tool result, account for parallel calls, and enforce its own policy regardless of the exact provider SDK.

### Key functions observed in memory-compaction example
- `workspace_file(text)`: build a controlled artifact for a sandbox workspace.
- `build_evidence_manifest()`: creates a manifest of document batches for evidence review.
- `build_baseline_agent()`: configures an agent with filesystem/shell capabilities and an evidence-focused instruction set.
- `_read_text_file`, `_list_workspace_files`, `_read_memory_artifacts`: retrieve state/workspace artifacts.
- `run_in_unix_sandbox(agent, task, ...)`: execute a controlled task in a sandboxed environment.
- `build_compaction_agent()`, `build_compaction_session()`, `force_compaction_checkpoint(session)`: demonstrate explicit context compaction/session checkpoints.
- `workflow_memory()`, `build_memory_agent()`, `build_reliable_evidence_agent()`: separate memory creation and evidence-review roles.

The notebook has `RUN_AGENT = False` by default and requires a provider key to run a live workflow. Its functions are a reference, not proof that an agent or sandbox was executed in this review.

### Key functions observed in agent-improvement/evaluation example
The example includes `AgentConfig.build_instructions()`, `format_policy_section()`, `format_policy_value()`, `check_evidence_coverage()`, `validate_output_contract()`, and trace-to-JSONL helpers such as `setup_halo_tracing()`, `HaloJsonlTraceProcessor`, and span attribute projection methods. The workflow emphasizes a stable agent configuration, required artifacts, evidence coverage validation, output-contract checks and structured tracing.

### Angel adoption
- Keep one Angel-owned task/session/persistence model regardless of selected provider.
- Implement a provider-normalized tool-call loop and parse all output blocks, with validated arguments, normalized errors, a maximum turn count and bounded parallelism.
- Borrow context compaction as a task checkpoint and memory summarization mechanism, but preserve source references and user facts instead of silently reducing history to lossy summaries.
- Require evidence manifests and output-contract validation for complex research/coding tasks.
- Use telemetry for diagnostics while redacting prompt secrets, authorization headers and private data.
- Reproduce the interface and behavior in Angel's React/TypeScript stack, adapting concepts rather than making an entire cookbook Python runtime a dependency.

## 3. Skill authoring patterns: Composio and Alireza collections

### Composio Awesome Claude Skills
Repository: https://github.com/ComposioHQ/awesome-claude-skills  
Pinned revision: `be2a406907dbc61b73e6827ded415c96139d13a2`  
Representative skill: https://github.com/ComposioHQ/awesome-claude-skills/blob/be2a406907dbc61b73e6827ded415c96139d13a2/skill-creator/SKILL.md

Observed skill structure:
- Required `SKILL.md` with YAML frontmatter, name and description.
- Optional `scripts/`, `references/` and `assets/` folders.
- Short routing metadata that says when to use a skill.
- Procedural instructions separated from long reference content and output assets.
- Progressive disclosure: only load large reference files when needed.
- Scripts are appropriate for deterministic repeatable work but require independent code review.

### Alireza Rezvani Claude Skills
Repository: https://github.com/alirezarezvani/claude-skills  
Pinned revision: `27cfcd0fb0a41f60adffcbd5271fdf8839f86ed2`  
Authoring standard: https://github.com/alirezarezvani/claude-skills/blob/27cfcd0fb0a41f60adffcbd5271fdf8839f86ed2/SKILL-AUTHORING-STANDARD.md

Observed authoring patterns:
- Context-first: check project/domain context before asking for information.
- Explicit modes for new work vs improving existing work.
- Proactive triggers and clear output artifacts.
- Confidence/evidence labels for recommendations.
- Structured communication and a clear task outcome.
- Skill-name linting to avoid collisions with native agent commands.

These are useful patterns, but the catalogue contains many different sources and specialized procedures. Do not import all skills automatically or trust their prompts as privileged policy.

### Angel's normalized skill contract
Every skill Angel accepts should have:
- Unique namespaced ID, description and trigger criteria.
- Origin repo, immutable revision, license and attribution requirements.
- Typed input/output schema.
- Required integrations, scopes and budget/rate-limit metadata.
- Risk class and side effects (read-only, local-write, external-write, destructive).
- Required approval conditions and rollback/compensation policy.
- Test fixtures and success/failure criteria.
- Version/fingerprint, reviewer and enable/disable state.
- Optional scripts/references/assets with their own license, dependency and security review.

### Decision
**Adapt tool-loop, evaluation and skill-pack patterns.** Do not copy example business handlers with simulated data, do not use Python `eval`, do not run live notebooks without deliberate API-cost approval, and do not assume a skill's instructions can authorize a tool call.
