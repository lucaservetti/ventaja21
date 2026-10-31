// Análisis de tus errores (Premium): la tabla pintada según cómo te va en cada casilla, los errores
// que más plata cuestan, qué tipo de error repetís y cómo venís mejorando semana a semana.
import { useMemo, useState } from "react";
import { useStore } from "../state.js";
import { Button, CHART_COLS, Segmented, cx } from "../ui/components.jsx";
import { TopBar, useRules } from "../ui/common.jsx";
import { ACTION_NAMES, CHART_LETTERS } from "../engine/strategy.js";
import { actionEVs } from "../engine/ev.js";
import { cellCode } from "../lessons/chartMap.js";
import { TABS, cellStats, handName, mastery } from "./MyChart.jsx";
import { useNav } from "../nav.js";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const rankText = (r) => (r === "T" ? "10" : r === "A" ? "As" : r);

// Qué tipo de error es: lo que elegiste contra lo que había que hacer.
function errType(chosen, best) {
  if (best === "P") return "No separás cuando conviene";
  if (chosen === "P") return "Separás cuando no conviene";
  if (best === "D") return "No doblás cuando conviene";
  if (chosen === "D") return "Doblás cuando no conviene";
  if (best === "R") return "No te rendís cuando conviene";
  if (chosen === "R") return "Te rendís cuando no conviene";
  if (best === "I" || best === "N" || chosen === "I" || chosen === "N")
    return "El seguro";
  if (chosen === "H" && best === "S") return "Pedís cuando hay que plantarse";
  if (chosen === "S" && best === "H") return "Te plantás cuando hay que pedir";
  return `${ACTION_NAMES[chosen] || chosen} en vez de ${ACTION_NAMES[best] || best}`;
}
// Cuánto cuesta un error, en fracción de la apuesta (lo que se pierde en promedio cada vez).
function costOf(m, rules) {
  try {
    const ev = actionEVs(
      m.cards.map((r) => ({ r })),
      m.up,
      rules,
    );
    if (ev[m.best] === undefined || ev[m.chosen] === undefined) return 0;
    return Math.max(0, ev[m.best] - ev[m.chosen]);
  } catch {
    return 0;
  }
}
function pct(x) {
  const v = x * 100;
  return v >= 10 ? `${Math.round(v)} %` : `${v.toFixed(1).replace(".", ",")} %`;
}

