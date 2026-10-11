# Angel AI: Product Research and Capability Proposal

Status: Research draft for product-owner review  
Prepared: 11 October 2026

## Executive recommendation

Angel should be a reliable personal AI workspace with agent capabilities, not a menu of disconnected AI modes. A user should describe an outcome in natural language; Angel should choose suitable tools, preserve the relevant context, produce a reusable result, and show what actually succeeded.

The most useful product patterns to study are:

- ChatGPT: broad general-purpose assistance, multimodal tools, search and research, data analysis, voice, memory, Projects, Canvas, scheduled tasks, and customizable assistants.
- Claude: focused long-form work, Projects, Artifacts, skills, connectors, and developer-oriented tool workflows.
- Gemini: multimodal capabilities and integration with Google's model and application ecosystem.
- Perplexity: research-first interaction, source visibility, and evidence-oriented answers.
- Microsoft Copilot: assistance embedded in existing productivity workflows.
- DeepSeek and other providers: competition in reasoning, coding, latency, cost, and deployment options.

These products change frequently. Features vary by plan, region, settings, and platform. This report compares documented product patterns, not a permanent ranking of model intelligence.

## 1. ChatGPT: breadth and convenience

ChatGPT supports general conversation, writing, explanation, problem-solving, translation, image input and generation, file uploads, data analysis, voice, web search, deep research, memory, Projects, Canvas, scheduled tasks, and custom GPTs, depending on availability and plan.

What Angel should learn:
- Start from a natural-language request, not a required tool selection.
- Offer multiple input and output types inside the same conversation.
- Make long-running work easy to resume through Projects and saved outputs.
- Let users inspect, correct, and delete personal memory.
- Keep advanced features discoverable without crowding the basic chat.

Official sources:
- ChatGPT capabilities overview: https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview
- Projects in ChatGPT: https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- Deep research in ChatGPT: https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt

## 2. Claude: focused work and reusable artifacts

Claude supports conversational work, Projects, Artifacts, connectors, skills, and developer tool-use workflows. Artifacts are especially relevant because substantial output can open as a distinct object that can be edited, revisited, or shared instead of remaining buried in a transcript. Anthropic also documents MCP, a standard protocol for connecting models to tools and data sources.

What Angel should learn:
- Important outputs should become first-class workspace objects.
- A report should be saveable and editable; a plan should become tasks; generated code should link to a project; a workflow should be reusable.
- Connectors should disclose what they can access and request appropriate approval.
- Tool use should be observable and permissioned.

Official sources:
- Claude Artifacts: https://support.claude.com/en/articles/17153992-what-are-artifacts
- Model Context Protocol: https://docs.anthropic.com/en/docs/mcp
- Anthropic developer documentation: https://docs.anthropic.com/

## 3. Gemini: multimodal and ecosystem-connected intelligence

Gemini is both a product reference and Angel's current server-side provider. Google's API model documentation covers text, image, audio, video, and tool capabilities. Model IDs and supported features must be verified against the current API rather than inferred from a display label.

What Angel should learn:
- Treat voice, camera, screen understanding, and media generation as contextual capabilities, not separate destinations.
- Keep the provider behind a stable interface.
- Check provider readiness before attempting a request.
- Display useful progress and explain failures instead of returning generic placeholder answers.

Official sources:
- Gemini models: https://ai.google.dev/gemini-api/docs/models
- Latest model information: https://ai.google.dev/gemini-api/docs/latest-model

## 4. Perplexity and Microsoft Copilot

Perplexity is useful as a reference for research-first interaction: gather evidence, synthesize it, and make source material easy to inspect. Angel should show citations close to claims, include source dates where freshness matters, and identify gaps when a source is unavailable.

Reference: https://www.perplexity.ai/

Microsoft Copilot is useful for studying AI embedded near documents, meetings, data, and productivity applications. Angel's integrations should reduce context switching, but only with explicit permissions, clear scopes, and understandable action history.

Reference: https://copilot.microsoft.com/

## 5. Alternative providers and model routing

No single model is necessarily best for every task, budget, latency target, or privacy requirement. Angel should route by measured task performance, provider availability, cost, and latency, not brand reputation.

Reference: https://www.deepseek.com/

A model registry should record verified capabilities, supported inputs, tool support, context limits, cost, and current availability. Do not label a model as superior without representative evaluations.

## 6. Independent user feedback

