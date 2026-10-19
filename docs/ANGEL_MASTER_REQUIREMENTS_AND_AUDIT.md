# Angel AI Master Requirements, Decision Ledger, and Audit Register

**Canonical working repository:** `DanielNO-lang/Angel-ai-New`  
**Working branch:** `feat/angel-persona-voice-foundation-2026-10-18`  
**Status date:** 19 October 2026  
**Purpose:** Consolidate the known Angel product requirements and explicit decisions into one version-controlled contract, then audit implementation against it.

> **Evidence boundary:** This document consolidates the saved Angel Master Project Bible and research archive, the available project notes, current repository inspection, and decisions preserved in the current project context. The full message-by-message contents of all three conversations titled “Jarvis Progress Report”, “Branch Jarvis Progress Report”, and “Branch Branch Jarvis Progress Report” have not been independently retrieved in this session. Therefore this is the best available consolidated contract, not a claim that every sentence in those chats has been individually indexed. Add any missing exact decisions from those chats before calling the archive exhaustive.

## 1. Non-negotiable engineering and release rules

1. All current work stays on `feat/angel-persona-voice-foundation-2026-10-18`.
2. Do not merge into `main`, push work to `main`, or deploy to Netlify unless the user explicitly authorizes it later.
3. Do not describe a feature as implemented because a menu, preference, registry entry, mock, or API stub exists. Distinguish **implemented in source**, **configured**, **tested**, **verified end-to-end**, **simulated**, **blocked**, and **missing**.
4. Inspect existing code before replacing it. Reuse functioning services and avoid duplicate implementations.
5. Never fabricate successful external actions, model capabilities, tool results, citations, device permissions, or connection status.
6. Keep provider keys, Supabase service-role keys, OAuth secrets, webhook secrets, and other privileged credentials on the server. Never paste real secrets into source, prompts, chat logs, browser storage, or committed files.
7. Require explicit, appropriately scoped permission for camera, screen, microphone, files, connected accounts, location, and consequential actions. Confirm before external communication, purchases, financial actions, account changes, destructive changes, or sending/deleting data.
8. Preserve a clear audit trail for task execution, approvals, tool calls, failures, and verified results.
9. Treat offline/background behavior as platform-dependent. Do not promise an OS-level capability a browser or installed PWA cannot provide.
10. Verify build, type-check, tests, security and integration behavior before any future release.

## 2. Product definition and identity

Angel is intended to be a cross-device, multimodal, multilingual, voice-enabled, vision-capable, memory-enabled, proactive AI agent with a distinct personality, configurable intelligence levels, permission-based access to apps/services, online/offline support, and an eventual interactive 3D presence. She must move beyond answering questions into planning and carrying out work transparently, safely, and verifiably.

### Personality contract
- Warm, intelligent, confident, witty, direct, subtly sassy, respectful, and capable of independent judgment.
- Loyal to the user's goals without blindly agreeing. Challenge flawed assumptions and explain trade-offs.
- No generic canned assistant openings, fake humility, false certainty, manipulative attachment, or claims of being human.
- Use the user's preferred name naturally only where appropriate; never force it into every answer.
- Keep the product's personality consistent across text, speech, visual reactions, and specialist modes.
- State uncertainty and capability limits honestly.

### Visual identity and character direction
- Female character “Angel”: East Asian-inspired appearance; Option A face direction; slim V-shaped face; soft almond-shaped eyes; layered black/dark hair; premium 3D animation/CGI rendering; smart-casual clothing; confident, warm, intelligent, subtly sassy expression.
- Keep identity consistent across all portraits and expressions: face, age impression, hair, outfit family, accessories, lighting, and rendering style must match.
- Matching male counterpart “Alex” is part of the concept direction. Do not confuse Alex with Angel or substitute one character for the other.
- Expression set currently defined in code: Happy, Sassy, Curious, Thinking, Surprised, Concerned, Amused, Reassuring, Skeptical, Celebrating, Frustrated, Serious. The saved visual references also include a concept sheet with a 12-expression female set and a matching 12-expression male set.
- Target asset deliverable: one consistent hero portrait per character plus 12 expression assets per character (24 expression assets total), using transparent/clean backgrounds and reliable asset naming. Expressions should be separate assets, not a single flattened poster used as a live avatar.
- Current visual direction in the latest saved project Bible is deep black/near-black, warm metallic gold, champagne, soft white, restrained gradients, and elegant illumination. Older purple/blue/neon and wing concepts are historical visual references, not automatically the final design system.
- Do not generate or commit replacement final character art until it is reviewed/approved. Where code cannot deliver the required visual quality, provide a polished prompt for Google AI Studio/image workflow and label the assets as pending until supplied and integrated.

