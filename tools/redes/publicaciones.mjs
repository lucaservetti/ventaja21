// Imágenes para las redes: carruseles (Instagram 1080×1350 y TikTok 1080×1920) y portadas de los
// videos (1080×1920), con la identidad de Edge 21. Los textos para copiar están en
// store/redes/semana-1/PLAN.md.
// Uso: node tools/redes/publicaciones.mjs   → store/redes/semana-1/
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "store/redes/semana-1");
const types = { ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png" };
let pagina = "";
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/slide.html") return res.writeHead(200, { "content-type": types[".html"] }).end(pagina);
  fs.readFile(path.join(ROOT, p), (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }).end(d)));
});
await new Promise((ok) => srv.listen(0, ok));
const base = `http://localhost:${srv.address().port}`;

// ---- Piezas ----
const SUIT = {
  s: '<path d="M12 2C9 6 3 9 3 14c0 3 2.5 5 5 5 1.5 0 2.7-.6 3.3-1.5L10 22h4l-1.3-4.5c.6.9 1.8 1.5 3.3 1.5 2.5 0 5-2 5-5 0-5-6-8-9-12z"/>',
  h: '<path d="M12 21.5s-7.5-4.6-9.8-9.3C.4 8.3 2.8 4 6.7 4c2.4 0 4 1.4 5.3 3.3C13.3 5.4 14.9 4 17.3 4c3.9 0 6.3 4.3 4.5 8.2C19.5 16.9 12 21.5 12 21.5z"/>',
  d: '<path d="M12 1.5 21 12l-9 10.5L3 12z"/>',
  c: '<circle cx="12" cy="6.8" r="4.4"/><circle cx="6.6" cy="13.2" r="4.4"/><circle cx="17.4" cy="13.2" r="4.4"/><path d="M10.6 13h2.8l1.6 9H9z"/>',
};
const suit = (s, size) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor">${SUIT[s]}</svg>`;
// Una carta: "10s", "Ah", "5d"…; tam = ancho en px.
function carta(c, tam = 150, extra = "") {
  const r = c.slice(0, -1);
  const s = c.slice(-1);
  const rojo = s === "h" || s === "d";
  return `<div class="carta${rojo ? " roja" : ""}" style="width:${tam}px;height:${tam * 1.4}px;${extra}"><b style="font-size:${tam * 0.36}px">${r}</b><span class="p1">${suit(s, tam * 0.24)}</span><span class="p2">${suit(s, tam * 0.5)}</span></div>`;
}
const dorso = (tam = 150) => `<div class="carta dorso" style="width:${tam}px;height:${tam * 1.4}px"></div>`;
const tel = (img, w = 470) => `<div class="tel" style="width:${w}px"><img src="/img/${img}"></div>`;

