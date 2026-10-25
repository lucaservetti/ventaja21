// Repaso automático: vuelve a hacerte las preguntas de las lecciones que fallaste.
// Cada pregunta sale de la lista cuando la acertás dos veces en el repaso.
import { useEffect, useState } from "react";
import {
  dropReviewItem,
  getState,
  recordReviewAnswer,
  useStore,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { sfx, vibrate } from "../sound.js";
import { Button, Modal, Segments, cx } from "../ui/components.jsx";
import { getLesson } from "./content.js";
import { DecideStep, QuizStep, stepSig } from "./Lesson.jsx";
import { Scene, SceneActions } from "./scene.jsx";
import { weakSpots } from "../engine/skills.js";
import { spotTitle } from "../ui/common.jsx";
import { useNav } from "../nav.js";

const MAX_ITEMS = 10;

// Preguntas guardadas que siguen existiendo en las lecciones (si una lección cambió, la pregunta se descarta).
function reviewQueue(st) {
  const valid = [];
  const stale = [];
  for (const [key, item] of Object.entries(st.review.items)) {
    const lesson = getLesson(item.lesson);
    const step = lesson && lesson.steps ? lesson.steps[item.step] : null;
    if (!step || stepSig(step) !== item.sig) stale.push(key);
    else valid.push({ key, item, lesson, step });
  }
  valid.sort(
    (a, b) => a.item.due - b.item.due || b.item.misses - a.item.misses,
  );
  return { valid, stale };
}
function reviewCount(st) {
  return reviewQueue(st).valid.length;
}

function Review() {
  const st = useStore();
  const nav = useNav();
  const [queue] = useState(() =>
    reviewQueue(getState()).valid.slice(0, MAX_ITEMS),
  );
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  useEffect(() => {
    for (const key of reviewQueue(getState()).stale) dropReviewItem(key);
    const onBack = () => setExitOpen(true);
    window.addEventListener("v21-back", onBack);
    return () => window.removeEventListener("v21-back", onBack);
  }, []);

  const answer = (ok, pick) => {
    if (answers[i]) return;
    const { item, step } = queue[i];
    setAnswers({ ...answers, [i]: { ok, pick } });
    recordReviewAnswer(item.lesson, item.step, ok, stepSig(step), true);
  };
  const weak = weakSpots(st.train.cells, { limit: 3 });

  if (done || !queue.length) {
    const okCount = Object.values(answers).filter((a) => a.ok).length;
    const left = reviewCount(st);
    return (
      <div className="fade-up drill-result">
        <div className="topbar">
          <span style={{ width: 44 }} />
          <div
            className="grow center"
            style={{ fontWeight: 700, fontSize: 19 }}
          >
            Repaso
          </div>
          <span style={{ width: 44 }} />
        </div>
        <div className="center" style={{ marginTop: 10 }}>
          <span
            className={cx("res-icon big", "ok")}
            style={{ margin: "0 auto" }}
          >
            <Icon name="check" size={34} stroke={3} />
          </span>
          <h1 style={{ fontSize: 28, marginTop: 12 }}>
            {queue.length
              ? `${okCount} de ${queue.length} bien`
              : "Nada para repasar"}
          </h1>
          <p className="muted" style={{ marginTop: 8 }}>
            {queue.length
              ? left
                ? `Te ${left === 1 ? "queda 1 pregunta" : `quedan ${left} preguntas`} en la lista. Cada una sale cuando la acertás dos veces, en días distintos.`
                : "No te queda nada pendiente de las lecciones."
              : "Cuando falles una pregunta en una lección, va a aparecer acá para que la repases."}
          </p>
        </div>
        {weak.length ? (
          <div className="card" style={{ marginTop: 18 }}>
            <div className="eyebrow">Manos que más fallás en Entrenar</div>
            {weak.map((w) => (
              <div className="kv" style={{ alignItems: "center" }} key={w.key}>
                <span>
                  <span className="kv-k">{spotTitle(w.key)}</span>
                  <span className="muted small" style={{ display: "block" }}>
                    {Math.round(w.acc * 100)} % en tus últimos intentos
                  </span>
                </span>
                <Button
                  small={true}
                  kind="secondary"
                  onClick={() =>
                    nav.replace("trainSession", {
                      mode: "spot",
                      focus: w.key,
                      confirmExit: true,
                    })
                  }
                >
                  Practicar
                </Button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="btns" style={{ marginTop: 20 }}>
          <Button onClick={() => nav.pop()}>Listo</Button>
        </div>
      </div>
    );
  }

  const { lesson, step } = queue[i];
  const saved = answers[i];
  const isScene = step.t === "scene";
  const next = () => {
    if (i + 1 < queue.length) setI(i + 1);
    else {
      setDone(true);
      sfx.win();
    }
  };
  const states = queue.map((_, k) =>
    answers[k] ? (answers[k].ok ? "ok" : "miss") : k === i ? "cur" : "",
  );
  return (
    <div className="lesson review">
      <div className="lesson-top">
        <span className="review-tag">Repaso</span>
        <Segments total={queue.length} states={states} className="grow" />
        <button
          type="button"
          className="icon-btn sq"
          aria-label="Salir del repaso"
          onClick={() =>
            Object.keys(answers).length ? setExitOpen(true) : nav.pop()
          }
        >
          <Icon name="close" size={22} />
        </button>
      </div>
      <div className="eyebrow lesson-name">De la lección: {lesson.title}</div>
      <div className={cx("lesson-body", isScene && "is-scene")} key={i}>
        <QuestionBody step={step} saved={saved} onAnswer={answer} />
      </div>
      <div className="bottom-actions">
        <QuestionFooter
          step={step}
          saved={saved}
          onAnswer={answer}
          onNext={next}
          nextLabel={i + 1 < queue.length ? "Siguiente" : "Terminar"}
        />
      </div>
      <Modal open={exitOpen} onClose={() => setExitOpen(false)}>
        <h2 style={{ fontSize: 24 }}>¿Salir del repaso?</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          Lo que ya respondiste queda guardado.
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

// Una pregunta de lección suelta (repaso y examen para saltar): el cuerpo y los botones de abajo.
function QuestionBody({ step, saved, onAnswer }) {
  if (step.t === "quiz")
    return (
      <QuizStep
        step={step}
        saved={saved}
        onPicked={(pick, ok) => onAnswer(ok, pick)}
      />
    );
  if (step.t === "decide")
    return (
      <DecideStep
        step={step}
        saved={saved}
        onPicked={(pick, ok) => onAnswer(ok, pick)}
      />
    );
  return (
    <Scene
      step={step}
      picked={saved ? saved.pick : null}
      onPick={(pick) => {
        const ok = pick === step.ask.a;
        if (ok) sfx.good();
        else sfx.bad();
        vibrate(ok ? 10 : 30);
        onAnswer(ok, pick);
      }}
    />
  );
}
function QuestionFooter({ step, saved, onAnswer, onNext, nextLabel }) {
  if (step.t === "scene" && step.play && !saved)
    return (
      <SceneActions
        act={null}
        opts={step.play.opts || ["H", "S"]}
        surrender={!!(step.rules && step.rules.surrender)}
        onAct={(act) => {
          const ok = act === step.play.a;
          if (ok) sfx.good();
          else sfx.bad();
          vibrate(ok ? 10 : 30);
          onAnswer(ok, act);
        }}
      />
    );
  return (
    <Button kind="white" onClick={onNext} disabled={!saved}>
      {nextLabel}
    </Button>
  );
}

export { QuestionBody, QuestionFooter, Review, reviewCount };
