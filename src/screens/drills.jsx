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
function DrillValues({ count: a = 12, pathStep: e = null }) {
  let t = useNav(),
    s = useStore(),
    n = systemFor(s.settings.system),
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
      for (; Z.length < a;) {
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
      b({ ok: ta, n: l.length, missed: Ba, bestRun: Z });
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
        title="Valores de las cartas"
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
      <div className={cx("tag-btns", D.length > 3 && "many")}>
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
          <p className="muted small" style={{ marginTop: 8 }}>
            Estas cartas van a salir un poco más seguido en los próximos
            ejercicios.
          </p>
        </div>
      ) : null}
      {r}
      <p className="center muted" style={{ margin: "18px 0" }}>
        {l}
      </p>
      <div className="btns">
        <Button onClick={o}>Otra vez</Button>
        <Button kind="outline" onClick={c}>
          Volver
        </Button>
      </div>
    </div>
  );
}
function DrillRunning({ daily: a = false, n: e, speed: t, mode: s }) {
  let n = useNav(),
    l = useStore(),
    i = systemFor(l.settings.system),
    [o, c] = useState(() => ({
      n: a ? 20 : e || 15,
      speed: a ? "normal" : t || "normal",
      mode: a ? "single" : s || "single",
    })),
    [r, u] = useState(a ? "ready" : "setup"),
    [d, p] = useState([]),
    [f, y] = useState(0),
    [C, k] = useState(""),
    [v, m] = useState(null),
    [b, S] = useState(false),
    D = useRef(0),
    _ = useRef(0);
  useBackGuard(S);
  let M = dayKey(),
    R = useMemo(
      () =>
        Math.floor((Date.now() - new Date(2026, 0, 1).getTime()) / 86400000) +
        1,
      [],
    ),
    V = () => {
      if (a) {
        let w = seededRandom(hashString("v21-daily-" + M));
        return shuffle(buildDecks(1), w).slice(0, o.n);
      }
      return shuffle(buildDecks(2)).slice(0, o.n);
    },
    B = () => {
      let P = V();
      p(P);
      y(0);
      k("");
      m(null);
      u("watch");
      D.current = Date.now();
    },
    Z = o.mode === "pairs" ? 2 : 1,
    ta = (DRILL_SPEEDS.find((P) => P.id === o.speed) || DRILL_SPEEDS[1]).ms;
  useEffect(() => {
    if (r !== "watch") return;
    if (f >= d.length) {
      _.current = Date.now();
      u("answer");
      return;
    }
    sfx.card();
    let P = setTimeout(() => y((w) => w + Z), ta * (Z === 2 ? 1.5 : 1));
    return () => clearTimeout(P);
  }, [r, f]);
  let Ba = d.reduce((P, w) => P + countValue(w, i), 0),
    Ma = () => {
      let P = parseKeypad(C);
      if (P === null) return;
      let w = Math.abs(P - Ba) < 1e-9;
      if (w) {
        sfx.good();
      } else {
        sfx.bad();
      }
      let J = (_.current || Date.now()) - D.current,
        ba = { v: P, ok: w, err: P - Ba, elapsed: J };
      m(ba);
      u("review");
      let ye = {
        t: Date.now(),
        n: d.length,
        ok: w,
        speed: o.speed,
        mode: o.mode,
        ms: J,
        sys: i.id,
        daily: a,
      };
      recordDrill("running", ye, (Ja) => {
        let Ga = Ja.bestPerfect,
          Zt = Ga || null;
        if (w) {
          let On = d.length / (J / 1000);
          if (!Ga || On > Ga.rate) {
            Zt = {
              rate: On,
              n: d.length,
              speed: o.speed,
              ms: J,
              t: Date.now(),
            };
          }
        }
        return { bestPerfect: Zt };
      });
      markPathDone("running");
      if (a) {
        setState((Ja) => {
          let Ga = Ja.daily;
          if (Ga.results[M]) return Ja;
          let Zt = new Date();
          Zt.setDate(Zt.getDate() - 1);
          let On = dayKey(Zt),
            Ht = w ? (Ga.last === On || Ga.last === M ? Ga.streak + 1 : 1) : 0;
          return markActive({
            ...Ja,
            daily: {
              ...Ga,
              last: w ? M : Ga.last,
              streak: Ht,
              best: Math.max(Ga.best, Ht),
              results: { ...Ga.results, [M]: { ok: w, err: ba.err } },
            },
          });
        });
      }
    },
    ca = a ? `Desafío diario #${R}` : "Conteo corrido",
    ha = (
      <div className="phase-steps">
        <span
          className={cx(
            r === "watch" && "on",
            (r === "answer" || r === "review") && "past",
          )}
        >
          1 Ver
        </span>
        <Icon name="chev" size={14} />
        <span className={cx(r === "answer" && "on", r === "review" && "past")}>
          2 Responder
        </span>
        <Icon name="chev" size={14} />
        <span className={cx(r === "review" && "on")}>3 Revisar</span>
      </div>
    );
  if (r === "setup" || r === "ready") {
    let P = a && l.daily.results[M];
    return (
      <div className="drill fade-up">
        <TopBar onClose={() => n.pop()} title={ca} />
        <div className="card" style={{ marginTop: 6 }}>
          <h2 style={{ fontSize: 24 }}>
            {a
              ? "El conteo del día"
              : "Llevá el total mientras caen las cartas"}
          </h2>
          <p className="muted" style={{ marginTop: 8 }}>
            {a
              ? `20 cartas a ritmo normal, iguales para todos hoy. Tu primer intento cuenta para la racha${l.daily.streak ? ` (vas ${l.daily.streak} ${l.daily.streak === 1 ? "día" : "días"})` : ""}.`
              : `Vas a ver las cartas de a ${o.mode === "pairs" ? "dos" : "una"}. Al final escribís el conteo corrido en ${i.short || i.name}. Arrancás en 0.`}
          </p>
          {P ? (
            <p
              className={cx("small", P.ok ? "good" : "bad")}
              style={{ marginTop: 10, fontWeight: 700 }}
            >
              {"Hoy ya lo hiciste: "}
              {P.ok ? "acertaste" : `le erraste por ${Math.abs(P.err)}`}. Podés
              practicarlo igual.
            </p>
          ) : null}
        </div>
        {a ? null : (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="eyebrow">Velocidad</div>
            <Pills
              className="left"
              options={DRILL_SPEEDS.map((w) => ({
                value: w.id,
                label: w.label,
              }))}
              value={o.speed}
              onChange={(w) => c({ ...o, speed: w })}
            />
            <div className="eyebrow" style={{ marginTop: 18 }}>
              Cantidad de cartas
            </div>
            <Pills
              className="left"
              options={[10, 15, 20, 30, 52].map((w) => ({
                value: w,
                label: w === 52 ? "52 (un mazo)" : String(w),
              }))}
              value={o.n}
              onChange={(w) => c({ ...o, n: w })}
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
              value={o.mode}
              onChange={(w) => c({ ...o, mode: w })}
            />
            <p className="muted small" style={{ marginTop: 12 }}>
              De a dos te obliga a cancelar parejas: una alta y una baja juntas
              suman 0.
            </p>
          </div>
        )}
        <div className="bottom-actions">
          <Button onClick={B}>Empezar</Button>
        </div>
      </div>
    );
  }
  if (r === "watch") {
    let P = d.slice(f, f + Z);
    return (
      <div className="drill">
        <TopBar
          onClose={() => S(true)}
          title={ca}
          sub={`${Math.min(f + Z, d.length)} / ${d.length}`}
        />
        <div className="drill-progress">
          <span
            style={{
              width: `${(Math.min(f + Z, d.length) / d.length) * 100}%`,
            }}
          />
        </div>
        {ha}
        <div className="watch-stage">
          {P.map((w) => (
            <PlayingCard
              card={w}
              size={Z === 2 ? "lg" : "xl"}
              deal={true}
              key={w.id}
            />
          ))}
        </div>
        <ExitDrillModal
          open={b}
          onStay={() => S(false)}
          onLeave={() => n.pop()}
        />
      </div>
    );
  }
  if (r === "answer")
    return (
      <div className="drill">
        <TopBar onClose={() => S(true)} title={ca} sub={`${d.length} cartas`} />
        <div className="drill-progress">
          <span style={{ width: "100%" }} />
        </div>
        {ha}
        <h2 className="center drill-q">¿Cuál es el conteo corrido?</h2>
        <div className="keypad-display">{formatKeypad(C)}</div>
        <Keypad
          value={C}
          onChange={k}
          onSubmit={Ma}
          allowHalf={i.id === "halves"}
          submitLabel="Comprobar"
        />
        <ExitDrillModal
          open={b}
          onStay={() => S(false)}
          onLeave={() => n.pop()}
        />
      </div>
    );
  let Ia = 0,
    X = v.ok
      ? "Exacto. Probá una velocidad más rápida cuando te salga seguido."
      : Math.abs(v.err) === 1
        ? "Te faltó o sobró una carta. Mirá la tabla: casi siempre es una neutra que contaste o una alta que se escapó."
        : "Hacelo de a parejas: cancelá una alta con una baja apenas caen, y solo las que sobran mueven tu conteo.";
  return (
    <div className="drill fade-up">
      <TopBar
        onClose={() => n.pop()}
        title={ca}
        sub={`${d.length} / ${d.length}`}
      />
      <div className="drill-progress">
        <span style={{ width: "100%" }} />
      </div>
      {ha}
      <div className="card review-head">
        <h2 className={v.ok ? "good" : "bad"} style={{ fontSize: 34 }}>
          {v.ok
            ? "¡Exacto!"
            : `Le erraste por ${fmtSigned(Math.abs(v.err)).replace("+", "")}`}
        </h2>
        <p className="muted num" style={{ marginTop: 4 }}>
          {d.length}
          {" cartas · "}
          {(v.elapsed / 1000).toFixed(0)}
          {" s en total · "}
          {(DRILL_SPEEDS.find((P) => P.id === o.speed) || {}).label}
        </p>
        <div className="res-moves" style={{ marginTop: 14 }}>
          <div>
            <div className="eyebrow">Pusiste</div>
            <div className={cx("res-move num", v.ok ? "good" : "bad")}>
              {fmtSigned(v.v)}
            </div>
          </div>
          <div>
            <div className="eyebrow">Conteo correcto</div>
            <div className="res-move num acc">{fmtSigned(Ba)}</div>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          {X}
        </p>
      </div>
      <div className="card seq-review">
        <h3>Repaso de la secuencia</h3>
        <div className="seq-head">
          <span>Carta</span>
          <span>Valor</span>
          <span>Conteo</span>
        </div>
        {d.map((P, w) => {
          let J = countValue(P, i);
          Ia += J;
          return (
            <div className="seq-row" key={P.id}>
              <span className="row" style={{ gap: 10 }}>
                <PlayingCard card={P} size="xs" />
                <span className="muted small num">{w + 1}</span>
              </span>
              <span
                className={cx("num", J > 0 ? "good" : J < 0 ? "bad" : "muted")}
              >
                {fmtTag(J)}
              </span>
              <b className="num">{fmtSigned(Ia)}</b>
            </div>
          );
        })}
      </div>
      <div className="bottom-actions">
        <div className="btns">
          <Button onClick={B}>Otra vez</Button>
          <Button kind="outline" onClick={() => n.pop()}>
            Volver
          </Button>
        </div>
      </div>
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
function QuizDrill({
  title: a,
  kind: e,
  d: t,
  render: s,
  explain: n,
  onAgain: l,
  resultMessage: i,
}) {
  let o = useNav(),
    [c, r] = useState(false);
  useBackGuard(r);
  let u = useRef(false);
  if (
    (useEffect(() => {
      if (t.done && !u.current) {
        u.current = true;
        recordDrill(e, {
          t: Date.now(),
          n: t.qs.length,
          ok: t.marks.filter(Boolean).length,
        });
      }
    }, [t.done]),
    t.done)
  ) {
    let f = t.marks.filter(Boolean).length;
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
          <div
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
          </div>
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
function DrillTrue() {
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
      title="Conteo real"
      kind="true"
      d={t}
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
          <Tray shoe={s.shoe} cards={s.cards} marks={t.i < 5} />
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
function DrillBet() {
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
      title="Apuesta según el conteo"
      kind="bet"
      d={n}
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
            <div className="eyebrow">Conteo correcto</div>
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
  DeckCountdown,
  DrillBet,
  DrillDecks,
  DrillRunning,
  DrillTrue,
  DrillValues,
  Tray,
};
