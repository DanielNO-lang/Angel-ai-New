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

import { offlineDb, QueuedMutation, setStoredSessionToken, getStoredSessionToken } from './db/offlineDb';
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
      
      // Initialize stored auth token for offline background sync
      getStoredSessionToken().then((token) => {
        if (token && !this.sessionToken) {
          this.sessionToken = token;
        }
      }).catch(() => {});

      // Listen for Background Sync completion events dispatched by the Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'BACKGROUND_SYNC_COMPLETE') {
            console.log('[SyncService] Service Worker completed background sync:', event.data);
            this.lastSyncedAt = event.data.timestamp || new Date().toISOString();
            this.lastError = null;
            this.setStatus('synced');
            this.notifyListeners();
          } else if (event.data?.type === 'BACKGROUND_SYNC_ERROR') {
            console.warn('[SyncService] Service Worker background sync warning:', event.data.error);
            this.setStatus('error', event.data.error);
            this.notifyListeners();
          }
        });
      }

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
   * Set or update current session auth token for cloud requests and coordinate with Service Worker
   */
  public setSessionToken(token: string | null) {
    this.sessionToken = token;
    // Persist to IndexedDB so Service Worker background sync can access it
    setStoredSessionToken(token).catch(() => {});
    
    // Broadcast auth token to Service Worker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_AUTH_TOKEN',
        token,
      });
    }
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
        // Just returned online — trigger background sync and local queue flush
        this.setStatus('syncing');
        this.processQueue();
        this.requestServiceWorkerSync();
      }
    } else {
      this.setStatus('offline');
    }
  }

  /**
   * Requests Service Worker to register and execute background sync if supported
   */
  public async requestServiceWorkerSync(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      if ('sync' in reg) {
        await (reg as any).sync.register('angel-sync-queue');
      } else if (reg.active) {
        // Fallback for browsers without SyncManager: trigger via postMessage
        reg.active.postMessage({
          type: 'TRIGGER_SYNC',
          token: this.sessionToken,
        });
      }
    } catch (err) {
      console.debug('[SyncService] Background sync registration:', err);
    }
  }

  /**
   * Returns current count of pending unsynced changes in queue
   */
  public async getPendingCount(): Promise<number> {
    try {
      return await offlineDb.syncQueue.where('status').equals('pending').count();
    } catch {
      return 0;
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

    // Immediately notify UI listeners so unsynced changes counter updates in real time
    this.notifyListeners();

    // Register Background Sync with Service Worker
    this.requestServiceWorkerSync().catch(() => {});

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

    let syncFailed = false;
    let failureError: string | null = null;

    for (const mutation of pending) {
      try {
        await offlineDb.syncQueue.update(mutation.id, { status: 'syncing' });

        // Route cloud writes through the authenticated server sync layer so each
        // entity is normalized consistently and checked against the user's JWT/RLS.
        await this.syncViaServerProxy(mutation);

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

  private async syncViaServerProxy(mutation: QueuedMutation): Promise<void> {
    if (!this.sessionToken) {
      throw new Error('Sign in is required before workspace changes can sync to the cloud.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.sessionToken}`,
    };

    // Deletes must use the dedicated owner-scoped endpoint. Sending { id } through the
    // upsert endpoint would recreate an empty row instead of deleting it remotely.
    if (mutation.action === 'delete') {
      const deletableEntities = new Set([
        'task', 'memory', 'project', 'conversation', 'message',
        'library_item', 'workflow', 'agent',
      ]);
      if (!deletableEntities.has(mutation.entityType)) {
        throw new Error(`Cloud deletion is not supported for entity type: ${mutation.entityType}`);
      }
      const response = await fetch(
        `/api/supabase/sync-entity/${encodeURIComponent(mutation.entityType)}/${encodeURIComponent(mutation.entityId)}`,
        { method: 'DELETE', headers },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.success !== true) {
        throw new Error(typeof body.error === 'string' ? body.error : `Cloud deletion returned HTTP ${response.status}`);
      }
      return;
    }

    if (mutation.entityType === 'task') {
      const res = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tasks: [mutation.payload] }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success !== true) {
        throw new Error(result.message || result.error || `Task sync endpoint returned ${res.status}`);
      }
      return;
    }

    const entityKey: Record<string, string> = {
      memory: 'memories',
      project: 'projects',
      workflow: 'workflows',
      conversation: 'conversations',
      message: 'messages',
      library_item: 'libraryItems',
      agent: 'agents',
    };
    const key = entityKey[mutation.entityType];
    if (!key) throw new Error(`Unsupported cloud entity: ${mutation.entityType}`);

    const res = await fetch('/api/supabase/sync-all', {
      method: 'POST',
      headers,
      body: JSON.stringify({ [key]: [mutation.payload] }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result.success !== true) {
      throw new Error(result.message || result.error || `Cloud sync endpoint returned ${res.status}`);
    }
  }

  /**
   * Trigger immediate workspace synchronization
   */
  public async syncNow(token?: string | null): Promise<void> {
    if (token !== undefined) this.sessionToken = token;
    await this.processQueue();
  }
}

export const syncService = new SyncService();
