# Phase 3 Findings: coding-agent interfaces, desktop/mobile presence and advanced workflows

**Evidence level:** README/entry-point review, 2026-10-23. This is capability reconnaissance; source modules, tests, dependency health and runtime behavior still need separate inspection.

## 1. Claude Code Best V5 (CCB)
Source: https://github.com/claude-code-best/claude-code  
README: https://github.com/claude-code-best/claude-code/blob/main/README.md  
**Declared:** goal-driven multi-turn tasks with a token budget and completion/blocked audit, pause/resume/continue/clear commands and network-interruption recovery; scripted multi-agent orchestration supporting agent/pipeline/parallel/phase patterns; workflow monitoring and journal replay; multiple agent processes via IPC/LAN; and ACP support for IDEs and sessions.  
**Angel opportunity:** persistent goal mode, workflow graphs, cancellation, journal/audit, concurrency limits, and agent handoff.  
**Decision:** high relevance but do not import wholesale. Inspect license and code-level permission model, ensure stop/cancel works, bound loops/tokens/time, and never allow remote/LAN agent communication without explicit trust configuration.

## 2. Free Claude Code (FCC)
Source: https://github.com/Alishahryar1/free-claude-code  
README: https://github.com/Alishahryar1/free-claude-code/blob/main/README.md  
**Declared:** AGPL-3.0 project presenting one searchable model catalog across many provider APIs and multiple coding-agent clients, with fallback to another configured provider after retries fail. The README claims 61 providers/11 agent integrations; these numbers are project claims, not independently verified availability or quota guarantees.  
**Angel opportunity:** multi-provider routing and client adapter patterns, transparent quota-aware fallback, provider capability metadata.  
**Gates:** code reuse has AGPL obligations; inspect all provider terms and every adapter before adoption. “Free” has per-provider limits and may depend on local accounts/keys.  
**Decision:** compare architecture with CCR and OpenAI-Gemini, then implement a much smaller Angel-native router first. Do not rotate accounts or route requests to circumvent access limits, billing or provider terms.

## 3. CloudCLI UI / Claude Code UI
Source: https://github.com/siteboon/claudecodeui  
README: https://github.com/siteboon/claudecodeui/blob/main/README.md  
**Declared:** responsive desktop/tablet/mobile UI for Claude Code, Cursor CLI and Codex; chat, embedded shell terminal, file explorer with live editing, Git explorer with stage/commit/branch operations, browser sessions for research/testing, multiple session history and plugin extension.  
**Angel opportunity:** a unified engineering workspace, terminal/output panel, repository browser, branch/diff controls and mobile session access.  
**Gates:** shell and file tools are privileged. Any local/remote runner requires authenticated sessions, filesystem/command allowlists, environment-secret protection, isolated working directories and human approvals for commits/deploys.  
**Decision:** high-value UX/architecture reference. Do not expose an unrestricted shell through the public Angel website.

## 4. Claude Video / /watch
Source: https://github.com/bradautomates/claude-video  
README: https://github.com/bradautomates/claude-video/blob/main/README.md  
**Declared:** converts a video URL or local video file into timestamped frames and a transcript. Native captions are used first; optional local WhisperX or Groq/OpenAI transcription can handle videos without captions. It is designed as a skill for local coding agents and does not claim to work inside every hosted chat product.  
**Angel opportunity:** timestamped video summarization, scene/frame evidence, transcript search and actionable task creation based on a clip.  
**Gates:** only fetch permitted URLs and media; protect private video URLs/tokens; manage download size/time and transcription costs.  
**Decision:** adapt this pipeline concept for Media/Research stages.

## 5. Claude Relay Service
Source: https://github.com/Wei-Shaw/claude-relay-service  
README: https://github.com/Wei-Shaw/claude-relay-service/blob/main/README.md  
**Declared:** self-hosted API relay, multi-account management, per-user API keys and usage/cost/performance monitoring. The current README contains a critical security notice that versions v1.1.248 and earlier have an administrator-authentication bypass; it recommends v1.1.249+ or migration to its newer project.  
**Angel decision:** study its usage-control/audit patterns only. Do not adopt an account relay without exact provider permission, and do not use account rotation to bypass usage quotas. The historical authentication vulnerability makes security review mandatory before even testing it.

