# Capability audit 03: Claude ecosystem, desktop/mobile, workflows, and remaining SDKs

**Evidence level:** Public README/documentation review. Some entries are unofficial, archived, or third-party and make claims that require validation. No code has been copied into Angel. README fetch failures are explicitly marked unresolved.

## 47. ComposioHQ/awesome-claude-skills
**Capabilities:** Curated directory of Claude skills, integrations, and workflows.
**Structure:** Catalog linking to independently maintained skill packages.
**Angel recommendation:** Use for discovery only. Review each skill's code, license, permissions, maintenance, dependencies, and prompt-injection risk before enabling it.

## 48. Alishahryar1/free-claude-code
**Capabilities:** Third-party Claude-Code-like harness with provider configuration and optional integrations; README advertises modern Python tooling and tests.
**Architecture:** Standalone client/harness with model/provider configuration.
**Angel recommendation:** Study bring-your-own-key setup and provider abstraction. Do not assume a model is free just because the wrapper is open-source. The license is AGPL-3.0; assess obligations before reuse.

## 49. alirezarezvani/claude-skills
**Capabilities:** Large multi-agent skill/plugin library covering engineering, DevOps, security, compliance, marketing, executive roles, productivity, and research. README advertises compatibility with multiple coding agents.
**Architecture:** Modular skills and commands synced into compatible agent hosts.
**Angel recommendation:** High-value discovery source for a skill marketplace. Do not import hundreds of skills blindly. Start with a curated allowlist and review permissions, overlap, license, and maintenance.

## 50. siteboon/claudecodeui (CloudCLI UI)
**Capabilities:** Desktop/mobile UI for coding-agent CLIs, project/session views, and local or remote access.
**Architecture:** Control surface around existing CLI agents.
**Angel recommendation:** Study the remote workspace UX: project selector, session history, logs, approvals, and handoff. Remote access needs authentication, device pairing, network isolation, and command permissions.

## 51. musistudio/claude-code-router
**Capabilities:** Routes requests from coding-agent clients to chosen model providers, with provider switching, failover, extensions, and request observability.
**Architecture:** Local/provider proxy with routing rules and telemetry.
**Angel recommendation:** Strong design reference for Angel's model chooser: task-based routing, fallback, provider health, usage/cost estimates, and per-provider settings. Use official APIs and avoid subscription circumvention or undocumented endpoints.

## 52. bradautomates/claude-video
**Capabilities:** Video URL/local file becomes timestamped frames and transcript; native captions first, optional local or hosted transcription when captions are unavailable.
**Architecture:** Video ingestion → captions/transcription → sampled frames → timestamped evidence.
**Angel recommendation:** High priority for lessons, tutorials, meetings, and visual troubleshooting. Preserve timestamps and source citations, allow local/hosted choice, and report missing evidence clearly.

## 53. richards199999/Thinking-Claude
**Capabilities/status:** Retired prompt/extension experiment for older Claude web experiences; repository states that modern models already have built-in reasoning.
**Architecture:** Browser extension/instruction selector, not a model training system.
**Angel recommendation:** Do not try to expose private chain-of-thought. Give users a concise answer plus optional assumptions, evidence, rationale summary, and verification results.

## 54. openedclaude/claude-reviews-claude
**Capabilities:** Third-party long-form architecture commentary on Claude Code, describing subsystems, tool orchestration, and multi-agent coordination.
**Architecture:** Written analysis, diagrams, tables, and code walkthroughs, not an executable framework.
**Angel recommendation:** Use as a hypothesis generator; verify claims against current official docs and accessible code. It is not an official Anthropic specification and may be version-specific.

## 55. Wei-Shaw/claude-relay-service
**Capabilities:** Self-hosted API-style relay with multi-account management, Redis, Docker, and admin interface.
**Architecture:** API relay, account/config management, persistence/cache, and deployment containers.
**Angel recommendation:** Learn generic rate limiting, usage accounting, failover, and admin security only. README warns of a prior admin-auth bypass and possible terms-of-service risks. Do not use it to pool subscriptions or bypass access restrictions; treat as high risk.

## 56. Doriandarko/claude-engineer
**Status:** README fetch returned 404 in this pass. Name alone is insufficient to claim features.
**Angel recommendation:** No adoption decision until URL/default branch and source are confirmed.

## 57. BehiSecc/awesome-claude-skills
**Capabilities:** Curated index of skill packages spanning documents, development, data/analysis, and other task categories.
**Architecture:** External resource list.
**Angel recommendation:** Discovery only; score each skill on utility, license, maintenance, permissions, data access, and prompt-injection risk.

