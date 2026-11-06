// Motor de los videos cortos (versión 2): piezas animadas con CSS que el grabador (videos.mjs)
// congela cuadro por cuadro a 60 FPS. Cada pieza anota además sus efectos de sonido (sfx), así
// la pista de audio sale sincronizada sola. Los tiempos van en segundos.
//
// Piezas: escena, titulo, parr, punto, carta (repartir, dar vuelta, mover), cuentaAtras,
// votacion (¿mito o verdad?), sello, confeti, numero (cuenta de 0 a N), icono, final.

const SUIT = {
  s: '<path d="M12 1.6C9.4 5.4 3.2 8.6 3.2 13.6c0 2.9 2.3 4.9 4.9 4.9 1.5 0 2.7-.6 3.4-1.6-.2 2-.9 3.6-2.3 5.1h5.6c-1.4-1.5-2.1-3.1-2.3-5.1.7 1 1.9 1.6 3.4 1.6 2.6 0 4.9-2 4.9-4.9 0-5-6.2-8.2-8.8-12z"/>',
  h: '<path d="M12 21.6s-7.6-4.7-9.9-9.4C.3 8.2 2.7 3.9 6.7 3.9c2.4 0 4 1.4 5.3 3.3 1.3-1.9 2.9-3.3 5.3-3.3 4 0 6.4 4.3 4.6 8.3-2.3 4.7-9.9 9.4-9.9 9.4z"/>',
  d: '<path d="M12 1.2 20.6 12 12 22.8 3.4 12z"/>',
  c: '<circle cx="12" cy="6.6" r="4.5"/><circle cx="6.4" cy="13" r="4.5"/><circle cx="17.6" cy="13" r="4.5"/><path d="M12 10.5c-.3 4.6-1.2 8.2-3.1 11.3h6.2c-1.9-3.1-2.8-6.7-3.1-11.3z"/>',
};
const suit = (s, size, st = "") =>
  `<svg viewBox="0 0 24 24" width="${size.toFixed(1)}" height="${size.toFixed(1)}" fill="currentColor" style="display:block;${st}">${SUIT[s]}</svg>`;

// Contexto del video que se está armando (lo arma `construir`).
let C = null;
const sfx = (t, n, o = {}) => C.cues.push({ t: Math.max(0, +t.toFixed(3)), n, ...o });
const sacudir = (t) => C.shakes.push(t);
const destello = (t) => C.flashes.push(t);
let semilla = 7;
const rnd = () => ((semilla = (semilla * 1664525 + 1013904223) >>> 0) / 4294967296);

const E = {
  out: "cubic-bezier(.16,1,.3,1)",
  back: "cubic-bezier(.34,1.56,.64,1)",
  io: "cubic-bezier(.65,0,.35,1)",
  in: "cubic-bezier(.7,0,.84,0)",
  lin: "linear",
};
// Una animación: nombre, cuándo empieza, cuánto dura, curva y relleno.
const A = (n, de, dur = 0.5, curva = E.out, fill = "both") =>
  `${n} ${dur}s ${curva} ${de.toFixed(3)}s ${fill}`;
const an = (...l) => `animation:${l.filter(Boolean).join(",")};`;

function construir(def) {
  C = { cues: [], shakes: [], flashes: [], css: new Set(), dur: def.dur };
  semilla = def.semilla || 7;
  const html = def.html();
  const out = { ...C, html, css: [...C.css].join("\n") };
  C = null;
  return out;
}

// Una escena: aparece en `de` y se va (borrosa, hacia arriba) en `hasta`, con un whoosh.
// Mientras está, la "cámara" se acerca de a poco.
function escena(de, hasta, html, { zoom = true, gap = null, whoosh = true } = {}) {
  const fin = hasta ?? C.dur;
  if (hasta != null && whoosh) sfx(hasta - 0.04, "whoosh");
  const st = an(A("ver", de, 0.001, E.lin), hasta != null && A("salida", hasta, 0.38, E.in, "forwards"));
  const zi = zoom ? an(`zoomlento ${(fin - de).toFixed(2)}s linear ${de.toFixed(3)}s both`) : "";
  return `<div class="esc" style="${st}"><div class="esc-in" style="${zi}${gap != null ? `gap:${gap}px;` : ""}">${html}</div></div>`;
}

