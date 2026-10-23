# Phase 2 Findings: Google ecosystem, model/media, SDK and infrastructure references

**Evidence level:** README/entry-point review on 2026-10-23 unless otherwise stated. These are declared capabilities, not runtime test results.

## Models and inference infrastructure

### Tencent Hunyuan Hy-MT2
Source: https://github.com/Tencent-Hunyuan/Hy-MT2  
README: https://github.com/Tencent-Hunyuan/Hy-MT2/blob/main/README.md  
**Declared:** multilingual translation family at 1.8B, 7B and 30B-A3B MoE sizes; supports 33 languages and instruction-following translation. The project offers benchmarks, downloadable weights and an associated translation skill. README advertises a quantized 1.8B deployment route for smaller on-device use.  
**Angel opportunity:** optional translation, language identification, subtitle/document translation and future low-resource/offline language support.  
**Gates:** verify model license, device/hardware needs, supported languages, quantized output quality and whether inference is practical on the user's devices. Open weights do not mean hosted inference is free.

### Qwen Image 2.1
Source: https://github.com/QwenLM/Qwen-Image-2.1  
README: https://github.com/QwenLM/Qwen-Image-2.1/blob/main/README.md  
**Declared:** unified text-to-image and image editing model. README highlights transparent RGBA output/layer editing, subject extraction, up to 10 reference images, localized edits using masks/annotations, and an 8-step Turbo variant/API announced 2026-10-09.  
**Angel opportunity:** future Media Studio for user-authorized image creation, image editing, transparent assets and avatar/expression asset production.  
**Gates:** test the model card/license, VRAM needs, inference speed and quality. Hosted API availability/pricing is separate from open weights.

### NVIDIA Model Optimizer
Source: https://github.com/NVIDIA/Model-Optimizer  
README: https://github.com/NVIDIA/Model-Optimizer/blob/main/README.md  
**Declared:** quantization, pruning, Neural Architecture Search, distillation, speculative decoding and sparsity; takes supported Hugging Face/PyTorch/ONNX models and exports optimized checkpoints for inference frameworks such as TensorRT-LLM, TensorRT, SGLang and vLLM.  
**Angel opportunity:** later optimization for a self-hosted/local model if hardware and budget justify it.  
**Decision:** defer. This does not fix the current TypeScript application or replace a model provider.

### NVIDIA GPU Operator
Source: https://github.com/NVIDIA/gpu-operator  
README: https://github.com/NVIDIA/gpu-operator/blob/main/README.md  
**Declared:** automates GPU drivers, container runtime, Kubernetes GPU device plugins, node labels and DCGM-based monitoring in Kubernetes clusters.  
**Decision:** defer until Angel has GPU-backed servers or a Kubernetes deployment.

## Google APIs, authentication and platform integrations

### Google API definitions
Source: https://github.com/googleapis/googleapis  
**Declared:** Protocol Buffers (proto3) interface and payload definitions for Google API services, supporting REST and RPC client generation.  
**Angel use:** discover official API shapes and schemas; do not import the entire definitions repo into the front end.

### Official API client libraries
- PHP: https://github.com/googleapis/google-api-php-client
- Python: https://github.com/googleapis/google-api-python-client
- Node.js: https://github.com/googleapis/google-api-nodejs-client
- Go: https://github.com/googleapis/google-api-go-client
- Java Cloud: https://github.com/googleapis/google-cloud-java

**Declared:** language-specific libraries for calling Google APIs. The PHP and discovery-based Python clients say they are complete/in maintenance mode and recommend Cloud Client Libraries where appropriate. The Node client documents OAuth 2.0, API-key and JWT authentication.  
**Angel use:** prefer Node/TypeScript-compatible integration patterns and official supported APIs for Gmail, Drive, etc. Do not port Go/Java/PHP library code into the TypeScript app.

### Google services samples
Source: https://github.com/googlesamples/google-services  
**Declared:** quickstart examples for Google APIs on Android and iOS. Reference only if/when a native mobile build is planned.

### Google Sign-In for React Native
Source: https://github.com/react-native-google-signin/google-signin  
**Declared:** public React Native/Expo sign-in package for Android and iOS; the README distinguishes it from a separate premium package for modern web/macOS targets.  
**Angel use:** native-client reference only. This is not a direct fix for Angel's current browser-based Supabase OAuth. First test the web callback/session flow.

