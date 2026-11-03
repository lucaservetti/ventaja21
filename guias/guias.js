// Interacción de las guías: la tabla de estrategia (tocar una casilla muestra la jugada y por qué)
// y el ejercicio de conteo Hi-Lo. Las páginas las arma tools/guias/armar.mjs.
(() => {
  // ---- Tabla de estrategia ----
  const datosEl = document.getElementById("g-datos");
  if (datosEl) {
    const D = JSON.parse(datosEl.textContent);
    const COLS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
    const tbody = document.querySelector(".g-grid tbody");
    const detalle = document.getElementById("detalle");
    let variante = "s17";
    let tab = "hard";
    let sel = null;
    const pintar = () => {
      const t = D.tabla[variante][tab];
      tbody.innerHTML = t
        .map(
          (fila, r) =>
            `<tr><th scope="row">${D.filas[tab][r]}</th>${fila
              .map(
                (c, k) =>
                  `<td><button type="button" class="g-cell c-${c.l}" data-r="${r}" data-k="${k}" aria-pressed="${!!sel && sel[0] === r && sel[1] === k}" aria-label="${D.filas[tab][r]} ${D.contra} ${COLS[k]}: ${D.acciones[c.l]}">${c.l}${c.s ? `<sub>${c.s}</sub>` : ""}</button></td>`,
              )
              .join("")}</tr>`,
        )
        .join("");
      if (sel) mostrar(sel[0], sel[1]);
    };
    const mostrar = (r, k) => {
      const c = D.tabla[variante][tab][r][k];
      detalle.innerHTML = `<div class="g-play"><i class="c-${c.l}">${c.l}</i>${D.filas[tab][r]} ${D.contra} ${COLS[k]}: ${D.acciones[c.l]}</div><p class="g-why">${c.w}</p>${c.s ? `<p class="g-small">${c.l}<sub>${c.s}</sub>: ${D.chicas[c.s]}</p>` : ""}`;
    };
    tbody.addEventListener("click", (e) => {
      const b = e.target.closest(".g-cell");
      if (!b) return;
      sel = [+b.dataset.r, +b.dataset.k];
      tbody.querySelectorAll(".g-cell").forEach((x) => x.setAttribute("aria-pressed", x === b));
      mostrar(sel[0], sel[1]);
    });
    document.querySelectorAll(".g-tabs button").forEach((b) =>
      b.addEventListener("click", () => {
        tab = b.dataset.tab;
        sel = null;
        detalle.innerHTML = detalle.dataset.vacio;
        document.querySelectorAll(".g-tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
        pintar();
      }),
    );
    document.querySelectorAll(".g-rules button").forEach((b) =>
      b.addEventListener("click", () => {
        variante = b.dataset.v;
        document.querySelectorAll(".g-rules button").forEach((x) => x.setAttribute("aria-checked", x === b));
        pintar();
      }),
    );
    detalle.dataset.vacio = detalle.innerHTML;
    pintar();
  }

  // ---- Ejercicio de conteo Hi-Lo ----
  const drill = document.getElementById("practica");
  if (drill) {
    const T = JSON.parse(drill.dataset.t);
    const PIP = {
      s: "M12 2.2c-2.6 3.9-8.3 7-8.3 11.4 0 2.6 2 4.5 4.4 4.5 1.5 0 2.7-.7 3.4-1.7-.3 2-1.2 3.6-2.6 5.1h6.2c-1.4-1.5-2.3-3.1-2.6-5.1.7 1 1.9 1.7 3.4 1.7 2.4 0 4.4-1.9 4.4-4.5 0-4.4-5.7-7.5-8.3-11.4z",
      h: "M12 21.3S2.7 15.5 2.7 9.1C2.7 6 5 3.6 7.9 3.6c1.8 0 3.3.9 4.1 2.3.8-1.4 2.3-2.3 4.1-2.3 2.9 0 5.2 2.4 5.2 5.5 0 6.4-9.3 12.2-9.3 12.2z",
      d: "M12 1.8c2.6 3.7 5.3 6.9 8.3 10.2-3 3.3-5.7 6.5-8.3 10.2-2.6-3.7-5.3-6.9-8.3-10.2 3-3.3 5.7-6.5 8.3-10.2z",
      c: "M12 2.4a4.4 4.4 0 0 0-4.1 6A4.4 4.4 0 1 0 10.9 15c-.3 2.4-1.3 4.4-2.9 6.6h8c-1.6-2.2-2.6-4.2-2.9-6.6a4.4 4.4 0 1 0 3-6.6 4.4 4.4 0 0 0-4.1-6z",
    };
    const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const valor = (r) => (["2", "3", "4", "5", "6"].includes(r) ? 1 : ["7", "8", "9"].includes(r) ? 0 : -1);
    const fmt = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
    const carta = (r, s) =>
      `<span class="g-card${s === "h" || s === "d" ? " red" : ""}" role="img" aria-label="${r}"><span class="g-rank${r === "10" ? " r10" : ""}">${r}</span><svg class="g-suit" viewBox="0 0 24 24" aria-hidden="true"><path d="${PIP[s]}"/></svg></span>`;
    const mesa = drill.querySelector(".g-drill-card");
    const num = drill.querySelector(".g-drill-n");
    const ask = drill.querySelector(".g-drill-ask");
    const input = drill.querySelector("input");
    const res = drill.querySelector(".g-drill-res");
    const start = drill.querySelector('[data-a="start"]');
    let cartas = [];
    let timer = 0;
    const lento = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1600 : 1100;
    const empezar = () => {
      clearInterval(timer);
      cartas = Array.from({ length: 10 }, () => [RANKS[Math.floor(Math.random() * 13)], "shdc"[Math.floor(Math.random() * 4)]]);
      res.innerHTML = "";
      ask.hidden = true;
      start.hidden = true;
      drill.classList.add("jugando");
      let i = 0;
      const sig = () => {
        if (i >= cartas.length) {
          clearInterval(timer);
          mesa.innerHTML = "";
          num.textContent = "";
          drill.classList.remove("jugando");
          ask.hidden = false;
          input.value = "";
          input.focus();
          return;
        }
        mesa.innerHTML = carta(cartas[i][0], cartas[i][1]);
        num.textContent = `${i + 1} / ${cartas.length}`;
        i++;
      };
      sig();
      timer = setInterval(sig, lento);
    };
    const comprobar = () => {
      const v = parseInt(input.value.replace("−", "-").replace(/\s/g, ""), 10);
      if (Number.isNaN(v)) return input.focus();
      const total = cartas.reduce((a, [r]) => a + valor(r), 0);
      let corrido = 0;
      const seq = cartas.map(([r]) => `<span>${r} → ${fmt((corrido += valor(r)))}</span>`).join("");
      res.innerHTML = `${v === total ? `<b class="ok">${T.bien}</b>` : `<b class="bad">${T.mal.replace("{0}", fmt(total))}</b>`}<p class="g-muted" style="margin:8px 0 0">${T.detalle}</p><div class="g-seq">${seq}</div>`;
      ask.hidden = true;
      start.textContent = T.otra;
      start.hidden = false;
    };
    start.addEventListener("click", empezar);
    drill.querySelector('[data-a="check"]').addEventListener("click", comprobar);
    input.addEventListener("keydown", (e) => e.key === "Enter" && comprobar());
  }
})();
