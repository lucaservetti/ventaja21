// Ruta de desviaciones: la tarjeta de Entrenar y la pantalla de cada nivel (qué aprendés, práctica y resultado).
import { useEffect, useState } from "react";
import { recordDevLevel, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { Button, Modal, PlayingCard, cx } from "../ui/components.jsx";
import { ACTION_NAMES } from "../engine/strategy.js";
import { fmtSigned } from "../engine/systems.js";
import { handLabel } from "../engine/cards.js";
import {
  DEV_LEVELS,
  devCurrent,
  devLabel,
  devById,
  devPassed,
  devPassedCount,
  devQuestions,
  devUnlocked,
  ruleText,
} from "../engine/devPath.js";
import { TopBar, useRules } from "../ui/common.jsx";
import { sfx, vibrate } from "../sound.js";
import { ActionButton } from "./TrainSession.jsx";
import { useNav } from "../nav.js";

const ANSWER_NAMES = {
  ...ACTION_NAMES,
  I: "Tomar el seguro",
  N: "No tomar el seguro",
};

function openDevLevel(nav, level, replace = false) {
  const params = { level: level.n, confirmExit: true };
  if (replace) nav.replace("devLevel", params);
  else nav.push("devLevel", params);
}

// Tarjeta para Entrenar.
function DevPathCard({ st, nav }) {
  const [open, setOpen] = useState(false);
  const cur = devCurrent(st);
  const done = devPassedCount(st);
  return (
    <div className="card dpath">
      <div className="row between">
        <span className="eyebrow acc">Ruta de desviaciones</span>
        <b className="num">
          {done}
          <span className="muted small">/10</span>
        </b>
      </div>
      <h3 className="dpath-title">
        {cur ? `Nivel ${cur.n}: ${cur.title}` : "¡Ruta completa!"}
      </h3>
      <p className="muted small">
        {cur
          ? cur.sub
          : "Sabés todas las desviaciones. Repasalas en la mesa con el modo casino."}
      </p>
      <div className="dpath-dots" aria-hidden="true">
        {DEV_LEVELS.map((l) => (
          <i className={cx(devPassed(st, l) && "on")} key={l.id} />
        ))}
      </div>
      {cur ? (
        <Button onClick={() => openDevLevel(nav, cur)} iconRight="arrow">
          {done ? `Seguir: nivel ${cur.n}` : "Empezar la ruta"}
        </Button>
      ) : null}
      <button
        type="button"
        className="link small dpath-more"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? "Ocultar los niveles" : "Ver los 10 niveles"}{" "}
        <Icon name="down" size={14} className={open ? "up" : ""} />
      </button>
      {open ? (
        <div className="dpath-list">
          {DEV_LEVELS.map((l) => {
            const ok = devPassed(st, l);
            const unlocked = devUnlocked(st, l);
            return (
              <button
                type="button"
                className={cx("dpath-row", ok && "ok", !unlocked && "locked")}
                disabled={!unlocked}
                onClick={() => openDevLevel(nav, l)}
                key={l.id}
              >
                <span className="how-n">
                  {ok ? (
                    <Icon name="check" size={16} />
                  ) : unlocked ? (
                    l.n
                  ) : (
                    <Icon name="lock" size={14} />
                  )}
                </span>
                <span className="grow">
                  <b>{l.title}</b>
                  <span className="muted tiny" style={{ display: "block" }}>
                    {l.sub}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function DevLevel({ level: n }) {
  const st = useStore();
  const nav = useNav();
  const rules = useRules();
  const level = n ? DEV_LEVELS[n - 1] : devCurrent(st) || DEV_LEVELS[0];
  const [phase, setPhase] = useState("intro");
  const [qs, setQs] = useState([]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [exitOpen, setExitOpen] = useState(false);
  useEffect(() => {
    const onBack = () => (phase === "run" ? setExitOpen(true) : nav.pop());
    window.addEventListener("v21-back", onBack);
    return () => window.removeEventListener("v21-back", onBack);
  }, [phase]);

  const start = () => {
    setQs(devQuestions(level, rules));
    setI(0);
    setAnswers([]);
    setPhase("run");
  };

  if (phase === "intro") {
    const devs = [...new Set(level.ids)].map(devById).filter(Boolean);
    const passed = devPassed(st, level);
    const tries = (st.devPath.tries || {})[level.id] || 0;
    return (
      <div className="dev-level fade-up">
        <TopBar
          onClose={() => nav.pop()}
          closeIcon="back"
          title="Ruta de desviaciones"
          sub={`Nivel ${level.n} de 10`}
        />
        <div className="center" style={{ marginTop: 10 }}>
          <span className={cx("level-badge", passed && "done")}>
            {passed ? <Icon name="check" size={28} stroke={3} /> : level.n}
          </span>
          <h1 className="dev-title">{level.title}</h1>
          <p className="muted">{level.sub}</p>
        </div>
        <div className="card" style={{ marginTop: 18 }}>
          <div className="eyebrow">
            {devs.length > 6 ? "Las reglas" : "Lo que tenés que saber"}
          </div>
          <div className="dev-rules">
            {devs.map((d) => (
              <div className="dev-rule" key={d.id}>
                <b>{devLabel(d)}</b>
                <span>{ruleText(d, rules)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card flat dev-how">
          <Icon name="info" size={20} />
          <span className="small">
            {level.rc
              ? "Te damos el conteo corrido y los mazos que quedan: dividí y redondeá para abajo para sacar el conteo real (por ejemplo, +7 con 2 mazos es +3)."
              : "Cada mano trae el conteo real. Si está en el número de la regla o más, jugás la desviación; si está abajo, la jugada normal."}{" "}
            Para aprobar: {Math.ceil(level.size * level.need)} de {level.size}{" "}
            bien.
            {tries ? ` Intentos: ${tries}.` : ""}
          </span>
        </div>
        {level.ids.some((id) => devById(id) && devById(id).at === "R") &&
        !rules.surrender ? (
          <p className="muted small" style={{ marginTop: 10 }}>
            Tu mesa no permite rendirse, pero conviene saberlas para cuando
            juegues en una que sí.
          </p>
        ) : null}
        <div className="bottom-actions">
          <Button onClick={start} iconRight="arrow">
            {passed ? "Repetir el nivel" : "Empezar"}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const ok = answers.filter((a) => a.ok).length;
    const need = Math.ceil(level.size * level.need);
    const passed = ok >= need;
    const next = DEV_LEVELS[level.n];
    const missed = [
      ...new Map(
        answers.filter((a) => !a.ok).map((a) => [a.q.dev.id, a.q.dev]),
      ).values(),
    ];
    return (
      <div className="dev-level fade-up drill-result">
        <div className="center" style={{ marginTop: 30 }}>
          <span
            className={cx("res-icon big", passed ? "ok" : "bad")}
            style={{ margin: "0 auto" }}
          >
            <Icon name={passed ? "trophy" : "refresh"} size={34} stroke={2.4} />
          </span>
          <div className="eyebrow" style={{ marginTop: 14 }}>
            Nivel {level.n} de 10
          </div>
          <h1 style={{ fontSize: 30, marginTop: 4 }}>
            {passed ? "¡Aprobaste!" : "Todavía no"}
          </h1>
          <p className="muted" style={{ marginTop: 8 }}>
            {ok} de {level.size} bien · necesitabas {need}.
          </p>
        </div>
        {missed.length ? (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="eyebrow">Para repasar</div>
            <div className="dev-rules">
              {missed.map((d) => (
                <div className="dev-rule" key={d.id}>
                  <b>{devLabel(d)}</b>
                  <span>{ruleText(d, rules)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="btns" style={{ marginTop: 22 }}>
          {passed && next ? (
            <Button
              onClick={() => openDevLevel(nav, next, true)}
              iconRight="arrow"
            >
              Seguir: nivel {next.n}
            </Button>
          ) : (
            <Button onClick={start}>
              {passed ? "Repetir el nivel" : "Reintentar"}
            </Button>
          )}
          <Button kind="outline" onClick={() => nav.pop()}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const q = qs[i];
  const saved = answers[i];
  const answer = (a) => {
    if (saved) return;
    const ok = a === q.best;
    if (ok) {
      sfx.good();
      vibrate(12);
    } else {
      sfx.bad();
      vibrate([20, 40, 20]);
    }
    setAnswers([...answers, { q, pick: a, ok }]);
  };
  const next = () => {
    if (i + 1 < qs.length) setI(i + 1);
    else {
      const ok = answers.filter((a) => a.ok).length;
      const passed = ok >= Math.ceil(level.size * level.need);
      recordDevLevel(level.id, passed, ok / level.size);
      if (passed) sfx.win();
      setPhase("done");
    }
  };
  const ins = q.dev.type === "ins";
  const allowed = {
    H: true,
    S: true,
    D: true,
    P: q.dev.type === "pair",
    R: true,
  };
  return (
    <div className="dev-level train-session">
      <TopBar
        onClose={() => setExitOpen(true)}
        title={`Nivel ${level.n} de 10`}
        sub={`${i + 1} / ${qs.length} · ${answers.filter((a) => a.ok).length} bien`}
      />
      <div className="exam-progress">
        <span style={{ width: `${(i / qs.length) * 100}%` }} />
      </div>
      <div
        className={cx("deal-card", saved && (saved.ok ? "is-ok" : "is-bad"))}
        key={i}
      >
        <div className="tc-banner">
          {q.rc === null ? (
            <>
              <span className="eyebrow">Conteo real</span>
              <b className="num">{fmtSigned(q.tc)}</b>
            </>
          ) : (
            <>
              <span className="eyebrow">Corrido</span>
              <b className="num">{fmtSigned(q.rc)}</b>
              <span className="muted tiny">
                quedan {String(q.decks).replace(".", ",")}{" "}
                {q.decks === 1 ? "mazo" : "mazos"}
              </span>
            </>
          )}
        </div>
        <div className="deal-grid">
          <div className="deal-side">
            <div className="eyebrow">Crupier</div>
            <div className="card-row" style={{ marginTop: 14 }}>
              <PlayingCard card={q.spot.dealer} size="md" deal={true} />
              <PlayingCard
                card={q.spot.dealer}
                size="md"
                down={true}
                deal={true}
              />
            </div>
          </div>
          <div className="deal-divider" />
          <div className="deal-side">
            <div className="eyebrow">Tu mano</div>
            <div className="card-row hand-row" style={{ marginTop: 14 }}>
              {q.spot.cards.map((c) => (
                <PlayingCard card={c} size="md" deal={true} key={c.id} />
              ))}
            </div>
            <div className="hand-label">{handLabel(q.spot.cards)}</div>
          </div>
        </div>
      </div>
      {!saved ? (
        <div className="choose">
          <h3 className="choose-title">
            {ins ? "¿Tomás el seguro?" : "Elegí tu jugada"}
          </h3>
          {ins ? (
            <div className="ins-choices">
              <Button onClick={() => answer("I")}>Tomar el seguro</Button>
              <Button kind="secondary" onClick={() => answer("N")}>
                No tomar
              </Button>
            </div>
          ) : (
            <div className="action-grid">
              <ActionButton a="H" allowed={allowed} onClick={answer} />
              <ActionButton a="S" allowed={allowed} onClick={answer} />
              <ActionButton a="D" allowed={allowed} onClick={answer} />
              <ActionButton a="P" allowed={allowed} onClick={answer} />
              <ActionButton
                a="R"
                allowed={allowed}
                onClick={answer}
                wide={true}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="result-card fade-up">
          <div className="row">
            <span className={cx("res-icon", saved.ok ? "ok" : "bad")}>
              <Icon name={saved.ok ? "check" : "x"} size={22} stroke={3} />
            </span>
            <span className="grow">
              <b>{saved.ok ? "Bien" : `Era: ${ANSWER_NAMES[q.best]}`}</b>
              {!saved.ok ? (
                <span className="muted small" style={{ display: "block" }}>
                  Elegiste: {ANSWER_NAMES[saved.pick]}
                </span>
              ) : null}
            </span>
          </div>
          <p className="small" style={{ marginTop: 10 }}>
            <b>{devLabel(q.dev)}:</b> {ruleText(q.dev, rules)}
            {q.rc !== null
              ? ` Acá: ${fmtSigned(q.rc)} dividido ${String(q.decks).replace(".", ",")} ${q.decks === 1 ? "mazo" : "mazos"} da ${(q.rc / q.decks).toFixed(1).replace(".", ",").replace("-", "−")}, o sea ${fmtSigned(q.tc)} de conteo real.`
              : ""}
          </p>
          <div className="bottom-actions">
            <Button onClick={next}>
              {i + 1 < qs.length ? "Siguiente" : "Ver resultado"}
            </Button>
          </div>
        </div>
      )}
      <Modal open={exitOpen} onClose={() => setExitOpen(false)}>
        <h2 style={{ fontSize: 24 }}>¿Salir del nivel?</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          El intento no se cuenta. Podés empezarlo de nuevo cuando quieras.
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

export { DevLevel, DevPathCard };
