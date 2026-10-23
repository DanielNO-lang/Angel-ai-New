# Angel Reverse Engineering Workbench — Product and Architecture Specification

**Status:** proposed specification only; not implemented in the application  
**Owner product:** Angel AI  
**Research branch:** research/rea-reverse-engineering-catalog  
**Primary analysis reference:** https://github.com/morluto/rea  
**Purpose:** turn source repositories, public web pages and authorized application artifacts into evidence-backed feature dossiers that can be mapped to Angel's staged implementation plan.

## 1. Product purpose

The Reverse Engineering Workbench accepts a target and answers:
- What does it appear to do?
- Which functions/features are key?
- Where is each finding evidenced in source code, docs, tests or observed browser behavior?
- How do the components fit together?
- What permissions, credentials, dependencies, API calls, storage, costs and risks are involved?
- Which parts could improve Angel?
- What should Angel keep, adapt, defer or reject?
- What acceptance test would prove an adopted capability works?

A generated report must not pretend that code, execution or hidden backend behavior was inspected when only a README or a visible page was available.

## 2. Target input types

### A. GitHub repository URL
Examples: repository root, tree/folder URL, file URL, commit, pull request, release or a specific branch/ref.

The workbench should extract the owner/repository/path/ref, resolve default branch and target revision, collect metadata and license, then inspect the source tree. Pin every dossier to a commit SHA, not merely a floating main/master URL.

### B. Ordinary HTTP(S) website URL
A URL may point to a landing page, web application, documentation, demo, login page or a specific feature. The workbench should classify the URL and inspect only public content or content the user is authorized to access.

A web URL is not evidence of its server source code. It can expose observable routes, controls, page states, public assets and browser-visible request metadata. Hidden services, private endpoints and unobserved state remain unknown until appropriate source or authorized access is provided.

### C. GitHub files and documentation links
Analyze the selected artifact in parent-repository context and preserve file path, source revision and surrounding module relationship.

### D. Local application/artifact
When supported, accept a user-authorized project folder, extracted app bundle, package, script or binary. Route it to the REA workflow matching the artifact type. Never auto-execute an uploaded artifact just to read its contents.

### E. Lists and batches
Allow one or more targets to be queued, categorized, paused, resumed, retried and compared. The current 74-target catalogue should be the seed dataset for validation.

## 3. Target classifier and workflow routing

1. Normalize URL, canonicalize GitHub repository/path/ref and reject unsupported protocols.
2. Ask the user to identify ambiguous targets only when the difference affects the analysis. Otherwise infer target type and show the interpretation before risky access.
3. Run safe, read-only metadata and source inspection first.
4. Select analysis depth based on the target: README reconnaissance, source map, feature trace, browser observation, source-plus-runtime verification or artifact-level analysis.
5. Use REA for appropriate local artifacts and website/browser evidence when the required REA MCP/CLI environment is available.
6. Use GitHub source access for repositories and code paths. Do not pretend an REA browser capture replaces source review.
7. Keep each target's evidence and findings isolated from the others; cross-repository synthesis happens in a separate stage.

## 4. Analysis modes

### Mode 1: Repository reconnaissance
- metadata/default branch/commit;
- README, docs, license, package manifests, security policy, releases and maintenance signals;
- module/directory map;
- initial feature categories and candidate entry points;
- unknowns and next files to inspect.

### Mode 2: Function-level code trace
Choose one capability and trace:
1. UI/CLI/API entry point;
2. request/event/input schema;
3. orchestrator or controller;
4. service/tool invocation;
5. model/provider/API boundary;
6. persistence and side effects;
7. status/error/retry/cancel behavior;
8. tests and validation.

Output function names, source paths and relevant line ranges where available. For very large monorepos, analyze bounded features rather than claiming an exhaustive audit of every function.

### Mode 3: Website observation
Use a controlled browser, preferably a dedicated disposable profile. REA supports browser target discovery, page inspection, passive observation around user actions, screenshots, browser scenarios and capture comparison. Restrict allowed origins and retained artifacts.

A browser scenario must define its target, action steps, expected result, capture requirements and timeout. A screenshot alone does not prove an underlying API or workflow succeeded. Use page state, accessibility/DOM, route changes and permitted network metadata together.

### Mode 4: Security/license/dependency review
Inspect authentication and authorization, credential storage, privilege boundaries, dangerous tools, network access, sandboxing, dependencies, license obligations, external terms, telemetry, data retention and quota/cost behavior.

### Mode 5: Cross-target synthesis
Normalize feature names, identify duplicated projects or wrappers, group equivalent capabilities, record compatibility and conflict risk, and recommend one preferred candidate per Angel capability.

## 5. Evidence model

Every finding must include:
- evidence ID;
- target ID and pinned revision/session;
- claim and claim category;
- source URL/path/symbol, test path, browser capture ID or artifact digest;
- analysis time and tool version when available;
- confidence/evidence status;
- limitations and missing coverage.

