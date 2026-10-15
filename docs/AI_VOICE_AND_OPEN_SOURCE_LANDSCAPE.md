# Angel AI Voice and Open-Source AI Landscape

Research snapshot: 15 October 2026

## Scope and honest limits

There is no finite, authoritative list of **every** AI-related public repository. GitHub contains millions of repositories, projects change ownership and licences, and “AI-related” includes models, data, inference, applications, evaluation, robotics, speech, search, and more. This document is a curated, source-linked map of high-value projects relevant to Angel AI, not a claim that every repository has been individually audited. Before adopting any component, review the repository's current licence, model-weight licence, voice/model card, security posture, maintenance activity, and deployment requirements.

## Executive recommendation for Angel

Do not replace Angel's existing React/TypeScript application with a large Python framework just to add voice. Keep Angel's UI, auth, workspace, memory and tool permissions. Improve the existing browser voice experience first, then add a provider-neutral real-time voice backend behind a feature flag.

Recommended order:

1. **Immediate UX:** reliable dictation, continuous voice conversation, interruption/stop, clear mic state, explicit mute, end-session phrase, transcript, accessible controls and honest unsupported-browser errors.
2. **First backend proof of concept:** compare **Pipecat** (vendor-neutral Python pipeline) with **LiveKit Agents** (realtime/WebRTC/telephony, Python and Node ecosystem). Prototype one short end-to-end conversation before choosing.
3. **Microsoft option:** evaluate **Azure AI Foundry Voice Live / Voice Agent** as a managed alternative, not as an open-source repository to self-host. It offers a managed realtime voice pipeline and agent orchestration; check regional/model availability and price before committing.
4. **Local/offline option:** evaluate **faster-whisper** for transcription and **Piper / OHF-Voice's maintained successor** for local speech output. These are components, not complete conversational agents.
5. **Do not adopt yet:** VibeVoice or any large speech model until hardware, latency, memory, model licence and production terms have been checked. Open weights do not automatically mean unrestricted commercial use.

## What is already in Angel

- Browser speech recognition for dictation and voice mode, with transcript display.
- Browser audio capture and waveform visualisation.
- Text-to-speech via the existing `voiceEngine`.
- Camera and screen capture in Visual Mode, with frame analysis.
- Voice session transcript, save-as-task and save-as-memory actions.
- Voice mode currently uses the Web Speech API and a server AI generation endpoint. Browser support and microphone permissions vary. It is not yet a provider-grade, low-latency full-duplex audio stack.
- This branch adds explicit voice commands to Voice Mode: stop speaking, mute/unmute mic, send transcript to chat, save as task/memory, and the exact standalone phrase “end conversation”. Recognition pauses while Angel speaks to reduce feedback/echo. This is an initial browser implementation, not a guaranteed wake-word detector or speaker-identification system.

## Voice and speech repositories

