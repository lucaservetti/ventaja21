// Guiones de los videos cortos (los graba tools/redes/videos.mjs con las piezas de motor.mjs).
// Reglas para que retengan:
// - el gancho (la pregunta) en el primer segundo, sin logo ni saludo;
// - algo nuevo en pantalla cada 1 o 2 segundos (cartas que vuelan, sellos, cuentas, números);
// - texto grande, porque muchos miran sin sonido; el sonido suma, no explica;
// - un pedido antes del cierre: comentar, guardar o seguir;
// - nada de "casino", "apuesta", "plata" ni "dinero" (TikTok los castiga): cartas, lógica, probabilidad.
// El video 1 de la semana 2 (el quiz de 12 contra 2) se hizo con la versión anterior del motor.
import {
  A, an, E, escena, titulo, parr, chico, tag, punto, icono, numero, ventana, carta,
  cuentaAtras, votacion, sello, confeti, final, sfx, rnd,
} from "./motor.mjs";

const valor = (c) => {
  const r = c.slice(0, -1);
  return ["2", "3", "4", "5", "6"].includes(r) ? 1 : ["7", "8", "9"].includes(r) ? 0 : -1;
};
const signo = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
const tono = (n) => (n > 0 ? "mas" : n < 0 ? "menos" : "cero");
const chip = (de, html, st = "") => {
  sfx(de, "blip");
  return `<span class="op2" style="${an(A("pop", de, 0.45, E.back))}${st}">${html}</span>`;
};

// Dos cartas iguales que se separan y reciben una carta nueva cada una (ases y ochos).
function separar(de, { par, nuevas, junto, juntoTxt, juntoMalo, totales, titular }) {
  const [a, b] = par;
  const corte = de + 2.4;
  const reparte = corte + 1;
  sfx(reparte + 0.5, "ding");
  return `
    ${tag(de, par[0].startsWith("A") ? "Ases" : "Ochos")}
    <div style="position:relative;width:880px;height:400px">
      ${carta(a, 170, { abs: true, x: -42, y: -20, r: -4, de: de + 0.2, mueve: { de: corte, x1: -210, r1: 0 }, z: 1 })}
      ${carta(b, 170, { abs: true, x: 42, y: -14, r: 4, de: de + 0.35, mueve: { de: corte, x1: 210, r1: 0 }, z: 2 })}
      ${carta(nuevas[0], 170, { abs: true, x: -150, y: 26, r: 7, de: reparte, z: 3 })}
      ${carta(nuevas[1], 170, { abs: true, x: 270, y: 26, r: 7, de: reparte + 0.18, z: 4 })}
      <div style="position:absolute;left:0;right:0;bottom:-4px;display:grid;place-items:center">${ventana(de + 0.8, corte, `<span class="total${juntoMalo ? " malo" : ""}">${junto}</span>`)}</div>
      <div style="position:absolute;left:0;width:440px;bottom:-4px;display:grid;place-items:center">${ventana(reparte + 0.5, null, `<span class="total bueno">${totales[0]}</span>`)}</div>
      <div style="position:absolute;right:0;width:440px;bottom:-4px;display:grid;place-items:center;padding-left:120px">${ventana(reparte + 0.65, null, `<span class="total bueno">${totales[1]}</span>`)}</div>
    </div>
    <div class="sobre" style="height:90px">
      ${ventana(de + 1.1, corte, `<p>Juntos: <b>${juntoTxt}</b></p>`, "", "entra")}
      ${ventana(corte, null, `<span class="tag verde">✂️ Separados</span>`)}
    </div>
    ${titulo(reparte + 1.1, titular, { tag: "h2" })}`;
}

