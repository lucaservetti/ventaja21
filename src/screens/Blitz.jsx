// Contrarreloj: 60 segundos para acertar todas las manos que puedas.
// Cada acierto suma 1 y cada error te saca 3 segundos.
import { useEffect, useRef, useState } from "react";
import { getState, setState, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { Button, PlayingCard, cx } from "../ui/components.jsx";
import { TopBar, useRules } from "../ui/common.jsx";
import { handLabel } from "../engine/cards.js";
import { ACTION_NAMES, allowedActions } from "../engine/strategy.js";
import {
  buildSession,
  cardsForSpot,
  gradeSpot,
  makeSpot,
} from "../engine/trainer.js";
import { sfx, vibrate } from "../sound.js";
import { useNav } from "../nav.js";
import { ActionButton } from "./TrainSession.jsx";
import { ShareButton } from "../ui/ShareButton.jsx";

const TOTAL_MS = 60000;
const PENALTY_MS = 3000;

function newSpots(rules) {
  return buildSession({
    mode: "mixed",
    rules,
    stats: getState().train.cells,
    size: 30,
  }).map((k) => makeSpot(k, { nCards: cardsForSpot(k) }));
}

function Blitz() {
  const st = useStore();
  const nav = useNav();
  const rules = useRules();
  const best = (st.train.blitz && st.train.blitz.best) || 0;
  const [phase, setPhase] = useState("ready");
  const [spots, setSpots] = useState(() => newSpots(rules));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState(null); // { ok, text }
  const [left, setLeft] = useState(TOTAL_MS);
  // La barra baja sola con una animación de CSS (60 cuadros por segundo sin redibujar la pantalla);
  // solo se reinicia al empezar y con cada penalización.
  const [bar, setBar] = useState({ k: 0, ms: TOTAL_MS });
  const endAt = useRef(0);
  const result = useRef(null);

  useEffect(() => {
    if (phase !== "play") return undefined;
    // El número cambia una vez por segundo: no hace falta volver a dibujar más seguido.
    const id = setInterval(() => {
      const ms = Math.max(0, endAt.current - Date.now());
      setLeft((prev) =>
        Math.ceil(prev / 1000) === Math.ceil(ms / 1000) ? prev : ms,
      );
      if (ms <= 0) finish();
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  function start() {
    setSpots(newSpots(rules));
    setIdx(0);
    setScore(0);
    setMisses(0);
    setFlash(null);
    endAt.current = Date.now() + TOTAL_MS;
    setLeft(TOTAL_MS);
    setBar((b) => ({ k: b.k + 1, ms: TOTAL_MS }));
    setPhase("play");
  }
  function finish() {
    setPhase((p) => {
      if (p !== "play") return p;
      return "done";
    });
  }
  // Al terminar, se guarda el récord una sola vez.
  useEffect(() => {
    if (phase !== "done") return;
    const prev = (getState().train.blitz && getState().train.blitz.best) || 0;
    result.current = { record: score > prev && score > 0, prev };
    setState((s) => ({
      ...s,
      train: {
        ...s.train,
        blitz: {
          best: Math.max(prev, score),
          plays: ((s.train.blitz && s.train.blitz.plays) || 0) + 1,
          last: [
            ...((s.train.blitz && s.train.blitz.last) || []),
            { t: Date.now(), score },
          ].slice(-30),
        },
      },
    }));
    if (result.current.record) sfx.win();
  }, [phase]);

  function answer(a) {
    if (phase !== "play") return;
    const spot = spots[idx];
    const g = gradeSpot(spot, a, rules);
    if (g.correct) {
      setScore((x) => x + 1);
      sfx.good();
      vibrate(8);
      setFlash({ ok: true, key: idx });
    } else {
      setMisses((x) => x + 1);
      endAt.current -= PENALTY_MS;
      const ms = Math.max(0, endAt.current - Date.now());
      setLeft(ms);
      setBar((b) => ({ k: b.k + 1, ms }));
      sfx.bad();
      vibrate([20, 40, 20]);
      setFlash({ ok: false, key: idx, text: ACTION_NAMES[g.best] });
    }
    if (idx + 3 >= spots.length) setSpots((s) => [...s, ...newSpots(rules)]);
    setIdx((i) => i + 1);
  }

  if (phase === "ready")
    return (
      <div className="blitz fade-up">
        <TopBar
          onClose={() => nav.pop()}
          closeIcon="back"
          title="Contrarreloj"
        />
        <div className="blitz-hero">
          <span className="blitz-clock">
            <Icon name="clock" size={40} />
          </span>
          <h1>¿Cuántas manos acertás en 60 segundos?</h1>
          <p className="muted">
            Elegí la jugada de la tabla lo más rápido que puedas. Cada acierto
            suma 1; cada error te saca 3 segundos.
          </p>
          {best ? (
            <p className="blitz-best">
              Tu récord: <b className="num">{best}</b>
            </p>
          ) : null}
        </div>
        <div className="bottom-actions">
          <Button onClick={start}>Empezar</Button>
        </div>
      </div>
    );

  if (phase === "done") {
    const total = score + misses;
    const rec = result.current && result.current.record;
    return (
      <div className="blitz fade-up">
        <TopBar
          onClose={() => nav.pop()}
          closeIcon="back"
          title="Contrarreloj"
        />
        <div className="blitz-hero">
          <span className={cx("blitz-clock", rec && "gold")}>
            <Icon name={rec ? "trophy" : "clock"} size={40} />
          </span>
          <div className="blitz-score num">{score}</div>
          <p className="muted">
            {rec ? "¡Récord nuevo!" : `Tu récord: ${Math.max(best, score)}`}
          </p>
          <p className="muted small">
            {total
              ? `${score} de ${total} bien · ${Math.round((score / total) * 100)} %`
              : "No llegaste a contestar ninguna mano."}
          </p>
        </div>
        <div className="bottom-actions">
          <div className="btns">
            <Button onClick={start}>Otra vez</Button>
            <ShareButton
              make={() => ({
                title: "Edge 21",
                text: `Acerté ${score} manos en 60 segundos en Edge 21 🃏 ¿Me ganás?`,
                card: {
                  eyebrow: "Contrarreloj",
                  big: `${score} manos`,
                  sub: "en 60 segundos",
                  lines: [
                    total
                      ? `${Math.round((score / total) * 100)} % de precisión`
                      : "",
                    rec ? "¡Récord nuevo!" : "",
                  ],
                },
              })}
            />
            <Button kind="ghost" onClick={() => nav.pop()}>
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const spot = spots[idx];
  const allowed = allowedActions(
    { cards: spot.cards, fromSplit: false },
    rules,
  );
  return (
    <div className="blitz">
      <div className="blitz-top">
        <span
          className={cx("blitz-time num", left <= 10000 && "low")}
          key={left <= 10000 ? Math.ceil(left / 1000) : "t"}
        >
          {Math.ceil(left / 1000)}
        </span>
        <span className="blitz-pts num">
          {score} <small>bien</small>
        </span>
      </div>
      <div className="blitz-bar">
        <i
          key={bar.k}
          style={{
            "--from": bar.ms / TOTAL_MS,
            animationDuration: `${bar.ms}ms`,
          }}
        />
      </div>
      <div className="card deal-card blitz-deal" key={idx}>
        <div className="deal-grid">
          <div className="deal-side">
            <div className="eyebrow">Crupier</div>
            <div className="card-row" style={{ marginTop: 12 }}>
              <PlayingCard card={spot.dealer} size="md" deal={true} />
            </div>
          </div>
          <div className="deal-divider" />
          <div className="deal-side">
            <div className="eyebrow">Tu mano</div>
            <div className="card-row hand-row" style={{ marginTop: 12 }}>
              {spot.cards.map((c) => (
                <PlayingCard
                  card={c}
                  size={spot.cards.length > 2 ? "sm" : "md"}
                  deal={true}
                  key={c.id}
                />
              ))}
            </div>
            <div className="hand-label">{handLabel(spot.cards)}</div>
          </div>
        </div>
      </div>
      <div className="blitz-flash" aria-live="polite">
        {flash ? (
          <span className={cx("bf", flash.ok ? "ok" : "bad")} key={flash.key}>
            {flash.ok ? "¡Bien!" : `Era: ${flash.text} · −3 s`}
          </span>
        ) : null}
      </div>
      <div className="action-grid">
        {["H", "S", "D", "P"].map((a) => (
          <ActionButton
            a={a}
            allowed={allowed}
            onClick={answer}
            compact={true}
            key={a}
          />
        ))}
        {rules.surrender ? (
          <ActionButton
            a="R"
            allowed={allowed}
            onClick={answer}
            compact={true}
            wide={true}
          />
        ) : null}
      </div>
    </div>
  );
}

export { Blitz };