// Título que entra palabra por palabra. *palabra* va en dorado y subrayada; "/" corta el renglón.
function titulo(de, texto, { tag = "h1", paso = 0.07, clase = "", sonido = true, st = "" } = {}) {
  if (sonido) sfx(de, "pop", { v: 0.55 });
  let enEm = false;
  let i = 0;
  // Los emojis y signos sueltos van pegados a la palabra anterior (que no queden solos en un renglón).
  const toks = [];
  for (const tok of texto.split(" ")) {
    if (toks.length && tok !== "/" && !/[\p{L}\p{N}*]/u.test(tok)) toks[toks.length - 1] += "\u00a0" + tok;
    else toks.push(tok);
  }
  const partes = toks.map((tok) => {
    if (tok === "/") return "<br>";
    let t = tok;
    let cola = "";
    if (t.startsWith("*")) {
      enEm = true;
      t = t.slice(1);
    }
    const esEm = enEm;
    const m = t.match(/^(.*)\*([^*]*)$/);
    if (m) {
      t = m[1];
      cola = m[2];
      enEm = false;
    }
    const d = de + i++ * paso;
    const inner = esEm
      ? `<em>${t}<i class="mk" style="${an(A("subraya", d + 0.3, 0.45))}"></i></em>${cola}`
      : t;
    return `<span class="w" style="${an(A("palabra", d, 0.55))}">${inner}</span>`;
  });
  return `<${tag} class="${clase}" style="${st}">${partes.join(" ").replace(/ <br> /g, "<br>")}</${tag}>`;
}
const parr = (de, html, st = "") => `<p style="${an(A("entra", de, 0.5))}${st}">${html}</p>`;
const chico = (de, html) => `<p class="chico" style="${an(A("entra", de, 0.5))}">${html}</p>`;
const tag = (de, texto, tono = "", sonido = true) => {
  if (sonido) sfx(de, "pop", { v: 0.6 });
  return `<span class="tag ${tono}" style="${an(A("pop", de, 0.45, E.back))}">${texto}</span>`;
};
// Un renglón con signo: entra de la izquierda con un blip.
function punto(de, signo, texto, tono = "") {
  sfx(de, "blip", { p: tono === "menos" ? 0.8 : tono === "cero" ? 0.9 : 1 });
  return `<div class="item ${tono}" style="${an(A("izq", de, 0.5))}"><b style="${an(A("pop", de + 0.12, 0.4, E.back))}">${signo}</b><span>${texto}</span></div>`;
}
function icono(de, emoji, st = "") {
  sfx(de, "pop");
  return `<div class="icono" style="${an(A("pop", de, 0.55, E.back))}${st}">${emoji}</div>`;
}
// Número que cuenta de 0 a `hasta`.
function numero(de, hasta, dur = 0.9) {
  const k = `n${hasta < 0 ? "m" + -hasta : hasta}`;
  C.css.add(`@keyframes ${k}{from{--n:0}to{--n:${hasta}}}`);
  return `<span class="cnt" style="${an(A(k, de, dur, E.out))}"></span>`;
}
// Algo visible solo entre `de` y `hasta` (para cosas que cambian de golpe).
const ventana = (de, hasta, html, st = "", entra = "pop") =>
  `<span class="vent" style="${an(A("ver", de, 0.001, E.lin), entra && A(entra, de, 0.3, E.back), hasta != null && A("oculta", hasta, 0.001, E.lin, "forwards"))}${st}">${html}</span>`;

// ---------- Cartas ----------
const L = 0.32;
const R = 0.68;
const M = 0.5;
const PIPS = {
  2: [[M, 0.22], [M, 0.78]],
  3: [[M, 0.22], [M, 0.5], [M, 0.78]],
  4: [[L, 0.22], [R, 0.22], [L, 0.78], [R, 0.78]],
  5: [[L, 0.22], [R, 0.22], [M, 0.5], [L, 0.78], [R, 0.78]],
  6: [[L, 0.22], [R, 0.22], [L, 0.5], [R, 0.5], [L, 0.78], [R, 0.78]],
  7: [[L, 0.22], [R, 0.22], [M, 0.36], [L, 0.5], [R, 0.5], [L, 0.78], [R, 0.78]],
  8: [[L, 0.22], [R, 0.22], [M, 0.36], [L, 0.5], [R, 0.5], [M, 0.64], [L, 0.78], [R, 0.78]],
  9: [[L, 0.22], [R, 0.22], [L, 0.407], [R, 0.407], [M, 0.5], [L, 0.593], [R, 0.593], [L, 0.78], [R, 0.78]],
  10: [[L, 0.22], [R, 0.22], [M, 0.314], [L, 0.407], [R, 0.407], [L, 0.593], [R, 0.593], [M, 0.686], [L, 0.78], [R, 0.78]],
};
const pip = (s, x, y, size, inv) =>
  `<span class="pip" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;${inv ? "transform:translate(-50%,-50%) rotate(180deg)" : ""}">${suit(s, size)}</span>`;

