import { useState } from "react";
import { levelFor, nextLevel, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { ProgressBar, Sheet, cx } from "../ui/components.jsx";
import { SKILLS } from "../engine/trainer.js";
import {
  InfoDot,
  MiniCards,
  RatingBadge,
  SettingsButton,
  StreakBadge,
  pct,
  useRules,
} from "../ui/common.jsx";
import { skillGrade, skillStats } from "../engine/skills.js";
import { useNav } from "../nav.js";

const SKILL_SUITS = {
  stiff: ["s", "h"],
  soft: ["s", "h"],
  pairs: ["s", "d"],
  doubles: ["h", "s"],
  surrender: ["c", "h"],
  count: ["s", "d"],
};
function TrainTab() {
  let a = useStore(),
    e = useNav(),
    t = useRules(),
    [s, n] = useState(null),
    l = a.train.sessions.filter((u) => u.kind !== "exam"),
    i = l.length === 0,
    o = levelFor(a.rating.value),
    c = nextLevel(a.rating.value),
    r = (u, d) =>
      e.push("trainSession", { mode: u, focus: d, confirmExit: true });
  return (
    <div className="fade-up">
      <div className="page-head" style={{ alignItems: "center" }}>
        <h1 style={{ fontSize: 34 }}>Entrenar</h1>
        <div className="page-head-right">
          <StreakBadge />
          <RatingBadge />
          <SettingsButton />
        </div>
      </div>
      {i ? (
        <button
          type="button"
          className="card list-item hero-set"
          onClick={() => r("level")}
        >
          <span className="felt-icon">
            <MiniCards ranks={["10", "6"]} suits={["s", "d"]} />
          </span>
          <span className="li-text">
            <span className="eyebrow">Tu primera tanda</span>
            <span
              className="li-title"
              style={{ display: "block", fontSize: 22, marginTop: 2 }}
            >
              Encontrá tu nivel
            </span>
            <span className="li-sub">Diez manos mezcladas. Sin reloj.</span>
          </span>
        </button>
      ) : (
        <div className="card level-card">
          <div className="row between">
            <div>
              <div className="eyebrow">Tu nivel</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>
                {o.name}
              </div>
              <div className="muted small">{o.note}</div>
            </div>
            <div className="center">
              <div className="mid-num" style={{ fontSize: 40 }}>
                {a.rating.value}
              </div>
              <div className="muted tiny">puntaje</div>
            </div>
          </div>
          {c ? (
            <div style={{ marginTop: 14 }}>
              <ProgressBar value={(a.rating.value - (c.min - 150)) / 150} />
              <div className="muted tiny" style={{ marginTop: 6 }}>
                {c.min - a.rating.value}
                {" puntos para "}
                <b style={{ color: "var(--text)" }}>{c.name}</b>
              </div>
            </div>
          ) : null}
        </div>
      )}
      {l.length < 3 ? (
        <>
          <hr className="hr" />
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Cómo funciona</h2>
          <ol className="how">
            <li>
              <span className="how-n">1</span>
              <span>
                <b>Jugá la mano</b>
                <span className="muted">
                  Pedir, plantarte, doblar o separar. Tomate tu tiempo.
                </span>
              </span>
            </li>
            <li>
              <span className="how-n">2</span>
              <span>
                <b>Entendé por qué</b>
                <span className="muted">
                  Cada respuesta trae la jugada correcta y la razón en una nota.
                </span>
              </span>
            </li>
            <li>
              <span className="how-n">3</span>
              <span>
                <b>Recibí tus próximas diez</b>
                <span className="muted">
                  La siguiente tanda insiste en las manos que fallaste, así
                  practicás donde importa.
                </span>
              </span>
            </li>
          </ol>
        </>
      ) : null}
      <div className="section-title">
        <h2>
          Habilidades
          <InfoDot onClick={() => n("skills")} />
        </h2>
        <span className="side">10 manos por tanda</span>
      </div>
      <div className="list">
        {SKILLS.filter((u) => u.id !== "surrender" || t.surrender || true).map(
          (u) => {
            let d = skillStats(a.train.cells, u.id, t),
              p = skillGrade(d.acc);
            return (
              <button
                type="button"
                className="list-item skill-item"
                onClick={() => r(u.id === "count" ? "count" : "skill", u.id)}
                key={u.id}
              >
                <MiniCards ranks={u.icon} suits={SKILL_SUITS[u.id]} />
                <span className="li-text">
                  <span className="li-title">{u.name}</span>
                  <span className="li-sub" style={{ display: "block" }}>
                    {u.sub}
                  </span>
                  <span className="skill-meter">
                    <ProgressBar
                      value={d.acc === null ? 0 : d.coverage * 0.4 + d.acc * 0.6}
                      tone={p.tone}
                      className="skill-bar"
                    />
                    <span className={cx("skill-grade", p.tone && `t-${p.tone}`)}>
                      {d.acc === null ? p.label : `${pct(d.acc)} · ${p.label}`}
                    </span>
                  </span>
                </span>
                <Icon name="chev" className="li-chev" />
              </button>
            );
          },
        )}
      </div>
      <div className="section-title">
        <h2>Ponete a prueba</h2>
      </div>
      <div className="list">
        <button
          type="button"
          className="list-item"
          onClick={() =>
            e.push("trainSession", { mode: "exam", confirmExit: true })
          }
        >
          <span className="li-icon">
            <Icon name="trophy" />
          </span>
          <span className="li-text">
            <span className="li-title">Examen de nivel</span>
            <span className="li-sub" style={{ display: "block" }}>
              25 manos sin pistas ni notas. Ves el resultado al final.
            </span>
          </span>
          <span className="li-side">
            {a.train.exams.length
              ? pct(Math.max(...a.train.exams.map((u) => u.ok / u.n)))
              : ""}
          </span>
          <Icon name="chev" className="li-chev" />
        </button>
        <button
          type="button"
          className="list-item"
          onClick={() => e.openSheet("chartView")}
        >
          <span className="li-icon">
            <Icon name="grid" />
          </span>
          <span className="li-text">
            <span className="li-title">Tabla de estrategia</span>
            <span className="li-sub" style={{ display: "block" }}>
              Según las reglas de tu mesa
            </span>
          </span>
          <Icon name="chev" className="li-chev" />
        </button>
      </div>
      <div className="section-title">
        <h2>
          Tandas recientes
          <InfoDot onClick={() => n("recent")} />
        </h2>
      </div>
      {l.length ? (
        <div className="list">
          {l
            .slice(-4)
            .reverse()
            .map((u, d) => (
              <div className="list-item" key={d}>
                <span
                  className={cx(
                    "score-pill",
                    u.ok / u.n >= 0.9
                      ? "good"
                      : u.ok / u.n >= 0.7
                        ? "mid"
                        : "bad",
                  )}
                >
                  <b className="num">{Math.round((u.ok / u.n) * 100)}</b>
                  <span>% bien</span>
                </span>
                <span className="li-text">
                  <span className="li-title">{u.title}</span>
                  <span className="li-sub num" style={{ display: "block" }}>
                    {shortDate(u.t)}
                    {" · "}
                    {u.ok}/{u.n}
                    {" correctas · "}
                    {u.after - u.before >= 0 ? "+" : "−"}
                    {Math.abs(u.after - u.before)}
                    {" puntaje"}
                  </span>
                </span>
              </div>
            ))}
        </div>
      ) : (
        <div className="card flat center muted" style={{ padding: 28 }}>
          <Icon name="layers" size={34} />
          <p style={{ marginTop: 8 }}>Tus tandas van a aparecer acá.</p>
        </div>
      )}
      <div className="cta-spacer" />
      <div className="float-cta">
        <button
          type="button"
          className="cta-bar"
          onClick={() => r(i ? "level" : "mixed")}
        >
          <span className="cta-play">
            <Icon name="play" size={26} />
          </span>
          <span className="cta-text">
            <span className="cta-title" style={{ display: "block" }}>
              Repartir 10 manos
            </span>
            <span className="cta-sub">
              {i
                ? "Encontrá tu nivel inicial"
                : "Apuntadas a tus puntos débiles"}
            </span>
          </span>
          <span className="cta-arrow">
            <Icon name="arrow" size={24} />
          </span>
        </button>
      </div>
      <Sheet open={s === "skills"} onClose={() => n(null)} title="Habilidades">
        <p className="muted" style={{ marginBottom: 12 }}>
          Cada habilidad agrupa un tipo de mano. El porcentaje es tu precisión
          en las últimas veces que te tocó cada situación, y la barra combina
          precisión y cuántas situaciones ya viste.
        </p>
        <p className="muted">
          <b style={{ color: "var(--text)" }}>Fuerte</b>
          {": 90 % o más. "}
          <b style={{ color: "var(--text)" }}>Bien</b>
          {": de 70 a 89 %. "}
          <b style={{ color: "var(--text)" }}>A mejorar</b>: menos de 70 %.
        </p>
        <p className="muted" style={{ marginTop: 12 }}>
          Las tandas usan las reglas de tu mesa ({t.decks}
          {" mazos, "}
          {t.h17 ? "H17" : "S17"}
          {t.surrender ? ", con rendición" : ""}). Las cambiás en Ajustes. La
          tanda de Rendición siempre usa una mesa con rendición.
        </p>
      </Sheet>
      <Sheet
        open={s === "recent"}
        onClose={() => n(null)}
        title="Tandas recientes"
      >
        <p className="muted">
          Cada tanda de 10 manos mueve tu puntaje. Acertar situaciones difíciles
          suma más; fallar las fáciles resta más. Las manos que fallás vuelven
          más seguido en las próximas tandas hasta que las domines.
        </p>
      </Sheet>
    </div>
  );
}
function shortDate(a) {
  let e = new Date(a),
    t = [
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ];
  return `${e.getDate()} ${t[e.getMonth()]}`;
}
export { TrainTab, shortDate };
