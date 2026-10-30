// Logros: metas concretas en cada parte de la app. Se guardan con la fecha en que los conseguiste.
import { useEffect, useMemo } from "react";
import { setState, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import {
  HARD_ROWS,
  PAIR_ROWS,
  ProgressBar,
  SOFT_ROWS,
  cx,
} from "../ui/components.jsx";
import { LESSONS, SECTIONS } from "../lessons/content.js";
import { rowLearned } from "../lessons/chartMap.js";
import { COUNT_LEVELS, passedCount } from "../engine/countPath.js";
import { devPassedCount } from "../engine/devPath.js";
import { TopBar } from "../ui/common.jsx";
import { bestGoalStreak } from "./goal.jsx";
import { MASTERED_BOX } from "./chartCards.jsx";
import { useNav } from "../nav.js";

const lessonDone = (st, id) => !!(st.lessons[id] && st.lessons[id].done);
const realLessons = LESSONS.filter((l) => !l.exam);
const ALL_ROWS = [
  ...HARD_ROWS.map((r) => ["hard", r.key]),
  ...SOFT_ROWS.map((r) => ["soft", r.key]),
  ...PAIR_ROWS.map((r) => ["pairs", r.key]),
];
const trips = (st) => st.casino.trips || [];

const GROUPS = [
  {
    title: "Aprender",
    items: [
      {
        id: "lesson-1",
        icon: "learn",
        title: "Primer paso",
        desc: "Terminá tu primera lección.",
        goal: 1,
        value: (st) => realLessons.filter((l) => lessonDone(st, l.id)).length,
      },
      {
        id: "section-1",
        icon: "book",
        title: "Lo básico",
        desc: "Completá la sección 1.",
        goal: SECTIONS[0].lessons.length,
        value: (st) =>
          SECTIONS[0].lessons.filter((l) => lessonDone(st, l.id)).length,
      },
      {
        id: "chart-all",
        icon: "grid",
        title: "Toda la tabla",
        desc: "Encendé todas las filas de tu tabla de estrategia.",
        goal: ALL_ROWS.length,
        value: (st) => ALL_ROWS.filter(([t, r]) => rowLearned(st, t, r)).length,
      },
      {
        id: "lessons-all",
        icon: "crown",
        title: "Todas las lecciones",
        desc: "Terminá todas las lecciones de Aprender.",
        goal: realLessons.length,
        value: (st) => realLessons.filter((l) => lessonDone(st, l.id)).length,
      },
      {
        id: "final-exam",
        icon: "trophy",
        title: "Contador certificado",
        desc: "Aprobá el examen final.",
        goal: 1,
        value: (st) => (st.finalExam.passed ? 1 : 0),
      },
    ],
  },
  {
    title: "Constancia",
    items: [
      {
        id: "streak-3",
        icon: "calendar",
        title: "Tres al hilo",
        desc: "Cumplí la meta diaria 3 días seguidos.",
        goal: 3,
        value: (st) => bestGoalStreak(st),
      },
      {
        id: "weekly-1",
        icon: "trophy",
        title: "Insignia semanal",
        desc: "Completá un desafío semanal.",
        goal: 1,
        value: (st) => Object.keys((st.weekly && st.weekly.done) || {}).length,
      },
      {
        id: "weekly-4",
        icon: "trophy",
        title: "Cuatro insignias",
        desc: "Completá 4 desafíos semanales.",
        goal: 4,
        value: (st) => Object.keys((st.weekly && st.weekly.done) || {}).length,
      },
      {
        id: "streak-7",
        icon: "calendar",
        title: "Una semana entera",
        desc: "Cumplí la meta diaria 7 días seguidos.",
        goal: 7,
        value: (st) => bestGoalStreak(st),
      },
      {
        id: "streak-30",
        icon: "calendar",
        title: "Un mes sin fallar",
        desc: "Cumplí la meta diaria 30 días seguidos.",
        goal: 30,
        value: (st) => bestGoalStreak(st),
      },
    ],
  },
  {
    title: "Entrenar",
    items: [
      {
        id: "hands-100",
        icon: "train",
        title: "Cien manos",
        desc: "Jugá 100 manos en Entrenar.",
        goal: 100,
        value: (st) => st.train.totalHands,
      },
      {
        id: "hands-1000",
        icon: "train",
        title: "Mil manos",
        desc: "Jugá 1.000 manos en Entrenar.",
        goal: 1000,
        value: (st) => st.train.totalHands,
      },
      {
        id: "streak-10",
        icon: "bolt",
        title: "Diez seguidas",
        desc: "Acertá 10 manos seguidas.",
        goal: 10,
        value: (st) => st.train.longestStreak,
      },
      {
        id: "streak-25",
        icon: "bolt",
        title: "Imparable",
        desc: "Acertá 25 manos seguidas.",
        goal: 25,
        value: (st) => st.train.longestStreak,
      },
      {
        id: "perfect",
        icon: "sparkle",
        title: "Tanda perfecta",
        desc: "Hacé una tanda de 10 manos sin un error.",
        goal: 1,
        value: (st) =>
          st.train.sessions.some((s) => s.n >= 10 && s.ok === s.n) ? 1 : 0,
      },
      {
        id: "fixed-10",
        icon: "refresh",
        title: "Aprendés de tus errores",
        desc: "Corregí 10 manos que habías fallado.",
        goal: 10,
        value: (st) => st.train.fixed || 0,
      },
      {
        id: "cards-50",
        icon: "layers",
        title: "Memoria de casino",
        desc: "Tené 50 casillas de la tabla de memoria (Tarjetas de la tabla).",
        goal: 50,
        value: (st) =>
          Object.values(st.srs.cards).filter((c) => c.box >= MASTERED_BOX)
            .length,
      },
    ],
  },
  {
    title: "Conteo",
    items: [
      {
        id: "dev-all",
        icon: "target",
        title: "Desviaciones dominadas",
        desc: "Terminá los 10 niveles de la ruta de desviaciones.",
        goal: 10,
        value: (st) => devPassedCount(st),
      },
      {
        id: "level-5",
        icon: "drills",
        title: "Mitad de la ruta",
        desc: "Pasá 5 niveles de la ruta de conteo.",
        goal: 5,
        value: (st) => passedCount(st),
      },
      {
        id: "level-10",
        icon: "target",
        title: "Contador de verdad",
        desc: "Terminá los 10 niveles de la ruta de conteo.",
        goal: COUNT_LEVELS.length,
        value: (st) => passedCount(st),
      },
      {
        id: "speed-casino",
        icon: "bolt",
        title: "Ritmo de casino",
        desc: "Contá bien una tanda a 2,5 cartas por segundo.",
        goal: 1,
        value: (st) => (st.drills.speed && st.drills.speed.best >= 2.5 ? 1 : 0),
      },
      {
        id: "checks-10",
        icon: "eye",
        title: "Ojo de halcón",
        desc: "Acertá 10 chequeos de conteo jugando en la mesa.",
        goal: 10,
        value: (st) => st.play.checksOk,
      },
    ],
  },
  {
    title: "Mesa y casino",
    items: [
      {
        id: "shoe-1",
        icon: "shoe",
        title: "Primer zapato",
        desc: "Jugá un zapato entero en el simulador.",
        goal: 1,
        value: (st) => st.play.shoes || 0,
      },
      {
        id: "journal-1",
        icon: "book",
        title: "Bitácora",
        desc: "Anotá tu primera sesión en el diario de casino real.",
        goal: 1,
        value: (st) => st.journal.entries.length,
      },
      {
        id: "casino-1",
        icon: "play",
        title: "Primera visita",
        desc: "Terminá una visita en el modo casino real.",
        goal: 1,
        value: (st) => trips(st).length,
      },
      {
        id: "casino-win",
        icon: "crown",
        title: "Te fuiste ganando",
        desc: "Retirate del casino con más plata de la que llevaste.",
        goal: 1,
        value: (st) => (trips(st).some((t) => t.net > 0) ? 1 : 0),
      },
      {
        id: "casino-cert",
        icon: "trophy",
        title: "Certificado de casino",
        desc: "Aprobá el examen de casino.",
        goal: 1,
        value: (st) => (st.casino.exam && st.casino.exam.passed ? 1 : 0),
      },
      {
        id: "casino-stealth",
        icon: "shield",
        title: "Bajo el radar",
        desc: "Jugá 60 manos en el casino con vigilancia sin que el jefe de mesa sospeche.",
        goal: 1,
        value: (st) =>
          trips(st).some((t) => t.heatOn && t.hands >= 60 && t.heatPeak < 35)
            ? 1
            : 0,
      },
    ],
  },
];
const ACHIEVEMENTS = GROUPS.flatMap((g) => g.items);

function isDone(a, st) {
  return a.value(st) >= a.goal;
}

// Revisa los logros cada vez que cambia el estado y avisa los nuevos.
// La primera vez guarda en silencio los que ya tenías, para no festejar veinte de golpe.
function useAchievementWatcher(onUnlock) {
  const st = useStore();
  useEffect(() => {
    const got = st.achievements.got;
    const fresh = ACHIEVEMENTS.filter((a) => !got[a.id] && isDone(a, st));
    if (!fresh.length && st.achievements.init) return;
    const now = Date.now();
    setState((s) => ({
      ...s,
      achievements: {
        init: true,
        got: {
          ...s.achievements.got,
          ...Object.fromEntries(fresh.map((a) => [a.id, now])),
        },
      },
    }));
    if (st.achievements.init) for (const a of fresh) onUnlock(a);
  }, [st]);
}

function Medal({ a, got, size = 52 }) {
  return (
    <span
      className={cx("medal", got && "got")}
      style={{ width: size, height: size }}
    >
      <Icon name={got ? a.icon : "lock"} size={Math.round(size * 0.42)} />
    </span>
  );
}

// Resumen para Progreso.
function AchievementsCard({ st }) {
  const nav = useNav();
  const got = st.achievements.got;
  const list = ACHIEVEMENTS.filter((a) => got[a.id]).sort(
    (a, b) => got[b.id] - got[a.id],
  );
  const next = useMemo(
    () =>
      ACHIEVEMENTS.filter((a) => !got[a.id])
        .map((a) => ({ a, p: Math.min(1, a.value(st) / a.goal) }))
        .sort((x, y) => y.p - x.p)[0],
    [st],
  );
  return (
    <button
      type="button"
      className="card ach-card"
      onClick={() => nav.push("achievements")}
    >
      <span className="row between" style={{ width: "100%" }}>
        <span className="eyebrow">Logros</span>
        <span className="small muted num">
          <b style={{ color: "var(--text)" }}>{list.length}</b> de{" "}
          {ACHIEVEMENTS.length} →
        </span>
      </span>
      <span className="ach-row">
        {list.slice(0, 5).map((a) => (
          <Medal a={a} got={true} size={44} key={a.id} />
        ))}
        {list.length === 0 ? (
          <span className="muted small">
            Todavía ninguno. ¡El primero está cerca!
          </span>
        ) : null}
      </span>
      {next ? (
        <span className="ach-next">
          <span className="small">
            Próximo: <b>{next.a.title}</b>
            <span className="muted"> · {next.a.desc}</span>
          </span>
          <ProgressBar value={next.p} />
        </span>
      ) : null}
    </button>
  );
}

function AchievementsScreen() {
  const st = useStore();
  const nav = useNav();
  const got = st.achievements.got;
  const count = ACHIEVEMENTS.filter((a) => got[a.id]).length;
  return (
    <div className="achievements fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Logros"
        sub={`${count} de ${ACHIEVEMENTS.length}`}
      />
      <div style={{ marginTop: 6 }}>
        <ProgressBar value={count / ACHIEVEMENTS.length} />
      </div>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="section-title">
            <h2>{g.title}</h2>
          </div>
          <div className="ach-list">
            {g.items.map((a) => {
              const v = Math.min(a.value(st), a.goal);
              const done = !!got[a.id];
              return (
                <div className={cx("ach-item", done && "got")} key={a.id}>
                  <Medal a={a} got={done} />
                  <span className="grow">
                    <b>{a.title}</b>
                    <span className="muted small" style={{ display: "block" }}>
                      {a.desc}
                    </span>
                    {done ? (
                      <span className="tiny good" style={{ display: "block" }}>
                        Conseguido el{" "}
                        {new Date(got[a.id]).toLocaleDateString("es-UY", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    ) : a.goal > 1 ? (
                      <span className="ach-prog">
                        <ProgressBar value={v / a.goal} />
                        <span className="tiny muted num">
                          {v.toLocaleString("es-UY")} /{" "}
                          {a.goal.toLocaleString("es-UY")}
                        </span>
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export {
  ACHIEVEMENTS,
  AchievementsCard,
  AchievementsScreen,
  useAchievementWatcher,
};
