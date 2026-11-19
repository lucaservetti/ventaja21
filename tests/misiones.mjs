// Prueba de las misiones del día (src/misiones.js). Uso: node tests/misiones.mjs
import { cobrarMisiones, misionesDeHoy, prepararMisiones } from "../src/misiones.js";
import { dayKey, getState, setState } from "../src/state.js";

let f = 0;
const check = (c, m) => (c ? console.log("✓", m) : (f++, console.log("✗", m)));
const hoy = dayKey();
const ahora = Date.now();

// Alguien que recién empieza: sin conteo, todas las lecciones por hacer.
setState((s) => ({ ...s, profile: { ...s.profile, onboarded: true }, play: { ...s.play, hands: 7 } }));
prepararMisiones();
let st = getState();
check(st.misiones.dia === hoy && st.misiones.ids.length === 3, "prepara 3 misiones para hoy");
check(new Set(st.misiones.ids).size === 3, "no se repiten");
check(st.misiones.ids.includes("leccion"), "si recién empiezas, una es terminar una lección");
check(!st.misiones.ids.some((id) => id === "desafio" || id === "conteo"), "sin saber contar no pide ejercicios de conteo");
check(st.misiones.base.hands === 7, "guarda las manos de la mesa al empezar el día");
const ids = st.misiones.ids.join();
prepararMisiones();
check(getState().misiones.ids.join() === ids, "volver a abrir la app el mismo día no cambia las misiones");

let m = misionesDeHoy(getState());
check(m.hechas === 0 && !m.todas, "al principio no hay ninguna hecha");

// Las cumple todas, sea cual sea la combinación.
setState((s) => ({
  ...s,
  lessons: { l1: { done: true, best: 1, at: ahora } },
  train: { ...s.train, sessions: [{ t: ahora, n: 20, ok: 18 }] },
  play: { ...s.play, hands: 17 },
  daily: { ...s.daily, results: { [hoy]: { ok: true } } },
  drills: { ...s.drills, values: { sessions: [{ t: ahora }, { t: ahora }] } },
  dailyGoal: { ...s.dailyGoal, days: { [hoy]: { s: 9999, g: 600 } } },
}));
m = misionesDeHoy(getState());
check(m.todas && m.hechas === 3, "con todo hecho, las 3 quedan cumplidas");

const antes = getState().racha.protectores || 0;
check(cobrarMisiones() === true, "abrir el premio da un protector");
check(getState().racha.protectores === antes + 1, "suma el protector a la racha");
check(getState().misiones.completas === 1, "cuenta un día completo");
check(cobrarMisiones() === false && getState().racha.protectores === antes + 1, "no se puede cobrar dos veces el mismo día");

// Con 2 protectores no da más (pero igual cuenta el día).
setState((s) => ({ ...s, racha: { ...s.racha, protectores: 2 }, misiones: { ...s.misiones, cobrado: null } }));
check(cobrarMisiones() === false && getState().racha.protectores === 2, "con 2 protectores no da un tercero");

// Otro día: misiones nuevas y la base de manos se actualiza.
setState((s) => ({ ...s, misiones: { ...s.misiones, dia: "2000-01-01" } }));
check(misionesDeHoy(getState()) === null, "las misiones de otro día no valen hoy");
prepararMisiones();
check(getState().misiones.dia === hoy && getState().misiones.base.hands === 17, "al cambiar el día, prepara misiones nuevas");

console.log(f ? `misiones: ${f} fallaron` : "misiones: todo bien");
process.exit(f ? 1 : 0);
