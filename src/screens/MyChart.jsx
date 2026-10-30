// "Tu tabla": la estrategia básica completa, con las filas que ya aprendiste encendidas,
// cómo te va en cada casilla en Entrenar y la explicación de cada jugada.
import { useMemo, useState } from "react";
import { useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import {
  Button,
  CHART_COLS,
  ChartLegend,
  HARD_ROWS,
  PAIR_ROWS,
  ProgressBar,
  SOFT_ROWS,
  Segmented,
  cx,
} from "../ui/components.jsx";
import {
  ACTION_EN,
  ACTION_NAMES,
  CHART_CLASS,
  CHART_LETTERS,
  CHART_SUBS,
  allowedActions,
  basicPlay,
} from "../engine/strategy.js";
import { UPS, makeSpot } from "../engine/trainer.js";
import { explainBest } from "../engine/explain.js";
import { TopBar, useRules } from "../ui/common.jsx";
import { getLesson, lessonIndex, openLesson } from "../lessons/content.js";
import {
  ROW_LESSON,
  cellCode,
  chartRules,
  rowCodes,
  rowFallbacks,
  rowLearned,
  rowWords,
} from "../lessons/chartMap.js";
import { useNav } from "../nav.js";

const TABS = { hard: HARD_ROWS, soft: SOFT_ROWS, pairs: PAIR_ROWS };
const KIND = { hard: "H", soft: "S", pairs: "P" };

// Claves de Entrenar que entran en una fila (17+ junta 17 a 19 y 5–8 junta 5 a 8).
function rowStatKeys(tab, row) {
  if (tab === "hard" && row === 17) return ["H17", "H18", "H19"];
  if (tab === "hard" && row === 8) return ["H5", "H6", "H7", "H8"];
  return [`${KIND[tab]}${row}`];
}
function cellStats(cells, tab, row, col) {
  let n = 0;
  let ok = 0;
  let recent = [];
  for (const k of rowStatKeys(tab, row)) {
    const c = cells[`${k}|${UPS[col]}`];
    if (c) {
      n += c.n;
      ok += c.ok;
      recent = recent.concat(c.recent || []);
    }
  }
  const acc = recent.length
    ? recent.reduce((a, b) => a + b, 0) / recent.length
    : null;
  return { n, ok, acc };
}
function mastery(acc) {
  return acc === null ? null : acc >= 0.9 ? "good" : acc >= 0.7 ? "mid" : "bad";
}
function rowLabel(tab, row) {
  return TABS[tab].find((r) => String(r.key) === String(row)).label;
}
function handName(tab, row) {
  if (tab === "pairs")
    return `Par de ${row === "T" ? "dieces" : row === "A" ? "ases" : `${row}`}`;
  if (tab === "soft") return `Blando ${row} (A,${row - 11})`;
  return row === 17
    ? "Duro 17 o más"
    : row === 8
      ? "Duro de 5 a 8"
      : `Duro ${row}`;
}
function spotKeyFor(tab, row, col) {
  const r =
    tab === "hard" && row === 17 ? 17 : tab === "hard" && row === 8 ? 8 : row;
  return `${KIND[tab]}${r}|${UPS[col]}`;
}

function MyChart({ tab: initialTab = "hard" }) {
  const st = useStore();
  const nav = useNav();
  const rules = useRules();
  const [tab, setTab] = useState(initialTab);
  const [sel, setSel] = useState(null);
  const rows = TABS[tab];
  const learnedCount = useMemo(() => {
    let n = 0;
    let total = 0;
    for (const [t, list] of Object.entries(TABS))
      for (const r of list) {
        total++;
        if (rowLearned(st, t, r.key)) n++;
      }
    return { n, total };
  }, [st.lessons]);
  const groups = useMemo(() => chartRules(tab, rows, rules), [tab, rules]);
  const pick = (row, col) => setSel({ tab, row, col });
  const selOk = sel && sel.tab === tab;
  return (
    <div className="my-chart fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Tu tabla"
        sub={`${rules.decks} mazos · ${rules.h17 ? "H17" : "S17"}${rules.surrender ? " · con rendición" : ""}`}
      />
      <div className="card mc-head">
        <div className="row between">
          <span className="eyebrow">Filas que ya aprendiste</span>
          <b className="num">
            {learnedCount.n}
            <span className="muted"> de {learnedCount.total}</span>
          </b>
        </div>
        <div style={{ marginTop: 10 }}>
          <ProgressBar value={learnedCount.n / learnedCount.total} />
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
          Las filas se encienden cuando hacés la lección que las enseña. Tocá
          cualquier casilla para ver por qué se juega así.
        </p>
      </div>
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
        className="chart-grid mc-grid"
        role="table"
        aria-label="Tu tabla de estrategia"
      >
        <div className="chart-row chart-headrow" role="row">
          <span
            className="chart-rowlabel"
            role="columnheader"
            aria-label="Tu mano"
          />
          {CHART_COLS.map((c) => (
            <span className="chart-col" role="columnheader" key={c}>
              {c}
            </span>
          ))}
        </div>
        {rows.map((r) => {
          const learned = rowLearned(st, tab, r.key);
          return (
            <div
              className={cx("chart-row", !learned && "mc-locked")}
              role="row"
              key={r.key}
            >
              <span className="chart-rowlabel" role="rowheader">
                {learned ? null : <Icon name="lock" size={11} />}
                {r.label}
              </span>
              {CHART_COLS.map((c, col) => {
                const code = cellCode(tab, r.key, col, rules);
                const m = mastery(
                  cellStats(st.train.cells, tab, r.key, col).acc,
                );
                const on =
                  selOk && String(sel.row) === String(r.key) && sel.col === col;
                return (
                  <button
                    type="button"
                    role="cell"
                    className={cx("cell", `c-${CHART_CLASS[code]}`, on && "hl")}
                    onClick={() => pick(r.key, col)}
                    aria-label={`${r.label} contra ${c}: ${ACTION_NAMES[code[0]]}`}
                    key={c}
                  >
                    {CHART_LETTERS[code]}
                    {CHART_SUBS[code] ? <sub>{CHART_SUBS[code]}</sub> : null}
                    {m ? <i className={cx("mc-dot", m)} /> : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <ChartLegend
        show={
          rules.surrender ? ["H", "S", "D", "P", "R"] : ["H", "S", "D", "P"]
        }
      />
      <div className="mc-dots-legend muted small">
        <span>
          <i className="mc-dot good" /> la dominás
        </span>
        <span>
          <i className="mc-dot mid" /> bien
        </span>
        <span>
          <i className="mc-dot bad" /> a mejorar
        </span>
        <span>según tus manos en Entrenar</span>
      </div>
      {selOk ? (
        <CellDetail
          key={`${sel.tab}${sel.row}${sel.col}`}
          tab={tab}
          row={sel.row}
          col={sel.col}
          rules={rules}
          st={st}
          nav={nav}
        />
      ) : (
        <div className="card flat mc-hint">
          <Icon name="info" size={20} />
          <span>
            Tocá una casilla para ver la jugada, la razón y cómo te va con esa
            mano.
          </span>
        </div>
      )}
      <div className="section-title">
        <h2>En palabras</h2>
      </div>
      <div className="card mc-rules">
        {groups.map((g) => (
          <div className="mc-rule" key={g.label}>
            <b>{g.label}</b>
            <span>{g.text}</span>
            {g.notes.map((n) => (
              <span className="muted small" key={n}>
                ({n})
              </span>
            ))}
          </div>
        ))}
      </div>
      <Button
        kind="secondary"
        onClick={() => nav.openSheet("chartView")}
        style={{ marginTop: 18 }}
      >
        Ver la tabla limpia, sin marcas
      </Button>
    </div>
  );
}

function CellDetail({ tab, row, col, rules, st, nav }) {
  const info = useMemo(() => {
    const key = spotKeyFor(tab, row, col);
    const spot = makeSpot(key, { rnd: () => 0.37 });
    const hand = { cards: spot.cards, fromSplit: false };
    const allowed = allowedActions(hand, rules);
    const play = basicPlay(hand, spot.upRank, rules, allowed);
    return {
      key,
      spot,
      play,
      why: explainBest(spot, play.action, play.code, rules),
    };
  }, [tab, row, col, rules]);
  const code = cellCode(tab, row, col, rules);
  const stats = cellStats(st.train.cells, tab, row, col);
  const learned = rowLearned(st, tab, row);
  const lessonId = ROW_LESSON[tab][row];
  const lesson = getLesson(lessonId);
  const codes = rowCodes(tab, row, rules);
  const action = code[0];
  return (
    <div className="card mc-detail fade-up">
      <div className="eyebrow">
        {rowLabel(tab, row)} contra {CHART_COLS[col]}
      </div>
      <h3 className="mc-title">
        {handName(tab, row)} contra{" "}
        {CHART_COLS[col] === "A" ? "un As" : `un ${CHART_COLS[col]}`}
      </h3>
      <div className="mc-action">
        <span className={cx("cell big", `c-${CHART_CLASS[code]}`)}>
          {CHART_LETTERS[code]}
          {CHART_SUBS[code] ? <sub>{CHART_SUBS[code]}</sub> : null}
        </span>
        <span>
          <b>{ACTION_NAMES[action]}</b>{" "}
          <i className="en en-dup">({ACTION_EN[action]})</i>
          {rowFallbacks([code]).map((n) => (
            <span className="muted small" style={{ display: "block" }} key={n}>
              {n.charAt(0).toUpperCase() + n.slice(1)}.
            </span>
          ))}
        </span>
      </div>
      <p className="mc-why">{info.why}</p>
      <p className="muted small">
        <b style={{ color: "var(--text)" }}>Toda la fila:</b> {rowWords(codes)}
      </p>
      <div className="mc-record">
        {stats.n ? (
          <>
            <span className={cx("mc-dot", mastery(stats.acc))} />
            En Entrenar: {stats.ok} de {stats.n} bien
          </>
        ) : (
          <>Todavía no te tocó esta mano en Entrenar.</>
        )}
      </div>
      <div className="mc-actions">
        <Button
          small={true}
          onClick={() =>
            nav.push("trainSession", {
              mode: "spot",
              focus: info.key,
              confirmExit: true,
            })
          }
        >
          Practicar esta mano
        </Button>
        {!learned && lesson ? (
          <Button
            small={true}
            kind="secondary"
            onClick={() => openLesson(nav, lesson)}
          >
            Lección {lessonIndex(lessonId) + 1}: {lesson.title}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { MyChart };
