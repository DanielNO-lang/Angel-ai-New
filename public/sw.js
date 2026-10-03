/**
 * ANGEL AI — Progressive Web App Service Worker (Canonical Strategy)
 * Provides:
 * - High-speed offline navigation resilience
 * - Cache recovery & auto-cleanup of stale code assets
 * - Network-first for JavaScript/TypeScript application code so stale code is never served indefinitely
 * - Stale-while-revalidate for read-only metadata APIs (/api/models, /api/ai/providers)
 * - Standalone PWA installability with complete manifest asset caching
 * - Interactive SKIP_WAITING update coordination
 */

const CACHE_NAME = 'angel-ai-v4';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable-512.svg',
];

// Install: precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[PWA SW] Precache notice:', err))
  );
});

// Activate: clean up old caches deterministically
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[PWA SW] Purging stale cache:', name);
              return caches.delete(name);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Strategy routing
self.addEventListener('fetch', (event) => {
  // Ignore non-GET and internal browser schemes
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Safe read-only API caching (Stale-While-Revalidate for offline model/provider discovery)
  if (url.pathname === '/api/models' || url.pathname === '/api/ai/providers') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Bypass all other API calls or streaming SSE endpoints
  if (url.pathname.startsWith('/api') || url.pathname.includes('/sse')) {
    return;
  }

  // HTML navigation: Network-first with cache fallback to /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html').then((res) => res || caches.match('/'))
      )
    );
    return;
  }

  // Scripts, styles, and assets: Network-first to ALWAYS run latest compiled code without stale stalls
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.css') ||
    url.pathname.startsWith('/src') ||
    url.pathname.startsWith('/assets')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (images, icons, fonts): Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Update coordination listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
