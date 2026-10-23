# Audit 05: Public AI products, creative studios, HubMind, and Microsoft ecosystem

**Checked:** 2026-10-23  
**Branch:** `research/rea-capability-reverse-engineering`  
**Status:** Public-surface and official-documentation review. This is not a private-backend audit, account-level feature test, or REA execution.  
**Deployment:** No application changes, merge, or deployment.

## Scope and evidence rules

The supplied URLs are hosted products, not necessarily open-source repositories. Public pages and official documentation can establish advertised workflows and integration surfaces; they do not reveal proprietary model weights, private prompts, server implementation, internal ranking systems, or unexposed APIs. This report therefore separates product-pattern recommendations from code that could legally be reused.

## Executive recommendation

Use these products as **capability benchmarks**, not as dependencies to copy. Angel should provide one coherent interface with a provider-neutral model gateway, permissioned connectors, reusable skills, a persistent project/task layer, source-grounded research, and a unified creative workspace.

Priority order:
1. **P0:** secure provider gateway, provider capability matrix, budget/usage controls, user-visible task status, and auditable permissions.
2. **P1:** deep research with citations; project workspaces; document/file analysis; reusable artifacts; Google/Microsoft connectors through OAuth; tool approval and structured results.
3. **P1/P2:** multimodal creative studio for image generation/editing and video storyboards, using official APIs or explicitly launched external services.
4. **P2:** model-comparison/arena workflow and model-quality evaluations, with blind pairwise comparison and repeatable test sets.
5. **Research only:** HubMind-like company knowledge and workflow agents until the exact HubMind product URL is confirmed and public implementation/integration details are inspected.

## Product-by-product review

### 1. ChatGPT — https://chatgpt.com

