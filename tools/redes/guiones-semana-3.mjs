// Semana 3 (jueves 12 al jueves 19 de noviembre): videos con el gancho nuevo.
// Lo que aprendimos con el anuncio (88 de cada 100 se iban antes de los 2 segundos):
// - el primer cuadro ya dice todo: la pregunta completa, nítida, y las cartas en la mesa (titulo con ya:true);
// - algo se mueve antes del segundo 1;
// - de 14 a 21 segundos, sin introducciones; el cierre dura 2 segundos;
// - temas de desafío mental y probabilidad: nada de "ilegal", "casino", "ganar" ni "plata".
// Cada video trae `voz`: lo que diría la narración y en qué segundo (se agrega cuando elijamos la voz).
import {
  A, an, E, escena, titulo, parr, chico, tag, punto, icono, ventana, carta,
  cuentaAtras, sello, confeti, final, sfx, rnd, opcion, barraTiempo, telefono,
} from "./motor.mjs";

const valor = (c) => {
  const r = c.slice(0, -1);
  return ["2", "3", "4", "5", "6"].includes(r) ? 1 : ["7", "8", "9"].includes(r) ? 0 : -1;
};
const signo = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
const tono = (n) => (n > 0 ? "mas" : n < 0 ? "menos" : "cero");
const reglas = (st = "") =>
  `<div class="fila" style="gap:12px;${st}"><span class="val mas">+1: 2 al 6</span><span class="val">0: 7, 8, 9</span><span class="val menos">−1: 10 al As</span></div>`;

// La respuesta de un desafío de memoria: el número grande, fichas, y la cuenta carta por carta.
function respuesta(de, cartas, { cols = 5, w = 104, paso = 0.12 } = {}) {
  const total = cartas.reduce((s, c) => s + valor(c), 0);
  sfx(de + 0.1, "ding");
  return `
    ${tag(de, "Respuesta", "verde", false)}
    <h1 class="xl" style="${an(A("pop", de + 0.1, 0.5, E.back))}color:#e9b949">${signo(total)}</h1>
    ${confeti(de + 0.15)}
    <div style="display:grid;grid-template-columns:repeat(${cols},${w}px);gap:14px 16px">
      ${cartas.map((c, i) => {
        const t = de + 0.7 + i * paso;
        sfx(t, "blip", { p: valor(c) > 0 ? 1.15 : valor(c) < 0 ? 0.8 : 0.95, v: 0.55 });
        return `<div class="mano" style="gap:8px;${an(A("pop", t, 0.35, E.back))}">${carta(c, w)}<span class="val ${tono(valor(c))}" style="font-size:30px">${signo(valor(c))}</span></div>`;
      }).join("")}
    </div>`;
}

