// Qué recordatorios tocan en los próximos días (sin nada de Android, para poder probarlo solo:
// tests/recordatorios.mjs). recordatorios.js los programa en el celular.
//
// La persona elige (Ajustes → Recordatorios):
// - dias: qué días de la semana (0 = domingo … 6 = sábado);
// - hora: a qué hora ("19:00");
// - racha: si avisar a la noche cuando está por perder la racha.
// Si ese día ya practicó, el recordatorio no sale (se vuelve a calcular cada vez que abre la app
// o practica).

const DIAS_ADELANTE = 14;
const HORA_RACHA = 21; // el aviso de racha sale a las 21 h (o una hora después del recordatorio)
const ID_PRACTICA = 1000;
const ID_RACHA = 2000;

const MENSAJES = [
  ["Tu desafío de hoy te espera 🃏", "Un formato nuevo cada día. ¿Lo jugás?"],
  [
    "Cinco minutos de práctica 🎯",
    "Una tanda corta y tu estrategia queda más firme.",
  ],
  [
    "¿Cuánto da la cuenta? 🧠",
    "Practicá el conteo un rato y seguí subiendo de nivel.",
  ],
  [
    "La mesa está abierta ♠",
    "Seguí donde quedaste: una lección corta o unas manos.",
  ],
  [
    "Un rato de blackjack 🂡",
    "Lo que practicás seguido es lo que te sale sin pensar.",
  ],
];

const PRESETS = {
  todos: [0, 1, 2, 3, 4, 5, 6],
  semana: [1, 2, 3, 4, 5],
};

// "19:30" → [19, 30], con límites.
function horaMin(h) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(h || ""));
  if (!m) return [19, 0];
  return [Math.min(23, +m[1]), Math.min(59, +m[2])];
}
function clave(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// rec: los ajustes; info: { hoyHecho, racha } (racha = días seguidos, contando hoy si ya practicó).
// Devuelve [{ id, at: Date, title, body, extra }], ordenados por fecha.
function planRecordatorios(rec, info, now = new Date()) {
  if (!rec || !rec.on) return [];
  const out = [];
  const dias = Array.isArray(rec.dias) ? rec.dias : PRESETS.todos;
  const [h, m] = horaMin(rec.hora);
  for (let d = 0; d < DIAS_ADELANTE; d++) {
    const at = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + d,
      h,
      m,
      0,
      0,
    );
    if (at <= now) continue;
    if (!dias.includes(at.getDay())) continue;
    if (d === 0 && info.hoyHecho) continue;
    const [title, body] =
      MENSAJES[(at.getDate() + at.getMonth()) % MENSAJES.length];
    out.push({
      id: ID_PRACTICA + d,
      at,
      title,
      body,
      extra: { ir: "conteo", dia: clave(at) },
    });
  }
  // Racha en riesgo: hoy (si todavía no practicó) o mañana (si hoy ya practicó).
  if (rec.racha !== false) {
    const horaRacha = Math.max(HORA_RACHA, Math.min(23, h + 1));
    const d = info.hoyHecho ? 1 : 0;
    const racha = info.racha;
    const at = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + d,
      horaRacha,
      0,
      0,
      0,
    );
    if (racha >= 2 && at > now)
      out.push({
        id: ID_RACHA + d,
        at,
        title: `🔥 Tu racha de ${racha} días`,
        body: "Se corta hoy si no practicás. Con unos minutos la salvás.",
        extra: { ir: "conteo", dia: clave(at) },
      });
  }
  return out.sort((a, b) => a.at - b.at);
}

// Cómo se describe la frecuencia elegida (para la pantalla de ajustes).
function tipoFrecuencia(dias) {
  const s = [...(dias || [])].sort().join(",");
  if (s === PRESETS.todos.join(",")) return "todos";
  if (s === PRESETS.semana.join(",")) return "semana";
  if ((dias || []).length === 1) return "semanal";
  return "elegir";
}

// El resumen que se ve en Ajustes ("Todos los días a las 19:00").
function resumenRecordatorios(rec) {
  if (!rec || !rec.on) return "Apagados";
  const hora = rec.hora || "19:00";
  const t = tipoFrecuencia(rec.dias || PRESETS.todos);
  if (t === "todos") return `Todos los días a las ${hora}`;
  if (t === "semana") return `De lunes a viernes a las ${hora}`;
  if (t === "semanal") return `Una vez por semana, a las ${hora}`;
  return `${rec.dias.length} días por semana, a las ${hora}`;
}

export {
  ID_PRACTICA,
  resumenRecordatorios,
  ID_RACHA,
  PRESETS,
  horaMin,
  planRecordatorios,
  tipoFrecuencia,
};
