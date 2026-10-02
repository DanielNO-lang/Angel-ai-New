/**
 * ANGEL AI — Progressive Web App Service Worker
 * Provides offline navigation resilience, asset caching, and standalone PWA installability.
 */

const CACHE_NAME = 'angel-ai-v3';
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
      .catch((err) => console.warn('[PWA SW] Precache warning:', err))
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for API and dynamic resources, stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  // Ignore non-GET and chrome-extension/internal schemes
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Bypass API calls or streaming endpoints
  if (url.pathname.startsWith('/api') || url.pathname.includes('/sse')) {
    return;
  }

  // HTML navigation: Network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html').then((res) => res || caches.match('/'))
      )
    );
    return;
  }

  // Scripts, source files, and assets: Network-first to always run latest compiled code
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.ts') || url.pathname.startsWith('/src') || url.pathname.startsWith('/assets')) {
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

  // Static assets: Stale-while-revalidate
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

// Skip waiting listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
