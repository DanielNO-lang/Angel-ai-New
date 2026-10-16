"""Isolated disposable-container Python execution service for Angel.

Deploy only on a dedicated Linux VM with Docker Engine and pre-pulled Python
images. Each user program runs in a no-network, resource-limited container.
This service never evals user code inside its host Python process.
"""
from __future__ import annotations

import asyncio
import hmac
import os
import re
import time
import uuid
from collections import defaultdict, deque
from typing import Any, Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

SERVICE_TOKEN = os.getenv("ANGEL_PYTHON_RUN_TOKEN", "")
SANDBOX_IMAGE = os.getenv("ANGEL_PYTHON_SANDBOX_IMAGE", "python:3.12-slim")
MAX_CODE_CHARS = 20_000
MAX_STDIN_CHARS = 5_000
MAX_OUTPUT_CHARS = 20_000
MAX_OUTPUT_BYTES_PER_STREAM = MAX_OUTPUT_CHARS * 4
MAX_RUN_TIMEOUT_MS = 10_000
MIN_RUN_TIMEOUT_MS = 1_000
MAX_CONCURRENT_RUNS = min(8, max(1, int(os.getenv("ANGEL_PYTHON_MAX_CONCURRENCY", "2"))))
SLOT_SEMAPHORE = asyncio.Semaphore(MAX_CONCURRENT_RUNS)
USER_RUNS: dict[str, deque[float]] = defaultdict(deque)
MAX_RUNS_PER_MINUTE = 5

if not SERVICE_TOKEN:
    raise RuntimeError("ANGEL_PYTHON_RUN_TOKEN must be configured before startup.")
if not SANDBOX_IMAGE.strip():
    raise RuntimeError("ANGEL_PYTHON_SANDBOX_IMAGE must not be empty.")

app = FastAPI(title="Angel Isolated Python Runner", version="1.0.0")


class RunRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    language: Literal["python"]
    code: str = Field(min_length=1, max_length=MAX_CODE_CHARS)
    stdin: str = Field(default="", max_length=MAX_STDIN_CHARS)
    timeoutMs: int = Field(default=5_000, ge=MIN_RUN_TIMEOUT_MS, le=MAX_RUN_TIMEOUT_MS)
    requestId: str = Field(default="unknown-user", min_length=1, max_length=200)
    # Accepted for bridge compatibility but deliberately ignored. The service,
    # not the caller, owns resource-limit policy.
    limits: dict[str, Any] | None = None


async def authenticate(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer service token required.")
    supplied = authorization[7:].strip()
    if not hmac.compare_digest(supplied, SERVICE_TOKEN):
        raise HTTPException(status_code=403, detail="Invalid service token.")


def _check_user_rate_limit(user_id: str) -> None:
    now = time.monotonic()
    entries = USER_RUNS[user_id]
    while entries and now - entries[0] > 60:
        entries.popleft()
    if len(entries) >= MAX_RUNS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Python execution rate limit exceeded.")
    entries.append(now)
    if len(USER_RUNS) > 5_000:
        stale = [key for key, values in USER_RUNS.items() if not values or now - values[-1] > 120]
        for key in stale:
            USER_RUNS.pop(key, None)


async def _command(
    *args: str,
    input_bytes: bytes | None = None,
    timeout_seconds: float = 5.0,
) -> tuple[int, bytes, bytes]:
    try:
        process = await asyncio.create_subprocess_exec(
            *args,
            stdin=asyncio.subprocess.PIPE if input_bytes is not None else asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail="Docker Engine CLI is unavailable on this runner host.") from error
    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(input_bytes), timeout=timeout_seconds)
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        raise HTTPException(status_code=504, detail="Sandbox infrastructure command timed out.")
    return process.returncode or 0, stdout[:4_000], stderr[:4_000]


async def _drain_limited(
    stream: asyncio.StreamReader,
    output: bytearray,
    overflow: asyncio.Event,
) -> None:
    while True:
        chunk = await stream.read(4096)
        if not chunk:
            return
        remaining = MAX_OUTPUT_BYTES_PER_STREAM - len(output)
        if remaining > 0:
            output.extend(chunk[:remaining])
        if len(chunk) > remaining:
            overflow.set()


