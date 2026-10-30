import { useEffect, useMemo, useRef, useState } from "react";
import {
  dayKey,
  getState,
  markActive,
  markPathDone,
  recordDrill,
  setState,
  useStore,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import {
  RANKS,
  SUITS,
  buildDecks,
  hashString,
  makeCard,
  randInt,
  seededRandom,
  shuffle,
  weightedIndex,
} from "../engine/cards.js";
import { sfx, vibrate } from "../sound.js";
import { APP_MODE, hasPremium, watchAdForReward } from "../platform.js";
import { CLOUD } from "../cloud.js";
import {
  Button,
  IconButton,
  Keypad,
  Modal,
  Pills,
  PlayingCard,
  Ring,
  Segments,
  cx,
  formatKeypad,
  parseKeypad,
} from "../ui/components.jsx";
import {
  betUnits,
  countValue,
  floorTC,
  fmtSigned,
  fmtTag,
  systemFor,
  systemTags,
} from "../engine/systems.js";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import { ShareButton } from "../ui/ShareButton.jsx";
import { recordLevel, recordLevelPractice } from "../state.js";
import { levelByN } from "../engine/countPath.js";
import { CardTag, LevelActions, LevelOutcome } from "./countPath.jsx";
import { BetRamp, useReveal } from "../lessons/visuals.jsx";

const DRILL_SPEEDS = [
  { id: "relaxed", label: "Relajado", ms: 1500 },
  { id: "normal", label: "Normal", ms: 1000 },
  { id: "fast", label: "Rápido", ms: 650 },
  { id: "pro", label: "Pro", ms: 400 },
];
function useBackGuard(a) {
  useEffect(() => {
    let e = () => a(true);
    window.addEventListener("v21-back", e);
    return () => window.removeEventListener("v21-back", e);
  }, []);
}
function ExitDrillModal({
  open: a,
  onStay: e,
  onLeave: t,
  text: s = "El ejercicio no se va a guardar.",
}) {
  return (
    <Modal open={a} onClose={e}>
      <h2 style={{ fontSize: 24 }}>¿Salir del ejercicio?</h2>
      <p className="muted" style={{ margin: "10px 0 20px" }}>
        {s}
      </p>
      <div className="btns">
        <Button kind="secondary" onClick={e}>
          Seguir
        </Button>
        <Button kind="danger" onClick={t}>
          Salir
        </Button>
      </div>
    </Modal>
  );
}
// En la práctica con ayuda, cada botón dice qué cartas van en él (Hi-Lo).
const HILO_GROUPS = { 1: "2 a 6", 0: "7, 8 y 9", "-1": "10 a As" };
function DrillValues({
  count: a = 12,
  pathStep: e = null,
  level: lv = null,
  practice = false,
}) {
  const level = lv ? levelByN(lv) : null;
  if (level) a = level.count;
  let t = useNav(),
    s = useStore(),
    // La ruta de conteo es en Hi-Lo; la práctica libre usa tu sistema.
    n = systemFor(level ? "hilo" : s.settings.system),
    [l] = useState(() => {
      let B = getState().drills.values.ranks || {},
        Z = [],
        ta = RANKS.map((Ma) => {
          let ca = B[Ma],
            ha =
              Ma === "10" || Ma === "J" || Ma === "Q" || Ma === "K" ? 1 : 1.3;
          return !ca || !ca.n ? ha : ha + (1 - ca.ok / ca.n) * 4;
        }),
        Ba = null;
      for (; Z.length < a; ) {
        let Ma = RANKS[weightedIndex(ta)];
        if (Ma !== Ba) {
          Ba = Ma;
          Z.push(makeCard(Ma, SUITS[randInt(4)]));
        }
      }
      return Z;
    }),
    [i, o] = useState(0),
    [c, r] = useState([]),
    [u, d] = useState(null),
    [p, f] = useState(0),
    [y, C] = useState(0),
    [k, v] = useState(false),
    [m, b] = useState(null),
    S = useRef(Date.now());
  useBackGuard(v);
  let D = systemTags(n),
    _ = (B) => {
      if (u) return;
      let Z = l[i],
        ta = countValue(Z, n),
        Ba = Math.abs(B - ta) < 1e-9;
      if (Ba) {
        sfx.good();
      } else {
        sfx.bad();
      }
      vibrate(Ba ? 6 : 25);
      let Ma = Ba ? p + 1 : 0;
      f(Ma);
      C((ha) => Math.max(ha, Ma));
      let ca = [...c, Ba];
      r(ca);
      d({ ok: Ba, val: ta });
      setTimeout(
        () => {
          d(null);
          if (i + 1 >= l.length) {
            M(ca, Math.max(y, Ma));
          } else {
            o(i + 1);
          }
        },
        Ba ? 420 : 1300,
      );
    },
    M = (B, Z) => {
      let ta = B.filter(Boolean).length,
        Ba = l.filter((ca, ha) => !B[ha]),
        Ma = {
          t: Date.now(),
          n: l.length,
          ok: ta,
          sys: n.id,
          ms: Date.now() - S.current,
        };
      recordDrill("values", Ma, (ca) => {
        let ha = { ...(ca.ranks || {}) };
        l.forEach((Ia, X) => {
          let P = Ia.r,
            w = ha[P] ? { ...ha[P] } : { n: 0, ok: 0 };
          w.n++;
          if (B[X]) {
            w.ok++;
          }
          ha[P] = w;
        });
        return { ranks: ha, bestStreak: Math.max(ca.bestStreak || 0, Z) };
      });
      if (ta / l.length >= 0.8) {
        markPathDone("values");
      }
      const passed = level && !practice ? ta >= level.pass : null;
      if (level && practice) recordLevelPractice(level.id);
      else if (level) recordLevel(level.id, passed, ta / l.length);
      b({ ok: ta, n: l.length, missed: Ba, bestRun: Z, passed });
    };
  if (m) {
    let B = getState().drills.values.bestStreak || m.bestRun;
    return (
      <DrillResult
        title="Valores de las cartas"
        ok={m.ok}
        n={m.n}
        unit="cartas"
        tiles={[
          { v: m.n, l: "cartas" },
          { v: m.ok, l: "bien", tone: "good" },
          { v: B, l: "mejor racha" },
        ]}
        message={
          m.ok === m.n
            ? "Exacto: ese es el reflejo que necesita el conteo real."
            : m.ok / m.n >= 0.8
              ? "Muy bien. Repasá las que fallaste y vas a tenerlo automático."
              : "Repasá los valores y probá de nuevo."
        }
        missed={m.missed.map((Z) => ({
          card: Z,
          text: `vale ${fmtTag(countValue(Z, n))}`,
        }))}
        onAgain={() => t.replace("drillValues", { count: a, pathStep: e })}
        onBack={() => t.pop()}
        level={level}
        passed={m.passed}
        practice={practice}
      />
    );
  }
  let R = l[i],
    V = l.map((B, Z) =>
      Z < c.length ? (c[Z] ? "ok" : "miss") : Z === i ? "cur" : "",
    );
  return (
    <div className="drill">
      <TopBar
        onClose={() => (i > 0 ? v(true) : t.pop())}
        title={practice ? "Práctica: valores" : "Valores de las cartas"}
        sub={
          <span>
            {i + 1}
            {" / "}
            {l.length}
            {p > 1 ? (
              <span className="streak-red">
                {" · ✦ "}
                {p}
                {" seguidas"}
              </span>
            ) : null}
          </span>
        }
      />
      <Segments total={l.length} states={V} className="drill-segs" />
      <h2 className="center drill-q">¿Cuánto vale esta carta?</h2>
      <div className="center">
        <span className="chip-tag">{n.short || n.name}</span>
      </div>
      <div className="drill-stage">
        <div className="peek">
          {i + 1 < l.length ? (
            <PlayingCard card={l[i + 1]} size="lg" down={true} />
          ) : (
            <span className="muted small">Última carta</span>
          )}
        </div>
        <PlayingCard
          card={R}
          size="xl"
          deal={true}
          glow={u ? (u.ok ? "good" : "bad") : null}
          key={R.id}
        />
      </div>
      <p className={cx("center tag-fb", u && (u.ok ? "good" : "bad"))}>
        {u
          ? u.ok
            ? "¡Bien!"
            : `${R.r === "A" ? "El As" : "El " + R.r} vale ${fmtTag(u.val)}`
          : "\xA0"}
      </p>
      <div
        className={cx(
          "tag-btns",
          D.length > 3 && "many",
          practice && n.id === "hilo" && "with-groups",
        )}
      >
        {D.map((B) => (
          <button
            type="button"
            className={cx(
              "tag-btn",
              B < 0 ? "neg" : B > 0 ? "pos" : "",
              u && Math.abs(u.val - B) < 1e-9 && "reveal",
            )}
            onClick={() => _(B)}
            key={B}
          >
            {fmtTag(B)}
            {practice && n.id === "hilo" ? (
              <span className="tag-group">{HILO_GROUPS[B]}</span>
            ) : null}
          </button>
        ))}
      </div>
      <ExitDrillModal
        open={k}
        onStay={() => v(false)}
        onLeave={() => t.pop()}
      />
    </div>
  );
}
function DrillResult({
  title: a,
  ok: e,
  n: t,
  unit: s,
  tiles: n,
  message: l,
  missed: i,
  onAgain: o,
  onBack: c,
  extra: r,
  ringValue: u,
  level = null,
  passed = null,
  practice = false,
}) {
  let d = t ? e / t : 0;
  return (
    <div className="fade-up drill-result">
      <div className="topbar">
        <IconButton icon="back" className="sq" label="Volver" onClick={c} />
        <div className="grow center" style={{ fontWeight: 700, fontSize: 19 }}>
          {a}
        </div>
        <span style={{ width: 44 }} />
      </div>
      <div className="center" style={{ marginTop: 10 }}>
        <div style={{ display: "inline-block" }}>
          <Ring value={u ?? d} size={190} stroke={16}>
            <div className="mid-num" style={{ fontSize: 50 }}>
              {Math.round(d * 100)}%
            </div>
            <div className="muted small" style={{ fontWeight: 700 }}>
              correcto
            </div>
          </Ring>
        </div>
        <p className="muted" style={{ marginTop: 14, fontSize: 18 }}>
          {e}
          {" de "}
          {t} {s}
        </p>
      </div>
      {n ? (
        <div className="card sum-tiles">
          {n.map((p, f) => (
            <div key={f}>
              <b className={cx("num", p.tone)}>{p.v}</b>
              <span>{p.l}</span>
            </div>
          ))}
        </div>
      ) : null}
      {i && i.length ? (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Las que te costaron
          </div>
          {i.slice(0, 8).map((p, f) => (
            <div className="row" style={{ padding: "6px 0" }} key={f}>
              {p.card ? <PlayingCard card={p.card} size="xs" /> : null}
              <span className="grow">{p.text}</span>
            </div>
          ))}
          {i.some((p) => p.card) ? (
            <p className="muted small" style={{ marginTop: 8 }}>
              Estas cartas van a salir un poco más seguido en los próximos
              ejercicios.
            </p>
          ) : null}
        </div>
      ) : null}
      {r}
      {level ? (
        <LevelOutcome level={level} passed={passed} practice={practice} />
      ) : null}
      <p className="center muted" style={{ margin: "18px 0" }}>
        {l}
      </p>
      {level ? (
        <LevelActions level={level} passed={passed} practice={practice} />
      ) : (
        <div className="btns">
          <Button onClick={o}>Otra vez</Button>
          <Button kind="outline" onClick={c}>
            Volver
          </Button>
        </div>
      )}
    </div>
  );
}
// Conteo corrido: mirás una secuencia de cartas y al final escribís el conteo.
// Sirve para la práctica libre, el desafío diario y los niveles 3 a 7 de la ruta de conteo.
const DISTRACT_LINES = [
  "¿Me cambiás estos billetes?",
  "¡Vamos, que sale un diez!",
  "Mozo, ¿me trae un café?",
  "¿Cuánto paga el seguro?",
  "Esta mesa está fría hoy…",
  "¿Vos sabés a qué hora cierran?",
  "¡Uh, otra vez 16!",
  "¿Me pasás las fichas verdes?",
  "¿Sos de acá?",
  "Dale, dale, que viene el As.",
];
const SLOWER = {
  pro: "fast",
  fast: "normal",
  normal: "relaxed",
  relaxed: "relaxed",
};
// Desafío diario: cada día de la semana trae otro formato (igual para todos ese día).
const DAILY_FORMATS = [
  { name: "Maratón de domingo", n: 40, speed: "normal", mode: "single" },
  { name: "Lunes tranqui", n: 20, speed: "normal", mode: "single" },
  { name: "Martes rápido", n: 24, speed: "fast", mode: "single" },
  { name: "Miércoles de a dos", n: 24, speed: "normal", mode: "pairs" },
  {
    name: "Jueves con ruido",
    n: 20,
    speed: "normal",
    mode: "single",
    distract: true,
  },
  { name: "Viernes largo", n: 30, speed: "normal", mode: "single" },
  { name: "Sábado a fondo", n: 24, speed: "fast", mode: "pairs" },
];
function dailyFormat(date = new Date()) {
  return DAILY_FORMATS[date.getDay()];
}
// Puntaje del desafío: 100 si acertás (más un extra si contestás rápido); cerca, algo de puntos.
function dailyScore(err, answerMs) {
  if (err === 0) return 100 + Math.max(0, Math.round((8000 - answerMs) / 400));
  return Math.max(0, 60 - 20 * Math.abs(err));
}

function DrillRunning({
  daily = false,
  n,
  speed,
  mode,
  level: levelN = null,
  practice = false,
}) {
  const nav = useNav();
  const st = useStore();
  const level = levelN ? levelByN(levelN) : null;
  const sys = systemFor(level ? "hilo" : st.settings.system);
  const [cfg, setCfg] = useState(() =>
    level
      ? {
          n: level.cards,
          // Practicando, un paso más lento que el nivel (lo podés cambiar).
          speed: practice ? SLOWER[level.speed] : level.speed,
          mode: level.mode || "single",
          distract: !!level.distract,
        }
      : daily
        ? { ...dailyFormat(), distract: !!dailyFormat().distract }
        : {
            n: n || 15,
            speed: speed || "normal",
            mode: mode || "single",
            distract: false,
          },
  );
  const [phase, setPhase] = useState(daily || level ? "ready" : "setup");
  const [cards, setCards] = useState([]);
  const [pos, setPos] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [showCount, setShowCount] = useState(true);
  const startedAt = useRef(0);
  const answeredAt = useRef(0);
  useBackGuard(setExitOpen);
  const today = dayKey();
  const dailyNumber = useMemo(
    () =>
      Math.floor((Date.now() - new Date(2026, 0, 1).getTime()) / 86400000) + 1,
    [],
  );

  // Con distracciones, cada "golpe" puede traer una o dos cartas, en distintos lugares de la mesa.
  const steps = useMemo(() => {
    const out = [];
    let i = 0;
    while (i < cards.length) {
      const k =
        cfg.mode === "pairs"
          ? 2
          : cfg.distract && i > 2 && randInt(4) === 0
            ? 2
            : 1;
      out.push({
        from: i,
        to: Math.min(cards.length, i + k),
        x: cfg.distract ? randInt(90) - 45 : 0,
        y: cfg.distract ? randInt(40) - 20 : 0,
        rot: cfg.distract ? randInt(17) - 8 : 0,
        talk:
          cfg.distract && i > 1 && randInt(3) === 0
            ? DISTRACT_LINES[randInt(DISTRACT_LINES.length)]
            : null,
        chips: cfg.distract && randInt(5) === 0,
      });
      i += k;
    }
    return out;
  }, [cards, cfg.mode, cfg.distract]);

  const deal = () => {
    const seq = daily
      ? shuffle(
          buildDecks(1),
          // La segunda oportunidad trae otras cartas (las primeras ya las viste en el repaso).
          seededRandom(
            hashString(
              "v21-daily-" +
                today +
                (st.daily.results[today] && st.daily.results[today].retry
                  ? "-2"
                  : ""),
            ),
          ),
        ).slice(0, cfg.n)
      : shuffle(buildDecks(2)).slice(0, cfg.n);
    setCards(seq);
    setPos(0);
    setValue("");
    setResult(null);
    setPhase("watch");
    startedAt.current = Date.now();
  };
  const per = cfg.mode === "pairs" ? 2 : 1;
  const ms = (DRILL_SPEEDS.find((s) => s.id === cfg.speed) || DRILL_SPEEDS[1])
    .ms;
  useEffect(() => {
    if (phase !== "watch") return;
    if (pos >= steps.length) {
      answeredAt.current = Date.now();
      setPhase("answer");
      return;
    }
    sfx.card();
    const step = steps[pos];
    const timer = setTimeout(
      () => setPos((p) => p + 1),
      ms * (step.to - step.from > 1 ? 1.5 : 1),
    );
    return () => clearTimeout(timer);
  }, [phase, pos, steps.length]);

  const correct = cards.reduce((sum, c) => sum + countValue(c, sys), 0);
  const submit = () => {
    const v = parseKeypad(value);
    if (v === null) return;
    const ok = Math.abs(v - correct) < 1e-9;
    if (ok) sfx.good();
    else sfx.bad();
    const elapsed = (answeredAt.current || Date.now()) - startedAt.current;
    const res = {
      v,
      ok,
      err: v - correct,
      elapsed,
      answerMs: Date.now() - (answeredAt.current || Date.now()),
    };
    setResult(res);
    setPhase("review");
    recordDrill(
      "running",
      {
        t: Date.now(),
        n: cards.length,
        ok,
        speed: cfg.speed,
        mode: cfg.mode,
        ms: elapsed,
        sys: sys.id,
        daily,
        level: level ? level.id : undefined,
      },
      (d) => {
        let best = d.bestPerfect || null;
        if (ok) {
          const rate = cards.length / (elapsed / 1000);
          if (!best || rate > best.rate)
            best = {
              rate,
              n: cards.length,
              speed: cfg.speed,
              ms: elapsed,
              t: Date.now(),
            };
        }
        return { bestPerfect: best };
      },
    );
    markPathDone("running");
    if (level && practice) recordLevelPractice(level.id);
    else if (level) recordLevel(level.id, ok, ok ? 1 : 0);
    if (daily) {
      setState((s) => {
        const d = s.daily;
        const first = d.results[today];
        // Solo cuenta el primer intento, salvo que se haya ganado la segunda oportunidad.
        if (first && !first.retry) return s;
        const base = first ? first.prevStreak || 0 : d.streak;
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const streak = ok
          ? d.last === dayKey(y) || d.last === today
            ? base + 1
            : 1
          : 0;
        return markActive({
          ...s,
          daily: {
            ...d,
            last: ok ? today : d.last,
            streak,
            best: Math.max(d.best, streak),
            results: {
              ...d.results,
              [today]: {
                ok,
                err: res.err,
                score: dailyScore(res.err, res.answerMs || 9000),
                prevStreak: base,
                second: !!first,
              },
            },
          },
        });
      });
    }
  };

  const title = level
    ? practice
      ? `Práctica: ${level.title}`
      : `Nivel ${level.n}: ${level.title}`
    : daily
      ? `Desafío diario #${dailyNumber}`
      : "Conteo corrido";
  const phases = (
    <div className="phase-steps">
      <span
        className={cx(
          phase === "watch" && "on",
          (phase === "answer" || phase === "review") && "past",
        )}
      >
        1 Ver
      </span>
      <Icon name="chev" size={14} />
      <span
        className={cx(phase === "answer" && "on", phase === "review" && "past")}
      >
        2 Responder
      </span>
      <Icon name="chev" size={14} />
      <span className={cx(phase === "review" && "on")}>3 Revisar</span>
    </div>
  );
  const exitModal = (
    <ExitDrillModal
      open={exitOpen}
      onStay={() => setExitOpen(false)}
      onLeave={() => nav.pop()}
    />
  );

  if (phase === "setup" || phase === "ready") {
    const doneToday = daily && st.daily.results[today];
    return (
      <div className="drill fade-up">
        <TopBar
          onClose={() => nav.pop()}
          title={level ? "Ruta de conteo" : title}
          sub={level ? `Nivel ${level.n} de 10` : null}
        />
        <div className="card" style={{ marginTop: 6 }}>
          <h2 style={{ fontSize: 24 }}>
            {level
              ? level.title
              : daily
                ? "El conteo del día"
                : "Llevá el total mientras caen las cartas"}
          </h2>
          <p className="muted" style={{ marginTop: 8 }}>
            {level
              ? `${cfg.n} cartas ${cfg.distract ? "con distracciones" : `a ritmo ${(DRILL_SPEEDS.find((s) => s.id === cfg.speed) || {}).label.toLowerCase()}`}. Arrancás en 0 y al final escribís el conteo corrido (running count) en Hi-Lo.`
              : daily
                ? `${dailyFormat().name}: ${cfg.n} cartas${cfg.mode === "pairs" ? " de a dos" : ""}${cfg.distract ? " con distracciones" : ""} a ritmo ${(DRILL_SPEEDS.find((s) => s.id === cfg.speed) || {}).label.toLowerCase()}, iguales para todos hoy. Si acertás sumás 100 puntos, más un extra si contestás rápido. Tu primer intento cuenta${st.daily.streak ? ` (vas ${st.daily.streak} ${st.daily.streak === 1 ? "día" : "días"} seguidos)` : ""}.`
                : `Vas a ver las cartas de a ${cfg.mode === "pairs" ? "dos" : "una"}. Al final escribís el conteo corrido (running count) en ${sys.short || sys.name}. Arrancás en 0.`}
          </p>
          {level && practice ? (
            <p className="small" style={{ marginTop: 10, fontWeight: 700 }}>
              Práctica con ayuda: cada carta muestra su valor y ves el conteo
              mientras caen. No cuenta como intento.
            </p>
          ) : level ? (
            <p className="small" style={{ marginTop: 10, fontWeight: 700 }}>
              Para aprobar: {level.goal}
            </p>
          ) : null}
          {doneToday && doneToday.retry && !doneToday.second ? (
            <p
              className="small good"
              style={{ marginTop: 10, fontWeight: 700 }}
            >
              Segunda oportunidad: este intento cuenta, con otras cartas.
            </p>
          ) : doneToday ? (
            <p
              className={cx("small", doneToday.ok ? "good" : "bad")}
              style={{ marginTop: 10, fontWeight: 700 }}
            >
              Hoy ya lo hiciste:{" "}
              {doneToday.ok
                ? "acertaste"
                : `le erraste por ${Math.abs(doneToday.err)}`}
              . Podés practicarlo igual.
            </p>
          ) : null}
          {doneToday &&
          !doneToday.ok &&
          !doneToday.second &&
          !doneToday.retry ? (
            <SecondChance
              streak={doneToday.prevStreak || 0}
              onGo={() =>
                setState((s) => ({
                  ...s,
                  daily: {
                    ...s.daily,
                    results: {
                      ...s.daily.results,
                      [today]: { ...s.daily.results[today], retry: true },
                    },
                  },
                }))
              }
            />
          ) : null}
        </div>
        {level && practice ? (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="eyebrow">Velocidad de la práctica</div>
            <Pills
              className="left"
              options={DRILL_SPEEDS.slice(0, 3).map((s) => ({
                value: s.id,
                label: s.label,
              }))}
              value={cfg.speed}
              onChange={(v) => setCfg({ ...cfg, speed: v })}
            />
            <p className="muted small" style={{ marginTop: 10 }}>
              El nivel se rinde a ritmo{" "}
              {(
                DRILL_SPEEDS.find((s) => s.id === level.speed) || {}
              ).label.toLowerCase()}
              .
            </p>
          </div>
        ) : null}
        {daily || level ? null : (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="eyebrow">Velocidad</div>
            <Pills
              className="left"
              options={DRILL_SPEEDS.map((s) => ({
                value: s.id,
                label: s.label,
              }))}
              value={cfg.speed}
              onChange={(v) => setCfg({ ...cfg, speed: v })}
            />
            <div className="eyebrow" style={{ marginTop: 18 }}>
              Cantidad de cartas
            </div>
            <Pills
              className="left"
              options={[10, 15, 20, 30, 52].map((v) => ({
                value: v,
                label: v === 52 ? "52 (un mazo)" : String(v),
              }))}
              value={cfg.n}
              onChange={(v) => setCfg({ ...cfg, n: v })}
            />
            <div className="eyebrow" style={{ marginTop: 18 }}>
              Cómo salen
            </div>
            <Pills
              className="left"
              options={[
                { value: "single", label: "De a una" },
                { value: "pairs", label: "De a dos" },
              ]}
              value={cfg.mode}
              onChange={(v) => setCfg({ ...cfg, mode: v })}
            />
            <p className="muted small" style={{ marginTop: 12 }}>
              De a dos te obliga a cancelar parejas: una alta y una baja juntas
              suman 0.
            </p>
            <div className="eyebrow" style={{ marginTop: 18 }}>
              Distracciones
            </div>
            <Pills
              className="left"
              options={[
                { value: false, label: "Sin" },
                { value: true, label: "Con charla y movimiento" },
              ]}
              value={cfg.distract}
              onChange={(v) => setCfg({ ...cfg, distract: v })}
            />
          </div>
        )}
        <div className="bottom-actions">
          <Button onClick={deal}>Empezar</Button>
        </div>
      </div>
    );
  }

  if (phase === "watch") {
    const step = steps[Math.min(pos, steps.length - 1)];
    const shown = step ? cards.slice(step.from, step.to) : [];
    const seen = step ? step.to : 0;
    return (
      <div className="drill">
        <TopBar
          onClose={() => setExitOpen(true)}
          title={title}
          sub={`${seen} / ${cards.length}`}
        />
        <div className="drill-progress">
          <span style={{ width: `${(seen / cards.length) * 100}%` }} />
        </div>
        {phases}
        <div className={cx("watch-stage", cfg.distract && "distract")}>
          {cfg.distract && step && step.talk ? (
            <div className="distract-talk" key={"t" + pos}>
              “{step.talk}”
            </div>
          ) : null}
          {cfg.distract && step && step.chips ? (
            <span className="distract-chips" key={"c" + pos} />
          ) : null}
          <div
            className="watch-cards"
            key={pos}
            style={
              step
                ? {
                    transform: `translate(${step.x}px, ${step.y}px) rotate(${step.rot}deg)`,
                  }
                : null
            }
          >
            {shown.map((c) => (
              <span className="tagged-card" key={c.id}>
                <PlayingCard
                  card={c}
                  size={shown.length === 2 ? "lg" : "xl"}
                  deal={true}
                />
                {practice ? <CardTag card={c} /> : null}
              </span>
            ))}
          </div>
        </div>
        {practice ? (
          <button
            type="button"
            className={cx("live-count", !showCount && "hidden")}
            onClick={() => setShowCount(!showCount)}
            aria-label={showCount ? "Ocultar el conteo" : "Mostrar el conteo"}
          >
            <span className="eyebrow">Conteo</span>
            <b className="num">
              {showCount
                ? fmtSigned(
                    cards
                      .slice(0, seen)
                      .reduce((sum, c) => sum + countValue(c, sys), 0),
                  )
                : "?"}
            </b>
            <span className="tiny muted">
              {showCount ? "tocá para ocultarlo" : "tocá para verlo"}
            </span>
          </button>
        ) : null}
        {exitModal}
      </div>
    );
  }

  if (phase === "answer") {
    return (
      <div className="drill">
        <TopBar
          onClose={() => setExitOpen(true)}
          title={title}
          sub={`${cards.length} cartas`}
        />
        <div className="drill-progress">
          <span style={{ width: "100%" }} />
        </div>
        {phases}
        <h2 className="center drill-q">¿Cuál es el conteo corrido?</h2>
        <div className="keypad-display">{formatKeypad(value)}</div>
        <Keypad
          value={value}
          onChange={setValue}
          onSubmit={submit}
          allowHalf={sys.id === "halves"}
          submitLabel="Comprobar"
        />
        {exitModal}
      </div>
    );
  }

  let running = 0;
  const tip = result.ok
    ? level
      ? "Exacto."
      : "Exacto. Probá una velocidad más rápida cuando te salga seguido."
    : Math.abs(result.err) === 1
      ? "Te faltó o sobró una carta. Mirá el repaso: casi siempre es una neutra que contaste o una alta que se escapó."
      : "Hacelo de a parejas: cancelá una alta con una baja apenas caen, y solo las que sobran mueven tu conteo.";
  return (
    <div className="drill fade-up">
      <TopBar
        onClose={() => nav.pop()}
        title={title}
        sub={`${cards.length} / ${cards.length}`}
      />
      <div className="drill-progress">
        <span style={{ width: "100%" }} />
      </div>
      {phases}
      <div className="card review-head">
        <h2 className={result.ok ? "good" : "bad"} style={{ fontSize: 34 }}>
          {result.ok
            ? "¡Exacto!"
            : `Le erraste por ${fmtSigned(Math.abs(result.err)).replace("+", "")}`}
        </h2>
        <p className="muted num" style={{ marginTop: 4 }}>
          {cards.length} cartas · {(result.elapsed / 1000).toFixed(0)} s en
          total · {(DRILL_SPEEDS.find((s) => s.id === cfg.speed) || {}).label}
        </p>
        <div className="res-moves" style={{ marginTop: 14 }}>
          <div>
            <div className="eyebrow">Pusiste</div>
            <div className={cx("res-move num", result.ok ? "good" : "bad")}>
              {fmtSigned(result.v)}
            </div>
          </div>
          <div>
            <div className="eyebrow">Correcto</div>
            <div className="res-move num acc">{fmtSigned(correct)}</div>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          {tip}
        </p>
        {daily && st.daily.results[today] ? (
          <p className="small daily-score" style={{ marginTop: 10 }}>
            Desafío de hoy:{" "}
            <b className="num">{st.daily.results[today].score ?? 0} puntos</b>
          </p>
        ) : null}
        {daily && st.daily.results[today] ? (
          <div style={{ marginTop: 12 }}>
            <ShareButton
              label="Compartir el desafío"
              make={() => {
                const pts = st.daily.results[today].score ?? 0;
                const miss = Math.abs(result.err);
                return {
                  title: "Edge 21",
                  text: result.ok
                    ? `Desafío diario #${dailyNumber} de Edge 21: ✅ conteo exacto · ${pts} puntos 🃏`
                    : `Desafío diario #${dailyNumber} de Edge 21: ❌ le erré por ${miss} · ${pts} puntos 🃏`,
                  card: {
                    eyebrow: `Desafío diario #${dailyNumber}`,
                    big: `${pts} puntos`,
                    sub: result.ok ? "Conteo exacto" : `Le erré por ${miss}`,
                    lines: [
                      `${cards.length} cartas · ${(result.elapsed / 1000).toFixed(0)} s`,
                      st.daily.streak > 1
                        ? `${st.daily.streak} días seguidos`
                        : "",
                    ],
                  },
                };
              }}
            />
          </div>
        ) : null}
        {daily && st.daily.results[today] && CLOUD ? (
          <Button kind="ghost" onClick={() => nav.push("ranking")}>
            <Icon name="podium" size={18} /> Ver el ranking de hoy
          </Button>
        ) : null}
        {daily &&
        st.daily.results[today] &&
        !st.daily.results[today].ok &&
        !st.daily.results[today].second ? (
          <SecondChance
            streak={st.daily.results[today].prevStreak || 0}
            onGo={() => {
              setState((s) => ({
                ...s,
                daily: {
                  ...s.daily,
                  results: {
                    ...s.daily.results,
                    [today]: { ...s.daily.results[today], retry: true },
                  },
                },
              }));
              setPhase("ready");
            }}
          />
        ) : null}
      </div>
      {level ? (
        <LevelOutcome level={level} passed={result.ok} practice={practice} />
      ) : null}
      <div className="card seq-review">
        <h3>Repaso de la secuencia</h3>
        <div className="seq-head">
          <span>Carta</span>
          <span>Valor</span>
          <span>Conteo</span>
        </div>
        {cards.map((c, i) => {
          const v = countValue(c, sys);
          running += v;
          return (
            <div className="seq-row" key={c.id}>
              <span className="row" style={{ gap: 10 }}>
                <PlayingCard card={c} size="xs" />
                <span className="muted small num">{i + 1}</span>
              </span>
              <span
                className={cx("num", v > 0 ? "good" : v < 0 ? "bad" : "muted")}
              >
                {fmtTag(v)}
              </span>
              <b className="num">{fmtSigned(running)}</b>
            </div>
          );
        })}
      </div>
      <div className="bottom-actions">
        {level ? (
          <LevelActions level={level} passed={result.ok} practice={practice} />
        ) : (
          <div className="btns">
            <Button onClick={deal}>Otra vez</Button>
            <Button kind="outline" onClick={() => nav.pop()}>
              Volver
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
// Segunda oportunidad del desafío diario: un intento más que cuenta (con otras cartas),
// a cambio de mirar un anuncio en la app gratis. Con Premium o en la web, sin anuncio.
function SecondChance({ streak, onGo }) {
  const [busy, setBusy] = useState(false);
  const withAd = APP_MODE && !hasPremium();
  return (
    <div className="second-chance">
      <p className="small">
        {streak > 0
          ? `Ibas ${streak} ${streak === 1 ? "día" : "días"} seguidos. Salvá tu racha con otro intento que cuenta.`
          : "Tenés un intento más que cuenta para el puntaje de hoy."}
      </p>
      <Button
        kind="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await watchAdForReward();
          setBusy(false);
          if (ok) onGo();
        }}
      >
        <Icon name={withAd ? "play" : "refresh"} size={18} />{" "}
        {busy
          ? "Cargando…"
          : withAd
            ? "Segunda oportunidad (ver un anuncio)"
            : "Segunda oportunidad"}
      </Button>
    </div>
  );
}
function useQuiz(a, e = 10) {
  let [t] = useState(() => Array.from({ length: e }, (f, y) => a(y))),
    [s, n] = useState(0),
    [l, i] = useState(null),
    [o, c] = useState([]),
    [r, u] = useState(false),
    d = (f) => {
      if (l !== null) return;
      i(f);
      let y = f === t[s].answer;
      if (y) {
        sfx.good();
      } else {
        sfx.bad();
      }
      vibrate(y ? 6 : 25);
      c((C) => [...C, y]);
    },
    p = () => {
      i(null);
      if (s + 1 >= t.length) {
        u(true);
      } else {
        n(s + 1);
      }
    };
  return {
    qs: t,
    i: s,
    q: t[s],
    picked: l,
    pick: d,
    next: p,
    marks: o,
    done: r,
  };
}
function RevealBox({ className, children }) {
  const ref = useReveal();
  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
}
function QuizDrill({
  title: a,
  kind: e,
  d: t,
  render: s,
  explain: n,
  onAgain: l,
  resultMessage: i,
  level = null,
  practice = false,
}) {
  let o = useNav(),
    [c, r] = useState(false);
  useBackGuard(r);
  let u = useRef(false);
  const okCount = t.marks.filter(Boolean).length;
  const passed = level && t.done && !practice ? okCount >= level.pass : null;
  useEffect(() => {
    if (t.done && !u.current) {
      u.current = true;
      recordDrill(e, {
        t: Date.now(),
        n: t.qs.length,
        ok: okCount,
        level: level ? level.id : undefined,
      });
      if (level && practice) recordLevelPractice(level.id);
      else if (level)
        recordLevel(level.id, okCount >= level.pass, okCount / t.qs.length);
    }
  }, [t.done]);
  if (t.done) {
    let f = okCount;
    return (
      <DrillResult
        title={a}
        ok={f}
        n={t.qs.length}
        unit="preguntas"
        message={i(f / t.qs.length)}
        missed={t.qs
          .filter((y, C) => !t.marks[C])
          .map((y) => ({ text: y.missText }))}
        onAgain={l}
        onBack={() => o.pop()}
        level={level}
        passed={passed}
        practice={practice}
      />
    );
  }
  let d = t.qs.map((f, y) =>
      y < t.marks.length
        ? t.marks[y]
          ? "ok"
          : "miss"
        : y === t.i
          ? "cur"
          : "",
    ),
    p = t.q;
  return (
    <div className="drill">
      <TopBar
        onClose={() => (t.i > 0 ? r(true) : o.pop())}
        title={a}
        sub={`${t.i + 1} / ${t.qs.length}`}
      />
      <Segments total={t.qs.length} states={d} className="drill-segs" />
      <div className="fade-up" key={t.i}>
        {s(p)}
        <div
          className={cx("options", p.options.length === 4 && "grid2")}
          style={{ marginTop: 18 }}
        >
          {p.options.map((f, y) => {
            let C =
              t.picked === null
                ? ""
                : y === p.answer
                  ? "right"
                  : y === t.picked
                    ? "wrong"
                    : "off";
            return (
              <button
                type="button"
                className={cx("option big", C)}
                onClick={() => t.pick(y)}
                disabled={t.picked !== null}
                key={y}
              >
                <span className="num">{f}</span>
              </button>
            );
          })}
        </div>
        {t.picked !== null ? (
          <RevealBox
            className={cx(
              "feedback fade-up",
              t.picked === p.answer ? "ok" : "bad",
            )}
          >
            <span className="fb-icon">
              <Icon
                name={t.picked === p.answer ? "check" : "x"}
                size={18}
                stroke={3}
              />
            </span>
            <div>
              <b>{t.picked === p.answer ? "Correcto" : "No es así"}</b>
              <p>{n(p)}</p>
            </div>
          </RevealBox>
        ) : null}
      </div>
      {t.picked !== null ? (
        <div className="bottom-actions">
          <Button kind="white" onClick={t.next}>
            {t.i + 1 >= t.qs.length ? "Ver resultado" : "Siguiente"}
          </Button>
        </div>
      ) : null}
      <ExitDrillModal
        open={c}
        onStay={() => r(false)}
        onLeave={() => o.pop()}
      />
    </div>
  );
}
const halfText = (a) => {
  let e = Math.floor(a),
    t = a - e >= 0.5;
  return e === 0 && t ? "½" : t ? `${e}½` : String(e);
};
function optionSet(a, e) {
  return [...new Set([a, ...e])].slice(0, 4).sort((n, l) => n - l);
}
// Pista de la práctica: la división hecha, para que solo tengas que redondear.
function TrueHint({ q }) {
  const [open, setOpen] = useState(false);
  const exact = q.rc / q.decksLeft;
  return open ? (
    <p className="center hint-line fade-up">
      {fmtSigned(q.rc)} ÷ {halfText(q.decksLeft).replace("½", ",5")} ={" "}
      <b>{Number.isInteger(exact) ? fmtSigned(exact) : fmtSigned(exact, 1)}</b>
      {Number.isInteger(exact) ? "" : ". Ahora redondeá hacia abajo."}
    </p>
  ) : (
    <div className="center">
      <button type="button" className="hint-btn" onClick={() => setOpen(true)}>
        <Icon name="eye" size={16} /> Ver una pista
      </button>
    </div>
  );
}
function DrillTrue({ level: levelN = null, practice = false }) {
  const level = levelN ? levelByN(levelN) : null;
  let a = useNav(),
    t = useQuiz(() => {
      let s = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5][randInt(9)],
        n = randInt(11) - 4,
        l = Math.round(n * s + (randInt(3) - 1));
      if (l === 0) {
        l = randInt(2) ? 3 : -2;
      }
      let i = l / s,
        o = floorTC(i),
        c = optionSet(o, [
          o - 1,
          o + 1,
          o + 2,
          Math.round(i) === o ? o - 2 : Math.round(i),
        ]).slice(0, 4);
      if (!c.includes(o)) {
        c[0] = o;
      }
      c.sort((r, u) => r - u);
      return {
        rc: l,
        decksLeft: s,
        tc: i,
        f: o,
        options: c.map((r) => fmtSigned(r)),
        answer: c.indexOf(o),
        missText: `${fmtSigned(l)} con ${halfText(s)} ${s === 1 ? "mazo" : "mazos"} = ${fmtSigned(o)}`,
      };
    }, 10);
  return (
    <QuizDrill
      title={
        level
          ? practice
            ? "Práctica: conteo real"
            : `Nivel ${level.n}: Conteo real`
          : "Conteo real"
      }
      kind="true"
      d={t}
      level={level}
      practice={practice}
      onAgain={() => a.replace("drillTrue")}
      resultMessage={(s) =>
        s === 1
          ? "Perfecto. Ya podés pasar a estimar los mazos vos mismo."
          : "Recordá: dividí y redondeá hacia abajo."
      }
      render={(s) => (
        <>
          <h2 className="center drill-q">¿Cuál es el conteo real?</h2>
          <div className="tc-formula vis" style={{ marginTop: 14 }}>
            <div className="tcf-box">
              <span className="eyebrow">Corrido</span>
              <b className={s.rc > 0 ? "good" : "bad"}>{fmtSigned(s.rc)}</b>
            </div>
            <span className="tcf-op">÷</span>
            <div className="tcf-box">
              <span className="eyebrow">Quedan</span>
              <b>{halfText(s.decksLeft)}</b>
              <span className="tiny muted">
                {s.decksLeft === 1 ? "mazo" : "mazos"}
              </span>
            </div>
          </div>
          {practice && t.picked === null ? <TrueHint q={s} /> : null}
        </>
      )}
      explain={(s) => {
        let n = s.rc / s.decksLeft,
          l = Number.isInteger(n) ? fmtSigned(n) : fmtSigned(n, 1);
        return `${fmtSigned(s.rc)} ÷ ${halfText(s.decksLeft).replace("½", ",5")} = ${l}${Number.isInteger(n) ? "" : ` → redondeado hacia abajo, ${fmtSigned(s.f)}`}.`;
      }}
    />
  );
}
function DrillDecks() {
  let a = useNav(),
    t = useQuiz(() => {
      let s = [6, 6, 8][randInt(3)],
        l = (1 + randInt(s * 2 - 3)) / 2,
        i = s - l,
        o = Math.round(l * 52 + (randInt(9) - 4)),
        c = optionSet(
          i,
          [i - 0.5, i + 0.5, i - 1, i + 1].filter((r) => r > 0 && r < s),
        ).slice(0, 4);
      if (!c.includes(i)) {
        c[0] = i;
      }
      c.sort((r, u) => r - u);
      return {
        shoe: s,
        played: l,
        left: i,
        cards: o,
        options: c.map(halfText),
        answer: c.indexOf(i),
        missText: `Zapato de ${s}: ${halfText(l)} en la bandeja → quedan ${halfText(i)}`,
      };
    }, 10);
  return (
    <QuizDrill
      title="Estimar mazos"
      kind="decks"
      d={t}
      onAgain={() => a.replace("drillDecks")}
      resultMessage={(s) =>
        s >= 0.8
          ? "Buen ojo. En la mesa, mirá la bandeja de descarte antes de cada apuesta."
          : "Usá las marcas: cada raya es un mazo."
      }
      render={(s) => (
        <>
          <h2 className="center drill-q">
            ¿Cuántos mazos quedan por repartir?
          </h2>
          <p className="center muted">
            {"Zapato de "}
            {s.shoe}
            {" mazos. Esta es la bandeja de descarte"}
            {t.i >= 5 ? ", ahora sin marcas" : ""}:
          </p>
          <Tray shoe={s.shoe} cards={s.cards} marks={t.i < 5} height={170} />
        </>
      )}
      explain={(s) =>
        `En la bandeja hay ${halfText(s.played)} mazos (unas ${s.cards} cartas). ${s.shoe} − ${halfText(s.played)} = ${halfText(s.left)}.`
      }
    />
  );
}
function Tray({ shoe: a, cards: e, small: t, marks: s = true, height }) {
  let n = height || (t ? 90 : 220),
    l = Math.min(1, e / (a * 52));
  return (
    <div
      className={cx("tray", t && "small")}
      style={{ height: n + (t ? 2 : 20) }}
    >
      <div className="tray-box" style={{ height: n }}>
        <div className="tray-fill" style={{ height: `${l * 100}%` }}>
          <div className="tray-lines" />
        </div>
        {!t && s
          ? Array.from({ length: a - 1 }, (i, o) => (
              <span
                className="tray-mark"
                style={{ bottom: `${((o + 1) / a) * 100}%` }}
                key={o}
              >
                <i>{o + 1}</i>
              </span>
            ))
          : null}
      </div>
    </div>
  );
}
function DrillBet({ level: levelN = null, practice = false }) {
  const level = levelN ? levelByN(levelN) : null;
  let a = useNav(),
    t = useStore().table.unit || 10,
    n = useQuiz(() => {
      let l = randInt(10) - 3 + (randInt(2) ? 0.5 : 0),
        i = betUnits(l),
        o = [1, 2, 4, 6, 8],
        c = o.map((r) => `${r} (${"$" + r * t})`);
      return {
        tc: l,
        units: i,
        options: c,
        answer: o.indexOf(i),
        missText: `Conteo real ${fmtSigned(l, 1)} → ${i} ${i === 1 ? "unidad" : "unidades"}`,
      };
    }, 10);
  return (
    <QuizDrill
      title={
        level
          ? practice
            ? "Práctica: cuánto apostar"
            : `Nivel ${level.n}: Cuánto apostar`
          : "Apuesta según el conteo"
      }
      kind="bet"
      d={n}
      level={level}
      practice={practice}
      onAgain={() => a.replace("drillBet")}
      resultMessage={(l) =>
        l === 1
          ? "Tenés la escala de memoria."
          : "Repasá la escala: ≤ +1: 1 · +2: 2 · +3: 4 · +4: 6 · +5 o más: 8."
      }
      render={(l) => (
        <>
          <h2 className="center drill-q">¿Cuántas unidades apostás?</h2>
          <div className="center" style={{ margin: "16px 0" }}>
            <div className="eyebrow">Conteo real</div>
            <div className="big-num" style={{ fontSize: 72 }}>
              {fmtSigned(l.tc, 1)}
            </div>
            <div className="muted small">Tu unidad: ${t}</div>
          </div>
          {practice ? <BetRamp /> : null}
        </>
      )}
      explain={(l) =>
        `Redondeado hacia abajo es ${fmtSigned(floorTC(l.tc))}: ${l.units} ${l.units === 1 ? "unidad" : "unidades"} ($${l.units * t}).`
      }
    />
  );
}
function DeckCountdown() {
  let a = useNav(),
    e = useStore(),
    t = systemFor(e.settings.system),
    [s, n] = useState("intro"),
    [l, i] = useState([]),
    [o, c] = useState(null),
    [r, u] = useState(0),
    [d, p] = useState(""),
    [f, y] = useState(null),
    [C, k] = useState(false),
    v = useRef(0),
    m = useRef(0);
  useBackGuard(k);
  let b = () => {
      let R = shuffle(buildDecks(1));
      c(R[51]);
      i(R.slice(0, 51));
      u(0);
      p("");
      y(null);
      n("run");
      v.current = Date.now();
    },
    S = () => {
      if (s === "run") {
        sfx.card();
        if (r + 1 >= l.length) {
          m.current = Date.now();
          n("answer");
        } else {
          u(r + 1);
        }
      }
    },
    D = l.reduce((R, V) => R + countValue(V, t), 0),
    _ = () => {
      let R = parseKeypad(d);
      if (R === null) return;
      let V = Math.abs(R - D) < 1e-9;
      if (V) {
        sfx.good();
      } else {
        sfx.bad();
      }
      let B = m.current - v.current;
      y({ v: R, ok: V, ms: B });
      n("done");
      recordDrill("deck", { t: Date.now(), ok: V, ms: B, sys: t.id }, (Z) => {
        let ta = Z.bestMs;
        return V && (!ta || B < ta) ? { bestMs: B } : {};
      });
    };
  if (s === "intro") {
    let R = e.drills.deck && e.drills.deck.bestMs;
    return (
      <div className="drill fade-up">
        <TopBar onClose={() => a.pop()} title="Mazo completo" />
        <div className="card">
          <h2 style={{ fontSize: 24 }}>La prueba clásica del contador</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Pasá un mazo entero tocando la pantalla, lo más rápido que puedas,
            llevando el conteo. Escondimos una carta: al final, tu conteo te
            dice qué tipo de carta falta.
          </p>
          <p className="muted" style={{ marginTop: 8 }}>
            {t.balanced
              ? "Con un sistema balanceado, un mazo completo suma 0. Si terminás en +1, falta una carta alta; en −1, una baja; en 0, una neutra."
              : "Con KO un mazo completo suma +4: compará contra eso."}
          </p>
          {R ? (
            <p className="acc" style={{ marginTop: 10, fontWeight: 700 }}>
              {"Tu récord: "}
              {(R / 1000).toFixed(1).replace(".", ",")}
              {" s"}
            </p>
          ) : null}
          <p className="muted small" style={{ marginTop: 10 }}>
            Referencia: los contadores apuntan a menos de 30 segundos sin
            errores.
          </p>
        </div>
        <div className="bottom-actions">
          <Button onClick={b}>Empezar</Button>
        </div>
      </div>
    );
  }
  if (s === "run")
    return (
      <div className="drill">
        <TopBar
          onClose={() => k(true)}
          title="Mazo completo"
          sub={`${r + 1} / 51`}
        />
        <div className="drill-progress">
          <span style={{ width: `${((r + 1) / 51) * 100}%` }} />
        </div>
        <button
          type="button"
          className="tap-zone"
          onClick={S}
          aria-label="Siguiente carta"
        >
          <span className="watch-stage" style={{ marginTop: 30 }}>
            <PlayingCard card={l[r]} size="xl" deal={true} key={l[r].id} />
          </span>
          <span
            className="center muted"
            style={{ display: "block", marginTop: 26, fontWeight: 700 }}
          >
            Tocá para la siguiente
          </span>
        </button>
        <ExitDrillModal
          open={C}
          onStay={() => k(false)}
          onLeave={() => a.pop()}
        />
      </div>
    );
  if (s === "answer")
    return (
      <div className="drill">
        <TopBar onClose={() => k(true)} title="Mazo completo" sub="51 cartas" />
        <h2 className="center drill-q">¿Cuál es tu conteo final?</h2>
        <div className="keypad-display">{formatKeypad(d)}</div>
        <Keypad
          value={d}
          onChange={p}
          onSubmit={_}
          allowHalf={t.id === "halves"}
          submitLabel="Comprobar"
        />
        <ExitDrillModal
          open={C}
          onStay={() => k(false)}
          onLeave={() => a.pop()}
        />
      </div>
    );
  let M = countValue(o, t);
  return (
    <div className="drill fade-up">
      <TopBar onClose={() => a.pop()} title="Mazo completo" />
      <div className="card center">
        <h2 className={f.ok ? "good" : "bad"} style={{ fontSize: 34 }}>
          {f.ok ? "¡Exacto!" : "No era ese"}
        </h2>
        <p className="muted num">
          {(f.ms / 1000).toFixed(1).replace(".", ",")}
          {" segundos"}
        </p>
        <div className="res-moves" style={{ marginTop: 14, textAlign: "left" }}>
          <div>
            <div className="eyebrow">Pusiste</div>
            <div className={cx("res-move num", f.ok ? "good" : "bad")}>
              {fmtSigned(f.v)}
            </div>
          </div>
          <div>
            <div className="eyebrow">Correcto</div>
            <div className="res-move num acc">{fmtSigned(D)}</div>
          </div>
        </div>
        <div
          className="row"
          style={{ justifyContent: "center", marginTop: 18 }}
        >
          <PlayingCard card={o} size="lg" deal={true} />
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          {"La carta escondida era "}
          {o.r === "A" ? "un As" : `un ${o.r}`}
          {", que vale "}
          {fmtTag(M)}
          {". Por eso el mazo sin ella suma "}
          {fmtSigned(D)}.
        </p>
      </div>
      <div className="bottom-actions">
        <div className="btns">
          <Button onClick={b}>Otra vez</Button>
          <Button kind="outline" onClick={() => a.pop()}>
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
}
export {
  DAILY_FORMATS,
  dailyFormat,
  DeckCountdown,
  DrillBet,
  DrillDecks,
  DrillRunning,
  DrillTrue,
  DrillValues,
  Tray,
};
