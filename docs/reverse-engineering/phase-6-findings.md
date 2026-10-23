# Phase 6 Findings: Learn Claude Code Agent Harness, Memory, Tasks and Goal Loops

**Repository:** https://github.com/shareAI-lab/learn-claude-code  
**Pinned revision:** `ce8f9f186058939da54c9d6fead78dfb5d0fd6c3`  
**Evidence:** selected source code inspected across all 17 `s##_*` lesson implementations; no lesson was installed or executed in this review.

## Why it matters to Angel

This is a staged educational codebase that demonstrates how an agent harness grows from one model/tool loop into a runtime with permissions, hooks, task planning, skills, compaction, memory, background work, schedules, agent teams, MCP integrations, durable workflow state and goal-driven continuation. It maps unusually well to Angel's operating-core and later background-agent roadmap.

## Key function map

| Lesson | Key functions/classes | Capability |
|---|---|---|
| s01 Agent Loop | `run_bash`, `agent_loop` | Model → tool calls → execute → tool results → model loop |
| s02 Tool Use | `safe_path`, `run_read`, `run_write`, `run_edit`, `run_glob`, `agent_loop` | Workspace tools and file/path handling |
| s03 Permission | `check_deny_list`, `contains_destructive_command`, `check_rules`, `ask_user`, `check_permission` | Multiple permission gates before tool dispatch |
| s04 Hooks | `register_hook`, `trigger_hooks`, `permission_hook`, `log_hook`, `large_output_hook`, `context_inject_hook`, `summary_hook` | Lifecycle event hooks |
| s05 TODO | `TodoManager.update`, `TodoManager.render`, `run_todo_write` | Task progress reporting and reminder injection |
| s06 Subagents | `execute_tool`, `extract_text`, `run_subagent`, `agent_loop` | Separate agent loop with a focused prompt |
| s07 Skills | `SkillLoader.parse_frontmatter`, `scan`, `catalog`, `load`, `build_system_prompt` | Discover skill metadata and load one skill on demand |
| s08 Context Compaction | `ContextCompactor.estimate_chars`, `tool_result_budget`, `persist_large_output`, `snip_compact`, `micro_compact`, `fit_tool_results`, `summarize_history`, `compact_history`, `prepare` | Limit context, persist large outputs, preserve transcripts, summarize old history |
| s09 Memory | `should_store_memory`, `write_memory_file`, `rebuild_memory_index`, `select_relevant_memories`, `validate_memory_record`, `extract_memories`, `consolidate_memories` | Memory extraction, selection, deduplication/consolidation and index rebuilding |
| s10 Task System | `TaskStore.create/update_dependencies/save/load/list`, `incomplete_dependencies`, `can_start`, `claim_task`, `complete_task` | Durable task files, dependency readiness, ownership and task lifecycle |
| s11 Background Tasks | `_stop_process_group`, `_stop_all_shell_processes`, `BackgroundManager.start/collect`, `should_run_background`, `inject_background_results` | Background command management, result collection and termination cleanup |
| s12 Cron | `validate_cron`, `schedule_job`, `cancel_job`, `poll_due_jobs`, `consume_cron_queue`, `acknowledge_cron_jobs`, `restore_cron_jobs`, `start_runtime_threads`, `stop_runtime_threads` | Schedule validation, durable job state, queue and worker lifecycle |
| s13 Agent Teams | `task_store_lock`, assignment versioning, `claim_task`, `complete_task`, `create_worktree`, `remove_worktree`, `assignment_cwd`, task-specific file tools | Multi-agent task ownership, worktree isolation and concurrency coordination |
| s14 MCP Plugin | `MCPClient.register`, `call_tool`, `normalize_mcp_name`, `connect_mcp`, `assemble_tool_pool`, `execute_tool` | Connect to external tools and add declared schemas/handlers to the loop |
| s15 Integrated Harness | `load_memory_runtime`, `scan_skills`, `list_skills`, `load_skill`, task/worktree lifecycle and background cleanup | Combines earlier patterns into a larger runtime |
| s16 Workflow Runtime | `create_run_id`, `validate_run_id`, `check_permission`, `SimpleJsonSchema.validate`, `WorkflowJournal.cached/record`, `Budget`, `ExecutionLimits`, `ExecutionState.phase/agent` | Typed workflow inputs, persistent journal/checkpointing, budget and execution limits |
| s17 Goal Loop | `PromptGoalEvaluator.evaluate`, `GoalController.set_goal/clear/status/evaluate_after_turn/restore`, `AgentSession.submit`, `submit_background_result`, `_run_query` | Completion-condition evaluation and continuation until goal met, stopped, or budget/permission gate ends the run |

