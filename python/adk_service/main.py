"""Angel's optional Google ADK Python bridge.

Deploy separately from Netlify. For persistent production sessions, replace the
in-memory runner/session map with ADK's persistent SessionService and a durable
session mapping. The shared service token must be set as a secret.
"""
from __future__ import annotations

import hmac
import os
import secrets
import time
import uuid
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from google.genai import types

APP_NAME = os.getenv("ANGEL_ADK_APP_NAME", "angel-adk-bridge")
MODEL = os.getenv("ANGEL_ADK_MODEL", "gemini-2.5-flash")
SERVICE_TOKEN = os.getenv("ANGEL_ADK_SERVICE_TOKEN", "")

if not SERVICE_TOKEN:
    raise RuntimeError("ANGEL_ADK_SERVICE_TOKEN must be configured before startup.")

root_agent = Agent(
    name="angel_adk_agent",
    model=MODEL,
    description="An ADK-backed agent runtime for Angel AI.",
    instruction=(
        "You are an agent runtime called by Angel AI. Work within the user's explicit "
        "request. Be accurate, concise, and transparent about uncertainty. Do not claim "
        "you used tools that are not configured."
    ),
)
runner = InMemoryRunner(agent=root_agent, app_name=APP_NAME)
app = FastAPI(title="Angel ADK Bridge", version="1.0.0")
# This demo mapping is process-local. Move both sessions and mapping to durable
# storage before scaling to multiple worker instances or needing long-term recall.
sessions: dict[tuple[str, str], str] = {}


class RunRequest(BaseModel):
    appName: str = Field(default=APP_NAME, max_length=100)
    userId: str = Field(min_length=1, max_length=200)
    sessionId: str | None = Field(default=None, max_length=160)
    message: str = Field(min_length=1, max_length=20000)


class RunResponse(BaseModel):
    success: bool
    response: str
    sessionId: str
    appName: str
    durationMs: int


async def authenticate(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer service token required.")
    supplied = authorization[7:].strip()
    if not hmac.compare_digest(supplied, SERVICE_TOKEN):
        raise HTTPException(status_code=403, detail="Invalid service token.")


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "service": "angel-adk-bridge", "model": MODEL}


@app.post("/run", response_model=RunResponse, dependencies=[Depends(authenticate)])
async def run_agent(request: RunRequest) -> RunResponse:
    started = time.monotonic()
    external_session_id = request.sessionId or str(uuid.uuid4())
    lookup_key = (request.userId, external_session_id)
    internal_session_id = sessions.get(lookup_key)

    if internal_session_id is None:
        session = await runner.session_service.create_session(
            app_name=APP_NAME,
            user_id=request.userId,
        )
        internal_session_id = session.id
        sessions[lookup_key] = internal_session_id

    final_text = ""
    try:
        async for event in runner.run_async(
            user_id=request.userId,
            session_id=internal_session_id,
            new_message=types.Content(
                role="user",
                parts=[types.Part(text=request.message)],
            ),
        ):
            if event.is_final_response() and event.content:
                final_text = "".join(
                    part.text for part in (event.content.parts or []) if getattr(part, "text", None)
                )
    except Exception as error:
        # Avoid returning provider exception text because it may include request data.
        raise HTTPException(status_code=502, detail="ADK agent execution failed.") from error

    if not final_text.strip():
        raise HTTPException(status_code=502, detail="ADK agent returned no final text.")
    return RunResponse(
        success=True,
        response=final_text[:50000],
        sessionId=external_session_id,
        appName=APP_NAME,
        durationMs=int((time.monotonic() - started) * 1000),
    )
