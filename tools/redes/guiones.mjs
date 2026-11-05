// Guiones de los videos cortos (los graba tools/redes/videos.mjs). Cada video es HTML con
// animaciones CSS que arrancan en un segundo dado. Reglas para que retengan:
// - el gancho (la pregunta) en el primer segundo, sin logo ni saludo;
// - de 11 a 17 segundos;
// - texto grande, porque casi todos miran sin sonido;
// - un pedido al final: comentar, guardar o seguir;
// - nada de "casino", "apuesta", "plata" ni "dinero" (TikTok los castiga): cartas, lógica, probabilidad.

const SUIT = {
  s: '<path d="M12 2C9 6 3 9 3 14c0 3 2.5 5 5 5 1.5 0 2.7-.6 3.3-1.5L10 22h4l-1.3-4.5c.6.9 1.8 1.5 3.3 1.5 2.5 0 5-2 5-5 0-5-6-8-9-12z"/>',
  h: '<path d="M12 21.5s-7.5-4.6-9.8-9.3C.4 8.3 2.8 4 6.7 4c2.4 0 4 1.4 5.3 3.3C13.3 5.4 14.9 4 17.3 4c3.9 0 6.3 4.3 4.5 8.2C19.5 16.9 12 21.5 12 21.5z"/>',
  d: '<path d="M12 1.5 21 12l-9 10.5L3 12z"/>',
  c: '<circle cx="12" cy="6.8" r="4.4"/><circle cx="6.6" cy="13.2" r="4.4"/><circle cx="17.4" cy="13.2" r="4.4"/><path d="M10.6 13h2.8l1.6 9H9z"/>',
};
const suit = (s, size) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor">${SUIT[s]}</svg>`;
// Una carta ("10s", "Ah"…), de `tam` px de ancho; `st` suma estilos (por ejemplo, su animación).
function carta(c, tam = 150, st = "") {
  const r = c.slice(0, -1);
  const s = c.slice(-1);
  const roja = s === "h" || s === "d";
  return `<div class="carta${roja ? " roja" : ""}" style="width:${tam}px;height:${tam * 1.4}px;${st}"><b style="font-size:${tam * 0.36}px">${r}</b><span class="p1">${suit(s, tam * 0.24)}</span><span class="p2">${suit(s, tam * 0.5)}</span></div>`;
}
const dorso = (tam = 150, st = "") => `<div class="carta dorso" style="width:${tam}px;height:${tam * 1.4}px;${st}"></div>`;
// Aparece en `de` segundos y, si hay `hasta`, se va en ese momento.
function anim(de, hasta = null, tipo = "entra", dur = 0.45) {
  const a = [`${tipo} ${dur}s cubic-bezier(.2,.8,.2,1) ${de}s both`];
  if (hasta != null) a.push(`sale .3s ease ${hasta}s forwards`);
  return `animation:${a.join(",")}`;
}
const capa = (de, hasta, html, extra = "") => `<div class="capa" style="${anim(de, hasta)};${extra}">${html}</div>`;
// Cuenta regresiva de 3 segundos con barra que se achica.
function cuenta(de) {
  return `<div style="position:relative;width:100%;height:240px">
    <div class="barra" style="${anim(de, de + 3)}"><i style="animation:achica 3s linear ${de}s both"></i></div>
    ${[3, 2, 1].map((n, i) => `<div class="cuenta" style="position:absolute;inset:0;display:grid;place-items:center;opacity:0;animation:flash 1s linear ${de + i}s both">${n}</div>`).join("")}
  </div>`;
}
// Cierre de todos los videos.
const final = (de, frase = "Practicalo gratis en Edge 21") =>
  capa(
    de,
    null,
    `<img class="logo" src="/img/ficha.svg" style="${anim(de, null, "pop", 0.5)}">
     <h2 style="${anim(de + 0.15)}">${frase}</h2>
     <div class="cta" style="${anim(de + 0.35, null, "pop", 0.5)}">Link en el perfil</div>
     <p class="chico" style="${anim(de + 0.55)}">Lecciones, desafío diario y práctica sin dinero</p>`,
  );
const item = (de, signo, texto) => `<div class="item" style="${anim(de)}"><b>${signo}</b><span>${texto}</span></div>`;