const CSS = (W, H, tiktok) => `
@font-face{font-family:DM;src:url(/app/fonts/DMSans-latin-400-800.woff2);font-weight:400 800}
*{margin:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:DM;color:#f3efe2;position:relative;background:radial-gradient(120% 75% at 30% 0%,#17603f 0%,#0a2c1c 55%,#04100a 100%)}
body:before{content:"";position:absolute;inset:26px;border:3px dashed rgba(233,185,73,.28);border-radius:44px;pointer-events:none}
.top{position:absolute;left:70px;right:70px;top:${tiktok ? 150 : 64}px;display:flex;align-items:center;gap:16px;font-size:30px;font-weight:700;color:#cfdcd2}
.top img{width:54px;height:54px}.top .n{margin-left:auto;font-size:28px;color:#e9b949;font-weight:800}
.main{position:absolute;left:84px;right:${tiktok ? 150 : 84}px;top:${tiktok ? 250 : 150}px;bottom:${tiktok ? 430 : 110}px;display:flex;flex-direction:column;justify-content:center;gap:34px}
.c{align-items:center;text-align:center}
h1{font-size:84px;line-height:1.04;font-weight:800;letter-spacing:-2px}
h1.xl{font-size:104px}
h2{font-size:60px;line-height:1.08;font-weight:800;letter-spacing:-1px}
em{font-style:normal;color:#e9b949}
p{font-size:40px;line-height:1.3;color:#cfdcd2}
p b{color:#f3efe2}
.tag{display:inline-block;align-self:flex-start;padding:10px 24px;border-radius:999px;background:#e9b949;color:#1d1405;font-size:30px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.c .tag{align-self:center}
.tag.mal{background:#d9483b;color:#fff}
.fila{display:flex;gap:22px;align-items:center}
.c .fila{justify-content:center}
.carta{position:relative;background:#fbfaf5;border-radius:14px;color:#17140c;box-shadow:0 14px 30px rgba(0,0,0,.45);flex:none}
.carta.roja{color:#c8322b}
.carta b{position:absolute;left:10%;top:4%;font-weight:800;line-height:1}
.carta .p1{position:absolute;left:10%;top:31%;display:flex}
.carta .p2{position:absolute;right:9%;bottom:7%;display:flex}
.carta.dorso{background:repeating-linear-gradient(135deg,#0d261a 0 9px,#fbfaf5 9px 15px);border:8px solid #fbfaf5}
.val{display:flex;flex-direction:column;align-items:center;gap:14px}
.val i{font-style:normal;font-size:46px;font-weight:800;padding:6px 22px;border-radius:999px;background:rgba(255,255,255,.08)}
.mas{color:#46c47f}.cero{color:#cfdcd2}.menos{color:#ff7a6b}
.grupo{display:flex;align-items:center;gap:30px;padding:26px 30px;border-radius:30px;background:rgba(6,17,12,.55);border:2px solid rgba(233,185,73,.25)}
.grupo .fila{gap:12px}
.grupo .v{margin-left:auto;font-size:64px;font-weight:800}
.tel{border-radius:46px;border:8px solid #e9b949;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.55);background:#06110c;flex:none}
.tel img{display:block;width:100%}
.lado{display:flex;gap:56px;align-items:center}
.lado>div{flex:1;display:flex;flex-direction:column;gap:26px}
.caja{padding:30px 36px;border-radius:30px;background:rgba(6,17,12,.6);border:2px solid rgba(233,185,73,.3)}
.caja p{font-size:38px}
.cta{display:inline-flex;align-self:center;align-items:center;gap:16px;padding:26px 44px;border-radius:999px;background:#e9b949;color:#1d1405;font-size:46px;font-weight:800;box-shadow:0 8px 0 #8f6a17}
.chico{font-size:30px;color:#9fb3a6}
.logo{width:230px;height:230px;filter:drop-shadow(0 24px 50px rgba(0,0,0,.5))}
.swipe{position:absolute;right:${tiktok ? 160 : 80}px;bottom:${tiktok ? 440 : 62}px;font-size:30px;font-weight:800;color:#e9b949}
.badge{position:absolute;left:84px;bottom:${tiktok ? 440 : 62}px;font-size:26px;color:#9fb3a6;font-weight:700}
`;

const ficha = '<img src="/img/ficha.svg">';
const cta = (frase = "Probala gratis") => `
  <img class="logo" src="/img/ficha.svg">
  <h1>${frase}</h1>
  <p>Edge 21: lecciones, desafío diario y un casino de práctica. <b>Sin plata real.</b></p>
  <div class="cta">edge21.app</div>
  <p class="chico">Link en el perfil · Seguinos para un tip por día</p>`;