## 58. composio-community/open-claude-cowork
**Capabilities:** Open-source desktop coworking/chat application powered by an agent SDK and tool router, intended to automate work across connected apps.
**Architecture:** Desktop chat UI + agent SDK + integration/tool routing.
**Angel recommendation:** Strong pattern for an Angel workbench with app tools, multi-step tasks, progress, and permission management. Hosted integration layers may have separate costs.

## 59. tiann/hapi
**Capabilities:** Local-first remote control of existing coding-agent sessions across native iOS/Android, web/PWA, and Telegram Mini App; README describes handoff, mobile approvals, terminal access, voice control, scoped workspace browsing, and multiple agent harnesses.
**Architecture:** Runner wraps local agents and exposes remote control clients.
**Angel recommendation:** Useful for cross-device handoff and approval notifications. Require paired-device trust, short-lived tokens, scoped workspaces, command approval, audit logs, and emergency disconnect. Never expose raw terminals publicly.

## 60. lidge-jun/opencodex
**Capabilities:** Universal provider proxy for coding-agent clients, allowing selected LLM APIs to be used behind a common endpoint.
**Architecture:** Local API proxy/provider compatibility layer.
**Angel recommendation:** Provider abstraction is useful; a separate proxy is not automatically needed. Avoid protocol impersonation or undocumented endpoints that violate service terms.

## 61. pretend1111/claude-desktop-app
**Capabilities:** Unofficial desktop chat interface around a coding-agent engine; README describes file/command tools, projects, context, search, artifacts, and configurable APIs.
**Architecture:** Desktop frontend + coding-agent engine + provider adapters.
**Angel recommendation:** Study the separation between everyday chat and a permissioned coding workspace. Build Angel's own design rather than copying exact branding/UI. Do not adopt access workarounds described by the project.

## 62. hamed-elfayome/Claude-Usage-Tracker
**Capabilities:** Native macOS menu-bar app for monitoring Claude usage limits, with localized UI.
**Architecture:** Desktop status/tracking interface.
**Angel recommendation:** Build a provider-agnostic usage dashboard with official quota data where available, request counts, estimated token/cost usage, reset windows, and budget alerts. Label estimates accurately; do not scrape private endpoints.

## 63. claudio-silva/claude-artifact-runner
**Capabilities:** Zero-config tool/template to run, build, or create deployable React apps from Claude artifacts, with optional Docker.
**Architecture:** React/Vite/TypeScript project scaffolding and artifact execution/build commands.
**Angel recommendation:** Useful for a code/artifact sandbox: preview generated UI, run tests, export a project, and package reproducibly. Never execute untrusted generated code with unrestricted host files or secrets.

## 64. syedazharmbnr1/claude-chatgpt-mcp
**Capabilities:** MCP tool for macOS that lets Claude ask ChatGPT, view conversation history, and continue existing conversations.
**Architecture:** MCP server interfacing with local desktop app state/accessibility and user-granted permissions.
**Angel recommendation:** Multi-assistant handoff is useful, but use official APIs or user-exported data. Avoid scraping private desktop sessions or requesting broad accessibility access without clear need.

## 65. mcp-use/mcp-use
**Capabilities:** TypeScript framework for building/testing MCP servers and connectors; README highlights typed interfaces, native views/MCP Apps, inspector, and agent integrations.
**Architecture:** MCP client/server framework plus inspection/testing tools.
**Angel recommendation:** Strong candidate for Angel's MCP boundary. Require typed schemas, explicit permission level, timeouts, cancellation, audit logs, and automated tests for every tool.

## 66. slopus/happy
**Capabilities:** Free/open-source cross-device app orchestrating multiple coding-agent harnesses and models, with desktop/mobile clients and remote workflows.
**Architecture:** Multi-agent UI, session infrastructure, and model/agent connectors.
**Angel recommendation:** Study cross-device continuity and multi-harness UX. Preserve Angel's own personality and make agent/provider choice visible. Review hosting and remote-control security before adoption.

## 67. tw93/Pake
**Capabilities:** Wraps websites into lightweight desktop applications for macOS, Windows, and Linux.
**Architecture:** Native desktop shell around a web view with packaging/release tooling.
**Angel recommendation:** Potential desktop packaging path if PWA limits become blocking. It does not itself grant OS automation, background wake-word access, or device permissions. Audit signing, updates, and permissions first.

