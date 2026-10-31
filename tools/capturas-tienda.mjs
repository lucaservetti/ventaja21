// Capturas de la tienda (store/capturas y store/capturas-en, 1080×1920) y el gráfico destacado
// (1024×500), desde la app actual: saca cada pantalla con datos de ejemplo y le pone el marco de
// Edge 21 (paño verde, borde dorado, título y la ficha).
// Uso: npm run build && node tools/capturas-tienda.mjs
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP = fs.mkdtempSync(path.join(ROOT, "tools/.tienda-"));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = p.startsWith("/_tmp/") ? path.join(TMP, p.slice(6)) : path.join(ROOT, p);
  fs.readFile(f, (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }).end(d)));
});
await new Promise((ok) => srv.listen(0, ok));
const base = `http://localhost:${srv.address().port}`;

// Datos de ejemplo: alguien que viene usando la app hace una semana.
const DAY = 864e5;
const today = new Date();
const key = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const days = {};
const activity = {};
[720, 900, 600, 1080, 540, 840, 660, 960].forEach((s, i) => {
  days[key(today - i * DAY)] = { s, g: 600 };
  activity[key(today - i * DAY)] = true;
});
// Tabla de errores: casi todo bien, algunas casillas flojas (las clásicas).
let seed = 11;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
const UPS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "A"];
const weak = new Set(["H16|T", "H16|9", "H12|2", "H12|3", "H13|2", "S18|9", "S18|T", "S17|2", "P9|7", "P4|5", "H11|A", "H10|T", "S13|5", "P2|2", "P3|8"]);
const cells = {};
const rowKeys = [...Array.from({ length: 15 }, (_, i) => `H${i + 5}`), ...[13, 14, 15, 16, 17, 18, 19, 20].map((n) => `S${n}`), ...["2", "3", "4", "5", "6", "7", "8", "9", "T", "A"].map((n) => `P${n}`)];
for (const k of rowKeys)
  for (const u of UPS) {
    if (rnd() < 0.12) continue;
    const c = `${k}|${u}`;
    const p = weak.has(c) ? 0.4 + rnd() * 0.35 : 0.97 + rnd() * 0.03;
    const recent = Array.from({ length: 10 }, () => (rnd() < p ? 1 : 0));
    const n = 6 + Math.floor(rnd() * 10);
    cells[c] = { n, ok: Math.round(n * p), recent };
  }
const lessons = Object.fromEntries(["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9", "l10", "l11", "l12", "lt"].map((l) => [l, { done: true, at: today - 3 * DAY }]));
const session = (i) => ({ kind: "mixed", title: "Tanda mezclada", n: 10, ok: 9, before: 1100, after: 1130, t: today - i * DAY, ms: 60000, misses: [], missHands: [] });
const STATE = (extra = {}) => ({
  v: 1,
  profile: { onboarded: true, experience: "rules", goal: "casino", startSection: 1, createdAt: today - 30 * DAY },
  dailyGoal: { minutes: 10, chosen: true, days, celebrated: key(today) },
  lessons,
  activity,
  train: { sessions: Array.from({ length: 6 }, (_, i) => session(i)), totalHands: 340, totalOk: 300, longestStreak: 18, cells, mistakes: [], exams: [] },
  countPath: { passed: { values: { at: 1, score: 1 }, pairs: { at: 1, score: 1 }, run10: { at: 1, score: 1 } }, tries: {}, practiced: {} },
  rating: { value: 1180, peak: 1210, history: [] },
  lastTab: "aprender",
  ...extra,
  settings: { currency: "USD", premium: true, ...(extra.settings || {}) },
});

