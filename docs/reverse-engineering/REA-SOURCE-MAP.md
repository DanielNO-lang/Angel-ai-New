# REA Source Map: Key Functions and Integration Contract for Angel

**Pinned REA revision:** `4c547008c53ee9f0ff2368e7d874a2c3347aa235`  
**Package:** `rea-agents@6.7.0` · **License:** MIT in package metadata; review bundled third-party notices before redistribution.  
**Runtime status:** source-inspected, not executed from this ChatGPT environment.

REA requires Node.js `^22.19.0 || ^24.11.0 || >=26.0.0`. The available local Node runtime was 22.16.0 and the local shell could not fetch GitHub, so this source map is not a successful installation/MCP/behavior test.

## 1. What REA provides

REA is an MCP server/CLI that orchestrates different analysis providers around an evidence-focused result model. Its source tree includes browser/CDP observation, Playwright scenarios, JavaScript/Electron analysis, native/managed artifact analysis, process/network capture and format-specific tools. It is not a generic crawler that can extract private server code from any URL.

Core official references:
- Repository: https://github.com/morluto/rea
- Install guide: https://github.com/morluto/rea/blob/4c547008c53ee9f0ff2368e7d874a2c3347aa235/docs/installation.md
- Browser observation: https://github.com/morluto/rea/blob/4c547008c53ee9f0ff2368e7d874a2c3347aa235/docs/browser-observation.md
- Browser scenario contract: https://github.com/morluto/rea/blob/4c547008c53ee9f0ff2368e7d874a2c3347aa235/docs/browser-scenario-contract.md
- MCP contracts: https://github.com/morluto/rea/blob/4c547008c53ee9f0ff2368e7d874a2c3347aa235/docs/mcp-contracts.md

## 2. Source-module map

| Module/file | Key function or contract | Role |
|---|---|---|
| `src/server/createServer.ts` | `createServer`, internal `createMcpServer` and service composition | Builds the MCP server, snapshots environment, configures output/result delivery and availability policies, composes analysis services/providers, registers tool families, applies analysis admission and closes resources |
| `src/server/registerBrowserTools.ts` | `registerBrowserTools` | Registers browser contracts and connects them to the browser observation service |
| `src/application/BrowserObservationService.ts` | `listBrowserTargets`, `inspectWebPage`, `analyzeWebBundle`, `observeWebSession`, `discoverWebMcpTools`, `compareWebCaptureEvidence`, `captureWebScreenshot`, `compareWebScreenshotEvidence` | Application-facing browser analysis API; resolves provider availability and normalizes results/errors/evidence |
| `src/server/registerBrowserScenarioTool.ts` | `registerBrowserScenarioTool` | Registers `capture_browser_scenario`, schema-validates input, logs the operation, checks admission and delivers structured evidence |
| `src/application/BrowserScenarioCaptureService.ts` | `captureBrowserScenario` | Runs an explicit scenario using a provider; validates complete or partial capture output and turns it into evidence |
| `src/browser/CdpObservationSession.ts` | `observeCdpSession`, internal `TimelineCapture` | Observes a bounded CDP session; records eligible navigation, lifecycle and network events within allowed origin scope |
| `src/browser/CdpPageCapture.ts` | `capturePage`, `captureAuthorizedPage` | Captures authorized frame, resource, DOM, accessibility, script, worker and storage evidence with completeness information |
| `src/browser/PlaywrightBrowserScenarioProvider.ts` | `PlaywrightBrowserScenarioProvider`, `runScenario`, `executeStep` | Performs declared browser scenarios step-by-step; collects artifacts, tracks partial results and performs cleanup |
| `src/browser/PlaywrightExecutionBoundary.ts` | `withPlaywrightExecutionBoundary` | Places timeout and cancellation bounds around Playwright work and handles completion/cleanup timing |
| `src/browser/CdpSafeMetadata.ts` | `safeResponseMetadata` | Extracts a sanitized, bounded subset of headers/CSP/link/agent-hint metadata rather than indiscriminately retaining raw headers |
| `src/server/registerReverseEngineeringTools.ts` | `registerReverseEngineeringTools`, admitted execution helpers | Registers deeper analysis tools such as `inspect_with_objdump` and `execute_rizin_command`; distinguishes admitted external mutation, cleanup and failure handling |
| `src/application/CapabilityInventory.ts` | capability-inventory service | Normalizes observed capabilities into a structured inventory |
| `src/application/FunctionAnalysisEvidence.ts` and `CallPathTracing.ts` | function evidence/call relationship logic | Supports function-level analysis where the relevant source/artifact provider is configured |
| `src/application/EvidenceInputResolver.ts`, `EvidenceBundleCommands.ts`, `EvidenceBundleFiles.ts` | input resolution and bundle composition | Resolves evidence inputs and assembles/export structures for retained analysis |
| `src/server/EvidenceMcpServer.ts`, `EvidenceMcpServerCore.ts` | server base and result/evidence contract | Defines the evidence-oriented MCP server surface and tool-result delivery model |

