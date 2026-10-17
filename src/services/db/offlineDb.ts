/**
 * ANGEL AI — IndexedDB Offline Persistence & Synchronization Layer
 * Upgrades Dexie schema with queued mutations, conflict recovery, and encrypted secret store.
 */

import Dexie, { Table } from 'dexie';
import { Conversation, Message, Task, Memory, Project, Agent, LibraryItem, AssistantEntity, Workflow } from '../../types';
import { EncryptedPayload, secureVaultService } from '../security/encryptionService';

export interface OfflineAppState {
  id: string;
  activeTab: string;
  theme: string;
  syncStatus: 'synced' | 'syncing' | 'offline_queued' | 'error' | 'offline';
  lastSyncedAt: string;
  updatedAt: string;
  sessionToken?: string | null;
}

export interface QueuedMutation {
  id: string;
  entityType: 'task' | 'memory' | 'project' | 'conversation' | 'message' | 'assistant' | 'library_item' | 'workflow' | 'agent' | 'setting';
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
  workflows!: Table<Workflow, string>;
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
    this.version(3).stores({
      conversations: 'id, agentId, projectId, updatedAt, pinned, isArchived',
      messages: 'id, conversationId, role, createdAt',
      tasks: 'id, status, priority, projectId, updatedAt',
      memories: 'id, type, updatedAt, isPinned',
      projects: 'id, status, updatedAt',
      workflows: 'id, category, enabled, updatedAt',
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
 * Load complete offline workspace snapshots from IndexedDB
 */
export async function loadWorkspaceFromIndexedDB(): Promise<{
  conversations: Conversation[];
  messagesMap: Record<string, Message[]>;
  tasks: Task[];
  memories: Memory[];
  projects: Project[];
  workflows: Workflow[];
  agents: Agent[];
  libraryItems: LibraryItem[];
  assistants: AssistantEntity[];
  appState: OfflineAppState | null;
}> {
  try {
    const [
      conversations,
      allMessages,
      tasks: restoredTasks as unknown as Task[],
      memories: restoredMemories as unknown as Memory[],
      projects,
      workflows,
      agents,
      libraryItems,
      assistants,
      appStateRecords,
    ] = await Promise.all([
      offlineDb.conversations.toArray(),
      offlineDb.messages.toArray(),
      offlineDb.tasks.toArray(),
      offlineDb.memories.toArray(),
      offlineDb.projects.toArray(),
      offlineDb.workflows.toArray(),
      offlineDb.agents.toArray(),
      offlineDb.libraryItems.toArray(),
      offlineDb.assistants.toArray(),
      offlineDb.appState.toArray(),
    ]);

    const restoredTasks = await restoreWorkspaceRows(tasks as unknown as VaultRecord[], 'task');
    const restoredMemories = await restoreWorkspaceRows(memories as unknown as VaultRecord[], 'memory');

    const messagesMap: Record<string, Message[]> = {};
    for (const msg of allMessages) {
      if (!messagesMap[msg.conversationId]) {
        messagesMap[msg.conversationId] = [];
      }
      messagesMap[msg.conversationId].push(msg);
    }

    return {
      conversations,
      messagesMap,
      tasks,
      memories,
      projects,
      workflows,
      agents,
      libraryItems,
      assistants,
      appState: appStateRecords[0] || null,
    };
  } catch (error) {
    console.warn('[OfflineDB] Error loading workspace from IndexedDB:', error);
    return {
      conversations: [],
      messagesMap: {},
      tasks: [],
      memories: [],
      projects: [],
      workflows: [],
      agents: [],
      libraryItems: [],
      assistants: [],
      appState: null,
    };
  }
}

/**
 * Clears all local workspace IndexedDB tables cleanly (used during Workspace Reset)
 */
export async function clearAllLocalIndexedDB(): Promise<void> {
  try {
    await Promise.all([
      offlineDb.conversations.clear(),
      offlineDb.messages.clear(),
      offlineDb.tasks.clear(),
      offlineDb.memories.clear(),
      offlineDb.projects.clear(),
      offlineDb.workflows.clear(),
      offlineDb.agents.clear(),
      offlineDb.libraryItems.clear(),
      offlineDb.assistants.clear(),
      offlineDb.syncQueue.clear(),
      offlineDb.encryptedSecrets.clear(),
      offlineDb.appState.clear(),
    ]);
  } catch (error) {
    console.warn('[OfflineDB] Error clearing IndexedDB tables:', error);
  }
}

type VaultRecord = Record<string, any> & { __angelEncryptedPayload?: EncryptedPayload; isEncrypted?: boolean };

function lockedVaultPlaceholder(record: VaultRecord, kind: 'task' | 'memory'): VaultRecord {
  const metadata = {
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    __angelEncryptedPayload: record.__angelEncryptedPayload,
    isEncrypted: true,
  };
  if (kind === 'task') {
    return { ...metadata, status: record.status || 'todo', priority: record.priority || 'medium',
      projectId: record.projectId, title: 'Encrypted task', description: 'Unlock Secure Vault to view this task.' };
  }
  return { ...metadata, type: record.type || 'important_fact', isPinned: record.isPinned,
    title: 'Encrypted memory', content: 'Unlock Secure Vault to view this memory.' };
}

async function protectWorkspaceRows<T extends VaultRecord>(rows: T[], kind: 'task' | 'memory'): Promise<T[]> {
  if (!secureVaultService.isEnabled()) return rows;
  if (!secureVaultService.isUnlocked()) {
    if (rows.every((row) => Boolean(row.__angelEncryptedPayload))) return rows;
    throw new Error('Secure Vault is locked. Unlock it before saving sensitive workspace data.');
  }

  const output: T[] = [];
  for (const row of rows) {
    let plainRecord: T = row;
    if (row.__angelEncryptedPayload) {
      try {
        plainRecord = await secureVaultService.decryptJson<T>(row.__angelEncryptedPayload);
      } catch {
        // Never overwrite ciphertext with an undecryptable row or placeholder.
        output.push(row);
        continue;
      }
    }
    const encrypted = await secureVaultService.encryptJson(plainRecord);
    output.push(lockedVaultPlaceholder({
      id: plainRecord.id,
      updatedAt: plainRecord.updatedAt,
      createdAt: plainRecord.createdAt,
      status: plainRecord.status,
      priority: plainRecord.priority,
      projectId: plainRecord.projectId,
      type: plainRecord.type,
      isPinned: plainRecord.isPinned,
      __angelEncryptedPayload: encrypted,
    }, kind) as T);
  }
  return output;
}

async function restoreWorkspaceRows<T extends VaultRecord>(rows: T[], kind: 'task' | 'memory'): Promise<T[]> {
  if (!secureVaultService.isEnabled()) return rows;
  const output: T[] = [];
  for (const row of rows) {
    if (!row.__angelEncryptedPayload) {
      output.push(row);
      continue;
    }
    if (!secureVaultService.isUnlocked()) {
      output.push(lockedVaultPlaceholder(row, kind) as T);
      continue;
    }
    try {
      output.push(await secureVaultService.decryptJson<T>(row.__angelEncryptedPayload));
    } catch {
      output.push(lockedVaultPlaceholder(row, kind) as T);
    }
  }
  return output;
}

/**
 * Synchronize full workspace memory snapshots to IndexedDB
 */
export async function syncWorkspaceToIndexedDB(payload: {
  conversations?: Conversation[];
  messagesMap?: Record<string, Message[]>;
  tasks?: Task[];
  memories?: Memory[];
  projects?: Project[];
  workflows?: Workflow[];
  agents?: Agent[];
  libraryItems?: LibraryItem[];
  assistants?: AssistantEntity[];
  activeTab?: string;
  theme?: string;
  syncStatus?: 'synced' | 'syncing' | 'offline_queued' | 'error' | 'offline';
  sessionToken?: string | null;
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

    if (payload.tasks !== undefined) {
      const protectedTasks = await protectWorkspaceRows(payload.tasks as unknown as VaultRecord[], 'task');
      promises.push((async () => {
        await offlineDb.tasks.clear();
        if (protectedTasks.length > 0) await offlineDb.tasks.bulkPut(protectedTasks as unknown as Task[]);
      })());
    }

    if (payload.memories !== undefined) {
      const protectedMemories = await protectWorkspaceRows(payload.memories as unknown as VaultRecord[], 'memory');
      promises.push((async () => {
        await offlineDb.memories.clear();
        if (protectedMemories.length > 0) await offlineDb.memories.bulkPut(protectedMemories as unknown as Memory[]);
      })());
    }

    if (payload.projects && payload.projects.length > 0) {
      promises.push(offlineDb.projects.bulkPut(payload.projects));
    }

    if (payload.workflows && payload.workflows.length > 0) {
      promises.push(offlineDb.workflows.bulkPut(payload.workflows));
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

    if (payload.activeTab || payload.theme || payload.syncStatus || payload.sessionToken !== undefined) {
      const current = await offlineDb.appState.get('current_session').catch(() => null);
      promises.push(
        offlineDb.appState.put({
          id: 'current_session',
          activeTab: payload.activeTab || current?.activeTab || 'home',
          theme: payload.theme || current?.theme || 'dark',
          syncStatus: payload.syncStatus || current?.syncStatus || 'synced',
          lastSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sessionToken: payload.sessionToken !== undefined ? payload.sessionToken : current?.sessionToken || null,
        })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.warn('[OfflineDB] IndexedDB sync error:', error);
  }
}

/**
 * Save auth session token to IndexedDB appState so background sync worker can authenticate requests
 */
export async function setStoredSessionToken(token: string | null): Promise<void> {
  try {
    const existing = await offlineDb.appState.get('current_session').catch(() => null);
    if (existing) {
      await offlineDb.appState.update('current_session', {
        sessionToken: token,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await offlineDb.appState.put({
        id: 'current_session',
        activeTab: 'home',
        theme: 'dark',
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sessionToken: token,
      });
    }
  } catch (err) {
    console.warn('[OfflineDB] Could not set stored session token:', err);
  }
}

/**
 * Retrieve stored auth session token from IndexedDB
 */
export async function getStoredSessionToken(): Promise<string | null> {
  try {
    const record = await offlineDb.appState.get('current_session').catch(() => null);
    return record?.sessionToken || null;
  } catch {
    return null;
  }
}