| Project | Repository | Main purpose and useful features | Fit for Angel / caveats |
|---|---|---|---|
| Pipecat | https://github.com/pipecat-ai/pipecat | Open-source real-time voice and multimodal framework; STT, LLM, TTS, audio/video transports, turn-taking, streaming, multi-agent handoffs and many provider integrations. BSD-2-Clause framework licence. | Best first comparison for a provider-neutral voice backend. Python service required; model/provider terms remain separate. |
| LiveKit Agents | https://github.com/livekit/agents | Real-time voice/video agent framework, WebRTC rooms, turn detection, plugins, telephony, client SDKs, testing and observability; Apache-2.0 framework licence. | Strong if Angel needs mobile/browser realtime audio, interruption, video or telephony. Some bundled turn-detection models have a separate LiveKit Model License. |
| Microsoft VibeVoice | https://github.com/microsoft/VibeVoice | Open voice-model family for speech generation and ASR; includes VibeVoice-ASR and streaming ASR experiments, research demos and model weights. | Worth benchmarking for transcription/TTS quality. Check model-specific terms, GPU/memory demand, and production readiness; repository package metadata does not settle all weight-use rights. |
| faster-whisper | https://github.com/SYSTRAN/faster-whisper | Whisper transcription reimplemented using CTranslate2; CPU/GPU support, quantization and lower memory use than the reference implementation in many workloads. MIT. | Practical server-side transcription component when browser speech recognition is weak or unavailable. Requires hosting/inference resources. |
| OpenAI Whisper | https://github.com/openai/whisper | General-purpose multilingual speech recognition, translation and language identification. MIT code licence; model use still needs review. | Strong offline/server ASR baseline for evaluation. |
| whisper.cpp | https://github.com/ggml-org/whisper.cpp | C/C++ Whisper inference with quantization and broad CPU/device support. MIT. | Useful for native/local inference and constrained hardware, but browser/mobile integration requires extra work. |
| OHF-Voice Piper | https://github.com/OHF-Voice/piper1-gpl | Maintained line of local neural text-to-speech software, with downloadable voice models. | Potential offline TTS path. Verify the current code licence and each individual voice/model licence; do not assume every voice permits commercial use. The original rhasspy/piper repository was archived and development moved. |
| SpeechBrain | https://github.com/speechbrain/speechbrain | Open-source speech toolkit: ASR, speaker recognition, diarization, enhancement, separation and emotion-related research recipes. Apache-2.0. | Useful if Angel later needs speaker diarization, noise robustness or advanced audio research; heavier than the immediate requirement. |
| sherpa-onnx | https://github.com/k2-fsa/sherpa-onnx | Offline speech recognition, keyword spotting, TTS and audio processing across desktop/mobile/embedded platforms. | Strong candidate for local/offline voice and wake-word/keyword spotting. Check individual model licences and target-device performance. |
| Mozilla DeepSpeech (legacy) | https://github.com/mozilla/DeepSpeech | Historical offline speech-recognition project. | Reference only, not a first choice for a new production build without a current maintenance audit. |
| OpenVoice | https://github.com/myshell-ai/OpenVoice | Voice cloning/style control research and multilingual speech generation. | Not recommended for default Angel integration until consent, anti-impersonation safeguards, licence, model terms and abuse controls are reviewed. |
| Coqui TTS (legacy ecosystem) | https://github.com/coqui-ai/TTS | Neural TTS training/inference and voice models. | Model quality and licences vary; audit maintenance and each model licence before adoption. |
| TEN Framework | https://github.com/TEN-framework/ten-framework | Realtime conversational voice-agent framework/runtime with extensions across languages and visual builder concepts. | Alternative to compare with Pipecat/LiveKit; verify current licence conditions and deployment constraints. |
| Vocode | https://github.com/vocodedev/vocode-python | Voice-agent building blocks for streaming audio and phone conversations. | Useful for learning/legacy comparison; assess recent maintenance and provider support before selecting. |

## General AI agent frameworks and orchestration

