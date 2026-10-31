// Saca las capturas de la página web (img/<pantalla>-<idioma>.webp, 540x960) desde la app actual.
// Uso: npm run build && node tools/capturas-web.mjs
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const estado = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/video/estado.json"), "utf8"));
const TMP = fs.mkdtempSync(path.join(ROOT, "tools/.capturas-"));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  fs.readFile(path.join(ROOT, p), (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }).end(d)));
});
await new Promise((ok) => srv.listen(0, ok));
const base = `http://localhost:${srv.address().port}/app/index.html`;
const azar = `(() => { let s = 7; const r = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; }; Math.random = r; if (window.crypto) crypto.getRandomValues = (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(r() * 4294967296); return a; }; })();`;

// Cada pantalla: cómo llegar desde la app recién abierta.
const W = (L, es, en) => (L === "es" ? es : en);
const PANTALLAS = {
  aprender: async (p, L) => {
    await tab(p, W(L, "Aprender", "Learn"));
    // Que se vea el camino de fichas de la sección que sigue.
    await p.evaluate(() => { const c = document.querySelector("section:not([hidden]) .placard.current"); if (c) c.scrollIntoView({ block: "start" }); });
    await p.waitForTimeout(600);
  },
  conteo: async (p, L) => { await tab(p, W(L, "Conteo", "Count")); },
  progreso: async (p, L) => { await tab(p, W(L, "Progreso", "Progress")); },
  mano: async (p, L) => {
    await tab(p, W(L, "Entrenar", "Train"));
    await p.getByText(W(L, "Repartir 10 manos", "Deal 10 hands")).filter({ visible: true }).first().click();
    await p.waitForTimeout(1600);
  },
  mesa: async (p, L) => {
    await tab(p, W(L, "Jugar", "Play"));
    await p.locator("section:not([hidden]) .chip-rack .chip").nth(2).click();
    await p.waitForTimeout(300);
    await p.locator(`section:not([hidden]) button:has-text("${W(L, "Repartir", "Deal")}")`).first().click();
    await p.waitForTimeout(3600);
  },
  casino: async (p, L) => {
    await tab(p, W(L, "Jugar", "Play"));
    await p.locator("section:not([hidden]) button").first().click();
    await p.waitForTimeout(900);
  },
};
async function tab(p, name) {
  await p.locator(`nav.tabbar button:has-text("${name}")`).first().click();
  await p.waitForTimeout(900);
}

const b = await chromium.launch();
for (const L of ["es", "en"]) {
  for (const [nombre, ir] of Object.entries(PANTALLAS)) {
    const ctx = await b.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 4 / 3, locale: L === "es" ? "es-UY" : "en-US" });
    await ctx.addInitScript(azar);
    await ctx.addInitScript(`if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s", "1"); localStorage.setItem("edge21.lang", "${L}"); localStorage.setItem("ventaja21.state.v1", ${JSON.stringify(JSON.stringify(estado))}); }`);
    const p = await ctx.newPage();
    await p.goto(base);
    await p.waitForTimeout(1200);
    await ir(p, L);
    const png = path.join(TMP, `${nombre}-${L}.png`);
    await p.screenshot({ path: png });
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-quality", "82", path.join(ROOT, "img", `${nombre}-${L}.webp`)]);
    console.log(`img/${nombre}-${L}.webp`);
    await ctx.close();
  }
}
await b.close();
srv.close();
fs.rmSync(TMP, { recursive: true, force: true });
