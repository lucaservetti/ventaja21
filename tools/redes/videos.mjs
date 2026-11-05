// Videos cortos para TikTok, Reels y Shorts (1080×1920, 30 cuadros por segundo), animados con CSS y
// grabados cuadro por cuadro: cada cuadro se dibuja con todas las animaciones congeladas en su tiempo
// exacto, así salen perfectos aunque la compu sea lenta. Los textos son aptos para TikTok (sin
// "casino", "apuesta" ni "plata"): el mismo video sirve para las tres redes.
// Uso: node tools/redes/videos.mjs [semana-2] [nombre-del-video]
//   → store/redes/semana-2/<video>/<video>.mp4 y portada.png
// Hace falta Playwright (con Chromium) y ffmpeg.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VIDEOS } from "./guiones.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SEMANA = process.argv[2] || "semana-2";
const SOLO = process.argv[3] || null;
const FPS = 30;
const W = 1080;
const H = 1920;

const types = { ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp" };
let pagina = "";
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/video.html") return res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(pagina);
  fs.readFile(path.join(ROOT, p), (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }).end(d)));
});
await new Promise((ok) => srv.listen(0, ok));
const base = `http://localhost:${srv.address().port}`;

const CSS = `
@font-face{font-family:DM;src:url(/app/fonts/DMSans-latin-400-800.woff2);font-weight:400 800}
*{margin:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:DM;color:#f3efe2;position:relative;background:radial-gradient(120% 70% at 30% 0%,#17603f 0%,#0a2c1c 55%,#04100a 100%)}
body:before{content:"";position:absolute;inset:26px;border:3px dashed rgba(233,185,73,.25);border-radius:44px}
.marca{position:absolute;left:90px;top:150px;display:flex;align-items:center;gap:16px;font-size:32px;font-weight:700;color:#cfdcd2}
.marca img{width:58px;height:58px}
.serie{margin-left:auto;font-size:28px;color:#e9b949;font-weight:800;letter-spacing:.04em}
.zona{position:absolute;left:80px;right:130px;top:250px;bottom:420px}
.capa{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;text-align:center}
.pie{position:absolute;left:90px;right:150px;bottom:360px;text-align:center;font-size:26px;color:#9fb3a6;font-weight:700}
h1{font-size:106px;line-height:1.02;font-weight:800;letter-spacing:-2px}
h1.xl{font-size:130px}
h2{font-size:76px;line-height:1.06;font-weight:800;letter-spacing:-1px}
em{font-style:normal;color:#e9b949}
p{font-size:46px;line-height:1.28;color:#cfdcd2}
p b{color:#f3efe2}
.tag{display:inline-block;padding:12px 28px;border-radius:999px;background:#e9b949;color:#1d1405;font-size:32px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.tag.rojo{background:#d9483b;color:#fff}.tag.verde{background:#2fa36b;color:#fff}
.fila{display:flex;gap:22px;align-items:center;justify-content:center}
.carta{position:relative;background:#fbfaf5;border-radius:16px;color:#17140c;box-shadow:0 16px 34px rgba(0,0,0,.5);flex:none}
.carta.roja{color:#c8322b}
.carta b{position:absolute;left:10%;top:4%;font-weight:800;line-height:1}
.carta .p1{position:absolute;left:10%;top:31%;display:flex}
.carta .p2{position:absolute;right:9%;bottom:7%;display:flex}
.carta.dorso{background:repeating-linear-gradient(135deg,#0d261a 0 9px,#fbfaf5 9px 15px);border:9px solid #fbfaf5}
.lbl{font-size:30px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#9fb3a6}
.mano{display:flex;flex-direction:column;align-items:center;gap:18px}
.total{font-size:44px;font-weight:800;padding:6px 26px;border-radius:999px;background:rgba(0,0,0,.35)}
.ops{display:flex;gap:26px}
.op{padding:30px 50px;border-radius:28px;font-size:54px;font-weight:800;background:rgba(6,17,12,.6);border:3px solid rgba(233,185,73,.35)}
.op.ok{background:#2fa36b;border-color:#2fa36b;color:#fff}
.op.no{opacity:.35}
.cuenta{font-size:240px;font-weight:800;color:#e9b949;line-height:1}
.barra{position:absolute;left:0;right:0;top:-40px;height:12px;border-radius:12px;background:rgba(255,255,255,.12);overflow:hidden}
.barra i{display:block;height:100%;background:#e9b949;transform-origin:left}
.caja{padding:30px 40px;border-radius:30px;background:rgba(6,17,12,.62);border:2px solid rgba(233,185,73,.3);text-align:left}
.caja p{font-size:44px}
.lista{display:flex;flex-direction:column;gap:22px;width:100%}
.item{display:flex;gap:24px;align-items:flex-start;text-align:left;padding:24px 30px;border-radius:26px;background:rgba(6,17,12,.55);border:2px solid rgba(255,255,255,.06)}
.item b{font-size:46px;color:#e9b949;flex:none}
.item span{font-size:44px;line-height:1.25}
.sello{font-size:150px;font-weight:800;letter-spacing:4px;padding:10px 50px;border:12px solid currentColor;border-radius:30px;transform:rotate(-8deg)}
.sello.mito{color:#ff6b5c}.sello.real{color:#46c47f}
.bars{display:flex;flex-direction:column;gap:16px;width:100%}
.bar{display:grid;grid-template-columns:110px 1fr 130px;align-items:center;gap:20px;font-size:40px;font-weight:800}
.bar .t{height:46px;border-radius:12px;background:rgba(255,255,255,.08);overflow:hidden}
.bar .t i{display:block;height:100%;border-radius:12px;transform-origin:left}
.v{font-size:58px;font-weight:800}
.mas{color:#46c47f}.cero{color:#cfdcd2}.menos{color:#ff7a6b}
.cta{display:inline-flex;align-items:center;gap:16px;padding:28px 48px;border-radius:999px;background:#e9b949;color:#1d1405;font-size:50px;font-weight:800;box-shadow:0 8px 0 #8f6a17}
.logo{width:220px;height:220px;filter:drop-shadow(0 24px 50px rgba(0,0,0,.5))}
.chico{font-size:32px;color:#9fb3a6}
/* Animaciones (la grabación las congela en cada cuadro). */
@keyframes entra{from{opacity:0;transform:translateY(60px) scale(.94)}to{opacity:1;transform:none}}
@keyframes sale{from{opacity:1}to{opacity:0;visibility:hidden}}
@keyframes pop{0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
@keyframes carta{from{opacity:0;transform:translateY(-500px) rotate(-25deg) scale(.8)}to{opacity:1;transform:none}}
@keyframes sello{0%{opacity:0;transform:rotate(-8deg) scale(2.4)}60%{opacity:1;transform:rotate(-8deg) scale(.92)}100%{opacity:1;transform:rotate(-8deg) scale(1)}}
@keyframes crece{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes achica{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes flash{0%,100%{opacity:0}10%,80%{opacity:1}}
@keyframes ok{0%{transform:scale(1)}50%{transform:scale(1.12)}100%{transform:scale(1)}}
@keyframes apaga{to{opacity:.3}}
`;

