"""Angel's optional Google ADK 2.0 runtime.

Deploy this FastAPI service separately from Netlify. It supports durable ADK
sessions when ANGEL_ADK_DATABASE_URL is configured and adds user-scoped access
to Angel's authenticated MCP endpoint for each request. User access tokens are
used only for that invocation and are never stored in session state or logs.
"""
from __future__ import annotations

import hmac
import os
import time
import uuid
from typing import Any
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai import types

APP_NAME = os.getenv("ANGEL_ADK_APP_NAME", "angel-adk-bridge").strip()
MODEL = os.getenv("ANGEL_ADK_MODEL", "gemini-2.5-flash").strip()
SERVICE_TOKEN = os.getenv("ANGEL_ADK_SERVICE_TOKEN", "").strip()
DATABASE_URL = os.getenv("ANGEL_ADK_DATABASE_URL", "").strip()
MCP_SERVER_URL = os.getenv("ANGEL_ADK_MCP_SERVER_URL", "").strip()

if not SERVICE_TOKEN:
    raise RuntimeError("ANGEL_ADK_SERVICE_TOKEN must be configured before startup.")

if DATABASE_URL:
    # DatabaseSessionService keeps the session/event history outside this
    # process. The same URL must be accessible from every running instance.
    from google.adk.sessions.database_session_service import DatabaseSessionService

    session_service = DatabaseSessionService(DATABASE_URL)
    SESSION_PERSISTENCE = "database"
else:
    session_service = InMemorySessionService()
    SESSION_PERSISTENCE = "in-memory (single instance only)"


def _build_agent(mcp_toolset: Any | None = None) -> Agent:
    """Construct a multi-agent ADK runtime for one invocation."""
    planner = Agent(
        name="angel_task_planner",
        model=MODEL,
        description="Break complex engineering and research requests into bounded steps and success criteria.",
        instruction=(
            "Plan only when it helps. Return a short ordered plan with assumptions, "
            "dependencies, and checkable completion criteria. Do not claim execution."
        ),
    )
    implementer = Agent(
        name="angel_implementation_specialist",
        model=MODEL,
        description="Turn an approved task into an implementation approach using configured tools when available.",
        instruction=(
            "Work within the user's requested scope. Use configured tools when appropriate. "
            "Never claim files, services, or deployments changed unless a tool confirms it. "
            "Call out any missing runtime, permission, credential, or external dependency."
        ),
    )
    verifier = Agent(
        name="angel_verification_specialist",
        model=MODEL,
        description="Check implementation outcomes, errors, risks, and evidence before reporting completion.",
        instruction=(
            "Assess what has actually been observed. Distinguish tests passed from tests not run, "
            "and distinguish configured integrations from verified live behavior. Never invent evidence."
        ),
    )

    tools = [mcp_toolset] if mcp_toolset is not None else []
    return Agent(
        name="angel_adk_orchestrator",
        model=MODEL,
        description="Angel's multi-agent coordinator for planning, implementation, and verification.",
        instruction=(
            "You are Angel's task coordinator. Delegate planning, implementation guidance, and "
            "verification to the specialist agents when useful. For a simple question, answer directly. "
            "Use MCP tools only when configured and authorized for this request. The toolset can access "
            "the authenticated user's Angel capabilities, skills, translation, image generation, and isolated "
            "Python execution. Do not recursively call the ADK tool. Do not claim a tool worked unless its result "
            "confirms success. Keep the final answer actionable and note unresolved dependencies."
        ),
        sub_agents=[planner, implementer, verifier],
        tools=tools,
    )


app = FastAPI(title="Angel ADK Bridge", version="2.0.0")


class RunRequest(BaseModel):
    appName: str = Field(default=APP_NAME, min_length=1, max_length=100)
    userId: str = Field(min_length=1, max_length=200)
    sessionId: str | None = Field(default=None, max_length=160)
    message: str = Field(min_length=1, max_length=20000)
    # A per-request Supabase access token for Angel's authenticated MCP gateway.
    # It is used only as an outbound HTTP header and is not retained in ADK state.
    mcpAccessToken: str | None = Field(default=None, max_length=8192)


