// "Saltar hasta acá": un examen con preguntas de todas las secciones anteriores.
// Si lo aprobás, esas lecciones quedan hechas y se abre la sección elegida.
import { useEffect, useState } from "react";
import { markActive, recordReviewAnswer, setState } from "../state.js";
import { Icon, SuitIcon } from "../ui/icons.jsx";
import { sfx } from "../sound.js";
import { Button, Modal, Segments, cx } from "../ui/components.jsx";
import { SECTIONS } from "./content.js";
import { reviewable, stepSig } from "./Lesson.jsx";
import { QuestionBody, QuestionFooter } from "./Review.jsx";
import { useNav } from "../nav.js";

const LIVES = 3;
const MAX_QUESTIONS = 15;

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Preguntas repartidas entre todas las lecciones anteriores: primero una por lección, después más si faltan.
function buildTest(sectionId) {
  const lessons = SECTIONS.filter((s) => s.id < sectionId)
    .flatMap((s) => s.lessons)
    .filter((l) => !l.exam);
  const pools = lessons
    .map((lesson) => ({
      lesson,
      steps: shuffle(
        lesson.steps
          .map((step, index) => ({ step, index }))
          .filter(({ step }) => reviewable(step)),
      ),
    }))
    .filter((p) => p.steps.length);
  const total = Math.min(MAX_QUESTIONS, Math.max(8, pools.length * 2));
  const picked = [];
  const order = shuffle(pools);
  for (let round = 0; picked.length < total && round < 4; round++)
    for (const p of order) {
      if (picked.length >= total) break;
      const next = p.steps[round];
      if (next) picked.push({ lesson: p.lesson, ...next });
    }
  // En el orden de las lecciones, así va de lo más básico a lo más difícil.
  const pos = new Map(lessons.map((l, i) => [l.id, i]));
  return picked.sort(
    (a, b) => pos.get(a.lesson.id) - pos.get(b.lesson.id) || a.index - b.index,
  );
}

function passTest(sectionId) {
  setState((st) => {
    const lessons = { ...st.lessons };
    for (const sec of SECTIONS)
      if (sec.id < sectionId)
        for (const l of sec.lessons) {
          if (l.exam) continue;
          if (!lessons[l.id] || !lessons[l.id].done)
            lessons[l.id] = { done: true, viaTest: true, at: Date.now() };
        }
    return markActive({ ...st, lessons });
  });
}

