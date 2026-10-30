// Fondos, títulos y la cuenta regresiva de los videos (ver README.md).
// Uso: node tools/video/fondos.cjs <es|en>  → tools/video/salida/piezas-<idioma>/
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const L = process.argv[2] || "es";
const OUT = path.join(__dirname, "salida", `piezas-${L}`);
const FPS = 60;
const T = {
  es: {
    v: {
      quiz: ["¿Sabés jugar <em>esta mano</em>?", "Pensala antes de que termine la cuenta"],
      count: ["Así se <em>cuentan cartas</em>", "Bajas +1 · del 7 al 9, 0 · altas −1"],
      table: ["Un casino <em>en tu bolsillo</em>", "Practicá contar y apostar sin arriesgar nada"],
    },
    h: {
      learn: ["Aprendé <em>paso a paso</em>", "Lecciones cortas con una mesa narrada"],
      train: ["La jugada <em>correcta</em>", "En cada mano, con el porqué"],
      count: ["Contá cartas <em>de verdad</em>", "Una ruta de 10 niveles"],
      table: ["Un casino <em>en tu mano</em>", "Jugá, contá y apostá con el conteo"],
      progress: ["Mirá cómo <em>mejorás</em>", "Tu rango, tu semana y tus logros"],
    },
    cta: "Edge 21 · gratis en Google Play",
    end: "Gratis en Google Play",
    think: "Elegí tu jugada",
    time: "¡Tiempo!",
  },
  en: {
    v: {
      quiz: ["Can you play <em>this hand</em>?", "Decide before the countdown ends"],
      count: ["How to <em>count cards</em>", "Low +1 · 7 to 9, 0 · high −1"],
      table: ["A casino <em>in your pocket</em>", "Practice counting and betting risk-free"],
    },
    h: {
      learn: ["Learn <em>step by step</em>", "Short lessons at a narrated table"],
      train: ["The <em>right play</em>", "On every hand, with the why"],
      count: ["Count cards <em>for real</em>", "A 10-level path"],
      table: ["A casino <em>in your pocket</em>", "Play, count and bet with the count"],
      progress: ["Watch yourself <em>improve</em>", "Your rank, your week and achievements"],
    },
    cta: "Edge 21 · free on Google Play",
    end: "Free on Google Play",
    think: "Pick your play",
    time: "Time!",
  },
}[L];
const FONT = `@font-face{font-family:DM;src:url(${path.join(__dirname, "DMSans-latin-400-800.woff2")});font-weight:400 800}*{margin:0;box-sizing:border-box}body{font-family:DM;color:#f3efe2}`;
const CHIP = `<img src="${path.resolve(__dirname, "../../sitio/img/ficha.svg")}">`;
const FELT_V = "radial-gradient(110% 70% at 50% 10%,#17603f 0%,#0a2c1c 55%,#04100a 100%)";
const FELT_H = "radial-gradient(80% 110% at 30% 30%,#17603f 0%,#0a2c1c 55%,#04100a 100%)";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const shot = async (w, h, body, file, transparent = false) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const f = path.join(OUT, "tmp.html");
    fs.writeFileSync(f, `<meta charset="utf-8"><style>${FONT}html,body{width:${w}px;height:${h}px;overflow:hidden;position:relative;background:transparent}</style>${body}`);
    await p.goto("file://" + f);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(100);
    await p.screenshot({ path: path.join(OUT, file), omitBackground: transparent });
    await p.close();
  };

  // ---- Vertical (1080x1920) ----
  await shot(1080, 1920, `<style>body{background:${FELT_V}!important}body:before{content:"";position:absolute;inset:24px;border:3px dashed rgba(233,185,73,.25);border-radius:44px}
.cta{position:absolute;left:0;right:0;bottom:70px;display:flex;justify-content:center;align-items:center;gap:18px;font-size:44px;font-weight:800}.cta img{width:72px;height:72px}</style><div class="cta">${CHIP}${T.cta}</div>`, "v-fondo.png");
  for (const [k, [h, s]] of Object.entries(T.v))
    await shot(1080, 300, `<style>.t{position:absolute;left:70px;right:70px;top:0;text-align:center}h1{font-size:84px;line-height:1.04;font-weight:800;letter-spacing:-2px}h1 em{font-style:normal;color:#e9b949}p{font-size:40px;color:#b7c9bd;margin-top:20px}</style><div class="t"><h1>${h}</h1><p>${s}</p></div>`, `v-titulo-${k}.png`, true);
  // El marco dorado del celular, con sombra (margen de 80 px alrededor).
  await shot(754, 1426, `<div style="position:absolute;left:80px;top:80px;width:594px;height:1266px;border-radius:56px;background:#e9b949;box-shadow:0 40px 100px rgba(0,0,0,.55)"></div>`, "v-marco.png", true);
  await shot(578, 1250, `<div style="width:578px;height:1250px;border-radius:46px;background:#fff"></div><style>body{background:#000!important}</style>`, "v-mascara.png");

  // La cuenta regresiva: una pastilla arriba del celular que no tapa nada de la app.
  const cdDir = path.join(OUT, "cuenta");
  fs.rmSync(cdDir, { recursive: true, force: true });
  fs.mkdirSync(cdDir);
  {
    const p = await b.newPage({ viewport: { width: 620, height: 150 } });
    const f = path.join(OUT, "cuenta.html");
    fs.writeFileSync(f, `<meta charset="utf-8"><style>${FONT}html,body{width:620px;height:150px;background:transparent;overflow:hidden}
.pill{position:absolute;left:10px;top:10px;width:600px;height:130px;border-radius:65px;background:rgba(6,24,15,.92);box-shadow:0 0 0 3px rgba(233,185,73,.55),0 18px 40px rgba(0,0,0,.45);display:flex;align-items:center;padding:0 34px 0 14px;gap:22px}
.ring{position:relative;width:102px;height:102px;flex:none}.ring svg{position:absolute;inset:0;transform:rotate(-90deg)}
.n{position:absolute;inset:0;display:grid;place-items:center;font-size:58px;font-weight:800;color:#e9b949}
.txt{flex:1;font-size:40px;font-weight:800}.bar{height:10px;border-radius:5px;background:rgba(255,255,255,.12);margin-top:14px;overflow:hidden}.bar i{display:block;height:100%;background:#e9b949;transform-origin:left center;border-radius:5px}
.done .txt{color:#e9b949}</style>
<div class="pill" id="pill"><div class="ring"><svg viewBox="0 0 102 102"><circle cx="51" cy="51" r="44" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="9"/><circle id="arc" cx="51" cy="51" r="44" fill="none" stroke="#e9b949" stroke-width="9" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100"/></svg><div class="n" id="n">3</div></div><div class="txt"><span id="t">${T.think}</span><div class="bar"><i id="bar"></i></div></div></div>
<script>window.set=(k,secs)=>{const left=Math.max(0,1-k);const arc=document.getElementById("arc");arc.setAttribute("stroke-dasharray",(left*100)+" 100");arc.style.opacity=left>0.004?1:0;document.getElementById("bar").style.transform="scaleX("+left+")";const n=Math.ceil(left*secs-1e-6);document.getElementById("n").textContent=n>0?n:"✓";document.getElementById("t").textContent=n>0?${JSON.stringify(T.think)}:${JSON.stringify(T.time)};document.getElementById("pill").className="pill"+(n>0?"":" done");const fr=(left*secs)%1;document.getElementById("n").style.transform=n>0?"scale("+(1+0.22*Math.max(0,(fr-0.8)/0.2))+")":"scale(1.1)";}</script>`);
    await p.goto("file://" + f);
    await p.evaluate(() => document.fonts.ready);
    const secs = 3;
    const total = secs * FPS + Math.round(0.45 * FPS);
    for (let i = 0; i < total; i++) {
      await p.evaluate(([k, s]) => window.set(k, s), [i / (secs * FPS), secs]);
      await p.screenshot({ path: path.join(cdDir, `c${String(i).padStart(4, "0")}.png`), omitBackground: true });
    }
    await p.close();
  }

  // ---- Horizontal (1920x1080), para la tienda ----
  for (const [k, [h, s]] of Object.entries(T.h))
    await shot(1920, 1080, `<style>body{background:${FELT_H}!important}body:before{content:"";position:absolute;inset:26px;border:3px dashed rgba(233,185,73,.25);border-radius:40px}
.t{position:absolute;left:150px;top:340px;width:1000px}h1{font-size:104px;line-height:1.02;font-weight:800;letter-spacing:-3px}h1 em{font-style:normal;color:#e9b949}p{font-size:46px;color:#b7c9bd;margin-top:28px}
.logo{position:absolute;left:150px;top:150px;display:flex;align-items:center;gap:18px;font-size:44px;font-weight:800}.logo img{width:70px;height:70px}
.slot{position:absolute;left:1324px;top:52px;width:460px;height:976px;border-radius:52px;background:#e9b949;box-shadow:0 40px 100px rgba(0,0,0,.55)}</style><div class="logo">${CHIP}Edge 21</div><div class="t"><h1>${h}</h1><p>${s}</p></div><div class="slot"></div>`, `h-${k}.png`);
  await shot(1920, 1080, `<style>body{background:${FELT_H}!important}body:before{content:"";position:absolute;inset:26px;border:3px dashed rgba(233,185,73,.25);border-radius:40px}
.c{position:absolute;left:50%;top:170px;width:420px;height:420px;margin-left:-210px;filter:drop-shadow(0 30px 60px rgba(0,0,0,.5))}.c img{width:100%}h1{position:absolute;top:620px;width:100%;text-align:center;font-size:130px;font-weight:800;letter-spacing:-4px}p{position:absolute;top:800px;width:100%;text-align:center;font-size:54px;color:#e9b949;font-weight:700}</style><div class="c">${CHIP}</div><h1>Edge 21</h1><p>${T.end}</p>`, "h-fin.png");
  await shot(444, 960, `<div style="width:444px;height:960px;border-radius:36px;background:#fff"></div><style>body{background:#000!important}</style>`, "h-mascara.png");
  fs.rmSync(path.join(OUT, "tmp.html"), { force: true });
  await b.close();
  console.log("piezas listas en", OUT);
})();