class RunResponse(BaseModel):
    success: bool
    response: str
    sessionId: str
    appName: str
    durationMs: int
    sessionPersistence: str
    mcpToolsUsed: bool


async def authenticate(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer service token required.")
    supplied = authorization[7:].strip()
    if not hmac.compare_digest(supplied, SERVICE_TOKEN):
        raise HTTPException(status_code=403, detail="Invalid service token.")


def _validate_mcp_url(value: str) -> str:
    parsed = urlparse(value)
    local_http = parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1", "::1"}
    if not parsed.scheme or not parsed.netloc or (parsed.scheme != "https" and not local_http):
        raise HTTPException(status_code=503, detail="ANGEL_ADK_MCP_SERVER_URL must be HTTPS (localhost HTTP is allowed for development).")
    if parsed.username or parsed.password:
        raise HTTPException(status_code=503, detail="Do not embed credentials in ANGEL_ADK_MCP_SERVER_URL.")
    return value


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "angel-adk-bridge",
        "model": MODEL,
        "sessionPersistence": SESSION_PERSISTENCE,
        "mcpToolsConfigured": bool(MCP_SERVER_URL),
    }


@app.post("/run", response_model=RunResponse, dependencies=[Depends(authenticate)])
async def run_agent(request: RunRequest) -> RunResponse:
    if request.appName != APP_NAME:
        raise HTTPException(status_code=400, detail="Unknown ADK appName.")
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message must not be blank.")

    started = time.monotonic()
    external_session_id = (request.sessionId or str(uuid.uuid4())).strip()
    if not external_session_id:
        external_session_id = str(uuid.uuid4())

    mcp_toolset = None
    mcp_used = False
    if MCP_SERVER_URL:
        if not request.mcpAccessToken:
            raise HTTPException(status_code=401, detail="An authenticated Angel user token is required for MCP tools.")
        # Construct a request-scoped toolset. This prevents one user's bearer
        # token from being reused by another user's ADK session or MCP client.
        from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams
        from google.adk.tools.mcp_tool.mcp_toolset import McpToolset

        mcp_toolset = McpToolset(
            connection_params=StreamableHTTPConnectionParams(
                url=_validate_mcp_url(MCP_SERVER_URL),
                headers={"Authorization": "Bearer " + request.mcpAccessToken},
            ),
            # Deliberately exclude angel_adk_run to prevent recursive delegation.
            tool_filter=[
                "angel_capabilities_list",
                "angel_skills_list",
                "angel_skills_get",
                "angel_translate",
                "angel_generate_image",
                "angel_python_execute",
            ],
        )
        mcp_used = True

    try:
        session = await session_service.get_session(
            app_name=APP_NAME,
            user_id=request.userId,
            session_id=external_session_id,
        )
        if session is None:
            await session_service.create_session(
                app_name=APP_NAME,
                user_id=request.userId,
                session_id=external_session_id,
            )

        runner = Runner(
            app_name=APP_NAME,
            agent=_build_agent(mcp_toolset),
            session_service=session_service,
        )
        final_text = ""
        async for event in runner.run_async(
            user_id=request.userId,
            session_id=external_session_id,
            new_message=types.Content(
                role="user",
                parts=[types.Part(text=request.message.strip())],
            ),
        ):
            if event.is_final_response() and event.content:
                final_text = "".join(
                    part.text for part in (event.content.parts or [])
                    if getattr(part, "text", None)
                )

        if not final_text.strip():
            raise HTTPException(status_code=502, detail="ADK agent returned no final text.")

        return RunResponse(
            success=True,
            response=final_text[:50000],
            sessionId=external_session_id,
            appName=APP_NAME,
            durationMs=int((time.monotonic() - started) * 1000),
            sessionPersistence=SESSION_PERSISTENCE,
            mcpToolsUsed=mcp_used,
        )
    except HTTPException:
        raise
    except Exception as error:
        # Do not return provider exception text or request content.
        raise HTTPException(status_code=502, detail="ADK agent execution failed.") from error
    finally:
        if mcp_toolset is not None:
            try:
                await mcp_toolset.close()
            except Exception:
                # Keep cleanup failures from replacing the actual agent result.
                pass
