// Misiones del día: 3 tareas cortas que cambian cada día, elegidas según lo que ya sabes.
// Si completas las 3, abres el premio del día: un protector de racha (si tienes menos de 2).
// El progreso sale de lo que ya guarda la app (lecciones, tandas, ejercicios, desafío diario); solo
// las manos de la mesa necesitan una foto del contador al empezar el día (base.hands).
import {
  MAX_PROTECTORES,
  dayKey,
  getState,
  goalMet,
  setState,
} from "./state.js";
import { LESSONS, sabeContar } from "./lessons/content.js";

const hoyDe = (t) => (t ? dayKey(new Date(t)) : null);

// Cada misión: qué se pide, cuánto y cómo se mide en un día.
const MISIONES = {
  leccion: {
    icon: "learn",
    need: 1,
    title: () => "Termina 1 lección",
    have: (st, d) =>
      Object.values(st.lessons || {}).filter((l) => l.done && hoyDe(l.at) === d)
        .length,
  },
  entrenar: {
    icon: "train",
    need: 20,
    title: () => "Responde 20 jugadas en Entrenar",
    have: (st, d) =>
      (st.train.sessions || [])
        .filter((s) => hoyDe(s.t) === d)
        .reduce((a, s) => a + (s.n || 0), 0),
  },
  mesa: {
    icon: "play",
    need: 10,
    title: () => "Juega 10 manos en la mesa",
    have: (st) => Math.max(0, (st.play.hands || 0) - (st.misiones.base.hands || 0)),
  },
  desafio: {
    icon: "bolt",
    need: 1,
    title: () => "Juega el desafío diario",
    have: (st, d) => (st.daily.results && st.daily.results[d] ? 1 : 0),
  },
  conteo: {
    icon: "drills",
    need: 2,
    title: () => "Haz 2 ejercicios de conteo",
    have: (st, d) =>
      Object.values(st.drills || {}).reduce(
        (a, k) => a + (k.sessions || []).filter((s) => hoyDe(s.t) === d).length,
        0,
      ),
  },
  meta: {
    icon: "clock",
    need: 1,
    title: (st) => `Cumple tu meta de ${st.dailyGoal.minutes} minutos`,
    have: (st, d) => (goalMet(st, d) ? 1 : 0),
  },
};

// Número fijo para cada día (así las misiones de hoy no cambian si cierras y abres la app).
function semilla(dia) {
  let h = 2166136261;
  for (const c of dia) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function elegir(st, dia) {
  let s = semilla(dia);
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const quedan = LESSONS.some((l) => !(st.lessons[l.id] && st.lessons[l.id].done));
  const cuenta = sabeContar(st);
  const pool = ["entrenar", "mesa", "meta", ...(cuenta ? ["desafio", "conteo"] : [])];
  const ids = [];
  // Mientras queden lecciones, casi siempre hay una (todos los días si recién empiezas).
  if (quedan && (!cuenta || rnd() < 0.7)) ids.push("leccion");
  while (ids.length < 3 && pool.length) ids.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return ids;
}

// Al abrir la app (y al volver a ella): si cambió el día, prepara las misiones nuevas.
function prepararMisiones() {
  const st = getState();
  const dia = dayKey();
  if (!st.profile.onboarded || (st.misiones && st.misiones.dia === dia)) return;
  setState((s) => ({
    ...s,
    misiones: {
      ...s.misiones,
      dia,
      ids: elegir(s, dia),
      base: { hands: s.play.hands || 0 },
      avisadas: {},
    },
  }));
}

function misionesDeHoy(st) {
  const m = st.misiones;
  if (!m || m.dia !== dayKey()) return null;
  const lista = m.ids
    .filter((id) => MISIONES[id])
    .map((id) => {
      const def = MISIONES[id];
      const have = Math.min(def.need, def.have(st, m.dia));
      return { id, icon: def.icon, title: def.title(st), have, need: def.need, done: have >= def.need };
    });
  const hechas = lista.filter((x) => x.done).length;
  return { lista, hechas, todas: hechas === lista.length && lista.length > 0, cobrado: m.cobrado === m.dia };
}

// Abre el premio del día. Devuelve true si te dio un protector.
function cobrarMisiones() {
  const st = getState();
  const hoy = misionesDeHoy(st);
  if (!hoy || !hoy.todas || hoy.cobrado) return false;
  const r = st.racha || {};
  const tiene = r.protectores || 0;
  const gana = tiene < MAX_PROTECTORES;
  setState((s) => ({
    ...s,
    racha: gana ? { ...s.racha, protectores: tiene + 1 } : s.racha,
    misiones: {
      ...s.misiones,
      cobrado: s.misiones.dia,
      completas: (s.misiones.completas || 0) + 1,
    },
  }));
  return gana;
}

export { MISIONES, cobrarMisiones, misionesDeHoy, prepararMisiones };
