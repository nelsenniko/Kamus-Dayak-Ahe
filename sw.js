const CACHE_NAME = 'nelsen-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './kamus_dayak.json'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    const req = e.request;
    e.respondWith(
        caches.match(req).then(cached => {
            return fetch(req)
                .then(res => {
                    if (!res || res.status !== 200 || res.type !== 'basic') return res;
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
                    return res;
                })
                .catch(() => cached);
        })
    );
});

self.addEventListener('message', e => {
    if (e.data === 'skipWaiting') self.skipWaiting();
});