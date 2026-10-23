# Audit 06: Open-source repository shortlist for AI products, Microsoft apps, and creative workflows

**Checked:** 2026-10-23  
**Branch:** `research/rea-capability-reverse-engineering`  
**Status:** Initial public repository shortlist and documented capability scan. Source-level manifests/tests/licenses still require confirmation before reuse. No production changes.

## Purpose

The prior product review found that the public AI websites are not themselves open-source packages. This report identifies public repositories that may offer implementable patterns for Angel: agent tools, skills, Microsoft integrations, Gemini, and model evaluation. A public repository is not automatically “free to run”: API calls, hosted models, cloud infrastructure, and some downstream integrations may still cost money.

## Highest-priority candidates

### A. Agent and skill ecosystems

1. **[anthropics/skills](https://github.com/anthropics/skills)**  
   Research: reusable skill packaging, instruction files, resource layout, and examples.  
   Angel adaptation: a provider-neutral skill manifest with name, version, source, license, triggers, input/output schema, required tools/scopes, risk tier, tests, and rollback. Treat skill content as untrusted instructions; it cannot grant itself new permissions.

2. **[anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)**  
   Research: curated plugin discovery, metadata, packaging, review conventions, and versioning.  
   Angel adaptation: reviewed marketplace entries, provenance, changelog, compatibility, install/uninstall, and permission preview. Do not assume plugin code is portable to Angel without adaptation.

3. **[anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)**  
   Research: practical knowledge-work workflows for roles/domains.  
   Angel adaptation: user-selectable workflow packs for research, teaching, project management, document review, and planning. Keep workflow instructions separate from service credentials.

4. **[google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)**  
   Research: command-line agent loop, context management, tool execution, extension/configuration patterns, and developer ergonomics.  
   Angel adaptation: use as an architectural reference for bounded task execution and extensions; do not embed a terminal agent in the web app without a sandbox and explicit filesystem/network permissions.

### B. Microsoft ecosystem

5. **[microsoft/Agents](https://github.com/microsoft/Agents)**  
   Public README identifies this as an MIT-licensed Microsoft 365 Agent SDK family for full-stack, multi-channel agents, with JavaScript, Python, and .NET implementation repositories. It supports channels such as Microsoft 365, Teams, Copilot Studio, and web chat.  
   Angel adaptation: evaluate only if Angel needs to publish an agent into Microsoft channels. For access to user mail/files/calendar, Microsoft Graph is usually the more direct integration boundary.

6. **[microsoftgraph/msgraph-sdk-javascript](https://github.com/microsoftgraph/msgraph-sdk-javascript)**  
   Research: official JavaScript SDK for Microsoft Graph, authentication, request pipeline, pagination, and errors.  
   Angel adaptation: optional Microsoft connector for Outlook, calendar, OneDrive, SharePoint, and other Graph-supported services. Start read-only; separate scopes by service; write operations require preview and confirmation.

7. **[microsoft/semantic-kernel](https://github.com/microsoft/semantic-kernel)**  
   Research: orchestration, plugins/functions, planning patterns, memory/connectors, and provider abstractions.  
   Angel adaptation: borrow concepts selectively. Avoid adding a second competing orchestration framework if Angel's TypeScript runtime already covers workflows. Confirm runtime, license, maintenance, and dependency footprint first.

8. **[microsoft/agent-framework](https://github.com/microsoft/agent-framework)**  
   Research candidate for multi-agent orchestration and durable workflows.  
   Status: investigate repository identity, release maturity, language/runtime support, and current recommendations before making an architectural decision. Do not add it merely because it is Microsoft-branded.

### C. Google Gemini and media

9. **[google-gemini/gemini-api-quickstart](https://github.com/google-gemini/gemini-api-quickstart)**  
   Research: official API usage, SDK initialization, multimodal examples, and environment configuration.  
   Angel adaptation: provider adapter tests and example payloads. Secrets stay server-side; no example API key is committed.

10. **[google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)**  
    Also relevant for agent workflows; avoid duplicate implementation work by reviewing this once in the developer-agent track.

11. **Google Flow / Labs / Nano Banana**  
    The consumer sites are not themselves an open-source codebase. Prefer official API/SDK documentation where available; otherwise model them as external creative services with explicit account, availability, and pricing constraints. Do not scrape or automate logged-in websites as a substitute for supported APIs.

### D. Arena / evaluation

12. **[lmarena/arena-rank](https://github.com/lmarena/arena-rank)**  
    Research: public ranking methodology and statistical caveats.  
    Angel adaptation: internal blind preference tests and separate dimensions for correctness, citation quality, instruction-following, latency, and cost. Do not transplant public rankings as a universal score for Angel.

13. **[lmarena/arena-hard-auto](https://github.com/lmarena/arena-hard-auto)**  
    Research: automatic benchmark generation/evaluation patterns.  
    Angel adaptation: a repeatable regression suite for Angel's use cases. Verify dataset terms and avoid leaking private prompts or secrets.

14. **[lmarena/search-arena](https://github.com/lmarena/search-arena)**  
    Research: evaluation of search-augmented models.  
    Angel adaptation: benchmark retrieval relevance, citation support, freshness, and answer completeness independently.

15. **[lmarena/copilot-arena](https://github.com/lmarena/copilot-arena)** and **[lmarena/p2l](https://github.com/lmarena/p2l)**  
    Research: comparison/evaluation UI and prompt-to-leaderboard workflow patterns.  
    Angel adaptation: lightweight internal model arena, if test-set governance and repeatability can be maintained.

## Cross-cutting implementation recommendation

Do not integrate all repositories as runtime dependencies. Use this sequence:

1. **P0: internal contracts**: provider adapter, typed tools, skill manifest, permission/risk model, task state, usage budget, audit events.
2. **P1: connectors**: Google Workspace and Microsoft Graph read-only pilots; optional GitHub integration.
3. **P1: knowledge work**: curated skills and research workflows with provenance and acceptance tests.
4. **P2: creative models**: official Gemini image/video API adapters where supported, with quality/cost benchmarks.
5. **P2: evaluation harness**: blind A/B comparisons and regression tests.
6. **Later:** publish to Microsoft Teams/Copilot channels or add desktop-native execution only if there is a validated user need.

## Security and licensing gate

Before implementation, inspect each candidate's current LICENSE, NOTICE, dependency licenses, package manifests, test commands, release activity, security policy, and any external model/API terms. Confirm whether each repository is an SDK, a hosted product, a sample, or a full application. Do not copy source into Angel until license and attribution obligations are understood. A free license does not make an API free, and an open-source client does not confer access to proprietary consumer services.

## Test plan

- Skill manifest schema validation, signature/provenance, permissions preview, and rollback.
- Connector OAuth consent, minimum scopes, revocation, token expiry, and tenant/account isolation.
- Microsoft Graph read-only search and paging; safe failure for missing scopes and throttling.
- Gemini provider tests with mock responses, schema validation, cancellation, timeout, and budget enforcement.
- Model arena reproducibility: pinned model/version, fixed prompts, rubric, randomized blind display, saved votes, and no sensitive prompt logging.
- Research evaluation: source support per claim, citation validity, duplicate source handling, and clear unknowns.

## Limitations

This is a shortlist, not a complete audit of every candidate repository. No code has been copied or executed; no integration has been implemented or tested. REA has not been run. Proceed to source-level review only after each candidate is confirmed to be relevant and actively maintained.
