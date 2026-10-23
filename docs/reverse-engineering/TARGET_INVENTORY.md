# Target inventory

All targets below were supplied by the project owner. The inventory records the supplied targets and their initial research focus. **A first-pass public README review has now been documented in the linked audit reports; this is not complete source-level reverse engineering and REA has not been run.** Confirm source, default branch, license, maintenance, and contents before implementation.

Status convention: README review completed where content was retrievable; deeper source/dependency/test audit remains pending. Repositories whose README fetch returned 404 remain unresolved. The reports distinguish documented claims from source-confirmed or tested behavior.

## A. Models, agents, MCP, and AI development

| ID | Repository | Initial research focus | Status |
|---|---|---|---|
| REA-001 | [morluto/rea](https://github.com/morluto/rea) | Research tooling: repository/site/app analysis workflow, evidence capture, MCP interfaces, supported target types, limitations, local setup | Inspecting docs; not executed |
| REA-002 | [Tencent-Hunyuan/Hy-MT2](https://github.com/Tencent-Hunyuan/Hy-MT2) | Multilingual translation models, instruction following, local inference options, model sizes and deployment cost | README review documented; deeper audit pending |
| REA-003 | [QwenLM/Qwen-Image-2.1](https://github.com/QwenLM/Qwen-Image-2.1) | Text-to-image, image editing, reference-image conditioning, masking/region edits, inference integrations and compute needs | README review documented; deeper audit pending |
| REA-004 | [NVIDIA/Model-Optimizer](https://github.com/NVIDIA/Model-Optimizer) | Quantization and inference optimization; compatibility and hardware constraints | README review documented; deeper audit pending |
| REA-005 | [NVIDIA/gpu-operator](https://github.com/NVIDIA/gpu-operator) | Kubernetes GPU provisioning and operations; future infrastructure only | README review documented; deeper audit pending |
| REA-006 | [google/adk-python](https://github.com/google/adk-python) | Agent lifecycle, tools, workflows, evaluation, sessions and multi-agent coordination | README review documented; deeper audit pending |
| REA-007 | [Gentleman-Programming/gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) | Persistent project context, coding-agent skills, repeatable workflows and evidence-driven engineering | README review documented; deeper audit pending |
| REA-008 | [anthropics/claude-code](https://github.com/anthropics/claude-code) | Publicly documented coding-agent workflows, plugins, commands, repository understanding and Git integration; respect proprietary boundaries | README review documented; deeper audit pending |
| REA-009 | [claude-code-best/claude-code](https://github.com/claude-code-best/claude-code) | Verify identity, provenance, license, and whether this is an independent project, mirror, or unrelated repository before analysis | README review documented; deeper audit pending |
| REA-010 | [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) | Educational agent architecture, tool loops, orchestration and learning examples | README review documented; deeper audit pending |
| REA-011 | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Skill discovery, categorization, task patterns, and connector integrations | README review documented; deeper audit pending |
| REA-012 | [anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) | Documented model integration recipes, tool use, structured outputs and multimodal examples | README review documented; deeper audit pending |
| REA-013 | [Alishahryar1/free-claude-code](https://github.com/Alishahryar1/free-claude-code) | Verify claims, license, provider terms, cost model and safe/legitimate usage before considering any integration | README review documented; deeper audit pending |
| REA-014 | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | Skill architecture, reusable prompts, workflows and tool instructions | README review documented; deeper audit pending |
| REA-015 | [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) | UI for coding-agent workflows, project/session management and mobile/desktop access | README review documented; deeper audit pending |
| REA-016 | [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router) | Model routing, provider adapters, configuration and fallback strategies | README review documented; deeper audit pending |
| REA-017 | [bradautomates/claude-video](https://github.com/bradautomates/claude-video) | Video workflow automation and media pipeline patterns; verify actual scope | README review documented; deeper audit pending |
| REA-018 | [richards199999/Thinking-Claude](https://github.com/richards199999/Thinking-Claude) | Inspect purpose, source evidence, and current relevance; avoid treating speculative model internals as fact | README review documented; deeper audit pending |
| REA-019 | [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) | Task decomposition, project planning, task state and coding-agent integration | README review documented; deeper audit pending |
| REA-020 | [openedclaude/claude-reviews-claude](https://github.com/openedclaude/claude-reviews-claude) | Automated code review workflow, critique loops and review evidence; verify provenance | README review documented; deeper audit pending |
| REA-021 | [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) | GitHub Actions integration, issue/PR workflows and repository permissions | README review documented; deeper audit pending |
| REA-022 | [Wei-Shaw/claude-relay-service](https://github.com/Wei-Shaw/claude-relay-service) | Relay architecture, multi-user isolation, provider terms, secrets handling and security; do not bypass provider access controls | README review documented; deeper audit pending |
| REA-023 | [Doriandarko/claude-engineer](https://github.com/Doriandarko/claude-engineer) | Tool-using software engineering agent, terminal/filesystem workflow and human approvals | Unresolved: README fetch returned 404 |
| REA-024 | [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal) | Legal-domain workflow patterns, document analysis and professional-domain limitations | README review documented; deeper audit pending |
| REA-025 | [BehiSecc/awesome-claude-skills](https://github.com/BehiSecc/awesome-claude-skills) | Skill catalog, categorization and duplicate comparison with other skill lists | README review documented; deeper audit pending |
| REA-026 | [composio-community/open-claude-cowork](https://github.com/composio-community/open-claude-cowork) | Desktop/workspace agent workflows, tools, permissions and app integration | README review documented; deeper audit pending |
| REA-027 | [tiann/hapi](https://github.com/tiann/hapi) | Verify actual product identity, supported platforms and agent workflow patterns | README review documented; deeper audit pending |
| REA-028 | [lidge-jun/opencodex](https://github.com/lidge-jun/opencodex) | Verify project identity and inspect coding-agent interfaces and tool workflow | README review documented; deeper audit pending |
| REA-029 | [pretend1111/claude-desktop-app](https://github.com/pretend1111/claude-desktop-app) | Verify whether official, third-party, or educational; inspect desktop wrapper patterns and licensing | README review documented; deeper audit pending |
| REA-030 | [hamed-elfayome/Claude-Usage-Tracker](https://github.com/hamed-elfayome/Claude-Usage-Tracker) | Usage tracking, quota visibility and local data handling; verify permitted data sources | README review documented; deeper audit pending |
| REA-031 | [claudio-silva/claude-artifact-runner](https://github.com/claudio-silva/claude-artifact-runner) | Artifact execution, preview sandboxing and safe handling of generated content | README review documented; deeper audit pending |
| REA-032 | [syedazharmbnr1/claude-chatgpt-mcp](https://github.com/syedazharmbnr1/claude-chatgpt-mcp) | Cross-assistant interoperability, MCP tool boundaries, auth and data minimization | README review documented; deeper audit pending |
| REA-033 | [mcp-use/mcp-use](https://github.com/mcp-use/mcp-use) | MCP server/client framework, typed tool contracts, inspector, UI views and testing | README review documented; deeper audit pending |
| REA-034 | [slopus/happy](https://github.com/slopus/happy) | Verify project scope; inspect mobile/remote agent interaction and session continuity | README review documented; deeper audit pending |
| REA-035 | [tw93/Pake](https://github.com/tw93/Pake) | Desktop app packaging from web interfaces, runtime footprint and platform support | README review documented; deeper audit pending |
| REA-036 | [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) | Inspect intended uses and legal constraints; only consider legitimate image restoration workflows, not removal of ownership/provenance marks to misrepresent origin | README review documented; deeper audit pending |
| REA-037 | [kuse-ai/kuse_cowork](https://github.com/kuse-ai/kuse_cowork) | Collaborative agent workspace, artifact management and multi-step productivity workflows | README review documented; deeper audit pending |
| REA-038 | [dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill) | Design-system guidance, UI review heuristics and reusable design skills | README review documented; deeper audit pending |
| REA-039 | [Karenina-na/Claude-Desktop](https://github.com/Karenina-na/Claude-Desktop) | Verify provenance and license; inspect desktop shell and app integration patterns | README review documented; deeper audit pending |
| REA-040 | [AlexGladkov/claude-in-mobile](https://github.com/AlexGladkov/claude-in-mobile) | Mobile access, remote session UX and platform constraints | README review documented; deeper audit pending |

## B. OpenAI SDKs, agents, and model interoperability

| ID | Repository | Initial research focus | Status |
|---|---|---|---|
| REA-041 | [openai/openai-cookbook](https://github.com/openai/openai-cookbook) | Official API recipes, tool use, structured output, multimodal workflows and evaluation examples | README review documented; deeper audit pending |
| REA-042 | [openai/openai-python](https://github.com/openai/openai-python) | Official Python SDK, retries, streaming, typed responses, errors and API patterns | README review documented; deeper audit pending |
| REA-043 | [betalgo/openai](https://github.com/betalgo/openai) | .NET SDK integration and provider abstraction; verify API coverage and license | Unresolved: README fetch returned 404 |
| REA-044 | [MacPaw/OpenAI](https://github.com/MacPaw/OpenAI) | Swift SDK integration and Apple-platform API patterns; verify maintenance and compatibility | README review documented; deeper audit pending |
| REA-045 | [openai/openai-agents-python](https://github.com/openai/openai-agents-python) | Agents, handoffs, tools, guardrails, sessions, tracing, voice and sandboxed execution | README review documented; deeper audit pending |
| REA-046 | [PublicAffairs/openai-gemini](https://github.com/PublicAffairs/openai-gemini) | Verify project scope and license; assess cross-provider API compatibility | README review documented; deeper audit pending |
| REA-047 | [sashabaranov/go-openai](https://github.com/sashabaranov/go-openai) | Go SDK patterns, streaming and error handling | README review documented; deeper audit pending |
| REA-048 | [TheoKanning/openai-java](https://github.com/TheoKanning/openai-java) | Java SDK patterns and compatibility; verify current maintenance | README review documented; deeper audit pending |
| REA-049 | [ConnectAI-E/feishu-openai](https://github.com/ConnectAI-E/feishu-openai) | Feishu/Lark bot integration, message workflows and external assistant channels | Unresolved: README fetch returned 404 |

## C. Google, identity, APIs, Workspace, maps, and Firebase

| ID | Repository | Initial research focus | Status |
|---|---|---|---|
| REA-050 | [googleapis/googleapis](https://github.com/googleapis/googleapis) | API protobuf definitions, service contracts and generated client conventions | README review documented; deeper audit pending |
| REA-051 | [gaowanlu/google](https://github.com/gaowanlu/google) | Verify repository identity, scope, license and relevance before further analysis | README review documented; deeper audit pending |
| REA-052 | [google-research/google-research](https://github.com/google-research/google-research) | Research implementations and potentially relevant algorithms; screen each project individually | README review documented; deeper audit pending |
| REA-053 | [googlesamples/google-services](https://github.com/googlesamples/google-services) | Google service integration examples and app configuration patterns | README review documented; deeper audit pending |
| REA-054 | [Ponderfly/GoogleTranslateIpCheck](https://github.com/Ponderfly/GoogleTranslateIpCheck) | Network diagnostic purpose, maintenance and legal/acceptable-use constraints; do not build circumvention into Angel | README review documented; deeper audit pending |
| REA-055 | [googleapis/google-api-php-client](https://github.com/googleapis/google-api-php-client) | PHP API client patterns, OAuth and service integration | README review documented; deeper audit pending |
| REA-056 | [google/skills](https://github.com/google/skills) | Verify official scope, skill format and reusable workflow definitions | README review documented; deeper audit pending |
| REA-057 | [wong2/chatgpt-google-extension](https://github.com/wong2/chatgpt-google-extension) | Browser extension UX, search-page integration and browser permission requirements | README review documented; deeper audit pending |
| REA-058 | [googleapis/google-api-python-client](https://github.com/googleapis/google-api-python-client) | Python client generation, service APIs, credentials and retries | README review documented; deeper audit pending |
| REA-059 | [googleapis/google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client) | Node.js Google API clients, OAuth and service integration | README review documented; deeper audit pending |
| REA-060 | [first20hours/google-10000-english](https://github.com/first20hours/google-10000-english) | Language-resource provenance, vocabulary data format and potential language-learning utility | README review documented; deeper audit pending |
| REA-061 | [mxrch/GHunt](https://github.com/mxrch/GHunt) | OSINT capability and privacy review; only lawful, consent-based, non-invasive uses | README review documented; deeper audit pending |
| REA-062 | [justjavac/google-ips](https://github.com/justjavac/google-ips) | Network data provenance, staleness and safe diagnostics; no assumptions that IP lists are authoritative | README review documented; deeper audit pending |
| REA-063 | [wstrange/GoogleAuth](https://github.com/wstrange/GoogleAuth) | TOTP authentication implementation, secrets lifecycle, recovery and security tests | README review documented; deeper audit pending |
| REA-064 | [react-native-google-signin/google-signin](https://github.com/react-native-google-signin/google-signin) | Native Google sign-in flow, platform setup, token handling and session behavior | README review documented; deeper audit pending |
| REA-065 | [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper) | Maps data collection patterns, terms/robots/privacy constraints and lawful alternatives | README review documented; deeper audit pending |
| REA-066 | [protocolbuffers/protobuf](https://github.com/protocolbuffers/protobuf) | Serialization, schema compatibility and API contracts | README review documented; deeper audit pending |
| REA-067 | [googleapis/google-api-go-client](https://github.com/googleapis/google-api-go-client) | Go service clients, OAuth and API error handling | README review documented; deeper audit pending |
| REA-068 | [taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) | Google Workspace tools, OAuth, Gmail/Drive/Calendar/Docs/Sheets and MCP permission model | README review documented; deeper audit pending |
| REA-069 | [google/google-ctf](https://github.com/google/google-ctf) | Educational security challenges only; use isolated labs and authorized test environments | README review documented; deeper audit pending |
| REA-070 | [tomchentw/react-google-maps](https://github.com/tomchentw/react-google-maps) | React map components and map integration patterns; check maintenance and modern alternatives | README review documented; deeper audit pending |
| REA-071 | [antonioribeiro/google2fa](https://github.com/antonioribeiro/google2fa) | PHP TOTP/2FA flows, QR enrollment, recovery and validation | README review documented; deeper audit pending |
| REA-072 | [googleads/googleads-mobile-android-examples](https://github.com/googleads/googleads-mobile-android-examples) | Mobile ad SDK examples, consent, configuration and platform integration; not core assistant priority | README review documented; deeper audit pending |
| REA-073 | [googleapis/google-cloud-java](https://github.com/googleapis/google-cloud-java) | Google Cloud Java clients, authentication, retries and service integration | README review documented; deeper audit pending |
| REA-074 | [angular-ui/angular-google-maps](https://github.com/angular-ui/angular-google-maps) | Angular map integration patterns; legacy compatibility and modern alternatives | README review documented; deeper audit pending |
| REA-075 | [firebase/flutterfire](https://github.com/firebase/flutterfire) | Flutter Firebase plugins, auth, messaging, database and cross-platform integration | README review documented; deeper audit pending |

## D. Count and tracking

- Total repository targets currently inventoried: **112** (97 earlier targets plus 12 candidates from the public-product/Microsoft review and 3 HubMind candidates). Website targets are tracked separately below.
- Research begins with a representative sample, then proceeds by capability family and dependency order.
- This inventory records links, research focus and review status. README reviews are not equivalent to source-level reverse engineering or runtime verification.
- If any URL redirects, is unavailable, is a fork/mirror, or has an incompatible license, record that before proceeding.
- New website URLs use the same process and are added to this inventory under a separate website-target section with a stable ID.


## E. Additional targets supplied 2026-10-23

See [Audit 04: Realtime, OpenAI ecosystem, voice, and chat interfaces](./reports/04-realtime-openai-voice-and-chat-ecosystem.md) for documented capabilities and Angel recommendations.

| ID | Target | Research focus | Status |
|---|---|---|---|
| REA-076 | [openai/openai-realtime-agents](https://github.com/openai/openai-realtime-agents) | Realtime voice agent supervisor pattern and sequential specialist handoffs | README review documented; deeper audit pending |
| REA-077 | [openai/openai-realtime-console](https://github.com/openai/openai-realtime-console) | WebRTC event streaming, client function calls and voice diagnostics | README review documented; deeper audit pending |
| REA-078 | [open-webui/open-webui](https://github.com/open-webui/open-webui) | Provider-agnostic self-hosted UI, RAG, memory, tools, automations, voice/video and analytics | README review documented; deeper audit pending |
| REA-079 | [openai/openai-agents-js](https://github.com/openai/openai-agents-js) | TypeScript agents, tools, handoffs, sandboxing, sessions, guardrails and tracing | README review documented; deeper audit pending |
| REA-080 | [openai/plugins](https://github.com/openai/plugins) | Plugin manifests, skills, MCP configs, hooks and curated workflows | README review documented; deeper audit pending |
| REA-081 | [justjavac/openai-proxy](https://github.com/justjavac/openai-proxy) | Proxy repository identity and current content require re-verification | Unresolved: README fetch returned 404 |
| REA-082 | [alexrudall/ruby-openai](https://github.com/alexrudall/ruby-openai) | Ruby API client surface: responses, tools, audio, images, files and realtime | README review documented; deeper audit pending |
| REA-083 | [dan1471/FREE-openai-api-keys](https://github.com/dan1471/FREE-openai-api-keys) | Unsafe shared-credential list; explicitly reject, do not use keys | README review documented; deeper audit pending |
| REA-084 | [adrianhajdin/project_openai_codex](https://github.com/adrianhajdin/project_openai_codex) | Tutorial coding-assistant UI; source-level capabilities still to verify | README review documented; deeper audit pending |
| REA-085 | [openai/openai-assistants-quickstart](https://github.com/openai/openai-assistants-quickstart) | Historical Next.js streaming, function calling and file-search workflow | README review documented; deeper audit pending |
| REA-086 | [microsoft/OpenAIWorkshop](https://github.com/microsoft/OpenAIWorkshop) | Multi-agent orchestration, durable workflows, MCP, evaluations and observability | README review documented; deeper audit pending |
| REA-087 | [egoist/openai-proxy](https://github.com/egoist/openai-proxy) | Edge request-forwarding proxy; security and routing patterns only | README review documented; deeper audit pending |
| REA-088 | [openai/openai-apps-sdk-examples](https://github.com/openai/openai-apps-sdk-examples) | MCP tools returning structured payloads and interactive UI widgets | README review documented; deeper audit pending |
| REA-089 | [travisvn/openai-edge-tts](https://github.com/travisvn/openai-edge-tts) | OpenAI-compatible online TTS endpoint, voice mapping and audio streaming | README review documented; deeper audit pending |
| REA-090 | [KenyonY/openai-forward](https://github.com/KenyonY/openai-forward) | Async model gateway, rate limits, caching, routing, retries and logs | README review documented; deeper audit pending |
| REA-091 | [MicrosoftLearning/mslearn-openai](https://github.com/MicrosoftLearning/mslearn-openai) | Learning repository link/content unresolved; recheck URL | Unresolved: README fetch returned 404 |
| REA-092 | [aallam/openai-kotlin](https://github.com/aallam/openai-kotlin) | Kotlin multiplatform API client for native Android/future mobile work | README review documented; deeper audit pending |
| REA-093 | [daveshap/OpenAI_Agent_Swarm](https://github.com/daveshap/OpenAI_Agent_Swarm) | Hierarchical agent swarm design; autonomy claims require careful validation | README review documented; deeper audit pending |
| REA-094 | [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | Cross-platform local Whisper ASR, quantization, VAD and hardware acceleration | README review documented; deeper audit pending |
| REA-095 | [lencx/ChatGPT](https://github.com/lencx/ChatGPT) | Unofficial desktop wrapper; historical UI/packaging reference | README review documented; deeper audit pending |
| REA-096 | [acheong08/ChatGPT](https://github.com/acheong08/ChatGPT) | Repository link/content unresolved; avoid unofficial token flows | Unresolved: README fetch returned 404 |
| REA-097 | [Chanzhaoyu/chatgpt-web](https://github.com/Chanzhaoyu/chatgpt-web) | Chat UI, sessions, import/export, themes and historical unofficial token mode | README review documented; deeper audit pending |


## F. Public AI product and Microsoft ecosystem targets (2026-10-23)

See [Audit 05: Public AI products, HubMind, and Microsoft](./reports/05-public-ai-products-hubmind-and-microsoft.md) and [Audit 06: Open-source AI and Microsoft shortlist](./reports/06-open-source-ai-and-microsoft-shortlist.md). The websites below are product surfaces, not automatically open-source code.

| ID | Website / product | Research focus | Status |
|---|---|---|---|
| WEB-001 | [ChatGPT](https://chatgpt.com) | Research, projects, files, data analysis, voice, memory, tasks, connected apps and artifact workflows | Public docs reviewed; live account/plan testing not performed |
| WEB-002 | [Claude](https://claude.ai) | Research, Artifacts, versioned outputs, skill/plugin workflows | Public docs reviewed; live account/plan testing not performed |
| WEB-003 | [Gemini](https://gemini.google.com) | Multimodal assistant, Google ecosystem, official API capability boundaries | Public docs reviewed; API and account entitlements not tested |
| WEB-004 | [Arena](https://arena.ai) | Blind model comparisons, public evaluation methods and ranking caveats | Public organization/repository surface reviewed; benchmark not executed |
| WEB-005 | [Perplexity](https://www.perplexity.ai) | Search-first research, citations, source trail and answer synthesis | Initial product-pattern review; deeper official-doc review pending |
| WEB-006 | [Nano Banana](https://nanobanana.io) | Verify domain identity; compare only against official Gemini image-generation documentation | Domain-to-Google relationship unresolved |
| WEB-007 | [Google Flow](https://flow.google.com) | AI video/filmmaking, storyboard, scene continuity and creative asset management | Initial product-pattern review; API availability unverified |
| WEB-008 | [Google Labs](https://labs.google) | Experimental AI product discovery and maturity/availability tracking | Catalog reviewed at high level; experiments require individual review |
| WEB-009 | [HubMind, exact Netlify URL not yet identified](https://hubmind.com.au/) | Distinguish similarly named products; company brain, connectors, role-scoped agents, audit trails | Identity unresolved; do not treat this link as the requested Netlify app |
| WEB-010 | [HubMind AI Gateway](https://aigateway.hubmind.app/) | Credential proxy, capability URLs, MCP manifests, quotas, approvals, secret vault | Public product page reviewed; security posture/code not audited |
| WEB-011 | [Hu-mind.ai](https://www.hu-mind.ai/) | Separate similarly named VLSI AI teammate product | Public product page surfaced; not confirmed as intended target |

## G. Additional open-source candidates (2026-10-23)

| ID | Repository | Initial research focus | Status |
|---|---|---|---|
| REA-098 | [anthropics/skills](https://github.com/anthropics/skills) | Portable skill format, examples, resource layout and provenance | Candidate identified; source/license audit pending |
| REA-099 | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Curated plugin packaging, metadata, review and versioning | Candidate identified; source/license audit pending |
| REA-100 | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) | Practical knowledge-work workflows and domain packs | Candidate identified; source/license audit pending |
| REA-101 | [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) | Agent loop, context, tool execution, extensions and developer workflows | Candidate identified; source/license audit pending |
| REA-102 | [microsoft/Agents](https://github.com/microsoft/Agents) | Microsoft 365 multi-channel agent SDK family; JS/Python/.NET | Public README reviewed; deeper source audit pending |
| REA-103 | [microsoftgraph/msgraph-sdk-javascript](https://github.com/microsoftgraph/msgraph-sdk-javascript) | Microsoft Graph client, auth, paging, throttling and errors | Candidate identified; source/license audit pending |
| REA-104 | [microsoft/semantic-kernel](https://github.com/microsoft/semantic-kernel) | Agent orchestration, plugins/functions, memory and provider abstraction | Candidate identified; source/license audit pending |
| REA-105 | [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | Agent orchestration and durable workflow patterns; verify maturity | Candidate identified; identity/maturity audit pending |
| REA-106 | [google-gemini/gemini-api-quickstart](https://github.com/google-gemini/gemini-api-quickstart) | Official Gemini API quickstart and multimodal payload patterns | Candidate identified; source/license audit pending |
| REA-107 | [lmarena/arena-rank](https://github.com/lmarena/arena-rank) | Public preference-ranking methodology | Public organization description reviewed; source audit pending |
| REA-108 | [lmarena/arena-hard-auto](https://github.com/lmarena/arena-hard-auto) | Automatic model benchmark methodology | Public organization description reviewed; source audit pending |
| REA-109 | [lmarena/search-arena](https://github.com/lmarena/search-arena) | Evaluation of search-augmented models | Public organization description reviewed; source audit pending |

The shortlist is not a statement that all candidates are compatible, free to operate, or approved for adoption. Recheck the current repository identity, license, maintenance, dependencies, and API terms before reuse.


## H. HubMind repository candidates (2026-10-23)

See [Audit 07: HubMind repository candidates](./reports/07-hubmind-repository-candidates.md). These similarly named projects are not confirmed to be the requested Netlify-hosted app.

| ID | Repository | Research focus | Status |
|---|---|---|---|
| REA-110 | [ylw510/HubMind](https://github.com/ylw510/HubMind) | GitHub assistant: repository trends, PR/issue analysis, GitHub API actions, reports, multi-provider LLM and web auth | README reviewed; source/security/license audit pending |
| REA-111 | [lance808/HubMind](https://github.com/lance808/HubMind) | Cross-platform AI workstation: model adapters, multi-model chat, agent automation, workflow graph, file parsing, budgets and Electron | README reviewed; source/security/license audit pending |
| REA-112 | [CarlstonG/serverless_hubmind](https://github.com/CarlstonG/serverless_hubmind) | Older Netlify/Firebase/Stripe/Postmark website starter; likely naming collision rather than AI assistant | README reviewed; relevance to requested target unconfirmed |

The exact Netlify URL or repository for the intended HubMind is still needed to identify it definitively.
