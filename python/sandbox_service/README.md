# Angel Python sandbox service

This optional service implements Angel's remote Python runner contract. It runs outside the Netlify Function and starts each user program in a fresh Docker container.

## Required host boundary

Deploy on a **dedicated Linux VM** with Docker Engine and a pre-pulled Python image. Do not mount a Docker socket into an ordinary multi-tenant application container. The runner requires permission to create and destroy containers, so treat this dedicated host as a sensitive execution boundary, keep it separate from data-bearing workloads, use HTTPS and a strong service token, and restrict inbound traffic at the network layer.

Each sandbox container has:
- no network interface other than its isolated loopback namespace;
- a read-only root filesystem and ephemeral /tmp only;
- no host-path or secret mounts;
- a non-root UID, no Linux capabilities and no-new-privileges;
- 128 MB memory, 0.5 CPU and 32 processes maximum;
- a 1 to 10 second wall-clock execution timeout;
- 20,000 characters of stdout and stderr per stream;
- Python's isolated -I -S mode, using the standard library only.

The service never evaluates user code in its own Python process. It sends source through a pipe into the short-lived container, where the source is written to ephemeral /tmp/main.py. Shell commands are fixed constants, not built by interpolating user input.

## Setup

On the dedicated Linux host, install Python 3.11+, uv and Docker Engine. Pull the execution image before starting the service:

~~~bash
docker pull python:3.12-slim
cd python/sandbox_service
uv sync
export ANGEL_PYTHON_RUN_TOKEN="<strong-random-shared-secret>"
export ANGEL_PYTHON_SANDBOX_IMAGE="python:3.12-slim"
uv run uvicorn main:app --host 127.0.0.1 --port 8081
~~~

Place a TLS-terminating reverse proxy or private service gateway in front of the service. Bind to localhost as shown unless traffic is controlled by a trusted private network/firewall. Do not expose Docker Engine itself on a public TCP port.

Set Angel's Netlify Function variables:
- ANGEL_PYTHON_RUN_URL=https://<your-protected-service>/run
- ANGEL_PYTHON_RUN_TOKEN=<same token as ANGEL_PYTHON_RUN_TOKEN on the runner>

Never prefix either variable with VITE_.

## Contract

Authenticated service request:

~~~json
{
  "language": "python",
  "code": "print(1 + 1)",
  "stdin": "",
  "timeoutMs": 5000,
  "limits": {
    "memoryMb": 128,
    "networkAccess": false,
    "filesystemAccess": "ephemeral-only",
    "maxOutputChars": 20000
  },
  "requestId": "verified-user-id"
}
~~~

Response:

~~~json
{"stdout":"2\n","stderr":"","exitCode":0,"durationMs":120}
~~~

The incoming limits field is ignored; resource policy is controlled by this service. Configure monitoring and cleanup for containers left by host failures, and keep Docker Engine patched. Isolation reduces risk but cannot guarantee there are no container-runtime vulnerabilities. For sensitive production workloads, consider a stronger sandbox runtime such as gVisor or a managed code-execution service.
