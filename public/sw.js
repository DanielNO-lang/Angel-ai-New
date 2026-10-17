/**
 * ANGEL AI — Progressive Web App Service Worker
 * 
 * Features:
 * 1. Resilient Offline Caching Strategy:
 *    - Shell asset precaching (HTML, SVG/PNG icons, webmanifest, branding emblems)
 *    - Stale-While-Revalidate caching for static data & diagnostics:
 *      (/api/models, /api/ai/providers, /api/health, /api/supabase/ddl, /api/supabase/status)
 *    - Network-First with cache fallback for navigation and single-page routing
 *    - Stale-While-Revalidate for bundled scripts, CSS, and UI assets
 *    - Cache-First for Google Fonts & external CDNs
 * 2. Background Sync Engine:
 *    - Handles 'angel-sync-queue', 'sync-mutations', and 'supabase-sync' sync events
 *    - Directly inspects IndexedDB ('AngelWorkspaceOfflineDB' -> 'syncQueue')
 *    - Deterministically pushes queued tasks, memory records, and workspace items to Supabase
 *    - Pushes updates to /api/supabase/sync and /api/supabase/sync-all using stored auth token
 *    - Dispatches BACKGROUND_SYNC_COMPLETE events to connected clients
 * 3. Lifecycle & Cache Management:
 *    - Auto-purges legacy cache generations on activation
 *    - Immediate skipWaiting on manual reload request
 */

const CACHE_NAME = 'angel-ai-v6';
const STATIC_DATA_CACHE = 'angel-ai-static-data-v2';
const ASSETS_CACHE = 'angel-ai-assets-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable-512.svg',
  '/apple-touch-icon.png',
  '/angel-emblem.png',
  '/angel-logo.png',
];

// Precache and offline static data endpoints
const STATIC_DATA_ENDPOINTS = [
  '/api/models',
  '/api/ai/providers',
  '/api/health',
  '/api/supabase/ddl',
  '/api/supabase/status',
];

// In-memory cache for auth token in worker context
let cachedAuthToken = null;

// ============================================================================
// SERVICE WORKER LIFECYCLE (Install & Activate)
// ============================================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Precache critical UI Shell assets
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn(`[PWA SW] Precache missed for ${asset}:`, err);
            })
          )
        );
      }),
      // Warm up static data endpoints
      caches.open(STATIC_DATA_CACHE).then((dataCache) => {
        return Promise.allSettled(
          STATIC_DATA_ENDPOINTS.map((endpoint) =>
            fetch(endpoint)
              .then((res) => {
                if (res && res.status === 200) {
                  return dataCache.put(endpoint, res);
                }
              })
              .catch((err) => {
                console.warn(`[PWA SW] Static data warmup skipped for ${endpoint}:`, err);
              })
          )
        );
      }),
    ])
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[PWA SW] Install completion note:', err))
  );
});

self.addEventListener('activate', (event) => {
  const allowedCaches = new Set([CACHE_NAME, STATIC_DATA_CACHE, ASSETS_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !allowedCaches.has(name))
            .map((name) => {
              console.log('[PWA SW] Purging obsolete cache:', name);
              return caches.delete(name);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ============================================================================
// REQUEST INTERCEPTION & OFFLINE CACHING STRATEGY
// ============================================================================

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 1. Static Metadata & Diagnostic API Endpoints: Stale-While-Revalidate
  const isStaticDataEndpoint = STATIC_DATA_ENDPOINTS.some((ep) => url.pathname === ep);
  if (isStaticDataEndpoint) {
    event.respondWith(
      caches.open(STATIC_DATA_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch || new Response(JSON.stringify({ offline: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Bypass all other non-static API calls or streaming SSE endpoints
  if (url.pathname.startsWith('/api') || url.pathname.includes('/sse')) {
    return;
  }

  // 2. HTML Navigation Requests: Network-First with Cache Fallback to Shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const indexCached = await caches.match('/index.html');
          if (indexCached) return indexCached;
          return caches.match('/');
        })
    );
    return;
  }

  // 3. Google Fonts & External CDN Resources: Cache-First
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cached;
        }
      })
    );
    return;
  }

  // 4. Scripts, Styles & Vite Build Modules: Stale-While-Revalidate with Cache Fallback
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.css') ||
    url.pathname.startsWith('/src') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise || new Response('/* Offline module fallback */', {
          status: 200,
          headers: { 'Content-Type': 'application/javascript' },
        });
      })
    );
    return;
  }

  // 5. Static Media, Images, and Brand Graphics: Stale-While-Revalidate
  event.respondWith(
    caches.open(ASSETS_CACHE).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const networkPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.type === 'opaque')
          ) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkPromise;
    })
  );
});

// ============================================================================
// INDEXEDDB HELPERS FOR BACKGROUND SYNC
// ============================================================================

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in worker scope'));
      return;
    }
    const req = indexedDB.open('AngelWorkspaceOfflineDB', 3);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('appState')) {
        db.createObjectStore('appState', { keyPath: 'id' });
      }
    };
  });
}