function JumpTest({ section: sectionId }) {
  const nav = useNav();
  const section = SECTIONS.find((s) => s.id === sectionId);
  const [phase, setPhase] = useState("intro");
  const [queue] = useState(() => buildTest(sectionId));
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [exitOpen, setExitOpen] = useState(false);
  const misses = Object.values(answers).filter((a) => !a.ok).length;
  const lives = LIVES - misses;
  useEffect(() => {
    const onBack = () => (phase === "run" ? setExitOpen(true) : nav.pop());
    window.addEventListener("v21-back", onBack);
    return () => window.removeEventListener("v21-back", onBack);
  }, [phase]);

  if (phase === "intro") {
    const prev = SECTIONS.filter((s) => s.id < sectionId);
    return (
      <div className="jump fade-up">
        <div className="lesson-top">
          <button
            type="button"
            className="icon-btn sq"
            aria-label="Volver"
            onClick={() => nav.pop()}
          >
            <Icon name="back" size={22} />
          </button>
          <div className="grow" />
        </div>
        <div className="eyebrow acc" style={{ marginTop: 18 }}>
          Saltar a la sección {sectionId}
        </div>
        <h1 className="jump-title">{section.title}</h1>
        <p className="muted jump-lead">
          Un examen de lo que viene antes: {queue.length} preguntas de{" "}
          {prev.length === 1
            ? "la sección 1"
            : `las secciones 1 a ${prev.length}`}
          . Si lo aprobás, esas lecciones quedan hechas y arrancás directo acá.
        </p>
        <div className="card jump-rules">
          <div className="jump-lives" aria-label={`${LIVES} vidas`}>
            {Array.from({ length: LIVES }, (_, k) => (
              <SuitIcon s="h" size={26} className="life" key={k} />
            ))}
          </div>
          <p>
            Tenés <b>{LIVES} vidas</b>: cada error te saca una. Si te equivocás
            una cuarta vez, el examen termina y te conviene hacer las lecciones.
          </p>
        </div>
        <div className="jump-secs">
          {prev.map((s) => (
            <div className="jump-sec" key={s.id}>
              <span className="how-n">{s.id}</span>
              <span>{s.title}</span>
            </div>
          ))}
        </div>
        <div className="bottom-actions">
          <Button onClick={() => setPhase("run")}>Empezar el examen</Button>
          <Button kind="ghost" onClick={() => nav.pop()}>
            Mejor hago las lecciones
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const passed = misses <= LIVES;
    const missedLessons = [
      ...new Map(
        queue
          .filter((_, k) => answers[k] && !answers[k].ok)
          .map((q) => [q.lesson.id, q.lesson]),
      ).values(),
    ];
    const answered = Object.keys(answers).length;
    const ok = answered - misses;
    return (
      <div className="jump fade-up drill-result">
        <div className="center" style={{ marginTop: 30 }}>
          <span
            className={cx("res-icon big", passed ? "ok" : "bad")}
            style={{ margin: "0 auto" }}
          >
            <Icon name={passed ? "trophy" : "refresh"} size={34} stroke={2.4} />
          </span>
          <h1 style={{ fontSize: 30, marginTop: 14 }}>
            {passed ? "¡Aprobaste!" : "Todavía no"}
          </h1>
          <p className="muted" style={{ marginTop: 8 }}>
            {ok} de {answered} bien.{" "}
            {passed
              ? `Desbloqueaste la sección ${sectionId}: ${section.title}.`
              : "Te quedaste sin vidas antes de terminar."}
          </p>
        </div>
        {missedLessons.length ? (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="eyebrow">
              {passed ? "Para repasar" : "Lo que te faltó"}
            </div>
            {missedLessons.map((l) => (
              <div className="kv" key={l.id}>
                <span className="kv-k">{l.title}</span>
              </div>
            ))}
            <p className="muted small" style={{ marginTop: 10 }}>
              {passed
                ? "Las preguntas que fallaste quedaron en tu Repaso."
                : "Hacé esas lecciones y volvé a intentarlo cuando quieras."}
            </p>
          </div>
        ) : null}
        <div className="btns" style={{ marginTop: 22 }}>
          <Button onClick={() => nav.pop()}>
            {passed ? `Ir a la sección ${sectionId}` : "Volver a Aprender"}
          </Button>
        </div>
      </div>
    );
  }

  const { lesson, step } = queue[i];
  const saved = answers[i];
  const isScene = step.t === "scene";
  const answer = (ok, pick) => {
    if (answers[i]) return;
    setAnswers({ ...answers, [i]: { ok, pick } });
    if (!ok)
      recordReviewAnswer(lesson.id, queue[i].index, false, stepSig(step));
  };
  const finish = (passed) => {
    if (passed) {
      passTest(sectionId);
      sfx.win();
    }
    setPhase("done");
  };
  const next = () => {
    if (misses > LIVES) return finish(false);
    if (i + 1 < queue.length) setI(i + 1);
    else finish(true);
  };
  const states = queue.map((_, k) =>
    answers[k] ? (answers[k].ok ? "ok" : "miss") : k === i ? "cur" : "",
  );
  return (
    <div className="lesson review jump-run">
      <div className="lesson-top">
        <button
          type="button"
          className="icon-btn sq"
          aria-label="Salir del examen"
          onClick={() => setExitOpen(true)}
        >
          <Icon name="close" size={22} />
        </button>
        <Segments total={queue.length} states={states} className="grow" />
        <span
          className="jump-lives small"
          aria-label={`Vidas: ${Math.max(0, lives)}`}
        >
          {Array.from({ length: LIVES }, (_, k) => (
            <SuitIcon
              s="h"
              size={18}
              className={cx("life", k >= lives && "lost")}
              key={k}
            />
          ))}
        </span>
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
          nextLabel={
            saved && misses > LIVES
              ? "Ver resultado"
              : i + 1 < queue.length
                ? "Siguiente"
                : "Terminar"
          }
        />
      </div>
      <Modal open={exitOpen} onClose={() => setExitOpen(false)}>
        <h2 style={{ fontSize: 24 }}>¿Dejar el examen?</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          No se guarda nada: podés volver a rendirlo cuando quieras.
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

export { JumpTest };