### TOTP / Google Authenticator libraries
- Java: https://github.com/wstrange/GoogleAuth
- PHP: https://github.com/antonioribeiro/google2fa

**Declared:** TOTP/HOTP one-time-password support, referencing RFC 6238 and RFC 4226.  
**Angel use:** optional two-factor authentication. Prefer provider-managed MFA through Supabase/Auth rather than maintaining custom OTP security when a supported provider feature meets the need. OAuth Google sign-in and authenticator TOTP are different functions.

### Google Workspace MCP
See Phase 1 findings. It potentially exposes Gmail, Drive, Calendar, Docs, Sheets, Slides and other Workspace actions. Start with read-only scopes; require confirmation for send/delete/share/modify actions.

### Google Cloud Java
Source: https://github.com/googleapis/google-cloud-java  
**Declared:** idiomatic Java clients for individual Google Cloud services. Reference-only for Angel's current TypeScript stack.

## Browser, web and network references

### ChatGPT for Google browser extension
Source: https://github.com/wong2/chatgpt-google-extension  
README: https://github.com/wong2/chatgpt-google-extension/blob/main/README.md  
**Declared:** browser extension displaying an AI answer beside search results across Google and several other engines. The README says development stopped after acquisition in 2023.  
**Angel opportunity:** modern research UX with source results beside cited summaries and selectable search providers.  
**Decision:** study UX, not adopt unmaintained code without dependency/security review.

### Google Vercel Website Proxy
Source: https://github.com/gaowanlu/google  
README: https://github.com/gaowanlu/google/blob/master/README.md  
**Declared:** a Vercel-hosted proxy that routes requests to a configurable target host, using Google as an example.  
**Decision:** do not deploy as a generic proxy or to evade regional/access controls, service terms or authentication. Any legitimate proxy in Angel needs destination allowlists, SSRF defenses, authentication, strict size/time limits and audit logs.

### GoogleTranslateIpCheck
Source: https://github.com/Ponderfly/GoogleTranslateIpCheck  
README: https://github.com/Ponderfly/GoogleTranslateIpCheck/blob/master/README.md  
**Declared:** scans/maintains reachable Google Translate IP entries and can change local hosts-file entries, requiring elevated privileges on some platforms.  
**Decision:** not core to Angel. Do not run it or modify host settings for this audit. Prefer documented translation APIs.

### Google IP list
Source: https://github.com/justjavac/google-ips  
**Declared:** country/region-grouped historical Google IP data offered as JSON/npm/query data.  
**Decision:** do not use a stale third-party list for security, identity verification or production routing.

### Google Maps Scraper
Source: https://github.com/gosom/google-maps-scraper  
**Declared:** extracting Google Maps/business data.  
**Angel opportunity:** business discovery may be useful later.  
**Decision:** inspect terms, data types, request handling and rate limits; prefer official Maps/Places APIs or user-approved sources over unauthorized scraping or large-scale personal-data collection.

### Maps UI libraries
- React: https://github.com/tomchentw/react-google-maps
- AngularJS: https://github.com/angular-ui/angular-google-maps

The React package is an older Maps integration. The AngularJS repository explicitly says it is no longer actively maintained and is outdated. Do not adopt either by default. For any future mapping, evaluate a maintained library compatible with the selected platform and API terms.

## Research data and security references

### Google Research
Source: https://github.com/google-research/google-research  
**Declared:** a large collection of released research implementations. Its README states dataset licensing is CC BY 4.0 and source licensing Apache 2.0, but each subproject still needs its own instructions and license context reviewed.  
**Angel use:** discovery of selected algorithms/benchmarks, not bulk cloning.

### Google 10,000 English words
Source: https://github.com/first20hours/google-10000-english  
**Declared:** frequency-derived list of common English words; marked not maintained. Optional test data only, not a primary language or translation system.

### Google CTF
Source: https://github.com/google/google-ctf  
README: https://github.com/google/google-ctf/blob/main/README.md  
**Declared:** CTF challenges and infrastructure examples. README warns some challenge code intentionally contains unfixed vulnerabilities and is unsafe for production.  
**Angel use:** defensive security learning fixtures in a disposable sandbox only. Never run challenge code on production infrastructure.

