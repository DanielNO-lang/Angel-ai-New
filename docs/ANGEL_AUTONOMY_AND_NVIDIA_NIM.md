# Angel Autonomous Intelligence and NVIDIA NIM

Updated: 2026-10-24

## Objective

Angel's goal is capable, goal-directed autonomy within the user's granted boundaries. This is not a claim of consciousness or unlimited general intelligence, and it does not turn Angel into an operating system. Angel retains its own identity, UI, memory, permissions, and orchestration.

## Autonomy model

The first implementation establishes a policy boundary between a proposed action and permission to execute it.

- **Assist:** propose actions; do not execute autonomously.
- **Supervised:** read actions may proceed; changes require approval.
- **Bounded:** perform reversible actions only when the matching permission is explicitly granted.
- **Proactive:** allow permitted, bounded follow-through, but external side effects still require explicit approval.

Action categories include read, reversible write, external message, financial, destructive, security, deployment, and code change. Financial, destructive, security-sensitive and deployment actions require explicit approval. Missing required permissions deny the action. Model-generated plans are proposals, never authority.

The policy engine exposes:
- `evaluateAutonomousAction`: decide allow / approval required / deny for a proposed step.
- `evaluatePlan`: priority-order a proposed plan, enforce a bounded step count, and return per-step decisions.
- The agent orchestrator applies the policy to task creation and memory writes. A write without the corresponding permission is not performed.

## What this does not yet claim

- It does not provide consciousness, perfect reasoning, or self-modification.
- It does not give the model arbitrary shell, desktop, browser, or GitHub access.
- It does not make external work persistent by itself; durable task scheduling and restart recovery require a persistent worker and execution state.
- It does not automatically approve actions because a model says they are safe.
- Approval-required decisions are logged; a complete user-facing approval queue for every autonomous tool category remains a follow-up.

## NVIDIA NIM adapter

Angel registers an optional `nvidia-nim` provider using the OpenAI-compatible chat-completions API. It is disabled until credentials are configured.

Server-only environment variables:
- `NVIDIA_NIM_API_KEY` (or `NVIDIA_API_KEY`)
- `NVIDIA_NIM_BASE_URL` (optional; defaults to `https://integrate.api.nvidia.com/v1`)
- `NVIDIA_NIM_MODEL_ID` (optional; defaults to `meta/llama-3.1-8b-instruct`)
- `NVIDIA_NIM_EMBEDDING_MODEL_ID` (optional, for an endpoint that supports embeddings)

The selected model ID must be available to the configured NVIDIA endpoint. A configured key is not proof of quota or successful inference. After adding credentials, run a small live inference test and verify output, latency, and provider/model identifiers. Never expose these values with a `VITE_` prefix.

NIM can provide an additional model route; it does not make Angel intrinsically smarter by itself. Compare it against the current Gemini provider using a fixed evaluation set before changing defaults. Keep Gemini as the existing default until measurements justify a change.

## NVIDIA Model Optimizer

Use Model Optimizer only in a separate benchmark/build environment with compatible Hugging Face, PyTorch, or ONNX models. Record baseline answer quality, latency, throughput, memory and hardware; optimize a candidate checkpoint; rerun the same tests; then serve the result through an external inference endpoint. Do not run GPU optimization inside Netlify Functions.

## NVIDIA GPU Operator

Defer GPU Operator until Angel has a Kubernetes cluster with compatible NVIDIA GPU nodes. It manages GPU drivers and related Kubernetes components; it is not needed for the current Netlify application.

## Current deployment boundary

All changes in this work remain on a feature branch and are proposed through a pull request. Do not deploy to Netlify or modify production configuration until explicitly authorized.
