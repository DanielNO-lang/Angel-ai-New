# REA-driven capability research for Angel AI

**Branch:** `research/rea-capability-reverse-engineering`  
**Status:** First-pass README capability review documented for the supplied target set; deeper source, dependency, test, license, and runtime audits remain pending. REA execution is still pending.  
**Production:** No deployment. No changes to Angel's production deployment configuration.

## Objective

Use [REA (Reverse Engineer Anything)](https://github.com/morluto/rea) as a research aid to study the externally observable behavior, architecture, documented APIs, feature sets, and public implementation details of the supplied repositories and, later, supplied website URLs. Convert findings into original, evidence-backed capability specifications for Angel AI. Implement those specifications one at a time in Angel after review and prioritization.

This is not a plan to copy whole repositories into Angel. For each target, record:
- Verified capabilities and the source evidence (README/docs/source paths and URLs).
- User-facing workflows and important edge cases.
- Architecture and integration points at a high level.
- License, attribution, dependency, privacy, security, and operating-cost considerations.
- A proposed Angel capability, acceptance criteria, test plan, and implementation stage.
- Confidence and unresolved questions.

## REA: intended role and current limitation

REA describes itself as an agent/MCP toolkit for reverse engineering websites, JavaScript/Electron apps, .NET assemblies, native binaries, and runtime behavior, with evidence and limitations attached to conclusions. It can support static and dynamic analysis depending on the target and installed analysis engines.

Official sources:
- Repository: https://github.com/morluto/rea
- Website and guides: https://rea.tools/
- Setup guide: https://github.com/morluto/rea/blob/main/docs/installation.md
- MCP tool catalog: https://github.com/morluto/rea/blob/main/docs/mcp-contracts.md

**Execution status:** This branch was created using GitHub's connected repository operations. REA has not been installed or run in this environment. Reading public GitHub files is not the same as executing REA against a live site, local application, or binary. A full REA run requires a configured local agent/MCP environment and, for some native targets, the appropriate analysis engine. Do not claim a target has been reverse-engineered until its evidence is actually collected.

## Target types: repository and website URLs

The future research intake must accept:
1. GitHub repository URL, including `.git` URLs.
2. A public website URL.
3. Public documentation/API reference URLs.
4. Where lawful and authorized, a user-provided app/package/build or local application for REA-supported analysis.

For websites, record pages and interactions actually observed. Do not infer private backend code from frontend behavior. For repositories, inspect license, README, docs, source layout, tests, examples, release history, and security boundaries.

## Research pipeline

1. **Resolve and validate URL**: canonicalize the URL, identify owner/project, default branch, license, archive status, and target type.
2. **Scope**: determine the relevant product behavior and what is in/out of scope.
3. **Collect evidence**: official README/docs, public source, tests, examples, changelog, and REA outputs where available.
4. **Map capabilities**: break into user journeys, APIs, models, tools, state, permissions, errors, and dependencies.
5. **Evaluate reuse**: compatible license, code provenance, maintenance, security, resource needs, and vendor lock-in.
6. **Write an evidence report**: include source links, observed facts, hypotheses, confidence, and limitations.
7. **Translate to Angel**: propose an independent design and integration contract, not a blind copy.
8. **Prioritize**: map the work to Angel's existing roadmap stages.
9. **Implement separately**: one feature per task/branch with tests and explicit completion status.
10. **Review and merge**: no production deployment unless Danny explicitly authorizes it.

## Research output format

Each target gets a report under `docs/reverse-engineering/reports/<owner>--<repo>.md` containing:
- Target and date checked
- License and provenance notes
- Product summary
- Verified key functions
- Main workflows and edge cases
- Architecture and dependencies (high-level)
- Relevant source paths / documentation links
- REA evidence, if actually run
- Angel adaptation proposal
- Risks and constraints
- Acceptance criteria and tests
- Confidence: high / medium / low
- Status: queued / inspecting / evidence collected / reviewed / ready for implementation / implemented / tested

## Guardrails

- Analyze only public material or systems the user is authorized to inspect.
- Do not bypass authentication, paywalls, anti-abuse controls, or access restrictions.
- Do not collect or expose personal data, credentials, tokens, or private account information.
- Security and OSINT-related repositories are assessed for safe, authorized uses only.
- Follow each target's license and notices; prefer clean-room behavioral specifications where licensing is uncertain.
- Never commit API keys, OAuth secrets, downloaded proprietary datasets, model weights, or large generated artifacts.
- Never label a feature implemented or tested without evidence.
- Keep this research branch isolated from `main`; do not deploy.

## Initial priorities

1. Validate REA setup and produce a first evidence report using a small representative sample.
2. Agent orchestration and task execution: Google ADK, OpenAI Agents SDK, Claude Code-related public projects, MCP frameworks.
3. Google identity and Workspace integrations: Google sign-in, API clients, Firebase/FlutterFire, Workspace MCP.
4. Developer workflow and skills: coding agents, skill catalogs, task managers, review tools.
5. Multimodal and model infrastructure: translation, image generation, model optimization, GPU operator.
6. Remaining SDKs, examples, utilities, and research collections.
7. Public website URLs submitted later, using the same intake/report structure.

## Reports and current output

- [Target inventory](./TARGET_INVENTORY.md)
- [REA documentation review](./reports/morluto--rea.md)
- [First-pass capability map](./FIRST_PASS_CAPABILITY_MAP.md)
- [Audit 01: Models, agents, and engineering](./reports/01-models-agents-and-engineering.md)
- [Audit 02: Google APIs, identity, maps, and data](./reports/02-google-apis-identity-and-data.md)
- [Audit 03: Claude ecosystem, desktop/mobile, workflows, and remaining SDKs](./reports/03-claude-ecosystem-and-apps.md)
- [Angel adoption plan and priorities](./ANGEL_ADOPTION_PLAN.md)

The three capability audits summarize documented capabilities and Angel adaptation recommendations. Three repository README fetches returned 404 in this pass and are marked unresolved in the adoption plan. Ponderfly/GoogleTranslateIpCheck is discussed in the adoption plan as a network-diagnostics utility. These are documentary findings, not a complete source-level reverse-engineering run.

## Initial decision

Do not add all targets as runtime dependencies. Treat this as a **capability research program**. Select only useful, legally compatible, supportable capabilities for Angel after evidence review.
