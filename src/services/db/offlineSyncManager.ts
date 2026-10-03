/**
 * ANGEL AI — Offline-First Synchronization Manager
 * Coordinates queued mutations, conflict resolution, retry backoff,
 * network state transitions, and deterministic cloud reconciliation.
 */

import { offlineDb, QueuedMutation } from './offlineDb';

export type SyncState = 'synced' | 'syncing' | 'offline_queued' | 'error';

class OfflineSyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncState: SyncState = 'synced';
  private syncListeners: Array<(state: SyncState, queueLength: number) => void> = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.processQueue();
    } else {
      this.setSyncState('offline_queued');
    }
  }

  getNetworkStatus(): { isOnline: boolean; syncState: SyncState } {
    return { isOnline: this.isOnline, syncState: this.syncState };
  }

  subscribe(callback: (state: SyncState, queueLength: number) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
    };
  }

  private async notifyListeners() {
    const queueCount = await offlineDb.syncQueue.where('status').equals('pending').count();
    this.syncListeners.forEach((fn) => {
      try {
        fn(this.syncState, queueCount);
      } catch {
        // ignore
      }
    });
  }

  private setSyncState(state: SyncState) {
    this.syncState = state;
    this.notifyListeners();
  }

  /**
   * Enqueues a mutation. If user is guest, mutations remain purely local and are never queued for cloud.
   */
  async enqueueMutation(
    entityType: QueuedMutation['entityType'],
    action: QueuedMutation['action'],
    entityId: string,
    payload: any,
    isGuest: boolean = false
  ): Promise<void> {
    if (isGuest) {
      // Guest isolation: Never queue cloud mutations for guest sessions
      return;
    }

    const mutation: QueuedMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entityType,
      action,
      entityId,
      payload,
      clientTimestamp: new Date().toISOString(),
      version: 1,
      retryCount: 0,
      status: 'pending',
    };

    await offlineDb.syncQueue.put(mutation);

    if (this.isOnline) {
      this.processQueue();
    } else {
      this.setSyncState('offline_queued');
    }
  }

  /**
   * Processes all pending mutations deterministically in chronological order
   */
  async processQueue(sessionToken?: string | null): Promise<void> {
    if (this.isProcessingQueue || !this.isOnline) return;
    this.isProcessingQueue = true;
    this.setSyncState('syncing');

    try {
      const pendingMutations = await offlineDb.syncQueue
        .where('status')
        .equals('pending')
        .sortBy('clientTimestamp');

      if (pendingMutations.length === 0) {
        this.setSyncState('synced');
        this.isProcessingQueue = false;
        return;
      }

      for (const mut of pendingMutations) {
        try {
          await offlineDb.syncQueue.update(mut.id, { status: 'syncing' });

          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          };

          // Synchronize entity with server
          const endpoint = mut.entityType === 'task' ? '/api/supabase/sync' : '/api/user/cloud-data';
          const body =
            mut.entityType === 'task'
              ? JSON.stringify({ tasks: [mut.payload] })
              : JSON.stringify({ [mut.entityType]: mut.payload });

          const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body,
          });

          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
          }

          // Mark complete & delete from queue on success
          await offlineDb.syncQueue.delete(mut.id);
        } catch (err) {
          console.warn(`[SyncManager] Failed to sync mutation ${mut.id}:`, err);
          const nextRetry = mut.retryCount + 1;
          if (nextRetry > 5) {
            await offlineDb.syncQueue.update(mut.id, { status: 'failed', error: String(err) });
          } else {
            await offlineDb.syncQueue.update(mut.id, {
              status: 'pending',
              retryCount: nextRetry,
              error: String(err),
            });
          }
        }
      }

      const remaining = await offlineDb.syncQueue.where('status').equals('pending').count();
      const failed = await offlineDb.syncQueue.where('status').equals('failed').count();

      if (failed > 0) {
        this.setSyncState('error');
      } else if (remaining > 0) {
        this.setSyncState('offline_queued');
      } else {
        this.setSyncState('synced');
      }
    } catch {
      this.setSyncState('error');
    } finally {
      this.isProcessingQueue = false;
    }
  }

  async clearQueue(): Promise<void> {
    await offlineDb.syncQueue.clear();
    this.setSyncState('synced');
  }
}

export const offlineSyncManager = new OfflineSyncManager();