function cara(c, w) {
  const r = c.slice(0, -1);
  const s = c.slice(-1);
  const roja = s === "h" || s === "d";
  const h = w * 1.4;
  const ix = (inv) =>
    `<div class="ix${inv ? " inv" : ""}" style="font-size:${(w * 0.21).toFixed(1)}px;${inv ? `right:${(w * 0.055).toFixed(1)}px;bottom:${(w * 0.045).toFixed(1)}px` : `left:${(w * 0.055).toFixed(1)}px;top:${(w * 0.045).toFixed(1)}px`};${r === "10" ? "letter-spacing:-.1em;" : ""}"><span>${r}</span>${suit(s, w * 0.13, "margin-top:" + (w * 0.02).toFixed(1) + "px")}</div>`;
  let centro = "";
  const n = Number(r);
  if (w < 100) centro = pip(s, w / 2, h / 2, w * 0.44, false);
  else if (n >= 2) {
    const tam = w * (n <= 3 ? 0.22 : n <= 8 ? 0.19 : 0.17);
    centro = PIPS[n].map(([x, y]) => pip(s, x * w, y * h, tam, y > 0.5)).join("");
  } else if (r === "A") centro = pip(s, w / 2, h / 2, w * (s === "s" ? 0.54 : 0.46), false);
  else {
    // Figura: marco doble con la letra grande y el palo arriba y abajo.
    centro = `<div class="fig" style="left:${(w * 0.21).toFixed(1)}px;right:${(w * 0.21).toFixed(1)}px;top:${(h * 0.13).toFixed(1)}px;bottom:${(h * 0.13).toFixed(1)}px;border-width:${Math.max(1.5, w * 0.012).toFixed(1)}px;border-radius:${(w * 0.04).toFixed(1)}px;box-shadow:inset 0 0 0 ${(w * 0.022).toFixed(1)}px #fbf3dc,inset 0 0 0 ${(w * 0.03).toFixed(1)}px currentColor">
      ${suit(s, w * 0.15)}<b style="font-size:${(w * 0.4).toFixed(1)}px">${r}</b>${suit(s, w * 0.15, "transform:rotate(180deg)")}</div>`;
  }
  return `<div class="cara${roja ? " roja" : ""}" style="border-radius:${(w * 0.075).toFixed(1)}px">${ix(false)}${ix(true)}${centro}</div>`;
}
const atras = (w, girada = false) =>
  `<div class="atras${girada ? " girada" : ""}" style="border-radius:${(w * 0.075).toFixed(1)}px;border-width:${(w * 0.05).toFixed(1)}px"><div class="atras-in" style="border-radius:${(w * 0.035).toFixed(1)}px"><img src="/img/ficha.svg" style="width:${(w * 0.42).toFixed(1)}px;height:${(w * 0.42).toFixed(1)}px"></div></div>`;

// Una carta ("10s", "Ah", o null para el dorso), de `w` px de ancho. Opciones:
//   de: cuándo se reparte (vuela desde arriba a la derecha, como del sabot); desde: [dx, dy, giro]
//   voltea: cuándo se da vuelta (arranca boca abajo)
//   x, y, r: posición y giro fijos; mueve: { de, dur, x1, y1, r1 } para deslizarla después
//   abs: centrada y con posición absoluta (para armar manos que se separan)
function carta(c, w = 170, o = {}) {
  const h = Math.round(w * 1.4);
  let interior;
  if (c && o.voltea != null) {
    interior = `<div class="cf" style="${an(A("voltea", o.voltea, 0.6, E.out))}">${cara(c, w)}${atras(w, true)}</div>`;
    sfx(o.voltea, "flip");
  } else interior = c ? cara(c, w) : atras(w);
  let cd = "";
  if (o.de != null) {
    const [dx, dy, dr] = o.desde || [520, -1300, 34];
    cd = `--dx:${dx}px;--dy:${dy}px;--dr:${dr}deg;${an(A("reparte", o.de, o.dur || 0.62, E.out))}`;
    sfx(o.de, "carta");
  }
  const x = o.x || 0;
  const y = o.y || 0;
  const r = o.r || 0;
  let pos = x || y || r ? `transform:translate(${x}px,${y}px) rotate(${r}deg);` : "";
  if (o.mueve) {
    const m = o.mueve;
    pos = `--x0:${x}px;--y0:${y}px;--r0:${r}deg;--x1:${m.x1 ?? x}px;--y1:${m.y1 ?? y}px;--r1:${m.r1 ?? r}deg;${an(A("mueve", m.de, m.dur || 0.6, E.io))}`;
    sfx(m.de, "swish");
  }
  const abs = o.abs ? `position:absolute;left:50%;top:50%;margin-left:${-w / 2}px;margin-top:${-h / 2}px;` : "";
  return `<div class="cw" style="width:${w}px;height:${h}px;${abs}${pos}${o.z != null ? `z-index:${o.z};` : ""}"><div class="cd" style="${cd}">${interior}</div></div>`;
}

