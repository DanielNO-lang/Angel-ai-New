/**
 * ANGEL AI — IndexedDB Offline Persistence & Synchronization Layer
 * Upgrades Dexie schema with queued mutations, conflict recovery, and encrypted secret store.
 */

import Dexie, { Table } from 'dexie';
import { Conversation, Message, Task, Memory, Project, Agent, LibraryItem, AssistantEntity } from '../../types';

export interface OfflineAppState {
  id: string;
  activeTab: string;
  theme: string;
  syncStatus: 'synced' | 'syncing' | 'offline_queued' | 'error';
  lastSyncedAt: string;
  updatedAt: string;
}

export interface QueuedMutation {
  id: string;
  entityType: 'task' | 'memory' | 'project' | 'conversation' | 'message' | 'assistant' | 'library_item';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  payload: any;
  clientTimestamp: string;
  version: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export interface EncryptedSecretRecord {
  id: string;
  category: 'chat' | 'credential' | 'env_var';
  encryptedPayload: string; // JSON of EncryptedPayload
  updatedAt: string;
}

export class AngelOfflineDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  tasks!: Table<Task, string>;
  memories!: Table<Memory, string>;
  projects!: Table<Project, string>;
  agents!: Table<Agent, string>;
  libraryItems!: Table<LibraryItem, string>;
  assistants!: Table<AssistantEntity, string>;
  syncQueue!: Table<QueuedMutation, string>;
  encryptedSecrets!: Table<EncryptedSecretRecord, string>;
  appState!: Table<OfflineAppState, string>;

  constructor() {
    super('AngelWorkspaceOfflineDB');
    this.version(2).stores({
      conversations: 'id, agentId, projectId, updatedAt, pinned, isArchived',
      messages: 'id, conversationId, role, createdAt',
      tasks: 'id, status, priority, projectId, updatedAt',
      memories: 'id, type, updatedAt, isPinned',
      projects: 'id, status, updatedAt',
      agents: 'id, status, updatedAt',
      libraryItems: 'id, category, type, isFavorite, updatedAt',
      assistants: 'id, category, updatedAt',
      syncQueue: 'id, entityType, action, status, clientTimestamp',
      encryptedSecrets: 'id, category, updatedAt',
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
  libraryItems?: LibraryItem[];
  assistants?: AssistantEntity[];
  activeTab?: string;
  theme?: string;
  syncStatus?: 'synced' | 'syncing' | 'offline_queued' | 'error';
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

    if (payload.libraryItems && payload.libraryItems.length > 0) {
      promises.push(offlineDb.libraryItems.bulkPut(payload.libraryItems));
    }

    if (payload.assistants && payload.assistants.length > 0) {
      promises.push(offlineDb.assistants.bulkPut(payload.assistants));
    }

    if (payload.activeTab || payload.theme || payload.syncStatus) {
      promises.push(
        offlineDb.appState.put({
          id: 'current_session',
          activeTab: payload.activeTab || 'home',
          theme: payload.theme || 'dark',
          syncStatus: payload.syncStatus || 'synced',
          lastSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.warn('[OfflineDB] IndexedDB sync error:', error);
  }
}