const VIDEOS = {
  // 1. Quiz: la respuesta sorprende (casi todos se plantan).
  "1-quiz-12-contra-2": {
    serie: "¿SABÉS JUGAR ESTA MANO? #2",
    dur: 14.5,
    portada: 1.6,
    html: [
      capa(0, 5.4, `
        <h2 style="${anim(0.1)}">Tenés <em>12</em> y el crupier muestra un <em>2</em></h2>
        <div class="fila" style="gap:70px">
          <div class="mano"><span class="lbl">Crupier</span><div class="fila" style="gap:12px">${carta("2c", 170, anim(0.35, null, "carta", 0.5))}${dorso(170, anim(0.5, null, "carta", 0.5))}</div></div>
          <div class="mano"><span class="lbl">Vos</span><div class="fila" style="gap:12px">${carta("10s", 170, anim(0.7, null, "carta", 0.5))}${carta("2d", 170, anim(0.85, null, "carta", 0.5))}</div><span class="total" style="${anim(1.1)}">12</span></div>
        </div>
        <div class="ops" style="${anim(1.3)}"><span class="op">PEDIR</span><span class="op">PLANTARTE</span></div>
        ${cuenta(2.2)}`),
      capa(5.4, 12.6, `
        <div class="ops" style="${anim(5.4, null, "pop")}"><span class="op ok">PEDIR ✓</span><span class="op no">PLANTARTE</span></div>
        <h2 style="${anim(5.9)}">Contra un <em>2 o un 3</em>, con 12 se pide</h2>
        <div class="caja" style="${anim(6.6)}"><p>Al crupier todavía le cuesta pasarse. Contra <b>4, 5 y 6</b>, ahí sí: te plantás.</p></div>
        <h2 style="${anim(9.6, null, "pop")}">¿Acertaste? <em>Comentá</em> 👇</h2>`),
      final(12.6),
    ].join(""),
  },

  // 2. Desafío de memoria: 10 cartas, ¿cuánto da? (la respuesta al final; se mira dos veces).
  "2-desafio-memoria": {
    serie: "DESAFÍO DE MEMORIA",
    dur: 19,
    portada: 1.2,
    html: (() => {
      const cartas = ["5h", "Ks", "3d", "9c", "6s", "Ah", "2c", "10d", "4h", "7s"];
      const val = (c) => {
        const r = c.slice(0, -1);
        return ["2", "3", "4", "5", "6"].includes(r) ? 1 : ["7", "8", "9"].includes(r) ? 0 : -1;
      };
      const t0 = 3.8;
      const paso = 0.75;
      const fin = t0 + cartas.length * paso;
      return [
        capa(0, t0, `
          <h1 style="${anim(0.1)}">¿Podés llevar la <em>cuenta</em>?</h1>
          <div class="lista" style="width:86%">
            ${item(0.6, "+1", "2, 3, 4, 5 y 6")}
            ${item(0.9, "0", "7, 8 y 9")}
            ${item(1.2, "−1", "10, figuras y As")}
          </div>
          <p style="${anim(1.8)}">Sumá cada carta. <b>Son 10.</b></p>`),
        `<div class="capa" style="${anim(t0, fin)}">
          <div style="position:relative;width:360px;height:504px">
            ${cartas.map((c, i) => `<div style="position:absolute;inset:0;${anim(t0 + i * paso, t0 + (i + 1) * paso - 0.05, "carta", 0.3)}">${carta(c, 360)}</div>`).join("")}
          </div>
          <div class="lbl" style="position:relative;height:40px;width:300px">${cartas.map((_, i) => `<span style="position:absolute;inset:0;${anim(t0 + i * paso, t0 + (i + 1) * paso - 0.05, "entra", 0.01)}">${i + 1} de 10</span>`).join("")}</div>
        </div>`,
        capa(fin, fin + 3, `
          <h1 class="xl" style="${anim(fin, null, "pop")}">¿Cuánto <em>te dio</em>?</h1>
          <p style="${anim(fin + 0.3)}">Comentalo antes de ver la respuesta 👇</p>
          ${cuenta(fin)}`),
        capa(fin + 3, null, `
          <span class="tag verde" style="${anim(fin + 3, null, "pop")}">Respuesta</span>
          <h1 class="xl" style="${anim(fin + 3.1, null, "pop")}"><em>+2</em></h1>
          <div class="fila" style="flex-wrap:wrap;gap:14px;max-width:900px">
            ${cartas.map((c, i) => `<div class="mano" style="gap:8px;${anim(fin + 3.4 + i * 0.12)}">${carta(c, 80)}<span class="v ${val(c) > 0 ? "mas" : val(c) < 0 ? "menos" : "cero"}" style="font-size:34px">${val(c) > 0 ? "+1" : val(c) < 0 ? "−1" : "0"}</span></div>`).join("")}
          </div>
          <p style="${anim(fin + 5)}">¿Acertaste? <b>Guardalo y probá otra vez</b> 📌</p>`),
      ].join("");
    })(),
  },

  // 3. Mito o verdad: ¿contar cartas es ilegal?
  "3-mito-ilegal": {
    serie: "¿MITO O VERDAD?",
    dur: 13.5,
    portada: 1.4,
    html: [
      capa(0, 4.3, `
        <div class="fila" style="gap:0">${carta("Kh", 170, `${anim(0.1, null, "carta", 0.5)};transform:rotate(-10deg)`)}${carta("As", 190, anim(0.25, null, "carta", 0.5))}${carta("10d", 170, anim(0.4, null, "carta", 0.5))}</div>
        <h1 style="${anim(0.6)}">¿Contar cartas es <em>ilegal</em>?</h1>
        <div class="sello mito" style="animation:sello .5s cubic-bezier(.2,.8,.2,1) 2.4s both">MITO</div>`),
      capa(4.3, 11.5, `
        <span class="tag rojo" style="${anim(4.3, null, "pop")}">Mito</span>
        <div class="lista">
          ${item(4.6, "✓", "Contar con la cabeza <b>es legal</b>: es memoria y matemática.")}
          ${item(5.6, "✗", "Lo prohibido es usar <b>aparatos o ayuda</b> en la mesa.")}
          ${item(6.6, "!", "En muchos lugares pueden pedirte que <b>no juegues más</b>: es su regla, no la ley.")}
        </div>
        <h2 style="${anim(8.6, null, "pop")}">¿Lo sabías? <em>Comentá</em> 👇</h2>`),
      final(11.5),
    ].join(""),
  },

  // 4. Probabilidad: chance de pasarte según tu mano (para guardar).
  "4-chance-de-pasarte": {
    serie: "PROBABILIDAD",
    dur: 15,
    portada: 3.8,
    html: (() => {
      const filas = [
        [12, 31], [13, 38], [14, 46], [15, 54], [16, 62], [17, 69], [18, 77], [19, 85], [20, 92],
      ];
      const color = (p) => (p < 45 ? "#46c47f" : p < 65 ? "#e9b949" : "#ff6b5c");
      return [
        capa(0, 12.8, `
          <h2 style="${anim(0.1)}">Si pedís otra carta, ¿qué chance tenés de <em>pasarte</em>?</h2>
          <div class="bars">
            ${filas.map(([t, p], i) => `<div class="bar" style="${anim(1.2 + i * 0.35)}"><span>${t}</span><span class="t"><i style="width:${p}%;background:${color(p)};animation:crece .6s cubic-bezier(.2,.8,.2,1) ${1.3 + i * 0.35}s both"></i></span><span style="color:${color(p)}">${p}%</span></div>`).join("")}
          </div>
          <div class="caja" style="${anim(5.2)}"><p>Con <b>12</b>, solo 31%. Con <b>16</b>, 62%. Por eso con 12 a veces se pide y con 17, nunca.</p></div>
          <p class="chico" style="${anim(5.6)}">Valores aproximados, con un mazo completo.</p>
          <h2 style="${anim(8.8, null, "pop")}">Guardalo para la próxima 📌</h2>`),
        final(12.8),
      ].join("");
    })(),
  },

  // 5. La peor mano: 16 contra un 10.
  "5-la-peor-mano": {
    serie: "LA PEOR MANO",
    dur: 14,
    portada: 1.4,
    html: [
      capa(0, 4.2, `
        <h1 style="${anim(0.1)}"><em>16</em> contra un <em>10</em></h1>
        <div class="fila" style="gap:70px">
          <div class="mano"><span class="lbl">Crupier</span>${carta("10d", 150, anim(0.4, null, "carta", 0.5))}</div>
          <div class="mano"><span class="lbl">Vos</span><div class="fila" style="gap:12px">${carta("10s", 150, anim(0.6, null, "carta", 0.5))}${carta("6h", 150, anim(0.75, null, "carta", 0.5))}</div></div>
        </div>
        <p style="${anim(1.3)}">La mano que más pierde. <b>¿Qué hacés?</b></p>`),
      capa(4.2, 12, `
        <div class="lista">
          ${item(4.3, "✗", "<b>Plantarte:</b> perdés la mayoría de las veces.")}
          ${item(5.3, "✓", "<b>Pedir:</b> también perdés seguido, pero un poco menos.")}
          ${item(6.3, "✓✓", "<b>Rendirte</b>, si la mesa lo permite: perdés solo la mitad.")}
        </div>
        <div class="caja" style="${anim(8)}"><p>No hay jugada que gane. La idea es <b>perder lo menos posible</b>: eso es estrategia.</p></div>
        <h2 style="${anim(10, null, "pop")}">¿Vos qué hacías? 👇</h2>`),
      final(12),
    ].join(""),
  },

  // 6. Siempre: separar ases y ochos.
  "6-ases-y-ochos": {
    serie: "REGLA DE ORO",
    dur: 15,
    portada: 1.3,
    html: [
      capa(0, 3.2, `
        <h1 style="${anim(0.1)}">¿Por qué <em>siempre</em> se separan los <em>ases</em> y los <em>ochos</em>?</h1>
        <div class="fila">${carta("Ah", 140, anim(0.6, null, "carta", 0.5))}${carta("As", 140, anim(0.75, null, "carta", 0.5))}${carta("8c", 140, anim(0.9, null, "carta", 0.5))}${carta("8d", 140, anim(1.05, null, "carta", 0.5))}</div>`),
      capa(3.2, 7.6, `
        <div class="fila">${carta("Ah", 160, anim(3.3, null, "carta", 0.4))}${carta("As", 160, anim(3.4, null, "carta", 0.4))}</div>
        <p style="${anim(3.8)}">Juntos valen <b>2 o 12</b>: una mano floja.</p>
        <span class="tag" style="${anim(4.6, null, "pop")}">Separados</span>
        <h2 style="${anim(5)}">Dos manos que arrancan con <em>11</em>: muchas chances de <em>21</em></h2>`),
      capa(7.6, 12.6, `
        <div class="fila">${carta("8c", 160, anim(7.7, null, "carta", 0.4))}${carta("8d", 160, anim(7.8, null, "carta", 0.4))}</div>
        <p style="${anim(8.2)}">Juntos valen <b>16</b>: la peor mano que hay.</p>
        <span class="tag" style="${anim(9, null, "pop")}">Separados</span>
        <h2 style="${anim(9.4)}">Dos manos que arrancan con <em>8</em>: mucho mejor</h2>
        <h2 style="${anim(11, null, "pop")}">Seguí para más 👇</h2>`),
      final(12.6),
    ].join(""),
  },

  // 7. Mito o verdad: ¿el que cuenta cartas gana siempre?
  "7-mito-gana-siempre": {
    serie: "¿MITO O VERDAD?",
    dur: 13.5,
    portada: 1.4,
    html: [
      capa(0, 4.3, `
        <div class="fila">${carta("5h", 150, anim(0.1, null, "carta", 0.5))}${carta("3c", 150, anim(0.25, null, "carta", 0.5))}${carta("6d", 150, anim(0.4, null, "carta", 0.5))}</div>
        <h1 style="${anim(0.6)}">¿El que cuenta cartas <em>gana siempre</em>?</h1>
        <div class="sello mito" style="animation:sello .5s cubic-bezier(.2,.8,.2,1) 2.4s both">MITO</div>`),
      capa(4.3, 11.5, `
        <span class="tag rojo" style="${anim(4.3, null, "pop")}">Mito</span>
        <div class="lista">
          ${item(4.6, "1", "La ventaja es <b>chica</b>: alrededor de un 1%.")}
          ${item(5.6, "2", "En el camino se pierde <b>muchas veces</b>: hay rachas.")}
          ${item(6.6, "3", "Funciona <b>a la larga</b>, con práctica y disciplina.")}
        </div>
        <h2 style="${anim(8.6, null, "pop")}">¿Lo sabías? <em>Comentá</em> 👇</h2>`),
      final(11.5),
    ].join(""),
  },
};

export { VIDEOS, anim, carta };
