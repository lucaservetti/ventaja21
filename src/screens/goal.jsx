// Meta diaria: elegís 5, 10, 15 o 20 minutos; un anillo se llena con lo que practicás
// y la racha cuenta solo los días en que cumpliste la meta.
import { useEffect, useRef } from "react";
import {
  addDays,
  addPracticeTime,
  dayKey,
  goalDay,
  goalMet,
  goalStreak,
  setGoalMinutes,
  setState,
  useStore,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { sfx } from "../sound.js";
import { Flame, Pills, Ring, Sheet, cx } from "../ui/components.jsx";
import { useNav } from "../nav.js";
import { NextSteps } from "./profile.jsx";

const GOAL_OPTIONS = [5, 10, 15, 20];
const WEEKDAYS = ["D", "L", "M", "M", "J", "V", "S"];

// Pantallas donde el tiempo cuenta como práctica.
const PRACTICE_SCREENS = new Set([
  "trainSession",
  "lesson",
  "drillValues",
  "drillRunning",
  "drillTrue",
  "drillDecks",
  "drillBet",
  "deckCountdown",
  "drillPairs",
  "shoeChallenge",
  "placement",
  "review",
  "jumpTest",
]);
const TICK = 5; // segundos
const IDLE_LIMIT = 90000; // sin tocar la pantalla por más de 90 s, el tiempo deja de contar

// Suma tiempo de práctica mientras estás en una pantalla de práctica (o jugando en el simulador)
// y tocaste la pantalla hace poco.
function usePracticeClock(practicing) {
  const lastTouch = useRef(Date.now());
  useEffect(() => {
    const touch = () => (lastTouch.current = Date.now());
    window.addEventListener("pointerdown", touch, true);
    window.addEventListener("keydown", touch, true);
    return () => {
      window.removeEventListener("pointerdown", touch, true);
      window.removeEventListener("keydown", touch, true);
    };
  }, []);
  useEffect(() => {
    if (!practicing) return;
    lastTouch.current = Date.now();
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastTouch.current > IDLE_LIMIT) return;
      addPracticeTime(TICK);
    }, TICK * 1000);
    return () => clearInterval(timer);
  }, [practicing]);
}

// Avisa una sola vez por día cuando se cumple la meta.
function useGoalCelebration(onCelebrate) {
  const st = useStore();
  const today = dayKey();
  const met = goalMet(st, today);
  useEffect(() => {
    if (!met || st.dailyGoal.celebrated === today) return;
    setState((s) => ({
      ...s,
      dailyGoal: { ...s.dailyGoal, celebrated: today },
    }));
    sfx.win();
    onCelebrate(goalStreak({ ...st }));
  }, [met]);
}

function minutesText(seconds) {
  return Math.floor(seconds / 60);
}

// Anillo chico con la racha, para los encabezados. Abre la hoja de la meta.
function GoalBadge() {
  const st = useStore();
  const nav = useNav();
  const d = goalDay(st);
  const streak = goalStreak(st);
  const met = d.s >= d.g;
  return (
    <button
      type="button"
      className={cx("badge goal-badge", met && "met")}
      onClick={() => nav.openSheet("goal")}
      aria-label={`Meta diaria: ${minutesText(d.s)} de ${Math.round(d.g / 60)} minutos. Racha de ${streak} ${streak === 1 ? "día" : "días"}.`}
    >
      <span className="goal-mini">
        <Ring
          value={d.s / d.g}
          size={30}
          stroke={4}
          tone={met ? "var(--good)" : "var(--accent)"}
        >
          <Flame size={14} lit={streak > 0 || met} />
        </Ring>
      </span>
      <span className="num">{streak}</span>
    </button>
  );
}

function bestGoalStreak(st) {
  const days = Object.keys(st.dailyGoal.days).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of days) {
    if (!goalMet(st, day)) {
      run = 0;
      prev = day;
      continue;
    }
    run = prev && addDays(prev, 1) === day && run > 0 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

function GoalSheet({ open, onClose }) {
  const st = useStore();
  const today = dayKey();
  const d = goalDay(st, today);
  const streak = goalStreak(st);
  const best = bestGoalStreak(st);
  const met = d.s >= d.g;
  const left = Math.max(0, Math.ceil((d.g - d.s) / 60));
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return (
    <Sheet open={open} onClose={onClose} title="Meta diaria">
      <div className="goal-hero">
        <Ring
          value={d.s / d.g}
          size={170}
          stroke={15}
          tone={met ? "var(--good)" : "var(--accent)"}
        >
          <div className="mid-num num" style={{ fontSize: 42 }}>
            {minutesText(d.s)}
            <span className="muted" style={{ fontSize: 20 }}>
              /{Math.round(d.g / 60)}
            </span>
          </div>
          <div className="muted small" style={{ fontWeight: 700 }}>
            minutos hoy
          </div>
        </Ring>
        <p className={cx("goal-status", met && "good")}>
          {met
            ? "¡Cumpliste la meta de hoy!"
            : d.s === 0
              ? "Todavía no practicaste hoy."
              : `Te ${left === 1 ? "falta 1 minuto" : `faltan ${left} minutos`}.`}
        </p>
      </div>
      <NextSteps
        st={st}
        limit={3}
        title="Para hoy"
        onGo={onClose}
        className="flat goal-plan"
      />
      <div className="goal-streak card flat">
        <Flame size={30} lit={streak > 0} />
        <div className="grow">
          <b className="num" style={{ fontSize: 22 }}>
            {streak} {streak === 1 ? "día seguido" : "días seguidos"}
          </b>
          <div className="muted small">
            La racha suma un día solo cuando cumplís la meta.
            {best > streak ? ` Tu récord: ${best}.` : ""}
          </div>
        </div>
      </div>
      <div className="goal-week">
        {week.map((day) => {
          const x = goalDay(st, day);
          const [y, m, dd] = day.split("-").map(Number);
          const wd = new Date(y, m - 1, dd).getDay();
          return (
            <div className={cx("goal-day", day === today && "today")} key={day}>
              <Ring
                value={x.s / x.g}
                size={34}
                stroke={4}
                tone={x.s >= x.g ? "var(--good)" : "var(--accent)"}
              >
                {x.s >= x.g ? (
                  <Icon name="check" size={14} stroke={3} className="good" />
                ) : null}
              </Ring>
              <span>{WEEKDAYS[wd]}</span>
            </div>
          );
        })}
      </div>
      <h3 className="sheet-sub">Tu meta</h3>
      <Pills
        className="left"
        options={GOAL_OPTIONS.map((m) => ({ value: m, label: `${m} min` }))}
        value={st.dailyGoal.minutes}
        onChange={(m) => setGoalMinutes(m)}
      />
      <p className="muted small" style={{ marginTop: 12 }}>
        Cuenta el tiempo que practicás: lecciones, tandas de Entrenar,
        ejercicios de conteo y manos en el simulador. Si dejás la app quieta más
        de un minuto y medio, el reloj se frena.
      </p>
    </Sheet>
  );
}

export {
  GOAL_OPTIONS,
  GoalBadge,
  GoalSheet,
  PRACTICE_SCREENS,
  bestGoalStreak,
  useGoalCelebration,
  usePracticeClock,
};
