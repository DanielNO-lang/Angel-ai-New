# Reverse-Engineering Programme Status

**Date:** 2026-10-23  
**Working branch:** research/rea-reverse-engineering-catalog  
**Parent repository:** https://github.com/DanielNO-lang/Angel-ai-New  
**Deployment:** Not deployed. This research branch must remain separate from production until Danny explicitly authorizes a release.

## Current inventory
- Target repositories catalogued: 74.
- Source-inspected: 12 targets in the 74-repository catalogue (selected modules/functions mapped; no full-repository audit/runtime test).
- README-reviewed: 62 targets (reconnaissance only; implementation details may remain unknown).
- Queued without any review: 0.
- Local REA runtime executed in this session: No.
- Angel Reverse Engineering Workbench implemented in the app: No, specification only.
- Target repositories cloned, installed or executed: No. Inspection used GitHub metadata, file/tree access and official docs to reduce risk.

The status counts are maintained in targets.json. “Source-inspected” and “README-reviewed” have deliberately different meanings. Neither means production-safe or fully reverse engineered.

## Deliverables in this branch

1. README.md — scope, evidence labels, status model, safety/licensing rules and review sequence.
2. targets.json — 74 targets with categories, priorities, URLs, statuses, evidence links and source revisions where pinned.
3. REA-OPERATING-PLAYBOOK.md — process for both source repositories and browser/website URLs using REA where available.
4. REA-SOURCE-MAP.md — pinned REA source map, function inventory, website observation limits, safety boundaries and Angel adapter design.
5. ANGEL-WORKBENCH-SPEC.md — future Angel feature requirements, architecture, safety model and acceptance tests for URL/repository analysis.
6. phase-1-findings.md — agent frameworks, skills, model routing, task management and Workspace integrations.
7. phase-2-findings.md — Google APIs, identity, model/media, network, SDK and infrastructure references.
8. phase-3-findings.md — coding-agent UI, desktop/mobile presence, provider wrappers, risks and later capabilities.
9. deep-dives-p1.md — source-level function/module maps for the highest-priority operating-core, task, routing, MCP, GitHub automation, remote-session and REA engine references.

## Source-inspected targets
Selected modules/documents have been inspected for:
- Google ADK Python: agent lifecycle, Runner, session/event lifecycle and sequential/parallel/loop orchestration.
- OpenAI Agents SDK Python: run loop, tool contract, schema generation and input/output guardrails.
- Gentle-AI: planner graph, staged pipeline/rollback, skill registry and recovery trace.
- Google Workspace MCP: per-service OAuth scopes, permission levels, tool registration and Gmail functions.
- Claude Task Master: MCP task operations, tool registration, PRD parsing and next-task selection.
- Claude Code Router: model registry, route compilation, attempt plans, fallback and failure classification.
- MCP Use: client/server entrypoints, tool schema/security contracts, OAuth and host/origin middleware surfaces.
- Claude Code Action: GitHub action preparation/execution entrypoints, permissions/token boundaries, mode detection and turn summaries.
- HAPI: resumable sessions, lifecycle state, CLI process leases, accountable work graph and relay rate limiting.
- Happy: account pairing/auth, local credential handling, encryption helpers and session client.
- Open Claude Cowork: Electron main/preload separation, local HTTP endpoints and provider registry.
- Google Skills: catalogue index and representative skill-routing, repo-migration, Google sign-in, skill-registry and agent-build workflows.

REA itself has now had a source-level map added in deep-dives-p1.md. Its browser tool registration, browser scenario capture, source/trace/evidence tool surfaces, safe metadata filtering, origin scope, cancellation, timeout and cleanup patterns were inspected. **The REA runtime remains unexecuted.**

Official Claude Code itself was examined separately. The inspected public tree exposes docs, plugins, scripts, examples and configuration but not a complete readable source implementation of the whole hosted/runtime product. Its internal implementation is therefore marked not publicly exposed rather than inferred.

## Critical conclusions so far

- REA is best used as an evidence-collection engine for local artifacts and website/browser behavior. GitHub source inspection and REA browser observation serve different purposes.
- Website URLs are supported as analysis inputs, but browsing a visible page does not reveal its private server implementation.
- Angel needs a single task/run contract, one typed tool registry, one provider/model router, server-side permission checks, durable evidence and explicit approval for consequential actions.
- Do not install multiple overlapping agent frameworks wholesale. Compare them and implement selected ideas through Angel's own architecture.
- HAPI and Happy both offer useful remote-session ideas; Angel must choose one coherent device/session model after a security review rather than merge incompatible protocols.
- A skill is untrusted content until reviewed. It must not grant itself permissions.
- Some candidates require special caution: OSINT/Google account tools, scrapers/proxies, API relays/account pools, vulnerable security-training examples, unofficial desktop wrappers and watermark-removal tools.
- No changes in this branch have been deployed. No README-level finding is represented as a successful runtime test.

## Immediate next research queue
1. Perform the first controlled local REA setup with the required Node version and selected agent/MCP client; approve setup changes only after reviewing them.
2. Deep-read tests and permission/error paths for already source-inspected repositories.
3. Complete per-target license, maintenance, cost and dependency checks.
4. Produce a deduplicated capability matrix and map each accepted item to Angel's fixed engineering stages.
5. Only then create discrete implementation work items and tests in an isolated engineering branch. Keep this research branch as the evidence archive.
