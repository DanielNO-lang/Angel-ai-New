# Angel Super-AI Capability Map and Brand Ecosystem Blueprint

**Prepared:** 2026-10-23  
**Purpose:** Consolidate the user's Angel vision, official public brand/product surfaces, and a build-first roadmap.  
**Status:** Planning artifact only. No application code changed, no merge to `main`, and no Netlify deployment.

## 1. Product principle

Angel should be a unified personal AI operating layer: conversational companion, researcher, creator, tutor, career partner, project operator, and permissioned interface to a user's digital tools. It should preserve Angel's own identity, voice, visual characters, and judgement. Other products are capability references and optional integrations, not personalities to copy.

"Everything" should mean a coherent capability platform with a discoverable roadmap, not shipping every product at once or claiming every capability works on every device.

## 2. Brand ecosystems to map

The catalogs below are practical first-pass groupings, not claims to enumerate every product or every regional/enterprise variant. Product availability, names, plans, and APIs change; verify the official product page and current developer docs before implementation.

### A. Microsoft

Official directories:
- [Microsoft 365 products and apps](https://www.microsoft.com/en-us/microsoft-365/products-apps-services)
- [Microsoft support product index](https://support.microsoft.com/en-us/all-products-list)
- [Microsoft Graph overview](https://learn.microsoft.com/en-us/graph/overview)
- [Azure products](https://azure.microsoft.com/en-us/products)

Product families to examine:
- **Documents and creation:** Word, Excel, PowerPoint, OneNote, Visio, Whiteboard, Clipchamp, Forms, Lists, Loop, Sway.
- **Communication and planning:** Outlook, Calendar, Teams, To Do, Planner, Bookings, Viva, Places.
- **Storage and knowledge:** OneDrive, SharePoint, Microsoft Search.
- **Automation and business:** Power Automate, Power Apps, Power BI, Dynamics 365, Microsoft 365 Copilot.
- **Devices and OS:** Windows, Edge, Phone Link, SwiftKey, Surface.
- **Developer/AI/cloud:** Microsoft Graph, Microsoft Foundry/Azure AI, Azure AI Search, Microsoft Agents SDK, GitHub and GitHub Copilot.
- **Security/identity:** Microsoft Entra and the relevant security/permissions ecosystem.

**Angel patterns:** create/edit office documents and spreadsheets; turn chat into a Word-like document, spreadsheet, slide deck, or presentation; calendar/email/task orchestration; cross-app knowledge retrieval; meeting preparation and summaries; dashboards and business reports; approved workflow automation.

**Integration route:** Microsoft Graph first for Outlook mail/calendar/contacts, OneDrive/SharePoint files, Planner/To Do, and supported Teams data. Microsoft Agents SDK is relevant if Angel later needs to publish an agent inside Microsoft channels; it is not required merely to connect Graph. Use narrow OAuth scopes, read-only pilots, separate write grants, and confirmation for sending/deleting/updating.

### B. Google

Official directories:
- [Google products](https://about.google/products/)
- [Google AI products](https://ai.google/products/)
- [Google developer products](https://developers.google.com/products)

Product families to examine:
- **AI and research:** Gemini, Gemini Live, Gemini Notebook/NotebookLM, AI Mode/Search, Google AI Studio, Gemini API, Google Labs experiments, Flow, Stitch, Project Astra and other current experiments.
- **Work:** Gmail, Calendar, Docs, Sheets, Slides, Drive, Meet, Chat, Tasks, Keep, Forms, Sites, Classroom.
- **Web and devices:** Chrome, Android, ChromeOS, Pixel, Gboard, Lens, Google Assistant, Google Home/Nest.
- **Maps and exploration:** Maps, Earth, Street View, Flights, Travel, Waze, Arts & Culture.
- **Media and personal library:** Photos, YouTube, YouTube Music, Play Books, Play Games.
- **Cloud/developer:** Google Cloud, Firebase, Flutter, Google Maps Platform, Google Identity, TensorFlow, Android developer tools.

**Angel patterns:** multimodal understanding; camera/screen-aware conversations; research notebooks with sources; Google Drive/Docs/Sheets workflows; travel exploration with maps and routes; image editing and video/storyboard generation where supported; connected Google account search; mobile-context assistant patterns.

**Integration route:** official Gemini API and authorized Google APIs with user consent. Consumer Gemini access does not imply API quota or entitlement. Verify each API's pricing, data-use policy, scopes, and regional availability. Treat Labs experiments as unstable until individually verified.

### C. OpenAI

Official entry points:
- [OpenAI products](https://openai.com/)
- [OpenAI developer platform](https://developers.openai.com/)
- [API documentation](https://developers.openai.com/api/docs)
- [ChatGPT capabilities overview](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview)

Product/capability families to examine:
- **ChatGPT:** chat, projects, file and image analysis, data analysis, web search, deep research, memory, voice, connected apps, tasks and custom assistants/features subject to current availability.
- **Developer platform:** Responses API, Agents SDK, model APIs, structured outputs, tools, tracing/evaluations and supported computer-use/agent workflows.
- **Audio:** realtime speech, transcription, speech generation and translation capabilities where current APIs support them.
- **Images:** official image generation and editing APIs.
- **Coding:** Codex and developer coding workflows.
- **Extension surface:** MCP servers, skills, plugins or supported extension systems depending on product surface.

**Angel patterns:** reliable tool-calling, long-running tasks, streaming voice, research with citations, files/data analysis, computer interaction behind explicit permissions, coding-agent workflows, structured outputs and evaluation/tracing.

**Important time-sensitive note:** Do not assume every historical product is still active. For example, OpenAI's official Sora discontinuation notice states that the Sora web/app experience ended on 2026-04-26 and its API was scheduled to end on 2026-09-24. Re-check live product status before planning video generation around a named provider. Build a provider-neutral media adapter instead.

### D. Anthropic / Claude

Official entry points:
- [Anthropic products](https://www.anthropic.com/)
- [Claude API overview](https://platform.claude.com/docs/en/api/overview)
- [Claude SDKs, CLI and libraries](https://platform.claude.com/docs/en/cli-sdks-libraries/overview)

Product families to examine:
- Claude chat, research and Artifacts.
- Claude Code and the Claude Agent SDK.
- Claude Cowork and cross-app knowledge-work patterns.
- Skills, plugins, connectors and supported integrations.
- Claude API, files, model selection, tool use and managed agent capabilities where available.
- Claude for Google Workspace, Slack, Microsoft 365, Chrome or other currently supported integrations.

**Angel patterns:** editable artifact workspaces beside chat; repository-aware coding; reusable skill packages; cross-app document workflows; versioned outputs; tool permissions and agent execution traces.

**Integration route:** API or documented SDKs. Consumer plan entitlements and API access/billing are separate. Never depend on undocumented private endpoints or session-cookie reuse.

### E. Related brands worth adding to the catalog

These are next-tier research tracks, not immediate dependencies:
- **Perplexity:** search-first research, citation workflows, collections/spaces and supported API surfaces.
- **Arena:** blind model comparison and human preference evaluation.
- **NVIDIA:** model optimization, inference serving, accelerated deployment and GPU infrastructure.
- **Hugging Face:** model/dataset discovery, inference endpoints, evaluation and open-source model tooling.
- **GitHub:** repositories, pull requests, issues, CI, code review and secure automation.
- **Netlify:** hosting, serverless functions, AI Gateway and Agent Runners; inspect plan eligibility and current docs without deploying while production is paused.
- **Supabase:** Auth, PostgreSQL, Storage, Realtime and Edge Functions; use the project's actual current configuration and migrations.
- **Browser and search providers:** permissioned browsing, search APIs and structured retrieval.
- **Creative/media providers:** official image, speech, transcription, avatar and video APIs, chosen by quality/cost/terms rather than brand hype.

## 3. Recovered Angel feature inventory

This list consolidates earlier user requirements and prior project context. Each feature must later be checked against current code and classified as implemented, partial, proposed, blocked, or unverified.

### A. Core conversation and intelligence
- Human, warm, direct Angel personality; no generic assistant filler.
- Natural greetings and contextual emotional adaptation without fabricated personal credentials.
- Short everyday responses when appropriate; deeper reasoning for complex tasks.
- Model selector and a "Think" / deeper-reasoning option.
- Conversation history, search, rename, archive, export/import and recovery.
- Guest mode that works reliably, plus authenticated accounts and persistent sessions.
- Project workspaces with files, instructions, memory and task history.
- Multi-model routing and fallback without changing Angel's identity.
- Research mode with multi-source citations, evidence trail and uncertainty markers.

### B. Voice and audio
- Voice conversation inside the main chat, not a duplicated top-level Live Voice entry.
- Optional Home shortcut to start a voice session.
- Low-latency, interruptible conversation; user can interrupt Angel naturally.
- Wake phrase activation based on natural calling phrases using "Angel", not only one rigid phrase.
- Closure phrases should finish the current sentence and then end the session.
- Dictation, transcription, read-aloud, speed controls and voice selection.
- Distinct female and male voice profiles; confirm which are actually wired to working providers.
- Voice and speech should work across supported browsers/devices, with capability-aware fallbacks.
- Wake-word always-listening must be explicit, privacy-preserving, and technically validated per platform.

### C. Visual mode, video calls and screen awareness
- Visual Mode opens as a popup within chat, not a separate page.
- Live camera capture and screen sharing, with explicit OS/browser permission.
- Angel can analyze what the camera or shared screen shows.
- A visible, movable/minimized control to reopen or stop sharing.
- Minimize the panel without claiming capture continues where browser/OS rules stop it.
- Voice + video session and synchronized character/face are future targets, not assumed completed.
- Camera/screen sharing must be tested on desktop, tablet and mobile; background capture is platform-limited.
- Clear indicators, immediate stop controls, no covert recording.

### D. Characters and personality presentation
- Angel's approved visual concept: Asian-inspired face direction, layered black hair, premium 3D animation, smart-casual default clothing.
- A matching male counterpart.
- Build core expression sheet first, then reaction/emotion assets.
- Keep the approved Angel logo/favicon from the repo; do not replace it with a newly invented logo.
- Animated visual responses, state-aware reactions, transitions and a consistent character identity.
- Voice/character pairings configurable; do not imply synchronized lip movement exists until implemented and tested.

### E. Career and work-life section
- Career exploration: interests, strengths, constraints, realistic role matching and transferable skills.
- Skill-gap analysis and a staged learning plan.
- CV/resume and cover-letter drafting, portfolio planning, interview practice and job-application tracking.
- Remote-work and freelance path exploration; compare training time, cost, earning potential and work style.
- Job discovery through permitted public listings/official APIs, with source/date and scam-risk cautions.
- Career workspace with goals, milestones, applications, contacts and weekly review.
- Advice must be honest about uncertainty; no guaranteed job or income claims.

### F. Exploration and travel section
- Explore places, cities, nature, museums, culture, history, activities and accessible routes.
- Map-based exploration, itinerary planning, route sequencing and travel-time estimation using verified data.
- Camera/image-assisted discovery when permitted.
- Trip planning with budgets, dates, transport, accommodation and checklist.
- Virtual exploration through official maps, imagery and permitted media sources.
- Clearly distinguish verified facts from generated suggestions; live prices, opening hours and visa rules need fresh sources.

### G. Workbench, creation and files
- File uploads, photos, images, camera, web search and deep research.
- Connected apps, library, projects and reusable instructions.
- Create/edit images; video creation or storyboarding through available supported providers.
- Data analysis, charts, tables and exportable files.
- Document/artifact creation and editing; preserve versions and allow restore.
- Agent tasks, skills, plugins/tools, connections and secrets management.
- Memory, multimodal controls, marketplace, recycle bin and settings.
- Task status, logs, checkpoints, cancel/retry and visible approval requests.

### H. Operating-layer / Jarvis-like capabilities
- Multi-step task execution, scheduling and reminders.
- Work on multiple queued tasks with durable status, not uncontrolled simultaneous action.
- Calendar/lesson support, briefings, proactive summaries and user-approved notifications.
- GitHub workflow integration for repository/PR/issues and build/test monitoring.
- Permissioned web/browser interactions and approved connected-app actions.
- Device/app connection directory showing what is connected and what permissions it has.
- Offline-aware behavior and local transcription where feasible.
- Secure memory and sync between IndexedDB/local state and Supabase, with conflict handling.
- Action lifecycle: explain intended action → obtain permission when required → execute → verify result → report outcome.
- Expiring or revocable permissions, least privilege, audit logs and budget limits.
- Cross-device availability on web, desktop, tablet, phone and extension where the platform permits it; do not claim arbitrary OS-level control from a web page.

### I. Existing UI and reliability constraints to preserve
- Approved dashboard blueprint and exact accepted visual direction.
- New Chat/Home remains accessible; other tools may scroll.
- Compact suggestion chips, three minimal randomized suggestions, on guest and authenticated home.
- ChatGPT-like recent conversation list and responsive sidebar expand/collapse.
- Composer controls horizontally aligned, with a capped/growing textarea.
- Preserve intentional "More" functions; do not remove items accidentally.
- Remove unwanted "Start with Angel" subtitles and duplicate Live Voice entry.
- Black-and-white visual direction, polished spacing, hover interactions, animation and responsive layout.
- Use current Angel logo/favicon; remove unwanted LL badges.
- Do not claim features work on devices without tests.
- No deployment until explicitly authorized. Current latest instruction remains: keep changes on `main` only if separately authorized; production deployment stays paused. Research branch is not authorization to deploy.

## 4. Capability mapping: what to borrow from each ecosystem

| Capability family | Strong references | Angel adaptation | Initial priority |
|---|---|---|---|
| Chat, memory, projects, files | ChatGPT, Claude | Unified conversation and project layer | P0 |
| Model gateway, tools, structured outputs | OpenAI API/Agents, Claude API, Gemini API | Provider-neutral typed adapter contracts | P0 |
| Office documents and productivity | Microsoft 365, Google Workspace | Authorized document, mail, calendar and file connectors | P1 |
| Research and evidence | ChatGPT deep research, Claude Research, Perplexity | Search → extract → cite → verify → report | P1 |
| Skills and reusable workflows | Claude Skills/plugins, OpenAI/MCP patterns | Reviewed skill registry with permissions and tests | P1 |
| Coding/GitHub tasks | Codex, Claude Code, Gemini CLI, GitHub | Bounded coding/repository workflow with test evidence | P1 |
| Voice and live audio | OpenAI realtime, Gemini Live, device speech APIs | Interruptible in-chat voice, provider fallback | P1 |
| Camera/screen/video | Gemini Live and official browser media APIs | Popup visual mode with explicit permissions | P1, verify foundations first |
| Creative image/video | Gemini image generation, Google Flow, official media APIs | Asset library and provider-neutral generation adapters | P2 |
| Career coaching | Research/search + structured workflow patterns | Career workspace and job tracker | P1 |
| Travel/exploration | Google Maps/Earth/Travel and search | Map-based explore and itinerary planner | P1 |
| Model evaluation | Arena, internal eval frameworks | Blind comparisons plus task-specific regression suite | P2 |
| Desktop/system control | Native OS APIs and carefully sandboxed agents | Separate native/extension bridge; never promise web-only OS control | Later |
| Multi-agent task orchestration | OpenAI Agents, Microsoft Agents, other workflow systems | Bounded orchestrator with checkpoints and approval gates | P1 |
| Knowledge/RAG and file extraction | Microsoft Graph/SharePoint, Google Drive, open-web retrieval | Access-aware retrieval with citations and per-user isolation | P1 |

## 5. Build sequence

### Phase 0: truth audit and architecture lock
1. Inspect the current Angel repository, current branch, CI/build/type errors, routes, Supabase schema, auth, API endpoints and Netlify functions.
2. Produce a verified feature status matrix: implemented, partial, broken, absent, blocked, or untested.
3. Identify duplicate/conflicting implementations before adding new abstractions.
4. Lock the provider interface, tool contract, task state model, permissions/risk tiers and event logging.
5. Preserve current user constraints: no Netlify production deployment without explicit authorization.

### Phase 1: make the existing core dependable
1. Fix current build/type/runtime failures and auth/session/guest flows.
2. Stabilize chat history, persistence, project context and error recovery.
3. Repair the sidebar/navigation and approved Home/composer experience.
4. Establish usage limits, server-side secrets, structured logs and acceptance tests.

### Phase 2: voice + visual session
1. Audit current camera/screen capture and audio foundations.
2. Make Visual Mode a chat popup with camera, screen, analyze and stop actions.
3. Integrate in-chat voice with interruptions, transcript, read-aloud and selectable profiles.
4. Add live video calling/character synchronization only after a stable session transport is proven.
5. Test actual browsers/devices; document unsupported background behavior.

### Phase 3: tasks, skills and connected services
1. Durable jobs, scheduler, reminders, checkpoints, cancellation and retries.
2. Permissioned tool/skill registry and approval lifecycle.
3. GitHub connector and read-only Google/Microsoft connector pilots.
4. File parsing, library, research artifacts and exportable results.

### Phase 4: Career, Exploration and Creative Studio
1. Career workspace with skills, plans, CV, applications and job-source tracking.
2. Explore workspace with maps, routes, travel plans and cultural discovery.
3. Image/media studio with asset provenance, prompt history and provider-specific quality/cost evaluation.
4. Expand to other connectors based on validated use cases.

### Phase 5: cross-device and agentic expansion
1. Offline transcription and offline-aware task behavior where feasible.
2. Browser extension/native companion only when a concrete permissioned capability requires it.
3. Multi-agent workflows with bounded steps, explicit tool grants, budget limits and independent verification.
4. Evaluation harness, model arena and regression monitoring.

## 6. Definition of done

Every feature must have:
- A clear user story and supported-device matrix.
- Permission/privacy and data-retention behavior.
- Typed API contracts and safe failure states.
- Unit/integration tests plus a manual test where hardware/browser access is required.
- Cost/usage limits for paid providers.
- A visible status of proposed, implemented, tested, or awaiting configuration.
- No success claim without observed evidence.
- No production deployment without explicit user authorization.

## 7. Source links for first-pass brand map

- Microsoft products: https://www.microsoft.com/en-us/microsoft-365/products-apps-services
- Microsoft Graph: https://learn.microsoft.com/en-us/graph/overview
- Google products: https://about.google/products/
- Google AI: https://ai.google/products/
- Google developer products: https://developers.google.com/products
- OpenAI developer platform: https://developers.openai.com/
- ChatGPT capabilities: https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview
- Anthropic: https://www.anthropic.com/
- Claude API: https://platform.claude.com/docs/en/api/overview
- Claude developer tools: https://platform.claude.com/docs/en/cli-sdks-libraries/overview
- Netlify AI Gateway docs: https://docs.netlify.com/build/ai-gateway/overview/
- Supabase docs: https://supabase.com/docs

## 8. Limitations

This is a consolidated capability and brand map, not an exhaustive inventory of every page/subdomain, regional product, enterprise SKU, API endpoint, or experimental service. Public products change frequently. The feature list is based on user requirements and prior project context; current implementation status must be verified from the repository. No source code has been changed as part of this document, and no device-specific feature is considered tested by being listed here.
