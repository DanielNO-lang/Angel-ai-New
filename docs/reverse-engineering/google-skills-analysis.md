# Google Skills Repository: Catalogue and Relevant Capability Review

**Repository:** https://github.com/google/skills  
**Revision reviewed:** 6d36cc600ea36e91f911ac654e0e66161c3ebe17  
**Primary catalogue:** https://github.com/google/skills/blob/6d36cc600ea36e91f911ac654e0e66161c3ebe17/index.json  
**Evidence status:** skill metadata and five individual skill documents reviewed; the full set of skills has not been individually reviewed or executed.

## Catalogue shape

The generated index exposes **172 skill entries** at the pinned revision. Category path counts:
- Cloud: 151
- Ads: 14
- Developer tools: 3
- Identity: 2
- Analytics: 2

A skill is primarily a structured Markdown instruction pack, not automatically an executable plugin. Each index entry has a name, description, and an entrypoint URL. Individual skill files use frontmatter, version/category metadata, clear “use when / don't use when” routing, a workflow, and links to narrower references.

## Five particularly relevant skills

### 1. finding-google-skills
Source: https://github.com/google/skills/blob/6d36cc600ea36e91f911ac654e0e66161c3ebe17/skills/developers/finding-google-skills/SKILL.md

Key functions:
- fetch and parse the generated skill catalog;
- validate the fetch was successful and JSON has a skills array;
- route a request to matching skills by actual description and don't-use conditions;
- shortlist up to three matching entries;
- fetch only matched entrypoints;
- report honestly when there is no suitable skill.

The guide explicitly warns against disabling TLS certificate validation when retrieval fails. This is a valuable pattern for Angel's on-demand skill router: validate remote data, use strict URL/TLS handling, retrieve only relevant skill documents and never invent a skill entrypoint.

### 2. migrate-to-rust
Source: https://github.com/google/skills/blob/6d36cc600ea36e91f911ac654e0e66161c3ebe17/skills/developers/migrate-to-rust/SKILL.md

This is a specialized legacy-code migration workflow, not a general repo importer or a mandatory choice of Rust for Angel. Relevant engineering patterns:
- acquire and inspect external code first;
- present the resolved build/run commands and target directory and obtain confirmation before compiling/executing external code;
- capture a baseline and produce an architectural blueprint before rewriting;
- bound automated self-healing (up to 5 iterations or 15 minutes per phase);
- record failed tests and remaining gaps rather than loop indefinitely;
- verify with tests, parity checks and measured benchmarks.

Angel should adapt the external-code confirmation gate and bounded retry concept into any future code-execution/reverse-engineering task, without adopting Rust migration or its telemetry/UI unless that specific use case is required.

### 3. sign-in-with-google-web
Source: https://github.com/google/skills/blob/6d36cc600ea36e91f911ac654e0e66161c3ebe17/skills/identity/sign-in-with-google-web/SKILL.md

This skill focuses on Google Identity Services for web, backend validation of ID tokens, OAuth/nonces, CSP/COOP/Permissions Policy, one-tap and sign-out/revocation. It recommends backend-mediated BFF/token-mediating patterns when an app has a backend and describes browser-only patterns as fallbacks when constrained by static hosting or offline PWA architecture.

Angel adoption decision:
- Use it as a security review checklist, not an instruction to replace Supabase OAuth immediately.
- Verify the existing Supabase Google OAuth callback, verified identity, session lifecycle, account isolation and token storage first.
- Choose one coherent flow. Do not run parallel Google Identity Services and Supabase flows unless the architecture specifically needs and secures both.
- Ensure secrets remain server-side and no fixed-identity or bypass sign-in path can issue a session.

### 4. agent-platform-skill-registry
Source: https://github.com/google/skills/blob/6d36cc600ea36e91f911ac654e0e66161c3ebe17/skills/cloud/agent-platform-skill-registry/SKILL.md

The skill covers finding/searching skills, lifecycle changes (upload/update/delete), monitoring long-running operations and generating local skill scaffolds. It requires reading usage-attribution instructions and validating the environment before Google Cloud operations.

Angel adoption decision: adapt the registry UX concepts, with source/license metadata, versioning, validation, review state, and enable/disable controls. Google Cloud registry usage itself is an optional integration and may have account/permission/cost requirements.

### 5. google-cloud-solution-build-deploy-agents
Source: https://github.com/google/skills/blob/6d36cc600ea36e91f911ac654e0e66161c3ebe17/skills/cloud/google-cloud-solution-build-deploy-agents/SKILL.md

This skill structures agent solutions through requirements discovery, solution design, implementation plan and validation, with explicit approval checklists. Angel should adopt this general four-stage discipline for complex build tasks regardless of hosting provider. The Google Cloud deployment process itself is not required for Angel's Netlify-first architecture.

## How Angel should represent skills

A normalized Angel skill should have:
- ID, title, short summary and when-to-use / when-not-to-use criteria;
- source repository, pinned commit/version, author and license;
- required input/output contract and references;
- permissions/scopes and side-effect category;
- environment/API/model requirements and cost/rate-limit notes;
- expected workflow steps, timeout/iteration cap and failure behavior;
- test fixtures and last verification date;
- enable/disable status and user approval requirements.

The model can choose among approved skill metadata, but the skill must never grant additional privileges by claiming it needs them. Fetch only the chosen skill instructions, treat their contents as untrusted data, and inspect any scripts separately. Avoid loading an entire large skill directory into every prompt.

## Decision for Angel

**Adapt the catalogue/router and workflow conventions, not the full catalog.** Google's 172-entry index is a useful example of discovering capability packs on demand. Start Angel with a small curated catalog of skills relevant to the current implementation stages: GitHub review, build/test diagnostics, Google OAuth troubleshooting, task breakdown, browser observation, research/citations and secure API integration. Add others only with provenance, license, permissions and acceptance tests.