// ---- Carruseles ----
const CARRUSELES = {
  "1-presentacion": [
    `<div class="main c">
      <img class="logo" src="/img/ficha.svg">
      <h1 class="xl">Hice una app para aprender a <em>contar cartas</em></h1>
      <p>Me obsesioné con la matemática del blackjack y armé la app que me hubiera gustado tener: <b>Edge 21</b>.</p>
    </div>`,
    `<div class="main"><div class="lado">${tel("aprender-es.webp", 430)}<div>
      <span class="tag">Aprender</span>
      <h2>36 lecciones <em>cortas</em></h2>
      <p>Jugás cada mano en una mesa que te explica <b>por qué</b> se hace cada jugada.</p>
    </div></div></div>`,
    `<div class="main"><div class="lado">${tel("conteo-es.webp", 430)}<div>
      <span class="tag">Conteo</span>
      <h2>Contar cartas en <em>10 niveles</em></h2>
      <p>De los valores de las cartas a contar un zapato entero. Con práctica guiada.</p>
    </div></div></div>`,
    `<div class="main"><div class="lado">${tel("mesa-es.webp", 430)}<div>
      <span class="tag">Jugar</span>
      <h2>Un casino <em>de práctica</em></h2>
      <p>Jugá, contá y apostá con el conteo. Con fichas de mentira: <b>no se apuesta plata real</b>.</p>
    </div></div></div>`,
    `<div class="main c">${cta()}</div>`,
  ],
  "3-contar-cartas": [
    `<div class="main c">
      <div class="fila">${carta("5h", 160, "transform:rotate(-8deg)")}${carta("Ks", 160)}${carta("3d", 160, "transform:rotate(8deg)")}</div>
      <h1 class="xl">Contar cartas en <em>3 pasos</em></h1>
      <p>El método <b>Hi-Lo</b>: el más usado en el mundo, y el más fácil para empezar.</p>
    </div>`,
    `<div class="main">
      <span class="tag">Paso 1</span>
      <h2>Cada carta vale <em>+1, 0 o −1</em></h2>
      <div class="grupo"><div class="fila">${["2c", "3h", "4s", "5d", "6c"].map((c) => carta(c, 92)).join("")}</div><span class="v mas">+1</span></div>
      <div class="grupo"><div class="fila">${["7h", "8s", "9d"].map((c) => carta(c, 92)).join("")}</div><span class="v cero">0</span></div>
      <div class="grupo"><div class="fila">${["10s", "Jh", "Qc", "Kd", "As"].map((c) => carta(c, 92)).join("")}</div><span class="v menos">−1</span></div>
    </div>`,
    `<div class="main">
      <span class="tag">Paso 2</span>
      <h2>Sumá <em>mientras salen</em></h2>
      <div class="fila">
        <div class="val">${carta("5h", 130)}<i class="mas">+1</i></div>
        <div class="val">${carta("Ks", 130)}<i class="menos">−1</i></div>
        <div class="val">${carta("3c", 130)}<i class="mas">+1</i></div>
        <div class="val">${carta("6d", 130)}<i class="mas">+1</i></div>
        <div class="val">${carta("9s", 130)}<i class="cero">0</i></div>
      </div>
      <div class="caja"><p>+1 −1 +1 +1 + 0 = <b style="color:#e9b949;font-size:52px">+2</b></p><p class="chico">Ese número es el <b>conteo corrido</b>. Llevás uno solo en la cabeza.</p></div>
    </div>`,
    `<div class="main">
      <span class="tag">Paso 3</span>
      <h2>Dividí por los <em>mazos que faltan</em></h2>
      <div class="caja"><p>Conteo corrido <b>+6</b>, quedan <b>3 mazos</b> por salir:</p><p style="font-size:64px;font-weight:800;color:#e9b949;margin-top:10px">+6 ÷ 3 = +2</p></div>
      <p>Ese es el <b>conteo real</b>. Con muchos mazos, un +6 vale menos que con pocos.</p>
    </div>`,
    `<div class="main">
      <span class="tag">¿Para qué sirve?</span>
      <h2>Conteo alto = <em>quedan cartas altas</em></h2>
      <p>Más dieces y ases en el mazo: más blackjacks y el crupier se pasa más. <b>Ahí conviene apostar más.</b></p>
      <p>Conteo bajo o negativo: <b>apostá lo mínimo</b>.</p>
      <p class="chico">Ojo: da una ventaja chica y a la larga. No hace ganar siempre.</p>
    </div>`,
    `<div class="main c">${cta("Practicalo gratis")}</div>`,
  ],
  "5-mitos": [
    `<div class="main c">
      <div class="fila">${carta("Ah", 150, "transform:rotate(-10deg)")}${carta("Js", 150, "transform:translateY(-20px)")}${carta("10d", 150, "transform:rotate(10deg)")}</div>
      <h1 class="xl">4 mitos sobre <em>contar cartas</em></h1>
      <p>¿Cuántos te creías? Contá en los comentarios 👇</p>
    </div>`,
    `<div class="main">
      <span class="tag mal">Mito 1</span>
      <h2>"Contar cartas <em>es ilegal</em>"</h2>
      <div class="caja"><p><b>Falso.</b> Contar con la cabeza es legal en la mayoría de los lugares.</p></div>
      <p>Lo que sí: el casino puede pedirte que dejes de jugar. Y usar el celular o cualquier aparato en la mesa <b>está prohibido</b>.</p>
    </div>`,
    `<div class="main">
      <span class="tag mal">Mito 2</span>
      <h2>"Hay que memorizar <em>todas las cartas</em>"</h2>
      <div class="caja"><p><b>Falso.</b> Llevás <b>un solo número</b> en la cabeza.</p></div>
      <p>Cada carta suma +1, 0 o −1, y vas actualizando la cuenta. Nada más.</p>
    </div>`,
    `<div class="main">
      <span class="tag mal">Mito 3</span>
      <h2>"Hay que ser <em>un genio</em>"</h2>
      <div class="caja"><p><b>Falso.</b> Es sumar y restar de a uno.</p></div>
      <p>Lo difícil es hacerlo <b>rápido y sin perderte</b>, mientras charlás y jugás. Eso se entrena, como cualquier cosa.</p>
    </div>`,
    `<div class="main">
      <span class="tag mal">Mito 4</span>
      <h2>"Contando, <em>ganás siempre</em>"</h2>
      <div class="caja"><p><b>Falso.</b> Te da una ventaja chica, de alrededor de 1 %, y solo <b>a la larga</b>.</p></div>
      <p>En una noche se puede perder igual. Por eso Edge 21 es para <b>aprender</b>, sin plata real.</p>
    </div>`,
    `<div class="main c">${cta("Aprendelo bien, gratis")}</div>`,
  ],
};

