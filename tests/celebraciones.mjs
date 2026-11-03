// Prueba de qué se celebra (src/celebraciones.js). Uso: node tests/celebraciones.mjs
import { foto, nuevos } from "../src/celebraciones.js";
import { SECTIONS } from "../src/lessons/content.js";

let f = 0;
const check = (c, m) => (c ? console.log("✓", m) : (f++, console.log("✗", m)));
const base = { rating: { value: 1000 }, lessons: {}, countPath: { passed: {} } };
const conLecciones = (ids) => ({ ...base, lessons: Object.fromEntries(ids.map((id) => [id, { done: true }])) });
const sec1 = SECTIONS[0].lessons.map((l) => l.id);

let prev = foto(base);
check(nuevos(prev, base).out.length === 0, "sin cambios no celebra nada");

let r = nuevos(prev, { ...base, rating: { value: 1105 } });
check(r.out.length === 1 && r.out[0].tipo === "rango" && r.out[0].titulo === "Ficha verde", "pasar 1100 celebra la Ficha verde");
r = nuevos(r.snap, { ...base, rating: { value: 1090 } });
check(r.out.length === 0, "bajar del rango no celebra nada");
r = nuevos(r.snap, { ...base, rating: { value: 1110 } });
check(r.out.length === 0, "volver a subir al mismo rango no se celebra dos veces");

r = nuevos(prev, conLecciones(sec1.slice(0, -1)));
check(r.out.length === 0, "a la sección le falta una lección: nada");
r = nuevos(prev, conLecciones(sec1));
check(r.out.length === 1 && r.out[0].tipo === "seccion" && r.out[0].eyebrow.includes("1"), "terminar la sección 1 se celebra");
check(nuevos(r.snap, conLecciones(sec1)).out.length === 0, "la misma sección no se celebra dos veces");

r = nuevos(prev, { ...base, countPath: { passed: { values: true } } });
check(r.out.length === 1 && r.out[0].titulo.includes("1"), "aprobar el nivel 1 de conteo se celebra");

const todo = conLecciones(SECTIONS.flatMap((s) => s.lessons.map((l) => l.id)));
r = nuevos(prev, todo);
check(r.out.some((x) => x.eyebrow.includes("todas")), "terminar todas las lecciones tiene su propio mensaje");

console.log(f ? `${f} falla(s)` : "celebraciones: todo bien");
process.exit(f ? 1 : 0);