## 68. guillaumemeyer/watermarks-remover
**Capabilities:** Skill plus Python service for normalizing certain invisible Unicode markers, text watermark patterns, and file metadata/provenance marks for user-owned content.
**Architecture:** Skill client calling a service, with deterministic text/file processing and optional rewriting.
**Angel recommendation:** Do not make watermark removal a default feature. Safer adjacent feature: metadata inspection, Unicode hygiene, and privacy cleanup for user-owned files. Preserve provenance where required and avoid facilitating misrepresentation.

## 69. kuse-ai/kuse_cowork
**Capabilities:** Model-agnostic open-source desktop cowork agent, BYOK/local models, Rust implementation, cross-platform desktop apps, Docker-isolated command execution, and workflows turning documents, PDFs, videos, and images into formatted docs, infographics, mind maps, and flashcards.
**Architecture:** Native desktop agent + model adapters + isolated execution + document-processing pipeline.
**Angel recommendation:** Strong inspiration for local-first privacy and document-to-learning. Start with safe document ingestion/export in Angel web; container isolation requires a native/desktop runtime and cannot be assumed on Netlify.

## 70. dickwu/apple-design-skill
**Capabilities:** Design-review skill based on Apple Human Interface Guidelines; audits mobile/desktop UI and translates platform conventions across React Native, Flutter, Tauri, Electron, SwiftUI, UIKit, and AppKit.
**Architecture:** Skill instructions and reference material.
**Angel recommendation:** Use the pattern for an Angel UI quality gate: responsive layouts, accessibility, focus, reduced motion, touch targets, keyboard navigation, and platform conventions. Apple-specific guidance is not universal law.

## 71. Karenina-na/Claude-Desktop
**Capabilities:** Unofficial Electron desktop wrapper, explicitly described as a learning project.
**Architecture:** Electron shell and frontend.
**Angel recommendation:** Low adoption value beyond basic packaging reference. Do not assume production security or reuse branding.

## 72. AlexGladkov/claude-in-mobile (now mcp-devices)
**Capabilities:** MCP server/plugins for connected-device operations; README describes screenshots, platform-specific plugins, modular installation, and a diagnostic command.
**Architecture:** Base MCP server plus optional platform plugins.
**Angel recommendation:** Potential model for an opt-in device connector registry. Show the exact device/action/permission/effect; start with safe read-only status and screenshots. A web page cannot control a phone without a local bridge and OS permission.

## OpenAI SDK repositories

The OpenAI-specific SDK and cookbook entries (openai-cookbook, openai-python, MacPaw/OpenAI, openai-agents-python, PublicAffairs/openai-gemini, sashabaranov/go-openai, TheoKanning/openai-java, and the unresolved betalgo/openai and ConnectAI-E/feishu-openai entries) are documented in audits 01 and 02 where applicable. This avoids repeating the same capability notes in this report.

## Consolidated recommendation: what Angel should adopt first

### P0: Reliable core
- One provider interface with model selection, timeouts, cancellation, retries, structured outputs, and provider health.
- One agent/workflow runtime with typed tools, state, guardrails, trace/evidence records, and evaluations.
- A task planner with dependencies, acceptance criteria, status, and verified completion evidence.
- Security boundary: explicit permissions, least privilege, approval before irreversible actions, audit log, revocation, and emergency stop.

### P1: High-value user capabilities
- Curated skill library with metadata, versioning, and tests.
- Google Workspace connector, starting read-only and expanding to writes behind confirmation.
- GitHub repository analysis, CI diagnosis, draft patches, and reviewable PR workflows.
- Document and video understanding with timestamps/citations, exports, and user-controlled processing.
- Translation and image-generation adapters, chosen by task and budget.

### P2: Cross-device and advanced workflows
- Paired-device handoff and remote approvals, inspired by HAPI/Happy, with scoped permissions.
- Local desktop companion only if web/PWA limitations prevent requested OS integrations.
- Isolated code/artifact execution and local-model support, only after the native runtime and security model exist.

### Defer or reject
- Kubernetes GPU fleet management until Angel actually operates GPU infrastructure.
- Old/unmaintained UI wrappers and SDKs.
- Bulk scraping, session-cookie harvesting, subscription pooling, access-control bypass, unrestricted proxies, and unsafe removal of provenance.
- Importing entire skill catalogs or adding multiple orchestration frameworks without a measured need.

**Decision rule:** Do not adopt a repository because it has many features. Adopt a specific capability only when it maps to a real Angel requirement, is legal/licensed, can run in the intended architecture and budget, has a permission model, and passes a reproducible test.