## 6. HAPI
Source: https://github.com/tiann/hapi  
README: https://github.com/tiann/hapi/blob/main/README.md  
**Declared:** remote control of official coding-agent sessions through iOS/Android apps, Web/PWA and Telegram Mini App. Features include handoff between local and remote without losing context, shared Codex sessions, use of the underlying agent rather than replacing it, and approving requests from a phone while away.  
**Angel opportunity:** phone-to-desktop task continuity, remote approvals, background-running task status and a future native companion.  
**Gates:** review session authentication, pairing, encryption, local command execution, connection expiry and revocation. Never expose a local control server to the public internet by default.  
**Decision:** high-priority reference for Stage 9 Background Angel after the task/session core is reliable.

## 7. OpenCodex
Source: https://github.com/lidge-jun/opencodex  
README: https://github.com/lidge-jun/opencodex/blob/main/README.md  
**Declared:** local provider proxy translating the OpenAI Responses API to other model-provider formats, including streaming, tool calls, reasoning tokens and images; the README describes routing across coding-agent front ends. It also describes ChatGPT account-pool/automatic selection features.  
**Angel opportunity:** API-format adapter concepts and per-provider capability normalization.  
**Decision:** inspect exact license, auth code, security and provider terms before use. Reuse authorized API keys only. Do not implement account-pool selection to evade quotas or subscription terms.

## 8. Happy
Source: https://github.com/slopus/happy  
README: https://github.com/slopus/happy/blob/main/README.md  
**Declared:** multi-provider agent harness for Claude, Codex and Grok; subagent delegation; mobile clients with end-to-end encrypted session transfer; and multiplayer/shared sessions. The repository identifies separate desktop and agent-runtime repositories in its current project layout.  
**Angel opportunity:** safe cross-device session sync, collaborative task sessions and provider-specialized agents.  
**Gates:** independently inspect encryption/session design, key management, relay behavior, permissions and multi-user isolation. Do not assume a README security claim proves an implementation is secure.  
**Decision:** study session architecture, but compare it with HAPI before adopting both; avoid duplicate control planes.

## 9. Kuse Cowork
Source: https://github.com/kuse-ai/kuse_cowork  
README: https://github.com/kuse-ai/kuse_cowork/blob/main/README.md  
**Declared:** local-first native desktop agent in Rust, BYOK/local-model flexibility, Docker-isolated command execution, custom skills and MCP, and document workflows for DOCX/PDF/PPTX/XLSX.  
**Angel opportunity:** local document operations and a native command sandbox.  
**Decision:** later native client reference. Container isolation is more relevant than copying the desktop UI.

## 10. Pake
Source: https://github.com/tw93/Pake  
README: https://github.com/tw93/Pake/blob/main/README.md  
**Declared:** package websites as small desktop applications using Rust/Tauri, with CLI/online build, configurable icons/windows, shortcuts, drag/drop and customization.  
**Angel opportunity:** a lightweight desktop shell for Angel or a future companion once the web/PWA baseline is reliable.  
**Gates:** review webview isolation, origin restrictions, permission bridging, auto-updates and platform distribution. Do not interpret an “ad removal” feature as permission to bypass site controls.  
**Decision:** defer until the web-first release and security boundaries are stable.

## 11. Apple Design Skill
Source: https://github.com/dickwu/apple-design-skill  
README: https://github.com/dickwu/apple-design-skill/blob/main/README.md  
**Declared:** a design-review skill grounded in Apple Human Interface Guidelines; covers layouts and multiple UI platforms (including React, Tauri, SwiftUI and native toolkits).  
**Angel opportunity:** accessibility, hierarchy, responsive behavior and platform-specific design checks.  
**Decision:** adapt general usability and accessibility principles, not Apple's complete visual style. Angel retains its own brand identity.

## 12. mcp-devices (formerly claude-in-mobile)
Source: https://github.com/AlexGladkov/claude-in-mobile  
README: https://github.com/AlexGladkov/claude-in-mobile/blob/main/README.md  
**Declared:** the project is now branded mcp-devices and offers a maintained multi-platform bundle plus separately installable platform packages.  
**Angel opportunity:** research device and mobile integrations through MCP.  
**Gates:** read platform-specific docs to understand exactly which devices/capabilities are exposed and what permissions are needed. A device integration does not imply unrestricted OS control.

## 13. Claude Desktop App (pretend1111)
Source: https://github.com/pretend1111/claude-desktop-app  
README: https://github.com/pretend1111/claude-desktop-app/blob/main/README.md  
**Declared:** unofficial desktop interface combining Claude Code's agent engine with a Claude.ai-like chat UI and arbitrary compatible API backends. It advertises broad model bridging and tool features.  
**Decision:** UI and multi-provider adapter concepts may be studied, but do not clone a proprietary interface pixel-for-pixel or use this project to bypass provider regional, account or access requirements. Security and licensing require close review.