### Protocol Buffers
Source: https://github.com/protocolbuffers/protobuf  
**Declared:** language-neutral structured-data serialization, schema definitions and compiler/runtime.  
**Angel use:** only if a service boundary needs strongly typed RPC/interoperability. The current app can start with typed TypeScript interfaces and JSON HTTP APIs.

### Google Mobile Ads examples
Source: https://github.com/googleads/googleads-mobile-android-examples  
**Declared:** README identifies the repository examples as legacy and directs readers to next-generation samples. No relevance to Angel's operating core; monetization SDKs belong to a later product stage.

### FlutterFire
Source: https://github.com/firebase/flutterfire  
**Declared:** Firebase plugins for Flutter across supported mobile/web/desktop targets. This is a possible future Flutter-native client reference, not a reason to replace the current React/TypeScript app.

## OpenAI API and provider compatibility references

### OpenAI Cookbook
Source: https://github.com/openai/openai-cookbook  
**Declared:** examples and guides for common API tasks, largely Python notebooks. Use as a conceptual/API reference; executable examples require an authorized key and may incur usage cost.

### OpenAI Python SDK
Source: https://github.com/openai/openai-python  
**Declared:** official synchronous/asynchronous Python clients with typed request/response data. Direct dependency only if Angel deliberately adds a Python service; otherwise use the appropriate TypeScript SDK or HTTP adapter.

### Betalgo OpenAI SDK (.NET)
Source: https://github.com/betalgo/openai  
Repository metadata confirms the repo exists, default branch master and MIT license; description identifies it as a .NET OpenAI API library. Reference only unless a .NET service is deliberately introduced.

### MacPaw OpenAI Swift SDK
Source: https://github.com/MacPaw/OpenAI  
**Declared:** community-maintained Swift implementation of the public API. Potential reference for a future Swift/native companion, not the web runtime.

### PublicAffairs OpenAI-Gemini compatibility proxy
Source: https://github.com/PublicAffairs/openai-gemini  
**Declared:** serverless/local proxy exposing an OpenAI-compatible endpoint backed by the Gemini API, intended for tools that only speak OpenAI-format requests.  
**Angel opportunity:** a compatibility-adapter pattern.  
**Gates:** verify current Gemini quotas, authentication, streaming/error semantics and deployment terms. Keep secrets server-side; a free proxy is not unlimited compute.

### Go OpenAI SDK
Source: https://github.com/sashabaranov/go-openai  
**Declared:** unofficial Go API client with coverage for responses/chat, tools, embeddings, images, audio, moderation, files, fine-tuning, batches and vector stores. Reference-only unless a Go microservice is deliberately introduced.

### TheoKanning OpenAI Java SDK
Source: https://github.com/TheoKanning/openai-java  
**Declared by README:** archived/unmaintained since 2024-06-06 and warns that Engine-based endpoints are deprecated. Reject for new integration work.

### Feishu OpenAI
Source: https://github.com/ConnectAI-E/feishu-openai  
**Declared:** Feishu/Lark messaging integration combining GPT, DALL·E and Whisper, with advertised administration and usage controls. Potential messaging-channel pattern for later; check maintenance, provider terms, privacy and billing before considering code.

## Consolidated decisions

| Capability | References | Angel decision |
|---|---|---|
| Translation | Hy-MT2 | Optional language adapter after license, weight and hardware review |
| Image generation/editing | Qwen Image 2.1 | Future Media Studio; check local/API cost and license |
| Model optimization | NVIDIA Model Optimizer | Defer until a real local/server model target exists |
| GPU infrastructure | GPU Operator | Defer until GPU/Kubernetes hosting exists |
| Google user data | Official APIs + Workspace MCP | Prioritize with scoped OAuth, audit logs and confirmation gates |
| MFA | Supabase MFA or TOTP libraries | Prefer managed MFA before custom auth code |
| Web research | Search UI pattern + official web APIs | Build citation-first research, not a stale extension fork |
| Maps | Official Maps APIs; scraper as study target | Do not depend on unauthorized extraction |
| Provider bridges | OpenAI-Gemini proxy | Small secure adapter with transparent quotas |
| Security learning | Google CTF | Sandboxed defensive training only |
| Other-language SDKs | PHP, Go, Java, .NET, Swift, Flutter | Reference unless a deliberate native/service architecture is approved |
