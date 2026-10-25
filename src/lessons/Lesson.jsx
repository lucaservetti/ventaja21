import { useEffect, useMemo, useState } from "react";
import { completeLesson, markPathDone, useStore, withRules } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { handLabel, handValue, parseCard } from "../engine/cards.js";
import {
  ACTION_NAMES,
  allowedActions,
  basicPlay,
  countPlay,
} from "../engine/strategy.js";
import { sfx, vibrate } from "../sound.js";
import {
  Button,
  IconButton,
  Modal,
  PlayingCard,
  Segments,
  cx,
} from "../ui/components.jsx";
import {
  LESSONS,
  getLesson,
  lessonIndex,
  lessonMinutes,
  nextLessonId,
} from "./content.js";
import {
  betUnits,
  floorTC,
  fmtSigned,
  fmtTag,
  hiloValue,
} from "../engine/systems.js";
import { useRules } from "../ui/common.jsx";
import { ActionButton } from "../screens/TrainSession.jsx";
import { BetRamp, Visual, rich, useCards } from "./visuals.jsx";
import { Scene, SceneActions } from "./scene.jsx";
import { useNav } from "../nav.js";

const GRADED_STEPS = new Set(["quiz", "decide", "tags", "count"]);
function Lesson({ id: a, then: e }) {
  let t = useNav(),
    s = getLesson(a),
    n = s.steps,
    [l, i] = useState(0),
    [o, c] = useState({}),
    [r, u] = useState({}),
    [d, p] = useState(false),
    [f, y] = useState(false),
    [C, k] = useState({}),
    v = n[l];
  useEffect(() => {
    let X = () => y(true);
    window.addEventListener("v21-back", X);
    return () => window.removeEventListener("v21-back", X);
  }, []);
  let b = !((X, P) =>
      X.t === "scene"
        ? X.act
          ? !r[P]
          : X.ask || X.play
            ? !o[P]
            : false
        : GRADED_STEPS.has(X.t)
          ? !o[P]
          : X.t === "deal" || X.t === "dealer"
            ? !C[P]
            : false)(v, l),
    S = (X, P, w = 1, J = null) => {
      c((ba) => (ba[X] ? ba : { ...ba, [X]: { ok: P, n: w, pick: J } }));
    },
    D = (X, P = 1) => S(l, X, P),
    _ = () => k((X) => ({ ...X, [l]: true })),
    M = useMemo(() => {
      let X = 0,
        P = 0;
      for (let w of Object.values(o)) {
        X += w.ok;
        P += w.n;
      }
      return { ok: X, n: P };
    }, [o]),
    R = () => {
      if (b)
        if (l + 1 < n.length) {
          i(l + 1);
        } else {
          let X = M.n ? M.ok / M.n : 1;
          completeLesson(s.id, X);
          if (e && e.markPath) {
            markPathDone(e.markPath);
          }
          p(true);
          sfx.win();
        }
    },
    V = () => {
      if (l > 0) {
        i(l - 1);
      }
    },
    B = null;
  for (let X = 0; X <= l; X++) {
    if (n[X].t === "scene" && typeof n[X].bank == "number") {
      B = n[X].bank;
    }
  }
  if (B === null) {
    let X = n.find((P) => P.t === "scene" && typeof P.bank == "number");
    if (X && n.slice(0, l + 1).some((P) => P.t === "scene")) {
      B = X.bank;
    }
  }
  if (d) return <LessonResult lesson={s} score={M} then={e} />;
  let Z = v.t === "scene",
    ta = o[l],
    Ba = (X) => {
      let P = X === v.ask.a;
      if (P) {
        sfx.good();
      } else {
        sfx.bad();
      }
      vibrate(P ? 10 : 30);
      S(l, P ? 1 : 0, 1, X);
    },
    Ma = (X) => {
      let P = v.play.a,
        w = X === P;
      if (w) {
        sfx.good();
      } else {
        sfx.bad();
      }
      vibrate(w ? 10 : 30);
      S(l, w ? 1 : 0, 1, X);
    },
    ca = () => {
      sfx.card();
      vibrate(8);
      u((X) => ({ ...X, [l]: true }));
      setTimeout(
        () => i((X) => (X === l && X + 1 < n.length ? X + 1 : X)),
        180,
      );
    },
    ha = Z && ((v.act && !r[l]) || (v.play && !ta)),
    Ia = l + 1 < n.length ? "Seguir" : "Terminar";
  return (
    <div className="lesson">
      <div className="lesson-top">
        <IconButton
          icon="back"
          className="sq"
          label="Paso anterior"
          onClick={V}
          disabled={l === 0}
        />
        <Segments total={n.length} done={l} current={l} className="grow" />
        {B !== null ? (
          <span
            className="bank-pill num"
            aria-label={`Fichas de práctica: ${B}`}
          >
            <span className="bank-dot" />
            {B}
          </span>
        ) : null}
        <IconButton
          icon="close"
          className="sq"
          label="Salir de la lección"
          onClick={() => (l > 0 ? y(true) : t.pop())}
        />
      </div>
      <div className="eyebrow lesson-name">{s.title}</div>
      <div className={cx("lesson-body", Z && "is-scene")} key={Z ? "scene" : l}>
        {Z ? (
          <Scene step={v} picked={ta ? ta.pick : null} onPick={Ba} />
        ) : (
          <div className="step-wrap" key={l}>
            <Step
              step={v}
              report={D}
              saved={o[l]}
              onPicked={(X, P) => S(l, P ? 1 : 0, 1, X)}
              setReady={_}
            />
          </div>
        )}
      </div>
      <div className="bottom-actions">
        {ha ? (
          <SceneActions
            act={v.act}
            opts={v.play ? v.play.opts || ["H", "S"] : null}
            surrender={!!(v.rules && v.rules.surrender)}
            onAct={v.act ? ca : Ma}
          />
        ) : (
          <Button kind="white" onClick={R} disabled={!b}>
            {Ia}
          </Button>
        )}
      </div>
      <Modal open={f} onClose={() => y(false)}>
        <h2 style={{ fontSize: 24 }}>¿Salir de la lección?</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          Vas a tener que empezarla de nuevo.
        </p>
        <div className="btns">
          <Button kind="secondary" onClick={() => y(false)}>
            Seguir con la lección
          </Button>
          <Button kind="danger" onClick={() => t.pop()}>
            Salir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
function Step({ step: a, report: e, saved: t, onPicked: s, setReady: n }) {
  switch (a.t) {
    case "info":
      return <InfoStep step={a} />;
    case "quiz":
      return <QuizStep step={a} saved={t} onPicked={s} />;
    case "decide":
      return <DecideStep step={a} saved={t} onPicked={s} />;
    case "tags":
      return t ? (
        <DoneStep step={a} saved={t} />
      ) : (
        <TagsStep step={a} report={e} />
      );
    case "deal":
      return <DealStep step={a} onDone={n} />;
    case "count":
      return t ? (
        <DoneStep step={a} saved={t} />
      ) : (
        <CountStep step={a} report={e} />
      );
    case "dealer":
      return <DealerStep step={a} onDone={n} />;
    case "usecount":
      return <UseCountStep step={a} />;
    default:
      return null;
  }
}
function InfoStep({ step: a }) {
  return (
    <div className="step fade-up">
      <h1 className="step-title">{a.title}</h1>
      {a.visual ? <Visual v={a.visual} /> : null}
      <div className="step-text">
        {a.body.map((e, t) => (
          <p key={t}>{rich(e)}</p>
        ))}
      </div>
    </div>
  );
}
function Feedback({ ok: a, title: e, text: t }) {
  return (
    <div className={cx("feedback fade-up", a ? "ok" : "bad")} role="status">
      <span className="fb-icon">
        <Icon name={a ? "check" : "x"} size={18} stroke={3} />
      </span>
      <div>
        <b>{e || (a ? "Correcto" : "No es así")}</b>
        {t ? <p>{rich(t)}</p> : null}
      </div>
    </div>
  );
}
function DoneStep({ step: a, saved: e }) {
  return (
    <div className="step fade-up">
      <h1 className="step-title">{a.title}</h1>
      <Feedback
        ok={e.ok === e.n}
        title={`Ya lo hiciste: ${e.ok} de ${e.n}`}
        text="Seguí con el próximo paso."
      />
    </div>
  );
}
function QuizStep({ step: a, saved: e, onPicked: t }) {
  let [s, n] = useState(e ? e.pick : null),
    l = useCards(a.cards),
    i = (o) => {
      if (s !== null) return;
      n(o);
      let c = o === a.answer;
      if (c) {
        sfx.good();
      } else {
        sfx.bad();
      }
      vibrate(c ? 10 : 30);
      t(o, c);
    };
  return (
    <div className="step fade-up">
      {a.cards ? (
        <div className="quiz-cards">
          {a.cardsLabel ? (
            <div className="eyebrow center">{a.cardsLabel}</div>
          ) : null}
          <div className="card-row" style={{ justifyContent: "center" }}>
            {l.map((o) => (
              <PlayingCard card={o} size="lg" deal={true} key={o.id} />
            ))}
          </div>
        </div>
      ) : null}
      <h2 className="quiz-q">{a.q}</h2>
      <div className="options">
        {a.options.map((o, c) => {
          let r =
            s === null
              ? ""
              : c === a.answer
                ? "right"
                : c === s
                  ? "wrong"
                  : "off";
          return (
            <button
              type="button"
              className={cx("option", r)}
              onClick={() => i(c)}
              disabled={s !== null}
              key={c}
            >
              <span>{o}</span>
              {r === "right" ? (
                <Icon name="check" size={20} stroke={3} />
              ) : r === "wrong" ? (
                <Icon name="x" size={20} stroke={3} />
              ) : null}
            </button>
          );
        })}
      </div>
      {s !== null ? <Feedback ok={s === a.answer} text={a.explain} /> : null}
    </div>
  );
}
function DecideStep({ step: a, saved: e, onPicked: t }) {
  let s = useRules(),
    n = useMemo(
      () => withRules({ ...s, ...(a.rules || {}), ...(a.forceRules || {}) }),
      [s],
    ),
    l = useMemo(
      () =>
        parseCard(
          a.dealer.length === 1 || a.dealer === "10"
            ? a.dealer + "c"
            : a.dealer,
        ),
      [],
    ),
    i = useCards(a.player),
    o = { cards: i, fromSplit: false },
    c = allowedActions(o, n),
    r = a.tc !== undefined,
    u = r
      ? countPlay(o, l.r, n, a.tc, c).action
      : basicPlay(o, l.r, n, c).action,
    [d, p] = useState(e ? e.pick : null),
    f = (C) => {
      if (d) return;
      p(C);
      let k = C === u;
      if (k) {
        sfx.good();
      } else {
        sfx.bad();
      }
      vibrate(k ? 10 : 30);
      t(C, k);
    },
    y = u === a.answer;
  return (
    <div className="step fade-up">
      <h2 className="quiz-q" style={{ marginTop: 0 }}>
        ¿Qué hacés?
      </h2>
      <div className="deal-card compact">
        {r ? (
          <div className="tc-banner">
            <span className="eyebrow">Conteo real</span>
            <b className="num">{fmtSigned(a.tc)}</b>
          </div>
        ) : null}
        <div className="deal-grid">
          <div className="deal-side">
            <div className="eyebrow">Crupier</div>
            <div className="card-row" style={{ marginTop: 12 }}>
              <PlayingCard card={l} size="md" deal={true} />
              <PlayingCard card={l} size="md" down={true} deal={true} />
            </div>
          </div>
          <div className="deal-divider" />
          <div className="deal-side">
            <div className="eyebrow">Tu mano</div>
            <div className="card-row" style={{ marginTop: 12 }}>
              {i.map((C, k) => (
                <PlayingCard
                  card={C}
                  size="md"
                  deal={true}
                  mark={
                    d && k === i.length - 1 ? (d === u ? "ok" : "bad") : null
                  }
                  key={C.id}
                />
              ))}
            </div>
            <div className="hand-label">{handLabel(i)}</div>
          </div>
        </div>
      </div>
      {d ? (
        <Feedback
          ok={d === u}
          title={
            d === u
              ? `Correcto: ${ACTION_NAMES[u].toLowerCase()}`
              : `Lo correcto era ${ACTION_NAMES[u].toLowerCase()}`
          }
          text={
            y
              ? a.explain
              : `Con las reglas de tu mesa (${n.h17 ? "H17" : "S17"}${n.das ? "" : ", sin doblar tras separar"}${n.surrender ? ", con rendición" : ""}) la jugada es ${ACTION_NAMES[u].toLowerCase()}.`
          }
        />
      ) : (
        <div className="action-grid">
          <ActionButton a="H" allowed={c} onClick={f} />
          <ActionButton a="S" allowed={c} onClick={f} />
          <ActionButton a="D" allowed={c} onClick={f} />
          <ActionButton a="P" allowed={c} onClick={f} />
          {n.surrender ? (
            <ActionButton a="R" allowed={c} onClick={f} wide={true} />
          ) : null}
        </div>
      )}
    </div>
  );
}
function TagsStep({ step: a, report: e }) {
  let t = useCards(a.cards),
    [s, n] = useState(0),
    [l, i] = useState(null),
    [o, c] = useState(0),
    r = s >= t.length,
    u = t[Math.min(s, t.length - 1)],
    d = (f) => {
      if (l || r) return;
      let y = hiloValue(u),
        C = f === y;
      if (C) {
        sfx.good();
      } else {
        sfx.bad();
      }
      vibrate(C ? 8 : 25);
      i({ ok: C, val: y });
      if (C) {
        c((k) => k + 1);
      }
      setTimeout(
        () => {
          i(null);
          n((k) => {
            let v = k + 1;
            if (v >= t.length) {
              e(o + (C ? 1 : 0), t.length);
            }
            return v;
          });
        },
        C ? 650 : 1300,
      );
    },
    p = u.r === "A" ? "El As" : `El ${u.r}`;
  return (
    <div className="step fade-up">
      <h1 className="step-title">{a.title}</h1>
      {r ? (
        <div className="center" style={{ marginTop: 60 }}>
          <div className="big-num acc">
            {o}
            {" de "}
            {t.length}
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            {o === t.length
              ? "Sabés los valores."
              : "Repasá los valores: bajas +1, medias 0, altas −1."}
          </p>
        </div>
      ) : (
        <>
          <div
            className="center muted"
            style={{ fontWeight: 700, marginTop: 30 }}
          >
            {"Carta "}
            {s + 1}
            {" de "}
            {t.length}
          </div>
          <div className="big-card-wrap">
            <PlayingCard
              card={u}
              size="xl"
              deal={true}
              glow={l ? (l.ok ? "good" : "bad") : null}
              key={u.id}
            />
          </div>
          <p className={cx("center tag-fb", l && (l.ok ? "good" : "bad"))}>
            {l
              ? l.ok
                ? `Bien. ${p} vale ${fmtTag(l.val)}.`
                : `${p} vale ${fmtTag(l.val)}.`
              : "¿Cuánto vale esta carta?"}
          </p>
          <div className="tag-btns">
            {[-1, 0, 1].map((f) => (
              <button
                type="button"
                className={cx(
                  "tag-btn",
                  f < 0 ? "neg" : f > 0 ? "pos" : "",
                  l && l.val === f && "reveal",
                )}
                onClick={() => d(f)}
                key={f}
              >
                {fmtTag(f)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function DealStep({ step: a, onDone: e }) {
  let t = useCards(a.cards),
    [s, n] = useState(0),
    l = t.slice(0, s).reduce((u, d) => u + hiloValue(d), 0),
    i = s > 0 ? t[s - 1] : null,
    o = s >= t.length;
  useEffect(() => {
    if (o) {
      e();
    }
  }, [o]);
  let c = () => {
      sfx.card();
      vibrate(6);
      n((u) => Math.min(t.length, u + 1));
    },
    r = i
      ? `${i.r === "A" ? "As" : i.r} es ${hiloValue(i) > 0 ? "baja, +1" : hiloValue(i) < 0 ? "alta, −1" : "neutra, 0"}`
      : "";
  return (
    <div className="step fade-up">
      <h1 className="step-title">{a.title}</h1>
      <p className="step-lead">{a.intro}</p>
      <div className="slots" style={{ "--n": t.length }}>
        {t.map((u, d) => (
          <div className="slot" key={u.id}>
            {d < s ? (
              <>
                <PlayingCard
                  card={u}
                  size={t.length > 6 ? "sm" : "md"}
                  deal={true}
                />
                <span
                  className={cx(
                    "slot-tag num",
                    hiloValue(u) > 0
                      ? "good"
                      : hiloValue(u) < 0
                        ? "bad"
                        : "muted",
                  )}
                >
                  {fmtTag(hiloValue(u))}
                </span>
              </>
            ) : (
              <div className={cx("slot-empty", t.length > 6 ? "sm" : "md")} />
            )}
          </div>
        ))}
      </div>
      <div className="rc-panel">
        <span className="eyebrow">Conteo corrido</span>
        <b className={cx("num", l > 0 ? "good" : l < 0 ? "bad" : "")}>
          {fmtSigned(l)}
        </b>
        <span className="muted small rc-note">{r}</span>
      </div>
      {o ? (
        <div className="step-text fade-up">
          {a.after.map((u, d) => (
            <p key={d}>{rich(u)}</p>
          ))}
        </div>
      ) : (
        <Button kind="secondary" onClick={c} style={{ marginTop: 18 }}>
          {s === 0 ? "Repartir la primera carta" : "Siguiente carta"}
        </Button>
      )}
    </div>
  );
}
function CountStep({ step: a, report: e }) {
  let t = useCards(a.cards),
    [s, n] = useState("intro"),
    [l, i] = useState(0),
    [o, c] = useState(null);
  useEffect(() => {
    if (s !== "show") return;
    if (l >= t.length) {
      n("answer");
      return;
    }
    sfx.card();
    let u = setTimeout(() => i((d) => d + 1), a.ms || 1200);
    return () => clearTimeout(u);
  }, [s, l]);
  let r = (u) => {
    if (o !== null) return;
    c(u);
    let d = u === a.answer;
    if (d) {
      sfx.good();
    } else {
      sfx.bad();
    }
    e(d ? 1 : 0, 1);
  };
  return (
    <div className="step fade-up">
      <h1 className="step-title">{a.title}</h1>
      {s === "intro" ? (
        <>
          <p className="step-lead">{a.intro}</p>
          <div className="center" style={{ margin: "40px 0" }}>
            <PlayingCard card={t[0]} size="xl" down={true} />
          </div>
          <Button kind="secondary" onClick={() => n("show")}>
            Mostrar las cartas
          </Button>
        </>
      ) : s === "show" ? (
        <div className="center" style={{ marginTop: 30 }}>
          <div className="muted" style={{ fontWeight: 700 }}>
            {"Carta "}
            {Math.min(l + 1, t.length)}
            {" de "}
            {t.length}
          </div>
          <div className="big-card-wrap">
            {l < t.length ? (
              <PlayingCard card={t[l]} size="xl" deal={true} key={t[l].id} />
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <h2 className="quiz-q">¿Cuál es el conteo corrido?</h2>
          <div className="options grid2">
            {a.options.map((u, d) => {
              let p =
                o === null
                  ? ""
                  : d === a.answer
                    ? "right"
                    : d === o
                      ? "wrong"
                      : "off";
              return (
                <button
                  type="button"
                  className={cx("option big", p)}
                  onClick={() => r(d)}
                  disabled={o !== null}
                  key={d}
                >
                  <span className="num">{u}</span>
                </button>
              );
            })}
          </div>
          {o !== null ? (
            <>
              <Feedback ok={o === a.answer} text={a.explain} />
              <div className="review-strip">
                {t.map((u) => (
                  <div className="center" key={u.id}>
                    <PlayingCard card={u} size="xs" />
                    <span
                      className={cx(
                        "tiny num",
                        hiloValue(u) > 0
                          ? "good"
                          : hiloValue(u) < 0
                            ? "bad"
                            : "muted",
                      )}
                    >
                      {fmtTag(hiloValue(u))}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
function DealerStep({ step: a, onDone: e }) {
  let t = useMemo(() => parseCard(a.up), []),
    s = useMemo(() => parseCard(a.hole), []),
    n = useCards(a.draws),
    [l, i] = useState(0),
    o = l === 0 ? [t] : [t, s, ...n.slice(0, l - 1)],
    c = handValue(o),
    r = handValue(l === 0 ? [t] : o),
    u = l > 0 && (c.total < 17 || (c.total === 17 && c.soft && a.h17)),
    d = l > 0 && !u;
  useEffect(() => {
    if (d) {
      e();
    }
  }, [d]);
  let p;
  if (l === 0) {
    p = "El crupier muestra una carta y tiene otra tapada.";
  } else {
    if (c.bust) {
      p = `Se pasó con ${c.hard}.`;
    } else {
      if (u) {
        p = `${c.soft ? "Blando " : ""}${c.total}: tiene que pedir.`;
      } else {
        p = `${c.total}: se planta.`;
      }
    }
  }
  return (
    <div className="step fade-up">
      <h1 className="step-title">{a.title}</h1>
      <div className="dealer-demo">
        <div className="card-row" style={{ justifyContent: "center" }}>
          <PlayingCard card={t} size="lg" deal={true} />
          <PlayingCard card={s} size="lg" down={l === 0} />
          {n.slice(0, Math.max(0, l - 1)).map((f) => (
            <PlayingCard card={f} size="lg" deal={true} key={f.id} />
          ))}
        </div>
        <div className={cx("dealer-total num", d && "acc")}>
          {l === 0 ? "?" : c.bust ? c.hard : c.total}
        </div>
        <p className="center step-lead" style={{ marginTop: 6 }}>
          {p}
        </p>
      </div>
      {d ? (
        <p className="step-text fade-up">
          {rich(
            "No importa lo que tengan los jugadores: **con 16 o menos pide, con 17 o más se planta.**",
          )}
        </p>
      ) : (
        <Button
          kind="secondary"
          onClick={() => {
            sfx.card();
            i((f) => f + 1);
          }}
        >
          {l === 0 ? "Dar vuelta la carta tapada" : "Pedir carta"}
        </Button>
      )}
    </div>
  );
}
function UseCountStep({ step: a }) {
  let e = a.rc / a.left,
    t = floorTC(e),
    s = betUnits(e),
    n = t <= 1 ? 0 : t === 2 ? 1 : t === 3 ? 2 : t === 4 ? 3 : 4;
  return (
    <div className="step fade-up">
      <h1 className="step-title">
        {a.earlier ? "El mismo conteo, más temprano" : "Usar el conteo"}
      </h1>
      <p className="step-lead">
        {a.earlier
          ? `Ahora el conteo corrido es otra vez +${a.rc}, pero recién salió ${a.played === 1 ? "un mazo" : `${a.played} mazos`}.`
          : `Tu conteo corrido es +${a.rc}. Antes de apostar, pasalo a conteo real: dividilo por los mazos que quedan en el zapato.`}
      </p>
      <div className="rc-panel" style={{ marginTop: 16 }}>
        <span className="eyebrow">Conteo corrido</span>
        <b className="num good">+{a.rc}</b>
      </div>
      <div className="decks-split">
        <div className="card">
          <div className="eyebrow">Repartidos</div>
          <div className="deck-icons">
            {Array.from({ length: a.played }, (l, i) => (
              <span className="deck-ic out" key={i} />
            ))}
          </div>
          <b>
            {a.played} {a.played === 1 ? "mazo" : "mazos"}
          </b>
        </div>
        <div className="card">
          <div className="eyebrow">Quedan</div>
          <div className="deck-icons">
            {Array.from({ length: a.left }, (l, i) => (
              <span className="deck-ic" key={i} />
            ))}
          </div>
          <b>
            {a.left} {a.left === 1 ? "mazo" : "mazos"}
          </b>
        </div>
      </div>
      <div className="card use-step">
        <span className="how-n">1</span>
        <div>
          <b style={{ fontSize: 20 }}>
            {"Conteo real "}
            {fmtSigned(t)}
          </b>
          <div
            className="num"
            style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}
          >
            +{a.rc}
            {" ÷ "}
            {a.left}
            {" = "}
            {fmtSigned(e, Number.isInteger(e) ? 0 : 1)}
            {Number.isInteger(e) ? "" : ` → ${fmtSigned(t)}`}
          </div>
        </div>
      </div>
      <div className="card use-step">
        <span className="how-n">2</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <b style={{ fontSize: 20 }}>
            {"Apostá "}
            {s} {s === 1 ? "unidad" : "unidades"}
          </b>
          <BetRamp highlight={n} />
          <p className="muted small" style={{ marginTop: 8 }}>
            {a.earlier
              ? "El mismo +6 al principio del zapato vale mucho menos: seguí con la apuesta mínima."
              : "Si tu apuesta normal es $10, apostá $20. Y una jugada cambia: tu 12 contra un 3 pasa a ser plantarse."}
          </p>
        </div>
      </div>
    </div>
  );
}
function LessonResult({ lesson: a, score: e, then: t }) {
  let s = useNav(),
    n = useStore(),
    l = lessonIndex(a.id),
    i = a.section > 0 ? nextLessonId(a.id) : null,
    o = i ? LESSONS.find((r) => r.id === i) : null,
    c = (r) => !!(n.lessons[r] && n.lessons[r].done);
  return (
    <div className="lesson-result fade-up">
      <div className="lr-scroll">
        <div className="lr-top">
          <div className="lr-coin" aria-hidden="true">
            <span className="lr-coin-face">
              <Icon name="check" size={44} stroke={3} />
            </span>
          </div>
          {l >= 0 ? (
            <div className="eyebrow center num" style={{ marginTop: 18 }}>
              {"Lección "}
              {l + 1}
              {" de "}
              {LESSONS.length}
              {" completa"}
            </div>
          ) : (
            <div className="eyebrow center" style={{ marginTop: 18 }}>
              Paso completo
            </div>
          )}
          <h1 className="lr-title">{a.title}</h1>
          {l >= 0 ? (
            <div className="lr-dots" aria-hidden="true">
              {LESSONS.map((r, u) => (
                <i
                  className={cx(
                    u === l ? "cur" : c(r.id) && "on",
                    u > 0 && LESSONS[u - 1].section !== r.section && "gap",
                  )}
                  key={r.id}
                />
              ))}
            </div>
          ) : null}
          {e.n ? (
            <div className="center" style={{ marginTop: 12 }}>
              <span className={cx("chip-tag num", e.ok === e.n ? "good" : "")}>
                {e.ok}
                {" de "}
                {e.n}
                {" respuestas bien"}
              </span>
            </div>
          ) : null}
        </div>
        {a.sum ? (
          <div className="card lr-sum">
            <div className="eyebrow">Lo que aprendiste</div>
            <ul>
              {a.sum.map((r, u) => (
                <li key={u}>
                  <Icon name="check" size={18} stroke={2.6} />
                  <span>{rich(r)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {t && t.text ? (
          <p className="muted center" style={{ marginTop: 16 }}>
            {t.text}
          </p>
        ) : o ? (
          <button
            type="button"
            className="card lr-next"
            onClick={() => s.replace("lesson", { id: o.id, confirmExit: true })}
          >
            <span className="lr-next-n num">{l + 2}</span>
            <span className="li-text">
              <span className="eyebrow">Lo que sigue</span>
              <span
                className="li-title"
                style={{ display: "block", marginTop: 2 }}
              >
                {o.title}
              </span>
              <span className="li-sub">
                {lessonMinutes(o)}
                {" min"}
              </span>
            </span>
            <Icon name="chev" className="li-chev" />
          </button>
        ) : a.section > 0 ? (
          <p className="muted center" style={{ marginTop: 16 }}>
            Terminaste todas las lecciones. Seguí con la Guía, el simulador y el
            examen de nivel.
          </p>
        ) : null}
      </div>
      <div className="bottom-actions">
        {t && t.screen ? (
          <Button
            kind="white"
            onClick={() => s.replace(t.screen, t.params || {})}
          >
            {t.label}
          </Button>
        ) : o ? (
          <Button
            kind="white"
            onClick={() => s.replace("lesson", { id: o.id, confirmExit: true })}
          >
            Empezar la próxima lección
          </Button>
        ) : null}
        <Button kind="ghost" onClick={() => s.pop()}>
          {t && t.backLabel ? t.backLabel : "Volver al camino"}
        </Button>
      </div>
    </div>
  );
}
export { Lesson };