| Project | Repository | Main purpose and features | Angel relevance |
|---|---|---|---|
| LangGraph | https://github.com/langchain-ai/langgraph | Stateful graph orchestration, durable execution, checkpoints, streaming and human-in-the-loop. | Strong for long-running workflows, approval gates and resumable agents; adds a Python/JS orchestration layer. |
| LangChain | https://github.com/langchain-ai/langchain | Broad model/provider, retrieval, tool and integration ecosystem. | Useful components, but avoid adopting the entire framework if Angel only needs a few specific integrations. |
| CrewAI | https://github.com/crewAIInc/crewAI | Role-based multi-agent teams, tasks, flows and process orchestration. | Candidate for specialist-agent workflows; compare reliability and observability against current Angel workflow engine. |
| Microsoft Agent Framework | https://github.com/microsoft/agent-framework | Microsoft's newer agent and multi-agent orchestration framework, combining concepts from AutoGen and Semantic Kernel; Python/.NET. | Relevant to Microsoft's agent ecosystem and tool workflows. It is a framework, not the managed Voice Live service. |
| AutoGen | https://github.com/microsoft/autogen | Conversational multi-agent patterns and AutoGen Studio. | Valuable historical examples; Microsoft directs new development toward Microsoft Agent Framework, so treat as maintenance/legacy comparison. |
| Semantic Kernel | https://github.com/microsoft/semantic-kernel | SDK for model integration, plugins/functions and orchestration, especially in .NET ecosystems. | Relevant if Angel later needs .NET/Azure integration; not necessary for the current TypeScript-first frontend. |
| Google Agent Development Kit (ADK) | https://github.com/google/adk-python | Agent construction/orchestration, tools, multi-agent workflows and evaluation, designed for Google's model ecosystem but with broader integration paths. | Worth evaluating for Gemini-backed agent orchestration; do not migrate the existing backend without a working comparison. |
| OpenAI Agents SDK | https://github.com/openai/openai-agents-python | Agent loops, tools, handoffs, guardrails, tracing and orchestration. | Good reference for tool policy and handoffs; provider-specific ecosystem and usage costs apply. |
| Pydantic AI | https://github.com/pydantic/pydantic-ai | Typed agent inputs/outputs, dependency injection, structured results and model/provider abstraction. | Useful for reliable Python services and typed tool contracts. |
| smolagents | https://github.com/huggingface/smolagents | Small code-first agent library with tool calling and code-agent patterns. | Useful for focused experiments; sandbox untrusted generated code. |
| Agno | https://github.com/agno-agi/agno | Agent/team framework with memory, knowledge, tools and UI-oriented platform components. | Candidate if a ready-made agent platform is more useful than maintaining every component ourselves. |
| Letta | https://github.com/letta-ai/letta | Stateful agents with persistent, editable memory and long-running agent state. | Useful research for memory architecture; compare against Angel's Supabase-owned memory and sensitivity controls. |
| Haystack | https://github.com/deepset-ai/haystack | Retrieval-augmented generation pipelines, document ingestion, search and agent pipelines. | Useful for document reading, grounded research and library search. |
| LlamaIndex | https://github.com/run-llama/llama_index | Data ingestion, indexing, retrieval and knowledge workflows. | Useful for Angel's reading/library and retrieval features. |
| Mastra | https://github.com/mastra-ai/mastra | TypeScript agent framework with workflows, memory, tools, evals and observability. | Especially relevant to Angel's TypeScript stack; evaluate individual modules before replacing custom services. |
| Vercel AI SDK | https://github.com/vercel/ai | TypeScript SDK for model calls, streaming UI, tool calls and structured outputs. | Relevant to Angel's Vercel/TypeScript deployment; a library, not a full backend platform. |
| Dify | https://github.com/langgenius/dify | Self-hostable visual AI application platform with workflows, RAG, tools and app publishing. | Good reference for visual workflow UX; adopting it wholesale could duplicate Angel's product. |
| Flowise | https://github.com/FlowiseAI/Flowise | Visual drag-and-drop LLM workflow and agent builder. | Reference for Angel's Agent Lab/workflow builder UX. |
| OpenHands | https://github.com/All-Hands-AI/OpenHands | Open agent platform focused on software engineering, terminal/browser use and iterative code changes. | Useful pattern for controlled coding agents; not a generic assistant runtime replacement. |

## Models, inference, retrieval and app repositories