const VIDEOS = {
  // Jueves 12 · Reemplaza a "¿gana siempre?". Desafío de memoria #2: la pregunta y las reglas desde el
  // primer cuadro, y la primera carta cae en el segundo 0,35.
  "1-desafio-memoria-2": {
    serie: "DESAFÍO DE MEMORIA #2",
    dur: 22.2,
    portada: 0.5,
    semilla: 112,
    voz: [
      [0.1, "¿Podés llevar la cuenta? Sumá uno del dos al seis, y restá uno del diez al As."],
      [8.2, "¿Cuánto te dio? Comentalo antes de ver la respuesta."],
      [12.2, "¡Más tres! ¿Acertaste?"],
      [15.9, "Practicalo gratis en Edge 21."],
    ],
    html() {
      const cartas = ["8d", "Qh", "4s", "2c", "Ac", "6h", "9s", "5d", "3h", "7c"];
      const t0 = 1.4;
      const paso = 0.95;
      return [
        escena(0, 10.6, `
          ${titulo(0, "10 cartas, una sola vez: / ¿podés llevar la *cuenta*? 🧠", { tag: "h2", ya: true, sonido: false })}
          ${reglas()}
          <div style="position:relative;width:880px;height:500px">
            ${carta(null, 330, { abs: true, r: -3, z: 0 })}
            ${cartas.map((c, i) => carta(c, 330, { abs: true, de: t0 + i * paso, x: Math.round((rnd() * 2 - 1) * 16), y: Math.round((rnd() * 2 - 1) * 10), r: +((rnd() * 2 - 1) * 6).toFixed(1), z: i + 1, dur: 0.45 })).join("")}
          </div>
          <div class="fila" style="gap:16px">
            ${cartas.map((_, i) => `<i class="punto-p" style="${an(A("enciende", t0 + i * paso + 0.2, 0.25))}"></i>`).join("")}
          </div>`, { gap: 30 }),
        escena(10.8, 15.0, `
          ${titulo(10.8, "¿Cuánto *te dio*?", { clase: "xl" })}
          ${parr(11.3, "Comentalo <b>antes</b> de ver la respuesta 👇")}
          ${cuentaAtras(11.8, 3)}`),
        `${(sfx(13.3, "subida", { d: 1.5, v: 0.7 }), "")}`,
        escena(15.2, 19.8, `
          ${respuesta(15.2, cartas)}
          ${titulo(17.6, "¿Acertaste? *Guardalo* 📌", { tag: "h3" })}`, { gap: 24 }),
        final(20.0),
      ].join("");
    },
  },

  // Viernes 13 · POV: 11 contra un 6. La respuesta (doblar) sorprende a los que piden.
  "2-pov-11-contra-6": {
    serie: "¿QUÉ HACÉS? #3",
    dur: 16.8,
    portada: 0.6,
    semilla: 113,
    voz: [
      [0.1, "Tenés once y el crupier muestra un seis. ¿Qué hacés?"],
      [6.3, "¡Doblás! Con once, cualquier diez o figura te da veintiuno."],
      [12.7, "¿Acertaste? Comentá."],
      [14.9, "Practicalo gratis en Edge 21."],
    ],
    html() {
      return [
        escena(0, 6.05, `
          <span class="tag">POV</span>
          ${titulo(0, "Tenés *11* y el crupier muestra un *6*", { tag: "h2", ya: true, sonido: false })}
          <div class="mano"><span class="lbl">Crupier</span><div class="fila" style="gap:16px">${carta("6c", 165)}${carta(null, 165, { de: 0.5 })}</div></div>
          <div class="mano"><span class="lbl">Vos</span><div class="fila" style="gap:16px">${carta("5h", 165, { de: 0.8 })}${carta("6d", 165, { de: 1.05 })}<span class="total" style="margin-left:14px;${an(A("pop", 1.5, 0.4, E.back))}">11</span></div></div>
          <div class="fila" style="gap:14px">${opcion(1.8, "PEDIR", 6.2)}${opcion(1.95, "PLANTARTE", 6.2)}${opcion(2.1, "DOBLAR", 6.2, true)}</div>
          ${cuentaAtras(2.7, 3, 130)}`, { gap: 22 }),
        escena(6.25, 12.5, `
          ${sello(6.3, "DOBLAR ✓", "real", "font-size:120px")}
          <div class="fila" style="gap:14px">${carta("5h", 200)}${carta("6d", 200)}${carta("Kc", 200, { de: 7.3, voltea: 7.7 })}</div>
          <div class="sobre" style="height:70px">${ventana(7.0, 8.2, `<span class="total">11</span>`)}${ventana(8.2, null, `<span class="total bueno">21 🔥</span>`)}</div>
          ${titulo(8.6, "Con 11, cualquier *10* o figura te da *21*", { tag: "h3", paso: 0.05 })}
          ${chico(10.0, "Doblar: pedís una sola carta más. Con 11 contra 2 a 10, siempre.")}`, { gap: 28 }),
        `${(sfx(8.25, "ding"), "")}`,
        escena(12.7, 14.6, `
          ${titulo(12.7, "¿Acertaste? *Comentá* 👇")}
          ${parr(13.3, "Y seguí para el <b>#4</b>")}`),
        final(14.8),
      ].join("");
    },
  },

  // Sábado 14 · Para juntar testers antes del 19 (si grabás el video con tu cara, va en lugar de este).
  "3-busco-testers": {
    serie: "BUSCO TESTERS",
    dur: 16.4,
    portada: 0.6,
    semilla: 114,
    voz: [
      [0.1, "Hice una app y necesito veinte personas que la prueben antes que nadie."],
      [4.6, "Es gratis y son dos minutos: tenés que tener Android, entrar a edge21 punto app y tocar Quiero ser tester."],
      [11.8, "¿Te sumás? Comentá yo."],
      [14.5, "Edge 21."],
    ],
    html() {
      return [
        escena(0, 4.4, `
          ${titulo(0, "Hice una app y necesito *20 personas* para probarla 🙏", { tag: "h2", ya: true, sonido: false })}
          <div class="fila" style="gap:0;align-items:flex-end;height:560px">
            ${telefono(-0.5, "/store/capturas/02.png", 250, -8, "margin-right:-30px;margin-bottom:20px")}
            ${telefono(-0.5, "/store/capturas/03.png", 290, 0, "z-index:2")}
            ${telefono(-0.5, "/store/capturas/05.png", 250, 8, "margin-left:-30px;margin-bottom:20px")}
          </div>`, { gap: 34 }),
                escena(4.6, 11.6, `
          ${titulo(4.6, "Es gratis y son *2 minutos*:", { tag: "h2" })}
          <div class="lista">
            ${punto(5.5, "1", "Tener un celular <b>Android</b> 📱")}
            ${punto(6.8, "2", "Entrar a <b>edge21.app</b>")}
            ${punto(8.1, "3", "Tocar <b>Quiero ser tester</b>")}
          </div>
          ${parr(9.4, "La probás <b>antes que nadie</b> y me decís qué mejorarías 🎁")}`, { gap: 30 }),
        escena(11.8, 14.2, `
          ${titulo(11.8, "¿Te sumás? / Comentá *YO* 👇")}
          ${chico(12.6, "Entrá a <b>edge21.app</b>")}`),
        final(14.4),
      ].join("");
    },
  },

  // Domingo 15 · ¿Qué es más probable? Tres duelos; el último sorprende.
  "4-que-es-mas-probable": {
    serie: "PROBABILIDAD",
    dur: 23.0,
    portada: 0.5,
    semilla: 115,
    voz: [
      [0.1, "¿Qué es más probable? Una figura, o un As."],
      [4.4, "¿Una carta roja, o una del dos al seis?"],
      [8.7, "¿Sacar veintiuno con las dos primeras cartas, o que salga el siete de corazones?"],
      [13.6, "¿Cuántas acertaste?"],
    ],
    html() {
      // Un duelo: dos lados, VS, una barrita de tiempo y la respuesta.
      const duelo = (de, izq, der, gana, pi, pd, nota = "") => {
        const rev = de + 3.6;
        sfx(rev, "ding");
        const lado = (x, pct, ok) => `
          <div class="lado" style="height:620px;padding:40px 18px;${an(A("pop", de ? de + (x.retraso || 0) : -0.5, 0.45, E.back), A(ok ? "enverdece" : "apaga", rev, 0.3, E.out, "forwards"))}">
            <h3>${x.texto}</h3>
            <div class="fila" style="gap:8px">${x.cartas.map((c) => carta(c, 112)).join("")}</div>
            <div class="sobre" style="height:100px">${ventana(rev, null, `<span class="pct" style="font-size:96px">${pct}</span>`)}</div>
          </div>`;
        return `
          <div class="duelo">
            ${lado(izq, pi, gana === 0)}
            <span class="vs-b" style="${an(A("pop", de ? de + 0.2 : -0.5, 0.4, E.back))}">VS</span>
            ${lado({ ...der, retraso: 0.1 }, pd, gana === 1)}
          </div>
          ${barraTiempo(de + 0.5, 3)}
          <div class="sobre" style="height:70px">${ventana(rev + 0.3, null, `<h3>${nota}</h3>`, "", "entra")}</div>`;
      };
      return [
        escena(0, 18.6, `${titulo(0, "¿Qué es *más probable*?", { tag: "h2", ya: true, sonido: false })}`, { estilo: "justify-content:flex-start;padding-top:10px", zoom: false, whoosh: false }),
        escena(0, 1.5, `${parr(-1, "3 rondas · <b>la última sorprende</b> 😮")}`, { estilo: "padding-top:120px", zoom: false, whoosh: false }),
        escena(1.6, 7.0, duelo(1.6, { texto: "Una figura", cartas: ["Jh", "Qs", "Kd"] }, { texto: "Un As", cartas: ["As"] }, 0, "23%", "8%", "La figura: <em>3 veces más</em>"), { estilo: "padding-top:150px", gap: 26 }),
        escena(7.2, 12.6, duelo(7.2, { texto: "Una carta roja", cartas: ["Kh", "5d"] }, { texto: "Del 2 al 6", cartas: ["2s", "4c", "6h"] }, 0, "50%", "38%", "La roja, pero <em>más cerca</em> de lo que parece"), { estilo: "padding-top:150px", gap: 26 }),
        escena(12.8, 18.6, duelo(12.8, { texto: "21 con 2 cartas", cartas: ["As", "Kd"] }, { texto: "El 7 de ♥", cartas: ["7h"] }, 0, "≈ 5%", "≈ 2%", "😮 El <em>21</em> sale más del doble") + confeti(16.45), { estilo: "padding-top:150px", gap: 26 }),
        escena(18.8, 20.8, `
          ${titulo(18.8, "¿Cuántas *acertaste*? 👇")}
          ${parr(19.4, "Comentá: <b>0, 1, 2 o 3</b>")}`),
        final(21.0),
      ].join("");
    },
  },

  // Lunes 16 · Pausá si podés: 20 cartas se dan vuelta rápido y se vuelven a tapar.
  "5-pausa-si-podes": {
    serie: "PAUSÁ SI PODÉS",
    dur: 15.4,
    portada: 4.9,
    semilla: 116,
    voz: [
      [0.1, "Pausá el video y contá. Si podés."],
      [6.7, "¿Cuánto te dio?"],
      [9.3, "¡Menos dos! Si no pausaste, volvé a mirarlo."],
      [13.5, "Edge 21."],
    ],
    html() {
      const cartas = ["Kh", "4s", "9d", "2c", "Js", "6h", "Ad", "8c", "3s", "10h", "Qc", "5d", "7s", "Ks", "2h", "9c", "Ah", "4d", "10s", "Jc"];
      const total = cartas.reduce((s, c) => s + valor(c), 0);
      const t0 = 0.6;
      const paso = 0.2;
      const tapa = 6.0;
      const otra = 9.3;
      sfx(tapa, "whoosh", { v: 0.7 });
      sfx(otra, "ding");
      return [
        escena(0, 8.9, `
          ${titulo(0, "*Pausá* y contá 👀", { ya: true, sonido: false })}
          ${reglas()}
          <div style="display:grid;grid-template-columns:repeat(5,128px);gap:12px 14px">
            ${cartas.map((c, i) => carta(c, 128, { voltea: [t0 + i * paso, tapa + (i % 5) * 0.03], vdur: 0.4, vvol: 0.45 })).join("")}
          </div>
          <div class="fila" style="height:120px;gap:24px">
            ${ventana(6.4, null, `<h2>¿Cuánto <em>te dio</em>?</h2>`, "", "pop")}
            ${cuentaAtras(6.9, 2, 110)}
          </div>`, { gap: 26, zoom: false }),
        `${(sfx(6.4, "pop"), "")}`,
        escena(9.1, 13.2, `
          ${tag(9.1, "Respuesta", "verde", false)}
          <h1 class="xl" style="${an(A("pop", 9.3, 0.5, E.back))}color:#e9b949">${signo(total)}</h1>
          ${confeti(9.35)}
          ${titulo(10.0, "¿No pausaste? *Miralo* de nuevo 🔁", { tag: "h2" })}
          ${chico(10.8, "Mandáselo a alguien que diga que tiene buena memoria")}`),
        final(13.4),
      ].join("");
    },
  },

  // Martes 17 · ¿Qué hacés? #4: A+6. Casi todos se plantan con 17… y no te podés pasar.
  "6-a-mas-6": {
    serie: "¿QUÉ HACÉS? #4",
    dur: 19.6,
    portada: 0.6,
    semilla: 117,
    voz: [
      [0.1, "Tenés As y seis. ¿Te plantás con diecisiete?"],
      [4.8, "¡No! Pedí: con As y seis no te podés pasar."],
      [12.0, "Guardalo y mandáselo a quien siempre se planta."],
      [14.3, "Practicalo gratis en Edge 21."],
    ],
    html() {
      return [
        escena(0, 7.6, `
          ${titulo(0, "Tenés *17*… / ¿pedirías otra carta? 🤔", { tag: "h2", ya: true, sonido: false })}
          <div class="fila" style="gap:16px">${carta("As", 270)}${carta("6h", 270)}</div>
          <span class="total" style="${an(A("pop", 1.3, 0.45, E.back))}">As + 6 = 7 o 17</span>
          <div class="fila" style="gap:14px">${opcion(2.1, "ME PLANTO", 7.7)}${opcion(2.3, "PIDO", 7.7, true)}</div>
          ${cuentaAtras(3.2, 4, 150)}`, { gap: 30 }),
        escena(7.8, 14.8, `
          ${sello(7.85, "¡PEDÍ!", "real", "font-size:130px")}
          ${titulo(8.6, "Con A+6 *no te podés pasar*", { tag: "h2" })}
          <div class="fila" style="gap:12px">${carta("As", 150)}${carta("6h", 150)}${carta("Kd", 150, { de: 10.0, voltea: 10.4 })}</div>
          <div class="sobre" style="height:70px">${ventana(9.6, 10.9, `<span class="total">7 o 17</span>`)}${ventana(10.9, null, `<span class="total bueno">17 · el As pasa a valer 1 😮</span>`)}</div>
          ${chico(12.0, "Contra 3, 4, 5 o 6, mejor todavía: doblá.")}`, { gap: 26 }),
        `${(sfx(10.95, "bien"), "")}`,
        escena(15.0, 17.4, `
          ${titulo(15.0, "*Guardalo* 📌 / y mandáselo a quien siempre se planta", { tag: "h2", paso: 0.05 })}`),
        final(17.6),
      ].join("");
    },
  },

  // Miércoles 18 · Desafío de memoria #3, con trampa: muchos 7, 8 y 9, cartas por toda la pantalla.
  "7-desafio-memoria-3": {
    serie: "DESAFÍO DE MEMORIA #3",
    dur: 21.0,
    portada: 0.5,
    semilla: 118,
    voz: [
      [0.1, "Desafío difícil: doce cartas, y tienen trampa."],
      [7.9, "¿Cuánto te dio?"],
      [11.7, "¡Más uno! Los sietes, ochos y nueves valen cero."],
      [15.7, "Edge 21."],
    ],
    html() {
      const cartas = ["7h", "9s", "3c", "8d", "Ks", "7c", "5h", "9d", "8s", "Ad", "2h", "7s"];
      const t0 = 1.3;
      const paso = 0.75;
      // Posiciones repartidas por la pantalla, sin pisarse demasiado.
      const pos = cartas.map((_, i) => {
        const col = i % 3;
        const fila = Math.floor(i / 3);
        return [(col - 1) * 270 + Math.round((rnd() * 2 - 1) * 30), (fila - 1.5) * 128 + Math.round((rnd() * 2 - 1) * 14), +((rnd() * 2 - 1) * 14).toFixed(1)];
      });
      return [
        escena(0, 10.4, `
          ${titulo(0, "Desafío *difícil* 😈 ¿cuánto suman?", { tag: "h2", ya: true, sonido: false })}
          ${reglas()}
          <div style="position:relative;width:880px;height:660px">
            ${carta(null, 180, { abs: true, r: 4, z: 0 })}
            ${cartas.map((c, i) => carta(c, 180, { abs: true, de: t0 + i * paso, x: pos[i][0], y: pos[i][1], r: pos[i][2], z: i + 1, dur: 0.42, desde: i % 2 ? [-950, -300, -38] : [950, -320, 38] })).join("")}
          </div>`, { gap: 26 }),
        escena(10.6, 14.4, `
          ${titulo(10.6, "¿Cuánto *te dio*?", { clase: "xl" })}
          ${parr(11.1, "Comentalo 👇 <b>sin mirar la respuesta</b>")}
          ${cuentaAtras(11.4, 3)}`),
        `${(sfx(12.9, "subida", { d: 1.5, v: 0.7 }), "")}`,
        escena(14.6, 18.6, `
          ${respuesta(14.6, cartas, { cols: 6, w: 100, paso: 0.1 })}
          ${chico(16.6, "La trampa: el 7, el 8 y el 9 valen 0")}`, { gap: 22 }),
        final(18.8),
      ].join("");
    },
  },

  // Jueves 19 · ¿Qué nivel tenés? Tres preguntas con tiempo, y el test completo en la app.
  "8-que-nivel-tenes": {
    serie: "TEST DE NIVEL",
    dur: 21.4,
    portada: 0.5,
    semilla: 119,
    voz: [
      [0.1, "¿Qué nivel tenés? Tres preguntas."],
      [2.1, "Uno: ¿cuánto vale un As?"],
      [6.7, "Dos: tenés doce contra un cuatro. ¿Qué hacés?"],
      [11.3, "Tres: con Hi-Lo, ¿cuánto suman estas cinco cartas?"],
      [16.0, "¿Cuántas acertaste? Comentá tu nivel."],
    ],
    html() {
      const pregunta = (de, n, html, ops, buena) => {
        const rev = de + 3.0;
        sfx(rev, "ding");
        return `
          <div class="nro" style="${an(A("pop", de, 0.45, E.back))}">${n}</div>
          ${html}
          <div class="fila" style="gap:14px;flex-wrap:wrap">${ops.map((o, i) => opcion(de + 0.4 + i * 0.12, o, rev, i === buena)).join("")}</div>
          ${barraTiempo(de + 0.8, 2, "width:80%")}`;
      };
      return [
        escena(0, 1.9, `
          ${titulo(0, "¿Qué *nivel* tenés? / 3 preguntas ⏱️", { ya: true, sonido: false })}
          <div class="fila" style="gap:12px">${opcion(0.3, "Principiante")}${opcion(0.45, "Intermedio")}${opcion(0.6, "Pro 🔥")}</div>`),
        escena(2.1, 6.5, pregunta(2.1, 1, `${titulo(2.15, "¿Cuánto vale un *As*?", { tag: "h2" })}${carta("Ah", 170)}`, ["1", "11", "1 u 11"], 2), { gap: 28 }),
        escena(6.7, 11.1, pregunta(6.7, 2, `${titulo(6.75, "*12* contra un *4*. ¿Qué hacés?", { tag: "h2" })}<div class="fila" style="gap:40px">${carta("4c", 130)}<span class="lbl">vs</span>${carta("10s", 130)}${carta("2d", 130)}</div>`, ["PEDIR", "PLANTARTE"], 1), { gap: 26 }),
        escena(11.3, 15.8, pregunta(11.3, 3, `${titulo(11.35, "Con Hi-Lo, ¿cuánto *suman*?", { tag: "h2" })}<div class="fila" style="gap:10px">${["Kh", "4s", "9d", "6c", "As"].map((c) => carta(c, 110)).join("")}</div>`, ["+1", "0", "−1"], 1), { gap: 26 }),
        escena(16.0, 19.2, `
          ${titulo(16.0, "¿Cuántas *acertaste*? 👇", { tag: "h2" })}
          <div class="lista">
            ${punto(16.6, "0–1", "Principiante 🌱", "cero")}
            ${punto(16.9, "2", "Intermedio 💪")}
            ${punto(17.2, "3", "Pro 🔥", "mas")}
          </div>
          ${chico(17.8, "El test completo, gratis, en Edge 21")}`, { gap: 26 }),
        final(19.4),
      ].join("");
    },
  },
};

export { VIDEOS };
