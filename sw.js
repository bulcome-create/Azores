/* Cuaderno Azores — service worker
   Estrategia: caché primero (funciona sin cobertura) + refresco en segundo plano.
   Las fotos de Wikipedia y demás peticiones GET se van cacheando según las ves. */
const V = "azores-v1";
const BASE = ["./", "./index.html", "./manifest.webmanifest",
              "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const red = fetch(e.request).then(r => {
        if (r && (r.ok || r.type === "opaque")) {
          const copia = r.clone();
          caches.open(V).then(c => c.put(e.request, copia));
        }
        return r;
      }).catch(() => hit);
      return hit || red;
    })
  );
});
