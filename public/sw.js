const NAMA = "jebew-shell-v4";
const BERKAS = ["/", "/manifest.webmanifest", "/assets/jebew-icon.svg", "/assets/jebew-hero.svg"];

self.addEventListener("install", (peristiwa) => {
  peristiwa.waitUntil(caches.open(NAMA).then((cache) => cache.addAll(BERKAS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (peristiwa) => {
  peristiwa.waitUntil(
    caches.keys().then((daftar) =>
      Promise.all(daftar.filter((n) => n !== NAMA).map((n) => caches.delete(n)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (peristiwa) => {
  const url = new URL(peristiwa.request.url);
  if (peristiwa.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  peristiwa.respondWith(
    fetch(peristiwa.request).then((jawaban) => {
      const salinan = jawaban.clone();
      caches.open(NAMA).then((cache) => cache.put(peristiwa.request, salinan)).catch(() => {});
      return jawaban;
    }).catch(() => caches.match(peristiwa.request)),
  );
});
