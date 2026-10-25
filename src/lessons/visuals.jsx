import { useMemo } from "react";
import { handValue, parseCard } from "../engine/cards.js";
import {
  CHART_CLASS,
  CHART_LETTERS,
  CHART_SUBS,
  FAB_4,
  ILLUSTRIOUS_18,
  indexFor,
  strategyFor,
} from "../engine/strategy.js";
import { ChartLegend, PlayingCard, chartCode, cx } from "../ui/components.jsx";
import { bustChances } from "../engine/ev.js";
import { BET_RAMP } from "../engine/systems.js";
import { useRules } from "../ui/common.jsx";

function rich(a) {
  return typeof a != "string"
    ? a
    : a.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((t, s) =>
        t.startsWith("**") && t.endsWith("**") ? (
          <b key={s}>{t.slice(2, -2)}</b>
        ) : t.length > 2 && t.startsWith("*") && t.endsWith("*") ? (
          <i className="en" key={s}>
            {t.slice(1, -1)}
          </i>
        ) : (
          t
        ),
      );
}
function useCards(a) {
  return useMemo(
    () =>
      (a || []).map((e) =>
        e === "X" ? { ...parseCard("2s"), hidden: true } : parseCard(e),
      ),
    [a && a.join(",")],
  );
}
function CardCodes({ codes: a, size: e = "md" }) {
  let t = useCards(a);
  return (
    <div
      className="card-row"
      style={{ justifyContent: "center", flexWrap: "wrap" }}
    >
      {t.map((s) => (
        <PlayingCard card={s} size={e} down={s.hidden} deal={true} key={s.id} />
      ))}
    </div>
  );
}
function Visual({ v: a }) {
  if (!a) return null;
  switch (a.v) {
    case "hands":
      return <HandsVisual {...a} />;
    case "hands2":
      return (
        <div className="vis vis-two">
          {[a.a, a.b].map((e, t) => (
            <div className="center" key={t}>
              <CardCodes codes={e.cards} size="md" />
              <div className="vis-cap">{e.label}</div>
            </div>
          ))}
        </div>
      );
    case "cards":
      return (
        <div className="vis center">
          <CardCodes codes={a.cards} size={a.cards.length > 4 ? "sm" : "md"} />
          {a.caption ? <div className="vis-cap">{a.caption}</div> : null}
        </div>
      );
    case "values-basic":
      return (
        <div className="vis vals">
          <div className="val-box">
            <b>2 al 10</b>
            <span>su número</span>
          </div>
          <div className="val-box">
            <b>J Q K</b>
            <span>valen 10</span>
          </div>
          <div className="val-box acc">
            <b>A</b>
            <span>1 u 11</span>
          </div>
        </div>
      );
    case "values":
      return <HiLoValues />;
    case "tiles":
      return (
        <div className={cx("vis tiles", a.items.length === 2 && "two")}>
          {a.items.map((e, t) => (
            <div className="tile" key={t}>
              <div className={cx("tile-v", e.tone && `t-${e.tone}`)}>{e.v}</div>
              <div className="tile-l">{e.l}</div>
            </div>
          ))}
        </div>
      );
    case "outcomes":
      return (
        <div className="vis list">
          {a.items.map((e, t) => (
            <div className="list-item" key={t}>
              <span className="li-text li-title" style={{ fontSize: 17 }}>
                {e.l}
              </span>
              <span className={cx("li-side", e.tone)}>{e.r}</span>
            </div>
          ))}
        </div>
      );
    case "bust":
      return <BustChart />;
    case "chart":
      return <MiniChart tab={a.tab} rows={a.rows} />;
    case "tray":
      return <TrayVisual shoe={a.shoe} played={a.played} />;
    case "payout":
      return (
        <div className="vis tiles two">
          <div className="tile">
            <div className="tile-v t-good">$15</div>
            <div className="tile-l">cobrás con $10 en una mesa 3:2</div>
          </div>
          <div className="tile">
            <div className="tile-v t-bad">$12</div>
            <div className="tile-l">cobrás con $10 en una mesa 6:5</div>
          </div>
        </div>
      );
    case "tc":
      return (
        <div className="vis tc-formula">
          <div className="tcf-box">
            <span className="eyebrow">Corrido</span>
            <b className="good">+{a.rc}</b>
          </div>
          <span className="tcf-op">÷</span>
          <div className="tcf-box">
            <span className="eyebrow">Mazos</span>
            <b>{a.decks}</b>
          </div>
          <span className="tcf-op">=</span>
          <div className="tcf-box acc">
            <span className="eyebrow">Real</span>
            <b>+{a.rc / a.decks}</b>
          </div>
        </div>
      );
    case "edge":
      return (
        <div className="vis edge-table">
          {[-1, 0, 1, 2, 3, 4, 5].map((e) => {
            let t = -0.5 + 0.5 * e;
            return (
              <div className="edge-row" key={e}>
                <span className="num">
                  {"CR "}
                  {e > 0 ? "+" : e < 0 ? "−" : ""}
                  {Math.abs(e)}
                </span>
                <span className="edge-bar">
                  <i
                    className={t > 0 ? "pos" : t < 0 ? "neg" : ""}
                    style={{ width: `${Math.min(100, Math.abs(t) * 40)}%` }}
                  />
                </span>
                <b className={cx("num", t > 0 ? "good" : t < 0 ? "bad" : "")}>
                  {t > 0 ? "+" : t < 0 ? "−" : ""}
                  {Math.abs(t).toFixed(1).replace(".", ",")}
                  {" %"}
                </b>
              </div>
            );
          })}
          <p className="muted tiny" style={{ marginTop: 8 }}>
            Ventaja aproximada del jugador, 6 mazos.
          </p>
        </div>
      );
    case "ramp":
      return <BetRamp />;
    case "devlist":
      return <DevList which={a.which} />;
    default:
      return null;
  }
}
function HandsVisual({ dealer: a, player: e, caption: t }) {
  let s = useCards(a),
    n = useCards(e);
  return (
    <div className="vis hands-vis">
      <div className="hv-row">
        <span className="eyebrow">Crupier</span>
        <div className="card-row">
          {s.map((l) => (
            <PlayingCard card={l} size="sm" deal={true} key={l.id} />
          ))}
        </div>
        <b className="num">{handValue(s).total}</b>
      </div>
      <div className="hv-row">
        <span className="eyebrow acc">Vos</span>
        <div className="card-row">
          {n.map((l) => (
            <PlayingCard card={l} size="sm" deal={true} key={l.id} />
          ))}
        </div>
        <b className="num acc">{handValue(n).total}</b>
      </div>
      {t ? <div className="vis-cap">{t}</div> : null}
    </div>
  );
}
function HiLoValues({ sysValues: a }) {
  return (
    <div className="vis hilo">
      <div className="hilo-box">
        <b className="good">+1</b>
        <span className="hilo-cards">2 3 4 5 6</span>
        <span className="muted">bajas</span>
      </div>
      <div className="hilo-box wide">
        <b>0</b>
        <span className="hilo-cards">7 8 9</span>
        <span className="muted">neutras</span>
      </div>
      <div className="hilo-box">
        <b className="bad">−1</b>
        <span className="hilo-cards">10 J Q K A</span>
        <span className="muted">altas</span>
      </div>
    </div>
  );
}
function BustChart() {
  let a = useRules(),
    e = bustChances(a.h17);
  return (
    <div className="vis bust-chart">
      <div className="bust-bars">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 1].map((s) => {
          let n = e[s];
          return (
            <div className="bust-col" key={s}>
              <span className="bust-pct num">{Math.round(n * 100)}</span>
              <span
                className={cx("bust-bar", s >= 2 && s <= 6 ? "weak" : "strong")}
                style={{ height: `${n * 220}%` }}
              />
              <span className="bust-up">{s === 1 ? "A" : s}</span>
            </div>
          );
        })}
      </div>
      <p className="muted tiny center" style={{ marginTop: 10 }}>
        % de veces que el crupier se pasa según su carta visible
      </p>
    </div>
  );
}
const ROW_LABELS = {
  hard: (a) => (a <= 8 ? "5–8" : a >= 17 ? "17+" : String(a)),
  soft: (a) => `A,${a - 11}`,
  pairs: (a) => (a === "T" ? "10,10" : `${a},${a}`),
};
function MiniChart({
  tab: a,
  rows: e,
  hl: t = null,
  fixedRules: s = null,
  caption: n = true,
}) {
  let l = useRules(),
    i = s || l,
    o = strategyFor(i),
    r =
      e ||
      (a === "hard"
        ? [17, 16, 15, 14, 13, 12, 11, 10, 9, 8]
        : a === "soft"
          ? [20, 19, 18, 17, 16, 15, 14, 13]
          : ["A", "T", "9", "8", "7", "6", "5", "4", "3", "2"]),
    u = (f, y) =>
      chartCode(
        a === "pairs"
          ? o.pairs[f][y]
          : a === "soft"
            ? o.soft[f][y]
            : f <= 8
              ? "H"
              : o.hard[f][y],
        i,
      ),
    d = new Set();
  for (let f of r)
    for (let y = 0; y < 10; y++) {
      d.add(CHART_CLASS[u(f, y)]);
    }
  return (
    <div className={cx("vis mini-chart", t && "has-hl")}>
      <div className="chart-row chart-headrow">
        <span className="chart-rowlabel" />
        {["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"].map((f) => (
          <span className="chart-col" key={f}>
            {f}
          </span>
        ))}
      </div>
      {r.map((f) => (
        <div className="chart-row" key={f}>
          <span className="chart-rowlabel">{ROW_LABELS[a](f)}</span>
          {Array.from({ length: 10 }, (y, C) => {
            let k = u(f, C),
              v = t && String(t[0]) === String(f) && t[1] === C;
            return (
              <span
                className={cx("cell", `c-${CHART_CLASS[k]}`, v && "hl")}
                key={C}
              >
                {CHART_LETTERS[k]}
                {CHART_SUBS[k] ? <sub>{CHART_SUBS[k]}</sub> : null}
              </span>
            );
          })}
        </div>
      ))}
      <ChartLegend
        show={[
          ["H", "hit"],
          ["S", "stand"],
          ["D", "dbl"],
          ["P", "split"],
          ["R", "surr"],
        ]
          .filter(([, cls]) => d.has(cls))
          .map(([l]) => l)}
        style={{ marginTop: 10 }}
      />
      {n ? (
        <p className="chart-cap">
          {i.h17
            ? "El crupier pide con 17 blando (H17)"
            : "El crupier se planta con 17 blando (S17)"}
        </p>
      ) : null}
    </div>
  );
}
function BustCards() {
  let a = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"],
    e = (t) => (t === "A" ? 1 : ["10", "J", "Q", "K"].includes(t) ? 10 : +t);
  return (
    <div className="vis bust-cards">
      <div className="eyebrow center">
        Las cartas que te pasan con cada total
      </div>
      {[12, 13, 14, 15, 16].map((t) => (
        <div className="bc-row" key={t}>
          <b className="num">{t}</b>
          {a.map((s) => (
            <span className={cx("bc-cell", t + e(s) > 21 && "bust")} key={s}>
              {s}
            </span>
          ))}
        </div>
      ))}
      <div className="chart-legend" style={{ marginTop: 10 }}>
        <span>
          <i className="bc-cell bust" />
          {" te pasa"}
        </span>
      </div>
    </div>
  );
}
function TrayVisual({ shoe: a, played: e }) {
  return (
    <div className="vis tray-vis">
      <div className="tv-box">
        <div className="tv-fill" style={{ height: `${(e / a) * 100}%` }} />
        {Array.from({ length: a - 1 }, (t, s) => (
          <span
            className="tv-mark"
            style={{ bottom: `${((s + 1) / a) * 100}%` }}
            key={s}
          >
            <i>{s + 1}</i>
          </span>
        ))}
      </div>
      <div className="tv-legend">
        <div>
          <span className="eyebrow">En la bandeja</span>
          <b className="num">
            {e}
            {" mazos"}
          </b>
        </div>
        <div>
          <span className="eyebrow acc">Quedan</span>
          <b className="num acc">
            {a - e}
            {" mazos"}
          </b>
        </div>
      </div>
    </div>
  );
}
function BetRamp({ highlight: a = null }) {
  return (
    <div className="vis ramp">
      {BET_RAMP.map((e, t) => (
        <div className={cx("ramp-cell", a === t && "on")} key={t}>
          <span className="ramp-tc">{e.tc}</span>
          <b className="num">{e.units}</b>
          <span className="tiny muted">
            {e.units === 1 ? "unidad" : "unidades"}
          </span>
        </div>
      ))}
    </div>
  );
}
const DEV_VERBS = {
  S: "Plantate",
  D: "Doblá",
  P: "Separá",
  H: "Pedí",
  R: "Rendite",
  I: "Tomá el seguro",
};
function DevList({ which: a = "top" }) {
  let e = useRules(),
    t;
  if (a === "fab4") {
    t = FAB_4;
  } else {
    if (a === "neg") {
      t = ILLUSTRIOUS_18.filter((s) => indexFor(s, e) < 0 || s.id === "12v4");
    } else {
      if (a === "all") {
        t = ILLUSTRIOUS_18;
      } else {
        t = ILLUSTRIOUS_18.filter(
          (s) => indexFor(s, e) >= 0 && s.id !== "12v4",
        ).slice(0, 13);
      }
    }
  }
  return (
    <div className="vis dev-list">
      {t.map((s) => {
        let n = indexFor(s, e),
          l = a === "neg",
          i = n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0";
        return (
          <div className="dev-row" key={s.id}>
            <span className="dev-hand">{s.label}</span>
            <span className="dev-act">
              {l
                ? `${DEV_VERBS[s.below]} por debajo de`
                : `${DEV_VERBS[s.at]} desde`}
            </span>
            <span
              className={cx("dev-idx num", n > 0 ? "pos" : n < 0 ? "neg" : "")}
            >
              {i}
            </span>
          </div>
        );
      })}
      <p className="muted tiny" style={{ marginTop: 10 }}>
        {"Índices Hi-Lo para "}
        {e.h17 ? "mesas H17" : "mesas S17"}
        {" de 4 a 8 mazos."}
      </p>
    </div>
  );
}
export { BetRamp, BustCards, HiLoValues, MiniChart, Visual, rich, useCards };
