// Celebraciones: subir de rango, terminar una sección de Aprender y aprobar un nivel de la ruta de
// conteo. Se detectan comparando con lo ya celebrado (st.cele) y se muestran al volver a las
// pestañas, nunca en medio de una tanda o una lección (ver <Celebracion> en main.jsx).
import { LEVELS, getState, setState, subscribe } from "./state.js";
import { SECTIONS } from "./lessons/content.js";
import { COUNT_LEVELS } from "./engine/countPath.js";

const indiceRango = (rating) => {
  let i = 0;
  LEVELS.forEach((l, k) => {
    if (rating >= l.min) i = k;
  });
  return i;
};
const seccionesHechas = (st) =>
  SECTIONS.filter((s) =>
    s.lessons.every((l) => st.lessons[l.id] && st.lessons[l.id].done),
  ).map((s) => s.id);
const nivelesAprobados = (st) =>
  COUNT_LEVELS.filter(
    (l) => st.countPath && st.countPath.passed && st.countPath.passed[l.id],
  ).map((l) => l.n);

function foto(st) {
  return {
    r: indiceRango(st.rating.value),
    s: seccionesHechas(st),
    n: nivelesAprobados(st),
  };
}

// Qué hay para celebrar desde la última foto.
function nuevos(prev, st) {
  const ahora = foto(st);
  const out = [];
  if (ahora.r > prev.r) {
    const l = LEVELS[ahora.r];
    out.push({
      tipo: "rango",
      nivel: ahora.r,
      eyebrow: "Subiste de rango",
      titulo: l.name,
      sub: l.note,
      color: l.chip,
    });
  }
  for (const id of ahora.s)
    if (!prev.s.includes(id)) {
      const sec = SECTIONS.find((s) => s.id === id);
      const todas = ahora.s.length === SECTIONS.length;
      out.push({
        tipo: "seccion",
        eyebrow: todas
          ? "¡Terminaste todas las lecciones!"
          : `Sección ${id} completa`,
        titulo: sec.title,
        sub: todas
          ? `${SECTIONS.reduce((a, s) => a + s.lessons.length, 0)} lecciones. Ya sabes lo mismo que un contador de verdad.`
          : `${sec.lessons.length} lecciones terminadas. La sección ${id + 1} te espera.`,
      });
    }
  for (const n of ahora.n)
    if (!prev.n.includes(n)) {
      const nivel = COUNT_LEVELS.find((l) => l.n === n);
      const fin = n === COUNT_LEVELS.length;
      out.push({
        tipo: "nivel",
        eyebrow: fin ? "¡Completaste la ruta de conteo!" : "Ruta de conteo",
        titulo: `Nivel ${n} aprobado`,
        sub: fin
          ? "Ya llevas el conteo real de un zapato entero con la mesa llena."
          : nivel.title,
      });
    }
  // Lo ya celebrado no vuelve a celebrarse (el rango, aunque baje y vuelva a subir).
  const snap = {
    r: Math.max(prev.r, ahora.r),
    s: [...new Set([...prev.s, ...ahora.s])],
    n: [...new Set([...prev.n, ...ahora.n])],
  };
  return { snap, out };
}

function initCelebraciones() {
  const st = getState();
  // La primera vez se anota lo que ya había, sin celebrarlo.
  if (!st.cele || !Array.isArray(st.cele.s))
    setState((x) => ({ ...x, cele: { ...foto(x), pend: [] } }));
  subscribe(() => {
    const x = getState();
    if (!x.cele || !x.profile.onboarded) return;
    // Al terminar la bienvenida (que puede marcar secciones como hechas) se anota sin celebrar.
    if (!x.cele.ob)
      return setState((y) => ({
        ...y,
        cele: { ...foto(y), pend: [], ob: true },
      }));
    const { snap, out } = nuevos(x.cele, x);
    if (!out.length) return;
    // Mucho de golpe es un respaldo o el progreso de la cuenta: se anota sin celebrar.
    const pend =
      out.length > 2
        ? x.cele.pend || []
        : [...(x.cele.pend || []), ...out].slice(-3);
    setState((y) => ({ ...y, cele: { ...snap, ob: true, pend } }));
  });
}
function cerrarCelebracion() {
  setState((x) =>
    x.cele && x.cele.pend && x.cele.pend.length
      ? { ...x, cele: { ...x.cele, pend: x.cele.pend.slice(1) } }
      : x,
  );
}

export { cerrarCelebracion, foto, initCelebraciones, nuevos };