async def _run_code_in_container(
    container_id: str,
    stdin_text: str,
    timeout_seconds: float,
) -> tuple[int, str, str, bool, bool]:
    process = await asyncio.create_subprocess_exec(
        "docker", "exec", "-i", container_id, "python", "-I", "-S", "/tmp/main.py",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout = bytearray()
    stderr = bytearray()
    overflow = asyncio.Event()
    stdout_task = asyncio.create_task(_drain_limited(process.stdout, stdout, overflow))
    stderr_task = asyncio.create_task(_drain_limited(process.stderr, stderr, overflow))

    try:
        if process.stdin is not None:
            process.stdin.write(stdin_text.encode("utf-8"))
            await process.stdin.drain()
            process.stdin.close()
            try:
                await process.stdin.wait_closed()
            except (BrokenPipeError, ConnectionResetError):
                pass

        wait_task = asyncio.create_task(process.wait())
        overflow_task = asyncio.create_task(overflow.wait())
        done, pending = await asyncio.wait(
            {wait_task, overflow_task},
            timeout=timeout_seconds,
            return_when=asyncio.FIRST_COMPLETED,
        )

        exceeded_output = overflow.is_set()
        timed_out = not done or (overflow_task in done and wait_task not in done)
        if timed_out:
            await _command("docker", "kill", container_id, timeout_seconds=3.0)
            if process.returncode is None:
                process.kill()
                await process.wait()
        else:
            await wait_task

        for task in pending:
            task.cancel()
        await asyncio.gather(stdout_task, stderr_task, return_exceptions=True)
        if exceeded_output:
            exit_code = 125
        elif timed_out:
            exit_code = 124
        else:
            exit_code = process.returncode if process.returncode is not None else 1
        return (
            int(exit_code),
            stdout.decode("utf-8", errors="replace")[:MAX_OUTPUT_CHARS],
            stderr.decode("utf-8", errors="replace")[:MAX_OUTPUT_CHARS],
            timed_out and not exceeded_output,
            exceeded_output,
        )
    finally:
        if process.returncode is None:
            process.kill()
            await process.wait()
        await asyncio.gather(stdout_task, stderr_task, return_exceptions=True)


@app.get("/health")
async def health() -> dict[str, Any]:
    code, _, _ = await _command("docker", "info", "--format", "{{.ServerVersion}}", timeout_seconds=3.0)
    if code != 0:
        raise HTTPException(status_code=503, detail="Docker Engine is not ready on the sandbox host.")
    return {
        "status": "ok",
        "service": "angel-python-sandbox",
        "containerImage": SANDBOX_IMAGE,
        "maxTimeoutMs": MAX_RUN_TIMEOUT_MS,
        "networkAccessInsideSandbox": False,
        "maxOutputCharsPerStream": MAX_OUTPUT_CHARS,
    }


@app.post("/run", dependencies=[Depends(authenticate)])
async def run_python(request: RunRequest) -> dict[str, Any]:
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="code must not be blank.")

    _check_user_rate_limit(request.requestId)
    if SLOT_SEMAPHORE.locked():
        raise HTTPException(status_code=429, detail="Python sandbox capacity is busy. Try again shortly.")

    async with SLOT_SEMAPHORE:
        started = time.monotonic()
        container_name = "angel-python-" + uuid.uuid4().hex
        container_id = ""
        try:
            create_args = [
                "docker", "create",
                "--network", "none",
                "--memory", "128m",
                "--memory-swap", "128m",
                "--cpus", "0.5",
                "--pids-limit", "32",
                "--read-only",
                "--tmpfs", "/tmp:rw,noexec,nosuid,nodev,size=16m,mode=1777",
                "--user", "65534:65534",
                "--cap-drop", "ALL",
                "--security-opt", "no-new-privileges:true",
                "--name", container_name,
                SANDBOX_IMAGE,
                "python", "-I", "-S", "-c", "import time; time.sleep(3600)",
            ]
            create_code, stdout, _ = await _command(*create_args, timeout_seconds=5.0)
            if create_code != 0:
                raise HTTPException(status_code=503, detail="Could not create an isolated Python container.")
            container_id = stdout.decode("utf-8", errors="replace").strip()
            if not re.fullmatch(r"[0-9a-f]{12,64}", container_id):
                raise HTTPException(status_code=502, detail="Docker returned an invalid container identifier.")

            start_code, _, _ = await _command("docker", "start", container_id, timeout_seconds=5.0)
            if start_code != 0:
                raise HTTPException(status_code=503, detail="Could not start the isolated Python container.")

            # Send source through a pipe into the ephemeral container filesystem.
            # It is not interpolated into a shell command or placed in container env.
            cat_code, _, _ = await _command(
                "docker", "exec", "-i", container_id, "sh", "-c", "cat > /tmp/main.py",
                input_bytes=request.code.encode("utf-8"),
                timeout_seconds=5.0,
            )
            if cat_code != 0:
                raise HTTPException(status_code=502, detail="Could not stage Python source in the isolated container.")

            exit_code, stdout_text, stderr_text, timed_out, exceeded_output = await _run_code_in_container(
                container_id,
                request.stdin,
                request.timeoutMs / 1000,
            )
            if timed_out:
                stderr_text = (stderr_text + "\nExecution stopped after the time limit.").strip()
            if exceeded_output:
                stderr_text = (stderr_text + "\nExecution stopped after exceeding the output limit.").strip()

            return {
                "stdout": stdout_text,
                "stderr": stderr_text,
                "exitCode": int(exit_code),
                "durationMs": int((time.monotonic() - started) * 1000),
            }
        except HTTPException:
            raise
        except asyncio.TimeoutError as error:
            raise HTTPException(status_code=504, detail="Python execution timed out.") from error
        except Exception as error:
            # Do not log source code or return low-level daemon messages to callers.
            raise HTTPException(status_code=502, detail="Isolated Python execution failed.") from error
        finally:
            if container_id:
                await _command("docker", "rm", "-f", container_id, timeout_seconds=3.0)