function getPendingMutations(db) {
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains('syncQueue')) {
        resolve([]);
        return;
      }
      const tx = db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        const pending = items.filter((item) => item.status === 'pending');
        resolve(pending);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

function getStoredAuthToken(db) {
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains('appState')) {
        resolve(null);
        return;
      }
      const tx = db.transaction('appState', 'readonly');
      const store = tx.objectStore('appState');
      const req = store.get('current_session');
      req.onsuccess = () => {
        resolve(req.result?.sessionToken || null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function deleteMutationRecord(db, id) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function updateMutationRecord(db, id, updates) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          store.put({ ...req.result, ...updates });
        }
      };
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function broadcastToClients(message) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const client of clients) {
      client.postMessage(message);
    }
  } catch (err) {
    console.warn('[PWA SW] Broadcast to clients failed:', err);
  }
}

// ============================================================================
// BACKGROUND SYNC ENGINE (Queued Tasks, Memories & Workspace Mutations -> Supabase)
// ============================================================================

async function processBackgroundSyncQueue(tokenOverride) {
  console.log('[PWA SW Background Sync] Starting queue processing...');
  let db;
  try {
    db = await openOfflineDB();
  } catch (err) {
    console.warn('[PWA SW Background Sync] Could not open offline DB:', err);
    return;
  }

  const token = tokenOverride || cachedAuthToken || (await getStoredAuthToken(db));
  const pending = await getPendingMutations(db);

  if (pending.length === 0) {
    console.log('[PWA SW Background Sync] No pending mutations in offline queue.');
    return;
  }

  if (!token) {
    console.warn('[PWA SW Background Sync] Auth token unavailable; mutations remain queued.');
    await broadcastToClients({
      type: 'BACKGROUND_SYNC_AUTH_REQUIRED',
      pendingCount: pending.length,
    });
    return;
  }

  // Sort mutations chronologically by clientTimestamp
  pending.sort((a, b) => {
    const timeA = new Date(a.clientTimestamp || 0).getTime();
    const timeB = new Date(b.clientTimestamp || 0).getTime();
    return timeA - timeB;
  });

  let syncedCount = 0;
  let failedCount = 0;

  for (const mutation of pending) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      let res;
      if (mutation.entityType === 'task') {
        res = await fetch('/api/supabase/sync', {
          method: 'POST',
          headers,
          body: JSON.stringify({ tasks: [mutation.payload] }),
        });
      } else {
        const entityKeyMap = {
          memory: 'memories',
          project: 'projects',
          workflow: 'workflows',
          conversation: 'conversations',
          message: 'messages',
          library_item: 'libraryItems',
          agent: 'agents',
        };
        const key = entityKeyMap[mutation.entityType] || 'memories';
        res = await fetch('/api/supabase/sync-all', {
          method: 'POST',
          headers,
          body: JSON.stringify({ [key]: [mutation.payload] }),
        });
      }

      const result = await res.json().catch(() => ({}));
      if (res.ok && result.success !== false) {
        await deleteMutationRecord(db, mutation.id);
        syncedCount++;
      } else {
        const retryCount = (mutation.retryCount || 0) + 1;
        const errMsg = result.error || result.message || `Status ${res.status}`;
        if (retryCount >= 5) {
          await updateMutationRecord(db, mutation.id, { status: 'failed', error: errMsg });
        } else {
          await updateMutationRecord(db, mutation.id, { retryCount, error: errMsg });
        }
        failedCount++;
      }
    } catch (err) {
      console.warn(`[PWA SW Background Sync] Mutation ${mutation.id} sync error:`, err);
      const retryCount = (mutation.retryCount || 0) + 1;
      const errMsg = err instanceof Error ? err.message : String(err);
      if (retryCount >= 5) {
        await updateMutationRecord(db, mutation.id, { status: 'failed', error: errMsg });
      } else {
        await updateMutationRecord(db, mutation.id, { retryCount, error: errMsg });
      }
      failedCount++;
    }
  }

  console.log(`[PWA SW Background Sync] Completed. Synced: ${syncedCount}, Failed: ${failedCount}`);

  // Notify all open workspace tabs/windows of the background sync outcome
  await broadcastToClients({
    type: 'BACKGROUND_SYNC_COMPLETE',
    success: syncedCount > 0 && failedCount === 0,
    syncedCount,
    failedCount,
    remainingCount: pending.length - syncedCount,
    timestamp: new Date().toISOString(),
  });
}

// Background Sync API listener
self.addEventListener('sync', (event) => {
  if (
    event.tag === 'angel-sync-queue' ||
    event.tag === 'sync-mutations' ||
    event.tag === 'supabase-sync'
  ) {
    event.waitUntil(processBackgroundSyncQueue());
  }
});

// Periodic Background Sync API listener (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'angel-periodic-sync') {
    event.waitUntil(processBackgroundSyncQueue());
  }
});

// Update coordination & message listener
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SET_AUTH_TOKEN') {
    cachedAuthToken = event.data.token || null;
  }

  if (event.data.type === 'TRIGGER_SYNC') {
    event.waitUntil(processBackgroundSyncQueue(event.data.token));
  }
});
