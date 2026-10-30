// Desafío semanal: un reto distinto cada semana (de lunes a domingo), medido con lo que ya jugás.
// Al completarlo ganás la insignia de esa semana.
import { useEffect } from "react";
import { addDays, dayKey, setState } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { cx } from "../ui/components.jsx";

function mondayKey(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dayKey(x);
}
function inWeek(key, monday) {
  return key >= monday && key <= addDays(monday, 6);
}
const tsKey = (t) => dayKey(new Date(t));

const WEEKLY = [
  {
    id: "daily5",
    icon: "calendar",
    title: "Cinco desafíos diarios",
    desc: "Hacé el desafío diario 5 días de esta semana.",
    goal: 5,
    value: (st, m) =>
      Object.keys(st.daily.results || {}).filter((k) => inWeek(k, m)).length,
  },
  {
    id: "hands200",
    icon: "train",
    title: "200 manos",
    desc: "Jugá 200 manos en las tandas de Entrenar esta semana.",
    goal: 200,
    value: (st, m) =>
      st.train.sessions
        .filter((s) => s.t && inWeek(tsKey(s.t), m))
        .reduce((n, s) => n + (s.n || 0), 0),
  },
  {
    id: "blitz20",
    icon: "clock",
    title: "Veinte contra reloj",
    desc: "Acertá 20 manos en un contrarreloj esta semana.",
    goal: 20,
    value: (st, m) =>
      ((st.train.blitz && st.train.blitz.last) || [])
        .filter((b) => inWeek(tsKey(b.t), m))
        .reduce((n, b) => Math.max(n, b.score), 0),
  },
  {
    id: "goal5",
    icon: "target",
    title: "Constancia",
    desc: "Cumplí tu meta diaria 5 días de esta semana.",
    goal: 5,
    value: (st, m) =>
      Object.entries(st.dailyGoal.days || {}).filter(
        ([k, d]) => inWeek(k, m) && d.s >= d.g,
      ).length,
  },
  {
    id: "perfect3",
    icon: "sparkle",
    title: "Tres perfectas",
    desc: "Hacé 3 tandas de Entrenar sin un solo error esta semana.",
    goal: 3,
    value: (st, m) =>
      st.train.sessions.filter(
        (s) => s.t && inWeek(tsKey(s.t), m) && s.n >= 10 && s.ok === s.n,
      ).length,
  },
];

function weeklyStatus(st, now = new Date()) {
  const monday = mondayKey(now);
  const [y, mo, d] = monday.split("-").map(Number);
  const weekNo = Math.floor(Date.UTC(y, mo - 1, d) / (7 * 864e5));
  const ch = WEEKLY[weekNo % WEEKLY.length];
  const value = Math.min(ch.goal, ch.value(st, monday));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(y, mo - 1, d + 7);
  const daysLeft = Math.round((end - today) / 864e5);
  const won = st.weekly && st.weekly.done ? st.weekly.done : {};
  return {
    ch,
    monday,
    value,
    done: value >= ch.goal,
    saved: !!won[monday],
    daysLeft,
    badges: Object.keys(won).length,
  };
}

function WeeklyCard({ st }) {
  const w = weeklyStatus(st);
  // Guarda la insignia la primera vez que se completa.
  useEffect(() => {
    if (w.done && !w.saved)
      setState((s) => ({
        ...s,
        weekly: {
          ...(s.weekly || {}),
          done: { ...((s.weekly && s.weekly.done) || {}), [w.monday]: w.ch.id },
        },
      }));
  }, [w.done, w.saved, w.monday]);
  return (
    <div className={cx("card weekly-card", w.done && "won")}>
      <div className="weekly-top">
        <span className="weekly-badge">
          <Icon name={w.done ? "trophy" : w.ch.icon} size={24} />
        </span>
        <div className="grow">
          <div className="eyebrow acc">Desafío semanal</div>
          <h2 className="weekly-title">{w.ch.title}</h2>
          <p className="muted small">{w.ch.desc}</p>
        </div>
      </div>
      <div className="weekly-bar">
        <i style={{ width: `${(w.value / w.ch.goal) * 100}%` }} />
      </div>
      <div className="weekly-foot small">
        <span className="num">
          <b>{w.value}</b> / {w.ch.goal}
        </span>
        <span className="muted">
          {w.done
            ? "¡Completado! Ganaste la insignia de esta semana."
            : w.daysLeft === 1
              ? "Termina hoy"
              : `Termina en ${w.daysLeft} días`}
        </span>
      </div>
    </div>
  );
}

export { WEEKLY, WeeklyCard, weeklyStatus };
