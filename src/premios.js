// Premios: días de Premium de regalo. Lo usan la app (para mostrarlos) y el servidor
// (servidor/index.js), que es el único que los da: así nadie se los puede dar solo.

// Cada premio se gana una sola vez, menos el podio, que es uno por semana.
const PREMIOS = [
  // Por entrar con la cuenta de Google: una vez por cuenta, y no cuenta para el tope.
  { id: "bienvenida", dias: 3, meta: 1 },
  { id: "racha7", dias: 2, meta: 7 },
  { id: "racha30", dias: 7, meta: 30 },
  { id: "podio", dias: 2, meta: 3 },
  { id: "graduacion", dias: 3, meta: 36 },
];
// Tope: como mucho 14 días de regalo cada 30 días por cuenta.
const TOPE_DIAS = 14;
const TOPE_VENTANA = 30;
// El podio solo cuenta en semanas con al menos esta cantidad de jugadores.
const PODIO_MIN = 10;
const DAY = 24 * 60 * 60 * 1000;

function dayKeyUTC(t) {
  return new Date(t).toISOString().slice(0, 10);
}
function keyTime(key) {
  return Date.parse(`${key}T00:00:00Z`);
}
// Un puntaje del día `key` vale si se guardó ese día (con margen por los husos horarios). Así no
// sirve escribir hoy puntajes de días que ya pasaron.
function savedOnTime(key, createTime, days = 1) {
  const t = Date.parse(createTime);
  const start = keyTime(key);
  return t >= start - 14 * 3600e3 && t <= start + days * DAY + 14 * 3600e3;
}
// La racha más larga de días seguidos entre las fechas jugadas (claves AAAA-MM-DD).
function longestRun(keys) {
  const set = new Set(keys);
  let best = 0;
  for (const k of set) {
    if (set.has(dayKeyUTC(keyTime(k) - DAY))) continue;
    let n = 0;
    let t = keyTime(k);
    while (set.has(dayKeyUTC(t))) {
      n++;
      t += DAY;
    }
    best = Math.max(best, n);
  }
  return best;
}
// Lunes (AAAA-MM-DD) de la semana de `t`.
function mondayUTC(t) {
  const d = new Date(t);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return dayKeyUTC(d.getTime());
}
// Días de regalo dados en los últimos 30 días.
function diasRecientes(ganados, now) {
  let n = 0;
  for (const [id, g] of Object.entries(ganados || {}))
    if (id !== "bienvenida" && now - g.t < TOPE_VENTANA * DAY) n += g.dias;
  return n;
}

export {
  DAY,
  PODIO_MIN,
  PREMIOS,
  TOPE_DIAS,
  TOPE_VENTANA,
  dayKeyUTC,
  diasRecientes,
  keyTime,
  longestRun,
  mondayUTC,
  savedOnTime,
};
