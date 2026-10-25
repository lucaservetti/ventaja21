import { useMemo, useState } from "react";
import { useStore } from "../state.js";
import { Icon, SuitIcon } from "../ui/icons.jsx";
import { IconButton, Toasts, cx, useWidth } from "../ui/components.jsx";
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
function SectionIcon({ icon: a, on: e }) {
  return a.length > 1 ? (
    <Icon name={a} size={28} className={e ? "acc" : "dim"} />
  ) : (
    <SuitIcon s={a} size={30} className={e ? "acc" : "dim"} />
  );
}
function SectionPath({ section: a, st: e, done: t, currentId: s, onOpen: n }) {
  let [l, i] = useWidth(),
    o = a.lessons,
    c = o.filter((k) => t(k.id)).length,
    r = o.some((k) => k.id === s),
    u = e.settings.unlockAll,
    d = (k) => LESSONS.findIndex((v) => v.id === k),
    p = s ? d(s) : LESSONS.length,
    nav = useNav(),
    locked = !u && a.id > 1 && d(o[0].id) > p,
    f = 84,
    y = useMemo(() => {
      let k = Math.max(300, i || 340),
        v = 12 + f / 2,
        m = [],
        b = 70;
      o.forEach((D, _) => {
        let M = _ === 0 ? "center" : _ % 2 === 1 ? "left" : "right",
          R = M === "center" ? k / 2 : M === "left" ? v : k - v;
        m.push({ x: R, y: b, kind: M });
        b += M === "center" ? 200 : 150;
      });
      let S = b - 40;
      return { W: k, pts: m, endY: S, H: S + 110 };
    }, [i, o.length]),
    C = useMemo(() => {
      let { pts: k, endY: v, W: m } = y,
        b = "",
        S = [...k, { x: m / 2, y: v }];
      for (let D = 0; D < S.length - 1; D++) {
        let _ = S[D],
          M = S[D + 1],
          R = (_.y + M.y) / 2;
        b += `M${_.x},${_.y} C${_.x},${R} ${M.x},${R} ${M.x},${M.y} `;
      }
      return b;
    }, [y]);
  return (
    <div className="section-block">
      <div className={cx("card section-card", r && "current")}>
        <span className="sec-icon">
          <SectionIcon icon={a.icon} on={r || c === o.length} />
        </span>
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
        </div>
      </div>
      <div className="path" ref={l} style={{ height: y.H }}>
        <svg className="path-svg" width={y.W} height={y.H} aria-hidden="true">
          <path
            d={C}
            fill="none"
            stroke="#3a3a42"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="0.1 16"
          />
        </svg>
        {o.map((k, v) => {
          let m = y.pts[v],
            b = t(k.id),
            S = k.id === s,
            D = d(k.id),
            _ = u || b || D <= p,
            M = e.lessons[k.id] && e.lessons[k.id].viaTest,
            R = S ? "cur" : b ? "done" : _ ? "open" : "locked";
          return (
            <div
              className={cx("node-wrap", `nk-${m.kind}`)}
              style={{ left: m.x, top: m.y }}
              key={k.id}
            >
              {S ? (
                <span className="node-bubble">
                  {e.lessons[k.id] ? "REPETIR" : "EMPEZAR"}
                </span>
              ) : null}
              <button
                type="button"
                className={cx("node", `node-${R}`)}
                onClick={() => n(k, _)}
                aria-label={`Lección ${D + 1}: ${k.title}${b ? ", completa" : _ ? "" : ", bloqueada"}`}
              >
                <span className="node-side" />
                <span className="node-top">
                  {S ? (
                    <Icon name="play" size={34} stroke={2.4} />
                  ) : b ? (
                    <Icon name="check" size={32} stroke={3} />
                  ) : k.exam ? (
                    <Icon name="trophy" size={30} />
                  ) : (
                    <span className="node-num num">{D + 1}</span>
                  )}
                </span>
              </button>
              <div
                className={cx("node-label", `nl-${m.kind}`)}
                onClick={() => n(k, _)}
              >
                <b className={cx(R === "locked" && "dim2")}>{k.title}</b>
                <span className="muted">
                  {M ? "Superada en el test" : `${lessonMinutes(k)} min`}
                  {b && e.lessons[k.id].best !== undefined && !M
                    ? ` · ${Math.round(e.lessons[k.id].best * 100)} %`
                    : ""}
                </span>
              </div>
            </div>
          );
        })}
        <div className="path-end" style={{ top: y.endY }}>
          <span className={cx("end-slot", c === o.length && "full")}>
            <Icon name="trophy" size={28} />
          </span>
          <span
            className={cx("num end-label", c === o.length ? "acc" : "muted")}
          >
            {c === o.length
              ? `Sección ${a.id} completa`
              : `${c} de ${o.length} lecciones`}
          </span>
        </div>
      </div>
    </div>
  );
}
export { LearnTab };
