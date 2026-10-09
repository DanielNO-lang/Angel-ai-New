/**
 * ANGEL AI — Workspace Data Export Service
 * 
 * Provides centralized JSON export generation and download mechanisms
 * for user workspace state: tasks, memories, conversations, messages,
 * projects, workflows, agents, and library items.
 */

import { Task, Memory, Conversation, Message, Project, Workflow, Agent, LibraryItem, UserProfile } from '../../types';

export interface WorkspaceExportInput {
  tasks: Task[];
  memories: Memory[];
  conversations: Conversation[];
  messagesMap: Record<string, Message[]>;
  projects: Project[];
  workflows?: Workflow[];
  agents?: Agent[];
  libraryItems?: LibraryItem[];
  userProfile?: UserProfile;
}

export interface WorkspaceExportPayload {
  exportVersion: '1.0.0';
  application: 'Angel AI';
  exportedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    plan: string;
  };
  statistics: {
    tasksCount: number;
    memoriesCount: number;
    conversationsCount: number;
    messagesCount: number;
    projectsCount: number;
    workflowsCount: number;
    agentsCount: number;
    libraryItemsCount: number;
  };
  workspace: {
    tasks: Task[];
    memories: Memory[];
    conversations: Conversation[];
    messages: Record<string, Message[]>;
    projects: Project[];
    workflows: Workflow[];
    agents: Agent[];
    libraryItems: LibraryItem[];
  };
}

/**
 * Generates structured JSON export payload from current workspace state
 */
export function buildWorkspaceExportPayload(input: WorkspaceExportInput): WorkspaceExportPayload {
  const allMessagesCount = Object.values(input.messagesMap || {}).reduce(
    (acc, msgs) => acc + (Array.isArray(msgs) ? msgs.length : 0),
    0
  );

  return {
    exportVersion: '1.0.0',
    application: 'Angel AI',
    exportedAt: new Date().toISOString(),
    user: {
      id: input.userProfile?.id || 'user_local',
      name: input.userProfile?.name || 'Angel User',
      email: input.userProfile?.email || 'user@angel.local',
      plan: input.userProfile?.plan || 'Pro',
    },
    statistics: {
      tasksCount: input.tasks?.length || 0,
      memoriesCount: input.memories?.length || 0,
      conversationsCount: input.conversations?.length || 0,
      messagesCount: allMessagesCount,
      projectsCount: input.projects?.length || 0,
      workflowsCount: input.workflows?.length || 0,
      agentsCount: input.agents?.length || 0,
      libraryItemsCount: input.libraryItems?.length || 0,
    },
    workspace: {
      tasks: input.tasks || [],
      memories: input.memories || [],
      conversations: input.conversations || [],
      messages: input.messagesMap || {},
      projects: input.projects || [],
      workflows: input.workflows || [],
      agents: input.agents || [],
      libraryItems: input.libraryItems || [],
    },
  };
}

/**
 * Triggers safe client-side browser JSON file download
 */
export function downloadWorkspaceExportAsJSON(
  payload: WorkspaceExportPayload,
  customFilename?: string
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = customFilename || `angel-workspace-export-${timestamp}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
