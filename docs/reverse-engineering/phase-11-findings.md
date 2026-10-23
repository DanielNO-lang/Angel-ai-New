# Phase 11 Findings: Hy-MT2 Translation and Qwen Image 2.1 Media Models

**Review date:** 2026-10-23  
**Evidence level:** model README, benchmark entrypoints, prompt-rewrite source files and license documents inspected; no models downloaded or inference executed.

## 1. Tencent Hy-MT2: translation and instruction-following evaluation

Repository: https://github.com/Tencent-Hunyuan/Hy-MT2  
Pinned code revision: ff1903ecaa724e10951a23c16817a2413c752b35

### Capabilities declared by the repository
- Model family includes 1.8B, 7B and 30B-A3B MoE variants.
- It targets 33 languages, complex real-world translation and multi-language instruction following.
- It publishes FP8 and GGUF quantized model variants.
- The README advertises a 1.8B AngelSlim 1.25-bit quantized variant at about 440 MB. Quality and runtime must be benchmarked before assuming it is useful offline.
- The repository includes IFMTBench, a benchmark for translation instruction-following behavior.

### Source files/functions inspected
- IFMTBench/run_eval.py: load_jsonl, load_responses and main; loads input cases and model outputs, invokes batch scoring, prints summary metrics and can skip the LLM judge for rule-only debugging.
- IFMTBench/config.py: LLM judge endpoint/model configuration, worker count, retries, request timeout and class mappings into glossary, style, background, layout-preservation, structured-data and code-preservation evaluation dimensions.
- train/README.md: describes message-format training data and distinct LoRA/full-finetune hardware requirements. Training is a separate high-compute activity, not needed to call existing model weights.

### Angel adoption
- Translation adapter for text, documents and video subtitles.
- User-selectable target language, tone/style instruction, terminology glossary and format-preservation policy.
- Benchmark suite for preserving placeholders, inline code, delimiters, JSON/XML structure and glossary terms.
- Potential future offline language model if a supported device and inference engine can run the quantized weights.

### Critical license finding
The GitHub repository's LICENSE.txt labels the repository code Apache 2.0, while the linked Hugging Face model file inspected for Tencent/Hy-MT2-30B-A3B contains a **Tencent HY Community License Agreement**. It expressly excludes the European Union from its territory and imposes additional terms for model use/distribution; the Hugging Face model card metadata itself displayed an Apache-2.0 label while its downloadable LICENSE.txt contained the community terms. This is a material metadata/license mismatch, not something Angel should resolve by guessing.

Official references:
- Repository license: https://github.com/Tencent-Hunyuan/Hy-MT2/blob/ff1903ecaa724e10951a23c16817a2413c752b35/LICENSE.txt
- Model LICENSE inspected: https://huggingface.co/tencent/Hy-MT2-30B-A3B/blob/60cd62baf58aa1e1b3f0b9292521afd1de4d8bd3/LICENSE.txt
- Model card: https://huggingface.co/tencent/Hy-MT2-30B-A3B

**Decision gate:** verify the license of the exact checkpoint/quantized artifact being used and get legal clarification on the metadata mismatch and territory clauses before shipping model weights or a hosted service. Do not assume the repo's source-code license automatically covers every model artifact.

## 2. Qwen Image 2.1: generation, editing and prompt enhancement

Repository: https://github.com/QwenLM/Qwen-Image-2.1  
Pinned source revision: ab96caa944157ca28a4f36b695c3047549f48f98

### Capabilities declared by the model repository
- Unified text-to-image and image-editing model with a 7B visual generation component.
- Native transparent RGBA generation/editing, subject extraction and transparent layer work.
- Supports up to 10 reference images and local edits guided by masks, annotations or circles.
- The repository announces Qwen-Image-2.1 Pro/Turbo APIs and an 8-denoising-step Turbo variant, as well as support through Diffusers and several inference tools.
- The repository's root contains documentation, assets and a prompt-rewrite subsystem; large checkpoints are hosted separately.

