import { useState } from "react";
import {
  goalDay,
  goalStreak,
  addDays,
  dayKey,
  levelFor,
  nextLevel,
  useStore,
} from "../state.js";
import {
  Button,
  Flame,
  Ring,
  Segmented,
  Sheet,
  cx,
} from "../ui/components.jsx";
import { Icon } from "../ui/icons.jsx";
import { LESSONS } from "../lessons/content.js";
import { UPS, skillSpots } from "../engine/trainer.js";
import {
  InfoDot,
  PageHeader,
  SettingsButton,
  spotTitle,
  useRules,
} from "../ui/common.jsx";
import { spotsAccuracy, strongSpots, weakSpots } from "../engine/skills.js";
import { shortDate } from "./TrainTab.jsx";
import { useNav } from "../nav.js";
import { GoalBadge, bestGoalStreak } from "./goal.jsx";
import { NextSteps, ProfileCard } from "./profile.jsx";

function ProgressTab() {
  let a = useStore(),
    e = useNav(),
    [t, s] = useState("overview"),
    [n, l] = useState(null);
  return (
    <div className="fade-up">
      <PageHeader
        title="Progreso"
        sub="Cómo venís y qué te conviene practicar"
        actions={
          <>
            <GoalBadge />
            <SettingsButton />
          </>
        }
      />
      <Segmented
        options={[
          { value: "overview", label: "Resumen" },
          { value: "breakdown", label: "Desglose" },
          { value: "records", label: "Récords" },
        ]}
        value={t}
        onChange={s}
      />
      <div style={{ marginTop: 16 }} className="fade-up" key={t}>
        {t === "overview" ? (
          <ProgressOverview st={a} nav={e} />
        ) : t === "breakdown" ? (
          <ProgressBreakdown st={a} nav={e} setInfo={l} />
        ) : (
          <Records st={a} />
        )}
      </div>
      <Sheet
        open={n === "leaks"}
        onClose={() => l(null)}
        title="Dónde más fallás"
      >
        <p className="muted">
          Son las situaciones donde más fallaste en tus últimos intentos (por
          debajo de 75 %). Cada una vuelve más seguido en las tandas mezcladas
          hasta que la domines. Tocá "Practicar" para entrenarla ahora.
        </p>
      </Sheet>
      <Sheet
        open={n === "heat"}
        onClose={() => l(null)}
        title="Mapa de decisiones"
      >
        <p className="muted">
          Tu precisión real en cada situación que te tocó, por total y carta del
          crupier. Los cuadros grises son situaciones que todavía no viste: se
          van llenando a medida que entrenás.
        </p>
        <p className="muted" style={{ marginTop: 10 }}>
          <b style={{ color: "var(--good)" }}>Verde</b>
          {": 90 % o más. "}
          <b style={{ color: "var(--accent)" }}>Lima</b>
          {": de 70 a 89 %. "}
          <b style={{ color: "var(--bad)" }}>Rojo</b>: menos de 70 %.
        </p>
      </Sheet>
    </div>
  );
}
function Sparkline({ points: a }) {
  if (a.length < 2)
    return (
      <div className="spark-empty muted small">
        Hacé un par de tandas para ver tu curva.
      </div>
    );
  let e = 320,
    t = 90,
    s = a.map((d) => d.v),
    n = Math.min(...s) - 10,
    l = Math.max(...s) + 10,
    i = (d) => (d / (a.length - 1)) * (e - 8) + 4,
    o = (d) => t - 6 - ((d - n) / (l - n || 1)) * (t - 16),
    c = a
      .map((d, p) => `${p ? "L" : "M"}${i(p).toFixed(1)},${o(d.v).toFixed(1)}`)
      .join(" "),
    r = `${c} L${i(a.length - 1)},${t} L${i(0)},${t} Z`,
    u = a[a.length - 1];
  return (
    <svg
      className="spark"
      viewBox={`0 0 ${e} ${t}`}
      preserveAspectRatio="none"
      aria-label="Evolución del puntaje"
    >
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={r} fill="url(#spk)" />
      <path
        d={c}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      <circle cx={i(a.length - 1)} cy={o(u.v)} r="4.5" fill="var(--accent)" />
    </svg>
  );
}
function ProgressOverview({ st: a, nav: e }) {
  let t = levelFor(a.rating.value),
    s = nextLevel(a.rating.value),
    n = LESSONS.filter((C) => a.lessons[C.id] && a.lessons[C.id].done).length,
    l = Object.values(a.drills).reduce(
      (C, k) => C + ((k.sessions && k.sessions.length) || 0),
      0,
    ),
    i = a.train.totalHands ? a.train.totalOk / a.train.totalHands : null,
    o = goalStreak(a),
    today = goalDay(a),
    c = [{ v: 1000 }, ...a.rating.history].slice(-40),
    r = [],
    u = dayKey();
  for (let C = 34; C >= 0; C--) {
    r.push(addDays(u, -C));
  }
  let d = a.drills.running.sessions,
    p = d.length ? d.filter((C) => C.ok).length / d.length : null,
    f = a.drills.values.sessions,
    y = f.length ? f.reduce((C, k) => C + k.ok / k.n, 0) / f.length : null;
  return (
    <>
      <NextSteps st={a} />
      <button
        type="button"
        className="card goal-card"
        style={{ marginTop: 14 }}
        onClick={() => e.openSheet("goal")}
      >
        <Ring
          value={today.s / today.g}
          size={58}
          stroke={7}
          tone={today.s >= today.g ? "var(--good)" : "var(--accent)"}
        >
          <Flame size={20} lit={o > 0} />
        </Ring>
        <span className="li-text">
          <span className="eyebrow">Meta de hoy</span>
          <span className="li-title" style={{ display: "block", fontSize: 19 }}>
            {Math.floor(today.s / 60)} de {Math.round(today.g / 60)} min
          </span>
          <span className="li-sub">
            {o} {o === 1 ? "día seguido" : "días seguidos"} cumpliendo la meta
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row between">
          <div>
            <div className="eyebrow">Tu nivel</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{t.name}</div>
          </div>
          <div className="mid-num" style={{ fontSize: 44 }}>
            {a.rating.value}
          </div>
        </div>
        <Sparkline points={c} />
        <p className="muted small" style={{ marginTop: 6 }}>
          {s
            ? `Te faltan ${s.min - a.rating.value} puntos para ${s.name}.`
            : "Llegaste al nivel más alto."}
          {" Tu puntaje sube cuando acertás manos en Entrenar."}
        </p>
      </div>
      <div className="tiles" style={{ marginTop: 14 }}>
        <div className="tile">
          <div className="tile-v num">{a.train.totalHands}</div>
          <div className="tile-l">manos entrenadas</div>
        </div>
        <div className="tile">
          <div
            className={cx(
              "tile-v num",
              i !== null && (i >= 0.9 ? "good" : i >= 0.7 ? "acc" : "bad"),
            )}
          >
            {i === null ? "—" : `${Math.round(i * 100)}%`}
          </div>
          <div className="tile-l">precisión</div>
        </div>
        <div className="tile">
          <div className="tile-v num">{o}</div>
          <div className="tile-l">
            {o === 1 ? "día con la meta" : "días con la meta"}
          </div>
        </div>
        <div className="tile">
          <div className="tile-v num">
            {n}
            <span className="muted" style={{ fontSize: 18 }}>
              /{LESSONS.length}
            </span>
          </div>
          <div className="tile-l">lecciones</div>
        </div>
        <div className="tile">
          <div className="tile-v num">{l}</div>
          <div className="tile-l">ejercicios de conteo</div>
        </div>
        <div className="tile">
          <div className="tile-v num">{a.play.hands}</div>
          <div className="tile-l">manos en la mesa</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Últimas 5 semanas
        </div>
        <div className="cal">
          {r.map((C) => {
            const g = goalDay(a, C);
            return (
              <span
                className={cx(
                  "cal-d",
                  g.s >= g.g ? "on" : (g.s > 0 || a.activity[C]) && "part",
                  C === u && "today",
                )}
                title={C}
                key={C}
              />
            );
          })}
        </div>
        <div className="legend" style={{ marginTop: 12 }}>
          <span>
            <i style={{ background: "var(--accent)" }} />
            meta cumplida
          </span>
          <span>
            <i style={{ background: "#5c5d33" }} />
            practicaste un rato
          </span>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <ProfileCard st={a} />
      </div>
      {a.train.totalHands === 0 ? (
        <Button onClick={() => e.setTab("entrenar")} style={{ marginTop: 16 }}>
          Hacer mi primera tanda
        </Button>
      ) : null}
    </>
  );
}
const BREAKDOWN_GROUPS = [
  { id: "all", name: "Todas las manos" },
  { id: "stiff", name: "Duras 12–16" },
  { id: "soft", name: "Blandas" },
  { id: "pairs", name: "Pares" },
  { id: "doubles", name: "Dobles" },
  { id: "easy", name: "Fáciles (5–8 y 17+)" },
];
function ProgressBreakdown({ st: a, nav: e, setInfo: t }) {
  let s = useRules(),
    n = a.train.cells,
    l = weakSpots(n),
    i = strongSpots(n),
    o = a.train.sessions.filter((r) => r.kind !== "exam").slice(-7),
    c = BREAKDOWN_GROUPS.map((r) => {
      let u =
        r.id === "all"
          ? Object.keys(n).filter((d) => !d.startsWith("C:"))
          : skillSpots(r.id, s);
      return { ...r, ...spotsAccuracy(n, u) };
    });
  return (
    <>
      <div className="card">
        <div className="eyebrow row" style={{ gap: 6 }}>
          {"Dónde más fallás "}
          <InfoDot onClick={() => t("leaks")} />
        </div>
        {l.length ? (
          <div style={{ marginTop: 8 }}>
            {l.map((r) => (
              <div className="kv" style={{ alignItems: "center" }} key={r.key}>
                <span>
                  <span className="kv-k">{spotTitle(r.key)}</span>
                  <span className="muted small" style={{ display: "block" }}>
                    {Math.round(r.acc * 100)}
                    {" % en tus últimos intentos"}
                  </span>
                </span>
                <Button
                  small={true}
                  kind="secondary"
                  onClick={() =>
                    e.push("trainSession", {
                      mode: "spot",
                      focus: r.key,
                      confirmExit: true,
                    })
                  }
                >
                  Practicar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 10 }}>
            Jugá más manos para encontrar tus puntos débiles.
          </p>
        )}
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow">Precisión en el tiempo</div>
        <div className="bars" style={{ marginBottom: 34 }}>
          {Array.from({ length: 7 }, (r, u) => {
            let d = o[o.length - 7 + u];
            if (!d)
              return <span className="b" style={{ height: 14 }} key={u} />;
            let p = d.ok / d.n,
              f = d.after - d.before;
            return (
              <span
                className={cx("b", p >= 0.9 ? "on" : p >= 0.7 ? "mid" : "low")}
                style={{ height: `${Math.max(10, p * 100)}%` }}
                key={u}
              >
                <span className={f >= 0 ? "good" : "bad"}>
                  {f >= 0 ? "+" : "−"}
                  {Math.abs(f)}
                </span>
              </span>
            );
          })}
        </div>
        <div className="row between small muted">
          <span>Más vieja</span>
          <span>
            {"tus últimas "}
            {o.length} {o.length === 1 ? "tanda" : "tandas"}
          </span>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow">Por tipo de mano</div>
        {c.map((r) => (
          <div style={{ marginTop: 16 }} key={r.id}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{r.name}</h3>
            <div className="tiles">
              <div className="tile">
                <div className="tile-v num">{r.n}</div>
                <div className="tile-l">jugadas</div>
              </div>
              <div className="tile">
                <div className="tile-v num">{r.ok}</div>
                <div className="tile-l">correctas</div>
              </div>
              <div className="tile">
                <div
                  className={cx(
                    "tile-v num",
                    r.acc !== null &&
                      (r.acc >= 0.9 ? "good" : r.acc >= 0.7 ? "acc" : "bad"),
                  )}
                >
                  {r.acc === null ? "—" : `${Math.round(r.acc * 100)}%`}
                </div>
                <div className="tile-l">precisión</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow">Tus manos más fuertes</div>
        {i.length ? (
          <div className="tags" style={{ marginTop: 12 }}>
            {i.map((r) => (
              <span className="chip-tag good" key={r.key}>
                {spotTitle(r.key)}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 10 }}>
            Jugá más manos para ver tus fortalezas.
          </p>
        )}
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow row" style={{ gap: 6 }}>
          {"Mapa de decisiones "}
          <InfoDot onClick={() => t("heat")} />
        </div>
        <Heatmap cells={n} />
      </div>
    </>
  );
}
function Heatmap({ cells: a }) {
  let [e, t] = useState("hard"),
    s =
      e === "hard"
        ? [
            { label: "17+", keys: [17, 18, 19].map((n) => `H${n}`) },
            ...[16, 15, 14, 13, 12, 11, 10, 9].map((n) => ({
              label: String(n),
              keys: [`H${n}`],
            })),
            { label: "5–8", keys: [5, 6, 7, 8].map((n) => `H${n}`) },
          ]
        : e === "soft"
          ? [20, 19, 18, 17, 16, 15, 14, 13].map((n) => ({
              label: `A,${n - 11}`,
              keys: [`S${n}`],
            }))
          : ["A", "T", "9", "8", "7", "6", "5", "4", "3", "2"].map((n) => ({
              label: n === "T" ? "10,10" : `${n},${n}`,
              keys: [`P${n}`],
            }));
  return (
    <div style={{ marginTop: 12 }}>
      <Segmented
        small={true}
        options={[
          { value: "hard", label: "Duras" },
          { value: "soft", label: "Blandas" },
          { value: "pairs", label: "Pares" },
        ]}
        value={e}
        onChange={t}
      />
      <div className="heat-row" style={{ marginTop: 14 }}>
        <span />
        {["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"].map((n) => (
          <span className="chart-col" key={n}>
            {n}
          </span>
        ))}
      </div>
      {s.map((n) => (
        <div className="heat-row" key={n.label}>
          <span className="chart-rowlabel">{n.label}</span>
          {UPS.map((l) => {
            let i = 0,
              o = 0;
            for (let r of n.keys) {
              let u = a[`${r}|${l}`];
              if (u) {
                i += u.n;
                o += u.ok;
              }
            }
            let c = i ? o / i : null;
            return (
              <span
                className={cx(
                  "heat-cell",
                  c === null
                    ? ""
                    : c >= 0.9
                      ? "strong"
                      : c >= 0.7
                        ? "ok"
                        : "weak",
                )}
                title={
                  c === null
                    ? "Sin ver"
                    : `${Math.round(c * 100)} % (${o}/${i})`
                }
                key={l}
              >
                {c === null ? "" : Math.round(c * 100)}
              </span>
            );
          })}
        </div>
      ))}
      <div className="legend">
        <span>
          <i style={{ background: "var(--bad)" }} />
          floja
        </span>
        <span>
          <i style={{ background: "var(--accent)" }} />
          bien
        </span>
        <span>
          <i style={{ background: "var(--good)" }} />
          fuerte
        </span>
        <span>
          <i style={{ background: "var(--surface-3)" }} />
          sin ver
        </span>
      </div>
    </div>
  );
}
function Records({ st: a }) {
  let e = Date.now() - 604800000,
    t = a.train.sessions.filter((f) => f.t >= e && f.kind !== "exam"),
    s = t.reduce((f, y) => f + (y.after - y.before), 0),
    n = a.train.bestSession,
    l = a.train.exams,
    i = l.length ? l.reduce((f, y) => (y.ok / y.n > f.ok / f.n ? y : f)) : null,
    o = a.drills.running.bestPerfect,
    c = a.drills.deck && a.drills.deck.bestMs,
    r = LESSONS.filter(
      (f) =>
        a.lessons[f.id] &&
        a.lessons[f.id].best === 1 &&
        !a.lessons[f.id].viaTest,
    ).length,
    u = new Date();
  u.setDate(u.getDate() - 1);
  let d =
      a.daily.last === dayKey() || a.daily.last === dayKey(u)
        ? a.daily.streak
        : 0,
    p = [
      [
        "Puntaje ganado esta semana",
        t.length ? `${s >= 0 ? "+" : "−"}${Math.abs(s)}` : "todavía no",
      ],
      ["Puntaje más alto", String(a.rating.peak)],
      [
        "Mejor tanda",
        n
          ? `${Math.round((n.ok / n.n) * 100)} % (${n.ok} de ${n.n})`
          : "todavía no",
      ],
      ["Racha de aciertos más larga", String(a.train.longestStreak || 0)],
      [
        "Conteo perfecto más rápido",
        o
          ? `${o.n} cartas · ${(o.ms / 1000).toFixed(1).replace(".", ",")} s`
          : "todavía no",
      ],
      [
        "Mazo completo",
        c ? `${(c / 1000).toFixed(1).replace(".", ",")} s` : "todavía no",
      ],
      [
        "Mejor examen de nivel",
        i
          ? `${Math.round((i.ok / i.n) * 100)} % · ${shortDate(i.t)}`
          : "todavía no",
      ],
      [
        "Racha de meta diaria",
        `${goalStreak(a)} ${goalStreak(a) === 1 ? "día" : "días"} (récord ${bestGoalStreak(a)})`,
      ],
      [
        "Desafío diario",
        `${d} ${d === 1 ? "día" : "días"} (récord ${a.daily.best})`,
      ],
      ["Lecciones con 100 %", String(r)],
    ];
  return (
    <>
      <div className="card">
        <div className="eyebrow">Tus récords</div>
        {p.map(([f, y]) => (
          <div className="kv" key={f}>
            <span className="kv-k">{f}</span>
            <span className="kv-v">{y}</span>
          </div>
        ))}
      </div>
      <p className="muted small center" style={{ margin: "18px 10px" }}>
        Todos estos números son tuyos y salen de tu juego real. Se guardan solo
        en este dispositivo: hacé un respaldo desde Ajustes si cambiás de
        celular.
      </p>
    </>
  );
}
export { ProgressTab };
