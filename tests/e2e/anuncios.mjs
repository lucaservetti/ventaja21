// Anuncios en la web (AdSense) con un AdSense de mentira: carga el código de Google con el cliente,
// la política de seguridad lo deja correr, la segunda oportunidad pide un anuncio con premio (si lo
// cierras antes, no hay premio), entre dos actividades aparece uno, y con Premium o en los primeros
// 3 días no hay ninguno.
// Hace falta armar la app con un cliente de prueba:
//   ADSENSE_CLIENTE=ca-pub-0000000000000000 npm run build && node tests/e2e/anuncios.mjs
// (al terminar, vuelve a correr npm run build sin esa variable)
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CLIENTE = "ca-pub-0000000000000000";
const DIA = 864e5;
const fails = [];
function check(c, msg) {
  if (!c) throw new Error(msg);
}
async function paso(nombre, fn) {
  try {
    await fn();
    console.log(`✓ ${nombre}`);
  } catch (e) {
    fails.push(nombre);
    console.log(`✗ ${nombre}: ${String(e.message || e).split("\n")[0]}`);
  }
}
check(fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8").includes(CLIENTE), `la app no está armada con el cliente de prueba: ADSENSE_CLIENTE=${CLIENTE} npm run build`);

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  fs.readFile(path.join(ROOT, p), (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }).end(d)));
});
await new Promise((ok) => srv.listen(0, ok));
const url = `http://localhost:${srv.address().port}/app/index.html`;

// AdSense de mentira (la API de anuncios para juegos web): anota cada pedido y contesta como Google.
// window.__modo: "visto" (lo mira entero) o "cerrado" (lo cierra antes de terminar).
const ADSENSE_FALSO = `(() => {
  window.__pedidos = window.__pedidos || [];
  const atender = (o) => {
    window.__pedidos.push(o.type || (o.preloadAdBreaks ? "config" : "otro"));
    const modo = window.__modo || "visto";
    if (o.type === "next") setTimeout(() => o.adBreakDone && o.adBreakDone({ breakStatus: "viewed" }), 50);
    if (o.type === "reward")
      o.beforeReward(() => setTimeout(() => {
        if (modo === "cerrado") { o.adDismissed(); o.adBreakDone({ breakStatus: "dismissed" }); }
        else { o.adViewed(); o.adBreakDone({ breakStatus: "viewed" }); }
      }, 50));
  };
  const cola = Array.isArray(window.adsbygoogle) ? window.adsbygoogle : [];
  window.adsbygoogle = { push: atender };
  cola.forEach(atender);
})();`;

const browser = await chromium.launch();
async function abrir({ dias = 10, premium = false, reloj = false } = {}) {
  const st = { v: 1, profile: { onboarded: true, experience: "rules", goal: "casino", startSection: 1, createdAt: Date.now() - dias * DIA }, lastTab: "conteo", settings: premium ? { premium: true } : {} };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "es-UY" });
  await ctx.addInitScript(`if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s","1"); localStorage.setItem("edge21.lang","es"); localStorage.setItem("ventaja21.state.v1", ${JSON.stringify(JSON.stringify(st))}); }`);
  const cargas = [];
  await ctx.route("https://pagead2.googlesyndication.com/**", (r) => {
    cargas.push(r.request().url());
    return r.fulfill({ contentType: "text/javascript", body: ADSENSE_FALSO });
  });
  const page = await ctx.newPage();
  // Con reloj de mentira se puede adelantar el minuto de la contrarreloj.
  if (reloj) await page.clock.install();
  page.errores = [];
  page.on("pageerror", (e) => page.errores.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && page.errores.push(m.text()));
  await page.goto(url);
  await page.waitForSelector("nav.tabbar");
  await page.waitForTimeout(800);
  page.cargas = cargas;
  return page;
}
const pedidos = (p) => p.evaluate(() => window.__pedidos || []);
// El desafío diario hasta el resultado (las cartas caen solas; se contesta cualquier número).
async function desafio(p) {
  await p.getByText("Desafío diario").filter({ visible: true }).first().click();
  await p.waitForTimeout(500);
  await p.getByRole("button", { name: "Empezar", exact: true }).filter({ visible: true }).first().click();
  await p.locator(".keypad").first().waitFor({ timeout: 90000 });
  await p.locator(".keypad .key").filter({ hasText: /^0$/ }).first().click();
  await p.locator(".keypad-ok").first().click();
  await p.waitForTimeout(800);
}