const L = (lang, es, en) => (lang === "es" ? es : en);
const tab = async (p, name) => {
  await p.locator(`nav.tabbar button:has-text("${name}")`).first().click();
  await p.waitForTimeout(600);
};
// Cada captura: título, subtítulo, cómo llegar y datos.
const CAPTURAS = [
  {
    t: ["Aprendé <em>blackjack</em>", "Learn <em>blackjack</em>"],
    s: ["paso a paso, con lecciones cortas", "step by step, in short lessons"],
    // A mitad de la sección 1, para que se vea el camino de fichas.
    data: { lessons: Object.fromEntries(["l1", "l2", "l3"].map((l) => [l, { done: true, at: today - DAY }])) },
    go: async (p, l) => tab(p, L(l, "Aprender", "Learn")),
  },
  {
    t: ["La jugada <em>correcta</em>", "The <em>right play</em>"],
    s: ["en cada mano, con el porqué", "on every hand, with the why"],
    go: async (p, l) => {
      await tab(p, L(l, "Entrenar", "Train"));
      await p.getByText(L(l, "Repartir 10 manos", "Deal 10 hands")).first().click();
      await p.waitForTimeout(1300);
    },
  },
  {
    t: ["Aprendé a <em>contar cartas</em>", "Learn to <em>count cards</em>"],
    s: ["una ruta de 10 niveles", "a 10-level path"],
    go: async (p, l) => tab(p, L(l, "Conteo", "Count")),
  },
  {
    t: ["Un casino <em>en tu mano</em>", "A casino <em>in your pocket</em>"],
    s: ["jugá, contá y apostá con el conteo", "play, count and bet with the count"],
    go: async (p, l) => {
      await tab(p, L(l, "Jugar", "Play"));
      await p.locator("section:not([hidden]) .chip-rack .chip").nth(2).click();
      await p.waitForTimeout(200);
      await p.locator(`section:not([hidden]) button:has-text("${L(l, "Repartir", "Deal")}")`).first().click();
      await p.waitForTimeout(3500);
    },
  },
  {
    t: ["Encontrá <em>tus errores</em>", "Find <em>your mistakes</em>"],
    s: ["tu tabla, pintada según cómo jugás", "your chart, colored by how you play"],
    go: async (p, l) => {
      await tab(p, L(l, "Progreso", "Progress"));
      await p.getByText(L(l, "Análisis de tus errores", "Mistake analysis")).first().click();
      await p.waitForTimeout(900);
    },
  },
  {
    t: ["Tu mesa, <em>a tu gusto</em>", "Your table, <em>your style</em>"],
    s: ["paños, dorsos y mazo de 4 colores", "felts, card backs and a 4-color deck"],
    data: { settings: { felt: "azul", cardBack: "oro" } },
    go: async (p, l) => {
      await tab(p, L(l, "Progreso", "Progress"));
      await p.getByRole("button", { name: L(l, "Ajustes", "Settings") }).filter({ visible: true }).first().click();
      await p.waitForTimeout(500);
      await p.getByText(L(l, "Paños y mazos", "Tables and decks")).first().click();
      await p.waitForTimeout(900);
    },
  },
  {
    t: ["Mirá cómo <em>mejorás</em>", "Watch yourself <em>improve</em>"],
    s: ["tu semana, tu rango y tus logros", "your week, your rank and achievements"],
    go: async (p, l) => {
      await tab(p, L(l, "Progreso", "Progress"));
      await p.evaluate(() => document.querySelector("section:not([hidden]) .week-card").scrollIntoView({ block: "start" }));
      await p.waitForTimeout(500);
    },
  },
  {
    t: ["Modo <em>casino real</em>", "Real <em>casino</em> mode"],
    s: ["tu plata, límites de mesa y vigilancia", "your money, table limits and surveillance"],
    go: async (p, l) => {
      await tab(p, L(l, "Jugar", "Play"));
      await p.locator(".casino-ib").first().click();
      await p.waitForTimeout(900);
    },
  },
];

const azar = (s) => `(() => { let s = ${s}; const r = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; }; Math.random = r; if (window.crypto) crypto.getRandomValues = (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(r() * 4294967296); return a; }; })();`;
const css = `@font-face{font-family:DM;src:url(/app/fonts/DMSans-latin-400-800.woff2);font-weight:400 800}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;font-family:DM;color:#f3efe2;position:relative;
background:radial-gradient(110% 70% at 30% 0%,#17603f 0%,#0a2c1c 55%,#04100a 100%)}
body:before{content:"";position:absolute;inset:28px;border:3px dashed rgba(233,185,73,.28);border-radius:48px}
.t{position:absolute;left:96px;right:96px;top:140px}
h1{font-size:88px;line-height:1.02;font-weight:800;letter-spacing:-2px}
h1 em{font-style:normal;color:#e9b949}
p{font-size:42px;color:#b7c9bd;margin-top:22px;line-height:1.25}
.shot{position:absolute;left:150px;top:560px;width:780px;border-radius:52px;border:8px solid #e9b949;
box-shadow:0 50px 120px rgba(0,0,0,.55);transform:rotate(-2.5deg)}
.chip{position:absolute;right:-80px;bottom:-90px;width:300px;height:300px;transform:rotate(18deg)}`;