// ---- Portadas de los videos (1080×1920; lo importante queda en el centro, que es lo que se ve en el perfil) ----
const PORTADAS = {
  "2-quiz": `<div class="main c" style="top:300px;bottom:300px;right:84px">
    <span class="tag">Quiz</span>
    <h1 class="xl">¿Sabés jugar <em>esta mano</em>?</h1>
    <div class="fila" style="gap:60px;margin-top:20px">
      <div class="val">${carta("5s", 170)}<i class="cero" style="font-size:36px">Crupier</i></div>
      <div class="val"><div class="fila" style="gap:14px">${carta("10s", 170)}${carta("2s", 170)}</div><i class="cero" style="font-size:36px">Vos: 12</i></div>
    </div>
    <h2 style="margin-top:20px">¿Pedís o <em>te plantás</em>?</h2>
  </div>`,
  "4-contar": `<div class="main c" style="top:300px;bottom:300px;right:84px">
    <span class="tag">Hi-Lo</span>
    <h1 class="xl">Así se <em>cuentan cartas</em></h1>
    <div class="fila" style="gap:34px;margin-top:20px">
      <div class="val">${carta("4c", 170)}<i class="mas">+1</i></div>
      <div class="val">${carta("8h", 170)}<i class="cero">0</i></div>
      <div class="val">${carta("Ad", 170)}<i class="menos">−1</i></div>
    </div>
    <h2 style="margin-top:20px">¿Llegás al final <em>con la cuenta bien</em>?</h2>
  </div>`,
  "6-casino": `<div class="main c" style="top:300px;bottom:300px;right:84px">
    <h1 class="xl">Un casino <em>en tu bolsillo</em></h1>
    ${tel("mesa-es.webp", 470)}
    <h2>Sin plata real</h2>
  </div>`,
  "7-paso-a-paso": `<div class="main c" style="top:300px;bottom:300px;right:84px">
    <h1 class="xl">Blackjack, <em>paso a paso</em></h1>
    ${tel("aprender-es.webp", 470)}
    <h2>36 lecciones <em>cortas</em></h2>
  </div>`,
};

const browser = await chromium.launch();
async function render(W, H, tiktok, body, file, n = "") {
  pagina = `<!doctype html><meta charset="utf-8"><style>${CSS(W, H, tiktok)}</style>
    <div class="top">${ficha}<span>@edge21app</span><span class="n">${n}</span></div>${body}`;
  const p = await browser.newPage({ viewport: { width: W, height: H } });
  await p.goto(`${base}/slide.html`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(150);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await p.screenshot({ path: file });
  await p.close();
}
for (const [k, slides] of Object.entries(CARRUSELES)) {
  for (let i = 0; i < slides.length; i++) {
    const n = `${i + 1}/${slides.length}`;
    const sw = i < slides.length - 1 ? '<div class="swipe">Deslizá →</div>' : "";
    const nombre = `${String(i + 1).padStart(2, "0")}.png`;
    await render(1080, 1350, false, slides[i] + sw, path.join(OUT, k, "instagram", nombre), n);
    await render(1080, 1920, true, slides[i] + sw, path.join(OUT, k, "tiktok", nombre), n);
  }
}
for (const [k, body] of Object.entries(PORTADAS)) await render(1080, 1920, false, body, path.join(OUT, k, "portada.png"));
await browser.close();
srv.close();
console.log("listo:", path.relative(ROOT, OUT));
