# REA: Reverse Engineer Anything

- **Target:** https://github.com/morluto/rea
- **Primary docs inspected:** README, installation guide, MCP runtime contracts
- **Inspection date:** 2026-10-23
- **Status:** Public documentation inspected; REA itself has not been installed or executed here.
- **Confidence:** High for README/documentation claims; no claim about live runtime behavior.

## Summary

REA describes itself as an agent/MCP toolkit for reverse engineering applications and runtime behavior, spanning websites, JavaScript/Electron applications, .NET assemblies, native binaries, and selected native analysis workflows. It aims to return evidence and limitations alongside conclusions, rather than presenting unsupported guesses as facts.

Sources:
- [README](https://github.com/morluto/rea/blob/main/README.md)
- [Installation and setup](https://github.com/morluto/rea/blob/main/docs/installation.md)
- [MCP runtime contracts](https://github.com/morluto/rea/blob/main/docs/mcp-contracts.md)
- [Official site](https://rea.tools/)

## Key capabilities evidenced in the public docs

1. **Agent/MCP integration**: setup registers REA with selected compatible agents and can install a matching workflow/skill.
2. **Multiple target families**: public docs describe inspection across websites, JavaScript/Electron, .NET, native binaries and runtime behavior. Actual analysis depends on the target and the supported provider/engine.
3. **Native analysis adapters**: documentation references Hopper, Ghidra and IDA, with separate provider setup requirements. Do not assume all are installed or available.
4. **Static JavaScript/Electron analysis**: README says this path does not require a native analysis engine.
5. **Evidence-centric results**: tool outputs include canonical Evidence, normalized results, an evidence identity, analysis profile, limitations and, where available, raw provider output.
6. **Retained session evidence**: evidence can be retained in a session bundle and retrieved for broader history or transfer.
7. **Comparison operations**: docs describe comparing function dossiers and artifacts when evidence scopes and coverage are sufficient.
8. **Coverage and uncertainty semantics**: artifact inventory and function facets explicitly distinguish complete, unknown, unavailable, truncated and contradictory evidence. Missing information must not be interpreted as proof of absence.
9. **Failure diagnostics and recovery hints**: tool errors return structured diagnostics; bounded recovery steps can identify invalid input contracts or timeout recovery.
10. **Setup review and consent**: setup previews exact configuration changes and asks for approval before applying them. It supports cancellation, backups and verification of configuration writes.
11. **Readiness and maintenance**: docs describe scoped readiness checks and update/removal diagnostics.
12. **Local analysis orientation**: README states analysis runs locally. Specific engines and platform prerequisites remain target-dependent.

## What this does not prove

- It does not prove that REA can reverse-engineer every URL, repository, binary, or mobile application automatically.
- It does not prove a website's private backend implementation can be recovered from public pages.
- It does not mean that the current ChatGPT-connected GitHub integration has run REA.
- It does not mean the tools will work without installation, configured MCP client, runtime dependencies, permissions, and supported analysis engines.
- Static artifact similarity does not prove identical runtime behavior.
- Empty results do not prove absence unless the source explicitly marks that facet as observed and complete.

## Angel adaptation proposal

Do not embed the entire REA project as a runtime dependency at this stage. Build an Angel-owned research pipeline around the concepts:

- **URL intake**: accept repository, documentation, public website, or user-authorized local artifact.
- **Target resolver**: canonical URL, project metadata, default branch, license and scope.
- **Evidence store**: source URLs, file paths, snippets/observations, timestamps, coverage, limitations and provenance.
- **Capability mapper**: summarize user-visible functions, workflows, data flow, permissions, failure modes and integration contracts.
- **Comparison engine**: compare feature sets and versions without treating missing evidence as equality.
- **Research report generator**: create a report with evidence, confidence, license/security notes and open questions.
- **Angel adaptation planner**: map reviewed findings to the existing Angel roadmap, acceptance criteria and test plan.
- **Approval gate**: require user review before creating code changes, installing dependencies, accessing accounts, or running actions.
- **Website adapter**: document observed public pages and user-authorized interactions separately from source-code analysis.
- **Progress/resume**: save task state so a large set of targets can be analyzed in batches.

## Safety, licensing, and privacy notes

- Analyze public repositories and websites, or artifacts the user has permission to inspect.
- Do not bypass authentication, access controls, paywalls or anti-abuse measures.
- Do not collect or expose private personal data, credentials or session tokens.
- Treat OSINT and security-testing repositories as high-scrutiny targets; use only authorized and privacy-respecting workflows.
- Record license and attribution before adapting any implementation. A behavioral feature specification and an exact code copy are not the same thing.
- REA setup can modify local agent configuration, so installation must be reviewed and approved separately.

## Next validation steps

1. Install REA only in a controlled development environment, following its official setup guide.
2. Review the proposed agent configuration changes before approval.
3. Run its scoped readiness checks and record the actual installed providers.
4. Select a small, low-risk public target, such as a documentation site or a simple public web app, and capture evidence.
5. Compare REA's output with manual inspection and record false positives, unknowns and limitations.
6. Only then decide whether REA should be part of Angel's development toolkit or whether an Angel-native research workflow is preferable.
