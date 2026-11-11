// Racha y meta diaria.
// - La racha (como en Duolingo) suma un día cuando terminas al menos una actividad: una lección,
//   una tanda de Entrenar, un ejercicio de conteo, el desafío o manos en la mesa (st.activity).
// - La meta de minutos (5, 10, 15 o 20) es un extra: un anillo que se llena con lo que practicas.
import { useEffect, useRef } from "react";
import {
  activityStreak,
  addDays,
  addPracticeTime,
  bestActivityStreak,
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
const WEEKDAYS = "DLMMJVS";

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
  "casinoPlay",
  "devLevel",
  "speedDrill",
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
    onCelebrate();
  }, [met]);
}

// Avisa una sola vez por día cuando la racha suma el día de hoy.
function useStreakCelebration(onCelebrate) {
  const st = useStore();
  const today = dayKey();
  const done = !!st.activity[today];
  useEffect(() => {
    if (!done || st.dailyGoal.rachaFestejada === today) return;
    setState((s) => ({
      ...s,
      dailyGoal: { ...s.dailyGoal, rachaFestejada: today },
    }));
    sfx.good();
    onCelebrate(activityStreak(st.activity));
  }, [done]);
}

function minutesText(seconds) {
  return Math.floor(seconds / 60);
}

// La racha en los encabezados: la llama (encendida si hoy ya sumaste) y los días. Abre la hoja.
function GoalBadge() {
  const st = useStore();
  const nav = useNav();
  const streak = activityStreak(st.activity);
  const hoy = !!st.activity[dayKey()];
  return (
    <button
      type="button"
      className={cx("badge goal-badge", hoy && "met")}
      onClick={() => nav.openSheet("goal")}
      aria-label={`Racha de ${streak} ${streak === 1 ? "día" : "días"}. ${hoy ? "Hoy ya sumaste." : "Hoy todavía no sumaste."}`}
    >
      <Flame size={20} lit={hoy} />
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
  const streak = activityStreak(st.activity);
  const best = bestActivityStreak(st.activity);
  const hoy = !!st.activity[today];
  const d = goalDay(st, today);
  const met = d.s >= d.g;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return (
    <Sheet open={open} onClose={onClose} title="Tu racha">
      <div className="racha-hero">
        <Flame size={64} lit={hoy} />
        <b className="num racha-num">
          {streak} {streak === 1 ? "día" : "días"}
        </b>
        <p className={cx("goal-status", hoy && "good")}>
          {hoy
            ? "¡Ya sumaste el día de hoy!"
            : streak > 0
              ? "Termina una actividad hoy para no perderla."
              : "Termina una actividad para empezar tu racha."}
        </p>
        {best > streak ? (
          <p className="muted small">{`Tu récord: ${best} días.`}</p>
        ) : null}
      </div>
      <div className="goal-week">
        {week.map((day) => {
          const [y, m, dd] = day.split("-").map(Number);
          const wd = new Date(y, m - 1, dd).getDay();
          return (
            <div className={cx("goal-day", day === today && "today")} key={day}>
              <Flame size={26} lit={!!st.activity[day]} />
              <span>{WEEKDAYS[wd]}</span>
            </div>
          );
        })}
      </div>
      {!hoy ? (
        <NextSteps
          st={st}
          limit={2}
          title="Para sumar hoy"
          onGo={onClose}
          className="flat goal-plan"
        />
      ) : null}
      <p className="muted small" style={{ marginTop: 12 }}>
        Suma cualquier cosa que termines: una lección, una tanda de Entrenar,
        un ejercicio de conteo, el desafío o manos en la mesa.
      </p>
      <h3 className="sheet-sub">Meta de minutos (opcional)</h3>
      <div className="meta-min card flat">
        <Ring
          value={d.s / d.g}
          size={56}
          stroke={6}
          tone={met ? "var(--good)" : "var(--accent)"}
        >
          {met ? <Icon name="check" size={18} stroke={3} className="good" /> : null}
        </Ring>
        <div className="grow">
          <b className="num">{`${minutesText(d.s)} de ${Math.round(d.g / 60)} minutos`}</b>
          <div className="muted small">{met ? "¡Meta cumplida!" : "Practicando hoy"}</div>
        </div>
      </div>
      <Pills
        className="left"
        options={GOAL_OPTIONS.map((m) => ({ value: m, label: `${m} min` }))}
        value={st.dailyGoal.minutes}
        onChange={(m) => setGoalMinutes(m)}
      />
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
  useStreakCelebration,
};