Pinned code examples:
- Agent loop: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s01_agent_loop/code.py
- Permission gates: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s03_permission/code.py
- Hooks: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s04_hooks/code.py
- Skill loading: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s07_skill_loading/code.py
- Context compaction: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s08_context_compact/code.py
- Memory: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s09_memory/code.py
- Task system: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s10_task_system/code.py
- Background tasks: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s11_background_tasks/code.py
- Cron scheduler: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s12_cron_scheduler/code.py
- Agent teams: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s13_agent_teams/code.py
- MCP plugin: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s14_mcp_plugin/code.py
- Workflow runtime: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s16_workflow_runtime/code.py
- Goal loop: https://github.com/shareAI-lab/learn-claude-code/blob/ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/s17_goal_loop/code.py

## How Angel should use this

### Adopt the underlying concepts
1. **One durable run state machine:** goal, task plan, current step, approvals, retries, outputs, costs and cancellation state.
2. **Permission checks outside the model:** server-side deny/allow policies, user approval, scoped tool capability, and immutable audit events.
3. **Hook lifecycle:** input submitted, before tool, after tool, tool error, context limit, memory extraction, task completion and shutdown.
4. **Explicit dependency graph:** a task only becomes runnable when prerequisites are complete; task claims use a lease/lock so multiple agents cannot both own a non-shareable task.
5. **Progressive skill loading:** keep name/description metadata available and load reviewed skill content only when needed.
6. **Compaction with durable evidence:** persist big tool outputs and transcripts, summarize older context with source links, preserve unprocessed tool calls/results and essential constraints.
7. **Validated memory:** validate scope, provenance, confidence and sensitivity; deduplicate; avoid converting arbitrary text into permanent user memory.
8. **Background lifecycle:** job IDs, status, process/job cleanup, user-visible result queue, and cancellation/expiration.
9. **Goal loop with budget:** define a measurable completion condition and stop when satisfied, blocked, cancelled or over budget. The evaluator must not have privilege to override user permissions.
10. **Separate worktrees/isolated workspaces:** for parallel code tasks, prevent agents from editing the same working tree; integrate via reviewed patch/PR.

### Do not copy uncritically
- Lesson tool runners call shell/file functions and are teaching scaffolds. A production Angel service must enforce filesystem scope and execute shell in an isolated worker with resource/time/network limits.
- A regex/denylist for commands is not a complete OS security boundary; combine capability allowlists, isolation and explicit approvals.
- Agent teams share resources and can race. Angel needs transaction/lease rules, idempotency keys and checks against duplicate external actions.
- Persisted cron/background work needs restart recovery, time-zone semantics, missed-run policy, user revocation and visibility.
- Memory extraction can be poisoned by prompt injection or errors. Store provenance and allow corrections/deletion.
- A goal model can declare a false positive. Require acceptance checks/tests rather than trusting the evaluator's “done” label alone.
- The examples depend on specific model APIs and Python libraries. Angel's implementation should use its own TypeScript contracts and provider adapter unless a separately hosted Python worker is justified.

## Decision
**High priority for Angel's execution architecture.** Use this as a design curriculum and source reference for the task engine, memory, background job and agent goal system. It does not justify importing a second runtime wholesale.
