/**
 * ANGEL AI — Offline-First Synchronization Manager
 * Coordinates queued mutations, conflict resolution, retry backoff,
 * network state transitions, and deterministic cloud reconciliation.
 * Delegates to centralized syncService.
 */

import { syncService } from '../syncService';
import { QueuedMutation } from './offlineDb';

export type SyncState = 'synced' | 'syncing' | 'offline_queued' | 'error' | 'offline';

class OfflineSyncManager {
  getNetworkStatus(): { isOnline: boolean; syncState: SyncState } {
    const status = syncService.getStatus();
    return { isOnline: status.isOnline, syncState: status.status };
  }

  subscribe(callback: (state: SyncState, queueLength: number) => void): () => void {
    return syncService.subscribe((event) => {
      callback(event.status, event.pendingCount);
    });
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
    await syncService.enqueueMutation(entityType, action, entityId, payload, isGuest);
  }

  /**
   * Processes all pending mutations deterministically in chronological order
   */
  async processQueue(sessionToken?: string | null): Promise<void> {
    if (sessionToken) {
      syncService.setSessionToken(sessionToken);
    }
    await syncService.processQueue();
  }

  async clearQueue(): Promise<void> {
    const { offlineDb } = await import('./offlineDb');
    await offlineDb.syncQueue.clear();
  }
}

export const offlineSyncManager = new OfflineSyncManager();