**Public capability evidence:** OpenAI documents conversational writing/reasoning, web search, multi-step deep research with citations, image understanding/generation/editing, file and audio uploads, data analysis, voice, memory, projects, scheduled tasks, and custom assistants. Connected apps can search/reference external data, participate in research, show rich interactive results, and perform supported actions subject to plan, account, and permission availability. See [capabilities overview](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview) and [connected apps](https://help.openai.com/en/articles/11487775-connected-apps-in-chatgpt).

**Patterns for Angel:**
- Project workspaces with pinned instructions, files, and persistent task context.
- Research mode that searches multiple sources, tracks claims to citations, and returns an evidence-based report.
- Data-analysis jobs with explicit inputs, generated files/charts, and downloadable outputs.
- A task scheduler with one-time/recurring jobs, visible execution history, and notification settings.
- A connector registry separating search/read permissions from write/action permissions.
- Voice conversations that can invoke approved tools and show the action/approval status.

**Do not assume:** Every feature is available to every plan, region, account, or API. The website product's features do not automatically exist in the public API or carry over to Angel. Implement via supported APIs/connectors, not web scraping or account-cookie reuse.

### 2. Claude — https://claude.ai

**Public capability evidence:** Anthropic documents multi-step Research that performs follow-up searches and returns citations, plus Artifacts that present substantial standalone documents, code, websites, diagrams, visualizations, and interactive React components in a separate editable space. Artifact versions and sharing are part of the workflow. Sources: [Research](https://support.anthropic.com/en/articles/11088861-using-research-on-claude), [Artifacts](https://support.anthropic.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them), [artifact sharing](https://support.anthropic.com/en/articles/9547008-discovering-publishing-customizing-and-sharing-artifacts).

**Patterns for Angel:**
- An artifact canvas beside chat for documents, code, diagrams, interactive previews, and generated assets.
- Version history with explicit diff/restore rather than replacing work silently.
- Research plans with progressive discovery, citation checking, and clear unknowns.
- A skills catalog for repeatable knowledge-work flows, each with permissions and provenance.

**Constraints:** Treat Claude consumer features and API capabilities as different surfaces. Do not copy proprietary UI/source or rely on undocumented endpoints. Shared artifacts and third-party tools need separate permission, storage, and data-handling rules.

### 3. Gemini — https://gemini.google.com

**Research scope:** Treat Gemini as the consumer assistant surface and the Gemini API/Google Workspace as separate integration surfaces. The API supports official model endpoints and multimodal input/output according to model-specific capability metadata. Google APIs and Workspace integrations must use the appropriate consented OAuth scopes.

**Patterns for Angel:**
- Native multimodal input and model routing by task type.
- Google account/Workspace connection as a user-controlled connector, not implicit access.
- Model-specific capability registry so Angel knows which models support images, audio, video, tool calls, search grounding, or structured output.
- A creative workflow that moves from prompt to generated image/video and then to editable project assets.

**Constraints:** Do not infer a consumer Gemini subscription grants API access or that every model/API feature is free. Verify current API pricing, data-use settings, regional availability, and OAuth scopes before implementation.

### 4. Arena — http://arena.ai

**Public surface and open code:** Arena is a community-driven model evaluation and comparison service. Its public GitHub organization includes projects such as [arena-hard-auto](https://github.com/lmarena/arena-hard-auto), [copilot-arena](https://github.com/lmarena/copilot-arena), [p2l](https://github.com/lmarena/p2l), [arena-rank](https://github.com/lmarena/arena-rank), and [search-arena](https://github.com/lmarena/search-arena). The organization describes its purpose as community-driven evaluation; see [Arena GitHub organization](https://github.com/lmarena).

**Patterns for Angel:**
- Blind A/B output comparison with model identity hidden until a vote.
- Repeatable task suites covering Angel's actual use cases: coding fixes, factual research, image prompts, teaching materials, voice transcripts, and long-context tasks.
- Separate scores for correctness, citation quality, instruction following, latency, cost, safety, and user preference.
- Keep human preference rankings separate from benchmark correctness; avoid declaring a universal “best model.”

**Constraints:** Benchmark methodology, sampling, model versions, and contamination matter. Use official model access and respect provider terms; do not automate abuse of public consumer sites.

### 5. Perplexity — https://www.perplexity.ai

**Research scope:** Benchmark its search-first answer experience, source citations, iterative research, and topic/workspace organization. For Angel, the valuable abstraction is not a clone of its UI, but a reliable retrieval-and-synthesis pipeline.

**Patterns for Angel:**
- Search query planning, multi-source retrieval, source deduplication, claim-to-source mapping, and citation verification.
- Source cards with publication dates, domains, and an explicit “what this source supports” summary.
- Separate web-grounded facts from model-generated inference.
- Research artifacts that preserve the search trail and can be resumed or exported.

**Constraints:** Confirm current product/API features in official documentation before choosing an integration. Do not rely on undocumented endpoints or scrape authenticated pages. Source citations must remain attached to the claims they support.

### 6. Nano Banana — https://nanobanana.io and official Gemini image-generation API

**Identity caution:** The supplied standalone domain `nanobanana.io` is not, by itself, proof of an official Google service. Google's official developer documentation calls Nano Banana the Gemini native image-generation capability and lists model-specific endpoints, including newer high-efficiency and Pro variants. Official docs: [image generation](https://ai.google.dev/gemini-api/docs/image-generation) and [model list](https://ai.google.dev/gemini-api/docs/models.md).

**Patterns for Angel:**
- Prompt-to-image and conversational image editing with multi-turn continuity.
- Reference-image conditioning, composition/typography support, multiple aspect ratios, and quality/cost tier selection.
- A media asset library recording prompt, model/version, dimensions, generation time, and provenance.
- Separate image generation from image analysis and from image-to-video workflows.

**Constraints:** Official API availability, pricing, data-use terms, model IDs, resolution limits, and watermark/provenance behavior change over time. Benchmark output quality and cost using official endpoints. Do not send private images to an unverified third-party domain.

### 7. Google Flow — https://flow.google.com

**Research scope:** Treat Flow as a creative video/filmmaking benchmark. Focus on scene/storyboard organization, reference assets, shot continuity, generation iteration, and asset management rather than assuming the website exposes a reusable API.

**Patterns for Angel:**
- A media project with scenes, shot descriptions, aspect ratio, reference images, prompt versions, and output assets.
- Storyboard-first planning, then generation, review, and regeneration of selected shots.
- Preserve continuity metadata and version relationships between clips.
- Let users approve generated assets before publishing or sharing them.

**Constraints:** Flow website access, product entitlements, regional availability, and API availability are distinct. If no supported API exists for a desired operation, provide an external-service handoff instead of browser automation that bypasses access controls.

### 8. Google Labs — https://labs.google

**Research scope:** Google Labs is a changing collection of experiments rather than one stable API. Use it as a discovery source for interaction patterns and experimental creative tools, not as a single integration target.

**Patterns for Angel:**
- A curated “experiments” directory with provider, capability, maturity, privacy notes, and last-checked date.
- Separate experimental prototypes from stable Angel features.
- A feature-flagged evaluation lane for new model capabilities, with explicit user opt-in and rollback.

**Constraints:** Individual experiments can be retired, region-limited, or subject to separate terms. Re-check the specific experiment's current official page before relying on it.

## 9. HubMind: identity must be resolved before adoption

The phrase “HubMind on Netlify” is ambiguous. Search surfaced several different entities:
- [HubMind Australia](https://hubmind.com.au/), describing a managed AI operating layer for established Australian businesses: company knowledge, connected business systems, role-limited “AI employees,” monitoring, and audit trails.
- [HubMind AI Gateway](https://aigateway.hubmind.app/), describing a separate API credential-proxy product with a free tier, encrypted secret vault, capability URLs, scoped bearer tokens, audit logs, pending approvals, quotas, manifests, and MCP compatibility.
- [Hu-mind.ai](https://www.hu-mind.ai/), describing AI teammates for VLSI/chip-design teams.

These are not evidence of an upcoming product deployed on Netlify. The exact Netlify site, GitHub repository, or owner-provided link is still needed to identify the intended HubMind. Do not conflate these products or assume shared ownership.

**Useful design patterns if the intended product resembles an AI operating layer:**
- Shared knowledge base with provenance, access-aware retrieval, and tenant separation.
- Connectors to existing tools instead of replacing them.
- Narrow, role-scoped workflow agents with audit trails.
- Secret injection at a trusted server boundary, revocable scoped tokens, per-tool quotas, and human approval for sensitive actions.
- Operational dashboards for task outcomes, usage, failures, and ROI.

**Gateway caution:** A capability URL is itself a sensitive credential if possession grants access. Require strong entropy, revocation, expiration where appropriate, rate limiting, scope restrictions, and log redaction. Verify the gateway's threat model, data retention, encryption, implementation license, deployment model, and independent security posture before storing Angel credentials in it. Angel should first implement these patterns internally with the existing Netlify/Supabase architecture rather than adopting an unknown gateway blindly.

## 10. Microsoft apps and ecosystem

The term “Microsoft package” may refer to Microsoft 365 apps, Microsoft Graph, Teams/Outlook/OneDrive/SharePoint, or the Microsoft 365 Agent SDK. The most reusable public code entry point found is [microsoft/Agents](https://github.com/microsoft/Agents), an MIT-licensed SDK family for full-stack, multi-channel agents across Microsoft 365, Teams, Copilot Studio, and web chat. It is model-agnostic and points to C#, JavaScript, and Python implementations.

**Recommended integration order:**
1. Microsoft identity/OAuth and a read-only Microsoft Graph connector.
2. Outlook mail/calendar and OneDrive/SharePoint file search, each with narrow scopes and per-connector consent.
3. Teams messaging/meeting context only where the user authorizes access and the API/tenant permits it.
4. Create/update operations only after preview and explicit confirmation.
5. Consider the Microsoft 365 Agent SDK only if Angel needs to publish an agent into Teams/Microsoft 365. It is not required just to call Graph from Angel.

**Constraints:** Some Microsoft 365 capabilities require a tenant, administrator consent, eligible license, or paid service. Do not make a Microsoft/Azure dependency mandatory for Angel's core runtime. Keep a provider-neutral connector interface.

## Additional ecosystem candidates to review next

These are candidates for the next repository-level audit, not yet adopted:
- [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli): coding-agent tool loop, context, tool execution, and extension mechanisms.
- [anthropics/skills](https://github.com/anthropics/skills): portable skill format and examples.
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official): curated plugin packaging and review conventions.
- [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins): domain-specific knowledge-work workflows.
- [microsoft/Agents](https://github.com/microsoft/Agents): Microsoft 365 agent SDK and channel support.
- [microsoft/agent-framework](https://github.com/microsoft/agent-framework): Microsoft agent orchestration and workflow concepts; verify current repo identity and maturity.
- [microsoftgraph/msgraph-sdk-javascript](https://github.com/microsoftgraph/msgraph-sdk-javascript): official JavaScript Graph client.
- [microsoft/semantic-kernel](https://github.com/microsoft/semantic-kernel): orchestration and connector patterns; evaluate runtime fit before adoption.
- [google-gemini/gemini-api-quickstart](https://github.com/google-gemini/gemini-api-quickstart): official API usage patterns.
- [google/adk-web](https://github.com/google/adk-web): agent development UI, if current public repository and license verify.
- [lmarena/arena-rank](https://github.com/lmarena/arena-rank): model preference-ranking methodology.
- [lmarena/arena-hard-auto](https://github.com/lmarena/arena-hard-auto): automatic benchmark methodology.

Repository names, licenses, and maintenance must be rechecked from their own files before reuse. No repository code has been copied into Angel.

## Suggested Angel feature blueprint

### Unified Workbench
- Chat, research, project files, tasks, artifacts, and media projects share a common workspace.
- Provider/model selector is optional; Angel chooses by capability, budget, latency, and quality when allowed.
- Every tool call has a typed input/output contract, scope, risk tier, timeout, and audit event.

### Research engine
- Plan → search → extract → compare → cite → verify → report.
- Keep source URL, capture date, source snippet, and claim linkage.
- Distinguish supported facts, interpretation, and unanswered questions.

### Creative studio
- Image generation/editing adapter, then video/storyboard adapter.
- Asset library with prompt/version/model/provenance metadata.
- No claim of a working provider until integration and quality/cost tests pass.

### Connector marketplace
- Google Workspace and Microsoft Graph first; later GitHub, calendar, storage, and other apps.
- Least privilege, clear connection status, per-connector disconnect/revoke, and approval for side effects.
- Skills and connectors remain separate: a skill describes a workflow; a connector grants access to a service.

### Model evaluation
- Internal blind comparison, test prompts, repeatable scoring, latency/cost tracking, and opt-in user ratings.
- Use Arena's public methodology as research, not as an endorsement or a claim that its rankings transfer directly to Angel.

## Acceptance criteria before implementation

- Each provider has capability metadata, server-side secret handling, timeouts, cancellation, and usage accounting.
- Search/research claims link to sources and are validated against retrieved content.
- Read and write scopes are distinct; sensitive writes require confirmation.
- User can inspect, export, restore, or delete generated artifacts and their metadata.
- Model comparison records model/version, task, rubric, and evaluation date.
- Media outputs retain provider/provenance details and are not represented as guaranteed accurate.
- HubMind identity is confirmed before any connector, credential, or code reuse decision.
- Microsoft/Google connectors are optional and do not block sign-in or core chat.
- Every feature status says one of: proposed, implemented, tested, or awaiting configuration; no status is inferred from a mock UI.

## Confidence and limitations

- **High confidence:** official documentation describes the cited ChatGPT, Claude Artifacts/Research, Gemini image-generation, Arena public repository organization, Microsoft Agents SDK, Netlify AI Gateway/Agent Runners surfaces.
- **Medium confidence:** product-pattern recommendations derived from public descriptions and official help pages.
- **Low/unresolved:** the identity of the user-intended “upcoming AI on Netlify called HubMind”; standalone `nanobanana.io` relationship to Google; exact live feature availability for every region/account/plan; current API availability for Flow and Labs experiments.
- **Not done:** login-based UI testing, account creation, network interception, private-backend analysis, full source/license audit of the additional repositories, REA execution, or any code implementation.


## 11. Netlify's own AI Gateway and Agent Runners

Official docs: [AI Gateway overview](https://docs.netlify.com/build/ai-gateway/overview/) and [Build with AI](https://docs.netlify.com/build/build-with-ai/overview/).

Netlify documents an AI Gateway that can route supported official OpenAI, Anthropic, Gemini and other model calls from Netlify compute, provide usage analytics, and support rate limiting. Its documentation states that AI Gateway requires at least one production deployment on the site. Netlify Agent Runners are a separate developer workflow for asking agents such as Claude, Gemini, Codex or OpenCode to modify projects and then reviewing a Deploy Preview before production changes.

**Angel recommendation:**
- Keep this as a candidate provider gateway, not a prerequisite.
- Since production deployment is explicitly paused, do not deploy merely to unlock this feature. First finish the current research and verify account/plan eligibility, pricing, provider/model availability, rate limits, data handling, and whether the gateway fits Angel's existing serverless API.
- If evaluated later, use server-side calls only, configure per-user/account rate limits, track spend/usage, and keep a fallback adapter so Angel is not locked to one host.
- Agent Runners may help with future repository maintenance, but no agent-generated change should bypass review, tests, branch protections, or the user's no-deploy instruction.

This is based on current public Netlify documentation, not a test in Angel's Netlify account. No Netlify settings or deployment were changed.