| Project | Repository | Purpose / features | Why it matters |
|---|---|---|---|
| Ollama | https://github.com/ollama/ollama | Local model serving, model pulls and local HTTP API. | Local/private model option, with hardware and model licence constraints. |
| llama.cpp | https://github.com/ggml-org/llama.cpp | Efficient local LLM inference, quantization and broad hardware support. | Local inference reference, especially for offline/privacy modes. |
| vLLM | https://github.com/vllm-project/vllm | High-throughput model serving, batching and OpenAI-compatible APIs. | Useful if Angel later hosts models at scale; requires GPU infrastructure. |
| LiteLLM | https://github.com/BerriAI/litellm | Unified API/proxy across model providers, routing, budgets and logging. | Useful for provider failover and cost controls; protect proxy credentials and logs. |
| Open WebUI | https://github.com/open-webui/open-webui | Self-hosted chat UI for local and remote model providers, with knowledge/tools integrations. | Product UX reference for model choice, local models and knowledge sources. |
| AnythingLLM | https://github.com/Mintplex-Labs/anything-llm | Desktop/self-hosted AI workspace, document chat, agents and model connectors. | Strong reference for workspace, reading and private knowledge workflows. |
| RAGFlow | https://github.com/infiniflow/ragflow | RAG engine with document parsing, retrieval and knowledge-base workflows. | Relevant to the requested “reading” capability and reliable document-grounded answers. |
| MCP | https://github.com/modelcontextprotocol | Protocol and SDK ecosystem for connecting AI applications to tools and data. | Angel should support carefully permissioned tool connectors rather than allowing model-driven unrestricted actions. |
| Browser Use | https://github.com/browser-use/browser-use | Browser automation for agents. | Useful for future web actions; requires user confirmation, isolation and robust anti-prompt-injection defenses. |
| Firecrawl | https://github.com/firecrawl/firecrawl | Web crawling/content extraction for AI search and RAG. | Useful for grounded reading/search; self-hosting and external service have different operational costs. |
| n8n | https://github.com/n8n-io/n8n | Workflow automation with many app integrations and AI nodes. | Reference/integration candidate for user-approved automation; review licence terms before embedding or reselling. |

## Microsoft voice upgrade: what to learn from it

Microsoft's current product direction separates two layers:

- **Voice Live** is the real-time voice transport/model experience: streaming audio, speech recognition/synthesis, turn-taking, interruptions, audio events and (depending on API version) WebRTC support.
- **Voice Agent in Foundry Agent Service** adds a managed agent layer: reusable agent configuration, tools/connectors, knowledge, conversation state, observability/evaluation and inbound/outbound call integrations such as Teams/Twilio. Microsoft describes Voice Agent as the recommended path for new managed voice-first applications, while direct Voice Live remains an option for developers who want to manage their own orchestration.

Useful Microsoft sources:
- Voice Agent repository/community hub: https://github.com/microsoft/voice-agent
- Voice Live API reference (preview features can change): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-api-reference-2026-06-01-preview
- Voice Live evaluation harness announcement: https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/evaluate-before-you-ship-introducing-the-voice-live-evaluation-harness/4523064
- Microsoft Copilot Voice help: https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-voice-features-in-microsoft-365-copilot

Features worth borrowing for Angel:
1. Low-latency streaming and interruption/barge-in.
2. Explicit turn-end detection and configurable silence timeout.
3. Separate speech pipeline from agent/tool orchestration.
4. Tool activity and progress surfaced to the user.
5. Persistent conversation state with user-controlled retention.
6. Voice evaluation over recorded multi-turn conversations, not just a single demo.
7. Clear provider/region/model capability checks and transparent fallback errors.

Do not assume preview API properties are stable, available in Nigeria/each region, or included in every subscription. Check current API version, deployment region, voice/model availability and pricing before using it.

## Voice and AI app UX patterns to study

| App / product | Official source | Features/patterns worth learning from |
|---|---|---|
| ChatGPT Voice | https://help.openai.com/en/articles/20001274/ | Voice within a normal chat; visible transcript and response text; standard turn-based vs live conversation; interruptions; available web search/memory/visual results depending on mode and availability. |
| Microsoft Copilot Voice | https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-voice-features-in-microsoft-365-copilot | Dictation, read-aloud and full voice conversation as distinct actions; availability disclosure; accessibility and privacy information. |
| Gemini Live | https://support.google.com/gemini/ | Study its Live conversation, natural interruptions and multimodal camera/screen context where enabled. Feature availability varies by device, account and region. |
| LiveKit Agents Playground | https://github.com/livekit/agents | A developer-facing test surface for listening/speaking, tool activity and realtime voice debugging. |
| Dify / Flowise | https://github.com/langgenius/dify ; https://github.com/FlowiseAI/Flowise | Visual workflow building, node connections, execution history and publishing concepts for Angel's Agent Lab. |
| Open WebUI / AnythingLLM | https://github.com/open-webui/open-webui ; https://github.com/Mintplex-Labs/anything-llm | Workspace navigation, model configuration, local-model setup and document/knowledge workflows. |

