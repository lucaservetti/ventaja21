// Prueba de qué recordatorios se programan (src/recordatorios-plan.js). Uso: node tests/recordatorios.mjs
import { planRecordatorios, tipoFrecuencia } from "../src/recordatorios-plan.js";

let f = 0;
function check(c, msg) {
  if (!c) (f++, console.log("✗", msg));
  else console.log("✓", msg);
}
// Martes 3 de noviembre de 2026, 10:00 (hora local).
const martes10 = new Date(2026, 10, 3, 10, 0);
const todos = [0, 1, 2, 3, 4, 5, 6];
const prac = (p) => p.filter((n) => n.id < 2000);
const racha = (p) => p.filter((n) => n.id >= 2000);

check(planRecordatorios({ on: false, dias: todos }, { hoyHecho: false, racha: 5 }, martes10).length === 0, "apagados: no programa nada");

let p = planRecordatorios({ on: true, dias: todos, hora: "19:00" }, { hoyHecho: false, racha: 0 }, martes10);
check(prac(p).length === 14, "todos los días: 14 recordatorios (hoy y los 13 siguientes)");
check(prac(p)[0].at.getDate() === 3 && prac(p)[0].at.getHours() === 19, "el primero es hoy a las 19:00");
check(racha(p).length === 0, "sin racha (0 días): no hay aviso de racha");

p = planRecordatorios({ on: true, dias: todos, hora: "19:00" }, { hoyHecho: true, racha: 4 }, martes10);
check(prac(p)[0].at.getDate() === 4, "si hoy ya practicó, hoy no sale: el primero es mañana");
check(racha(p).length === 1 && racha(p)[0].at.getDate() === 4 && racha(p)[0].at.getHours() === 21, "practicó hoy con racha: el aviso de racha queda para mañana a las 21");
check(racha(p)[0].title.includes("4"), "el aviso dice cuántos días de racha lleva");

p = planRecordatorios({ on: true, dias: todos, hora: "19:00", racha: true }, { hoyHecho: false, racha: 6 }, martes10);
check(racha(p).length === 1 && racha(p)[0].at.getDate() === 3, "no practicó hoy y tiene racha: aviso hoy a las 21");

p = planRecordatorios({ on: true, dias: todos, hora: "19:00", racha: false }, { hoyHecho: false, racha: 6 }, martes10);
check(racha(p).length === 0, "con el aviso de racha apagado no sale");

p = planRecordatorios({ on: true, dias: todos, hora: "08:00" }, { hoyHecho: false, racha: 0 }, martes10);
check(prac(p)[0].at.getDate() === 4, "si la hora de hoy ya pasó, empieza mañana");

p = planRecordatorios({ on: true, dias: [1, 2, 3, 4, 5], hora: "19:00" }, { hoyHecho: false, racha: 0 }, martes10);
check(prac(p).every((n) => n.at.getDay() >= 1 && n.at.getDay() <= 5), "lunes a viernes: nunca el fin de semana");
check(prac(p).length === 10, "lunes a viernes: 10 en dos semanas");

p = planRecordatorios({ on: true, dias: [0], hora: "11:30" }, { hoyHecho: false, racha: 0 }, martes10);
check(prac(p).length === 2 && prac(p).every((n) => n.at.getDay() === 0 && n.at.getHours() === 11 && n.at.getMinutes() === 30), "una vez por semana (domingo 11:30): 2 en dos semanas");

p = planRecordatorios({ on: true, dias: todos, hora: "23:30" }, { hoyHecho: false, racha: 3 }, martes10);
check(racha(p)[0].at.getHours() === 23, "si el recordatorio es tarde, el de racha va después y nunca pasa de las 23");

p = planRecordatorios({ on: true, dias: todos, hora: "hola" }, { hoyHecho: false, racha: 0 }, martes10);
check(prac(p)[0].at.getHours() === 19, "una hora mal guardada usa las 19:00");

check(new Set(planRecordatorios({ on: true, dias: todos, hora: "19:00" }, { hoyHecho: false, racha: 9 }, martes10).map((n) => n.id)).size === 15, "cada recordatorio tiene su número propio");

check(tipoFrecuencia(todos) === "todos" && tipoFrecuencia([5, 4, 3, 2, 1]) === "semana" && tipoFrecuencia([3]) === "semanal" && tipoFrecuencia([1, 3]) === "elegir", "reconoce la frecuencia elegida");

console.log(f ? `${f} falla(s)` : "recordatorios: todo bien");
process.exit(f ? 1 : 0);
