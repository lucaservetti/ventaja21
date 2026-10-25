// Historial de Entrenar: todas tus tandas, con las manos que fallaste en cada una.
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { Button, cx } from "../ui/components.jsx";
import { ACTION_NAMES } from "../engine/strategy.js";
import { MiniCards, TopBar, spotTitle } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import { shortDate } from "./TrainTab.jsx";

function dayLabel(t) {
  const d = new Date(t);
  const today = new Date();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const same = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (same(d, today)) return "Hoy";
  if (same(d, y)) return "Ayer";
  return shortDate(t);
}
function timeLabel(t) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function toneOf(acc) {
  return acc >= 0.9 ? "good" : acc >= 0.7 ? "mid" : "bad";
}

function TrainHistory({ open = null }) {
  const st = useStore();
  const nav = useNav();
  const [openT, setOpenT] = useState(open);
  const openRef = useRef(null);
  const sessions = useMemo(
    () =>
      st.train.sessions
        .filter((s) => s.kind !== "exam")
        .slice()
        .reverse(),
    [st.train.sessions],
  );
  useEffect(() => {
    if (openRef.current) openRef.current.scrollIntoView({ block: "center" });
  }, []);
  const hands = sessions.reduce((a, s) => a + s.n, 0);
  const ok = sessions.reduce((a, s) => a + s.ok, 0);
  const groups = [];
  for (const s of sessions) {
    const label = dayLabel(s.t);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(s);
    else groups.push({ label, items: [s] });
  }
  const recent = sessions.slice(0, 20).reverse();
  return (
    <div className="train-history fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Historial"
        sub={`${sessions.length} ${sessions.length === 1 ? "tanda" : "tandas"}`}
      />
      {sessions.length ? (
        <>
          <div className="tiles th-tiles">
            <div className="tile">
              <div className="tile-v num">{hands}</div>
              <div className="tile-l">manos</div>
            </div>
            <div className="tile">
              <div className={cx("tile-v num", `t-${toneOf(ok / hands)}`)}>
                {Math.round((ok / hands) * 100)}%
              </div>
              <div className="tile-l">precisión</div>
            </div>
            <div className="tile">
              <div className="tile-v num">{st.rating.peak}</div>
              <div className="tile-l">mejor puntaje</div>
            </div>
          </div>
          <div className="card th-trend">
            <div className="eyebrow">Precisión por tanda</div>
            <div
              className="th-bars"
              aria-label="Precisión de tus últimas tandas"
            >
              {recent.map((s) => (
                <span
                  className={cx("th-bar", toneOf(s.ok / s.n))}
                  style={{ height: `${Math.max(8, (s.ok / s.n) * 100)}%` }}
                  key={s.t}
                />
              ))}
            </div>
            <div className="row between muted tiny">
              <span>más vieja</span>
              <span>última</span>
            </div>
          </div>
          {groups.map((g) => (
            <div key={g.label}>
              <div className="th-day eyebrow">{g.label}</div>
              <div className="list">
                {g.items.map((s) => {
                  const acc = s.ok / s.n;
                  const isOpen = openT === s.t;
                  const missed = s.missHands || [];
                  return (
                    <div
                      className={cx("th-item", isOpen && "open")}
                      ref={isOpen ? openRef : null}
                      key={s.t}
                    >
                      <button
                        type="button"
                        className="list-item"
                        onClick={() => setOpenT(isOpen ? null : s.t)}
                        aria-expanded={isOpen}
                      >
                        <span className={cx("score-pill", toneOf(acc))}>
                          <b className="num">{Math.round(acc * 100)}</b>
                          <span>% bien</span>
                        </span>
                        <span className="li-text">
                          <span className="li-title">{s.title}</span>
                          <span
                            className="li-sub num"
                            style={{ display: "block" }}
                          >
                            {timeLabel(s.t)} · {s.ok}/{s.n} ·{" "}
                            {s.after - s.before >= 0 ? "+" : "−"}
                            {Math.abs(s.after - s.before)} puntaje
                          </span>
                        </span>
                        <Icon
                          name="down"
                          className={cx("li-chev th-chev", isOpen && "up")}
                        />
                      </button>
                      {isOpen ? (
                        <div className="th-detail fade-up">
                          {missed.length ? (
                            <>
                              {missed.map((m, k) => (
                                <div className="th-miss" key={k}>
                                  <MiniCards
                                    ranks={m.cards.slice(0, 2)}
                                    suits={["s", "h"]}
                                  />
                                  <span className="grow">
                                    <b>{spotTitle(m.key)}</b>
                                    <span
                                      className="muted small"
                                      style={{ display: "block" }}
                                    >
                                      Jugaste{" "}
                                      {ACTION_NAMES[m.chosen].toLowerCase()} ·
                                      era{" "}
                                      <b className="acc">
                                        {ACTION_NAMES[m.best].toLowerCase()}
                                      </b>
                                    </span>
                                  </span>
                                </div>
                              ))}
                              <Button
                                small={true}
                                kind="secondary"
                                onClick={() =>
                                  nav.push("trainSession", {
                                    mode: "replay",
                                    hands: missed,
                                    confirmExit: true,
                                  })
                                }
                              >
                                Practicar estas manos
                              </Button>
                            </>
                          ) : s.misses && s.misses.length ? (
                            <p className="muted small">
                              Fallaste:{" "}
                              {s.misses.map((k) => spotTitle(k)).join(", ")}.
                            </p>
                          ) : (
                            <p
                              className="good small"
                              style={{ fontWeight: 700 }}
                            >
                              Sin errores en esta tanda.
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="card flat center muted" style={{ padding: 28 }}>
          <Icon name="layers" size={34} />
          <p style={{ marginTop: 8 }}>Todavía no hiciste ninguna tanda.</p>
        </div>
      )}
    </div>
  );
}

export { TrainHistory };
