// Edge 21 · service worker 1.20.0 (c6034bdc28)
const CACHE = "v21-1.20.0-c6034bdc28";
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
// Diccionarios ({ en: "i18n/en-<huella>.json", pt: ... }): la app trae solo el de su idioma. Van en
// una caché aparte que no se borra al actualizar; al instalar una versión nueva se baja el
// diccionario nuevo solo de los idiomas que ya estaban guardados (el de la persona), así la app
// sigue abriendo sin internet después de actualizarse.
// eslint-disable-next-line no-undef -- build.mjs lo reemplaza por los nombres de los archivos
const I18N = {"en":"i18n/en-81edf85be7.json","pt":"i18n/pt-13d0d28876.json"};
const CACHE_I18N = "v21-i18n";
const urlI18n = (ruta) => new URL(ruta, self.registration.scope).href;
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      await c.addAll(CORE);
      const d = await caches.open(CACHE_I18N);
      const guardados = (await d.keys()).map((r) => new URL(r.url).pathname);
      for (const [lang, ruta] of Object.entries(I18N))
        if (guardados.some((p) => p.includes(`/i18n/${lang}-`)) && !(await d.match(urlI18n(ruta))))
          await d.add(urlI18n(ruta)).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys())
        if (k !== CACHE && k !== CACHE_I18N) await caches.delete(k);
      // Los diccionarios de versiones viejas ya no se usan.
      const d = await caches.open(CACHE_I18N);
      const vigentes = Object.values(I18N).map(urlI18n);
      for (const r of await d.keys()) if (!vigentes.includes(r.url)) await d.delete(r);
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
  // Solo la app pasa por aquí. Las otras páginas (la política de privacidad, la página web)
  // van directo a la red, y nunca se guardan como si fueran la app.
  const scope = new URL(self.registration.scope).pathname;
  const isApp = url.pathname === scope || url.pathname === scope + "index.html";
  if (req.mode === "navigate" && !isApp) return;
  // Lo de afuera de la app (version.json, las imágenes de la página web…) va siempre a la red.
  if (url.origin === self.location.origin && !url.pathname.startsWith(scope))
    return;
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
  if (url.pathname.startsWith(scope + "i18n/")) {
    // Tienen la huella en el nombre: si está guardado, es el correcto.
    e.respondWith(
      (async () => {
        const d = await caches.open(CACHE_I18N);
        const hit = await d.match(req, { ignoreSearch: true });
        if (hit) return hit;
        const net = await fetch(req);
        if (net.ok) d.put(req, net.clone());
        return net;
      })(),
    );
    return;
  }
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
