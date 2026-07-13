/*
 * Minimal, SAFE service worker for installability + faster repeat loads.
 * Network-FIRST for same-origin navigations only; falls back to cache when offline.
 * It NEVER caches API calls, cross-origin assets, or game/provider iframes — so it
 * can't serve stale balances or break real-money flows. Registration is opt-in
 * (NEXT_PUBLIC_PWA=on) — see src/components/shared/pwa.tsx.
 *
 * Also handles Web Push (push + notificationclick). Push is only received when the
 * tenant has enabled it and the player opted in (see push-optin.tsx); the payload is
 * { title, body, url, icon }. See docs/12-pwa-and-push.md.
 */
const CACHE = 'shell-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  // Same-origin only. Never touch APIs or game iframes / provider CDNs.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api') || url.pathname.includes('/games/')) return;

  // Network-first for page navigations; cache is only an offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/'))),
    );
  }
});

// ── Web Push ──────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon.png',
    badge: data.icon || '/icon.png',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if one is open; otherwise open a new one.
      for (const client of clientList) {
        if ('focus' in client) { client.navigate(target); return client.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
