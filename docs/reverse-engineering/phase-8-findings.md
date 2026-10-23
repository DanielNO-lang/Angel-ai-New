# Phase 8 Findings: Official Claude Code Public Plugins and Workflows

**Repository:** https://github.com/anthropics/claude-code  
**Pinned revision:** 65823ec0034ed0aa0266bc43903fefd3ff94a327 (2026-10-22)  
**Evidence level:** selected public plugin workflows, agent instructions and Python hook source inspected; the official product's full hosted/runtime implementation remains unavailable in the public tree reviewed. No plugin was installed or executed.

## 1. Scope

The public repository contains documentation, example settings, scripts and an official plugin directory. Public plugins show reusable workflow definitions for feature development, code review, commit/PR automation, SDK app verification, security reminders, hooks and iterative development. This is not evidence that the complete Claude Code runtime itself is fully open source.

Plugin catalog: https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/README.md

## 2. Feature development: seven-phase workflow

Source: https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/feature-dev/commands/feature-dev.md

The public command structures feature work into discovery, codebase exploration, clarification, architecture design, implementation, quality review and summary/handoff. It recommends 2–3 focused explorer agents and then asks the coordinator to read the important files identified by those agents. Three role instructions split responsibilities into code explorer, code architect and code reviewer.

Sources:
- https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/feature-dev/agents/code-explorer.md
- https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/feature-dev/agents/code-architect.md
- https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/feature-dev/agents/code-reviewer.md

**Angel adoption:** perform source discovery before design, gather file/symbol evidence, create an implementation plan, patch in stages, test, and produce an evidence-backed summary. Re-read critical source files rather than trusting a subagent summary alone. When details are missing, use sensible defaults where safe and keep unresolved assumptions visible rather than needlessly blocking implementation.

## 3. Code review and specialized reviewers

Sources:
- https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/code-review/commands/code-review.md
- https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/pr-review-toolkit/README.md

The code-review workflow screens out closed/draft/unneeded PRs, identifies applicable project instruction files, obtains a change summary, runs focused review agents, then validates candidate issues before reporting them. It emphasizes compile failures, unambiguous logic errors and concrete security issues over style preferences and weak guesses. The workflow limits available tools by listing explicit permitted commands.

The PR review toolkit offers six lenses:
- comment accuracy;
- test coverage and behavioral gaps;
- silent failures and weak fallback/error handling;
- type design and invariants;
- general code review;
- code simplification.

**Angel adoption:** choose reviewers based on the diff rather than always running every reviewer. Type/schema changes need type review; error branches need failure review; new features need test review; auth, network and tool-execution changes need security review. Deduplicate findings and require source evidence. For Angel's error backlog, group errors by root cause, validate each failure, fix a coherent cause, rerun the relevant checks and preserve both before/after evidence.

## 4. Security Guidance: layered warnings and changed-code review

Sources:
- https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/security-guidance/hooks/security_reminder_hook.py
- https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/security-guidance/hooks/patterns.py
- https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/security-guidance/hooks/diffstate.py

The hook source describes fast pattern-based checks after file edits, Stop-time LLM review of changed code relative to a Git baseline, commit-related review, locked/atomic state updates, warning deduplication, warning-resolution sweeps, counters/rate limits, bounded review attempts and a cap on source files sent for review.

Functions inspected include:
- check_patterns
- extract_content_from_input
- handle_user_prompt_submit
- emit_metrics
- atomic_check_and_mark_warning
- atomic_check_counter
- atomic_check_rate_limit
- record_pending_warnings
- sweep_pending_warnings
- save_baseline_sha
- load_baseline_sha
- consume_stop_state
- capture_git_baseline
- compute_v2_review_set

The pattern catalogue includes reminders for GitHub Actions workflow injection, unsafe deserialization, unsafe YAML loaders and risky PyTorch loading defaults, among other patterns.

**Angel adoption:** run deterministic checks early; review only the changed files while retrieving enough context to validate each finding; track warnings as pending/fixed/unresolved/dismissed/reopened; deduplicate repeat findings; cap review count and input size; independently review auth, OAuth, tool execution, URL fetching and secret-handling changes. Regex warnings and LLM review are not security boundaries and must be supported by permissions, tests, dependency checks and sandboxing.

## 5. Hookify: user-defined rules

Source: https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/hookify/README.md

Hookify defines Markdown rules with metadata such as name, enabled, event, pattern, action and conditions. Rules can warn or block and be toggled without editing hook code. Example events include command, file, stop and prompt.

**Angel adoption:** provide a limited, schema-validated preference/policy system such as warning before destructive commands, blocking edits to protected paths or requiring checks before task completion. User rules are not a sufficient sandbox: high-impact policy must be enforced by the executor/server, not merely a regex.

## 6. Ralph Wiggum: bounded goal loops

Source: https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/ralph-wiggum/README.md

The visible plugin uses a Stop hook to continue the same prompt across iterations until a completion phrase is emitted or a maximum iteration count is reached. The README recommends clear acceptance criteria and a finite iteration limit. It also explains that the completion phrase uses simple exact-string matching, not a multi-condition evaluator.

**Angel adoption:** combine iteration with a structured goal definition, measurable acceptance checks, an iteration/time/token budget, visible attempts, blocked states, cancellation and protection against repeating non-idempotent external actions. Never let the model's own “done” phrase be the only proof that work succeeded.

## 7. Commit Commands: Git workflow automation

Source: https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/commit-commands/README.md

The public plugin documents commands for creating commits, committing/pushing/opening a PR, and cleaning local branches/worktrees whose remotes have disappeared. It inspects repository status, diffs and recent commit messages, and documents avoiding common secret files.

**Angel adoption:** keep repository work branch/PR based. Treat staging, committing, pushing, merging and deployment as separate privileges. A generic “finish task” operation must not silently move work into main or trigger a Netlify deployment.

## 8. Agent SDK Development: create, then verify

Source: https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/plugins/agent-sdk-dev/README.md

The public setup command describes scaffolding TypeScript or Python SDK apps, creating environment examples and ignore rules, checking type/syntax, and invoking a verifier. The TypeScript/Python verifiers check package versions, configuration, SDK usage, environment-secret handling, error paths and documentation, producing PASS / PASS WITH WARNINGS / FAIL output.

**Angel adoption:** pair new integration work with a verifier checklist for dependencies/imports, types, configuration, secret storage, cancellation/failure paths, documentation and runtime contracts. Creating a template does not prove it is production ready.

## 9. Consolidated decisions

| Public workflow pattern | Angel decision |
|---|---|
| Seven-phase feature development | Adapt as a discovery, plan, implementation, review and evidence sequence |
| Parallel code exploration | Use selectively, then verify important findings against source |
| High-signal independent code review | Adopt as a quality gate for changes |
| Security hook plus Git-baseline diff | Adapt for changed-code review and warning lifecycle |
| User-defined hooks | Adopt limited validated policies backed by the actual executor |
| Iterative goal loop | Adopt with budgets and independent acceptance checks |
| Commit/push/PR convenience | Adapt to branch/PR workflow with distinct permissions |
| SDK project generator/verifier | Use create-and-verify pattern for new integrations |

## 10. Boundary and status

These are public plugin artifacts pinned at the inspected revision. This report does not claim access to the complete official Claude Code runtime, internal hosted backend or proprietary model implementation. No plugin code was executed. Before any code reuse, inspect the exact license, plugin files, dependencies and attribution requirements.

Angel should implement compatible ideas through its existing TypeScript architecture and platform constraints rather than copying the complete product or importing overlapping frameworks wholesale.
