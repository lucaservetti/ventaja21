// Ventaja 21 · service worker 1.0.0 (84263fdf6d)
const CACHE = "v21-1.0.0-84263fdf6d";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
];
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..800&family=Oswald:wght@500;600&display=swap";

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      await c.addAll(CORE);
      try {
        const r = await fetch(FONT_CSS);
        if (r.ok) {
          const text = await r.clone().text();
          await c.put(FONT_CSS, r);
          const urls = [...text.matchAll(/url\((https:[^)]+)\)/g)].map(
            (m) => m[1],
          );
          await Promise.all(
            urls.map((u) =>
              fetch(u)
                .then((fr) => (fr.ok ? c.put(u, fr) : null))
                .catch(() => null),
            ),
          );
        }
      } catch (err) {
        /* sin conexión: las fuentes se guardan más tarde */
      }
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
  const cacheable =
    url.origin === self.location.origin ||
    url.hostname.endsWith("gstatic.com") ||
    url.hostname.endsWith("googleapis.com");
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