// ---------- Suspenso ----------
// Reloj circular de `n` segundos con tic y latido en cada segundo.
function cuentaAtras(de, n = 3, tam = 220) {
  let nums = "";
  for (let k = 0; k < n; k++) {
    sfx(de + k, "tick", { p: k === n - 1 ? 0.8 : 1 });
    sfx(de + k + 0.01, "latido");
    nums += `<b class="rn" style="font-size:${tam * 0.5}px;${an(A("numero", de + k, 1, E.lin))}">${n - k}</b>`;
  }
  return `<div class="reloj" style="width:${tam}px;height:${tam}px;${an(A("pop", de - 0.3, 0.4, E.back))}">
    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="aro-f"/><circle cx="50" cy="50" r="44" pathLength="1" class="aro" style="${an(`anillo ${n}s linear ${de.toFixed(3)}s both`)}"/></svg>${nums}</div>`;
}
// ¿Mito o verdad?: una luz salta entre las dos opciones, cada vez más lento, y cae en `gana`.
// Devuelve { html, fin } (fin: cuándo se queda quieta).
function votacion(de, gana = "MITO") {
  const gaps = [0.14, 0.15, 0.17, 0.2, 0.24, 0.29, 0.36, 0.46];
  const ops = ["MITO", "VERDAD"];
  const g = ops.indexOf(gana);
  const inicio = (((g - gaps.length) % 2) + 2) % 2;
  const t = [de];
  for (const x of gaps) t.push(t[t.length - 1] + x);
  const luces = [[], []];
  t.forEach((tk, k) => {
    const op = (inicio + k) % 2;
    const ultima = k === t.length - 1;
    luces[op].push(`<i class="lit" style="${an(A("ver", tk, 0.001, E.lin), !ultima && A("oculta", t[k + 1], 0.001, E.lin, "forwards"))}"></i>`);
    sfx(tk, "tick", { p: op ? 1.12 : 1, v: ultima ? 1 : 0.7 });
  });
  const html = `<div class="vs" style="${an(A("entra", de - 0.6, 0.5), A("apaga", t[t.length - 1] + 0.5, 0.25, E.out, "forwards"))}">
    <div class="op mito">${luces[0].join("")}<span>MITO</span></div>
    <span class="vs-o">o</span>
    <div class="op verdad">${luces[1].join("")}<span>VERDAD</span></div></div>`;
  return { html, fin: t[t.length - 1] };
}
// Sello que cae con golpe, sacudón y destello.
function sello(de, texto = "MITO", tipo = "mito", st = "") {
  const golpe = de + 0.27;
  sfx(golpe - 0.015, "sello");
  sacudir(golpe);
  destello(golpe);
  return `<div class="sello ${tipo}" style="${an(A("sello", de, 0.5, E.out))}${st}">${texto}</div>`;
}
// Explosión de fichas y palos desde el centro de lo que la contiene.
function confeti(de, n = 30, st = "") {
  sfx(de, "brillo");
  sfx(de + 0.04, "fichas");
  const colores = ["#e9b949", "#f8dc8f", "#46c47f", "#ff6b5c", "#f3efe2"];
  let out = "";
  for (let i = 0; i < n; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = 260 + rnd() * 380;
    const x = Math.cos(ang) * dist;
    const y1 = Math.sin(ang) * dist * 0.75 - 120;
    const y2 = y1 + 380 + rnd() * 260;
    const r = (rnd() * 2 - 1) * 540;
    const tam = 26 + rnd() * 30;
    const col = colores[i % colores.length];
    const pieza =
      i % 3 === 0
        ? `<span class="ficha" style="width:${tam * 1.3}px;height:${tam * 1.3}px"></span>`
        : `<span style="color:${col}">${suit("shdc"[i % 4], tam)}</span>`;
    out += `<span class="pz" style="--x:${x.toFixed(0)}px;--y1:${y1.toFixed(0)}px;--y2:${y2.toFixed(0)}px;--r:${r.toFixed(0)}deg;${an(A("estalla", de + rnd() * 0.08, 1.7, E.lin))}">${pieza}</span>`;
  }
  return `<div class="confeti" style="${st}">${out}</div>`;
}

