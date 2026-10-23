# Phase 1 Findings: High-priority agent, skills, MCP and routing references

**Evidence level:** README/documentation preflight, not full source audit or runtime validation. Claims below are marked **Declared** until code paths and tests are inspected. Last reviewed: 2026-10-23.

## Executive synthesis

The most reusable ideas across the high-priority targets are:
1. **A reliable task harness** around a model: durable plans, explicit tools, clear execution states, safe retries, and verifiable results.
2. **A provider-neutral intelligence router** that chooses a suitable model, uses graceful fallbacks, and records cost/latency without scattering provider logic throughout the app.
3. **A curated skill registry** with clear entry points, required inputs, permission requirements, test cases, and origin/license metadata.
4. **MCP as a controlled integration boundary** for external applications, rather than implementing bespoke connectors for every service.
5. **An approval-aware action runner** that previews external changes and keeps audit evidence.
6. **Research/evaluation alongside implementation**: acceptance tests and source evidence should accompany each imported idea.

Do not install or adopt all these frameworks at once. Several overlap substantially. Angel's own TypeScript application, services, tool registry, task system, and Supabase/Netlify architecture remain the host. These repositories are references from which to select small, compatible capabilities.

## Target dossiers

### 1. Google Agent Development Kit (ADK Python)
Source: https://github.com/google/adk-python  
README: https://github.com/google/adk-python/blob/main/README.md  
**Declared:** code-first framework for creating, evaluating and deploying agents; graph-based workflow runtime; model- and deployment-agnostic design even though optimized for Gemini.  
**Potential Angel use:** execution-graph concepts, typed agent/tool contracts, evaluation fixtures, workflow state, multi-agent handoffs.  
**Decision:** adapt patterns first; do not add a Python runtime just to host the existing TypeScript app. Compare ADK with OpenAI Agents SDK before deciding whether a separate service is justified.

### 2. Gentle-AI
Source: https://github.com/Gentleman-Programming/gentle-ai  
README: https://github.com/Gentleman-Programming/gentle-ai/blob/main/README.md  
**Declared from its project overview:** coding-agent memory, a repeatable workflow, and evidence that supports reviewed commits rather than asking the user to trust an agent's self-report.  
**Potential Angel use:** task-session artifacts, changed-file summaries, test evidence, and project memory.  
**Decision:** inspect code, license, and the startup/extensions/skills pipeline before adoption. Focus on the idea of evidence-backed work, not the project's UI or implementation wholesale.

### 3. Google Agent Skills
Source: https://github.com/google/skills  
README: https://github.com/google/skills/blob/main/README.md  
**Declared:** reusable Agent Skills for Google products and technologies, including Google Cloud; supports installing selected skills into supported agent tools.  
**Potential Angel use:** a skill format for curated procedures, setup guides, API use and diagnostics.  
**Decision:** compare its skill format with Agent Skills/OpenAI/Claude-compatible formats; normalize into Angel's own registry instead of installing arbitrary skills automatically.

### 4. Google Workspace MCP
Source: https://github.com/taylorwilsdon/google_workspace_mcp  
README: https://github.com/taylorwilsdon/google_workspace_mcp/blob/main/README.md  
**Declared:** MCP/CLI access for Calendar, Drive, Gmail, Docs, Sheets, Slides, Forms, Tasks, Contacts and Chat, with multi-user support and granular editing.  
**Potential Angel use:** email/calendar/document integrations and a common tool boundary.  
**Risks / gates:** OAuth consent, least-privilege scopes, account separation, confirmation before send/delete/share actions, audit logs, retention rules and Google API quotas.  
**Decision:** high-value candidate after authentication, permission policy and action history are reliable.

### 5. React Native Google Sign-In
Source: https://github.com/react-native-google-signin/google-signin  
README: https://github.com/react-native-google-signin/google-signin/blob/master/README.md  
**Declared:** Google authentication for React Native/Expo on Android and iOS. Its README distinguishes the public mobile package from a separate premium universal solution for newer cross-platform targets.  
**Potential Angel use:** mobile OAuth configuration/testing concepts if Angel later gets a native React Native client.  
**Decision:** not a direct fix for Angel's current browser-based Supabase OAuth. First verify the current web callback/session flow.