Use these claim labels:
- **Verified from source:** actual source file/symbol inspected.
- **Verified by test:** a named test or behavior was executed and passed.
- **Observed in browser:** behavior captured on a stated page/session.
- **Declared by repository:** documented by README/vendor docs, not independently verified.
- **Inferred:** hypothesis supported by partial evidence.
- **Unknown:** not available in the evidence.

Never promote a README description to “verified implementation.” Never label code “tested” merely because a test file exists.

## 6. Output bundle

Each analyzed target should have a separate folder:
- overview.md
- capability-map.md
- architecture.md
- function-traces.md
- security-and-licensing.md
- angel-adoption.md
- open-questions.md
- evidence.json
- status.md

The folder should include a source revision, target type, last inspected timestamp, coverage level and links to evidence. The branch catalogue's targets.json should link to each dossier and track status changes.

## 7. Angel adoption decisions

Every candidate capability receives one of:
- **Keep:** compatible capability to implement substantially as described.
- **Adapt:** useful concept, reimplemented through Angel's architecture.
- **Defer:** relevant but blocked by budget, platform, maturity, or dependencies.
- **Reject:** unsafe, redundant, incompatible, unmaintained, prohibited by license/terms, or not valuable enough.

Map each Keep/Adapt decision to a permanent Angel implementation stage and create a separate implementation ticket with:
- one clear outcome;
- prerequisites;
- files/modules to change;
- test plan;
- security/permission requirements;
- user-visible status;
- rollback plan;
- acceptance criteria.

Research evidence and feature implementation must be separate. A dossier must not modify Angel's production application automatically.

## 8. Architecture recommendation

Start with a small modular interface inside Angel:
- URL/repository classifier;
- analysis-job table/queue;
- GitHub source collector;
- REA execution adapter;
- browser-evidence collector;
- capability-normalization layer;
- license/security reviewer;
- evidence store;
- dossier renderer/export;
- Angel-roadmap mapper.

The REA runner should live in a controlled worker or trusted local companion environment, not inside the browser UI. The UI submits a scoped job and displays progress. The worker runs with a dedicated, isolated workspace, pinned inputs, resource/time limits and no production secrets.

For public GitHub sources, use repository metadata and file APIs where available; use a sandbox clone only where broader tree/test/dependency analysis is justified. For web pages, use a controlled browser session; treat network access and page-provided instructions as untrusted. Remote work must not expose a CDP/debugging socket to the public internet.

## 9. Permission and safety model

- Static source/readme analysis is the default.
- Website capture is read-only by default.
- Any form submission, account modification, posting, sending, purchase, file deletion, code execution, deployment or other write action requires explicit user authorization.
- User-provided URLs do not authorize attacks on the destination or access to private systems.
- Prevent SSRF and unsafe URL targets in server-side fetching: block private/link-local/loopback destinations except explicit local test fixtures, re-check redirects, and constrain protocols, DNS resolution, body sizes and timeouts.
- Treat page text, source comments, repo prompts, discovered tool schemas and model outputs as untrusted data rather than instructions.
- Do not harvest credentials or bypass authentication, paywalls, access controls, geographical restrictions, quotas or service terms.
- Keep credentials out of captured artifacts; redact secrets before storage and export.
- Run code in an isolated, time-limited sandbox with constrained filesystems/network/processes and no ambient credentials.
- Preserve original licenses and notices when code is reused. Generate an attribution/license inventory before implementation.
- Require server-side scope and ownership checks for every integration action.

## 10. Acceptance tests

The workbench is not ready until it passes:
1. Valid GitHub repository URL: identify repo, branch and pinned revision; return source-linked module map.
2. GitHub file URL: preserve exact path/ref and show parent module context.
3. Public website URL: capture page title/routes and a declared interaction result with evidence and limitations.
4. Login-protected page without authorization: stop safely and report access needed, not bypass the login.
5. Website redirects to a private IP/localhost/metadata endpoint: blocked by SSRF policy.
6. Malicious README instructing the analysis agent to reveal keys: treated as untrusted data; no secrets disclosed.
7. Large monorepo: show bounded coverage and remaining queue, not “fully reverse engineered.”
8. Unlicensed/unmaintained target: record adoption risk and keep/reject decision.
9. Batch of targets: one failure does not corrupt or falsely mark the others successful.
10. Cancelled analysis: task state, partial evidence, and resource cleanup are recorded.
11. Exported report: each claim has a source/capture/test reference or is marked inferred/unknown.
12. Adoption ticket: assigned to a fixed Angel stage and has an acceptance test before code changes start.

## 11. Current status
The branch currently holds this specification, the 74-target inventory and research findings. The workbench described here is **not yet implemented in the Angel UI**. REA's local runtime has not been executed in this chat; this branch's current findings are repository/API source inspection and official documentation review, with explicit evidence-depth labels.