## 3. Navigation and interaction decisions

### Core surfaces
- Home: calm executive workspace, clean greeting, main composer, three minimal rotating suggestion chips, recent activity and task state. Avoid clutter and separate shortcut buttons that compete with the composer.
- Chat: the central command surface for normal conversation, files, images, reading, search, tools, model/intelligence selection, dictation, Voice, Live, Visual, and agent tasks.
- Agent Lab: task/run queue, orchestration, approval queue, assistants, skills, marketplace, tool/provider status, run detail, and audit history.
- Projects/Workspace: conversations, files, instructions, context, resources, tasks, outputs, project-specific memory, and authorized tools.
- Schedule: tasks, reminders, recurring work, calendar-aware planning, and opt-in briefings.
- Library: persistent files and knowledge organization for signed-in users.
- Media Studio: image/video generation and related creative workflows where providers are configured.
- Assistants: reusable specialist assistants, creation/editing and marketplace features when supported.
- More: secondary utilities such as Memory, Connections, Skills, Plugins, Data/Charts, Secrets/Vault, Recycle Bin, and similar features. Do not remove the More entry or hide intended features without explicit agreement.
- Settings: account, notifications, personalization/memory, workspace, apps/connectors, voice, voice recognition, data controls, storage, safety/security, permissions, billing/usage where available, and shortcuts.
- Responsive sidebar supports expanded, collapsed, and hover-preview behavior where appropriate. Recent conversations must be backed by real saved data, not static placeholders.
- Guest users can chat without a login wall. Sign-in unlocks durable persistence, account-backed memory, and cross-device sync.
- Authentication includes email/password and Google sign-in; the Google flow must return the user to their account/workspace, persist sessions correctly, and handle errors. Guest access must not bounce back to sign-in unexpectedly.
- Dark/light/system themes must apply consistently across the whole app. Maintain mobile keyboard, safe-area, accessibility, and reduced-motion support.
- Do not create a separate top-level Voice Mode or Angel Live page. Live is a state within normal chat.
- “Visual Mode” is the umbrella for camera and screen sharing. Video generation is a capability in Media Studio/tooling, not a top-level “Video Mode” page.
- The microphone button defaults to speech-to-text dictation, placing editable text into the composer. Live conversation is a separate explicit action within normal chat.
- Reading is a first-class capability, not a buried or omitted afterthought.
- Long-running tasks remain visible in a task card/panel so the user can continue chatting.

## 4. Voice, speech, and Live

### Desired user experience
- Voice settings live in Settings. Voice selection is distinct from personality and must not silently change Angel's identity.
- The saved product Bible identifies “UNIQUE” as the default voice identity and mentions Aura, Velvet, Nova, Ember, and Sol as conceptual options. The current code's `Kore` default and provider voice IDs must be reconciled explicitly rather than silently replacing either decision. Voice names shown to users must map to actual supported provider voices.
- Automatically play a sample when a voice is selected where the provider and browser permit it; provide clear loading/error states.
- Support multilingual speech and accent-aware delivery only to the extent actually supported by the configured provider.
- Text-to-speech should begin streaming early where the provider supports streaming; avoid waiting for the entire response when a true streaming interface is available.
- Dictation must insert the final transcript into the editable composer. Interim text must be distinguishable and must not be duplicated.
- Live is an in-chat two-way audio conversation with a live transcript, activity/audio visualization, interruption/barge-in, mute/pause/resume, and a clear end button. Save the transcript to the conversation where the user is signed in and configured to save it; provide privacy controls.
- Ending commands include “Angel, end conversation” and “Angel, stop listening.” An ending phrase must be a standalone intent, not a keyword inside an unrelated longer sentence. After the command, finish the current sentence when appropriate, then stop listening and release capture resources.
- Wake phrase “Angel” is a desired capability, but a setting alone is not a wake-word engine. Activate it only when a real supported engine, permissions, device behavior, and privacy controls are implemented. Always-on/background activation is platform-limited and must be disclosed.
- Voice-isolation settings may include focused speaker, push-to-talk, wake phrase, and off. These preferences must control the actual runtime, not merely persist in local storage.
- Noise suppression/primary-speaker focus requires a real supported audio-processing pipeline. Do not label a preference as active processing if it is not connected.
- Microphone permission checks must be user initiated, handle denied/unsupported/unavailable cases, and stop all temporary audio tracks.
- Keep voice identity/timbre stable when emotional delivery changes. Character expression does not imply a change in voice identity.
- Voice and audio data require clear consent, retention controls, and no surprise background capture.