### 6. Claude Code
Source: https://github.com/anthropics/claude-code  
README: https://github.com/anthropics/claude-code/blob/main/README.md  
**Declared:** terminal/IDE/GitHub coding agent that understands codebases, executes routine tasks, explains code and handles Git workflows.  
**Potential Angel use:** repo-context assembly, scoped file edits, diffs, test-run results, issue/PR workflow, resumable coding sessions.  
**Decision:** extract general workflow principles; do not clone proprietary service internals or assume that all Claude Code functionality is available as a reusable SDK.

### 7. Learn Claude Code
Source: https://github.com/shareAI-lab/learn-claude-code  
README: https://github.com/shareAI-lab/learn-claude-code/blob/main/README.md  
**Declared:** educational explanation of agent harness engineering, with a distinction between model capability and the software environment that lets an agent act.  
**Potential Angel use:** teaching material for understanding planning, tool use, action loops, observations and constraints.  
**Decision:** use as learning/reference material; validate concepts against source and tests before porting them.

### 8. Composio Awesome Claude Skills
Source: https://github.com/ComposioHQ/awesome-claude-skills  
README: https://github.com/ComposioHQ/awesome-claude-skills/blob/master/README.md  
**Declared:** large curated collection of skills/plugins; highlights an MCP gateway with many app integrations, authentication, access control and audit logging.  
**Potential Angel use:** skill discovery, integration catalog, secure third-party action tools.  
**Risks / gates:** not every listed skill is maintained or safe; app connections require user consent, scoped credentials and terms review. Avoid making a large integration count a launch dependency.  
**Decision:** use as a discovery source and evaluate individual skills; do not import the catalogue blindly.

### 9. Alireza Rezvani Claude Skills
Source: https://github.com/alirezarezvani/claude-skills  
README: https://github.com/alirezarezvani/claude-skills/blob/main/README.md  
**Declared:** broad reusable skills/plugins across coding, DevOps, security, marketing, research, productivity and specialist roles, with support claimed for multiple coding agents.  
**Potential Angel use:** curated skill packs and specialist-agent descriptions.  
**Decision:** deduplicate against Composio/Google skills and inspect individual scripts, permissions, license and data flow before enabling anything.

### 10. Claude Code Router
Source: https://github.com/musistudio/claude-code-router  
README: https://github.com/musistudio/claude-code-router/blob/main/README.md  
**Declared:** local model gateway/control plane offering provider/model routing, failover, retries, account/provider configuration, vision/web/MCP extensions, and request logs with latency, token/cost estimates.  
**Potential Angel use:** provider adapters, explicit routing policies, resilient fallback and usage telemetry.  
**Risks / gates:** credential pooling/key rotation must not be used to circumvent provider limits, billing, access rules or terms. Provider terms and each user's authorized credentials remain binding.  
**Decision:** high-value architecture reference. Build a smaller router native to Angel first, with approved provider interfaces and transparent budgets.

### 11. Claude Task Master
Source: https://github.com/eyaltoledano/claude-task-master  
README/docs: https://github.com/eyaltoledano/claude-task-master  
**Declared:** AI-assisted development task management with task structure, dependencies, tags/workstreams, research, loops, MCP tools, CLI commands and configurable providers.  
**Potential Angel use:** dependency graphs, break-down of broad goals into smaller tasks, project-scoped queues and reusable execution plans.  
**Decision:** map these concepts to Angel's existing task/Agent Lab system; avoid a second competing source of task truth.

### 12. Claude Code Action
Source: https://github.com/anthropics/claude-code-action  
README: https://github.com/anthropics/claude-code-action/blob/main/README.md  
**Declared:** GitHub Actions workflow integration for PR/issue Q&A, code review and code changes; supports multiple provider authentication methods, progress markers and structured outputs.  
**Potential Angel use:** a later, permissioned GitHub coding agent, status comments, CI result summaries and review-before-merge.  
**Risks / gates:** start with read-only diagnostics; isolate runner permissions; never commit provider secrets; require explicit authorization for pushes/merges/deployments.  
**Decision:** useful after task persistence, repository authorization and audit logging.

