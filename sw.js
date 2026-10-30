// Edge 21 · service worker 1.12.0 (b98f56ebdd)
const CACHE = "v21-1.12.0-b98f56ebdd";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./fonts/DMSans-latin-400-800.woff2",
  "./fonts/DMSans-latin-ext-400-800.woff2",
  "./fonts/Oswald-latin-500.woff2",
  "./fonts/Oswald-latin-600.woff2",
  "./fonts/Oswald-latin-ext-500.woff2",
  "./fonts/Oswald-latin-ext-600.woff2",
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      await c.addAll(CORE);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys())
        if (k !== CACHE) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

function timeout(ms) {
  return new Promise((_, rej) =>
    setTimeout(() => rej(new Error("timeout")), ms),
  );
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Solo la app pasa por acá. Las otras páginas (la política de privacidad, la página web)
  // van directo a la red, y nunca se guardan como si fueran la app.
  const scope = new URL(self.registration.scope).pathname;
  const isApp = url.pathname === scope || url.pathname === scope + "index.html";
  if (req.mode === "navigate" && !isApp) return;
  if (url.pathname.startsWith(scope + "sitio/")) return;
  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        const c = await caches.open(CACHE);
        try {
          const net = await Promise.race([fetch(req), timeout(4000)]);
          if (net && net.ok) c.put("./index.html", net.clone());
          return net;
        } catch (err) {
          return (
            (await c.match("./index.html")) ||
            (await c.match("./")) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }
  const cacheable = url.origin === self.location.origin;
  if (!cacheable) return;
  e.respondWith(
    (async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(req, {
        ignoreVary: true,
        ignoreSearch: url.origin === self.location.origin,
      });
      if (hit) return hit;
      try {
        const net = await fetch(req);
        if (net && (net.ok || net.type === "opaque")) c.put(req, net.clone());
        return net;
      } catch (err) {
        return Response.error();
      }
    })(),
  );
});
