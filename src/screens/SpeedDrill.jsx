// Velocidad de conteo: tandas de 10 cartas cada vez más rápidas. Mide cuántas cartas por segundo
// contás bien y te compara con el ritmo de un casino.
import { useEffect, useRef, useState } from "react";
import { recordDrill, useStore } from "../state.js";
import { buildDecks, shuffle } from "../engine/cards.js";
import { countValue, fmtSigned, systemFor } from "../engine/systems.js";
import { Icon } from "../ui/icons.jsx";
import {
  Button,
  Keypad,
  Modal,
  PlayingCard,
  cx,
  formatKeypad,
  parseKeypad,
} from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import { sfx, vibrate } from "../sound.js";
import { useNav } from "../nav.js";

const ROUND = 10;
const START_MS = 1200;
const STEP = 0.82;
const MIN_MS = 220;
const LIVES = 2;
const REFS = [
  { rate: 1, label: "Para empezar" },
  { rate: 1.5, label: "Un crupier repartiendo" },
  { rate: 2.5, label: "Una mesa llena en el casino" },
  { rate: 3.5, label: "Nivel profesional" },
];

function rateText(r) {
  return r.toFixed(1).replace(".", ",");
}

function SpeedDrill() {
  const st = useStore();
  const nav = useNav();
  const sys = systemFor(st.settings.system);
  const best = (st.drills.speed && st.drills.speed.best) || 0;
  const [phase, setPhase] = useState("intro"); // intro | watch | answer | feedback | done
  const [ms, setMs] = useState(START_MS);
  const [cards, setCards] = useState([]);
  const [pos, setPos] = useState(0);
  const [value, setValue] = useState("");
  const [lives, setLives] = useState(LIVES);
  const [top, setTop] = useState(0); // mejor velocidad acertada en esta sesión
  const [last, setLast] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [exitOpen, setExitOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const onBack = () =>
      phase === "intro" || phase === "done" ? nav.pop() : setExitOpen(true);
    window.addEventListener("v21-back", onBack);
    return () => window.removeEventListener("v21-back", onBack);
  }, [phase]);
  useEffect(() => () => clearTimeout(timer.current), []);
  // Las cartas caen solas al ritmo de la tanda.
  useEffect(() => {
    if (phase !== "watch") return;
    if (pos >= cards.length) {
      setPhase("answer");
      return;
    }
    sfx.card();
    timer.current = setTimeout(() => setPos((p) => p + 1), ms);
    return () => clearTimeout(timer.current);
  }, [phase, pos]);

  const startRound = (speed) => {
    setCards(shuffle(buildDecks(1)).slice(0, ROUND));
    setPos(0);
    setValue("");
    setMs(speed);
    setPhase("watch");
  };
  const finish = (topRate) => {
    recordDrill(
      "speed",
      {
        t: Date.now(),
        n: rounds + 1,
        ok: topRate > 0,
        best: topRate,
        sys: sys.id,
      },
      (d) => ({ best: Math.max(d.best || 0, topRate) }),
    );
    setPhase("done");
  };
  const submit = () => {
    const v = parseKeypad(value);
    if (v === null) return;
    const correct = cards.reduce((a, c) => a + countValue(c, sys), 0);
    const ok = v === correct;
    const rate = 1000 / ms;
    setRounds((r) => r + 1);
    setLast({ ok, v, correct, rate });
    if (ok) {
      sfx.good();
      vibrate(12);
      setTop((t) => Math.max(t, rate));
    } else {
      sfx.bad();
      vibrate([20, 40, 20]);
      setLives((l) => l - 1);
    }
    setPhase("feedback");
  };
  const next = () => {
    if (!last.ok && lives <= 0) return finish(top);
    if (last.ok && ms <= MIN_MS) return finish(top);
    startRound(last.ok ? Math.max(MIN_MS, Math.round(ms * STEP)) : ms);
  };

  const shown = cards[Math.min(pos, cards.length - 1)];
  const header = (
    <TopBar
      onClose={() =>
        phase === "intro" || phase === "done" ? nav.pop() : setExitOpen(true)
      }
      title="Velocidad de conteo"
      sub={
        phase === "intro" || phase === "done"
          ? `${sys.short || sys.name}`
          : `${rateText(1000 / ms)} cartas por segundo · ${"♥".repeat(Math.max(0, lives))}`
      }
    />
  );

  if (phase === "intro" || phase === "done") {
    const sessionTop = phase === "done" ? top : best;
    return (
      <div className="drill fade-up">
        {header}
        <div className="card" style={{ marginTop: 6 }}>
          {phase === "done" ? (
            <>
              <div className="eyebrow">Tu velocidad de hoy</div>
              <div className="speed-meter">
                <span className="speed-big num acc">
                  {top ? rateText(top) : "—"}
                </span>
                <span className="muted">cartas por segundo</span>
              </div>
              <p className="muted small" style={{ marginTop: 6 }}>
                {top > best
                  ? "¡Récord nuevo!"
                  : best
                    ? `Tu récord: ${rateText(best)} cartas por segundo.`
                    : ""}{" "}
                {rounds} {rounds === 1 ? "tanda" : "tandas"}.
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 24 }}>¿Qué tan rápido contás?</h2>
              <p className="muted" style={{ marginTop: 8 }}>
                Tandas de {ROUND} cartas. Cada vez que acertás el conteo, la
                siguiente va más rápido. Tenés {LIVES} vidas: con dos errores
                termina. Te queda la velocidad más alta que contaste bien.
              </p>
            </>
          )}
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <div className="eyebrow">Para comparar</div>
          <div className="speed-ref">
            {REFS.map((r) => (
              <div className={cx(sessionTop >= r.rate && "on")} key={r.rate}>
                <span>
                  {sessionTop >= r.rate ? (
                    <Icon name="check" size={14} className="good" />
                  ) : null}{" "}
                  {r.label}
                </span>
                <span className="num">{rateText(r.rate)} c/s</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bottom-actions">
          <div className="btns">
            <Button
              onClick={() => {
                setLives(LIVES);
                setTop(0);
                setRounds(0);
                startRound(START_MS);
              }}
            >
              {phase === "done" ? "Otra vez" : "Empezar"}
            </Button>
            {phase === "done" ? (
              <Button kind="outline" onClick={() => nav.pop()}>
                Volver
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drill fade-up">
      {header}
      {phase === "watch" ? (
        <>
          <div className="drill-progress">
            <span style={{ width: `${(pos / ROUND) * 100}%` }} />
          </div>
          <div className="speed-stage">
            {shown ? (
              <PlayingCard card={shown} size="md" deal={true} key={shown.id} />
            ) : null}
          </div>
          <p className="center muted small">Contá en silencio…</p>
        </>
      ) : phase === "answer" ? (
        <>
          <h2 className="center drill-q">¿Cuál es el conteo de la tanda?</h2>
          <div className="keypad-display">{formatKeypad(value)}</div>
          <Keypad
            value={value}
            onChange={setValue}
            onSubmit={submit}
            allowHalf={sys.id === "halves"}
            submitLabel="Comprobar"
          />
        </>
      ) : (
        <div className="card review-head" style={{ marginTop: 10 }}>
          <h2 className={last.ok ? "good" : "bad"} style={{ fontSize: 30 }}>
            {last.ok ? "¡Bien!" : `Era ${fmtSigned(last.correct)}`}
          </h2>
          <p className="muted" style={{ marginTop: 6 }}>
            {last.ok
              ? `Contaste bien a ${rateText(last.rate)} cartas por segundo. La próxima va más rápido.`
              : lives > 0
                ? `Pusiste ${fmtSigned(last.v)}. Te queda ${lives} ${lives === 1 ? "vida" : "vidas"}: repetís esta velocidad.`
                : `Pusiste ${fmtSigned(last.v)}. Se terminaron las vidas.`}
          </p>
          <div className="bottom-actions">
            <Button onClick={next}>
              {!last.ok && lives <= 0 ? "Ver resultado" : "Siguiente tanda"}
            </Button>
          </div>
        </div>
      )}
      <Modal open={exitOpen} onClose={() => setExitOpen(false)}>
        <h2 style={{ fontSize: 24 }}>¿Dejar el ejercicio?</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          No se guarda esta sesión.
        </p>
        <div className="btns">
          <Button kind="secondary" onClick={() => setExitOpen(false)}>
            Seguir
          </Button>
          <Button kind="danger" onClick={() => nav.pop()}>
            Salir
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export { SpeedDrill };