// Después de la segunda oportunidad, el otro intento arranca con "Empezar" (cartas nuevas).
async function otroIntento(p) {
  await p.getByRole("button", { name: "Empezar", exact: true }).filter({ visible: true }).first().click({ timeout: 5000 });
  await p.locator(".keypad").first().waitFor({ timeout: 90000 });
  await p.locator(".keypad .key").filter({ hasText: /^0$/ }).first().click();
  await p.locator(".keypad-ok").first().click();
  await p.waitForTimeout(800);
}

await paso("ads.txt con la cuenta de AdSense", async () => {
  const txt = fs.readFileSync(path.join(ROOT, "ads.txt"), "utf8");
  check(txt.trim() === "google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0", `ads.txt: ${txt}`);
});

const p = await abrir({ reloj: true });
await paso("carga el código de AdSense con el cliente y la política de seguridad lo deja correr", async () => {
  check(p.cargas.length === 1 && p.cargas[0].includes(`client=${CLIENTE}`), `cargas: ${p.cargas.join(" ")}`);
  check((await pedidos(p)).includes("config"), "no se configuró la API de anuncios");
  check(!p.errores.some((e) => /Content Security Policy/.test(e)), p.errores.join(" | "));
});
await paso("segunda oportunidad: si cierras el anuncio antes, no hay premio", async () => {
  await desafio(p);
  await p.evaluate(() => (window.__modo = "cerrado"));
  await p.getByRole("button", { name: /Segunda oportunidad \(ver un anuncio\)/ }).click();
  await p.waitForTimeout(800);
  check((await pedidos(p)).includes("reward"), "no pidió el anuncio con premio");
  check((await p.getByRole("button", { name: /Segunda oportunidad/ }).count()) > 0, "dio la segunda oportunidad sin mirar el anuncio");
});
await paso("segunda oportunidad: mirando el anuncio, empieza el otro intento", async () => {
  await p.evaluate(() => (window.__modo = "visto"));
  const antes = (await pedidos(p)).filter((x) => x === "reward").length;
  await p.getByRole("button", { name: /Segunda oportunidad \(ver un anuncio\)/ }).click();
  await p.waitForTimeout(500);
  check((await pedidos(p)).filter((x) => x === "reward").length === antes + 1, "no pidió otro anuncio con premio");
  await otroIntento(p);
});
// Volver a las pestañas, como una persona: con el botón de la pantalla.
const volver = async (q) => {
  await q.locator('.layer.full [aria-label="Cerrar"], .layer.full [aria-label="Volver"]').filter({ visible: true }).first().click();
  await q.waitForTimeout(1500);
};
await paso("entre actividades: al volver de la primera no hay; al volver de la segunda, sí", async () => {
  await volver(p);
  await p.waitForTimeout(1500);
  check(!(await pedidos(p)).includes("next"), "mostró uno después de una sola actividad");
  // Segunda actividad: una contrarreloj (se adelanta el reloj hasta que termina).
  await p.locator('nav.tabbar button:has-text("Entrenar")').click();
  await p.getByText("Contrarreloj").filter({ visible: true }).first().click();
  await p.waitForTimeout(500);
  await p.getByRole("button", { name: "Empezar", exact: true }).filter({ visible: true }).first().click();
  await p.waitForTimeout(600);
  await p.locator(".act-btn.act-S").first().click();
  await p.clock.fastForward(62000);
  await p.locator(".blitz-time").waitFor({ state: "detached", timeout: 5000 });
  await volver(p);
  check((await pedidos(p)).includes("next"), "no pidió el anuncio entre actividades");
  check(!p.errores.length, p.errores.join(" | "));
});

await paso("con Premium no se carga nada de anuncios", async () => {
  const q = await abrir({ premium: true });
  check(q.cargas.length === 0, "cargó AdSense con Premium");
  await desafio(q);
  const b = q.getByRole("button", { name: /Segunda oportunidad/ });
  check((await b.innerText()).trim() === "Segunda oportunidad", "con Premium pide mirar un anuncio");
  await q.context().close();
});
await paso("en los primeros 3 días no hay anuncios entre actividades", async () => {
  const q = await abrir({ dias: 1 });
  await desafio(q);
  await q.getByRole("button", { name: /Segunda oportunidad \(ver un anuncio\)/ }).click();
  await q.waitForTimeout(500);
  await otroIntento(q);
  await volver(q);
  check(!(await pedidos(q)).includes("next"), "mostró un anuncio a alguien nuevo");
  await q.context().close();
});

await browser.close();
srv.close();
console.log(fails.length ? `${fails.length} paso(s) fallaron` : "los anuncios de la web funcionan");
process.exit(fails.length ? 1 : 0);