### 13. Open Claude Cowork
Source: https://github.com/composio-community/open-claude-cowork  
README: https://github.com/composio-community/open-claude-cowork/blob/master/README.md  
**Declared:** open-source desktop cowork interface and a messaging-based personal assistant variant, with external app integrations.  
**Potential Angel use:** desktop task workspace, multiple chats, cross-app work and mobile/messaging access patterns.  
**Decision:** inspect architecture and licensing before reusing. Treat desktop commands and messaging actions as privileged operations; do not import its full product shell.

### 14. MCP Use
Source: https://github.com/mcp-use/mcp-use  
README: https://github.com/mcp-use/mcp-use/blob/main/README.md  
**Declared:** TypeScript-oriented MCP app/server tooling, typed views, an inspector and agent-facing workflows.  
**Potential Angel use:** testing MCP tools, schema validation, tool discovery, and building a dedicated inspection interface.  
**Decision:** compare to the existing Angel tool registry and server contracts; adopt only if it reduces complexity and is compatible with the current stack.

### 15. Kuse Cowork
Source: https://github.com/kuse-ai/kuse_cowork  
README: https://github.com/kuse-ai/kuse_cowork/blob/main/README.md  
**Declared:** local-first, model-agnostic desktop cowork agent; BYOK/local-model options, Rust implementation, container-isolated command execution, custom skills, MCP, and document-oriented skills for DOCX/PDF/PPTX/XLSX.  
**Potential Angel use:** secure command runner design, local/private operation, file artifact workflows and a future native desktop client.  
**Decision:** later-platform reference. Container isolation and permission boundaries are the most relevant lessons; a browser-only app cannot safely reproduce full desktop privileges.

### 16. OpenAI Agents SDK for Python
Source: https://github.com/openai/openai-agents-python  
README: https://github.com/openai/openai-agents-python/blob/main/README.md  
**Declared:** multi-agent framework with agents, tools, guardrails, handoffs, sandbox agents, realtime/voice pipelines and compatibility with multiple model providers.  
**Potential Angel use:** clear agent/tool interfaces, handoff semantics, guardrails and voice pipeline architecture.  
**Decision:** compare it with Google ADK, not alongside it by default. Angel should preserve a single orchestration contract and use adapters only where they provide concrete value.

## Consolidated Angel design choices from Phase 1

| Concern | Recommended Angel direction | Avoid |
|---|---|---|
| Orchestration | Native, typed execution lifecycle; evaluate ADK vs Agents SDK for a dedicated engine only if needed | Two orchestration frameworks controlling the same tasks |
| Tasks | One durable task store with dependencies, statuses, checkpoints and run evidence | Parallel task systems whose states diverge |
| Skills | Versioned, reviewed skill registry with origin, license, tests, declared permissions and required scopes | Auto-running arbitrary skills found in a list |
| Model routing | One router with task categories, quota awareness, per-provider adapters, timeouts, fallback and telemetry | Scattered hard-coded model IDs or limit circumvention |
| Integrations | MCP / APIs behind scoped permission adapters, approval cards and audit logs | Broad unaudited credentials or hidden write actions |
| Coding agent | Branch/PR-based patches, diff review, test evidence, no deployment without explicit user approval | Direct unattended commits/deploys on production |
| Voice | One conversation context with separate dictation and live-interaction modes | Separate voice chat state with lost transcripts |
| Desktop/device | Web capabilities first; native host/companion service for privileged controls | Claiming browser JavaScript can control the full OS or run before login |

## What remains to be verified

These README findings are not a complete reverse engineering. For each candidate, inspect the source tree and license, follow 3–5 representative feature paths, examine the tests, check recent commits/releases, and record real limitations. No repository in this report should be marked runtime-verified yet.
