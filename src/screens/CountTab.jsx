import { useState } from "react";
import { dayKey, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { RANKS, makeCard } from "../engine/cards.js";
import {
  Button,
  IconButton,
  PlayingCard,
  Segmented,
  Sheet,
  cx,
} from "../ui/components.jsx";
import { countValue, fmtTag, systemFor } from "../engine/systems.js";
import { InfoDot, PageHeader, SettingsButton } from "../ui/common.jsx";
import { HiLoValues } from "../lessons/visuals.jsx";
import { useNav } from "../nav.js";
import { GoalBadge } from "./goal.jsx";
import { CountPathCard } from "./countPath.jsx";

const SAMPLE_CARD = makeCard("5", "h");
function CountTab() {
  const st = useStore();
  const nav = useNav();
  const sys = systemFor(st.settings.system);
  const [practice, setPractice] = useState("values");
  const [helpOpen, setHelpOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const daily = st.daily;
  const today = dayKey();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const dailyStreak =
    daily.last === today || daily.last === dayKey(y) ? daily.streak : 0;
  const dailyDone = daily.results[today];
  const dailyNumber =
    Math.floor((Date.now() - new Date(2026, 0, 1).getTime()) / 86400000) + 1;
  const valueSessions = st.drills.values.sessions.slice(-7);
  const running = st.drills.running.sessions;
  const bestRun = st.drills.running.bestPerfect;
  return (
    <div className="fade-up">
      <PageHeader
        title="Conteo"
        sub="La habilidad que da vuelta el juego"
        actions={
          <>
            <IconButton
              icon="help"
              label="Cómo se cuenta"
              onClick={() => setHelpOpen(true)}
            />
            <GoalBadge />
            <SettingsButton />
          </>
        }
      />

      <CountPathCard />

      <div className="section-title">
        <h2>Práctica libre</h2>
        <button
          type="button"
          className="sys-pill"
          onClick={() => nav.openSheet("system")}
          aria-label={`Sistema de conteo: ${sys.name}. Cambiar`}
        >
          {sys.short || sys.name} <Icon name="chev" size={14} />
        </button>
      </div>
      <div className="card drill-hero">
        <Segmented
          small={true}
          options={[
            { value: "values", label: "Valores" },
            { value: "running", label: "Conteo corrido" },
          ]}
          value={practice}
          onChange={setPractice}
        />
        {practice === "values" ? (
          <>
            <div className="hero-preview">
              <PlayingCard card={SAMPLE_CARD} size="lg" />
              <span className="hero-tag good num">
                {fmtTag(countValue(SAMPLE_CARD, sys))}
              </span>
            </div>
            <p className="muted">
              Una carta por vez. Tocá cuánto vale cada una y se corrige en el
              momento.
            </p>
            <div className="tags" style={{ margin: "12px 0 16px" }}>
              <span className="chip-tag">12 cartas</span>
              <span className="chip-tag">Sin reloj</span>
            </div>
            <Button
              kind="secondary"
              onClick={() => nav.push("drillValues", { confirmExit: true })}
            >
              Practicar valores
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
              Mirás una secuencia de cartas y al final escribís el conteo
              corrido (<i className="en">running count</i>). Elegís la
              velocidad, la cantidad y si hay distracciones.
            </p>
            <div className="tags" style={{ margin: "12px 0 16px" }}>
              <span className="chip-tag">4 velocidades</span>
              <span className="chip-tag">De a una o de a dos</span>
              <span className="chip-tag">Hasta un mazo</span>
            </div>
            <Button
              kind="secondary"
              onClick={() => nav.push("drillRunning", { confirmExit: true })}
            >
              Practicar conteo corrido
            </Button>
          </>
        )}
      </div>

      <button
        type="button"
        className="card list-item daily-card"
        onClick={() =>
          nav.push("drillRunning", { daily: true, confirmExit: true })
        }
      >
        <span className="li-icon">
          <Icon name="calendar" />
        </span>
        <span className="li-text">
          <span className="li-title" style={{ fontSize: 17 }}>
            Desafío diario{" "}
            <span className="chip-tag acc num">#{dailyNumber}</span>
          </span>
          <span className="li-sub" style={{ display: "block" }}>
            {dailyDone
              ? dailyDone.ok
                ? `Hoy: ¡acertaste!${dailyStreak > 1 ? ` · ${dailyStreak} días seguidos` : ""}`
                : "Hoy: lo intentaste"
              : "20 cartas, las mismas para todos hoy"}
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <button
        type="button"
        className="card list-item sim-card"
        onClick={() => nav.setTab("jugar")}
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

      <div className="section-title">
        <h2>Más ejercicios</h2>
      </div>
      <div className="list">
        <DrillRow
          icon="layers"
          title="Cancelar de a pares"
          sub="Una alta y una baja juntas suman 0"
          onClick={() => nav.push("drillPairs", { confirmExit: true })}
          n={((st.drills.pairs && st.drills.pairs.sessions) || []).length}
        />
        <DrillRow
          icon="target"
          title="Conteo real"
          sub="Pasá el conteo corrido a conteo real (true count)"
          onClick={() => nav.push("drillTrue", { confirmExit: true })}
          n={st.drills.true.sessions.length}
        />
        <DrillRow
          icon="shoe"
          title="Estimar mazos"
          sub="Leé la bandeja de descarte"
          onClick={() => nav.push("drillDecks", { confirmExit: true })}
          n={st.drills.decks.sessions.length}
        />
        <DrillRow
          icon="bolt"
          title="Apuesta según el conteo"
          sub="La escala de 1 a 8 unidades"
          onClick={() => nav.push("drillBet", { confirmExit: true })}
          n={st.drills.bet.sessions.length}
        />
        <DrillRow
          icon="clock"
          title="Mazo completo"
          sub="Contá 51 cartas contra reloj"
          onClick={() => nav.push("deckCountdown", { confirmExit: true })}
          n={(st.drills.deck.sessions || []).length}
        />
        <DrillRow
          icon="sparkle"
          title="Desviaciones"
          sub="Jugadas que cambian con el conteo"
          onClick={() =>
            nav.push("trainSession", { mode: "count", confirmExit: true })
          }
          n={(st.drills.count.sessions || []).length}
        />
      </div>

      <div className="section-title">
        <h2>
          Tu progreso <InfoDot onClick={() => setDetailOpen(true)} />
        </h2>
        <span className="chip-tag">Valores</span>
      </div>
      <div className="card">
        <p className="muted small">
          Precisión por ejercicio, del más viejo al más nuevo.
        </p>
        <div className="bars" style={{ marginBottom: 30 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const s = valueSessions[valueSessions.length - 7 + i];
            if (!s)
              return <span className="b" style={{ height: 14 }} key={i} />;
            const acc = s.ok / s.n;
            return (
              <span
                className={cx(
                  "b",
                  acc >= 0.9 ? "on" : acc >= 0.7 ? "mid" : "low",
                )}
                style={{ height: `${Math.max(10, acc * 100)}%` }}
                key={i}
              >
                <span>{Math.round(acc * 100)}%</span>
              </span>
            );
          })}
        </div>
        <div className="row between small">
          <span className="muted">
            {st.drills.values.sessions.length}{" "}
            {st.drills.values.sessions.length === 1
              ? "ejercicio"
              : "ejercicios"}
          </span>
          <button
            type="button"
            className="link small"
            onClick={() => setDetailOpen(true)}
          >
            Detalles ›
          </button>
        </div>
        {running.length ? (
          <p className="muted small" style={{ marginTop: 12 }}>
            Conteo corrido: {running.filter((r) => r.ok).length} de{" "}
            {running.length} exactos
            {bestRun
              ? ` · récord ${bestRun.n} cartas a ${bestRun.rate.toFixed(1).replace(".", ",")} cartas/s`
              : ""}
          </p>
        ) : null}
      </div>
      <Sheet
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Cómo se cuenta"
      >
        <p className="muted">
          Contar cartas es llevar un solo número. Con{" "}
          <b style={{ color: "var(--text)" }}>{sys.name}</b>, cada carta suma o
          resta:
        </p>
        {sys.id === "hilo" ? <HiLoValues /> : <SystemValues sys={sys} />}
        <p className="muted" style={{ marginTop: 14 }}>
          Un conteo alto quiere decir que quedan muchas cartas altas en el
          zapato: es el momento de subir la apuesta.{" "}
          {sys.balanced
            ? "Para decidir, dividí el conteo corrido (running count) por los mazos que quedan: eso es el conteo real (true count)."
            : "Con KO no dividís: arrancás en 4 − 4 × mazos y mirás el conteo corrido directo."}
        </p>
        <Button
          kind="secondary"
          onClick={() => {
            setHelpOpen(false);
            nav.push("lesson", { id: "l16", confirmExit: true });
          }}
          style={{ marginTop: 18 }}
        >
          Ver la lección
        </Button>
      </Sheet>
      <Sheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Valores: carta por carta"
        tall={true}
      >
        <ValuesDetail st={st} sys={sys} />
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