### Google AI Studio integration boundary
- Google AI Studio is the user's implementation and Google AI integration environment. It should inspect the current repository and make targeted changes, not generate a parallel replacement app.
- Use supported Google Gemini Live/audio APIs documented for the actual project version. Do not invent endpoint URLs, model IDs, SDK methods, environment variables, or capabilities.
- The current repository already has client voice services for server-routed transcription and TTS and a multimodal registry that marks the bidirectional Live stream as pending configuration. The exact route and SDK behavior must be verified from source and current provider documentation.
- Any long-lived API key or privileged credential must remain server-side. Never ship a Google API secret in frontend JavaScript. If a client-side ephemeral-token pattern is supported and needed, create the token server-side with a short expiry and narrow permissions.
- Integrate with the current server routes and provider abstraction. Add a server-side health/configuration status that reveals whether required variables are present without exposing values.
- Provide step-by-step connection/configuration instructions for the user to complete in Google AI Studio and the relevant hosting environment. Do not claim the account or secrets are connected until a real test confirms it.

## 5. Visual Mode, camera, screen, and Reading
- Camera and screen capture require explicit browser/device permission, clear “active” indicators, a persistent stop control, cleanup when stopped/unmounted, and honest unsupported-platform states.
- Angel sees only media that the user explicitly shares. Never silently start camera or screen capture.
- Support screenshot/frame inspection, UI/code/error analysis, document reading, OCR, diagram interpretation, and follow-up questions grounded in the actual provided content.
- Reading supports PDFs, documents, spreadsheets, images, screenshots, code, web pages and other explicitly supported file types. Summarize, compare, extract tables/data, answer questions, identify contradictions, and preserve source attribution.
- Read-aloud is optional and separate from live conversation. Expose supported formats and failure states.
- Do not label a multimodal registry entry “active” merely because a browser API exists if the end-to-end model/provider route is not actually configured.
- Continuous screen indexing, background OCR, spatial audio, or similar high-cost/continuous functions must be opt-in, visible, resource-limited, and independently auditable.

## 6. Chat, model routing, and intelligence levels
- Support guest and authenticated chat, persisted conversation history, search, rename, pin, archive where implemented, delete, export, project association, attachments, and temporary chats with clear retention rules.
- Streaming responses, clear loading/retry/error states, citations where research is used, tool activity, and useful recovery paths.
- Intelligence levels: Quick, Standard, Detailed, Deep, Pro, Auto. They must materially change routing/depth/cost behavior, not just labels.
- Model-agnostic provider architecture, with Gemini primary where configured and other providers (OpenAI, Anthropic, xAI, Groq, DeepSeek, Mistral, Cloudflare AI, local or specialist models) only when actual support and credentials exist.
- Model routing should account for task, modality, complexity, latency, cost, availability, and user-selected effort.
- Provider fallback must be explicit, tested, and report the actual model/provider used where appropriate.
- Multi-model critique/consensus is a future capability unless verified in the current implementation.
- Temporary/incognito chat must follow its stated persistence rules. Export and deletion must affect the real underlying data, not just the visible UI.

## 7. Memory, history, projects, and offline sync
- Structured user-scoped memory: preferences, personalization, goals, ongoing projects, important facts, and intentionally saved context. Do not automatically turn every utterance into permanent memory.
- Users can view, search, edit/correct, export, disable, and delete memory. Sensitive memory should be treated separately and only stored with clear user intent.
- Authenticated conversations, messages, projects, library items, preferences, tasks, and memory must be user scoped through server authorization and Supabase RLS.
- Offline/local storage should be resilient and explicit. Sync between IndexedDB/local data and Supabase needs conflict handling, sync status, retries, and a clear explanation of what remains local.
- Cross-device continuity includes conversations, settings, projects, memory, tasks, and authorized connections.
- Guest chat is temporary by default and must not accidentally leak into another account.
- Deletion and account deletion should include documented handling of related data, exports, retention windows, and provider-side data where applicable.
- Do not store API keys, service-role credentials, or long-lived OAuth tokens in localStorage/IndexedDB.

