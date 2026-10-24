#!/usr/bin/env python3
"""Small, reproducible text-generation benchmark for baseline/optimized checkpoints.

Run this only in an isolated Python environment with a compatible model and GPU.
It measures latency and peak CUDA memory; it does not claim model quality parity.
"""
from __future__ import annotations

import argparse
import json
import platform
import statistics
import time
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer


def synchronize() -> None:
    if torch.cuda.is_available():
        torch.cuda.synchronize()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="Hugging Face ID or local checkpoint path")
    parser.add_argument("--prompt", default="Explain how to plan a reliable multi-step software task.")
    parser.add_argument("--warmup", type=int, default=1)
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--max-new-tokens", type=int, default=128)
    parser.add_argument("--output", default="benchmark-result.json")
    args = parser.parse_args()
    if args.runs < 1 or args.warmup < 0 or args.max_new_tokens < 1:
        raise SystemExit("runs/max-new-tokens must be positive; warmup cannot be negative")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device != "cuda":
        raise SystemExit("No CUDA GPU detected. Run this benchmark on compatible NVIDIA GPU hardware.")

    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=False)
    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        torch_dtype="auto",
        device_map="auto",
        trust_remote_code=False,
    )
    inputs = tokenizer(args.prompt, return_tensors="pt").to(model.device)

    def run_once() -> tuple[float, int, str]:
        if torch.cuda.is_available():
            torch.cuda.reset_peak_memory_stats()
        synchronize()
        started = time.perf_counter()
        with torch.inference_mode():
            output = model.generate(**inputs, max_new_tokens=args.max_new_tokens, do_sample=False)
        synchronize()
        elapsed = time.perf_counter() - started
        new_tokens = max(0, int(output.shape[-1] - inputs["input_ids"].shape[-1]))
        decoded = tokenizer.decode(output[0], skip_special_tokens=True)
        return elapsed, new_tokens, decoded

    for _ in range(args.warmup):
        run_once()

    measurements = [run_once() for _ in range(args.runs)]
    latencies = [item[0] for item in measurements]
    token_counts = [item[1] for item in measurements]
    peak_memory = torch.cuda.max_memory_allocated() / (1024 ** 3)
    mean_latency = statistics.mean(latencies)
    mean_tokens = statistics.mean(token_counts)
    result = {
        "model": args.model,
        "device": device,
        "gpu": torch.cuda.get_device_name(0),
        "cuda_version": torch.version.cuda,
        "python": platform.python_version(),
        "runs": args.runs,
        "warmup_runs": args.warmup,
        "max_new_tokens": args.max_new_tokens,
        "latency_seconds": {"mean": mean_latency, "min": min(latencies), "max": max(latencies)},
        "generated_tokens": {"mean": mean_tokens},
        "tokens_per_second": mean_tokens / mean_latency if mean_latency else None,
        "peak_cuda_memory_gib": peak_memory,
        "sample_output": measurements[-1][2][:2000],
        "note": "Compare output quality on a fixed evaluation set; this script measures performance only.",
    }
    Path(args.output).write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
