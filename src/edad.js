// Control de edad: Edge 21 es para mayores de 18 (ver terminos.html). Antes de usar la app se
// pregunta el año de nacimiento, de forma neutra (no "¿eres mayor?", que invita a mentir).
// - No se guarda el año: solo el resultado, en este aparato ("ok" o "menor").
// - Si da menor, la app queda cerrada en este aparato (volver a contestar no cambia nada).
// - Hasta que no se confirma, no arrancan los anuncios ni las estadísticas.
// En las pruebas (localhost) se saltea, salvo que se pida con v21.edad = "1".
const K = "edge21.edad";
const LOCAL =
  typeof location !== "undefined" &&
  /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const avisar = new Set();

function leer(k) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function probando() {
  return LOCAL && leer("v21.edad") !== "1";
}
// "ok", "menor" o null (todavía no contestó).
function estadoEdad() {
  if (probando()) return "ok";
  const v = leer(K);
  return v === "ok" || v === "menor" ? v : null;
}
const edadOk = () => estadoEdad() === "ok";
const esMenor = () => estadoEdad() === "menor";

// Edad a partir del año y de si ya cumplió este año (solo hace falta cuando el año da justo 18).
function calcularEdad(anio, yaCumplio, hoy = new Date()) {
  const base = hoy.getFullYear() - anio;
  return yaCumplio ? base : base - 1;
}
function guardarEdad(edad) {
  const v = edad >= 18 ? "ok" : "menor";
  try {
    localStorage.setItem(K, v);
  } catch {
    // sin almacenamiento: vale para esta vez
  }
  if (v === "ok") for (const f of avisar) f();
  return v;
}
// Corre `f` cuando la edad esté confirmada (enseguida si ya lo está).
function cuandoEdadOk(f) {
  if (edadOk()) f();
  else avisar.add(f);
}

export { estadoEdad, edadOk, esMenor, calcularEdad, guardarEdad, cuandoEdadOk };