This is a product-pattern review, not a claim that every product was exhaustively reverse-engineered. Closed apps do not expose their internal implementation; public documentation only supports the visible feature claims.

## Proposed Angel voice architecture

- **Client:** keep React/TypeScript, permission prompts, device selector, visible mic/speaker states, transcript, keyboard/touch controls, and browser dictation fallback.
- **Voice transport:** a small adapter interface that can switch between browser speech and a real-time provider. Avoid coupling the UI directly to one vendor's event schema.
- **Realtime provider:** benchmark Pipecat vs LiveKit Agents. Consider Microsoft Voice Live as a managed-provider option behind the same adapter.
- **Agent/tools:** route all voice requests through Angel's existing server authorization, tool permission checks, rate limits, audit events and grounded-search service. Voice must not bypass tool authorization.
- **Memory:** make saving explicit. Never automatically persist every raw transcript; respect incognito mode and memory sensitivity rules.
- **Wake word:** browser Web Speech is not a reliable always-on wake-word engine. For a true wake word, evaluate local keyword spotting (e.g. sherpa-onnx) and ask for microphone permission with clear indicators. Always provide a visible off switch.
- **Privacy:** microphone/camera/screen capture must be opt-in, visibly active, stoppable, and fully stopped when the session ends. Do not promise speaker identity or isolation until a dedicated model has been integrated and evaluated.
- **Evaluation:** measure first-audio latency, response latency, interruption success, word error rate, command accuracy, echo-trigger rate, device/browser compatibility and cost per minute. Run multi-turn tests across mobile Android, desktop Chrome/Edge and unsupported-browser fallbacks.

## Decision matrix

| Option | Best at | Operational cost | Recommended next action |
|---|---|---|---|
| Existing browser APIs + current voiceEngine | Fastest first-party improvement; minimal infrastructure | Low, but browser support varies and quality is limited | Continue immediate UX/command fixes now |
| Pipecat | Provider-neutral realtime voice/multimodal pipeline | Self-host Python service and audio infrastructure | First backend prototype |
| LiveKit Agents | Realtime WebRTC, video, telephony and production agent lifecycle | Self-host/LiveKit service plus model/provider costs | Prototype if realtime media quality is a top priority |
| Microsoft Voice Live / Voice Agent | Managed speech and managed agent orchestration | Usage/region/provider costs and platform dependency | Compare in a short paid/free-tier proof of concept |
| faster-whisper + local TTS | Local/private pipeline and control | CPU/GPU, deployment, model/voice licensing | Offline/low-cost fallback study |

## Sources reviewed

- Pipecat: https://github.com/pipecat-ai/pipecat
- LiveKit Agents and its separate model licence: https://github.com/livekit/agents ; https://github.com/livekit/agents/blob/main/MODEL_LICENSE
- Microsoft VibeVoice: https://github.com/microsoft/VibeVoice
- faster-whisper: https://github.com/SYSTRAN/faster-whisper
- Piper project move and voice model licensing: https://github.com/rhasspy/piper ; https://github.com/OHF-Voice/piper1-gpl
- Microsoft Voice Agent and Voice Live docs: https://github.com/microsoft/voice-agent ; https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-api-reference-2026-06-01-preview
- ChatGPT Voice: https://help.openai.com/en/articles/20001274/
- Copilot Voice: https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-voice-features-in-microsoft-365-copilot
