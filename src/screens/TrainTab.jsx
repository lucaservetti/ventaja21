import { useState } from "react";
import { levelFor, nextLevel, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { ProgressBar, Sheet, cx } from "../ui/components.jsx";
import { SKILLS } from "../engine/trainer.js";
import {
  InfoDot,
  MiniCards,
  PageHeader,
  PrimeraVez,
  SettingsButton,
  pct,
  useRules,
} from "../ui/common.jsx";
import { skillGrade, skillStats } from "../engine/skills.js";
import { ChartCards } from "./chartCards.jsx";
import { DevPathCard } from "./DevPath.jsx";
import { useNav } from "../nav.js";
import { GoalBadge } from "./goal.jsx";
import { ProfileChips } from "./profile.jsx";
import { sabeContar } from "../lessons/content.js";

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
    [verDev, setVerDev] = useState(false),
    l = a.train.sessions.filter((u) => u.kind !== "exam"),
    i = l.length === 0,
    o = levelFor(a.rating.value),
    c = nextLevel(a.rating.value),
    r = (u, d) =>
      e.push("trainSession", { mode: u, focus: d, confirmExit: true });
  return (
    <div className="fade-up">
      <PageHeader
        title="Entrenar"
        sub="La jugada correcta en cada mano"
        actions={
          <>
            <GoalBadge />
            <SettingsButton />
          </>
        }
      />
      <PrimeraVez id="entrenar">
        Aquí practicas la jugada correcta: tandas de 10 manos. Las que fallas
        vuelven hasta que las aciertas.
      </PrimeraVez>
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
              Encuentra tu nivel
            </span>
            <span className="li-sub">Diez manos mezcladas. Sin reloj.</span>
          </span>
        </button>
      ) : (
        <div className="card level-card">
          <div className="row between">
            <div>
              <div className="eyebrow">Tu rango</div>
              <div className="rank-name" style={{ fontSize: 26 }}>
                <span className="rank-chip" style={{ "--chip": o.chip }} />
                {o.name}
              </div>
              <div className="muted small">{o.note}</div>
            </div>
            <div className="center">
              <div className="mid-num" style={{ fontSize: 40 }}>
                {a.rating.value}
              </div>
              <div className="muted tiny">puntos</div>
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
      {!i ? <ForYou st={a} nav={e} /> : null}
      <div className="section-title">
        <h2>
          Habilidades
          <InfoDot onClick={() => n("skills")} />
        </h2>
        <span className="side">10 manos por tanda</span>
      </div>
      <div className="list">
        {SKILLS.filter((u) => u.id !== "count" || sabeContar(a)).map((u) => {
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
        })}
      </div>
      <div className="section-title">
        <h2>Memoriza la tabla</h2>
      </div>
      <ChartCards st={a} nav={e} />
      <div className="section-title">
        <h2>Ponte a prueba</h2>
      </div>
      <div className="list">
        <button
          type="button"
          className="list-item"
          onClick={() => e.push("blitz")}
        >
          <span className="li-icon">
            <Icon name="clock" />
          </span>
          <span className="li-text">
            <span className="li-title">Contrarreloj</span>
            <span className="li-sub" style={{ display: "block" }}>
              60 segundos: ¿cuántas manos aciertas?
            </span>
          </span>
          <span className="li-side">
            {a.train.blitz && a.train.blitz.best ? a.train.blitz.best : ""}
          </span>
          <Icon name="chev" className="li-chev" />
        </button>
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
          onClick={() => e.push("myChart")}
        >
          <span className="li-icon">
            <Icon name="grid" />
          </span>
          <span className="li-text">
            <span className="li-title">Tu tabla de estrategia</span>
            <span className="li-sub" style={{ display: "block" }}>
              Con cómo te va en cada casilla
            </span>
          </span>
          <Icon name="chev" className="li-chev" />
        </button>
      </div>
      <div className="section-title">
        <h2>Desviaciones</h2>
      </div>
      {sabeContar(a) || verDev || Object.keys(a.devPath.tries || {}).length ? (
        <DevPathCard st={a} nav={e} />
      ) : (
        <button
          type="button"
          className="card list-item mas-plegado"
          onClick={() => setVerDev(true)}
          aria-expanded={false}
        >
          <span className="li-icon">
            <Icon name="lock" />
          </span>
          <span className="li-text">
            <span className="li-title">Primero aprende a contar</span>
            <span className="li-sub" style={{ display: "block" }}>
              Son jugadas que cambian según el conteo. Se abren cuando hagas la
              lección de los valores de las cartas (sección 4). Toca para verlas
              igual.
            </span>
          </span>
          <Icon name="chev" className="li-chev" />
        </button>
      )}
      <div className="section-title">
        <h2>
          Historial
          <InfoDot onClick={() => n("recent")} />
        </h2>
        {l.length > 4 ? (
          <button
            type="button"
            className="link small"
            onClick={() => e.push("trainHistory")}
          >
            Ver todo ({l.length}) →
          </button>
        ) : null}
      </div>
      {l.length ? (
        <div className="list">
          {l
            .slice(-4)
            .reverse()
            .map((u, d) => (
              <button
                type="button"
                className="list-item"
                onClick={() => e.push("trainHistory", { open: u.t })}
                key={d}
              >
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
                <Icon name="chev" className="li-chev" />
              </button>
            ))}
        </div>
      ) : (
        <div className="card flat center muted" style={{ padding: 28 }}>
          <Icon name="layers" size={34} />
          <p style={{ marginTop: 8 }}>Tus tandas van a aparecer aquí.</p>
        </div>
      )}
      <div className="cta-spacer" />
      <div className="float-cta">
        <button
          type="button"
          className="cta-bar"
          onClick={() => r(i ? "level" : "foryou")}
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
                ? "Encuentra tu nivel inicial"
                : (a.train.mistakes || []).length
                  ? "Con tus errores y puntos débiles"
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
          {t.surrender ? ", con rendición" : ""}). Las cambias en Ajustes. La
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
          suma más; fallar las fáciles resta más. Las manos que fallas vuelven
          más seguido en las próximas tandas hasta que las domines.
        </p>
      </Sheet>
    </div>
  );
}
// "Para ti": tus errores para repetir y tu perfil en chips.
function ForYou({ st, nav }) {
  const mistakes = st.train.mistakes || [];
  const fromTable = mistakes.filter((m) => m.src === "mesa").length;
  // Sin errores pendientes no hace falta la sección (menos cosas en pantalla).
  if (!mistakes.length)
    return <ProfileChips st={st} onMore={() => nav.goTab("progreso")} />;
  return (
    <>
      <div className="section-title">
        <h2>Para ti</h2>
      </div>
      <button
        type="button"
        className="card list-item mistakes-card"
        onClick={() =>
          nav.push("trainSession", { mode: "mistakes", confirmExit: true })
        }
      >
        <span className="mistake-fan" aria-hidden="true">
          <MiniCards
            ranks={mistakes[mistakes.length - 1].cards.slice(0, 2)}
            suits={["s", "h"]}
          />
          <span className="mistake-count num">{mistakes.length}</span>
        </span>
        <span className="li-text">
          <span className="li-title">Repite tus errores</span>
          <span className="li-sub" style={{ display: "block" }}>
            {mistakes.length}{" "}
            {mistakes.length === 1 ? "mano que fallaste" : "manos que fallaste"}
            {fromTable ? `, ${fromTable} en la mesa` : ""}. Cada una sale cuando
            la aciertas dos veces.
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <ProfileChips st={st} onMore={() => nav.goTab("progreso")} />
    </>
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