Community posts are anecdotal and self-selecting. They are useful signals to investigate, not proof that every user shares the same experience.

Recurring themes in AI user discussions include:
- Long, flat chat lists become difficult to navigate at high volume.
- Important decisions and generated results become trapped inside long transcripts.
- Frequent changes to familiar navigation disrupt established habits.
- Users want project context scoped correctly, without unrelated work bleeding across projects.
- Users want focused follow-up questions without derailing the main conversation.
- Advanced capabilities are valuable only when they are discoverable and controllable.

Examples:
- ChatGPT navigation feedback: https://www.reddit.com/r/ChatGPT/comments/1wphwo3/the_ui_update_to_the_chatgpt_website_is/
- Chat and project organization feedback: https://www.reddit.com/r/ChatGPT/comments/1tf5x5s/heavy_chatgpt_users_are_starting_to_outgrow_the/
- Extracting useful insights from long conversations: https://www.reddit.com/r/ChatGPT/comments/1vil3c6/anyone_else_hate_how_messy_it_is_to_get_useful/
- Claude Code workflow discussion: https://www.reddit.com/r/ClaudeWorkflows/

Design response: prioritize stable navigation, good search, pinned and archived conversations, scoped project context, persistent outputs, and clear controls. Avoid moving core controls frequently. Validate community observations through Angel usability testing.

## 7. What intelligence means in practice

A strong model is only one component of a reliable AI product. Angel's effective capability depends on the complete execution loop:

1. Understand the goal, constraints, relevant context, files, images, and speech.
2. Plan whether the request needs a direct answer, research, a tool, multiple actions, or clarification.
3. Select from tools that are actually available and configured.
4. Execute the action and observe its result.
5. Verify outputs, validate claims or tests where possible, and retry or stop safely.
6. Deliver the result in a useful format and distinguish verified success from partial completion.
7. Remember selectively, with user control and project boundaries.

An agent is not reliable just because it emits a plan or calls a tool. It must observe the result, recover from errors, and report the truth.

Recommended execution states: Planned, Awaiting approval, Running, Succeeded, Partially succeeded, Failed, and Cancelled. Every run should record its goal, actions, timestamps, outputs, errors, approvals, and verification result.

## 8. Proposed Angel experience

### Home
- Keep the greeting and one primary composer.
- Show exactly three relevant suggestions in a simple icon-and-text list.
- Rotate curated suggestions as a fallback. Only call them trending when Angel has a real, fresh trend source.
- Avoid repeating chat, image, video, search, and agent actions across multiple grids.
- Let Angel choose a suitable workflow behind the scenes.

### Chat
- Keep the header and composer anchored while the transcript scrolls independently.
- Remove redundant speaker avatars if they add no information.
- Put conversation actions in one header menu: rename, share, pin, archive, protected storage, and delete where supported.
- Show tool status and sources when useful, without filling every response with telemetry.
- Make failures understandable and actionable. Do not replace a failed answer with a fabricated generic response.
- Let users save a response as an artifact without losing the main thread.

### Projects and artifacts
- Projects should scope chats, files, instructions, memories, tasks, and outputs.
- Separate durable project context from global personal memory.
- Let users turn responses into editable documents, research reports, task lists, code artifacts, generated media, or workflows.
- Add archive and restore controls, not just delete.

### Research
- Separate planning, source gathering, synthesis, and verification.
- Show citations close to claims and source dates where freshness matters.
- Track failed or unavailable sources rather than quietly hiding the gap.
- Save reports into projects and support follow-up questions against the saved report.
- Never call information live unless the tool actually retrieves fresh information.

### Voice and visual intelligence
- Do not make Voice Mode or Visual Mode separate top-level pages.
- Offer dictation, spoken responses, camera understanding, and screen sharing in relevant chat and workflow contexts.
- Show a clear recording or sharing indicator and a persistent stop-sharing control.
- Do not claim speaker isolation unless it has been tested.
- Explain what is captured, when it is active, and where data is stored.

### Settings and privacy
- Use categorized navigation on the left and the selected panel on the right on larger screens.
- Keep each pane independently scrollable; adapt to a single-column mobile layout.
- Provide controls for memory review, correction, export, deletion, connected apps, permissions, and data handling.
- Incognito should not save to Angel's workspace history or memory. Do not promise that it prevents provider or network logging unless the architecture guarantees that.