### Prompt-rewrite subsystem inspected
Sources:
- https://github.com/QwenLM/Qwen-Image-2.1/blob/ab96caa944157ca28a4f36b695c3047549f48f98/prompt_rewrite/pe_core.py
- https://github.com/QwenLM/Qwen-Image-2.1/blob/ab96caa944157ca28a4f36b695c3047549f48/prompt_rewrite/run_transformers.py
- https://github.com/QwenLM/Qwen-Image-2.1/blob/ab96caa944157ca28a4f36b695c3047549f48/prompt_rewrite/run_vllm.py
- https://github.com/QwenLM/Qwen-Image-2.1/blob/ab96caa944157ca28a4f36b695c3047549f48/prompt_rewrite/client.py

Key functions:
- pe_core.py: Profile.sampling_summary, get_profile, load_system_prompt, load_cases, resolve_image_paths, load_image, build_messages, split_thinking, _balanced_spans, _as_obj, parse_answer, build_record, write_records and report_parse_failures.
- run_transformers.py: PresencePenalty.__call__, rewrite and main.
- run_vllm.py: image_to_data_uri and main for a loaded batch-serving/inference engine.
- client.py: image_to_data_uri, _flatten, rewrite_one and main, with optional concurrent batch processing against an OpenAI-compatible prompt-enhancement server.

The prompt enhancer has distinct text-to-image (t2i) and image-editing (edit) profiles. It emits a defined JSON contract: rewritten prompt and width/height ratio for t2i; rewritten prompt, ratio and ratio-follow behavior for editing. The README describes separate fine-tuned Qwen3.5-VL 9B prompt-enhancer checkpoints, not the base Qwen Image generation weights. Do not conflate the prompt enhancer with the image-generation model.

### Angel adoption
- Future Media Studio API adapter for user-authorized image creation and editing.
- Generate transparent logo/avatar/expression assets only after a model/API is approved for Angel's actual commercial and privacy needs.
- Preserve uploaded image references, masks, aspect ratios, edit instructions and generated output metadata as versioned task artifacts.
- The prompt enhancer can improve short natural-language requests, but only if the required checkpoint/provider is available and its license/cost supports Angel.
- Prefer hosted API use when appropriate, but verify the API's commercial terms, pricing, request limits, image retention and safety rules separately from model-weight license terms.

### Critical Qwen license finding
The Qwen-Image-2.1 repository's LICENSE file is the **Qwen Research License Agreement**, released September 20, 2026. Its section 1(i) defines non-commercial as research or evaluation only; section 2(a) grants rights for non-commercial purposes only; section 2(b) says commercial use requires a separate commercial license. This differs from earlier Qwen Image releases, so Angel must not carry over the prior Apache assumption.

Official references:
- README: https://github.com/QwenLM/Qwen-Image-2.1/blob/ab96caa944157ca28a4f36b695c3047549f48f98/README.md
- License: https://github.com/QwenLM/Qwen-Image-2.1/blob/ab96caa944157ca28a4f36b695c3047549f48f98/LICENSE
- Hugging Face license copy: https://huggingface.co/Qwen/Qwen-Image-2.1/blob/main/LICENSE

**Decision gate:** do not incorporate the downloaded weights or prompt-enhancer checkpoints into a commercial Angel service without a separate verified license. If using a hosted API, evaluate that API's own terms and pricing; API access does not imply the model's weight license is commercially permissive.

## 3. Recommended model-interface contract

Angel should keep models behind adapters with:
- task and model identifier;
- supported modalities and input limits;
- hosted/local runtime kind;
- license/terms URL and verified date;
- hardware and latency expectations;
- cost/quotas and fallback policy;
- output schema, quality/evaluation suite and known limitations;
- retention/privacy policy for user inputs and generated outputs.

Neither model should become an automatic dependency merely because a public repository exists. License eligibility, runtime availability, quality and operational cost are independent go/no-go checks.