const browser = await chromium.launch();
const errores = [];
for (const lang of ["es", "en"]) {
  const out = path.join(ROOT, lang === "es" ? "store/capturas" : "store/capturas-en");
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(out)) if (/^\d\d\.png$/.test(f)) fs.rmSync(path.join(out, f));
  for (let i = 0; i < CAPTURAS.length; i++) {
    const c = CAPTURAS[i];
    // La pantalla de la app, en un celular de 360×640 (a 3x).
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: lang === "es" ? "es-UY" : "en-US" });
    await ctx.addInitScript(azar(3 + i * 2));
    await ctx.addInitScript(`if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s", "1"); localStorage.setItem("edge21.lang", "${lang}"); localStorage.setItem("ventaja21.state.v1", ${JSON.stringify(JSON.stringify(STATE(c.data)))}); }`);
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errores.push(`${lang} ${i + 1}: ${e.message}`));
    await p.goto(base + "/app/index.html");
    await p.waitForTimeout(1000);
    try {
      await c.go(p, lang);
    } catch (e) {
      errores.push(`${lang} ${i + 1}: ${String(e).split("\n")[0]}`);
    }
    const shot = `shot-${lang}-${i}.png`;
    await p.screenshot({ path: path.join(TMP, shot) });
    await ctx.close();
    // El marco.
    const fr = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const html = `frame-${lang}-${i}.html`;
    fs.writeFileSync(path.join(TMP, html), `<meta charset="utf-8"><style>${css}</style><div class="t"><h1>${c.t[lang === "es" ? 0 : 1]}</h1><p>${c.s[lang === "es" ? 0 : 1]}</p></div><img class="shot" src="/_tmp/${shot}"><img class="chip" src="/img/ficha.svg">`);
    await fr.goto(`${base}/_tmp/${html}`);
    await fr.waitForTimeout(300);
    await fr.screenshot({ path: path.join(out, `${String(i + 1).padStart(2, "0")}.png`) });
    await fr.close();
  }
  // Gráfico destacado (1024×500).
  const g = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  const [t1, t2] = lang === "es" ? ["Edge 21", "Aprendé a contar cartas<br>en blackjack"] : ["Edge 21", "Learn to count cards<br>at blackjack"];
  const gf = `fg-${lang}.html`;
  fs.writeFileSync(
    path.join(TMP, gf),
    `<meta charset="utf-8"><style>@font-face{font-family:DM;src:url(/app/fonts/DMSans-latin-400-800.woff2);font-weight:400 800}*{margin:0}body{width:1024px;height:500px;overflow:hidden;position:relative;font-family:DM;color:#f3efe2;background:radial-gradient(90% 120% at 25% 40%,#17603f 0%,#0a2c1c 60%,#04100a 100%);display:flex;align-items:center;gap:50px;padding:0 70px}body:before{content:"";position:absolute;inset:16px;border:2px dashed rgba(233,185,73,.3);border-radius:28px}.c{width:270px;height:270px;flex:none;filter:drop-shadow(0 20px 40px rgba(0,0,0,.5))}h1{font-size:100px;font-weight:800;letter-spacing:-3px}p{font-size:38px;color:#e9b949;margin-top:8px;font-weight:600;line-height:1.2}</style><img class="c" src="/img/ficha.svg"><div><h1>${t1}</h1><p>${t2}</p></div>`,
  );
  await g.goto(`${base}/_tmp/${gf}`);
  await g.waitForTimeout(300);
  await g.screenshot({ path: path.join(ROOT, lang === "es" ? "store/grafico-destacado.png" : "store/grafico-destacado-en.png") });
  await g.close();
}
await browser.close();
srv.close();
fs.rmSync(TMP, { recursive: true, force: true });
if (errores.length) {
  console.log("Problemas:\n  " + errores.join("\n  "));
  process.exit(1);
}
console.log(`listo: ${CAPTURAS.length} capturas por idioma y el gráfico destacado`);
