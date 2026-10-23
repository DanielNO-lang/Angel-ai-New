# Phase 7 Findings: Kuse Cowork Native Agent, Tools, MCP and Desktop Execution

**Repository:** https://github.com/kuse-ai/kuse_cowork  
**Pinned revision:** `09c6ab05c661b5f3337eed503e988becc82b2af1`  
**Evidence level:** selected Rust source modules, TypeScript UI/store files and tool dispatch paths inspected. No app was built or executed.

## 1. Architecture map

Kuse Cowork is a desktop application rather than a browser-only agent:
- React/Vite renderer under `src/`.
- Tauri/Rust host under `src-tauri/src/`.
- Provider/model request translation in `src-tauri/src/agent/agent_loop.rs`.
- Tool contract and results in `agent/types.rs`.
- One tool dispatch point in `agent/tool_executor.rs`.
- Local filesystem and shell tools in `tools/`.
- Optional Docker command execution in `tools/docker.rs`.
- MCP connection, tool discovery/execution and status in `mcp/`.
- Skill metadata and default skill installation in `skills/mod.rs`.
- UI includes Chat, Agent, Model Selector, Settings, MCP Settings, Skills List and Task Panel.
- SQLite-backed application storage includes an MCP server table.

Source root: https://github.com/kuse-ai/kuse_cowork/tree/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src

## 2. Key functions found

### Agent loop and provider adapters
Source: https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/agent/agent_loop.rs
- `AgentLoop::new`, `new_with_provider`
- `AgentLoop::run`, `run_with_history`
- `send_request`
- `send_anthropic_request`, `send_openai_request`, `send_google_request`
- `convert_to_openai_format`, `convert_to_google_format`
- `handle_google_stream_response`, `handle_openai_stream_response`, `handle_stream_response`
- `parse_response`, `parse_plan`, `emit_step_markers`

This demonstrates one application-level loop with adapter-specific request/stream parsing. Angel should use a common provider contract rather than let each model provider control task persistence and UI state.

### Tool dispatch
Source: https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/agent/tool_executor.rs
- `ToolExecutor::new`
- `ToolExecutor::with_mcp_manager`
- `ToolExecutor::execute`

The dispatch maps tool names to file read/write/edit, bash, glob, grep and list-directory handlers; Docker tools take a separate path; MCP execution is wired through the manager. This is a useful single dispatch boundary, but Angel also needs server-side per-user authorization, risk metadata and audit events at this boundary.

### Tool contracts and result types
Source: https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/agent/types.rs
- `ToolDefinition`
- `ToolUse`
- `ToolResult::success` / `ToolResult::error`
- `ContentBlock`, `AgentMessage`, `AgentContent`, `AgentConfig`, `AgentEvent`, `PlanStepInfo`
- `build_system_prompt`

The lesson is to normalize tools, use structured success/error results and stream explicit agent events instead of treating everything as untyped text.

### MCP manager
Source: https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/mcp/client.rs
- `MCPManager::new`
- `connect_server`, `disconnect_server`
- `execute_tool`
- `get_all_tools`, `get_server_statuses`
- `discover_tools_http`
- `perform_oauth_flow`

Connection lifecycle: reject disabled server, mark connecting, optional OAuth request, initialize MCP HTTP client, discover tools, then store client and mark connected. Tool calls have a 60-second timeout and normalize JSON-RPC error/result fields. This is a helpful lifecycle design, but the app's exact OAuth grant/client and server requirements must match the integrated server; arbitrary MCP server metadata is untrusted.

### MCP configuration and persistence
Sources:
- https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/mcp/config.rs
- https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/mcp/storage.rs

Observed operations include configuration builder methods `with_oauth`, `with_enabled`, configuration update, database table creation, `save_mcp_server`, `get_mcp_servers`, `get_mcp_server`, `delete_mcp_server`, and `update_mcp_server_enabled`. In the inspected storage implementation the schema includes `oauth_client_secret` and saves/reads that value through SQLite; this excerpt does not show at-rest encryption. Verify the app's OS-level data protections and secret handling before adopting the pattern.

### File and shell tools
Sources:
- https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/tools/bash.rs
- https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/tools/file_read.rs
- https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/tools/file_write.rs
- https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/tools/file_edit.rs
- https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/tools/docker.rs

Observed operations:
- Every file tool exposes a typed `definition()` and an `execute(...)` handler.
- File-read supports line offset/limit; file-edit requires exact old text and rejects ambiguous repeated matches unless `replace_all` is explicitly requested.
- `resolve_path` expands `~`, joins relative paths with the project path/current directory, and returns absolute paths directly in the inspected file tools.
- Bash accepts a timeout (documented default 60 seconds, maximum 300 in its schema), uses a shell subprocess and a timeout helper.
- Docker tools include `get_docker_tools`, `execute_docker_tool`, `docker_run`, `docker_list`, `docker_images` and image-pull support; the code advertises container execution with optional volume mounts.

#### Security interpretation
The inspected file helpers do not visibly confine absolute paths to the project root, and relative paths are joined without a visible canonicalized-root check in these functions. That means **path confinement must be investigated before reuse**; it does not on its own establish exploitability in every deployment context. Angel should canonicalize paths, reject traversal and symlink escapes, enforce an allowed workspace root on every read/write, and test absolute paths, `..`, symlinks and OS-specific edge cases. Shell execution must be isolated and must not inherit ambient production secrets. Bind mounts should be narrowly scoped. A timeout alone is not a sandbox.

### Skill registry
Source: https://github.com/kuse-ai/kuse_cowork/blob/09c6ab05c661b5f3337eed503e988becc82b2af1/src-tauri/src/skills/mod.rs
- `get_skills_directory`, `ensure_skills_directory`, `install_default_skills_if_needed`, `install_skill`, `get_skills_directory_path`, `parse_skill_metadata`, `get_available_skills`.

Angel can reuse a registry concept with stable identifiers, metadata, scope, origin, license, enable/disable and review status. Do not automatically execute arbitrary scripts shipped alongside a skill.

## 3. What Angel should adopt

**Keep / adapt**
- A shared agent loop with provider adapters and one tool executor.
- Typed tool input/output schemas and normalized error results.
- Streaming events and explicit execution/task status.
- MCP connect/disconnect/discovery lifecycle and timeouts.
- File edits that verify exact match count instead of silently applying ambiguous replacements.
- Optional Docker isolation for a future desktop/local runner after hardening, not as a claim of full sandbox safety.
- A skill registry separated from privileged execution.

**Do not copy as-is**
- Direct filesystem tools that accept absolute paths without visible workspace-root confinement.
- Client secrets stored in a plain SQLite table without a verified encryption/keyring strategy.
- Arbitrary shell/Docker mounts with broad host access.
- A desktop process's privileges exposed to a remote web UI without pairing, authorization, CSRF/origin defenses and audit logs.

## 4. Decision

**High-value reference for a future Angel desktop companion, not for the current web-only runtime.** Use the adapter and UI concepts after Angel's browser operating core is stable. Implement privileged tools in a distinct local worker with authentication, scoped permissions, explicit approval, process isolation, path sandboxing, credential redaction and audit history.
