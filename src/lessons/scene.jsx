import { useEffect, useMemo, useRef } from "react";
import { withRules } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { handValue, isBlackjack, parseCard } from "../engine/cards.js";
import { PlayingCard, cx } from "../ui/components.jsx";
import { dealerDist, evFor, rankNum } from "../engine/ev.js";
import { fmtSigned, fmtTag, hiloValue } from "../engine/systems.js";
import { Logo } from "../ui/common.jsx";
import { ACTION_EN } from "../engine/strategy.js";
import { BustCards, MiniChart, rich } from "./visuals.jsx";

const sceneCardCache = new Map();
function sceneCard(a, e, t) {
  let s = a.endsWith("?"),
    n = s ? a.slice(0, -1) : a,
    l = `${t}-${e}-${n === "X" ? "X" : n}`;
  if (!sceneCardCache.has(l)) {
    sceneCardCache.set(l, { ...parseCard(n === "X" ? "2s" : n), id: l });
  }
  return { card: sceneCardCache.get(l), hidden: s, key: l };
}
function sceneCards(a, e) {
  return (a || []).map((t, s) => sceneCard(t, s, e));
}
const visibleCards = (a) => a.filter((e) => !e.hidden).map((e) => e.card);
const STAMPS = {
  bust: { t: "Se pasó", tone: "bad" },
  pbust: { t: "Te pasaste", tone: "bad" },
  win: { t: "Ganás", tone: "acc" },
  lose: { t: "Perdés", tone: "bad" },
  push: { t: "Empate", tone: "mute" },
  bj: { t: "Blackjack", tone: "acc" },
  surrender: { t: "Te rendiste", tone: "mute" },
};
function Stamp({ kind: a, who: e }) {
  if (!a) return null;
  let t = STAMPS[a === "bust" && e === "p" ? "pbust" : a];
  return t ? (
    <span className={cx("stamp", `stamp-${t.tone}`)}>{t.t}</span>
  ) : null;
}
function SceneCards({
  list: a,
  owner: e,
  stamp: t,
  newLast: s,
  hlUp: n,
  size: l = "lg",
  tags = false,
}) {
  return a.length ? (
    <div className="scn-stack">
      <div className={cx("card-row overlap scn-row", `cr-${l}`)}>
        {a.map((i, o) =>
          tags && !i.hidden ? (
            <span className="scn-tagged" key={i.key}>
              <PlayingCard
                card={i.card}
                size={l}
                deal={true}
                className={cx(
                  (s && o === a.length - 1) || (n && o === 0) ? "pc-hl" : null,
                )}
              />
              <HiloTag card={i.card} />
            </span>
          ) : (
            <PlayingCard
              card={i.card}
              size={l}
              deal={true}
              down={i.hidden}
              className={cx(
                (s && o === a.length - 1) || (n && o === 0) ? "pc-hl" : null,
              )}
              key={i.key}
            />
          ),
        )}
      </div>
      <Stamp kind={t} who={e} />
    </div>
  ) : (
    <div className="scn-stack empty" aria-hidden="true">
      <span className={cx("slot-ghost", `sg-${l}`)} />
      <span className={cx("slot-ghost", `sg-${l}`)} />
    </div>
  );
}
function HiloTag({ card }) {
  const v = hiloValue(card);
  return (
    <span className={cx("scn-tag num", v > 0 ? "pos" : v < 0 ? "neg" : "")}>
      {fmtTag(v)}
    </span>
  );
}
// Otros jugadores sentados a la mesa (para contar todas las cartas, no solo las tuyas).
function SceneOthers({ others, tags }) {
  return (
    <div className="scn-others">
      {others.map((o, k) => {
        const list = sceneCards(o.cards, "o" + k);
        const v = handValue(visibleCards(list));
        return (
          <div className="scn-other" key={k}>
            <SceneCards list={list} owner={"o" + k} size="sm" tags={tags} />
            <span className="tiny muted">
              {o.name}
              {list.length ? ` · ${v.bust ? "se pasó" : v.total}` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
function sceneTotal(a, e = false) {
  if (!a.length) return null;
  let t = handValue(a);
  return t.bust
    ? { n: t.hard, l: "te pasaste", tone: "bad" }
    : isBlackjack(a, e)
      ? { n: 21, l: "blackjack", tone: "acc" }
      : { n: t.total, l: t.soft ? "blando" : "duro" };
}
function SceneTotal({ cards: a, hl: e, fromSplit: t }) {
  let s = sceneTotal(a, t);
  return s ? (
    <span className={cx("scn-total num", e && "hl", s.tone && `t-${s.tone}`)}>
      <b>{s.n}</b> {s.l}
    </span>
  ) : (
    <span className="scn-total ghost" />
  );
}
function DealerMeter({ cards: a }) {
  let e = a.length ? handValue(a) : null,
    t = e ? (e.bust ? e.hard : e.total) : null,
    s = t === null ? null : t > 21 ? "bust" : t >= 17 ? "stand" : "hit",
    n =
      t === null
        ? null
        : ((Math.min(22, Math.max(12, t)) - 12 + 0.5) / 11) * 100;
  return (
    <div
      className="meter"
      aria-label={t === null ? "Medidor del crupier" : `El crupier tiene ${t}`}
    >
      <div className="meter-nums">
        <span style={{ left: `${(0.5 / 11) * 100}%` }}>12</span>
        <span style={{ left: `${(5 / 11) * 100}%` }}>17</span>
        <span style={{ left: `${(9.5 / 11) * 100}%` }}>21</span>
      </div>
      <div className="meter-track">
        {Array.from({ length: 11 }, (l, i) => (
          <i
            className={cx(i < 5 ? "m-hit" : i < 10 ? "m-stand" : "m-bust")}
            key={i}
          />
        ))}
        <span className="meter-tick" style={{ left: `${(5 / 11) * 100}%` }} />
        {n !== null ? (
          <span
            className={cx("meter-dot num", s === "bust" && "bad")}
            style={{ left: `${n}%` }}
          >
            {t}
          </span>
        ) : null}
      </div>
      <div className="meter-labels">
        <span className={cx(s === "hit" && "on")}>Pide</span>
        <span className={cx(s === "stand" && "on")}>Se planta</span>
        <span className={cx(s === "bust" && "on bad")}>Se pasa</span>
      </div>
    </div>
  );
}
const BUST_UPS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
const bustCacheCond = {};
function bustByUp(a) {
  let e = a ? "h" : "s";
  if (!bustCacheCond[e]) {
    let t = {};
    for (let s of BUST_UPS) {
      t[s] = dealerDist(s, a, { conditionNoBJ: true })[5];
    }
    bustCacheCond[e] = t;
  }
  return bustCacheCond[e];
}
const upChar = (a) => (a === 1 ? "A" : String(a));
function BustBig({ hl: a = [], groups: e = false, h17: t = false }) {
  let s = bustByUp(t),
    n = Math.max(...BUST_UPS.map((l) => s[l]));
  return (
    <div className="bust-big">
      <div className="eyebrow center">El crupier se pasa, veces en 100</div>
      <div className="bb-bars">
        {BUST_UPS.map((l) => {
          let i = s[l],
            o = e ? l >= 2 && l <= 6 : a.includes(l),
            c =
              !e &&
              a.length &&
              a[a.length - 1] === l &&
              a.length > 1 &&
              !(l >= 2 && l <= 6) &&
              a.length === 2;
          return (
            <div className="bb-col" key={l}>
              <span className={cx("bb-v num", (o || c) && !e ? "show" : "")}>
                {Math.round(i * 100)}
              </span>
              <span
                className={cx("bb-bar", o && "on", c && "alt")}
                style={{ height: `${(i / n) * 100}%` }}
              />
              <span className={cx("bb-up", (o || c) && "on")}>{upChar(l)}</span>
            </div>
          );
        })}
      </div>
      {e ? (
        <div className="bb-groups">
          <span className="on">Se pasa seguido</span>
          <span>Suele armar su mano</span>
        </div>
      ) : null}
    </div>
  );
}
function BustMini({ upRank: a, h17: e = false }) {
  let t = bustByUp(e),
    s = rankNum(a),
    n = Math.max(...BUST_UPS.map((l) => t[l]));
  return (
    <div className="bust-mini">
      <div className="bm-chart">
        <div className="bm-bars">
          {BUST_UPS.map((l) => (
            <span
              className={cx("bm-bar", l === s && "on")}
              style={{ height: `${(t[l] / n) * 100}%` }}
              key={l}
            />
          ))}
        </div>
        <div className="bm-ups">
          {BUST_UPS.map((l) => (
            <span className={cx(l === s && "on")} key={l}>
              {upChar(l)}
            </span>
          ))}
        </div>
        <div className="eyebrow center bm-cap">El crupier se pasa</div>
      </div>
      <div className="bm-num">
        <b className="num">{Math.round(t[s] * 100)}</b>
        <span>de 100</span>
      </div>
    </div>
  );
}
function Dots100({ n: a, label: e }) {
  return (
    <div className="dots100">
      <div className="dots-grid" aria-hidden="true">
        {Array.from({ length: 100 }, (t, s) => (
          <i
            className={cx(s < a && "on")}
            style={{ animationDelay: `${s * 6}ms` }}
            key={s}
          />
        ))}
      </div>
      <div
        className="eyebrow center"
        style={{ marginTop: 10, color: "var(--text)" }}
      >
        {e}
      </div>
    </div>
  );
}
function roundPercents(a) {
  let e = a.map((l) => l * 100),
    t = e.map(Math.floor),
    s = 100 - t.reduce((l, i) => l + i, 0),
    n = e.map((l, i) => [l - t[i], i]).sort((l, i) => i[0] - l[0]);
  for (let [, l] of n) {
    if (s <= 0) break;
    t[l]++;
    s--;
  }
  return t;
}
const OUTCOME_NAMES = { S: "Plantarse", H: "Pedir" };
function Outcomes({
  playerCards: a,
  upRank: e,
  plays: t = ["S", "H"],
  net: s = false,
  rules: n,
}) {
  let l = useMemo(() => {
      let d = withRules(n || {}),
        p = evFor(d).forUp(rankNum(e)),
        f = 0,
        y = false;
      for (let C of a) {
        let k = rankNum(C.r);
        f += k;
        if (k === 1) {
          y = true;
        }
      }
      return t.map((C) => {
        let k = C === "S" ? p.standOut(f, y) : p.hitOut(f, y),
          [v, m, b] = roundPercents([k.w, k.t, k.l]);
        return { p: C, w: v, t: m, l: b, ev: (k.w - k.l) * 100 };
      });
    }, [a.map((d) => d.r).join(), e, t.join(), JSON.stringify(n || {})]),
    i = l.reduce((d, p) => (p.ev > d.ev ? p : d), l[0]),
    o = l.reduce((d, p) => (p.ev < d.ev ? p : d), l[0]),
    c = i.ev - o.ev,
    r = handValue(a).total,
    u = e === "A" ? "As" : ["J", "Q", "K"].includes(e) ? "10" : e;
  return (
    <div className="outcomes">
      <div className="eyebrow center">
        {r}
        {" contra "}
        {u}, en 100 manos
      </div>
      {l.map((d) => (
        <div className="oc-row" key={d.p}>
          <span className={cx("oc-name", s && d.p === i.p && "acc")}>
            {OUTCOME_NAMES[d.p]}
          </span>
          <span className="oc-bar">
            <i className="oc-w" style={{ flex: d.w }}>
              {d.w >= 7 ? d.w : ""}
            </i>
            {d.t ? (
              <i className="oc-t" style={{ flex: d.t }}>
                {d.t >= 4 ? d.t : ""}
              </i>
            ) : null}
            <i className="oc-l" style={{ flex: d.l }}>
              {d.l >= 7 ? d.l : ""}
            </i>
          </span>
          {s ? (
            <b className={cx("oc-net num", d.ev < 0 ? "bad" : "good")}>
              {fmtSigned(Math.round(d.ev))}
            </b>
          ) : null}
        </div>
      ))}
      <div className="oc-legend">
        <span>
          <i className="oc-w" />
          {" gana"}
        </span>
        <span>
          <i className="oc-t" />
          {" empata"}
        </span>
        <span>
          <i className="oc-l" />
          {" pierde"}
        </span>
      </div>
      {s ? (
        <div className="eyebrow center oc-verdict">
          {c < 1
            ? `${OUTCOME_NAMES[i.p]} va apenas adelante`
            : `${OUTCOME_NAMES[i.p]} pierde ${Math.round(c)} apuestas menos`}
        </div>
      ) : null}
    </div>
  );
}
function ChipsRow({ items: a }) {
  return (
    <div className="chips-row">
      {a.map((e, t) => (
        <div className="cr-item" key={t}>
          <span className={cx("mini-chip num", e.tone && `mc-${e.tone}`)}>
            {e.v}
          </span>
          <span
            className={cx(
              "eyebrow",
              e.tone === "acc" && "acc",
              e.tone === "bad" && "bad",
            )}
          >
            {e.l}
          </span>
        </div>
      ))}
    </div>
  );
}
function BetChip({ v: a }) {
  return a ? <span className="bet-chip num">{a}</span> : null;
}
function SceneTable({ step: a }) {
  let e = sceneCards(a.d, "d"),
    t = visibleCards(e),
    s = a.hands ? a.hands.map((u, d) => sceneCards(u, "h" + d)) : null,
    n = s ? [] : sceneCards(a.p, "p"),
    l = visibleCards(n),
    i = a.stamp || {},
    o = a.hl === "up" || a.hl === "both",
    c = a.hl === "total" || a.hl === "both",
    r = e.length ? e[0].card.r : null;
  // Sin cartas en la mesa pero con conteo: un tablero grande con el corrido, los mazos y el real.
  const hasCount =
    (a.rc !== undefined && a.rc !== null) ||
    (a.left !== undefined && a.left !== null);
  if (
    hasCount &&
    !e.length &&
    !n.length &&
    !s &&
    !(a.others && a.others.some((o) => o.cards.length))
  ) {
    return <SceneBoard step={a} />;
  }
  return (
    <div className="scn-table">
      <div className="scn-deco" aria-hidden="true">
        <span className="scn-tray-wrap">
          <span className="scn-tray" />
          {a.left !== undefined && a.left !== null ? (
            <span className="scn-left num">quedan {a.left}</span>
          ) : null}
        </span>
        <span className="scn-counts">
          {a.rc !== undefined && a.rc !== null ? (
            <span className="scn-tc scn-rc">
              <span className="eyebrow">Corrido</span>
              <b
                className={cx("num", a.rc > 0 ? "good" : a.rc < 0 ? "bad" : "")}
              >
                {fmtSigned(a.rc)}
              </b>
            </span>
          ) : null}
          {a.tc !== undefined && a.tc !== null ? (
            <span className="scn-tc">
              <span className="eyebrow">
                {a.rc !== undefined && a.rc !== null ? "Real" : "Conteo real"}
              </span>
              <b
                className={cx("num", a.tc > 0 ? "good" : a.tc < 0 ? "bad" : "")}
              >
                {fmtSigned(a.tc)}
              </b>
            </span>
          ) : null}
        </span>
        <span className="scn-shoe">
          <Icon name="shoe" size={26} />
        </span>
      </div>
      <div className="scn-seat">
        <span className="eyebrow">Crupier</span>
        <SceneCards
          list={e}
          owner="d"
          stamp={i.d}
          newLast={a.newD}
          hlUp={o}
          tags={a.tags}
        />
        {o ? (
          <span className="eyebrow scn-hl-lbl">La carta visible</span>
        ) : null}
        {a.meter && t.length ? <DealerMeter cards={t} /> : null}
        {a.bustMini && r ? <BustMini upRank={r} /> : null}
      </div>
      {a.others && a.others.length ? (
        <SceneOthers others={a.others} tags={a.tags} />
      ) : null}
      {a.outcomes && r && l.length ? (
        <Outcomes
          playerCards={l}
          upRank={r}
          plays={a.outcomes.plays}
          net={a.outcomes.net}
          rules={a.rules}
        />
      ) : null}
      <div className="scn-seat">
        <div className="scn-you">
          <span className="eyebrow">Vos</span>
          {s ? null : <BetChip v={a.bet} />}
        </div>
        {s ? (
          <div className="scn-hands">
            {s.map((u, d) => (
              <div className="scn-hand" key={d}>
                <BetChip v={a.bet} />
                <SceneCards
                  list={u}
                  owner={"h" + d}
                  size="md"
                  stamp={Array.isArray(i.p) ? i.p[d] : null}
                />
                <SceneTotal cards={visibleCards(u)} fromSplit={true} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <SceneCards
              list={n}
              owner="p"
              stamp={i.p}
              newLast={a.newP}
              tags={a.tags}
            />
            <SceneTotal cards={l} hl={c} />
            {c ? (
              <span className="eyebrow acc scn-hl-lbl">Tu total</span>
            ) : null}
          </>
        )}
      </div>
      {a.dots ? <Dots100 n={a.dots.n} label={a.dots.label} /> : null}
    </div>
  );
}
// El cartel de la mesa, con las reglas que importan.
function SceneSign({ items }) {
  return (
    <div className="scn-sign" key={items.map((i) => i.v).join()}>
      <div className="eyebrow center">Cartel de la mesa</div>
      {items.map((i) => (
        <div className="scn-sign-row" key={i.k}>
          <span>{i.k}</span>
          <b
            className={cx(
              i.tone === "good" && "good",
              i.tone === "bad" && "bad",
            )}
          >
            {i.v}
          </b>
        </div>
      ))}
    </div>
  );
}
function SceneBoard({ step: a }) {
  const tile = (label, value, tone, key) => (
    <div className={cx("scn-board-tile", tone)} key={key}>
      <span className="eyebrow">{label}</span>
      <b className="num">{value}</b>
    </div>
  );
  return (
    <div className="scn-board">
      {a.rc !== undefined && a.rc !== null
        ? tile(
            "Conteo corrido",
            fmtSigned(a.rc),
            a.rc > 0 ? "good" : a.rc < 0 ? "bad" : "",
            "rc" + a.rc,
          )
        : null}
      {a.left !== undefined && a.left !== null
        ? tile(
            "Mazos que quedan",
            String(a.left).replace(".", ","),
            "",
            "l" + a.left,
          )
        : null}
      {a.tc !== undefined && a.tc !== null
        ? tile("Conteo real", fmtSigned(a.tc), "acc", "tc" + a.tc)
        : a.rc !== undefined && a.rc !== null && a.left
          ? tile("Conteo real", "?", "muted", "tcq")
          : null}
      {a.bet ? (
        <div className="scn-board-bet">
          <span className="eyebrow">Tu apuesta</span>
          <BetChip v={a.bet} />
        </div>
      ) : null}
    </div>
  );
}
function SceneRow({ codes: a, tags: e }) {
  let t = sceneCards(a, "r");
  return (
    <div className="scn-rowview">
      <div className="scn-rowcards">
        {t.map((s) => (
          <div className="center" key={s.key}>
            <PlayingCard card={s.card} size="md" deal={true} />
            {e ? (
              <span
                className={cx(
                  "tiny num",
                  hiloValue(s.card) > 0
                    ? "good"
                    : hiloValue(s.card) < 0
                      ? "bad"
                      : "muted",
                )}
              >
                {fmtTag(hiloValue(s.card))}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
const PLAY_NAMES = {
  H: "Pedir",
  S: "Plantarse",
  D: "Doblar",
  P: "Separar",
  R: "Rendirse",
};
const ACT_CLS = { H: "hit", S: "stand", D: "dbl", P: "split", R: "surr" };
function Scene({ step: a, picked: e, onPick: t }) {
  // En pantallas bajas, que el texto del coach siempre quede a la vista.
  const sayRef = useRef(null);
  useEffect(() => {
    if (sayRef.current && sayRef.current.scrollIntoView)
      sayRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [a.sceneId, a.beat, e]);
  let s = a.chart
      ? typeof a.chart == "string"
        ? { tab: a.chart }
        : a.chart
      : null,
    n = a.bust ? (
      <BustBig hl={a.bust.hl} groups={a.bust.groups} />
    ) : a.bustcards ? (
      <BustCards />
    ) : s ? (
      <div className="scn-chart">
        <div className="eyebrow center" style={{ marginBottom: 12 }}>
          Tu total contra la carta del crupier
        </div>
        <MiniChart
          tab={s.tab}
          rows={s.rows}
          hl={s.hl}
          fixedRules={withRules(a.rules || {})}
        />
      </div>
    ) : a.row ? (
      <SceneRow codes={a.row} tags={a.tags} />
    ) : a.sign ? (
      <SceneSign items={a.sign} />
    ) : a.chips ? (
      <ChipsRow items={a.chips} />
    ) : (
      <SceneTable step={a} />
    ),
    l = a.ask,
    i = a.play,
    o = e != null,
    c = null;
  if (o && l) {
    c = {
      ok: e === l.a,
      title: l.o[l.a],
      text: (e === l.a ? "" : `Elegiste "${l.o[e]}". `) + l.x,
    };
  }
  if (o && i) {
    c = {
      ok: e === i.a,
      title: PLAY_NAMES[i.a],
      text:
        (e === i.a ? "Bien. " : `Elegiste ${PLAY_NAMES[e].toLowerCase()}. `) +
        i.x,
    };
  }
  let r = a.say || (l ? l.q : "");
  return (
    <div className="scene">
      <div className="scene-stage">{n}</div>
      <div className="scene-say" key={"say" + a.beat} ref={sayRef}>
        <div className="coach-tag">
          <Logo size={18} />
          {" Mentor"}
        </div>
        <p className="say-text">{rich(r)}</p>
        {l && a.say ? <p className="say-text say-q">{rich(l.q)}</p> : null}
        {l && !o ? (
          <div
            className={cx("options", l.o.length === 2 && "grid2")}
            style={{ marginTop: 14 }}
          >
            {l.o.map((u, d) => (
              <button
                type="button"
                className="option"
                onClick={() => t(d)}
                key={d}
              >
                <span>{u}</span>
              </button>
            ))}
          </div>
        ) : null}
        {c ? (
          <div
            className={cx("ask-fb fade-up", c.ok ? "ok" : "bad")}
            role="status"
          >
            <b>
              <Icon name={c.ok ? "check" : "x"} size={16} stroke={3} />{" "}
              {c.title}
            </b>
            <p>{rich(c.text)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
function SceneActions({ act: a, opts: e, onAct: t, surrender: s }) {
  let n = a === "R" || s ? ["H", "S", "D", "R"] : ["H", "S", "D", "P"],
    l = (i) => (a ? i === a : e.includes(i));
  return (
    <div className="act-row">
      {n.map((i) => (
        <button
          type="button"
          className={cx("act-mini", a && i === a && "go")}
          disabled={!l(i)}
          onClick={() => t(i)}
          key={i}
        >
          <span className={cx("act-letter", `c-${ACT_CLS[i]}`)}>{i}</span>
          <span>{PLAY_NAMES[i]}</span>
          <span className="act-en">{ACTION_EN[i]}</span>
        </button>
      ))}
    </div>
  );
}
export { Scene, SceneActions };
