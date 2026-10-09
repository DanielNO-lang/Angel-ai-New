/**
 * ANGEL AI — Real-Time Synchronization Service
 * 
 * Central engine responsible for synchronizing persistent Angel workspace data
 * between local IndexedDB (Dexie) and Supabase / Cloud Persistence.
 * 
 * Features:
 * - Local-first persistence architecture
 * - Real-time online/offline state detection & event dispatching
 * - Deterministic queued mutations when offline with deduplication
 * - Conflict resolution engine with timestamp-based Last-Write-Wins (LWW) and safe field merges
 * - Idempotency key tracking avoiding duplicate records or repeated writes
 * - Clear synchronization status ('syncing' | 'synced' | 'offline' | 'error' | 'offline_queued')
 * - Safe client-side Supabase client reuse without exposing service-role keys
 */

import { offlineDb, QueuedMutation } from './db/offlineDb';
import { getClientSupabase } from './supabaseService';
import { SyncStatus, Task, Memory, Project, Workflow, Conversation, Message } from '../types';

export type ConflictResolutionStrategy = 'client_wins' | 'server_wins' | 'last_write_wins' | 'merge';

export interface SyncConflict<T = any> {
  entityType: string;
  entityId: string;
  clientData: T;
  serverData: T;
  clientTimestamp: string;
  serverTimestamp: string;
  resolutionStrategy: ConflictResolutionStrategy;
}

export interface SyncStateEvent {
  status: SyncStatus;
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  error?: string | null;
}

export type SyncListener = (event: SyncStateEvent) => void;

class SyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private status: SyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
  private listeners: Set<SyncListener> = new Set();
  private isSyncing: boolean = false;
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private sessionToken: string | null = null;
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkTransition(true));
      window.addEventListener('offline', () => this.handleNetworkTransition(false));
      // Periodic connectivity verification
      setInterval(() => {
        const actualOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        if (actualOnline !== this.isOnline) {
          this.handleNetworkTransition(actualOnline);
        }
      }, 15000);
    }
  }

  /**
   * Set or update current session auth token for cloud requests
   */
  public setSessionToken(token: string | null) {
    this.sessionToken = token;
  }

  /**
   * Network state handler
   */
  private handleNetworkTransition(online: boolean) {
    const wasOnline = this.isOnline;
    this.isOnline = online;

    if (online) {
      this.lastError = null;
      if (!wasOnline) {
        // Just returned online
        this.setStatus('syncing');
        this.processQueue();
      }
    } else {
      this.setStatus('offline');
    }
  }

  /**
   * Get current synchronization state snapshot
   */
  public getStatus(): SyncStateEvent {
    return {
      status: this.status,
      isOnline: this.isOnline,
      pendingCount: 0, // updated asynchronously in notify
      lastSyncedAt: this.lastSyncedAt,
      error: this.lastError,
    };
  }

  public isConnected(): boolean {
    return this.isOnline && this.status !== 'error' && this.status !== 'offline';
  }

  /**
   * Subscribe to real-time synchronization state changes
   */
  public subscribe(callback: SyncListener): () => void {
    this.listeners.add(callback);
    // Notify immediately with current state
    this.notifySingleListener(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private async notifySingleListener(callback: SyncListener) {
    try {
      const pendingCount = await offlineDb.syncQueue.where('status').equals('pending').count();
      callback({
        status: this.status,
        isOnline: this.isOnline,
        pendingCount,
        lastSyncedAt: this.lastSyncedAt,
        error: this.lastError,
      });
    } catch {
      callback({
        status: this.status,
        isOnline: this.isOnline,
        pendingCount: 0,
        lastSyncedAt: this.lastSyncedAt,
        error: this.lastError,
      });
    }
  }

  private async notifyListeners() {
    try {
      const pendingCount = await offlineDb.syncQueue.where('status').equals('pending').count();
      const event: SyncStateEvent = {
        status: this.status,
        isOnline: this.isOnline,
        pendingCount,
        lastSyncedAt: this.lastSyncedAt,
        error: this.lastError,
      };
      this.listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (e) {
          console.warn('[SyncService] Listener error:', e);
        }
      });
    } catch {
      // ignore
    }
  }

  private setStatus(newStatus: SyncStatus, error: string | null = null) {
    this.status = newStatus;
    if (error) this.lastError = error;
    this.notifyListeners();
  }

  /**
   * Deduplicated Mutation Enqueueing
   * If a pending mutation for this entity exists, combines/supersedes it to avoid repeated writes
   */
  public async enqueueMutation(
    entityType: QueuedMutation['entityType'],
    action: QueuedMutation['action'],
    entityId: string,
    payload: any,
    isGuest: boolean = false
  ): Promise<void> {
    // 1. Never queue cloud mutations for guest sessions
    if (isGuest) {
      return;
    }

    // 2. Deduplication check: check if an existing pending mutation for this entity is already in queue
    const existing = await offlineDb.syncQueue
      .where('entityId')
      .equals(entityId)
      .first();

    const timestamp = new Date().toISOString();

    if (existing && existing.status === 'pending') {
      // If we previously created and now update, keep action as 'create' but update payload
      const effectiveAction = existing.action === 'create' && action === 'update' ? 'create' : action;
      await offlineDb.syncQueue.update(existing.id, {
        action: effectiveAction,
        payload: {
          ...existing.payload,
          ...payload,
        },
        clientTimestamp: timestamp,
        version: (existing.version || 1) + 1,
      });
    } else {
      const mutation: QueuedMutation = {
        id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        entityType,
        action,
        entityId,
        payload,
        clientTimestamp: timestamp,
        version: 1,
        retryCount: 0,
        status: 'pending',
      };
      await offlineDb.syncQueue.put(mutation);
    }

    if (!this.isOnline) {
      this.setStatus('offline');
      return;
    }

    // Debounce processing to batch quick succession edits (e.g. typing)
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    this.syncDebounceTimer = setTimeout(() => {
      this.processQueue();
    }, 600);
  }

  /**
   * Conflict Resolution Logic
   * Default: Last-Write-Wins (LWW) based on timestamps with safe field merge
   */
  public resolveConflict<T extends { updatedAt?: string; [key: string]: any }>(
    clientData: T,
    serverData: T,
    strategy: ConflictResolutionStrategy = 'last_write_wins'
  ): T {
    if (strategy === 'client_wins' || !serverData) {
      return clientData;
    }
    if (strategy === 'server_wins' || !clientData) {
      return serverData;
    }

    const clientTime = clientData.updatedAt ? new Date(clientData.updatedAt).getTime() : 0;
    const serverTime = serverData.updatedAt ? new Date(serverData.updatedAt).getTime() : 0;

    if (strategy === 'merge') {
      // Safe merge: server provides base, newer client properties overlay
      return {
        ...serverData,
        ...clientData,
        updatedAt: new Date(Math.max(clientTime, serverTime, Date.now())).toISOString(),
      };
    }

    // Last-Write-Wins (LWW)
    if (clientTime >= serverTime) {
      return {
        ...serverData,
        ...clientData,
      };
    } else {
      return {
        ...clientData,
        ...serverData,
      };
    }
  }

  /**
   * Process all queued mutations in chronological order
   */
  public async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    if (!this.isOnline) {
      this.setStatus('offline');
      return;
    }

    const pending = await offlineDb.syncQueue
      .where('status')
      .equals('pending')
      .sortBy('clientTimestamp');

    if (pending.length === 0) {
      this.setStatus('synced');
      this.lastSyncedAt = new Date().toISOString();
      return;
    }

    this.isSyncing = true;
    this.setStatus('syncing');

    const supabaseClient = getClientSupabase();
    let syncFailed = false;
    let failureError: string | null = null;

    for (const mutation of pending) {
      try {
        await offlineDb.syncQueue.update(mutation.id, { status: 'syncing' });

        // Method 1: If direct Supabase client is configured in browser
        if (supabaseClient && this.canSyncDirectly(mutation.entityType)) {
          await this.syncViaSupabaseClient(supabaseClient, mutation);
        } else {
          // Method 2: Sync via server-side proxy route
          await this.syncViaServerProxy(mutation);
        }

        // Successfully synced mutation: remove from queue
        await offlineDb.syncQueue.delete(mutation.id);
      } catch (err) {
        console.warn(`[SyncService] Mutation ${mutation.id} sync failed:`, err);
        const retryCount = (mutation.retryCount || 0) + 1;
        const errMsg = err instanceof Error ? err.message : String(err);
        failureError = errMsg;

        if (retryCount >= 5) {
          await offlineDb.syncQueue.update(mutation.id, {
            status: 'failed',
            error: errMsg,
          });
        } else {
          await offlineDb.syncQueue.update(mutation.id, {
            status: 'pending',
            retryCount,
            error: errMsg,
          });
        }
        syncFailed = true;
      }
    }

    this.isSyncing = false;
    const remainingPending = await offlineDb.syncQueue.where('status').equals('pending').count();

    if (remainingPending === 0) {
      this.setStatus('synced');
      this.lastSyncedAt = new Date().toISOString();
    } else if (syncFailed) {
      this.setStatus('error', failureError || 'Some mutations failed to sync');
    } else {
      this.setStatus('synced');
      this.lastSyncedAt = new Date().toISOString();
    }
  }

  private canSyncDirectly(entityType: string): boolean {
    return ['task', 'memory', 'project', 'workflow', 'conversation', 'message'].includes(entityType);
  }

  private async syncViaSupabaseClient(client: any, mutation: QueuedMutation): Promise<void> {
    const tableName = this.getTableName(mutation.entityType);
    if (!tableName) return;

    if (mutation.action === 'delete') {
      const { error } = await client.from(tableName).delete().eq('id', mutation.entityId);
      if (error) throw error;
      return;
    }

    // Upsert with conflict resolution
    const formatted = this.formatEntityForSupabase(mutation.entityType, mutation.payload);
    const { error } = await client.from(tableName).upsert(formatted, { onConflict: 'id' });
    if (error) throw error;
  }

  private async syncViaServerProxy(mutation: QueuedMutation): Promise<void> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.sessionToken ? { Authorization: `Bearer ${this.sessionToken}` } : {}),
    };

    if (mutation.entityType === 'task') {
      const res = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tasks: [mutation.payload] }),
      });
      if (!res.ok) throw new Error(`Task sync endpoint returned ${res.status}`);
    } else {
      // Universal entity sync via server cloud data
      const res = await fetch('/api/user/cloud-data', {
        method: 'POST',
        headers,
        body: JSON.stringify({ [mutation.entityType]: mutation.payload }),
      });
      if (!res.ok && res.status !== 401) {
        throw new Error(`Cloud data endpoint returned ${res.status}`);
      }
    }
  }

  private getTableName(entityType: string): string | null {
    switch (entityType) {
      case 'task':
        return 'tasks';
      case 'memory':
        return 'memories';
      case 'project':
        return 'projects';
      case 'workflow':
        return 'workflows';
      case 'conversation':
        return 'conversations';
      case 'message':
        return 'messages';
      case 'library_item':
        return 'library_items';
      default:
        return null;
    }
  }

  private formatEntityForSupabase(entityType: string, payload: any): any {
    if (!payload) return payload;

    if (entityType === 'task') {
      return {
        id: payload.id,
        title: payload.title,
        description: payload.description || '',
        status: payload.status || 'todo',
        priority: payload.priority || 'medium',
        due_date: payload.dueDate || null,
        agent_id: payload.agentId || null,
        project_id: payload.projectId || null,
        subtasks: payload.subtasks || [],
        tags: payload.tags || [],
        created_at: payload.createdAt || new Date().toISOString(),
        updated_at: payload.updatedAt || new Date().toISOString(),
        completed_at: payload.completedAt || null,
      };
    }

    if (entityType === 'workflow') {
      return {
        id: payload.id,
        name: payload.name,
        description: payload.description || '',
        codename: payload.codename || null,
        category: payload.category || 'general',
        version: payload.version || '1.0.0',
        enabled: payload.enabled ?? true,
        trigger: payload.trigger || { type: 'manual' },
        conditions: payload.conditions || [],
        steps: payload.steps || [],
        execution_chain: payload.executionChain || [],
        stages: payload.stages || [],
        permissions: payload.permissions || [],
        project_id: payload.projectId || null,
        agent_id: payload.agentId || null,
        system_instructions: payload.systemInstructions || null,
        is_template: payload.isTemplate ?? false,
        tags: payload.tags || [],
        created_at: payload.createdAt || new Date().toISOString(),
        updated_at: payload.updatedAt || new Date().toISOString(),
        last_executed_at: payload.lastExecutedAt || null,
        execution_count: payload.executionCount ?? 0,
      };
    }

    return payload;
  }

  /**
   * Trigger immediate workspace synchronization
   */
  public async syncNow(token?: string | null): Promise<void> {
    if (token) this.sessionToken = token;
    await this.processQueue();
  }
}

export const syncService = new SyncService();
