# Target inventory

All targets below were supplied by the project owner. The inventory records the supplied targets and their initial research focus. **A first-pass public README review has now been documented in the linked audit reports; this is not complete source-level reverse engineering and REA has not been run.** Confirm source, default branch, license, maintenance, and contents before implementation.

Status convention: README review completed where content was retrievable; deeper source/dependency/test audit remains pending. Repositories whose README fetch returned 404 remain unresolved. The reports distinguish documented claims from source-confirmed or tested behavior.

## A. Models, agents, MCP, and AI development

| ID | Repository | Initial research focus | Status |
|---|---|---|---|
| REA-001 | [morluto/rea](https://github.com/morluto/rea) | Research tooling: repository/site/app analysis workflow, evidence capture, MCP interfaces, supported target types, limitations, local setup | Inspecting docs; not executed |
| REA-002 | [Tencent-Hunyuan/Hy-MT2](https://github.com/Tencent-Hunyuan/Hy-MT2) | Multilingual translation models, instruction following, local inference options, model sizes and deployment cost | README review documented; deeper audit pending |
| REA-003 | [QwenLM/Qwen-Image-2.1](https://github.com/QwenLM/Qwen-Image-2.1) | Text-to-image, image editing, reference-image conditioning, masking/region edits, inference integrations and compute needs | Queued |
| REA-004 | [NVIDIA/Model-Optimizer](https://github.com/NVIDIA/Model-Optimizer) | Quantization and inference optimization; compatibility and hardware constraints | Queued |
| REA-005 | [NVIDIA/gpu-operator](https://github.com/NVIDIA/gpu-operator) | Kubernetes GPU provisioning and operations; future infrastructure only | Queued |
| REA-006 | [google/adk-python](https://github.com/google/adk-python) | Agent lifecycle, tools, workflows, evaluation, sessions and multi-agent coordination | Queued |
| REA-007 | [Gentleman-Programming/gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) | Persistent project context, coding-agent skills, repeatable workflows and evidence-driven engineering | Queued |
| REA-008 | [anthropics/claude-code](https://github.com/anthropics/claude-code) | Publicly documented coding-agent workflows, plugins, commands, repository understanding and Git integration; respect proprietary boundaries | Queued |
| REA-009 | [claude-code-best/claude-code](https://github.com/claude-code-best/claude-code) | Verify identity, provenance, license, and whether this is an independent project, mirror, or unrelated repository before analysis | Queued |
| REA-010 | [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) | Educational agent architecture, tool loops, orchestration and learning examples | Queued |
| REA-011 | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Skill discovery, categorization, task patterns, and connector integrations | Queued |
| REA-012 | [anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) | Documented model integration recipes, tool use, structured outputs and multimodal examples | Queued |
| REA-013 | [Alishahryar1/free-claude-code](https://github.com/Alishahryar1/free-claude-code) | Verify claims, license, provider terms, cost model and safe/legitimate usage before considering any integration | Queued |
| REA-014 | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | Skill architecture, reusable prompts, workflows and tool instructions | Queued |
| REA-015 | [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) | UI for coding-agent workflows, project/session management and mobile/desktop access | Queued |
| REA-016 | [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router) | Model routing, provider adapters, configuration and fallback strategies | Queued |
| REA-017 | [bradautomates/claude-video](https://github.com/bradautomates/claude-video) | Video workflow automation and media pipeline patterns; verify actual scope | Queued |
| REA-018 | [richards199999/Thinking-Claude](https://github.com/richards199999/Thinking-Claude) | Inspect purpose, source evidence, and current relevance; avoid treating speculative model internals as fact | Queued |
| REA-019 | [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) | Task decomposition, project planning, task state and coding-agent integration | Queued |
| REA-020 | [openedclaude/claude-reviews-claude](https://github.com/openedclaude/claude-reviews-claude) | Automated code review workflow, critique loops and review evidence; verify provenance | Queued |
| REA-021 | [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) | GitHub Actions integration, issue/PR workflows and repository permissions | Queued |
| REA-022 | [Wei-Shaw/claude-relay-service](https://github.com/Wei-Shaw/claude-relay-service) | Relay architecture, multi-user isolation, provider terms, secrets handling and security; do not bypass provider access controls | Queued |
| REA-023 | [Doriandarko/claude-engineer](https://github.com/Doriandarko/claude-engineer) | Tool-using software engineering agent, terminal/filesystem workflow and human approvals | Unresolved: README fetch returned 404 |
| REA-024 | [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal) | Legal-domain workflow patterns, document analysis and professional-domain limitations | Queued |
| REA-025 | [BehiSecc/awesome-claude-skills](https://github.com/BehiSecc/awesome-claude-skills) | Skill catalog, categorization and duplicate comparison with other skill lists | Queued |
| REA-026 | [composio-community/open-claude-cowork](https://github.com/composio-community/open-claude-cowork) | Desktop/workspace agent workflows, tools, permissions and app integration | Queued |
| REA-027 | [tiann/hapi](https://github.com/tiann/hapi) | Verify actual product identity, supported platforms and agent workflow patterns | Queued |
| REA-028 | [lidge-jun/opencodex](https://github.com/lidge-jun/opencodex) | Verify project identity and inspect coding-agent interfaces and tool workflow | Queued |
| REA-029 | [pretend1111/claude-desktop-app](https://github.com/pretend1111/claude-desktop-app) | Verify whether official, third-party, or educational; inspect desktop wrapper patterns and licensing | Queued |
| REA-030 | [hamed-elfayome/Claude-Usage-Tracker](https://github.com/hamed-elfayome/Claude-Usage-Tracker) | Usage tracking, quota visibility and local data handling; verify permitted data sources | Queued |
| REA-031 | [claudio-silva/claude-artifact-runner](https://github.com/claudio-silva/claude-artifact-runner) | Artifact execution, preview sandboxing and safe handling of generated content | Queued |
| REA-032 | [syedazharmbnr1/claude-chatgpt-mcp](https://github.com/syedazharmbnr1/claude-chatgpt-mcp) | Cross-assistant interoperability, MCP tool boundaries, auth and data minimization | Queued |
| REA-033 | [mcp-use/mcp-use](https://github.com/mcp-use/mcp-use) | MCP server/client framework, typed tool contracts, inspector, UI views and testing | Queued |
| REA-034 | [slopus/happy](https://github.com/slopus/happy) | Verify project scope; inspect mobile/remote agent interaction and session continuity | Queued |
| REA-035 | [tw93/Pake](https://github.com/tw93/Pake) | Desktop app packaging from web interfaces, runtime footprint and platform support | Queued |
| REA-036 | [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) | Inspect intended uses and legal constraints; only consider legitimate image restoration workflows, not removal of ownership/provenance marks to misrepresent origin | Queued |
| REA-037 | [kuse-ai/kuse_cowork](https://github.com/kuse-ai/kuse_cowork) | Collaborative agent workspace, artifact management and multi-step productivity workflows | Queued |
| REA-038 | [dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill) | Design-system guidance, UI review heuristics and reusable design skills | Queued |
| REA-039 | [Karenina-na/Claude-Desktop](https://github.com/Karenina-na/Claude-Desktop) | Verify provenance and license; inspect desktop shell and app integration patterns | Queued |
| REA-040 | [AlexGladkov/claude-in-mobile](https://github.com/AlexGladkov/claude-in-mobile) | Mobile access, remote session UX and platform constraints | Queued |

## B. OpenAI SDKs, agents, and model interoperability

| ID | Repository | Initial research focus | Status |
|---|---|---|---|
| REA-041 | [openai/openai-cookbook](https://github.com/openai/openai-cookbook) | Official API recipes, tool use, structured output, multimodal workflows and evaluation examples | Queued |
| REA-042 | [openai/openai-python](https://github.com/openai/openai-python) | Official Python SDK, retries, streaming, typed responses, errors and API patterns | Queued |
| REA-043 | [betalgo/openai](https://github.com/betalgo/openai) | .NET SDK integration and provider abstraction; verify API coverage and license | Queued |
| REA-044 | [MacPaw/OpenAI](https://github.com/MacPaw/OpenAI) | Swift SDK integration and Apple-platform API patterns; verify maintenance and compatibility | Queued |
| REA-045 | [openai/openai-agents-python](https://github.com/openai/openai-agents-python) | Agents, handoffs, tools, guardrails, sessions, tracing, voice and sandboxed execution | Queued |
| REA-046 | [PublicAffairs/openai-gemini](https://github.com/PublicAffairs/openai-gemini) | Verify project scope and license; assess cross-provider API compatibility | Queued |
| REA-047 | [sashabaranov/go-openai](https://github.com/sashabaranov/go-openai) | Go SDK patterns, streaming and error handling | Queued |
| REA-048 | [TheoKanning/openai-java](https://github.com/TheoKanning/openai-java) | Java SDK patterns and compatibility; verify current maintenance | Queued |
| REA-049 | [ConnectAI-E/feishu-openai](https://github.com/ConnectAI-E/feishu-openai) | Feishu/Lark bot integration, message workflows and external assistant channels | Queued |

## C. Google, identity, APIs, Workspace, maps, and Firebase

| ID | Repository | Initial research focus | Status |
|---|---|---|---|
| REA-050 | [googleapis/googleapis](https://github.com/googleapis/googleapis) | API protobuf definitions, service contracts and generated client conventions | Queued |
| REA-051 | [gaowanlu/google](https://github.com/gaowanlu/google) | Verify repository identity, scope, license and relevance before further analysis | Queued |
| REA-052 | [google-research/google-research](https://github.com/google-research/google-research) | Research implementations and potentially relevant algorithms; screen each project individually | Queued |
| REA-053 | [googlesamples/google-services](https://github.com/googlesamples/google-services) | Google service integration examples and app configuration patterns | Queued |
| REA-054 | [Ponderfly/GoogleTranslateIpCheck](https://github.com/Ponderfly/GoogleTranslateIpCheck) | Network diagnostic purpose, maintenance and legal/acceptable-use constraints; do not build circumvention into Angel | Queued |
| REA-055 | [googleapis/google-api-php-client](https://github.com/googleapis/google-api-php-client) | PHP API client patterns, OAuth and service integration | Queued |
| REA-056 | [google/skills](https://github.com/google/skills) | Verify official scope, skill format and reusable workflow definitions | Queued |
| REA-057 | [wong2/chatgpt-google-extension](https://github.com/wong2/chatgpt-google-extension) | Browser extension UX, search-page integration and browser permission requirements | Queued |
| REA-058 | [googleapis/google-api-python-client](https://github.com/googleapis/google-api-python-client) | Python client generation, service APIs, credentials and retries | Queued |
| REA-059 | [googleapis/google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client) | Node.js Google API clients, OAuth and service integration | Queued |
| REA-060 | [first20hours/google-10000-english](https://github.com/first20hours/google-10000-english) | Language-resource provenance, vocabulary data format and potential language-learning utility | Queued |
| REA-061 | [mxrch/GHunt](https://github.com/mxrch/GHunt) | OSINT capability and privacy review; only lawful, consent-based, non-invasive uses | Queued |
| REA-062 | [justjavac/google-ips](https://github.com/justjavac/google-ips) | Network data provenance, staleness and safe diagnostics; no assumptions that IP lists are authoritative | Queued |
| REA-063 | [wstrange/GoogleAuth](https://github.com/wstrange/GoogleAuth) | TOTP authentication implementation, secrets lifecycle, recovery and security tests | Queued |
| REA-064 | [react-native-google-signin/google-signin](https://github.com/react-native-google-signin/google-signin) | Native Google sign-in flow, platform setup, token handling and session behavior | Queued |
| REA-065 | [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper) | Maps data collection patterns, terms/robots/privacy constraints and lawful alternatives | Queued |
| REA-066 | [protocolbuffers/protobuf](https://github.com/protocolbuffers/protobuf) | Serialization, schema compatibility and API contracts | Queued |
| REA-067 | [googleapis/google-api-go-client](https://github.com/googleapis/google-api-go-client) | Go service clients, OAuth and API error handling | Queued |
| REA-068 | [taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) | Google Workspace tools, OAuth, Gmail/Drive/Calendar/Docs/Sheets and MCP permission model | Queued |
| REA-069 | [google/google-ctf](https://github.com/google/google-ctf) | Educational security challenges only; use isolated labs and authorized test environments | Queued |
| REA-070 | [tomchentw/react-google-maps](https://github.com/tomchentw/react-google-maps) | React map components and map integration patterns; check maintenance and modern alternatives | Queued |
| REA-071 | [antonioribeiro/google2fa](https://github.com/antonioribeiro/google2fa) | PHP TOTP/2FA flows, QR enrollment, recovery and validation | Queued |
| REA-072 | [googleads/googleads-mobile-android-examples](https://github.com/googleads/googleads-mobile-android-examples) | Mobile ad SDK examples, consent, configuration and platform integration; not core assistant priority | Queued |
| REA-073 | [googleapis/google-cloud-java](https://github.com/googleapis/google-cloud-java) | Google Cloud Java clients, authentication, retries and service integration | Queued |
| REA-074 | [angular-ui/angular-google-maps](https://github.com/angular-ui/angular-google-maps) | Angular map integration patterns; legacy compatibility and modern alternatives | Queued |
| REA-075 | [firebase/flutterfire](https://github.com/firebase/flutterfire) | Flutter Firebase plugins, auth, messaging, database and cross-platform integration | Queued |

## D. Count and tracking

- Total supplied target repositories including REA: **75**.
- Research begins with a representative sample, then proceeds by capability family and dependency order.
- This inventory records links and research questions only. It does not imply that all repositories were opened, their code inspected, or their functions verified.
- If any URL redirects, is unavailable, is a fork/mirror, or has an incompatible license, record that before proceeding.
- New website URLs use the same process and are added to this inventory under a separate website-target section with a stable ID.
