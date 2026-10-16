# Source repository feature map for Angel AI

Research date: 2026-10-16

This document records the feature patterns relevant to Angel. It is not a claim that Angel reproduces every upstream feature. The goal is to select the capabilities that fit Angel's architecture, licensing and deployment constraints, then mark the remaining runtime work honestly.

| Source | Features relevant to Angel | Angel implementation/status | Boundary or follow-up |
| --- | --- | --- | --- |
| [Tencent Hy-MT2](https://github.com/Tencent-Hunyuan/Hy-MT2) | 33-language specialist translation; terminology/style instructions; preserve placeholders and structured data; several model sizes and quantized variants | Backend translation adapter and `/api/translation/translate` already exist; a skill pack documents source/target language and preservation rules | Must connect a real hosted inference URL and private token. Netlify cannot host the weights. |
| [Qwen Image 2.1](https://github.com/QwenLM/Qwen-Image-2.1) | Text-to-image, image editing, reference images, transparent outputs, aspect ratios, prompt refinement | Qwen 2.1 Turbo/Pro model options, backend adapter, request validation, remote image download and existing authenticated artifact persistence path added | Configure a Model Studio endpoint/key and verify a real call. Hosted API terms differ from weight license. Released weights are under a research license restricting materials to non-commercial use unless separate permission is obtained. |
| [NVIDIA Model Optimizer](https://github.com/NVIDIA/Model-Optimizer) | Quantization, pruning, distillation, sparsity, speculative decoding and exported model checkpoints | Angel skill pack and runtime capability record cover the supported optimization workflow and deployment handoff | Optimization is a separate Python/GPU build pipeline; no weights are optimized on Netlify. Need external GPU CI/build runner and evaluation set for actual optimization. |
| [NVIDIA GPU Operator](https://github.com/NVIDIA/gpu-operator) | Kubernetes GPU driver/device-plugin/toolkit/monitoring lifecycle | Architecture guide marks it as optional Kubernetes infrastructure | Not required for Netlify. Deploy only if a GPU inference runtime is later placed on an appropriate Kubernetes cluster. |
| [Google ADK Python](https://github.com/google/adk-python) | Agent/Runner boundary, tools, session state, workflows, events, evaluation and MCP exposure | Authenticated Angel bridge endpoints and a separate FastAPI ADK runner example added | Deploy Python service externally; the example uses in-memory sessions and needs persistent SessionService before scale-out. |
| [Claude Skills](https://github.com/alirezarezvani/claude-skills) | Modular SKILL.md patterns, reusable coding/DevOps/security/research expertise, Python tooling | Angel-owned allowlisted skill catalog with code review, test-first debugging, Python, MCP, ADK workflows, reverse engineering, voice accessibility, model optimization, Qwen images and Hy-MT2 | This is a curated selection, not an import of all 388+ upstream skills or their scripts/templates. |
| [REA](https://github.com/morluto/rea) | Source/binary/runtime analysis routes, evidence ledger, graph/trace inspection and uncertainty reporting | Evidence-driven reverse-engineering skill pack plus capability status | Native reverse engineering still needs REA CLI/MCP, supported analysis engine and user-supplied target artifact. |
| [Wheelhouse](https://github.com/wheelhouse-project/Wheelhouse) | Dictation, speech-to-command pipeline, whole-utterance matching, command patterns, keyboard navigation, UI Automation, text insertion safeguards, local/cloud speech providers | Voice command safety/intent patterns are added to Angel skill catalog; follow-up browser voice command handling is being wired | Full global Windows desktop control, UI Automation and SendInput cannot run in a normal Netlify-hosted browser. Requires native companion and explicit OS permission. |
| [Gentle-AI](https://github.com/Gentleman-Programming/gentle-ai) | Persistent project context, size-proportional planning, resumable workflow, test-first change, bounded review and evidence receipts | Angel skill packs add review, test-first and resumable-workflow instructions; selected skill ids can be attached to backend agent execution | These instructions guide the agent; they do not grant autonomous Git write permission or prove deployment without observed results. |

## Cross-cutting capability requirements

1. **MCP:** JSON-RPC over HTTP, protocol negotiation, tool schemas, allowlisting, authentication, bounded execution and readable errors. Angel now exposes a verified-user MCP endpoint with capability/skill resources and selected tools.
2. **Python:** typed request contracts and external sandbox isolation. Angel relays to an external sandbox instead of executing arbitrary code in the Netlify process.
3. **Agent workflows:** separate model/agent execution from the web control plane; preserve session identity; record state and recoverable errors; require approval around unsafe side effects.
4. **Skills:** load bounded, versionable, reviewed instruction packs only from Angel's allowlist. Attach relevant packs to a task, rather than dumping an entire skill library into every prompt.
5. **Multimodal providers:** provider-specific adapters, private credentials, timeouts, input limits, durable artifact storage and explicit provider provenance.
6. **Model optimization/GPU:** measure baseline quality and throughput first, optimize offline, then deploy the resulting checkpoint to a separate inference runtime.
7. **Voice accessibility:** distinguish interim from final speech, detect intent by utterance boundaries, prevent playback loops, and never claim browser-only desktop-control capability.

## Source and licensing notes

- [Qwen Image 2.1 license](https://github.com/QwenLM/Qwen-Image-2.1/blob/main/LICENSE) is a Qwen Research License, not a general permissive software license for the released model weights. Its materials are limited to non-commercial use absent separate commercial permission.
- [NVIDIA Model Optimizer](https://github.com/NVIDIA/Model-Optimizer) is Apache-2.0 licensed; review all transitive components/model licenses before distributing an optimized checkpoint.
- [Google ADK Python](https://github.com/google/adk-python) uses Apache-2.0.
- [Claude Skills](https://github.com/alirezarezvani/claude-skills) uses MIT; Angel uses its own independently written skill instructions rather than copying the entire package.
- [Gentle-AI](https://github.com/Gentleman-Programming/gentle-ai) uses MIT.
- [Wheelhouse](https://github.com/wheelhouse-project/Wheelhouse) uses Apache-2.0. Full application reuse still entails Windows-specific dependencies and native UI-control permissions.
- Check the exact file/model license and current provider terms before using any third-party code, model artifact or hosted endpoint commercially.
