import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyRating,
  eloDelta,
  getState,
  recordDrill,
  recordHandResult,
  recordSpot,
  recordSrs,
  recordTrainSession,
  setState,
  useStore,
  withRules,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { handLabel } from "../engine/cards.js";
import { ACTION_EN, ACTION_NAMES, allowedActions } from "../engine/strategy.js";
import { sfx, vibrate } from "../sound.js";
import {
  Button,
  IconButton,
  Modal,
  PlayingCard,
  Sheet,
  StrategyChart,
  chartHighlight,
  cx,
} from "../ui/components.jsx";
import {
  buildSession,
  cardsForSpot,
  deviationSpot,
  gradeSpot,
  makeSpot,
  mistakeQueue,
  spotDifficulty,
  spotFromHand,
} from "../engine/trainer.js";
import { fmtSigned } from "../engine/systems.js";
import { TopBar, spotTitle, useRules } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import { ChartRowHint } from "../lessons/visuals.jsx";
import { cardsQueue } from "./chartCards.jsx";

const SESSION_TITLES = {
  level: "Encontrá tu nivel",
  mixed: "Tanda mezclada",
  skill: "Tanda por habilidad",
  spot: "Práctica puntual",
  count: "Con conteo",
  exam: "Examen de nivel",
  mistakes: "Tus errores",
  foryou: "Tanda para vos",
  replay: "Repaso de una tanda",
  cards: "Tarjetas de la tabla",
};
const SKILL_TITLES = {
  stiff: "Duras 12–16",
  soft: "Blandas",
  pairs: "Pares",
  doubles: "Dobles",
  surrender: "Rendición",
};
function TrainSession({ mode: a = "mixed", focus: e = null, hands = null }) {
  let t = useNav(),
    s = useStore(),
    n = useRules(),
    l = useMemo(
      () =>
        a === "skill" && e === "surrender"
          ? withRules({ ...n, surrender: true })
          : n,
      [a, e],
    ),
    i = a === "exam" ? 25 : 10,
    o = a === "exam",
    [c, setQueue] = useState(() => {
      if (a === "count")
        return Array.from({ length: i }, () => deviationSpot(l));
      const st = getState();
      // Tarjetas de la tabla: las casillas que vencieron y algunas nuevas, siempre con 2 cartas.
      const deck = a === "cards" ? cardsQueue(st) : [];
      if (deck.length)
        return deck.map((key) => ({ spot: makeSpot(key, { nCards: 2 }) }));
      // Tus errores: las manos exactas que fallaste. Tanda para vos: algunos errores y el resto
      // apuntado a tus puntos débiles.
      const replays =
        a === "replay" && hands
          ? hands.map((m) => ({
              spot: spotFromHand(m.key, m.cards, m.up),
              replay: true,
            }))
          : a === "mistakes" || a === "foryou"
            ? mistakeQueue(st.train.mistakes, a === "mistakes" ? i : 3).map(
                (m) => ({
                  spot: spotFromHand(m.key, m.cards, m.up),
                  replay: true,
                }),
              )
            : [];
      const rest = buildSession({
        mode:
          o ||
          a === "foryou" ||
          a === "mistakes" ||
          a === "replay" ||
          a === "cards"
            ? "mixed"
            : a,
        focus: e,
        rules: l,
        stats: st.train.cells,
        size: Math.max(0, i - replays.length),
      }).map((J) => ({
        // En la práctica puntual, siempre 2 cartas: es la casilla de la tabla tal cual.
        spot: makeSpot(J, { nCards: a === "spot" ? 2 : cardsForSpot(J) }),
      }));
      return (a === "mistakes" || a === "replay") && replays.length
        ? replays
        : [...replays, ...rest];
    }),
    [r, u] = useState(0),
    [d, p] = useState(null),
    [f, y] = useState([]),
    [C, k] = useState(0),
    [v, m] = useState(0),
    [b, S] = useState(false),
    [D, _] = useState(false),
    M = useRef(getState().rating.value),
    R = useRef(Date.now());
  useEffect(() => {
    let w = () => _(true);
    window.addEventListener("v21-back", w);
    return () => window.removeEventListener("v21-back", w);
  }, []);
  let V = c[r],
    B = V.spot,
    Z = { cards: B.cards, fromSplit: false },
    ta = allowedActions(Z, l),
    Ba = handLabel(B.cards),
    Ma = B.cards.length > 2,
    ca = {
      D: Ma ? "solo con 2 cartas" : "no se permite",
      P: "solo pares",
      R: Ma ? "solo con 2 cartas" : "no se permite",
    },
    ha = (w) => {
      if (d) return;
      let J = gradeSpot(B, w, l, { useCount: a === "count" }),
        ba = a === "count" ? "C:" + (V.dev ? V.dev.id : B.key) : B.key,
        ye = a === "count" ? 1250 : spotDifficulty(B.key, l),
        Ja = getState().rating.value,
        Ga = o ? 0 : eloDelta(Ja, ye, J.correct);
      recordSpot(ba, J.correct);
      // Tarjetas: la que fallás vuelve al final de la tanda (esa repetición no mueve su caja).
      if (a === "cards" && !V.again) {
        recordSrs(B.key, J.correct);
        if (!J.correct)
          setQueue((q) => [
            ...q,
            { spot: makeSpot(B.key, { nCards: 2 }), again: true },
          ]);
      }
      if (!o) setState((Ht) => applyRating(Ht, Ga));
      if (a !== "count")
        recordHandResult(
          {
            key: B.key,
            cards: B.cards.map((Ht) => Ht.r),
            up: B.upRank,
            chosen: w,
            best: J.best,
            src: "train",
          },
          J.correct,
        );
      let Zt = J.correct ? C + 1 : 0;
      k(Zt);
      m((Ht) => Math.max(Ht, Zt));
      if (J.correct) {
        sfx.good();
        vibrate(12);
      } else {
        sfx.bad();
        vibrate([20, 40, 20]);
      }
      let On = {
        key: B.key,
        statKey: ba,
        correct: J.correct,
        chosen: w,
        best: J.best,
        delta: Ga,
        dev: V.dev ? V.dev.id : null,
        tc: B.tc,
        cards: B.cards.map((Ht) => Ht.r),
        up: B.upRank,
      };
      y((Ht) => [...Ht, On]);
      p({ ...J, delta: Ga });
      if (o) {
        setTimeout(() => X(true), 380);
      }
    },
    Ia = (w) => {
      let J = w.filter((Ga) => Ga.correct).length,
        ba = getState().rating.value,
        ye =
          a === "skill"
            ? SKILL_TITLES[e] || SESSION_TITLES.skill
            : a === "spot"
              ? spotTitle(e)
              : SESSION_TITLES[a],
        Ja = {
          kind: a,
          focus: e,
          title: ye,
          n: w.length,
          ok: J,
          before: M.current,
          after: ba,
          t: Date.now(),
          ms: Date.now() - R.current,
          bestStreak: Math.max(v, C),
          misses: w.filter((Ga) => !Ga.correct).map((Ga) => Ga.key),
          // Las manos falladas completas, para el historial.
          missHands: w
            .filter((Ga) => !Ga.correct && !Ga.dev)
            .map((Ga) => ({
              key: Ga.key,
              cards: Ga.cards,
              up: Ga.up,
              chosen: Ga.chosen,
              best: Ga.best,
            })),
        };
      recordTrainSession(Ja);
      if (a === "count") {
        recordDrill("count", { t: Date.now(), n: Ja.n, ok: J });
      }
      t.replace("trainSummary", {
        summary: Ja,
        results: w,
        rules: l,
        mode: a,
        focus: e,
      });
    },
    X = (w) => {
      p(null);
      y((J) =>
        r + 1 >= c.length
          ? (setTimeout(() => Ia(J), 0), J)
          : (u((ba) => ba + 1), J),
      );
    },
    P = `${r + 1} / ${c.length}${o ? "" : ` · ✦ ${C} ${C === 1 ? "seguida" : "seguidas"}`}`;
  return (
    <div className="train-session">
      <TopBar
        onClose={() => (f.length && f.length < c.length ? _(true) : t.pop())}
        title={a === "skill" ? SKILL_TITLES[e] : SESSION_TITLES[a]}
        sub={P}
        right={
          o ? (
            <span style={{ width: 44 }} />
          ) : (
            <IconButton
              icon="grid"
              className="sq"
              label="Ver tabla de estrategia"
              onClick={() => S(true)}
            />
          )
        }
      />
      {o ? (
        <div className="exam-progress">
          <span style={{ width: `${(r / c.length) * 100}%` }} />
        </div>
      ) : null}
      <div
        className={cx("deal-card", d && (d.correct ? "is-ok" : "is-bad"))}
        key={r}
      >
        {a === "count" ? (
          <div className="tc-banner">
            <span className="eyebrow">Conteo real</span>
            <b className="num">{fmtSigned(B.tc)}</b>
            <span className="muted tiny">
              {"Hi-Lo · "}
              {l.decks}
              {" mazos"}
            </span>
          </div>
        ) : null}
        <div className="deal-grid">
          <div className="deal-side">
            <div className="eyebrow">Crupier</div>
            <div className="card-row" style={{ marginTop: 14 }}>
              <PlayingCard card={B.dealer} size="md" deal={true} />
              <PlayingCard card={B.dealer} size="md" down={true} deal={true} />
            </div>
          </div>
          <div className="deal-divider" />
          <div className="deal-side">
            <div className="eyebrow">Tu mano</div>
            <div className="card-row hand-row" style={{ marginTop: 14 }}>
              {B.cards.map((w, J) => (
                <PlayingCard
                  card={w}
                  size={B.cards.length > 2 ? "sm" : "md"}
                  deal={true}
                  mark={
                    d && J === B.cards.length - 1
                      ? d.correct
                        ? "ok"
                        : "bad"
                      : null
                  }
                  key={w.id}
                />
              ))}
            </div>
            <div className="hand-label">{Ba}</div>
          </div>
        </div>
      </div>
      {!d || o ? (
        <div className="choose">
          <h3 className="choose-title">Elegí tu jugada</h3>
          <div className="action-grid">
            <ActionButton a="H" allowed={ta} onClick={ha} notes={ca} />
            <ActionButton a="S" allowed={ta} onClick={ha} notes={ca} />
            <ActionButton a="D" allowed={ta} onClick={ha} notes={ca} />
            <ActionButton a="P" allowed={ta} onClick={ha} notes={ca} />
            {l.surrender ? (
              <ActionButton
                a="R"
                allowed={ta}
                onClick={ha}
                notes={ca}
                wide={true}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="result-card fade-up">
          <div className="row">
            <span className={cx("res-icon", d.correct ? "ok" : "bad")}>
              <Icon name={d.correct ? "check" : "x"} size={22} stroke={3} />
            </span>
            <h2 className="grow res-title">
              {d.correct ? praise(r) : "No era esa"}
            </h2>
            <span
              className={cx("res-delta num", d.delta >= 0 ? "good" : "bad")}
            >
              {d.delta > 0 ? "+" : d.delta < 0 ? "−" : ""}
              {Math.abs(d.delta)}
            </span>
          </div>
          <div className="res-moves">
            <div>
              <div className="eyebrow">Tu jugada</div>
              <div className="res-move">{ACTION_NAMES[d.chosen]}</div>
            </div>
            <div>
              <div className="eyebrow">La mejor</div>
              <div className="res-move acc">{ACTION_NAMES[d.best]}</div>
            </div>
          </div>
          <div className="res-note">
            <h3>Por qué</h3>
            {d.lines.map((w, J) => (
              <p key={J}>{w}</p>
            ))}
            {d.costText && s.settings.showCost ? (
              <p className="res-cost">{d.costText}</p>
            ) : null}
          </div>
          {a !== "count" ? (
            <ChartRowHint cards={B.cards} up={B.upRank} rules={l} />
          ) : null}
          <Button kind="white" onClick={() => X(false)} className="next-btn">
            {r + 1 >= c.length ? "Ver resultado" : "Siguiente mano"}
          </Button>
        </div>
      )}
      <Sheet
        open={b}
        onClose={() => S(false)}
        title="Estrategia básica"
        tall={true}
      >
        <StrategyChart rules={l} highlight={d ? chartHighlight(B) : null} />
      </Sheet>
      <Modal open={D} onClose={() => _(false)}>
        <h2 style={{ fontSize: 24 }}>¿Dejar la tanda?</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          Lo que ya respondiste queda guardado en tus estadísticas, pero la
          tanda no se cuenta como completa.
        </p>
        <div className="btns">
          <Button kind="secondary" onClick={() => _(false)}>
            Seguir jugando
          </Button>
          <Button kind="danger" onClick={() => t.pop()}>
            Salir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
const PRAISE = [
  "Correcto",
  "¡Bien!",
  "Exacto",
  "Así se juega",
  "Correcto",
  "Perfecto",
];
function praise(a) {
  return PRAISE[a % PRAISE.length];
}
const ACTION_ICONS = {
  H: "hand",
  S: "stand",
  D: null,
  P: "split",
  R: "surrender",
};
const ACTION_NOTES = {
  D: "solo con 2 cartas",
  P: "solo pares",
  R: "solo con 2 cartas",
};
function ActionButton({
  a,
  allowed: e,
  onClick: t,
  wide: s,
  compact: n,
  notes: l,
}) {
  let i = (l && l[a]) || ACTION_NOTES[a],
    o = e[a];
  return (
    <button
      type="button"
      className={cx("act-btn", `act-${a}`, s && "wide", n && "compact")}
      disabled={!o}
      onClick={() => t(a)}
    >
      {a === "D" ? (
        <span className="act-2x">2X</span>
      ) : (
        <Icon name={ACTION_ICONS[a]} size={n ? 24 : 30} />
      )}
      <span className="act-label">{ACTION_NAMES[a].toUpperCase()}</span>
      {!o && i && !n ? (
        <span className="act-note">{i}</span>
      ) : (
        <span className="act-en">{ACTION_EN[a]}</span>
      )}
    </button>
  );
}
export { ActionButton, TrainSession };