## 8. Agent Lab, tasks, automation, and specialist workflows
- Transparent agent loop: understand goal -> assess complexity -> select tools -> check permissions -> plan -> execute -> observe -> recover -> verify -> report -> save appropriate context.
- Durable task/run/step/approval/audit records, progress states, timestamps, result/error fields, and user ownership.
- Pause, resume, cancel, retry with bounds, timeouts, idempotency where possible, resource/cost limits, and safe recovery.
- Long-running jobs must not depend on a browser tab staying open when they are advertised as durable background jobs. Where infrastructure does not support it, state the limitation.
- Approval queue and permission policy: always ask, ask before changes, or ask only before important changes, with sensible safe defaults and per-connector scope.
- Task-based permissions should be least-privilege, time-limited where possible, revocable, and auditable.
- Scheduled/event-triggered workflows, reminders, daily briefings, and proactive suggestions must be opt-in, manageable, and respect inactivity/resource limits.
- Specialist modes: Career, Creative, Exploration, Experiments, Focus, and Call. Specialist hats include researcher, engineer, UX designer, analyst, writer, teacher, strategist, project/build/creative director, career coach, opportunity scout, automation engineer, negotiator, home/trades helper, health-literacy helper, and legal/finance researcher.
- Workflows/skills need explicit trigger/condition/action contracts, validation, versioning, permission declarations, logs, pause/cancel, and failure reporting.
- Learn-by-demonstration / teach-by-demo may turn a user-approved demonstration into a reusable skill, with review before applying.
- Self-improvement/code changes must be isolated on a branch, tested, reviewed, and reversible. Never silently edit production or grant itself new permissions.

## 9. Connectors and external actions
- Connector architecture for GitHub, Google services, Canva, CapCut, browser, cloud storage, calendar, email, communication apps, education tools, web research, and future providers.
- Each connector needs real OAuth/API authorization, minimal scopes, visible connected status, tested actions, revocation/disconnect, expiry handling, and audit history.
- Do not mark a connector connected because a token-shaped string exists or a settings card is visible.
- Confirm consequential actions such as sending emails/messages, modifying repositories, changing account settings, deleting data, publishing, or purchases.
- After execution, verify the external system's response/state before reporting success.
- Research must cite current sources and distinguish source facts, model inference, and unresolved claims.
- GitHub access should be scoped to the requested repository and actions; review code changes and show diff/status before risky writes.
- Google integration must not imply access to Gmail/Calendar/Drive until the correct OAuth consent and scopes are completed.

## 10. Security, privacy, and sensitive workflows
- Enforce server-side authorization for every private resource. Never trust a client-supplied user ID as authority.
- Supabase RLS on every user-owned table, with policies tested for cross-user access and nested ownership (for example, a message must belong to a conversation owned by the same user).
- Privileged keys remain server-side. Validate inputs, limit payload sizes, rate-limit expensive endpoints, and prevent abuse/cost runaway.
- Audit logs must avoid recording secrets or unnecessary sensitive content.
- Vault: protected documents/credentials/media, encryption at rest/in transit, scoped and revocable access, authentication, audit, retention/export/deletion, and no security bypass when offline.
- Health literacy: explain reports and terms, prepare clinician questions, give cautious urgency guidance, do not diagnose or claim clinician status.
- Legal/financial research must disclose uncertainty and encourage qualified professional help for consequential decisions.
- Security review should include leaked-password protection, OAuth redirects, session persistence, access controls, abuse/rate limits, CORS/CSRF where relevant, dependency/build supply chain, data retention, and secrets.
- Do not remove indexes or relax security policies simply to silence warnings. Review each warning against real query patterns.

## 11. Cross-device, PWA, and operational reliability
- Responsive phone, tablet, laptop, desktop, and supported browsers. Do not frame the product as Android-only.
- PWA installability, offline fallback, sync status, graceful reconnection, and platform-specific limits for background audio, wake word, notifications, and OS integrations.
- Connected-device management should show authorized sessions/devices where supported and permit revocation.
- Blank-page regression suite: build configuration, entrypoint/routing, environment variables, runtime errors, asset paths, and hosting rewrites.
- Hosting/deployment owner must follow the latest explicit user decision. Current operational instruction for this work: do not deploy to Netlify yet. Verify local/CI and backend behavior first; use deployment later only when authorized.
- Supabase is backend/auth/database/edge-function infrastructure; it does not automatically replace frontend hosting or make client code live.
- Track cost, rate limits, usage, timeouts, and degraded provider states.

