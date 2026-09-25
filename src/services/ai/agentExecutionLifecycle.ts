/**
 * ANGEL AI — Agent Execution Lifecycle Engine
 * Foundation for the agent execution concept:
 * Request -> Context Assembly -> Model Evaluation -> Tool Execution -> Response Synthesis
 */

import {
  AgentExecutionStage,
  AgentLifecycleSession,
  AgentStageLog,
} from './types';

export class AgentExecutionLifecycleEngine {
  private activeSessions: Map<string, AgentLifecycleSession> = new Map();

  createSession(agentId: string, agentName: string): AgentLifecycleSession {
    const sessionId = `lifecycle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const session: AgentLifecycleSession = {
      sessionId,
      agentId,
      agentName,
      status: 'requested',
      logs: [
        {
          stage: 'requested',
          label: 'Request Received',
          detail: `Execution session initialized for agent ${agentName} (${agentId}).`,
          timestamp: now,
        },
      ],
      startedAt: now,
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  advanceStage(
    sessionId: string,
    stage: AgentExecutionStage,
    label: string,
    detail: string,
    metadata?: Record<string, unknown>
  ): AgentLifecycleSession | undefined {
    const session = this.activeSessions.get(sessionId);
    if (!session) return undefined;

    const now = new Date().toISOString();
    const lastLog = session.logs[session.logs.length - 1];
    const durationMs = lastLog ? Date.now() - new Date(lastLog.timestamp).getTime() : 0;

    const newLog: AgentStageLog = {
      stage,
      label,
      detail,
      timestamp: now,
      durationMs,
      metadata,
    };

    session.status = stage;
    session.logs.push(newLog);

    if (stage === 'completed' || stage === 'failed') {
      session.completedAt = now;
    }

    return session;
  }

  getSession(sessionId: string): AgentLifecycleSession | undefined {
    return this.activeSessions.get(sessionId);
  }
}

export const agentExecutionLifecycle = new AgentExecutionLifecycleEngine();
