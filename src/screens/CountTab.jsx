import { useState } from "react";
import { dayKey, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { RANKS, makeCard } from "../engine/cards.js";
import {
  Button,
  Flame,
  IconButton,
  PlayingCard,
  Segmented,
  Sheet,
  cx,
} from "../ui/components.jsx";
import { countValue, fmtTag, systemFor } from "../engine/systems.js";
import {
  BrandBar,
  InfoDot,
  SettingsButton,
  StreakBadge,
} from "../ui/common.jsx";
import { HiLoValues } from "../lessons/visuals.jsx";
import { useNav } from "../nav.js";

const SAMPLE_CARD = makeCard("5", "h");
function CountTab() {
  let a = useStore(),
    e = useNav(),
    t = systemFor(a.settings.system),
    [s, n] = useState("values"),
    [l, i] = useState(false),
    [o, c] = useState(false),
    r = {
      how: !!(a.lessons.l16 && a.lessons.l16.done) || !!a.path.done.how,
      values: !!a.path.done.values,
      running: !!a.path.done.running,
      use: !!(a.lessons.use && a.lessons.use.done),
    },
    u = Object.values(r).filter(Boolean).length,
    d = [
      {
        id: "how",
        title: "Cómo funciona el conteo",
        sub: "Por qué las cartas que salen cambian todo",
        go: () =>
          e.push("lesson", {
            id: "l16",
            confirmExit: true,
            then: {
              markPath: "how",
              text: "Ahora aprendé los valores de cada carta.",
              screen: "lesson",
              params: { id: "l17", confirmExit: true, then: AFTER_VALUES },
              label: "Seguir: los valores",
              backLabel: "Volver a Conteo",
            },
          }),
      },
      {
        id: "values",
        title: "Valores de las cartas",
        sub: "Hi-Lo: +1, 0 y −1",
        go: () =>
          e.push("lesson", {
            id: "l17",
            confirmExit: true,
            then: AFTER_VALUES,
          }),
      },
      {
        id: "running",
        title: "Conteo corrido",
        sub: "Llevá el total mientras caen las cartas",
        go: () => e.push("drillRunning", { confirmExit: true }),
      },
      {
        id: "use",
        title: "Usar el conteo",
        sub: "Conteo real y cuánto apostar",
        go: () =>
          e.push("lesson", {
            id: "use",
            confirmExit: true,
            then: {
              markPath: "use",
              text: "Ya sabés contar y apostar. Probalo en el simulador.",
              backLabel: "Volver a Conteo",
            },
          }),
      },
    ],
    p = d.find((M) => !r[M.id]),
    f = a.daily,
    y = dayKey(),
    C = new Date();
  C.setDate(C.getDate() - 1);
  let k = dayKey(C),
    v = f.last === y || f.last === k ? f.streak : 0,
    m = !!f.results[y],
    b =
      Math.floor((Date.now() - new Date(2026, 0, 1).getTime()) / 86400000) + 1,
    S = a.drills.values.sessions.slice(-7),
    D = a.drills.running.sessions,
    _ = a.drills.running.bestPerfect;
  return (
    <div className="fade-up">
      <BrandBar
        right={
          <>
            <StreakBadge />
            <SettingsButton />
          </>
        }
      />
      <div className="page-head">
        <div className="page-head-text">
          <h1>Conteo</h1>
          <p className="page-sub">La habilidad que da vuelta el juego</p>
        </div>
        <div className="page-head-right">
          <button
            type="button"
            className="sys-pill"
            onClick={() => e.openSheet("system")}
          >
            {t.short || t.name} <Icon name="chev" size={14} />
          </button>
          <IconButton
            icon="help"
            label="Cómo funciona el conteo"
            onClick={() => i(true)}
            className="acc-icon"
          />
        </div>
      </div>
      <div className="card drill-hero">
        <Segmented
          small={true}
          options={[
            { value: "values", label: "Valores" },
            { value: "running", label: "Conteo corrido" },
          ]}
          value={s}
          onChange={n}
        />
        {s === "values" ? (
          <>
            <div className="hero-preview">
              <PlayingCard card={SAMPLE_CARD} size="lg" />
              <span className="hero-tag good num">
                {fmtTag(countValue(SAMPLE_CARD, t))}
              </span>
            </div>
            <p className="muted">
              Una carta por vez. Tocá cuánto vale cada una y se corrige en el
              momento.
            </p>
            <div className="tags" style={{ margin: "12px 0 16px" }}>
              <span className="chip-tag">12 cartas</span>
              <span className="chip-tag">Sin reloj</span>
              <span className="chip-tag">Pasás con 80 %</span>
            </div>
            <Button
              onClick={() => e.push("drillValues", { confirmExit: true })}
            >
              Empezar
            </Button>
          </>
        ) : (
          <>
            <div className="hero-preview">
              <span className="card-row overlap cr-md">
                <PlayingCard card={makeCard("K", "s")} size="md" />
                <PlayingCard card={makeCard("4", "d")} size="md" />
                <PlayingCard card={makeCard("6", "c")} size="md" />
              </span>
              <span className="hero-tag good num">+1</span>
            </div>
            <p className="muted">
              Mirás una secuencia de cartas y al final escribís el conteo.
              Después repasás carta por carta.
            </p>
            <div className="tags" style={{ margin: "12px 0 16px" }}>
              <span className="chip-tag">4 velocidades</span>
              <span className="chip-tag">De a una o de a dos</span>
              <span className="chip-tag">Hasta un mazo</span>
            </div>
            <Button
              onClick={() => e.push("drillRunning", { confirmExit: true })}
            >
              Empezar
            </Button>
          </>
        )}
      </div>
      <div className="card path-card">
        <div className="row between">
          <h2 style={{ fontSize: 21 }}>Empezá acá: contar en 4 pasos</h2>
          <span
            className="muted small num"
            style={{ fontWeight: 700, whiteSpace: "nowrap" }}
          >
            {u}
            {" de 4"}
          </span>
        </div>
        <div className="path-steps">
          {d.map((M, R) => {
            let V = r[M.id],
              B = p && p.id === M.id;
            return (
              <button
                type="button"
                className={cx("pstep", B && "next", V && "done")}
                onClick={M.go}
                key={M.id}
              >
                <span className="pstep-dot">
                  {V ? <Icon name="check" size={16} stroke={3} /> : R + 1}
                </span>
                <span className="li-text">
                  <span className="li-title" style={{ fontSize: 17 }}>
                    {M.title}
                  </span>
                  <span className="li-sub" style={{ display: "block" }}>
                    {V ? "Hecho" : M.sub}
                  </span>
                </span>
                {B ? (
                  <span className="pstep-go">Empezar</span>
                ) : (
                  <Icon name="chev" className="li-chev" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        className="card list-item sim-card"
        onClick={() => e.setTab("jugar")}
      >
        <span className="li-icon">
          <Icon name="play" />
        </span>
        <span className="li-text">
          <span className="li-title">Simulador de blackjack</span>
          <span className="li-sub" style={{ display: "block" }}>
            Jugá un zapato entero: apostá con el conteo, jugá la estrategia y
            aguantá la varianza.
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <button
        type="button"
        className="card list-item daily-card"
        onClick={() =>
          e.push("drillRunning", { daily: true, confirmExit: true })
        }
      >
        <span className="li-icon">
          <Icon name="calendar" />
        </span>
        <span className="li-text">
          <span className="li-title" style={{ fontSize: 17 }}>
            {"Desafío diario "}
            <span className="chip-tag acc num">#{b}</span>
          </span>
          <span className="li-sub" style={{ display: "block" }}>
            {m
              ? f.results[y].ok
                ? "Hoy: ¡acertaste!"
                : "Hoy: lo intentaste"
              : "20 cartas, el mismo para todos hoy"}
          </span>
        </span>
        <span className="row" style={{ gap: 4, fontWeight: 700 }}>
          <Flame size={20} lit={v > 0} />
          <span className="num">{v}</span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <div className="section-title">
        <h2>Más ejercicios</h2>
      </div>
      <div className="list">
        <DrillRow
          icon="layers"
          title="Conteo real"
          sub="Pasá el conteo corrido a conteo real"
          onClick={() => e.push("drillTrue", { confirmExit: true })}
          n={a.drills.true.sessions.length}
        />
        <DrillRow
          icon="shoe"
          title="Estimar mazos"
          sub="Leé la bandeja de descarte"
          onClick={() => e.push("drillDecks", { confirmExit: true })}
          n={a.drills.decks.sessions.length}
        />
        <DrillRow
          icon="target"
          title="Apuesta según el conteo"
          sub="La escala de 1 a 8 unidades"
          onClick={() => e.push("drillBet", { confirmExit: true })}
          n={a.drills.bet.sessions.length}
        />
        <DrillRow
          icon="clock"
          title="Mazo completo"
          sub="Contá 51 cartas contra reloj"
          onClick={() => e.push("deckCountdown", { confirmExit: true })}
          n={(a.drills.deck.sessions || []).length}
        />
        <DrillRow
          icon="sparkle"
          title="Desviaciones"
          sub="Jugadas que cambian con el conteo"
          onClick={() =>
            e.push("trainSession", { mode: "count", confirmExit: true })
          }
          n={(a.drills.count.sessions || []).length}
        />
      </div>
      <div className="section-title">
        <h2>
          {"Tu progreso "}
          <InfoDot onClick={() => c(true)} />
        </h2>
        <span className="chip-tag">Valores</span>
      </div>
      <div className="card">
        <p className="muted small">
          Precisión por ejercicio, del más viejo al más nuevo.
        </p>
        <div className="bars" style={{ marginBottom: 30 }}>
          {Array.from({ length: 7 }, (M, R) => {
            let V = S[S.length - 7 + R];
            if (!V)
              return <span className="b" style={{ height: 14 }} key={R} />;
            let B = V.ok / V.n;
            return (
              <span
                className={cx("b", B >= 0.9 ? "on" : B >= 0.7 ? "mid" : "low")}
                style={{ height: `${Math.max(10, B * 100)}%` }}
                key={R}
              >
                <span>{Math.round(B * 100)}%</span>
              </span>
            );
          })}
        </div>
        <div className="row between small">
          <span className="muted">
            {a.drills.values.sessions.length}{" "}
            {a.drills.values.sessions.length === 1 ? "ejercicio" : "ejercicios"}
          </span>
          <button type="button" className="link small" onClick={() => c(true)}>
            Detalles ›
          </button>
        </div>
        {D.length ? (
          <p className="muted small" style={{ marginTop: 12 }}>
            {"Conteo corrido: "}
            {D.filter((M) => M.ok).length}
            {" de "}
            {D.length}
            {" exactos"}
            {_
              ? ` · récord ${_.n} cartas a ${_.rate.toFixed(1).replace(".", ",")} cartas/s`
              : ""}
          </p>
        ) : null}
      </div>
      <Sheet open={l} onClose={() => i(false)} title="Cómo se cuenta">
        <p className="muted">
          {"Contar cartas es llevar un solo número. Con "}
          <b style={{ color: "var(--text)" }}>{t.name}</b>, cada carta suma o
          resta:
        </p>
        {t.id === "hilo" ? <HiLoValues /> : <SystemValues sys={t} />}
        <p className="muted" style={{ marginTop: 14 }}>
          {
            "Un conteo alto quiere decir que quedan muchas cartas altas en el zapato: es el momento de subir la apuesta. "
          }
          {t.balanced
            ? "Para decidir, dividí el conteo corrido por los mazos que quedan (conteo real)."
            : "Con KO no dividís: arrancás en 4 − 4 × mazos y mirás el conteo corrido directo."}
        </p>
        <Button
          kind="secondary"
          onClick={() => {
            i(false);
            e.push("lesson", { id: "l16", confirmExit: true });
          }}
          style={{ marginTop: 18 }}
        >
          Ver la lección
        </Button>
      </Sheet>
      <Sheet
        open={o}
        onClose={() => c(false)}
        title="Valores: carta por carta"
        tall={true}
      >
        <ValuesDetail st={a} sys={t} />
      </Sheet>
    </div>
  );
}
const AFTER_VALUES = {
  markPath: null,
  text: "Ahora practicalos: 12 cartas y cada toque se corrige al instante.",
  screen: "drillValues",
  params: { confirmExit: true },
  label: "Empezar: Valores de las cartas",
  backLabel: "Volver a Conteo",
};
function DrillRow({ icon: a, title: e, sub: t, onClick: s, n }) {
  return (
    <button type="button" className="list-item" onClick={s}>
      <span className="li-icon">
        <Icon name={a} />
      </span>
      <span className="li-text">
        <span className="li-title" style={{ fontSize: 17 }}>
          {e}
        </span>
        <span className="li-sub" style={{ display: "block" }}>
          {t}
        </span>
      </span>
      {n ? <span className="li-side num">{n}×</span> : null}
      <Icon name="chev" className="li-chev" />
    </button>
  );
}
function SystemValues({ sys: a }) {
  return (
    <div className="sys-values">
      {[
        ["A", "A"],
        ["2", "2"],
        ["3", "3"],
        ["4", "4"],
        ["5", "5"],
        ["6", "6"],
        ["7", "7"],
        ["8", "8"],
        ["9", "9"],
        ["T", "10–K"],
      ].map(([t, s]) => {
        let n = a.values[t];
        return (
          <div className="sv" key={t}>
            <span className="sv-r">{s}</span>
            <b className={cx("num", n > 0 ? "good" : n < 0 ? "bad" : "muted")}>
              {fmtTag(n)}
            </b>
          </div>
        );
      })}
    </div>
  );
}
function ValuesDetail({ st: a, sys: e }) {
  let t = a.drills.values.ranks || {},
    s = a.drills.values.sessions,
    n = s.length,
    l = n ? s.reduce((u, d) => u + d.ok / d.n, 0) / n : 0,
    i = n ? Math.max(...s.map((u) => u.ok / u.n)) : 0,
    o = s.filter((u) => u.ok / u.n >= 0.8).length,
    c = null,
    r = 2;
  for (let u of RANKS) {
    let d = t[u];
    if (d && d.n >= 2 && d.ok / d.n < r) {
      r = d.ok / d.n;
      c = u;
    }
  }
  return n ? (
    <div>
      <div className="tiles two">
        <div className="tile">
          <div className="tile-v">{Math.round(l * 100)}%</div>
          <div className="tile-l">precisión promedio</div>
        </div>
        <div className="tile">
          <div className="tile-v good">{Math.round(i * 100)}%</div>
          <div className="tile-l">mejor ejercicio</div>
        </div>
        <div className="tile">
          <div className="tile-v num">
            {o}/{n}
          </div>
          <div className="tile-l">aprobados (80 %+)</div>
        </div>
        <div className="tile">
          <div className="tile-v num">{a.drills.values.bestStreak || 0}</div>
          <div className="tile-l">mejor racha</div>
        </div>
      </div>
      <h3 style={{ margin: "22px 0 12px" }}>Carta por carta</h3>
      <div className="rank-grid">
        {RANKS.map((u) => {
          let d = t[u],
            p = d && d.n ? d.ok / d.n : null;
          return (
            <div className="rank-cell" key={u}>
              <b>{u}</b>
              <span
                className={cx(
                  "rank-bar",
                  p === null
                    ? ""
                    : p >= 0.9
                      ? "good"
                      : p >= 0.7
                        ? "mid"
                        : "bad",
                )}
              />
              <span className="tiny muted num">
                {p === null ? "—" : `${Math.round(p * 100)}%`}
              </span>
            </div>
          );
        })}
      </div>
      {c && r < 0.95 ? (
        <p className="muted" style={{ marginTop: 14 }}>
          {"Practicá el "}
          <b style={{ color: "var(--text)" }}>{c}</b>: es la carta que más te
          cuesta ({fmtTag(countValue(makeCard(c, "s"), e))}). Va a salir más
          seguido en tus próximos ejercicios.
        </p>
      ) : null}
      <h3 style={{ margin: "22px 0 8px" }}>Ejercicios recientes</h3>
      {s
        .slice(-6)
        .reverse()
        .map((u, d) => (
          <div className="kv" key={d}>
            <span className="kv-k" style={{ fontWeight: 600 }}>
              {Math.round((u.ok / u.n) * 100)}
              {" % correcto"}
            </span>
            <span className="muted small">
              {u.ok / u.n >= 0.8 ? "Aprobado" : "A repasar"}
            </span>
          </div>
        ))}
    </div>
  ) : (
    <p className="muted">
      Todavía no hiciste el ejercicio de valores. Cuando lo hagas, acá vas a ver
      tu precisión carta por carta.
    </p>
  );
}
export { CountTab, SystemValues };
