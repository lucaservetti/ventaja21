import { useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { makeCard } from "../engine/cards.js";
import { ACTION_NAMES } from "../engine/strategy.js";
import { Button, IconButton, PlayingCard, cx } from "../ui/components.jsx";
import { fmtSigned } from "../engine/systems.js";
import { spotTitle } from "../ui/common.jsx";
import { useNav } from "../nav.js";

function TrainSummary({ summary: a, results: e, mode: t, focus: s }) {
  let n = useNav(),
    l = useStore(),
    { n: i, ok: o, before: c, after: r } = a,
    u = i ? o / i : 0,
    d = r - c,
    p = t === "exam",
    f = l.train.sessions
      .filter((S) => S.kind !== "exam" && S.t < a.t)
      .slice(-6, undefined),
    y = f.length ? f.reduce((S, D) => S + D.ok / D.n, 0) / f.length : null,
    C = e.filter((S) => !S.correct),
    k = C.length ? mainMiss(C, l.train.cells) : null,
    v = [];
  if (
    (p
      ? v.push(examVerdict(u))
      : y === null || f.length < 1
        ? v.push(
            "Esta fue una de tus primeras tandas: es la base desde la que vas a crecer.",
          )
        : u > y + 0.05
          ? v.push(`Mejor que tu promedio reciente (${Math.round(y * 100)} %).`)
          : u < y - 0.05
            ? v.push(
                `Un poco por debajo de tu promedio reciente (${Math.round(y * 100)} %). Pasa: la tanda siguiente se arma con tus errores.`,
              )
            : v.push(
                `En línea con tu promedio reciente (${Math.round(y * 100)} %).`,
              ),
    k)
  ) {
    let S = l.train.cells[k.statKey],
      D = S && (S.recent || []).slice(0, -1).some((_) => !_);
    v.push(
      <>
        {"Tu error principal fue "}
        <b>{missTitle(k)}</b>
        {". "}
        {D
          ? "Ya lo habías fallado antes: vale la pena practicarlo ahora."
          : "Es nuevo: lo sumo a tus próximas tandas."}
      </>,
    );
  }
  if (!p) {
    if (u === 1) {
      v.push(
        "¡Tanda perfecta! Probá el examen de nivel o una habilidad que tengas floja.",
      );
    } else {
      if (u < 0.8) {
        v.push("Con unas repeticiones de ese error, esto sube a los 80.");
      } else {
        v.push("Muy cerca de una tanda perfecta.");
      }
    }
  }
  let m = () =>
      n.replace("trainSession", { mode: t, focus: s, confirmExit: true }),
    b = () => {
      if (t === "count") {
        n.replace("trainSession", { mode: "count", confirmExit: true });
      } else {
        n.replace("trainSession", {
          mode: "spot",
          focus: k.key,
          confirmExit: true,
        });
      }
    };
  return (
    <div className="fade-up">
      <div className="topbar">
        <IconButton
          icon="back"
          className="sq"
          label="Volver"
          onClick={() => n.pop()}
        />
        <div className="grow center" style={{ fontWeight: 700, fontSize: 20 }}>
          {p ? "Examen terminado" : "Tanda completa"}
        </div>
        <span style={{ width: 44 }} />
      </div>
      <div className="card center summary-card">
        <div className="eyebrow acc">{a.title}</div>
        <div
          className={cx(
            "big-num",
            u >= 0.9 ? "good" : u >= 0.7 ? "acc" : "bad",
          )}
          style={{ marginTop: 10 }}
        >
          {Math.round(u * 100)}%
        </div>
        <div className="muted" style={{ fontSize: 19, marginTop: 6 }}>
          {o}/{i}
          {" correctas"}
        </div>
        <div className="sum-stats">
          <div>
            <b className="num">{i}</b>
            <span>manos</span>
          </div>
          <div>
            <b className={cx("num", !p && (d >= 0 ? "good" : "bad"))}>
              {p ? a.bestStreak : `${d >= 0 ? "+" : "−"}${Math.abs(d)}`}
            </b>
            <span>{p ? "mejor racha" : "puntaje"}</span>
          </div>
          <div>
            <b className="num">{C.length}</b>
            <span>{C.length === 1 ? "error" : "errores"}</span>
          </div>
        </div>
        {p ? null : (
          <div className="sum-rating num">
            <span className="muted">{c}</span>
            <Icon name="arrow" size={26} />
            <b>{r}</b>
          </div>
        )}
      </div>
      <div className="card coach-card">
        <h3>Lo que dice tu coach</h3>
        {v.map((S, D) => (
          <p key={D}>{S}</p>
        ))}
        {k ? (
          <Button onClick={b} iconRight="arrow" className="coach-cta">
            {t === "count"
              ? "Otra tanda con conteo"
              : `Practicar ${missTitle(k)}`}
          </Button>
        ) : null}
      </div>
      {C.length ? (
        <>
          <div className="section-title">
            <h2>Para repasar</h2>
          </div>
          <div className="list">
            {C.map((S, D) => (
              <div className="list-item" key={D}>
                <span className="miss-cards">
                  {S.cards.slice(0, 3).map((_, M) => (
                    <PlayingCard
                      card={makeCard(_, M % 2 ? "h" : "s")}
                      size="xs"
                      key={M}
                    />
                  ))}
                  <span className="vs">vs</span>
                  <PlayingCard card={makeCard(S.up, "c")} size="xs" />
                </span>
                <span className="li-text">
                  <span className="li-title" style={{ fontSize: 16 }}>
                    {missTitle(S)}
                  </span>
                  <span className="li-sub" style={{ display: "block" }}>
                    {"Jugaste "}
                    <b className="bad">{ACTION_NAMES[S.chosen]}</b>
                    {" · era "}
                    <b className="acc">{ACTION_NAMES[S.best]}</b>
                  </span>
                </span>
              </div>
            ))}
          </div>
          {C.some((S) => !S.dev) ? (
            <div className="summary-replay">
              <p className="muted small">
                Estas manos quedaron en <b>Tus errores</b>, en Entrenar. Salen
                de ahí cuando las acertás dos veces.
              </p>
              <Button
                kind="secondary"
                small={true}
                onClick={() =>
                  n.replace("trainSession", {
                    mode: "replay",
                    hands: C.filter((S) => !S.dev).map((S) => ({
                      key: S.key,
                      cards: S.cards,
                      up: S.up,
                      chosen: S.chosen,
                      best: S.best,
                    })),
                    confirmExit: true,
                  })
                }
              >
                Repetir estas manos ahora
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
      <div className="btns" style={{ marginTop: 22 }}>
        <Button onClick={m}>{p ? "Repetir el examen" : "Otra tanda"}</Button>
        <Button kind="outline" onClick={() => n.pop()}>
          Volver
        </Button>
      </div>
    </div>
  );
}
function missTitle(a) {
  let e = spotTitle(a.key);
  return a.tc !== null && a.tc !== undefined
    ? `${e} (CR ${fmtSigned(a.tc)})`
    : e;
}
function mainMiss(a, e) {
  let t = a[0],
    s = -1;
  for (let n of a) {
    let l = e[n.statKey],
      i = l ? (l.recent || []).filter((o) => !o).length : 1;
    if (i > s) {
      s = i;
      t = n;
    }
  }
  return t;
}
function examVerdict(a) {
  return a >= 0.96
    ? "Nivel profesional: jugás la estrategia básica casi sin errores."
    : a >= 0.88
      ? "Muy bien. Te quedan pocas manos por pulir."
      : a >= 0.72
        ? "Bien, pero todavía hay errores que cuestan plata. Repasá las manos de abajo."
        : "Todavía hay que repasar. Las lecciones de la sección 2 y las tandas por habilidad te van a ayudar.";
}
export { TrainSummary };