## 14. Claude Desktop (Karenina-na)
Source: https://github.com/Karenina-na/Claude-Desktop  
README: https://github.com/Karenina-na/Claude-Desktop/blob/master/README.md  
**Declared:** older unofficial Electron wrapper originally for Claude 2.  
**Decision:** legacy reference only; not a candidate for Angel's modern desktop architecture.

## 15. Claude Usage Tracker
Source: https://github.com/hamed-elfayome/Claude-Usage-Tracker  
README: https://github.com/hamed-elfayome/Claude-Usage-Tracker/blob/main/README.md  
**Declared:** native macOS menu bar usage monitor for Claude/Codex; session/weekly usage tracking, status HUD, multi-profile management and terminal launchers.  
**Angel opportunity:** provider allowance display and local task/session status overlay.  
**Gates:** usage data must come from authorized interfaces; do not collect credentials unnecessarily or use multi-profile features to evade provider limits.  
**Decision:** concept reference for Angel's future budget/usage panel.

## 16. Claude ChatGPT MCP Tool
Source: https://github.com/syedazharmbnr1/claude-chatgpt-mcp  
README: https://github.com/syedazharmbnr1/claude-chatgpt-mcp/blob/main/README.md  
**Declared:** macOS MCP integration allowing Claude to ask the ChatGPT desktop app questions, inspect conversation history and continue existing ChatGPT conversations.  
**Angel opportunity:** inter-agent/model collaboration via an explicitly authorized connector.  
**Gates:** local-desktop coupling, session privacy, credential boundaries and app-specific automation must be reviewed. Prefer official APIs when available and permitted.  
**Decision:** do not use an unofficial local UI bridge as a core dependency.

## 17. Artifact Runner
Source: https://github.com/claudio-silva/claude-artifact-runner  
**Declared from repo identity and stack:** React/Vite/TypeScript artifact runner. Further feature path not yet traced.  
**Angel opportunity:** potentially previewing generated HTML/React artifacts.  
**Decision:** keep queued for detailed source inspection. Any generated code execution must run inside a restrictive sandbox, with network/file access denied by default.

## 18. Claude for Legal
Source: https://github.com/anthropics/claude-for-legal  
**Declared:** agents, skills and data connectors for common legal workflows and a dual install/deployment model using plugins or a managed-agent API.  
**Angel opportunity:** an example of domain-specific skill packs, data connectors and consistent prompts across execution environments.  
**Decision:** keep as a specialist-agent design reference. Do not present legal output as professional legal advice; verify sources and keep domain permissions/data handling explicit.

## 19. Claude Reviews Claude
Source: https://github.com/openedclaude/claude-reviews-claude  
**Declared:** series of reviews/explanations of Claude Code source, with an online reader, search, dark mode and navigation.  
**Angel opportunity:** learning material and an example of documenting reverse-engineering results.  
**Decision:** reference only; check license and source dates before relying on claims. It is not a runtime module.

## 20. Retired or questionable references

- **Thinking-Claude**: its README explicitly says the project is retired because modern models have built-in reasoning. Use only as history; do not add a forced “thinking prompt” layer to every ordinary message.
- **Claude Relay Service**: critically vulnerable versions are named in its README. Never deploy an affected release.
- **Angular Google Maps**: explicitly no longer maintained (Phase 2).
- **TheoKanning OpenAI Java**: archived since 2024 (Phase 2).
- **Claude account/proxy projects**: only inspect to understand API routing and usage tracking. Do not bypass authentication, geographic access restrictions, billing, quotas or terms.
- **Watermark removal**: only consider tools for user-owned/authorized images; do not build a watermark-evasion feature.

## Cross-cutting design choices for Angel

1. Use a **durable goal/task state machine** with budget limits, retries, stop/resume, and visible proof of completion.
2. Keep a single internal **provider adapter + model capability contract**, rather than a separate routing framework in every agent.
3. Treat background phone/web control as a **paired, authenticated companion** with expiry, revocation, scoped actions and audit history.
4. Use a sandbox for shell, file edits and generated-artifact execution; preview external writes and require approval where consequential.
5. Separate “video or website can be read” from “agent can act on that site”; observation does not grant action rights.
6. Keep cross-device sync and team sessions opt-in, encrypted where appropriate, and scoped to explicit participants.
