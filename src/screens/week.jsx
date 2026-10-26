// "Tu semana": cuánto practicaste en los últimos 7 días, comparado con los 7 anteriores.
import { useMemo, useState } from "react";
import { addDays, dayKey } from "../state.js";
import { cx } from "../ui/components.jsx";

const DAY_LETTERS = ["D", "L", "M", "M", "J", "V", "S"];

function weekStats(st, offset) {
  const today = dayKey();
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(today, -(6 - i) - offset * 7),
  );
  const set = new Set(days);
  const inWeek = (t) => !!t && set.has(dayKey(new Date(t)));
  const secsOf = (d) => (st.dailyGoal.days[d] || {}).s || 0;
  const sessions = st.train.sessions.filter((s) => inWeek(s.t));
  const drills = Object.values(st.drills).reduce(
    (a, d) =>
      a + ((d && d.sessions) || []).filter((x) => x && inWeek(x.t)).length,
    0,
  );
  return {
    days: days.map((d) => ({ d, secs: secsOf(d) })),
    secs: days.reduce((a, d) => a + secsOf(d), 0),
    active: days.filter((d) => st.activity[d] || secsOf(d) > 0).length,
    hands: sessions.reduce((a, s) => a + s.n, 0),
    ok: sessions.reduce((a, s) => a + s.ok, 0),
    drills,
    lessons: Object.values(st.lessons).filter((l) => l.done && inWeek(l.at))
      .length,
    trips: (st.casino.trips || []).filter((t) => inWeek(t.t)).length,
  };
}

function minutes(secs) {
  return Math.round(secs / 60);
}

function insight(now, prev) {
  if (!now.secs && !now.hands)
    return "Esta semana todavía no practicaste. Con 10 minutos por día se nota enseguida.";
  const parts = [];
  const diff = minutes(now.secs) - minutes(prev.secs);
  if (prev.secs && Math.abs(diff) >= 3)
    parts.push(
      diff > 0
        ? `${diff} min más que la semana pasada.`
        : `${-diff} min menos que la semana pasada.`,
    );
  if (now.hands >= 20 && prev.hands >= 20) {
    const a = Math.round((now.ok / now.hands) * 100);
    const b = Math.round((prev.ok / prev.hands) * 100);
    if (a !== b)
      parts.push(
        `Tu precisión en Entrenar ${a > b ? "subió" : "bajó"} de ${b} % a ${a} %.`,
      );
  }
  if (!parts.length)
    parts.push(
      now.active >= 5
        ? "Muy constante: así es como se aprende a contar."
        : `Practicaste ${now.active} ${now.active === 1 ? "día" : "días"}. Probá sumar uno más.`,
    );
  return parts.join(" ");
}

function WeekCard({ st }) {
  const now = useMemo(() => weekStats(st, 0), [st]);
  const prev = useMemo(() => weekStats(st, 1), [st]);
  const [sel, setSel] = useState(6);
  const max = Math.max(60, ...now.days.map((d) => d.secs));
  const day = now.days[sel];
  const date = new Date(`${day.d}T12:00:00`);
  return (
    <div className="card week-card">
      <div className="row between">
        <span className="eyebrow">Tu semana</span>
        <span className="tiny muted num">
          {sel === 6
            ? `Hoy: ${minutes(day.secs)} min`
            : `${date.toLocaleDateString("es-UY", { weekday: "short", day: "numeric" })}: ${minutes(day.secs)} min`}
        </span>
      </div>
      <div
        className="week-bars"
        role="list"
        aria-label="Minutos practicados por día"
      >
        {now.days.map((d, i) => {
          const dt = new Date(`${d.d}T12:00:00`);
          return (
            <button
              type="button"
              role="listitem"
              className={cx("week-bar", i === sel && "on", i === 6 && "today")}
              onClick={() => setSel(i)}
              aria-label={`${dt.toLocaleDateString("es-UY", { weekday: "long" })}: ${minutes(d.secs)} minutos`}
              key={d.d}
            >
              <span className="week-col">
                <i
                  style={{
                    height: `${d.secs ? Math.max(6, (d.secs / max) * 100) : 0}%`,
                  }}
                />
              </span>
              <span className="tiny">{DAY_LETTERS[dt.getDay()]}</span>
            </button>
          );
        })}
      </div>
      <div className="tiles week-tiles">
        <div className="tile">
          <div className="tile-v num">{minutes(now.secs)}</div>
          <div className="tile-l">minutos</div>
        </div>
        <div className="tile">
          <div className="tile-v num">
            {now.hands ? `${Math.round((now.ok / now.hands) * 100)} %` : "—"}
          </div>
          <div className="tile-l">
            {now.hands ? `en ${now.hands} manos` : "sin manos"}
          </div>
        </div>
        <div className="tile">
          <div className="tile-v num">{now.drills + now.lessons}</div>
          <div className="tile-l">lecciones y ejercicios</div>
        </div>
      </div>
      <p className="small week-insight">{insight(now, prev)}</p>
    </div>
  );
}

export { WeekCard };
