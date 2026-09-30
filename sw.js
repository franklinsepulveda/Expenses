/* Gasto — caché offline.
   La PÁGINA se pide siempre a la red primero, así una versión nueva se ve al abrir,
   sin tener que cerrar y reabrir dos veces. Si no hay señal, cae al caché. */
const CACHE = 'gasto-v7';
const ASSETS = ['./', './index.html', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const esPagina = e.request.mode === 'navigate' || e.request.destination === 'document';

  if (esPagina) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
          return r;
        })
        .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) {
        fetch(e.request).then(r => {
          if (r && r.ok) caches.open(CACHE).then(c => c.put(e.request, r));
        }).catch(() => {});
        return hit;
      }
      return fetch(e.request).catch(() => caches.match('./index.html'));
    })
  );
});
