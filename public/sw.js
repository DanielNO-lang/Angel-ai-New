/**
 * ANGEL AI — Progressive Web App Service Worker
 * Versioned cache to ensure installed clients pick up the latest app shell and brand assets.
 */
const CACHE_NAME = 'angel-ai-v5';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json?v=5',
  '/icon-192.svg?v=5',
  '/icon-512.svg?v=5',
  '/icon-maskable-512.svg?v=5',
  '/angel-logo.png?v=5',
];

// Install: cache the current app shell, then activate the new worker.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[Angel PWA] Precache failed; continuing with network assets:', err))
  );
});

// Activate: remove obsolete Angel caches and claim open clients.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name.startsWith('angel-ai-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never intercept API calls or streaming requests.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api') || url.pathname.includes('/sse')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() =>
      caches.match('/index.html').then((cached) => cached || caches.match('/'))
    ));
    return;
  }

  // Keep branding and app-shell metadata fresh after deployments.
  if (url.pathname === '/manifest.json' || /\/(icon-192|icon-512|icon-maskable-512)\.svg$/.test(url.pathname) || url.pathname === '/angel-logo.png') {
    event.respondWith(fetch(event.request, { cache: 'reload' }).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  // Network-first application code prevents old JS/CSS being served after an update.
  if (/\.(js|ts|css)$/.test(url.pathname) || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/src/')) {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  // Stale-while-revalidate for other same-origin static assets.
  event.respondWith(caches.match(event.request).then((cached) => {
    const network = fetch(event.request).then((response) => {
      if (response.ok && response.type === 'basic') {
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      }
      return response;
    }).catch(() => cached);
    return cached || network;
  }));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
