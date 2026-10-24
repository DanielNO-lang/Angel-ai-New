# NVIDIA Model Optimizer evaluation workflow

This folder is an offline GPU benchmark harness for evaluating a baseline model and a candidate checkpoint produced with NVIDIA Model Optimizer. It is intentionally separate from Angel's Netlify app.

## Requirements

- Linux or a compatible local GPU workstation with NVIDIA GPU drivers/CUDA set up.
- A compatible PyTorch build, Transformers, and a model whose license permits the intended use.
- NVIDIA Model Optimizer installed in a dedicated environment when creating an optimized checkpoint.

Create an isolated environment and install the current versions recommended by the official documentation. Model Optimizer's upstream project documents installation and model support: https://github.com/NVIDIA/Model-Optimizer

## Baseline measurement

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install torch transformers
python benchmark.py --model <BASELINE_MODEL_ID_OR_PATH> --runs 5 --warmup 2 --output baseline.json
```

## Optimized measurement

Use the upstream Model Optimizer examples for the chosen model family and target inference runtime. Export a checkpoint supported by the selected runtime, then benchmark it with the same prompt, hardware, warmup, run count and token limit:

```bash
python benchmark.py --model <OPTIMIZED_CHECKPOINT_PATH> --runs 5 --warmup 2 --output optimized.json
```

The script requires CUDA and exits if no CUDA GPU is available. It records latency, throughput and peak allocated CUDA memory. It does **not** establish answer-quality parity or support every quantized checkpoint format.

## Promotion gate

Do not promote an optimized checkpoint just because it is faster. Compare baseline and candidate on a fixed, representative Angel evaluation set and record:
- task success / answer quality and regression rate;
- latency and tokens per second;
- peak GPU memory and throughput under concurrency;
- model, tokenizer, quantization settings, runtime and GPU;
- exact model license and any redistribution constraints.

Keep the baseline until the candidate passes quality and safety checks. Angel should connect to the resulting external inference endpoint only after an actual inference smoke test. No optimization runs inside Netlify Functions.
