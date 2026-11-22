// Se inyecta en la página con AUDITAR=1 (ver run.mjs): mientras corren las pruebas, busca textos
// cortados con "…", textos que se salen de su caja y cosas que se salen de la pantalla.
(() => {
  const vistos = new Map();
  window.__auditoria = vistos;
  const nombre = (el) => {
    const c = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    return el.tagName.toLowerCase() + c;
  };
  const anota = (tipo, el) => {
    const txt = (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 60);
    const k = `${tipo} ${nombre(el)} "${txt}"`;
    if (!vistos.has(k)) vistos.set(k, location.hash || "");
  };
  // ¿Lo recorta algún contenedor a propósito (un carrusel, una lista con scroll)?
  const recortado = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.overflowX !== "visible" || s.overflowY !== "visible") return true;
    }
    return false;
  };
  const ESPANOL =
    /\b(crupier|mazos?|apuestas?|conteo|lecci[oó]n|lecciones|ejercicios?|manos?|tandas?|racha|jugadas?|pierdes|aquí|despu[eé]s|tambi[eé]n|cu[aá]nto|qué|ning[uú]n|elige|juega|entrenar|tienes|puedes|blandas?|plantarte|plántate|rendirse|ajustes)\b|ñ(?!ol)| y /i;
  // ¿Lo tapa otra cosa? Se mira el centro del elemento: tiene que estar el elemento (o algo suyo).
  const tapado = (el, r) => {
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
    const arriba = document.elementFromPoint(x, y);
    return arriba && !el.contains(arriba) && !arriba.contains(el);
  };
  function tapas() {
    // Una pantalla con una hoja o un modal abierto tiene que quedar por encima de la barra de pestañas
    // (en el iPhone, si no, la barra la tapa) y nada de lo que tiene puede quedar tapado.
    const barraZ = +getComputedStyle(document.querySelector("nav.tabbar") || document.body).zIndex || 0;
    for (const w of document.querySelectorAll(".sheet-wrap, .modal-wrap")) {
      const capa = w.closest(".layer");
      if (capa && !(+getComputedStyle(capa).zIndex > barraZ)) anota("hoja debajo de la barra de pestañas", w);
    }
    const abierta = [...document.querySelectorAll(".sheet-wrap:not(.closing) .sheet, .modal-wrap .modal")].pop();
    if (abierta) {
      for (const el of abierta.querySelectorAll("button, a, input, h2, p, .li-title")) {
        const r = el.getBoundingClientRect();
        const caja = abierta.querySelector(".sheet-body") || abierta;
        const cb = caja.getBoundingClientRect();
        // Solo lo que está dentro de la parte visible de la hoja (lo demás se ve al bajar).
        if (!r.width || r.top < cb.top || r.bottom > cb.bottom) continue;
        if (tapado(el, r)) anota("tapado en la hoja", el);
      }
      return;
    }
    // En la pantalla de arriba, ya bajada hasta el fondo: nada tapado por la barra de pestañas.
    const capa = [...document.querySelectorAll(".layer")].filter((x) => !x.hidden && x.offsetParent !== null).pop();
    const barra = document.querySelector("nav.tabbar");
    if (!capa || !barra || !capa.classList.contains("with-tabbar")) return;
    if (capa.scrollTop + capa.clientHeight < capa.scrollHeight - 2) return;
    for (const el of capa.querySelectorAll("button, a, input")) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || el.closest(".float-cta")) continue;
      if (tapado(el, r) && barra.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))) anota("tapado por la barra de pestañas", el);
    }
  }
  function revisar() {
    tapas();
    // Campos de texto con letra de menos de 16 px: en el iPhone, Safari hace zoom al tocarlos.
    for (const el of document.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select"))
      if (el.offsetParent && parseFloat(getComputedStyle(el).fontSize) < 16) anota("campo que hace zoom en el iPhone", el);
    const W = innerWidth;
    if (document.documentElement.scrollWidth > W + 1) anota("la página se mueve a los costados", document.documentElement);
    for (const el of document.querySelectorAll("body *")) {
      if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || +s.opacity === 0) continue;
      if (el.closest("[hidden], [aria-hidden='true'], .sr-only, svg")) continue;
      const tieneTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (tieneTexto && (s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none")) {
        const corta = s.webkitLineClamp !== "none" ? el.scrollHeight > el.clientHeight + 2 : el.scrollWidth > el.clientWidth + 1;
        if (corta) anota("texto cortado", el);
      } else if (tieneTexto && s.overflowX === "visible" && el.scrollWidth > el.clientWidth + 2 && s.display !== "inline") {
        anota("texto que se sale de su caja", el);
      }
      if ((r.right > W + 1 || r.left < -1) && s.position !== "fixed" && !recortado(el)) anota("se sale de la pantalla", el);
      // En portugués: palabras que solo existen en español (texto que quedó sin traducir).
      if (tieneTexto && document.documentElement.lang === "pt") {
        const t = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ");
        if (ESPANOL.test(t)) anota("en español", el);
      }
    }
  }
  window.__revisar = () => {
    try {
      revisar();
    } catch {}
  };
  setInterval(window.__revisar, 1000);
})();
