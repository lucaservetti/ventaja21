// Graba escenas de Edge 21 cuadro por cuadro a 60 FPS (ver README.md).
// Uso: node tools/video/grabar.cjs <es|en> [escena ...]
// Deja los cuadros en tools/video/salida/<idioma>-<escena>/ (PNG, 780x1688).
const { chromium } = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");
const ESCENAS = require("./escenas.cjs");

const FPS = 60;
const ZOOM = 2; // la app se dibuja al doble (390x844 → 780x1688) para que el texto salga nítido
const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(__dirname, "salida");
const estado = JSON.parse(fs.readFileSync(path.join(__dirname, "estado.json"), "utf8"));
const reloj = fs.readFileSync(path.join(__dirname, "reloj.js"), "utf8");
const azar = (n) => `(() => { let s = ${n} >>> 0 || 1; const r = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; }; Math.random = r; if (window.crypto) window.crypto.getRandomValues = (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(r() * 4294967296); return a; }; })();`;

function servidor() {
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".webmanifest": "application/manifest+json" };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) return res.writeHead(403).end();
    fs.readFile(f, (e, d) => {
      if (e) return res.writeHead(404).end();
      res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }).end(d);
    });
  });
  return new Promise((ok) => srv.listen(0, () => ok(srv)));
}

// Lo que puede hacer una escena. Con dir=null es un ensayo: corre igual pero sin sacar fotos.
function director(page, cdp, dir, L) {
  let n = 0;
  const W = (es, en) => (L === "es" ? es : en);
  const v = {
    W,
    get t() {
      return n / FPS;
    },
    async frame() {
      await page.evaluate((ms) => window.__clock.advance(ms), 1000 / FPS);
      if (dir) {
        const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(path.join(dir, `f${String(n).padStart(5, "0")}.png`), Buffer.from(data, "base64"));
      }
      n++;
    },
    async wait(ms) {
      const until = n + Math.round((ms / 1000) * FPS);
      while (n < until) await v.frame();
    },
    // Toca un elemento: se ve un círculo donde va el dedo y después se hace el clic.
    async tap(target, { ripple = true } = {}) {
      const loc = typeof target === "string" ? page.locator(target).first() : target.first();
      await loc.waitFor({ state: "attached", timeout: 5000 });
      const box = await loc.boundingBox();
      if (ripple && box)
        await page.evaluate(([x, y]) => {
          const d = document.createElement("div");
          d.className = "__tap";
          d.style.left = x + "px";
          d.style.top = y + "px";
          document.body.appendChild(d);
          window.setTimeout(() => d.remove(), 700);
        }, [(box.x + box.width / 2) / ZOOM, (box.y + box.height / 2) / ZOOM]);
      await v.wait(110);
      await loc.click({ force: true, noWaitAfter: true, timeout: 5000 });
    },
    tab(es, en) {
      return v.tap(page.locator(`nav.tabbar button:has-text("${W(es, en)}")`));
    },
    text(es, en, exact = false) {
      return page.getByText(W(es, en), { exact });
    },
    // Scroll suave de la pantalla visible, movido por el reloj virtual.
    async scroll(top, ms = 900) {
      await page.evaluate(([top, ms]) => {
        const l = [...document.querySelectorAll(".layer")].filter((x) => !x.hidden).pop();
        const from = l.scrollTop;
        const t0 = performance.now();
        const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / ms);
          l.scrollTop = from + (top - from) * ease(k);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, [top, ms]);
    },
    page,
  };
  return v;
}

async function toma(browser, base, L, nombre, esc, seed, dir) {
  const ctx = await browser.newContext({ viewport: { width: 390 * ZOOM, height: 844 * ZOOM }, deviceScaleFactor: 1, locale: L === "es" ? "es-UY" : "en-US" });
  await ctx.addInitScript(`window.__V_EPOCH = ${Date.UTC(2026, 10, 20, 15, 0, 0)};`);
  await ctx.addInitScript(reloj);
  await ctx.addInitScript(azar(seed));
  await ctx.addInitScript(`localStorage.setItem("ventaja21.state.v1", ${JSON.stringify(JSON.stringify(esc.estado ? esc.estado(estado) : estado))}); localStorage.setItem("edge21.lang", ${JSON.stringify(L)});`);
  await ctx.addInitScript(`document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = ":root{--safe-t:47px!important;--safe-b:34px!important} html{zoom:${ZOOM}} .__tap{position:fixed;z-index:9999;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.28);box-shadow:0 0 0 3px rgba(255,255,255,.75);pointer-events:none;animation:__tap .5s cubic-bezier(.2,.8,.2,1) forwards}@keyframes __tap{0%{transform:scale(.3);opacity:0}25%{transform:scale(.8);opacity:1}100%{transform:scale(1.25);opacity:0}}"; document.head.appendChild(s); });`);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(base + "/index.html");
  await page.waitForLoadState("load");
  await page.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(page);
  // Arranque sin grabar: la app se acomoda y prepara las pestañas.
  const prep = director(page, cdp, null, L);
  await prep.wait(esc.arranque || 3000);
  const v = director(page, cdp, dir, L);
  let ok = true;
  try {
    ok = (await esc.run(v)) !== false;
  } catch (e) {
    ok = false;
    errs.push(String(e).split("\n")[0]);
  }
  await ctx.close();
  if (errs.length) console.log(`  ${nombre} (semilla ${seed}):`, errs.join(" | "));
  return { ok, frames: v.t };
}

(async () => {
  const [L = "es", ...pedidas] = process.argv.slice(2);
  const srv = await servidor();
  const base = `http://localhost:${srv.address().port}`;
  const browser = await chromium.launch();
  for (const [nombre, esc] of Object.entries(ESCENAS)) {
    if (pedidas.length && !pedidas.includes(nombre)) continue;
    // Ensayos sin fotos hasta encontrar una semilla en la que la escena sale bien.
    let seed = esc.semilla || 5;
    if (esc.probar) while (!(await toma(browser, base, L, nombre, esc, seed, null)).ok && seed < 60) seed++;
    const dir = path.join(OUT, `${L}-${nombre}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const t0 = Date.now();
    const r = await toma(browser, base, L, nombre, esc, seed, dir);
    console.log(`${L}-${nombre}: ${r.frames.toFixed(2)} s, semilla ${seed}, ${((Date.now() - t0) / 1000).toFixed(0)} s de grabación${r.ok ? "" : " (SALIÓ MAL)"}`);
  }
  await browser.close();
  srv.close();
})();
