// Arma img/og.jpg (1200x630): la imagen que aparece al compartir edge21.app en WhatsApp o redes.
// Uso: node tools/imagen-compartir.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const u = (p) => "file://" + path.join(ROOT, p);
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:DM;src:url(${u("app/fonts/DMSans-latin-400-800.woff2")});font-weight:400 800}
@font-face{font-family:Os;src:url(${u("app/fonts/Oswald-latin-600.woff2")});font-weight:600}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;position:relative;font-family:DM;color:#f3efe2;background:radial-gradient(80% 120% at 25% 20%,#1a6b46 0%,#0b2f1e 55%,#05120c 100%)}
body:before{content:"";position:absolute;inset:18px;border:2px dashed rgba(233,185,73,.28);border-radius:30px}
.l{position:absolute;left:78px;top:92px;width:600px}
.brand{display:flex;align-items:center;gap:16px;font-weight:800;font-size:34px}.brand img{width:64px;height:64px}
h1{font-size:68px;line-height:1.02;letter-spacing:-2px;margin:34px 0 18px;font-weight:800}h1 em{font-style:normal;color:#e9b949}
p{font-size:28px;color:#b7c9bd;line-height:1.35}
.tags{display:flex;gap:12px;margin-top:30px}.tags span{border:1.5px solid rgba(233,185,73,.55);color:#e9b949;border-radius:999px;padding:8px 18px;font-weight:800;font-size:20px}
.ph{position:absolute;width:236px;border-radius:30px;border:6px solid #e9b949;box-shadow:0 30px 70px rgba(0,0,0,.6)}
.a{right:250px;top:110px;transform:rotate(-7deg)}.b{right:60px;top:60px;transform:rotate(6deg)}
</style>
<div class="l"><div class="brand"><img src="${u("img/ficha.svg")}">Edge 21</div>
<h1>Aprendé blackjack y a <em>contar cartas</em></h1>
<p>Lecciones cortas, ejercicios y un casino para practicar. Sin plata real.</p>
<div class="tags"><span>Gratis</span><span>Español · English</span><span>edge21.app</span></div></div>
<img class="ph a" src="${u("img/mano-es.webp")}"><img class="ph b" src="${u("img/mesa-es.webp")}">`;
const f = path.join(ROOT, "tools/.og.html");
fs.writeFileSync(f, html);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto("file://" + f);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(ROOT, "img/og.jpg"), type: "jpeg", quality: 88 });
await b.close();
fs.rmSync(f);
console.log("img/og.jpg");
