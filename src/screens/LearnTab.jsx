import { useState } from "react";
import { setSettings, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { IconButton, Toasts, cx } from "../ui/components.jsx";
import { PageHeader } from "../ui/common.jsx";
import {
  LESSONS,
  SECTIONS,
  lessonMinutes,
  openLesson,
} from "../lessons/content.js";
import { useNav } from "../nav.js";
import { GoalBadge } from "./goal.jsx";
import { reviewCount } from "../lessons/Review.jsx";
import { hasPremium } from "../platform.js";

// Para que se sepa que existe Premium, sin insistir: aparece desde el segundo día y con 3 lecciones
// hechas, y si la cerrás no vuelve por 2 semanas.
const PREM_CARD_PAUSE = 14 * 24 * 60 * 60 * 1000;
function PremiumCard({ st, lessonsDone }) {
  const nav = useNav();
  const now = Date.now();
  const created = st.profile.createdAt || now;
  if (
    hasPremium(st) ||
    lessonsDone < 3 ||
    now - created < 24 * 60 * 60 * 1000 ||
    (st.settings.premCardHidden || 0) > now
  )
    return null;
  return (
    <div className="card prem-card">
      <button
        type="button"
        className="prem-card-main"
        onClick={() => nav.push("premium")}
      >
        <span className="li-icon">
          <Icon name="crown" />
        </span>
        <span className="li-text">
          <span className="eyebrow acc">Edge 21 Premium</span>
          <span className="li-title" style={{ display: "block", marginTop: 2 }}>
            Modo casino real, las 10 desviaciones y sin anuncios
          </span>
          <span className="li-sub" style={{ display: "block" }}>
            Probá cada función gratis 30 minutos
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <IconButton
        icon="close"
        label="Ocultar por ahora"
        className="prem-card-x"
        onClick={() => setSettings({ premCardHidden: now + PREM_CARD_PAUSE })}
      />
    </div>
  );
}

// Después de las lecciones (o cuando hay preguntas falladas): repaso, práctica de casino y examen final.
function NextStepsCard({ st, done }) {
  const nav = useNav();
  const pending = reviewCount(st);
  const core = SECTIONS.filter((sec) => sec.id <= 5).flatMap(
    (sec) => sec.lessons,
  );
  const coreDone = core.every((l) => done(l.id));
  const casino = SECTIONS.find((sec) => sec.id === 6);
  const casinoLessons = casino ? casino.lessons.filter((l) => !l.exam) : [];
  const casinoDone = casinoLessons.filter((l) => done(l.id)).length;
  const exam = casino ? casino.lessons.find((l) => l.exam) : null;
  const examPassed = !!st.finalExam.passed;
  if (!coreDone) {
    if (!pending) return null;
    return (
      <button
        type="button"
        className="card list-item review-card"
        onClick={() => nav.push("review", { confirmExit: true })}
      >
        <span className="li-icon">
          <Icon name="refresh" />
        </span>
        <span className="li-text">
          <span className="li-title" style={{ fontSize: 17 }}>
            Repaso
          </span>
          <span className="li-sub" style={{ display: "block" }}>
            {pending === 1
              ? "1 pregunta que fallaste"
              : `${pending} preguntas que fallaste`}
          </span>
        </span>
        <span className="pstep-go">Repasar</span>
      </button>
    );
  }
  const nextCasino = casinoLessons.find((l) => !done(l.id));
  return (
    <div className="card next-steps">
      <div className="eyebrow acc">Terminaste las lecciones</div>
      <h2 className="next-steps-title">¿Y ahora?</h2>
      <button
        type="button"
        className="next-step"
        onClick={() => nav.push("review", { confirmExit: true })}
        disabled={!pending}
      >
        <span className="li-icon">
          <Icon name="refresh" />
        </span>
        <span className="li-text">
          <span className="li-title">Repaso de lo que fallaste</span>
          <span className="li-sub">
            {pending
              ? pending === 1
                ? "1 pregunta pendiente"
                : `${pending} preguntas pendientes`
              : "Nada pendiente: vas al día"}
          </span>
        </span>
        {pending ? (
          <Icon name="chev" className="li-chev" />
        ) : (
          <Icon name="check" className="good" />
        )}
      </button>
      {casino ? (
        <button
          type="button"
          className="next-step"
          onClick={() => openLesson(nav, nextCasino || casinoLessons[0])}
        >
          <span className="li-icon">
            <Icon name="target" />
          </span>
          <span className="li-text">
            <span className="li-title">Sección 6: práctica de casino</span>
            <span className="li-sub">
              {casinoDone} de {casinoLessons.length} lecciones · elegir mesa,
              contar una mesa llena, apostar
            </span>
          </span>
          <Icon name="chev" className="li-chev" />
        </button>
      ) : null}
      {exam ? (
        <button
          type="button"
          className="next-step"
          onClick={() => openLesson(nav, exam)}
        >
          <span className="li-icon">
            <Icon name="trophy" />
          </span>
          <span className="li-text">
            <span className="li-title">Examen final</span>
            <span className="li-sub">
              {examPassed
                ? "Aprobado. Podés rendirlo otra vez cuando quieras."
                : "Un zapato entero jugando bien, contando y apostando según el conteo"}
            </span>
          </span>
          {examPassed ? (
            <Icon name="check" className="good" />
          ) : (
            <Icon name="chev" className="li-chev" />
          )}
        </button>
      ) : null}
    </div>
  );
}

function lessonProgress(a) {
  let e = (s) => !!(a.lessons[s] && a.lessons[s].done),
    t = LESSONS.find((s) => !e(s.id));
  return { done: e, currentId: t ? t.id : null };
}
function LearnTab() {
  let a = useStore(),
    e = useNav(),
    { done: t, currentId: s } = lessonProgress(a),
    n = LESSONS.length,
    l = LESSONS.filter((r) => t(r.id)).length,
    [i, o] = useState(null),
    c = (r, u) => {
      if (!u) {
        o({
          id: Date.now(),
          msg: "Completá la lección anterior para desbloquear esta.",
          kind: "info",
        });
        setTimeout(() => o(null), 2200);
        return;
      }
      openLesson(e, r);
    };
  return (
    <div className="fade-up learn">
      <PageHeader
        title="Aprender"
        sub={`${l} de ${n} lecciones`}
        actions={
          <>
            <IconButton
              icon="grid"
              label="Tu tabla de estrategia"
              onClick={() => e.push("myChart")}
            />
            <IconButton
              icon="book"
              label="Abrir la Guía"
              onClick={() => e.push("guide")}
            />
            <GoalBadge />
          </>
        }
      />
      <NextStepsCard st={a} done={t} />
      <PremiumCard st={a} lessonsDone={l} />
      <div className="learn-progress">
        {SECTIONS.map((r) => {
          let u = r.lessons.filter((d) => t(d.id)).length;
          return (
            <span
              style={{ flex: r.lessons.length }}
              className="lp-seg"
              key={r.id}
            >
              <i style={{ width: `${(u / r.lessons.length) * 100}%` }} />
            </span>
          );
        })}
      </div>
      {SECTIONS.map((r) => (
        <SectionPath
          section={r}
          st={a}
          done={t}
          currentId={s}
          onOpen={c}
          key={r.id}
        />
      ))}
      <div style={{ height: 30 }} />
      <Toasts items={i ? [i] : []} />
    </div>
  );
}
// Cada sección es un cartel de mesa y sus lecciones, fichas de casino sobre un camino que serpentea:
// doradas las terminadas, grande y brillando la que sigue, apagadas las bloqueadas. Las secciones
// terminadas se achican a una fila (se pueden volver a abrir).
const ROW = 88; // alto de cada parada del camino
const TRAIL_W = 132; // ancho de la franja del camino (el texto va a la derecha)
function trailX(i, sec) {
  return 64 + 30 * Math.sin(i * 1.2 + sec * 0.9);
}
function trailPath(xs, from = 0, to = xs.length - 1) {
  let d = "";
  for (let i = from; i <= to; i++) {
    const y = i * ROW + ROW / 2;
    if (i === from) d += `M${xs[i].toFixed(1)} ${y}`;
    else {
      const py = y - ROW;
      d += ` C${xs[i - 1].toFixed(1)} ${py + ROW / 2} ${xs[i].toFixed(1)} ${y - ROW / 2} ${xs[i].toFixed(1)} ${y}`;
    }
  }
  return d;
}
function SectionPath({ section: a, st: e, done: t, currentId: s, onOpen: n }) {
  const o = a.lessons,
    c = o.filter((k) => t(k.id)).length,
    r = o.some((k) => k.id === s),
    u = e.settings.unlockAll,
    d = (k) => LESSONS.findIndex((v) => v.id === k),
    p = s ? d(s) : LESSONS.length,
    nav = useNav(),
    locked = !u && a.id > 1 && d(o[0].id) > p,
    full = c === o.length;
  const [open, setOpen] = useState(false);
  if (full && !open)
    return (
      <div className="section-block">
        <button
          type="button"
          className="sec-done"
          onClick={() => setOpen(true)}
          aria-expanded={false}
        >
          <span className="node node-done node-s" aria-hidden="true">
            <span className="node-face">
              <Icon name="check" size={18} stroke={3} />
            </span>
          </span>
          <span className="grow">
            <span className="eyebrow acc">Sección {a.id} · completa</span>
            <b className="sec-done-title">{a.title}</b>
          </span>
          <span className="muted small num">
            {c}/{o.length}
          </span>
          <Icon name="chev" className="sec-done-chev" />
        </button>
      </div>
    );
  // Puntos del camino: una ficha por lección y, al final, el trofeo de la sección.
  const xs = [...o.map((_, v) => trailX(v, a.id)), trailX(o.length, a.id)];
  let lead = 0;
  while (lead < o.length && t(o[lead].id)) lead++;
  const goldTo = full ? o.length : lead;
  return (
    <div className="section-block">
      <div className={cx("placard", r && "current", full && "full")}>
        <span className="placard-chip num">{a.id}</span>
        <div className="grow">
          <div className="sec-top">
            <div className={cx("eyebrow", r && "acc")}>Sección {a.id}</div>
            <div className="sec-count num">
              <b>{c}</b> de {o.length}
            </div>
          </div>
          <h2 className="sec-title">{a.title}</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            {a.desc}
          </p>
          <div className="placard-bar">
            <i style={{ width: `${(c / o.length) * 100}%` }} />
          </div>
          {locked ? (
            <button
              type="button"
              className="jump-btn"
              onClick={() =>
                nav.push("jumpTest", { section: a.id, confirmExit: true })
              }
            >
              <Icon name="bolt" size={16} />
              Saltar hasta acá
            </button>
          ) : null}
          {full ? (
            <button
              type="button"
              className="link small sec-fold"
              onClick={() => setOpen(false)}
            >
              Achicar
            </button>
          ) : null}
        </div>
      </div>
      <div className="trail" style={{ height: xs.length * ROW }}>
        <svg
          className="trail-line"
          width={TRAIL_W}
          height={xs.length * ROW}
          aria-hidden="true"
        >
          <path className="trail-rest" d={trailPath(xs)} />
          {goldTo > 0 ? (
            <path className="trail-gold" d={trailPath(xs, 0, goldTo)} />
          ) : null}
        </svg>
        <ol className="rail">
          {o.map((k, v) => {
            const b = t(k.id),
              S = k.id === s,
              D = d(k.id),
              _ = u || b || D <= p,
              M = e.lessons[k.id] && e.lessons[k.id].viaTest,
              R = S ? "cur" : b ? "done" : _ ? "open" : "locked";
            return (
              <li
                className={cx("rail-row", `rr-${R}`)}
                style={{ "--i": v, "--x": `${xs[v]}px` }}
                key={k.id}
              >
                <button
                  type="button"
                  className="rail-btn"
                  onClick={() => n(k, _)}
                  aria-label={`Lección ${D + 1}: ${k.title}${b ? ", completa" : _ ? "" : ", bloqueada"}`}
                >
                  <span className={cx("node", `node-${R}`)} aria-hidden="true">
                    <span className="node-face">
                      {S ? (
                        <Icon name="play" size={24} stroke={2.4} />
                      ) : b ? (
                        <Icon name="check" size={20} stroke={3} />
                      ) : k.exam ? (
                        <Icon name="trophy" size={20} />
                      ) : (
                        <span className="num">{D + 1}</span>
                      )}
                    </span>
                  </span>
                  <span className="rail-text">
                    <b>{k.title}</b>
                    <span className="muted small">
                      {R === "locked" ? (
                        <Icon name="lock" size={12} className="rail-lock" />
                      ) : null}
                      {M ? "Superada en el test" : `${lessonMinutes(k)} min`}
                      {b && e.lessons[k.id].best !== undefined && !M
                        ? ` · ${Math.round(e.lessons[k.id].best * 100)} %`
                        : ""}
                    </span>
                    {S ? (
                      <span className="rail-go">
                        {e.lessons[k.id] ? "Repetir" : "Empezar"}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div
          className={cx("rail-end", full && "full")}
          style={{ "--x": `${xs[o.length]}px`, "--i": o.length }}
        >
          <span
            className={cx("node node-s", full ? "node-done" : "node-locked")}
          >
            <span className="node-face">
              <Icon name="trophy" size={18} />
            </span>
          </span>
          <span className={cx("num end-label", full ? "acc" : "muted")}>
            {full
              ? `Sección ${a.id} completa`
              : `${c} de ${o.length} lecciones`}
          </span>
        </div>
      </div>
    </div>
  );
}
export { LearnTab };
