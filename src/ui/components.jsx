import { useEffect, useRef, useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Icon, SuitIcon } from "./icons.jsx";
import { SUIT_NAMES, isRedSuit } from "../engine/cards.js";
import {
  CHART_CLASS,
  CHART_LETTERS,
  CHART_SUBS,
  strategyFor,
} from "../engine/strategy.js";
import { sfx, vibrate } from "../sound.js";

const cx = (...a) => a.filter(Boolean).join(" ");
const RANK_NAMES = { A: "As", J: "J", Q: "Q", K: "K" };
function PlayingCard({
  card: a,
  size: e = "md",
  down: t = false,
  deal: s = false,
  mark: n = null,
  dim: l = false,
  className: i,
  style: o,
  glow: c,
}) {
  if (!a)
    return <div className={cx("pc", `pc-${e}`, "pc-empty", i)} style={o} />;
  let r = isRedSuit(a.s),
    u = t ? "Carta tapada" : `${RANK_NAMES[a.r] || a.r} de ${SUIT_NAMES[a.s]}`;
  return (
    <div
      className={cx(
        "pc",
        `pc-${e}`,
        t && "pc-down",
        s && "pc-deal",
        l && "pc-dim",
        c && `pc-glow-${c}`,
        i,
      )}
      style={o}
      role="img"
      aria-label={u}
    >
      <div className="pc-inner">
        <div className={cx("pc-face", r && "pc-red")}>
          <span className={cx("pc-rank", a.r === "10" && "r10")}>{a.r}</span>
          <SuitIcon s={a.s} className="pc-suit" />
        </div>
        <div className="pc-back" />
      </div>
      {n ? (
        <span className={cx("pc-mark", n === "ok" ? "ok" : "bad")}>
          <Icon name={n === "ok" ? "check" : "x"} size={18} stroke={3} />
        </span>
      ) : null}
    </div>
  );
}
const CHIP_VALUES = [1, 5, 25, 100, 500];
function chipLabel(a) {
  return a >= 1000
    ? a % 1000 === 0
      ? `${a / 1000}k`
      : `${(a / 1000).toFixed(1)}k`
    : String(a);
}
function Chip({
  value: a,
  size: e = 52,
  onClick: t,
  disabled: s,
  className: n,
  style: l,
  label: i,
}) {
  return _jsx(t ? "button" : "span", {
    type: t ? "button" : undefined,
    className: cx("chip", `chip-${a}`, s && "chip-off", n),
    style: { "--s": `${e}px`, ...l },
    onClick: t
      ? () => {
          if (!s) {
            sfx.chip();
            vibrate(6);
            t(a);
          }
        }
      : undefined,
    disabled: t ? s : undefined,
    "aria-label": i || `Ficha de ${a}`,
    children: <span className="chip-v">{chipLabel(a)}</span>,
  });
}
function chipBreakdown(a) {
  let e = [],
    t = Math.round(a);
  for (let s of [500, 100, 25, 5, 1])
    for (; t >= s && e.length < 7;) {
      e.push(s);
      t -= s;
    }
  return e;
}
function ChipStack({ amount: a, size: e = 40 }) {
  if (!a) return null;
  let t = chipBreakdown(a);
  return (
    <div
      className="chip-stack"
      style={{ "--s": `${e}px`, height: e + (t.length - 1) * 5 }}
    >
      {t.map((s, n) => (
        <Chip
          value={s}
          size={e}
          style={{ position: "absolute", bottom: n * 5, left: 0 }}
          key={n}
        />
      ))}
    </div>
  );
}
function Button({
  children: a,
  kind: e = "primary",
  onClick: t,
  disabled: s,
  className: n,
  icon: l,
  iconRight: i,
  small: o,
  type: c = "button",
  ...r
}) {
  return (
    <button
      type={c}
      className={cx("btn", `btn-${e}`, o && "btn-sm", n)}
      onClick={(u) => {
        if (!s) {
          vibrate(8);
          if (t) {
            t(u);
          }
        }
      }}
      disabled={s}
      {...r}
    >
      {l ? <Icon name={l} size={20} /> : null}
      <span>{a}</span>
      {i ? <Icon name={i} size={20} /> : null}
    </button>
  );
}
function IconButton({
  icon: a,
  onClick: e,
  label: t,
  className: s,
  size: n = 22,
  active: l,
  disabled: i,
}) {
  return (
    <button
      type="button"
      className={cx("icon-btn", l && "active", s)}
      onClick={e}
      aria-label={t}
      title={t}
      disabled={i}
    >
      <Icon name={a} size={n} />
    </button>
  );
}
function Segmented({
  options: a,
  value: e,
  onChange: t,
  className: s,
  small: n,
}) {
  return (
    <div className={cx("seg", n && "seg-sm", s)} role="tablist">
      {a.map((l) => (
        <button
          type="button"
          role="tab"
          aria-selected={l.value === e}
          className={cx("seg-item", l.value === e && "on")}
          onClick={() => {
            vibrate(5);
            t(l.value);
          }}
          key={l.value}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
function Pills({ options: a, value: e, onChange: t, className: s }) {
  return (
    <div className={cx("pills", s)}>
      {a.map((n) => (
        <button
          type="button"
          className={cx("pill", n.value === e && "on")}
          onClick={() => t(n.value)}
          aria-pressed={n.value === e}
          key={n.value}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
}
function Toggle({ checked: a, onChange: e, label: t, sub: s, id: n }) {
  return (
    <label className="toggle-row" htmlFor={n}>
      <span className="toggle-text">
        <span className="toggle-label">{t}</span>
        {s ? <span className="toggle-sub">{s}</span> : null}
      </span>
      <span className={cx("toggle", a && "on")}>
        <input
          id={n}
          type="checkbox"
          checked={!!a}
          onChange={(l) => e(l.target.checked)}
        />
        <span className="toggle-knob" />
      </span>
    </label>
  );
}
function Segments({
  total: a,
  done: e,
  current: t = -1,
  className: s,
  states: n,
}) {
  return (
    <div className={cx("segments", s)}>
      {Array.from({ length: a }, (l, i) => (
        <span
          className={cx(
            "segment",
            n ? n[i] : i < e ? "done" : i === t ? "cur" : "",
          )}
          key={i}
        />
      ))}
    </div>
  );
}
function ProgressBar({ value: a, className: e, tone: t }) {
  return (
    <div className={cx("bar", t && `bar-${t}`, e)}>
      <span style={{ width: `${Math.max(0, Math.min(100, a * 100))}%` }} />
    </div>
  );
}
function Ring({
  value: a,
  size: e = 160,
  stroke: t = 14,
  children: s,
  tone: n,
}) {
  let l = (e - t) / 2,
    i = 2 * Math.PI * l,
    o = Math.max(0, Math.min(1, a)),
    c =
      n ||
      (o >= 0.9 ? "var(--good)" : o >= 0.7 ? "var(--accent)" : "var(--bad)");
  return (
    <div className="ring" style={{ width: e, height: e }}>
      <svg width={e} height={e} viewBox={`0 0 ${e} ${e}`} aria-hidden="true">
        <circle
          cx={e / 2}
          cy={e / 2}
          r={l}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={t}
        />
        <circle
          cx={e / 2}
          cy={e / 2}
          r={l}
          fill="none"
          stroke={c}
          strokeWidth={t}
          strokeLinecap="round"
          strokeDasharray={`${i * o} ${i}`}
          transform={`rotate(-90 ${e / 2} ${e / 2})`}
          className="ring-arc"
        />
      </svg>
      <div className="ring-in">{s}</div>
    </div>
  );
}
function Sheet({
  open: a,
  onClose: e,
  title: t,
  children: s,
  footer: n,
  tall: l,
  className: i,
}) {
  let [o, c] = useState(a),
    [r, u] = useState(false);
  useEffect(() => {
    if (a) {
      c(true);
      u(false);
    } else if (o) {
      u(true);
      let d = setTimeout(() => {
        c(false);
        u(false);
      }, 220);
      return () => clearTimeout(d);
    }
  }, [a]);
  useEffect(() => {
    if (!a) return;
    let d = (p) => {
      if (p.key === "Escape" && e) {
        e();
      }
    };
    window.addEventListener("keydown", d);
    return () => window.removeEventListener("keydown", d);
  }, [a, e]);
  return o ? (
    <div
      className={cx("sheet-wrap", r && "closing")}
      role="dialog"
      aria-modal="true"
      aria-label={t}
    >
      <div className="sheet-backdrop" onClick={e} />
      <div className={cx("sheet", l && "tall", i)}>
        <div className="sheet-handle" />
        {t ? (
          <div className="sheet-head">
            <h2>{t}</h2>
            {e ? (
              <IconButton
                icon="close"
                onClick={e}
                label="Cerrar"
                className="sheet-x"
              />
            ) : null}
          </div>
        ) : null}
        <div className="sheet-body">{s}</div>
        {n ? <div className="sheet-foot">{n}</div> : null}
      </div>
    </div>
  ) : null;
}
function Modal({ open: a, children: e, onClose: t, className: s }) {
  return a ? (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={t} />
      <div className={cx("modal", s)}>{e}</div>
    </div>
  ) : null;
}
function Keypad({
  value: a,
  onChange: e,
  onSubmit: t,
  allowHalf: s = false,
  submitLabel: n = "Confirmar",
}) {
  let l = (o) => {
    vibrate(5);
    sfx.tap();
    let c = a;
    if (o === "del") {
      c = c.slice(0, -1);
    } else if (o === "sign") {
      c = c.startsWith("-") ? c.slice(1) : "-" + c;
    } else if (o === "half") {
      if (c.endsWith(",5")) {
        c = c.slice(0, -2);
      } else {
        if (c === "" || c === "-") {
          c = c + "0";
        }
        c = c + ",5";
      }
    } else {
      if (c.includes(",")) return;
      let r = c.replace("-", "");
      if (r.length >= 2) return;
      if (r === "0") {
        c = (c.startsWith("-") ? "-" : "") + o;
      } else {
        c = c + o;
      }
    }
    e(c);
  };
  return (
    <div className="keypad">
      <div className="keypad-grid">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "sign", "0", "del"].map(
          (o) => (
            <button
              type="button"
              className={cx("key", (o === "sign" || o === "del") && "key-fn")}
              onClick={() => l(o)}
              aria-label={
                o === "sign" ? "Cambiar signo" : o === "del" ? "Borrar" : o
              }
              key={o}
            >
              {o === "sign" ? (
                "±"
              ) : o === "del" ? (
                <Icon name="backspace" size={22} />
              ) : (
                o
              )}
            </button>
          ),
        )}
      </div>
      {s ? (
        <button
          type="button"
          className="key key-half"
          onClick={() => l("half")}
        >
          ½
        </button>
      ) : null}
      <Button
        onClick={t}
        disabled={a === "" || a === "-"}
        className="keypad-ok"
      >
        {n}
      </Button>
    </div>
  );
}
function parseKeypad(a) {
  if (a === "" || a === "-") return null;
  let e = Number(a.replace(",", "."));
  return Number.isFinite(e) ? e : null;
}
function formatKeypad(a) {
  if (a === "") return "—";
  if (a === "-") return "−";
  let e = a.startsWith("-"),
    t = a.replace("-", "");
  return t === "0" || t === "0,0" ? "0" : (e ? "−" : "+") + t;
}
const CHART_COLS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
const HARD_ROWS = [
  { key: 17, label: "17+" },
  { key: 16, label: "16" },
  { key: 15, label: "15" },
  { key: 14, label: "14" },
  { key: 13, label: "13" },
  { key: 12, label: "12" },
  { key: 11, label: "11" },
  { key: 10, label: "10" },
  { key: 9, label: "9" },
  { key: 8, label: "5–8" },
];
const SOFT_ROWS = [20, 19, 18, 17, 16, 15, 14, 13].map((a) => ({
  key: a,
  label: `A,${a - 11}`,
}));
const PAIR_ROWS = ["A", "T", "9", "8", "7", "6", "5", "4", "3", "2"].map(
  (a) => ({ key: a, label: a === "T" ? "10,10" : `${a},${a}` }),
);
function StrategyChart({
  rules: a,
  initialTab: e = "hard",
  highlight: t = null,
}) {
  let [s, n] = useState(t ? t.tab : e);
  useEffect(() => {
    if (t) {
      n(t.tab);
    }
  }, [t && t.tab]);
  let l = strategyFor(a),
    i = s === "hard" ? HARD_ROWS : s === "soft" ? SOFT_ROWS : PAIR_ROWS,
    o = (c, r) =>
      s === "pairs"
        ? l.pairs[c][r]
        : s === "soft"
          ? l.soft[c][r]
          : c <= 8
            ? "H"
            : l.hard[c][r];
  return (
    <div className="chart">
      <Segmented
        options={[
          { value: "hard", label: "Duras" },
          { value: "soft", label: "Blandas" },
          { value: "pairs", label: "Pares" },
        ]}
        value={s}
        onChange={n}
      />
      <div
        className="chart-grid"
        role="table"
        aria-label="Tabla de estrategia básica"
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
        {i.map((c) => (
          <div className="chart-row" role="row" key={c.key}>
            <span className="chart-rowlabel" role="rowheader">
              {c.label}
            </span>
            {CHART_COLS.map((r, u) => {
              let d = o(c.key, u),
                p =
                  t &&
                  t.tab === s &&
                  String(t.row) === String(c.key) &&
                  t.col === u;
              return (
                <span
                  role="cell"
                  className={cx("cell", `c-${CHART_CLASS[d]}`, p && "hl")}
                  key={r}
                >
                  {CHART_LETTERS[d]}
                  {CHART_SUBS[d] ? <sub>{CHART_SUBS[d]}</sub> : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span>
          <i className="cell c-hit">P</i>
          {" pedir"}
        </span>
        <span>
          <i className="cell c-stand">Q</i>
          {" plantarse"}
        </span>
        <span>
          <i className="cell c-dbl">D</i>
          {" doblar"}
        </span>
        <span>
          <i className="cell c-split">S</i>
          {" separar"}
        </span>
        {a.surrender || a.h17 ? (
          <span>
            <i className="cell c-surr">R</i>
            {" rendirse"}
          </span>
        ) : null}
      </div>
      <p className="chart-note">
        {"Letra chica: qué hacer si no se permite. "}
        <b>D</b>
        {" sin letra = si no podés doblar, pedí. "}
        <b>
          D<sub>q</sub>
        </b>
        {" = si no podés doblar, plantate."}
        {a.surrender || a.h17
          ? " R con p, q o s = si no hay rendición: pedir, plantarse o separar."
          : ""}
      </p>
    </div>
  );
}
function chartHighlight(a) {
  let e = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "A"].indexOf(a.up);
  if (a.kind === "pair") return { tab: "pairs", row: a.g, col: e };
  if (a.kind === "soft")
    return { tab: "soft", row: Math.min(20, a.total), col: e };
  let t = a.total;
  return { tab: "hard", row: t <= 8 ? 8 : t >= 17 ? 17 : t, col: e };
}
function Toasts({ items: a }) {
  return !a || !a.length ? null : (
    <div className="toasts" aria-live="polite">
      {a.map((e) => (
        <div className={cx("toast", `toast-${e.kind}`)} key={e.id}>
          {e.msg}
        </div>
      ))}
    </div>
  );
}
function Badge({ icon: a, children: e, tone: t, onClick: s, label: n }) {
  return _jsxs(s ? "button" : "span", {
    type: s ? "button" : undefined,
    className: cx("badge", t && `badge-${t}`),
    onClick: s,
    "aria-label": n,
    children: [a, e],
  });
}
function Flame({ size: a = 22, lit: e = true }) {
  return (
    <svg
      width={a}
      height={a}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cx("flame", !e && "off")}
    >
      <defs>
        <linearGradient id="flg" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff5a1f" />
          <stop offset="1" stopColor="#ffb21e" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5c.6 3-1.8 4.6-3.3 6.6-1.3 1.7-2.2 3.4-2.2 5.6A5.5 5.5 0 0 0 12 20.5a5.5 5.5 0 0 0 5.5-5.8c0-2.6-1.4-4.4-2.6-5.6-.2 1.5-.9 2.6-2 3 .7-2.9-.1-6.2-.9-9.6z"
        fill={e ? "url(#flg)" : "currentColor"}
      />
      <path
        d="M12 20.5a3 3 0 0 1-3-3c0-1.7 1.4-2.6 2.2-3.9.4 1 1.2 1.5 1.9 1.6-.1-.6 0-1.3.4-2 .9 1 1.5 2.2 1.5 3.6a3 3 0 0 1-3 3.7z"
        fill={e ? "#ffe7a0" : "transparent"}
        opacity=".9"
      />
    </svg>
  );
}
function RatingGem({ size: a = 22 }) {
  return (
    <svg width={a} height={a} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.8 20.8 6.9v10.2L12 22.2 3.2 17.1V6.9z" fill="#f2a43a" />
      <path
        d="M12 7.2l1.5 3.2 3.4.4-2.5 2.3.7 3.4-3.1-1.8-3.1 1.8.7-3.4-2.5-2.3 3.4-.4z"
        fill="#fff6dc"
      />
    </svg>
  );
}
function useWidth() {
  let a = useRef(null),
    [e, t] = useState(0);
  useEffect(() => {
    if (!a.current) return;
    let s = a.current,
      n = () => t(s.clientWidth);
    n();
    let l;
    try {
      l = new ResizeObserver(n);
      l.observe(s);
    } catch {
      window.addEventListener("resize", n);
    }
    return () => {
      if (l) {
        l.disconnect();
      } else {
        window.removeEventListener("resize", n);
      }
    };
  }, []);
  return [a, e];
}
export {
  Badge,
  Button,
  CHIP_VALUES,
  Chip,
  ChipStack,
  Flame,
  IconButton,
  Keypad,
  Modal,
  Pills,
  PlayingCard,
  ProgressBar,
  RatingGem,
  Ring,
  Segmented,
  Segments,
  Sheet,
  StrategyChart,
  Toasts,
  Toggle,
  chartHighlight,
  cx,
  formatKeypad,
  parseKeypad,
  useWidth,
};