// ---------- Cierre (el mismo en todos) ----------
function final(de) {
  sfx(de, "outro");
  sfx(de + 0.8, "pop");
  return escena(
    de,
    null,
    `<div class="fin-logo" style="${an(A("pop", de, 0.65, E.back))}"><div class="halo" style="${an(`gira ${(C.dur - de).toFixed(2)}s linear ${de}s both`)}"></div><img src="/img/ficha.svg"></div>
     ${titulo(de + 0.3, "Practicalo gratis en *Edge 21*", { tag: "h2", sonido: false })}
     <div class="cta" style="${an(A("pop", de + 0.8, 0.5, E.back))}">Link en el perfil<i class="brillo" style="${an(A("brilla", de + 1.4, 0.9, E.io))}"></i></div>
     <p class="chico" style="${an(A("entra", de + 1.1, 0.5))}">Lecciones, desafío diario y práctica sin dinero</p>`,
    { zoom: false },
  );
}

// ---------- Estilos ----------
const CSS = `
@font-face{font-family:DM;src:url(/app/fonts/DMSans-latin-400-800.woff2);font-weight:400 800}
@property --n{syntax:'<integer>';inherits:false;initial-value:0}
*{margin:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:DM,"Noto Color Emoji",sans-serif;color:#f3efe2;position:relative;background:#06180f}
.fondo{position:absolute;inset:0;background:radial-gradient(120% 75% at 30% 0%,#1b6b47 0%,#0b2f1e 52%,#04100a 100%)}
.luz{position:absolute;width:1500px;height:1500px;left:-420px;top:-380px;border-radius:50%;background:radial-gradient(circle,rgba(233,185,73,.15),rgba(233,185,73,0) 62%)}
.palo{position:absolute;color:#e9b949}
.vineta{position:absolute;inset:0;background:radial-gradient(130% 90% at 50% 42%,rgba(0,0,0,0) 55%,rgba(0,0,0,.5))}
.borde{position:absolute;inset:26px;border:3px dashed rgba(233,185,73,.2);border-radius:44px}
.marca{position:absolute;left:90px;right:150px;top:176px;display:flex;align-items:center;gap:16px;font-size:32px;font-weight:700;color:#cfdcd2}
.marca img{width:58px;height:58px}
.serie{margin-left:auto;font-size:28px;color:#e9b949;font-weight:800;letter-spacing:.06em}
.prog{position:absolute;left:90px;right:150px;top:256px;height:8px;border-radius:8px;background:rgba(255,255,255,.1);overflow:hidden}
.prog i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#c9971f,#f8dc8f);transform-origin:left}
#cam{position:absolute;left:70px;right:130px;top:300px;bottom:440px}
.esc{position:absolute;inset:0}
.esc-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;text-align:center}
.pie{position:absolute;left:90px;right:150px;bottom:372px;text-align:center;font-size:26px;color:#9fb3a6;font-weight:700}
.flash{position:absolute;inset:0;background:#fff8e6;opacity:0;pointer-events:none}
h1{font-size:112px;line-height:1.02;font-weight:800;letter-spacing:-2.5px;text-shadow:0 8px 30px rgba(0,0,0,.35)}
h1.xl{font-size:170px;letter-spacing:-4px}
h2{font-size:80px;line-height:1.07;font-weight:800;letter-spacing:-1.5px;text-shadow:0 6px 24px rgba(0,0,0,.35)}
h3{font-size:58px;line-height:1.1;font-weight:800}
p{font-size:50px;line-height:1.26;color:#cfdcd2;font-weight:500}
p b{color:#f3efe2;font-weight:800}
p em,h3 em{font-style:normal;color:#e9b949}
.chico{font-size:32px;color:#9fb3a6}
.w{display:inline-block;isolation:isolate}
.w em{font-style:normal;color:#e9b949;position:relative;white-space:nowrap}
.mk{position:absolute;left:-6px;right:-6px;bottom:.04em;height:.2em;background:rgba(233,185,73,.3);border-radius:8px;transform-origin:left;z-index:-1}
.vent{display:inline-block}
.tag{display:inline-block;padding:14px 32px;border-radius:999px;background:#e9b949;color:#1d1405;font-size:34px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.tag.rojo{background:#d9483b;color:#fff}.tag.verde{background:#2fa36b;color:#fff}
.fila{display:flex;gap:22px;align-items:center;justify-content:center}
.lbl{font-size:30px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#9fb3a6}
.mano{display:flex;flex-direction:column;align-items:center;gap:18px}
.total{font-size:46px;font-weight:800;padding:8px 30px;border-radius:999px;background:rgba(0,0,0,.4);border:2px solid rgba(255,255,255,.12)}
.total.malo{background:#d9483b;border-color:#d9483b;color:#fff}.total.bueno{background:#2fa36b;border-color:#2fa36b;color:#fff}
.caja{padding:32px 42px;border-radius:32px;background:rgba(6,17,12,.62);border:2px solid rgba(233,185,73,.3)}
.caja p{font-size:46px}
.lista{display:flex;flex-direction:column;gap:22px;width:100%}
.item{display:flex;gap:28px;align-items:center;text-align:left;padding:26px 34px;border-radius:28px;background:rgba(6,17,12,.58);border:2px solid rgba(255,255,255,.07)}
.item>b{display:grid;place-items:center;min-width:96px;height:72px;padding:0 14px;border-radius:20px;font-size:44px;font-weight:800;background:#e9b949;color:#1d1405;flex:none}
.item.mas>b{background:#2fa36b;color:#fff}.item.cero>b{background:#e8e2cf;color:#1d1405}.item.menos>b{background:#d9483b;color:#fff}
.item span{font-size:48px;line-height:1.2;font-weight:600;color:#cfdcd2}
.item span b{color:#f3efe2;font-weight:800}
.icono{width:180px;height:180px;border-radius:50%;display:grid;place-items:center;font-size:96px;background:radial-gradient(circle at 35% 30%,rgba(233,185,73,.4),rgba(6,17,12,.75) 70%);border:5px solid rgba(233,185,73,.7);box-shadow:0 0 70px rgba(233,185,73,.25);flex:none}
.nro{width:120px;height:120px;border-radius:50%;display:grid;place-items:center;font-size:72px;font-weight:800;background:#e9b949;color:#1d1405;box-shadow:0 10px 0 #8f6a17;flex:none}
.cnt{counter-reset:c var(--n)}.cnt::after{content:counter(c)}
/* Cartas */
.cw{position:relative;flex:none;perspective:1800px}
.cd,.cf{position:absolute;inset:0;transform-style:preserve-3d}
.cara,.atras{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 22px 40px rgba(0,0,0,.45),0 3px 6px rgba(0,0,0,.3)}
.cara{background:linear-gradient(160deg,#fffdf7,#eee7d6);color:#17140c;box-shadow:0 22px 40px rgba(0,0,0,.45),0 3px 6px rgba(0,0,0,.3),inset 0 0 0 1.5px rgba(0,0,0,.08)}
.cara.roja{color:#c8322b}
.atras.girada{transform:rotateY(180deg)}
.ix{position:absolute;display:flex;flex-direction:column;align-items:center;font-weight:800;line-height:.86}
.ix.inv{transform:rotate(180deg)}
.pip{position:absolute;transform:translate(-50%,-50%)}
.fig{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;border:solid currentColor;background:linear-gradient(170deg,#fbf1d6,#ecd9a8)}
.fig b{font-weight:800;line-height:.9;letter-spacing:-.04em}
.atras{border:solid #f6f1e4;background:#0e3a25}
.atras-in{position:absolute;inset:0;display:grid;place-items:center;background:repeating-linear-gradient(45deg,rgba(233,185,73,.22) 0 2px,rgba(0,0,0,0) 2px 15px),repeating-linear-gradient(-45deg,rgba(233,185,73,.22) 0 2px,rgba(0,0,0,0) 2px 15px),radial-gradient(circle,#17603f,#0a2a1b)}
/* Reloj, votación, sello, confeti */
.reloj{position:relative;flex:none}
.reloj svg{position:absolute;inset:0;transform:rotate(-90deg)}
.aro-f{fill:rgba(6,17,12,.6);stroke:rgba(255,255,255,.1);stroke-width:7}
.aro{fill:none;stroke:#e9b949;stroke-width:7;stroke-linecap:round;stroke-dasharray:1 1}
.rn{position:absolute;inset:0;display:grid;place-items:center;font-weight:800;color:#e9b949;line-height:1}
.vs{display:flex;align-items:center;gap:26px}
.vs-o{font-size:44px;color:#9fb3a6;font-weight:700}
.op{position:relative;padding:30px 48px;border-radius:30px;font-size:62px;font-weight:800;background:rgba(6,17,12,.62);border:3px solid rgba(255,255,255,.14)}
.op span{position:relative}
.op .lit{position:absolute;inset:-4px;border-radius:30px}
.op.mito .lit{background:#d9483b;box-shadow:0 0 60px rgba(217,72,59,.7)}
.op.verdad .lit{background:#2fa36b;box-shadow:0 0 60px rgba(47,163,107,.7)}
.sobre{position:relative;display:grid;place-items:center}
.sobre>*{grid-area:1/1}
.sello{font-size:170px;font-weight:800;letter-spacing:6px;padding:6px 54px;border:14px solid currentColor;border-radius:34px;background:rgba(6,17,12,.88);transform:rotate(-8deg);z-index:3}
.sello.mito{color:#ff6b5c}.sello.real{color:#46c47f}
.confeti{position:absolute;left:50%;top:42%;width:0;height:0;z-index:5;pointer-events:none}
.pz{position:absolute;left:0;top:0;display:block}
.pz>*{display:block;transform:translate(-50%,-50%)}
.ficha{border-radius:50%;background:#e9b949;border:5px dashed #fff3cf;box-shadow:inset 0 0 0 5px #b98a26}
.op2{padding:24px 34px;border-radius:26px;font-size:46px;font-weight:800;background:rgba(6,17,12,.62);border:3px solid rgba(255,255,255,.14)}
/* Piezas de los guiones */
.val{font-size:34px;font-weight:800;padding:4px 18px;border-radius:999px;background:#e8e2cf;color:#1d1405}
.val.mas{background:#2fa36b;color:#fff}.val.menos{background:#d9483b;color:#fff}
.grilla{display:grid;grid-template-columns:repeat(5,118px);gap:18px 20px}
.punto-p{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.14)}
.bars{display:flex;flex-direction:column;gap:12px;width:100%}
.bar{display:grid;grid-template-columns:96px 1fr 150px;align-items:center;gap:20px;font-size:48px;font-weight:800;padding:6px 16px;border-radius:20px;border:3px solid rgba(255,255,255,0)}
.bar .t{height:44px;border-radius:12px;background:rgba(255,255,255,.08);overflow:hidden}
.bar .t i{display:block;height:100%;border-radius:12px;transform-origin:left}
.tiles{display:flex;gap:7px}
.tile{width:61px;height:88px;border-radius:12px;display:grid;place-items:center;font-size:36px;font-weight:800;background:#f3efe2;color:#17140c;border:3px solid #f3efe2;letter-spacing:-.06em}
.grafico{position:relative;width:860px;height:440px}
.grafico svg{position:absolute;inset:0;overflow:visible}
.grafico .cero{stroke:rgba(255,255,255,.3);stroke-width:3;stroke-dasharray:12 12}
.grafico .linea{fill:none;stroke:#e9b949;stroke-width:9;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1 1;filter:drop-shadow(0 6px 14px rgba(0,0,0,.4))}
.cabeza{position:absolute;left:0;top:0;width:34px;height:34px;border-radius:50%;background:#fff3cf;box-shadow:0 0 0 8px rgba(233,185,73,.35),0 0 40px #e9b949;offset-rotate:0deg}
.nota{position:absolute;font-size:40px;font-weight:800;padding:8px 22px;border-radius:999px;white-space:nowrap}
.nota.mala{background:#d9483b;color:#fff}.nota.buena{background:#2fa36b;color:#fff}
.eje{position:absolute;left:0;top:262px;font-size:28px;color:#9fb3a6;font-weight:700}
@keyframes enciende{to{background:#e9b949;box-shadow:0 0 18px rgba(233,185,73,.8)}}
@keyframes sigue{from{offset-distance:0%}to{offset-distance:100%}}
/* Cierre */
.fin-logo{position:relative;width:300px;height:300px;display:grid;place-items:center}
.fin-logo img{position:relative;width:250px;height:250px;filter:drop-shadow(0 24px 50px rgba(0,0,0,.55))}
.halo{position:absolute;inset:-30px;border-radius:50%;background:conic-gradient(from 0deg,rgba(233,185,73,0),rgba(233,185,73,.55),rgba(233,185,73,0) 30%,rgba(233,185,73,0) 50%,rgba(233,185,73,.55),rgba(233,185,73,0) 80%);-webkit-mask:radial-gradient(circle,transparent 58%,#000 60%,#000 68%,transparent 70%);mask:radial-gradient(circle,transparent 58%,#000 60%,#000 68%,transparent 70%)}
.cta{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:16px;padding:30px 56px;border-radius:999px;background:#e9b949;color:#1d1405;font-size:54px;font-weight:800;box-shadow:0 10px 0 #8f6a17}
.brillo{position:absolute;top:-20%;bottom:-20%;left:0;width:90px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.75),rgba(255,255,255,0));transform:translateX(-200px) skewX(-20deg)}
/* Animaciones (el grabador las congela en cada cuadro) */
@keyframes ver{from{visibility:hidden}to{visibility:visible}}
@keyframes oculta{from{visibility:visible}to{visibility:hidden}}
@keyframes salida{from{opacity:1;transform:none;filter:blur(0)}to{opacity:0;transform:translateY(-70px) scale(.94);filter:blur(10px);visibility:hidden}}
@keyframes zoomlento{from{transform:scale(1)}to{transform:scale(1.045)}}
@keyframes palabra{from{opacity:0;transform:translateY(46px) scale(.9);filter:blur(8px)}to{opacity:1;transform:none;filter:blur(0)}}
@keyframes entra{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:none}}
@keyframes izq{from{opacity:0;transform:translateX(-90px)}to{opacity:1;transform:none}}
@keyframes pop{0%{opacity:0;transform:scale(.4)}100%{opacity:1;transform:scale(1)}}
@keyframes subraya{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes reparte{0%{transform:translate(var(--dx),var(--dy)) rotate(var(--dr)) scale(1.06);opacity:0}10%{opacity:1}100%{transform:none;opacity:1}}
@keyframes voltea{0%{transform:rotateY(180deg)}50%{transform:rotateY(90deg) scale(1.08)}100%{transform:rotateY(0)}}
@keyframes mueve{from{transform:translate(var(--x0),var(--y0)) rotate(var(--r0))}to{transform:translate(var(--x1),var(--y1)) rotate(var(--r1))}}
@keyframes anillo{from{stroke-dashoffset:0}to{stroke-dashoffset:-1}}
@keyframes numero{0%{opacity:0;transform:scale(1.9)}14%{opacity:1;transform:scale(1)}82%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.6)}}
@keyframes sello{0%{opacity:0;transform:rotate(-8deg) scale(2.8)}55%{opacity:1;transform:rotate(-8deg) scale(.92)}100%{opacity:1;transform:rotate(-8deg) scale(1)}}
@keyframes sacude{0%{transform:none}12%{transform:translate(-18px,10px) rotate(-.7deg)}26%{transform:translate(15px,-12px) rotate(.6deg)}42%{transform:translate(-10px,7px)}58%{transform:translate(7px,-5px)}76%{transform:translate(-3px,2px)}100%{transform:none}}
@keyframes flash{0%{opacity:.28}100%{opacity:0}}
@keyframes estalla{0%{transform:translate(0,0) rotate(0) scale(.3);opacity:0}5%{opacity:1}40%{transform:translate(calc(var(--x) * .75),var(--y1)) rotate(calc(var(--r) * .5)) scale(1);opacity:1}80%{opacity:1}100%{transform:translate(var(--x),var(--y2)) rotate(var(--r)) scale(.9);opacity:0}}
@keyframes gira{from{transform:rotate(0)}to{transform:rotate(200deg)}}
@keyframes brilla{from{transform:translateX(-200px) skewX(-20deg)}to{transform:translateX(620px) skewX(-20deg)}}
@keyframes crece{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes flota{from{transform:translateY(0) rotate(var(--r0))}to{transform:translateY(-240px) rotate(var(--r1))}}
@keyframes deriva{from{transform:translate(0,0)}to{transform:translate(260px,520px)}}
@keyframes dibuja{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes late{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes ilumina{from{box-shadow:0 0 0 0 rgba(233,185,73,0);border-color:rgba(255,255,255,.07)}to{box-shadow:0 0 0 6px #e9b949,0 0 50px rgba(233,185,73,.45);border-color:#e9b949}}
@keyframes apaga{to{opacity:.32}}
@keyframes enrojece{to{background:#d9483b;color:#fff;border-color:#d9483b}}
@keyframes enverdece{to{background:#2fa36b;color:#fff;border-color:#2fa36b}}
`;

export {
  A, an, E, CSS, construir, escena, titulo, parr, chico, tag, punto, icono, numero, ventana,
  carta, cuentaAtras, votacion, sello, confeti, final, sfx, sacudir, destello, rnd, suit,
};
