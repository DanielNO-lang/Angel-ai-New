/* Angel AI custom service worker: app-shell caching, guarded navigation, and Web Push. */
const CACHE_NAME = 'angel-ai-v6';
const PRECACHE_MANIFEST = self.__WB_MANIFEST;
const PRECACHE_ASSETS = Array.isArray(PRECACHE_MANIFEST)
  ? PRECACHE_MANIFEST.map((entry) => new URL(entry.url, self.location.origin).href)
  : [];
const BRAND_ASSETS = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable-512.svg',
  '/angel-logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([...new Set([...PRECACHE_ASSETS, ...BRAND_ASSETS])].map((item) => new URL(item, self.location.origin).href)))
      .then(() => self.skipWaiting())
      .catch((error) => {
        // Install should not brick the new version if one optional brand image is missing.
        console.warn('[Angel PWA] Precache incomplete; network fallback remains active.', error);
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => name.startsWith('angel-ai-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

function isAppShellRequest(url) {
  return /\.(js|mjs|css|html|ico|png|svg|woff2?)$/i.test(url.pathname) ||
    url.pathname.startsWith('/assets/');
}

function safeInternalNotificationUrl(value) {
  try {
    const target = new URL(typeof value === 'string' ? value : '/', self.location.origin);
    if (target.origin !== self.location.origin) return new URL('/', self.location.origin).href;
    return target.href;
  } catch {
    return new URL('/', self.location.origin).href;
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Never intercept API requests, auth callbacks, real-time transports or cross-origin content.
  if (url.origin !== self.location.origin ||
      url.pathname.startsWith('/api/') ||
      url.pathname.includes('/sse') ||
      url.pathname.startsWith('/auth/') ||
      request.headers.has('authorization')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match('/index.html')) || (await cache.match('/')) ||
        new Response('Angel is offline. Reconnect and try again.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }));
    return;
  }

  if (/\/manifest\.json$/.test(url.pathname) ||
      /\/(icon-192|icon-512|icon-maskable-512)\.svg$/.test(url.pathname) ||
      url.pathname === '/angel-logo.png') {
    event.respondWith(fetch(request, { cache: 'reload' }).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response('', { status: 504 });
    }));
    return;
  }

  if (isAppShellRequest(url)) {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      return cached || new Response('', { status: 504 });
    }));
    return;
  }

  // Unknown same-origin reads use bounded stale-while-revalidate.
  event.respondWith(caches.match(request).then((cached) => {
    const network = fetch(request).then((response) => {
      if (response.ok && response.type === 'basic') {
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    }).catch(() => cached || new Response('', { status: 504 }));
    return cached || network;
  }));
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = typeof payload.title === 'string' && payload.title.length <= 120
    ? payload.title
    : 'Angel AI';
  const body = typeof payload.body === 'string'
    ? payload.body.replace(/[\r\n\t]+/g, ' ').slice(0, 180)
    : 'Angel has an update for you.';
  const url = safeInternalNotificationUrl(payload.url);
  const tag = typeof payload.tag === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(payload.tag)
    ? payload.tag
    : 'angel-update';

  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag,
    data: { url },
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    renotify: false,
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = safeInternalNotificationUrl(event.notification.data?.url);
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      try {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          if ('navigate' in client) await client.navigate(targetUrl);
          await client.focus();
          return;
        }
      } catch {}
    }
    if (self.clients.openWindow) await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
