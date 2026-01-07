const CACHE_NAME = 'nelsen-cache-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// ==================
// INSTALL
// ==================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ==================
// ACTIVATE
// ==================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ==================
// FETCH
// ==================
self.addEventListener('fetch', event => {
  const req = event.request;

  // 🔥 JSON: NETWORK FIRST (selalu update)
  if (req.url.includes('kamus_dayak.json')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // ⚡ Static: CACHE FIRST
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

// ==================
// MESSAGE
// ==================
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
