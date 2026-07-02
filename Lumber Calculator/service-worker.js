/* Lumber Calculator — service worker (offline cache-first) */
/* IMPORTANT: increment this cache name (v2 -> v3 -> ...) on EVERY deployment.
   The activate handler deletes any cache whose name !== CACHE, so bumping this
   is what purges stale files and pushes the new build to installed users. */
var CACHE = 'lumber-calc-v2';
var ASSETS = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // Add individually so one missing asset doesn't fail the whole install
      return Promise.all(ASSETS.map(function (url) {
        return cache.add(url).catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (resp) {
        // Cache same-origin successful responses for future offline use
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () {
        // Offline fallback: serve the app shell for navigations
        if (e.request.mode === 'navigate') return caches.match('index.html');
      });
    })
  );
});
