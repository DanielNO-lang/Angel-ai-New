# Angel implementation tracker

Branch: `feat/angel-persona-voice-foundation-2026-10-18`

This tracker separates implemented code from verified behavior. A commit alone is not a passing test.

## Active slice: persona and voice preferences

- [x] Define female and male presentation types and distinct asset-path contracts.
- [x] Define the 12 agreed expression keys and descriptions.
- [x] Add a homepage character selector and expression picker with transition animation.
- [x] Persist character presentation locally with guarded storage access.
- [x] Add voice-isolation preference choices: focused speaker, push-to-talk, wake phrase and off.
- [x] Persist the selected voice preference and wake phrase locally.
- [x] Add a user-triggered microphone permission check that stops its temporary audio tracks.
- [x] Add tests for expression catalogue structure and standalone end-conversation command matching.
- [x] Include persona tests in the package test command.
- [ ] Add the approved 24 character-expression assets and hero portraits to the expected public asset paths.
- [ ] Verify the homepage character experience visually on desktop and mobile.
- [ ] Run type-check, build and full test suite; fix every failure attributable to this branch.
- [ ] Implement a real audio processing pipeline for noise suppression / primary-speaker focus where the chosen provider or browser supports it.
- [ ] Integrate voice preferences into the actual live-voice runtime instead of treating them as display-only settings.
- [ ] Add tests for microphone permissions, stop behavior and preference persistence.

## Broader roadmap, to audit against existing source before reimplementation

Status vocabulary:
- **Needs audit**: inspect the current branch to determine whether existing code already satisfies it.
- **Not verified**: no end-to-end evidence currently available.
- **Blocked by external setup**: requires credentials, provider capability, or user approval.

### Conversation and model routing
- [ ] Chat history, search, pinned conversations, projects and export/delete flows.
- [ ] Streaming responses, tool activity, citations and useful error/recovery states.
- [ ] Real model/effort routing with honest provider/capability labels.
- [ ] Text, image and document attachment workflows.
- [ ] Temporary/incognito conversations with correct retention behavior.

### Voice, visual and reading
- [ ] Live conversation embedded in normal chat with two-way transcript and activity state.
- [ ] Dictation inserts editable transcript into the composer.
- [ ] Wake phrase only activates when a real supported wake-word engine is configured.
- [ ] Standalone end-conversation intent integrated into live session control.
- [ ] Camera and screen capture with explicit permission, active indicator and stop control.
- [ ] Reading of PDFs, images, documents and follow-up questions grounded in extracted content.
- [ ] Actual multimodal voice/vision integration, with unsupported features clearly disclosed.

### Memory, health and sensitive information
- [ ] Durable user-scoped memory with search, correction, export and deletion.
- [ ] Local/offline persistence and cloud sync with conflict handling.
- [ ] Health-literacy workflows with safe urgency guidance and no fabricated medical authority.
- [ ] Encrypted sensitive-data vault; no secrets in chat logs or client-side source.
- [ ] Retention and privacy controls, including sensitive voice/call data.

### Tasks and integrations
- [ ] Durable task/run/step/approval/audit records.
- [ ] Orchestration and specialist-agent execution with scoped permissions.
- [ ] Pause/resume/cancel, retries, timeouts, resource limits and verified completion reports.
- [ ] Scheduled and event-driven background tasks within platform constraints.
- [ ] Connector registry, OAuth/scopes, revocation and real result verification.
- [ ] Human confirmation for high-impact actions.
- [ ] Career, Creative, Exploration, Experiments, Focus and call workflows.
- [ ] Research with current, cited sources and clear fact-status distinctions.

### Platform, interface and operations
- [ ] Cross-device account, history, preferences and authorized-device management.
- [ ] Offline mode, PWA installation, sync status and platform-limited background behavior.
- [ ] Responsive navigation, accessible controls, reduced motion and mobile keyboard/safe-area handling.
- [ ] Server-side authorization, database RLS review, secret handling and audit logs.
- [ ] Build/type-check/tests and browser-level verification.
- [ ] Maintain the feature-branch-only workflow; never merge or push to main without explicit permission.

## Guardrails
- All work stays on this feature branch.
- Do not merge into `main`.
- Do not intentionally deploy.
- Never mark a feature complete without source inspection and appropriate verification.
- Do not replace existing functionality until the current implementation has been audited.