## 12. Product capabilities and future workspaces
- Home, Chat, Agent Lab, Projects, Schedule, Library, Media Studio, Assistants, More, Settings, Account.
- Canvas/build workspace, data analysis/charts, visual inspection, document Reading, skills, plugins, marketplace, memory, connections, and secure vault as available and accurately labeled.
- Image/video generation and editing where the configured provider supports them. Do not display generated media capability as active without a working integration.
- Voice mini-panel/floating background conversation is a desired experience only where platform rules and lifecycle behavior support it; no fake always-on guarantee.
- Three minimal suggestion chips should rotate on guest and authenticated home screens. Avoid separate image/video/chat shortcut clutter on home if the agreed design uses the composer and suggestions.

## 13. Visual concept work that may need Google AI Studio or a dedicated asset workflow
Create a consistent production-ready set:
1. Angel female hero portrait (premium 3D animation, Option A face, East Asian-inspired, layered black hair, smart casual).
2. Twelve independent female expression assets.
3. Alex male hero portrait in matching visual language.
4. Twelve independent male expression assets.
5. Optional small UI/avatar crops and transparent versions if supported.
Requirements: consistent identity across every image, clean edges, no watermarks, no accidental text/logos, correct filenames, no sprite-sheet-only substitute, and no invented claim that generated art has been added to the repo. Review assets before integration. If the image generation workflow cannot guarantee identity consistency, ask it for a reference-locked asset workflow and flag human approval as required.

## 14. Initial source inspection evidence (not a full audit)
- The repository already contains a full-stack Express server, provider registry, orchestrator, task/workflow services, GitHub service, research/reading/media/voice services, Supabase client/service layer, offline database/sync manager, visual context bridge, multimodal registry, and skill/plugin infrastructure. These must be audited before new implementations are added.
- `src/services/voice/voiceService.ts` routes audio transcription to `/api/voice/transcribe` and neural TTS to `/api/voice/tts`, with browser speech synthesis fallback.
- `src/services/voice/useVoiceDictation.ts` implements browser dictation and transcript cleanup; full composer integration and cross-device/browser verification still need auditing.
- `src/services/voice/voiceCommandRouter.ts` supports standalone end-session, pause/resume listening, mute/unmute, stop speaking, new chat, and navigation intents. It does not by itself prove that a live runtime connects and executes these routes.
- `src/services/visual/multimodalRegistry.ts` marks camera, screen and frame vision as active while Gemini Live streaming, spatial audio, and continuous OCR are pending configuration. “Active” labels need end-to-end validation against actual permissions, routes, and provider configuration.
- `server.ts` has health/integration status endpoints, Supabase-authenticated sync/workflow routes, and a serverless compatibility path. Its real hosting/runtime behavior still requires route-by-route tests.
- The current branch has an RLS-hardening migration for user-scoped tables, including nested message/conversation ownership. This was applied to the connected Supabase project. Recheck policies and migration history before further schema work.
- GitHub Actions run 39198854105 on commit 294354caa3f88320f9139369be68d9f8397561f9 completed successfully for type-check, tests, and production build. This verifies that CI run only, not all browser, Supabase, voice, OAuth, or deployed behavior.
- A settings preference is not proof of a working audio processing engine. A registry item is not proof of a live connection. An API route is not proof the provider credential is configured.

## 15. Required audit method and status vocabulary

For each requirement, inspect actual implementation and tests. Record:
- Requirement ID and expected user-visible behavior
- Relevant source paths/routes/database tables/providers
- Status: **Verified**, **Implemented but unverified**, **Partial**, **Broken**, **Missing**, **Blocked by configuration**, or **Needs product decision**
- Evidence: test name, CI run, API response, database policy check, or manual test
- Gap/root cause
- Proposed implementation steps and dependencies
- Risk/permission/data implications
- Acceptance criteria
- Whether Google AI Studio is the better implementation environment or the work belongs in the repository/backend.

Do not label a feature Verified without an appropriate test. Do not mark the entire product complete because CI passes.

## 16. Release gate
Before a future production deployment:
1. Complete this requirement-by-requirement audit.
2. Resolve blockers and agree the remaining gap list with the user.
3. Run type-check, all tests, build, backend/API tests, RLS ownership tests, provider-configuration tests, and browser/responsive flows.
4. Test guest chat, Google/email login and session persistence, chat history, memory, task lifecycle, voice dictation, TTS, Live if configured, Visual permissions/stop, Reading, and connector revocation.
5. Verify the actual hosting adapter and environment variables. Do not deploy during this phase.
6. Review security/performance advisors and resolve or explicitly accept documented issues.
7. Obtain explicit deployment approval before any production deployment or merge.