const VIDEOS = {
  // 2. Desafío de memoria: 10 cartas, ¿cuánto da? La respuesta, con la cuenta carta por carta.
  "2-desafio-memoria": {
    serie: "DESAFÍO DE MEMORIA",
    dur: 28.6,
    portada: 2.6,
    semilla: 11,
    html() {
      const cartas = ["5h", "Ks", "3d", "9c", "6s", "Ah", "2c", "10d", "4h", "7s"];
      const t0 = 5.6;
      const paso = 0.82;
      const fin = t0 + cartas.length * paso + 0.35;
      let suma = 0;
      const parciales = cartas.map((c) => (suma += valor(c)));
      const rev = fin + 4.9;
      return [
        escena(0, 5.0, `
          ${titulo(0.1, "¿Podés llevar la *cuenta*? 🧠")}
          <div class="lista">
            ${punto(1.1, "+1", "2 · 3 · 4 · 5 · 6", "mas")}
            ${punto(1.45, "0", "7 · 8 · 9", "cero")}
            ${punto(1.8, "−1", "10 · J · Q · K · A", "menos")}
          </div>
          ${parr(2.5, "Van a salir <b>10 cartas</b>. Sumá en tu cabeza.")}
          ${tag(3.6, "¿Listo?")}`),
        escena(5.3, fin, `
          <div class="lbl" style="position:relative;height:40px;width:400px;display:grid;place-items:center">
            ${cartas.map((_, i) => ventana(t0 + i * paso, i < 9 ? t0 + (i + 1) * paso : null, `Carta ${i + 1} de 10`, "grid-area:1/1", null)).join("")}
          </div>
          <div style="position:relative;width:880px;height:600px">
            ${cartas.map((c, i) => carta(c, 400, { abs: true, de: t0 + i * paso, x: Math.round((rnd() * 2 - 1) * 16), y: Math.round((rnd() * 2 - 1) * 10), r: +((rnd() * 2 - 1) * 6).toFixed(1), z: i + 1, dur: 0.5 })).join("")}
          </div>
          <div class="fila" style="gap:16px">
            ${cartas.map((_, i) => `<i class="punto-p" style="${an(A("enciende", t0 + i * paso + 0.2, 0.25))}"></i>`).join("")}
          </div>`, { gap: 34 }),
        escena(fin + 0.25, rev - 0.2, `
          ${titulo(fin + 0.3, "¿Cuánto *te dio*?", { clase: "xl" })}
          ${parr(fin + 0.9, "Escribilo en los comentarios <b>antes de ver la respuesta</b> 👇")}
          ${cuentaAtras(fin + 1.4, 3)}`),
        `${(sfx(fin + 2.9, "subida", { d: 1.5, v: 0.8 }), "")}`,
        escena(rev, rev + 6.6, `
          ${tag(rev + 0.05, "Respuesta", "verde", false)}
          <h1 class="xl" style="${an(A("pop", rev + 0.15, 0.55, E.back))}color:#e9b949">+2</h1>
          ${confeti(rev + 0.2)}
          <div class="grilla">
            ${cartas.map((c, i) => {
              const t = rev + 1.2 + i * 0.3;
              sfx(t, "blip", { p: valor(c) > 0 ? 1.15 : valor(c) < 0 ? 0.8 : 0.95, v: 0.8 });
              return `<div class="mano" style="gap:10px;${an(A("pop", t, 0.4, E.back))}">${carta(c, 118)}<span class="val ${tono(valor(c))}">${signo(valor(c))}</span></div>`;
            }).join("")}
          </div>
          <div class="sobre"><p style="${an(A("entra", rev + 1.1, 0.4))}">Cuenta: <b class="sobre" style="display:inline-grid;min-width:90px">${parciales.map((p, i) => ventana(rev + 1.2 + i * 0.3, i < 9 ? rev + 1.5 + i * 0.3 : null, `<em>${signo(p)}</em>`, "grid-area:1/1")).join("")}</b></p></div>
          ${titulo(rev + 4.5, "¿Acertaste? *Guardalo* 📌", { tag: "h2" })}`, { gap: 30 }),
        `${(sfx(rev + 0.15, "ding"), "")}`,
        final(rev + 6.85),
      ].join("");
    },
  },

  // 3. ¿Mito o verdad?: contar cartas, ¿es ilegal?
  "3-mito-ilegal": {
    serie: "¿MITO O VERDAD?",
    dur: 25.6,
    portada: 4.9,
    semilla: 21,
    html() {
      const v = votacion(2.1, "MITO");
      return [
        escena(0, 6.3, `
          <div style="position:relative;width:640px;height:320px">
            ${carta("Kh", 190, { abs: true, x: -165, y: 22, r: -13, de: 0.05, desde: [-900, -200, -40] })}
            ${carta("As", 200, { abs: true, de: 0.18, desde: [0, 900, 0] })}
            ${carta("10d", 190, { abs: true, x: 165, y: 22, r: 13, de: 0.31 })}
          </div>
          ${titulo(0.45, "¿Contar cartas es *ilegal*?")}
          <div class="sobre">${v.html}${sello(v.fin + 0.25, "MITO")}</div>`),
        escena(6.55, 10.75, `
          ${tag(6.6, "✓ Legal", "verde", false)}
          ${icono(6.8, "🧠")}
          ${titulo(7.05, "Contar con la cabeza *es legal*", { tag: "h2" })}
          ${parr(8.1, "Es memoria y matemática: <b>nadie te puede prohibir pensar.</b>")}`),
        `${(sfx(6.6, "bien"), "")}`,
        escena(11.0, 15.25, `
          ${tag(11.05, "✗ Prohibido", "rojo", false)}
          ${icono(11.25, "📵")}
          ${titulo(11.5, "Lo prohibido: *aparatos* o ayuda de otros", { tag: "h2" })}
          ${parr(12.6, "Celulares, calculadoras o cualquier dispositivo en la mesa.")}`),
        `${(sfx(11.05, "error"), "")}`,
        escena(15.5, 19.9, `
          ${tag(15.55, "⚠️ Ojo", "", false)}
          ${icono(15.75, "🚪")}
          ${titulo(16.0, "En muchos lugares pueden pedirte que *no juegues más*", { tag: "h2", paso: 0.06 })}
          ${parr(17.4, "Es una regla del lugar, <b>no una ley.</b>")}`),
        `${(sfx(15.55, "pop"), "")}`,
        escena(20.15, 22.55, `
          ${titulo(20.2, "¿Lo *sabías*? / Comentá 👇")}
          <div class="fila" style="flex-wrap:wrap;gap:16px">
            ${chip(20.9, "✓ Legal", "color:#46c47f")}${chip(21.05, "✗ Aparatos", "color:#ff7a6b")}${chip(21.2, "⚠️ Regla del lugar")}
          </div>`),
        final(22.8),
      ].join("");
    },
  },

  // 4. Probabilidad: chance de pasarte según tu mano, y el porqué con las 13 cartas.
  "4-chance-de-pasarte": {
    serie: "PROBABILIDAD",
    dur: 30.1,
    portada: 2.5,
    semilla: 31,
    html() {
      const filas = [[12, 31], [13, 38], [14, 46], [15, 54], [16, 62], [17, 69], [18, 77], [19, 85], [20, 92]];
      const color = (p) => (p < 45 ? "#46c47f" : p < 65 ? "#e9b949" : "#ff6b5c");
      const rangos = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      // Las 13 cartas: las que te pasan se ponen rojas una por una.
      const fichas = (de, rojas, desde) =>
        `<div class="tiles">${rangos.map((r, i) => {
          const k = rojas.indexOf(r);
          if (k >= 0) sfx(desde + k * 0.16, "blip", { p: 0.75 + k * 0.03, v: 0.7 });
          return `<span class="tile" style="${an(A("pop", de + i * 0.035, 0.35, E.back), k >= 0 && A("enrojece", desde + k * 0.16, 0.2))}">${r}</span>`;
        }).join("")}</div>`;
      return [
        escena(0, 4.9, `
          ${titulo(0.1, "Si pedís otra carta, ¿qué chance tenés de *pasarte*?", { tag: "h2", paso: 0.06 })}
          <div class="fila" style="gap:16px">
            ${carta("10s", 180, { de: 0.7 })}${carta("6h", 180, { de: 0.85 })}
            <span style="font-size:80px;font-weight:800;color:#9fb3a6;${an(A("pop", 1.4, 0.4))}">+</span>
            ${carta("Kc", 180, { de: 1.5, voltea: 2.4 })}
          </div>
          <div class="sobre" style="height:76px">
            ${ventana(1.1, 2.75, `<span class="total">16</span>`)}
            ${ventana(2.75, null, `<span class="total malo">26 · ¡Te pasaste!</span>`)}
          </div>`),
        `${(sfx(2.8, "error"), "")}`,
        escena(5.15, 13.3, `
          ${titulo(5.2, "Chance de pasarte si pedís con…", { tag: "h3", paso: 0.05 })}
          <div class="bars">
            ${filas.map(([t, p], i) => {
              const d = 5.7 + i * 0.42;
              sfx(d, "blip", { p: 0.8 + i * 0.07, v: 0.75 });
              const brilla = t === 12 || t === 17;
              if (brilla) sfx(10.2 + (t === 17 ? 0.3 : 0), "pop");
              return `<div class="bar" style="${an(A("izq", d, 0.45), brilla && A("ilumina", 10.2 + (t === 17 ? 0.3 : 0), 0.35))}"><span>${t}</span><span class="t"><i style="width:${p}%;background:${color(p)};${an(A("crece", d + 0.08, 0.8))}"></i></span><span style="color:${color(p)}">${numero(d + 0.08, p, 0.8)}%</span></div>`;
            }).join("")}
          </div>
          ${chico(9.9, "Valores aproximados, con un mazo completo.")}`, { gap: 30 }),
        escena(13.55, 19.1, `
          ${titulo(13.6, "¿Por qué con *12* es solo 31%?", { tag: "h2" })}
          ${fichas(14.4, ["10", "J", "Q", "K"], 15.1)}
          ${parr(16.0, "Solo te pasás con <b>4 de las 13</b> cartas.")}
          <h1 class="xl" style="${an(A("pop", 16.9, 0.5, E.back))}color:#46c47f">31%</h1>`),
        `${(sfx(16.9, "ding"), "")}`,
        escena(19.35, 24.5, `
          ${titulo(19.4, "¿Y con *17*?", { tag: "h2" })}
          ${fichas(19.9, ["5", "6", "7", "8", "9", "10", "J", "Q", "K"], 20.4)}
          ${parr(21.9, "Te pasás con <b>9 de las 13</b>.")}
          <h1 class="xl" style="${an(A("pop", 22.6, 0.5, E.back))}color:#ff6b5c">69%</h1>
          ${titulo(23.2, "Por eso con 17 *nunca* se pide", { tag: "h3", sonido: false })}`, { gap: 34 }),
        `${(sfx(22.6, "error", { v: 0.8 }), "")}`,
        escena(24.75, 26.9, `
          ${titulo(24.8, "*Guardalo* para la próxima 📌")}
          ${parr(25.6, "Y mandáselo a quien siempre pide con\u00a017\u00a0😅")}`),
        final(27.1),
      ].join("");
    },
  },

  // 5. La peor mano: 16 contra un 10.
  "5-la-peor-mano": {
    serie: "LA PEOR MANO",
    dur: 26.2,
    portada: 1.6,
    semilla: 41,
    html() {
      return [
        escena(0, 6.6, `
          ${titulo(0.1, "*16* contra un *10*")}
          <div class="fila" style="gap:64px;align-items:flex-start">
            <div class="mano"><span class="lbl">Crupier</span><div class="fila" style="gap:12px">${carta("10d", 160, { de: 0.5 })}${carta(null, 160, { de: 0.65 })}</div></div>
            <div class="mano"><span class="lbl">Vos</span><div class="fila" style="gap:12px">${carta("10s", 160, { de: 0.8 })}${carta("6h", 160, { de: 0.95 })}</div><span class="total malo" style="${an(A("pop", 1.35, 0.4, E.back))}">16</span></div>
          </div>
          ${parr(1.8, "La mano que <b>más pierde</b>. ¿Qué hacés?")}
          <div class="fila" style="gap:14px">${chip(2.4, "PLANTARTE")}${chip(2.55, "PEDIR")}${chip(2.7, "RENDIRTE")}</div>
          ${cuentaAtras(3.4, 3, 170)}`, { gap: 34 }),
        escena(6.85, 14.6, `
          ${titulo(6.9, "Lo que pasa *a la larga*:", { tag: "h3" })}
          <div class="lista">
            ${punto(7.5, "✗", "<b>Plantarte:</b> perdés la mayoría de las veces", "menos")}
            ${punto(8.7, "✓", "<b>Pedir:</b> también perdés seguido, pero un poco menos", "mas")}
            ${punto(9.9, "✓✓", "<b>Rendirte</b> (si la mesa lo permite): perdés solo la mitad", "mas")}
          </div>
          <div class="caja" style="${an(A("entra", 11.4, 0.5))}"><p>Plantarte y pedir pierden <em>casi igual</em>… pero pedir, <b>un poquito menos</b>.</p></div>`, { gap: 30 }),
        `${(sfx(7.6, "error", { v: 0.7 }), sfx(8.8, "bien", { v: 0.8 }), sfx(10.0, "ding"), "")}`,
        escena(14.85, 19.6, `
          ${icono(14.9, "💡")}
          ${titulo(15.2, "No hay jugada que *gane*.")}
          ${titulo(16.6, "La estrategia es / *perder lo menos posible*.", { tag: "h2", sonido: true })}`),
        escena(19.85, 22.8, `
          ${titulo(19.9, "¿Vos qué *hacías*? 👇")}
          <div class="fila" style="flex-wrap:wrap;gap:16px">${chip(20.6, "✋ Me planto")}${chip(20.75, "👆 Pido")}${chip(20.9, "🏳️ Me rindo")}</div>
          ${parr(21.4, "Comentalo y te digo si acertaste.")}`),
        final(23.05),
      ].join("");
    },
  },

  // 6. Regla de oro: ases y ochos, siempre se separan (con la jugada animada).
  "6-ases-y-ochos": {
    serie: "REGLA DE ORO",
    dur: 28.0,
    portada: 1.9,
    semilla: 51,
    html() {
      return [
        escena(0, 4.6, `
          ${titulo(0.1, "¿Por qué *siempre* se separan los *ases* y los *ochos*?", { paso: 0.06 })}
          <div class="fila" style="gap:16px">
            ${carta("Ah", 150, { de: 1.3, r: -6 })}${carta("As", 150, { de: 1.45, r: -2 })}${carta("8c", 150, { de: 1.6, r: 2 })}${carta("8d", 150, { de: 1.75, r: 6 })}
          </div>`),
        escena(4.85, 13.1, separar(4.9, {
          par: ["Ah", "As"], nuevas: ["Kd", "9c"], junto: "2 o 12", juntoTxt: "valen 2 o 12, una mano floja 😕",
          totales: ["21 🔥", "20"], titular: "Cada mano arranca con *11*: muchas chances de *21*",
        }), { gap: 26 }),
        escena(13.35, 21.6, separar(13.4, {
          par: ["8c", "8d"], nuevas: ["10s", "Qh"], junto: "16", juntoMalo: true, juntoTxt: "16, la peor mano 😬",
          totales: ["18", "18"], titular: "Dos manos con *8*: mucho mejor que un *16*",
        }), { gap: 26 }),
        escena(21.85, 24.9, `
          ${titulo(21.9, "Ases y ochos: / *siempre* se separan ✂️")}
          ${parr(23.0, "Seguí para <b>una jugada por día</b> 👇")}`),
        final(25.15),
      ].join("");
    },
  },

  // 7. ¿Mito o verdad?: el que cuenta cartas, ¿gana siempre?
  "7-mito-gana-siempre": {
    serie: "¿MITO O VERDAD?",
    dur: 28.1,
    portada: 4.8,
    semilla: 61,
    html() {
      const v = votacion(2.3, "MITO");
      // Una partida larga: sube y baja (rachas), pero a la larga termina arriba.
      const claves = [[0, 0], [8, 6], [18, -4], [30, -16], [38, -9], [46, -21], [55, -8], [64, -2], [72, -12], [84, 9], [92, 4], [100, 25]];
      const pts = [];
      for (let i = 0; i <= 100; i++) {
        const k = claves.findIndex(([x]) => x >= i);
        const [x1, y1] = claves[Math.max(0, k - 1)];
        const [x2, y2] = claves[k];
        const f = x2 === x1 ? 0 : (i - x1) / (x2 - x1);
        const y = y1 + (y2 - y1) * f + (i % 100 ? (rnd() * 2 - 1) * 2.6 : 0);
        pts.push([i * 8.6, 250 - y * 7.4]);
      }
      const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
      const tg = 12.7;
      const dg = 3.3;
      sfx(tg + 0.46 * dg, "error", { v: 0.6 });
      sfx(tg + dg + 0.1, "bien");
      return [
        escena(0, 6.4, `
          <div class="fila" style="gap:18px">
            ${["5h", "3c", "6d"].map((c, i) => `<div class="mano" style="gap:10px">${carta(c, 150, { de: 0.05 + i * 0.13 })}<span class="val mas" style="${an(A("pop", 0.85 + i * 0.15, 0.4, E.back))}">+1</span></div>`).join("")}
          </div>
          ${titulo(0.5, "¿El que cuenta cartas *gana siempre*?")}
          <div class="sobre">${v.html}${sello(v.fin + 0.25, "MITO")}</div>`),
        escena(6.65, 11.35, `
          <div class="nro" style="${an(A("pop", 6.7, 0.5, E.back))}">1</div>
          ${titulo(6.95, "La ventaja es *chica*", { tag: "h2" })}
          <h1 class="xl" style="${an(A("pop", 7.8, 0.5, E.back))}color:#e9b949">≈ 1%</h1>
          ${parr(8.5, "A favor, sí… pero <b>muy poquito</b>.")}`),
        `${(sfx(7.8, "pop"), "")}`,
        escena(11.6, 17.9, `
          <div class="nro" style="${an(A("pop", 11.65, 0.5, E.back))}">2</div>
          ${titulo(11.9, "Hay *rachas*: se pierde muchas veces", { tag: "h2" })}
          <div class="grafico" style="${an(A("entra", 12.4, 0.4))}">
            <svg viewBox="0 0 860 440" width="860" height="440"><line x1="0" y1="250" x2="860" y2="250" class="cero"/>
              <path d="${d}" pathLength="1" class="linea" style="${an(A("dibuja", tg, dg, E.lin))}"/></svg>
            <i class="cabeza" style="offset-path:path('${d}');${an(A("sigue", tg, dg, E.lin))}"></i>
            <span class="nota mala" style="left:300px;top:395px;${an(A("pop", tg + 0.46 * dg, 0.4, E.back))}">racha mala 😬</span>
            <span class="nota buena" style="right:-6px;top:6px;${an(A("pop", tg + dg + 0.1, 0.4, E.back))}">a la larga ↗</span>
          </div>`, { gap: 30 }),
        `${(sfx(tg, "subida", { d: dg, v: 0.45 }), "")}`,
        escena(18.15, 22.3, `
          <div class="nro" style="${an(A("pop", 18.2, 0.5, E.back))}">3</div>
          ${titulo(18.45, "Funciona *a la larga*, con práctica y disciplina", { tag: "h2", paso: 0.06 })}
          <div class="fila" style="flex-wrap:wrap;gap:16px">${chip(19.6, "🧠 Práctica")}${chip(19.85, "🎯 Disciplina")}${chip(20.1, "⏳ Paciencia")}</div>`),
        escena(22.55, 24.9, `
          ${titulo(22.6, "Es matemática, / no *magia*.")}
          ${parr(23.5, "¿Lo sabías? <b>Comentá</b> 👇")}`),
        final(25.15),
      ].join("");
    },
  },
};

export { VIDEOS };
