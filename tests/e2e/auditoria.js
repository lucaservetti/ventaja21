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
  function revisar() {
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
        if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) anota("texto cortado", el);
      } else if (tieneTexto && s.overflowX === "visible" && el.scrollWidth > el.clientWidth + 2 && s.display !== "inline") {
        anota("texto que se sale de su caja", el);
      }
      if ((r.right > W + 1 || r.left < -1) && s.position !== "fixed" && !recortado(el)) anota("se sale de la pantalla", el);
    }
  }
  setInterval(() => {
    try {
      revisar();
    } catch {}
  }, 350);
})();
