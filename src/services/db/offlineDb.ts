/**
 * ANGEL AI — IndexedDB Offline Persistence Layer with Dexie.js
 * Persists application state, messages, conversations, and tasks
 * for seamless offline resilience complementing Supabase and LocalStorage.
 */

import Dexie, { Table } from 'dexie';
import { Conversation, Message, Task, Memory, Project, Agent } from '../../types';

export interface OfflineAppState {
  id: string;
  activeTab: string;
  theme: string;
  updatedAt: string;
}

export class AngelOfflineDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  tasks!: Table<Task, string>;
  memories!: Table<Memory, string>;
  projects!: Table<Project, string>;
  agents!: Table<Agent, string>;
  appState!: Table<OfflineAppState, string>;

  constructor() {
    super('AngelWorkspaceOfflineDB');
    this.version(1).stores({
      conversations: 'id, agentId, projectId, updatedAt, pinned, isArchived',
      messages: 'id, conversationId, role, createdAt',
      tasks: 'id, status, priority, projectId, updatedAt',
      memories: 'id, category, updatedAt',
      projects: 'id, status, updatedAt',
      agents: 'id, status, updatedAt',
      appState: 'id, updatedAt',
    });
  }
}

export const offlineDb = new AngelOfflineDatabase();

/**
 * Synchronize full workspace memory snapshots to IndexedDB
 */
export async function syncWorkspaceToIndexedDB(payload: {
  conversations?: Conversation[];
  messagesMap?: Record<string, Message[]>;
  tasks?: Task[];
  memories?: Memory[];
  projects?: Project[];
  agents?: Agent[];
  activeTab?: string;
  theme?: string;
}): Promise<void> {
  try {
    const promises: Promise<unknown>[] = [];

    if (payload.conversations && payload.conversations.length > 0) {
      promises.push(offlineDb.conversations.bulkPut(payload.conversations));
    }

    if (payload.messagesMap) {
      const allMessages = Object.values(payload.messagesMap).flat();
      if (allMessages.length > 0) {
        promises.push(offlineDb.messages.bulkPut(allMessages));
      }
    }

    if (payload.tasks && payload.tasks.length > 0) {
      promises.push(offlineDb.tasks.bulkPut(payload.tasks));
    }

    if (payload.memories && payload.memories.length > 0) {
      promises.push(offlineDb.memories.bulkPut(payload.memories));
    }

    if (payload.projects && payload.projects.length > 0) {
      promises.push(offlineDb.projects.bulkPut(payload.projects));
    }

    if (payload.agents && payload.agents.length > 0) {
      promises.push(offlineDb.agents.bulkPut(payload.agents));
    }

    if (payload.activeTab || payload.theme) {
      promises.push(
        offlineDb.appState.put({
          id: 'current_session',
          activeTab: payload.activeTab || 'home',
          theme: payload.theme || 'dark',
          updatedAt: new Date().toISOString(),
        })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.warn('[OfflineDB] IndexedDB sync error:', error);
  }
}