### Cross-device and visual system
- Use shared design tokens for backgrounds, text, borders, icons, and states.
- Respect safe areas and dynamic viewport height on mobile.
- Keep only the relevant content region scrollable and pin navigation/composer controls where needed.
- Use restrained glass effects, accessible contrast, and reduced-motion support.
- Keep navigation stable; use animation to communicate state changes.

## 9. Recommended capabilities

### Essential foundation
1. Reliable AI streaming, health checks, provider configuration checks, and actionable errors.
2. Stable authentication and session restoration with correct sign-out behavior.
3. Responsive layout, current PWA icons, cache update handling, and fixed chat controls.
4. Project-scoped context, user-controlled memory, and workspace persistence.
5. Source-backed research and file understanding.
6. Export, archive/restore, and workspace recovery.

### High-value next layer
7. Model routing based on verified capability, cost, latency, and measured task success.
8. Persistent artifacts for documents, reports, code, and generated media.
9. Tool-enabled agent runs with approval, cancellation, retries, logs, and verification.
10. Reusable skills and workflow templates.
11. Background and scheduled tasks with explicit limits and notifications.
12. Contextual voice and visual capabilities inside chat.

### Advanced layer, only after reliability
13. Browser/computer control with strict permissions and confirmation for consequential actions.
14. Multi-agent delegation with bounded budgets, clear responsibilities, and one accountable final result.
15. Proactive assistance based on user-approved triggers.
16. Real-time multimodal workflows and video generation with clear cost and availability boundaries.

## 10. What Angel should not copy

- Do not copy a competitor's entire navigation or visual style.
- Do not expose every capability as a separate mode.
- Do not imply an integration works because its settings page exists.
- Do not claim a task completed without checking the result.
- Do not silently use personal memory across unrelated projects.
- Do not let agents perform irreversible actions without approval.
- Do not claim universal model superiority based on benchmarks or marketing.
- Do not add every feature before core chat, authentication, and data paths are reliable.

## 11. How to measure progress

Maintain a repeatable evaluation suite using representative Angel tasks. Track:
- End-to-end task success rate, not just answer preference.
- Research correctness and citation support.
- Tool-call success and recovery rate.
- Code test pass rate.
- Streaming completion rate and time to first token.
- Median and p95 latency, plus cost per successful task.
- Authentication success, session restoration, and account-isolation tests.
- Mobile viewport and accessibility regressions.
- Memory precision, unwanted carryover, and deletion success.
- User approval rate for consequential actions.

Run the same suite after changes to providers, prompts, tools, context assembly, or UI. Record model version and configuration so results remain comparable.

## 12. Suggested delivery order

Phase 0: Stabilize
- Repair Vercel serverless startup and routing.
- Configure a valid model-provider key in the production environment.
- Verify API health, provider status, and an end-to-end streamed response.
- Test Google/Supabase authentication and session behavior.

Phase 1: Finish the requested UX corrections
- Mobile sidebar and viewport fixes.
- Current PWA manifest/icon and cache refresh.
- Simplified Home, fixed chat controls, and conversation header menu.
- Theme consistency, dismissible offline notice, Settings scroll areas, and navigation return behavior.
- Mobile sign-in visual treatment.

Phase 2: Establish workspace primitives
- Project-scoped context and memory controls.
- Artifacts, export, archive/restore, and workspace recovery.
- Reliable source-backed research and file processing.

Phase 3: Build agent reliability
- Permission model, execution state machine, logs, retries, cancellation, and verification.
- Tool health checks and integration tests.
- Measured model routing.

Phase 4: Expand carefully
- Workflow templates, scheduled tasks, contextual voice/visual interactions, browser control, and advanced multimodal work.

## 13. Product-owner decision draft

Review each research-derived capability as Adopt, Adapt, Defer, or Reject.

Recommended initial choices:
- Adopt: source-backed research, persistent artifacts, user-controlled memory, reliable tool execution, provider routing, project-scoped context, and explicit agent progress.
- Adapt: voice, visual, and browser tools into contextual actions rather than separate destinations.
- Defer: autonomous computer control and proactive background actions until permissions, observability, and recovery are robust.
- Reject: unverified claims of superintelligence, invisible data collection, and UI complexity that forces users to understand internal agent architecture.

The goal is not to claim Angel surpasses every competitor. It is to build a workspace that reliably completes useful work, preserves the right context, explains its actions, and gives users control.