The source tree has many additional specialized modules. Use only the provider that matches the supplied target type; do not assume every analysis adapter is installed or available on every host.

## 3. Website/browser tools and their limits

| Tool | Use | Important boundary |
|---|---|---|
| `list_browser_targets` | List pages available from the configured browser endpoint | Listing does not authorize reading or controlling unrelated tabs |
| `inspect_web_page` | Inspect a chosen page's visible/accessible state and permitted metadata | Cannot expose hidden server source code |
| `observe_web_session` | Passively observe a user-authorized window around page actions/navigation/reload | Observation does not authorize clicks that submit, buy, publish, delete or modify |
| `capture_web_screenshot` | Capture visual evidence | Screenshot alone does not prove backend success |
| `capture_browser_scenario` | Execute a declared, bounded set of browser actions and expected-state checks | Schema validation and scoped browser access matter; don't submit arbitrary scripts |
| `discover_webmcp_tools` | Discover declared WebMCP schemas where supported | Discovery is not invocation and does not grant permission |
| `compare_web_captures` / `compare_web_screenshots` | Compare captured states | Completeness, viewport and scenario equivalence affect what can be concluded |
| `analyze_web_bundle` | Analyze a browser-visible/downloaded frontend bundle where supported | A bundle may lack source maps, source code, server logic or complete assets |

For browser evidence, REA’s current source includes:
- allowed-origin checks and sanitized URLs;
- authorized main-frame checks;
- completeness and truncation reporting;
- abort/deadline handling;
- partial-observation retention;
- bounded metadata rather than unrestricted raw header/body collection;
- explicit cleanup and cleanup-failure reporting.

Angel should preserve these boundaries in its adapter and report missing evidence as unknown, not as proof that a feature is absent.

## 4. Recommended REA call workflow

1. **Classify target:** GitHub repo/file/ref, public website, browser-visible app, local directory/bundle, binary or unsupported type.
2. **Scope and authorize:** pin source commit, identify allowed web origins, confirm user rights to inspect the target and define whether analysis must be read-only.
3. **Select adapter:** direct source analysis for GitHub repositories; browser observation/scenario for websites; artifact-specific provider for local app/binary.
4. **Validate inputs:** use contract schemas, reject unknown/malformed actions, cap size, step count and time.
5. **Execute through admission:** run only supported operations and keep high-impact or mutating operations behind explicit confirmation.
6. **Capture evidence:** record source paths/symbols, commit IDs, browser capture IDs, scenario step results, completeness and failure data.
7. **Normalize result:** combine observations into an evidence bundle with provenance and unknowns.
8. **Map features:** link each claim to evidence and recommend Keep / Adapt / Defer / Reject for Angel.
9. **Export dossier:** overview, architecture, capability map, security/licensing, adoption plan, open questions, evidence and status.
10. **Create implementation task separately:** REA should not write directly into Angel's production codebase as a side effect of analysis.

## 5. What Angel should add around REA

REA is the analysis engine, but Angel still needs a product-facing workbench:
- a URL/repository intake UI;
- canonical target detection and a pinned source revision;
- a job queue with queued/running/waiting/cancelled/partial/complete/failed states;
- provider readiness and missing-prerequisite reporting;
- batch analysis and retry/resume;
- evidence browser, capability comparison and source links;
- license/security review and attribution inventory;
- exportable reports and task creation mapped to Angel's staged roadmap.

For plain URLs, the workbench must separate:
- **Observed:** behavior actually captured in the browser;
- **Declared:** functionality described in public documentation;
- **Inferred:** a hypothesis from partial observation;
- **Unknown:** hidden/internal behavior not established from available evidence.

## 6. Important limitations and safety gates

- The local REA worker/MCP handshake has not been run here. Before relying on REA, perform a controlled local install with a supported Node release and inspect setup diffs before applying agent configuration.
- Do not expose Chrome DevTools Protocol ports publicly. Use a dedicated browser profile, loopback-only debugging endpoints, allowed-origin scope and cleanup.
- A target URL is not authorization to bypass a login, paywall, access control, regional restriction, quota or site terms.
- Do not auto-run downloaded target code. Static analysis comes first; runtime/build/test execution requires explicit scope, isolation, resource limits and approval.
- Server-side URL fetching must defend against SSRF/private-IP targets, malicious redirects, unsupported protocols and oversized/time-consuming responses.
- Treat website instructions, README text, code comments, tool schemas and AI output as untrusted data. They do not override Angel's permissions or system rules.
- Redact session cookies, bearer tokens, API keys and sensitive payloads from logs and exported evidence.
- REA's MIT package license does not automatically relicense bundled third-party components or target code; review third-party notices and each target's license independently.