function pagina1(v) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="marca"><img src="/img/ficha.svg">@edge21.app<span class="serie">${v.serie || ""}</span></div>
<div class="zona">${v.html}</div>
<div class="pie">Edge 21 · contenido educativo, sin dinero</div>
</body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const lista = Object.entries(VIDEOS).filter(([k]) => !SOLO || k === SOLO);
for (const [nombre, v] of lista) {
  const dir = path.join(ROOT, "store/redes", SEMANA, nombre);
  const frames = path.join(ROOT, "tools/video/salida", `red-${nombre}`);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
  pagina = pagina1(v);
  await page.goto(`${base}/video.html`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const total = Math.round(v.dur * FPS);
  for (let f = 0; f < total; f++) {
    const t = (f / FPS) * 1000;
    await page.evaluate((ms) => {
      for (const a of document.getAnimations()) {
        a.pause();
        a.currentTime = ms;
      }
    }, t);
    await page.screenshot({ path: path.join(frames, `${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
  }
  // Portada: el cuadro del gancho (el que se ve en el perfil).
  await page.evaluate((ms) => {
    for (const a of document.getAnimations()) a.currentTime = ms;
  }, (v.portada ?? 1.2) * 1000);
  await page.screenshot({ path: path.join(dir, "portada.png") });
  const mp4 = path.join(dir, `${nombre}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(frames, "%05d.jpg"), "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "medium", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", mp4]);
  console.log(`✓ ${nombre} · ${v.dur} s → ${path.relative(ROOT, mp4)}`);
}
await browser.close();
srv.close();