function Heatmap({ st, rules }) {
  const [tab, setTab] = useState("hard");
  const [sel, setSel] = useState(null);
  const rows = TABS[tab];
  const info = sel ? cellStats(st.train.cells, tab, sel.row, sel.col) : null;
  const selCode = sel ? cellCode(tab, sel.row, sel.col, rules) : null;
  return (
    <div className="card">
      <div className="eyebrow">Tu tabla, según tus errores</div>
      <p className="muted small" style={{ margin: "4px 0 12px" }}>
        Verde: la sabés. Amarillo: a veces fallás. Rojo: la fallás seguido. Tocá
        una casilla para ver el detalle.
      </p>
      <Segmented
        options={[
          { value: "hard", label: "Duras" },
          { value: "soft", label: "Blandas" },
          { value: "pairs", label: "Pares" },
        ]}
        value={tab}
        onChange={(v) => {
          setTab(v);
          setSel(null);
        }}
      />
      <div
        className="chart-grid"
        role="grid"
        aria-label="Tu tabla, según tus errores"
      >
        <div className="chart-row chart-headrow" role="row">
          <span className="chart-rowlabel" role="columnheader">
            <span className="sr-only">Tu mano</span>
          </span>
          {CHART_COLS.map((c) => (
            <span className="chart-col" role="columnheader" key={c}>
              {c}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div className="chart-row" role="row" key={r.key}>
            <span className="chart-rowlabel" role="rowheader">
              {r.label}
            </span>
            {CHART_COLS.map((c, col) => {
              const s = cellStats(st.train.cells, tab, r.key, col);
              const m = mastery(s.acc) || "none";
              const code = cellCode(tab, r.key, col, rules);
              const on =
                sel && String(sel.row) === String(r.key) && sel.col === col;
              return (
                <button
                  type="button"
                  role="gridcell"
                  className={cx("cell", `hm-${m}`, on && "hl")}
                  onClick={() => setSel({ row: r.key, col })}
                  aria-label={`${r.label} contra ${c}: ${
                    s.acc === null
                      ? "sin jugar"
                      : `${Math.round(s.acc * 100)} % bien`
                  }`}
                  key={c}
                >
                  {CHART_LETTERS[code]}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {sel ? (
        <p className="hm-detail">
          <b>
            {handName(tab, sel.row)} contra {CHART_COLS[sel.col]}
          </b>
          {": "}
          {info.n
            ? `${info.ok} de ${info.n} bien en total${
                info.acc !== null
                  ? ` (${Math.round(info.acc * 100)} % en las últimas)`
                  : ""
              }. `
            : "todavía no la jugaste en Entrenar. "}
          {"La jugada: "}
          {ACTION_NAMES[selCode[0]]}.
        </p>
      ) : null}
    </div>
  );
}

function Mistakes() {
  const st = useStore();
  const nav = useNav();
  const rules = useRules();
  const list = st.train.mistakes || [];
  const costly = useMemo(
    () =>
      list
        .map((m) => ({ ...m, cost: costOf(m, rules) }))
        .sort(
          (a, b) =>
            b.cost * b.misses - a.cost * a.misses || b.misses - a.misses,
        )
        .slice(0, 5),
    [list, rules],
  );
  const types = useMemo(() => {
    const t = {};
    for (const m of list) {
      const k = errType(m.chosen, m.best);
      t[k] = (t[k] || 0) + (m.misses || 1);
    }
    return Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [list]);
  const topType = types.length ? types[0][1] : 1;
  // Precisión por semana en Entrenar (las últimas 8).
  const weeks = useMemo(() => {
    const now = Date.now();
    const out = Array.from({ length: 8 }, () => ({ ok: 0, n: 0 }));
    for (const s of st.train.sessions || []) {
      if (s.kind === "exam" || !s.n) continue;
      const w = Math.floor((now - s.t) / WEEK);
      if (w >= 0 && w < 8) {
        out[7 - w].ok += s.ok;
        out[7 - w].n += s.n;
      }
    }
    return out;
  }, [st.train.sessions]);
  const played = weeks.filter((w) => w.n);
  const first = played[0];
  const last = played[played.length - 1];
  const trend =
    played.length >= 2
      ? Math.round((last.ok / last.n - first.ok / first.n) * 100)
      : null;
  const total = st.train.totalHands || 0;
  return (
    <div className="mistakes-an fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Análisis de tus errores"
      />
      <div className="card ma-stats">
        <div>
          <b className="num">{total}</b>
          <span className="muted small">manos en Entrenar</span>
        </div>
        <div>
          <b className="num">
            {total ? `${Math.round((st.train.totalOk / total) * 100)} %` : "—"}
          </b>
          <span className="muted small">bien</span>
        </div>
        <div>
          <b className="num">{st.train.fixed || 0}</b>
          <span className="muted small">errores corregidos</span>
        </div>
        <div>
          <b className="num">{list.length}</b>
          <span className="muted small">por corregir</span>
        </div>
      </div>
      <Heatmap st={st} rules={rules} />
      <div className="card">
        <div className="eyebrow">Tus errores más caros</div>
        {costly.length ? (
          <>
            {costly.map((m) => (
              <div className="ma-mistake" key={m.key}>
                <span className="ma-hand num">
                  {m.cards.map(rankText).join(", ")}
                  <span className="muted"> vs {rankText(m.up)}</span>
                </span>
                <span className="small">
                  Elegiste <b>{ACTION_NAMES[m.chosen]}</b>; lo correcto es{" "}
                  <b>{ACTION_NAMES[m.best]}</b>.
                </span>
                <span className="muted small">
                  {m.misses === 1 ? "1 vez" : `${m.misses} veces`}
                  {m.cost > 0.001
                    ? ` · te cuesta ${pct(m.cost)} de la apuesta cada vez`
                    : ""}
                </span>
              </div>
            ))}
            <Button
              kind="secondary"
              onClick={() =>
                nav.push("trainSession", {
                  mode: "mistakes",
                  confirmExit: true,
                })
              }
            >
              Practicar mis errores
            </Button>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 8 }}>
            No tenés errores pendientes. Cuando falles una mano en Entrenar o en
            la mesa, aparece acá.
          </p>
        )}
      </div>
      {types.length ? (
        <div className="card">
          <div className="eyebrow">Qué tipo de error repetís</div>
          <div className="ma-types">
            {types.map(([k, n]) => (
              <div className="ma-type" key={k}>
                <span className="small">{k}</span>
                <span className="ma-bar">
                  <i style={{ width: `${(n / topType) * 100}%` }} />
                </span>
                <b className="num small">{n}</b>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="card">
        <div className="eyebrow">Cómo venís mejorando</div>
        <p className="muted small" style={{ margin: "4px 0 0" }}>
          {trend === null
            ? "Entrená en semanas distintas para ver tu evolución."
            : trend > 0
              ? `Subiste ${trend} puntos de precisión desde tu primera semana.`
              : trend < 0
                ? `Bajaste ${-trend} puntos desde tu primera semana. Repasá tus errores.`
                : "Te mantenés igual que tu primera semana."}
        </p>
        <div className="ma-weeks" aria-label="Precisión por semana">
          {weeks.map((w, i) => {
            const acc = w.n ? w.ok / w.n : null;
            return (
              <div className="ma-week" key={i}>
                <span className="ma-week-bar">
                  <i
                    className={acc === null ? "" : mastery(acc)}
                    style={{
                      height: `${acc === null ? 0 : Math.max(6, acc * 100)}%`,
                    }}
                  />
                </span>
                <span className="tiny num">
                  {acc === null ? "—" : `${Math.round(acc * 100)}`}
                </span>
                <span className="tiny muted">
                  {i === 7 ? "Esta" : `−${7 - i}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { Mistakes };
