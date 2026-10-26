// Tarjetas de la tabla: cada casilla de la estrategia básica es una tarjeta con repaso espaciado.
// La acertás y vuelve en 1, 3, 7, 14, 30 y 60 días; la fallás y vuelve hoy mismo.
import { useMemo } from "react";
import { dayKey } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import {
  HARD_ROWS,
  PAIR_ROWS,
  ProgressBar,
  SOFT_ROWS,
} from "../ui/components.jsx";
import { UPS } from "../engine/trainer.js";
import { lessonIndex } from "../lessons/content.js";
import { ROW_LESSON, rowLearned } from "../lessons/chartMap.js";

const NEW_PER_DAY = 10;
const MAX_QUEUE = 20;
const MASTERED_BOX = 4; // 14 días o más entre repasos
const KIND = { hard: "H", soft: "S", pairs: "P" };

// Todas las casillas, en el orden en que las enseñan las lecciones; primero las filas que ya aprendiste.
function deckFor(st) {
  const rows = [];
  for (const [tab, list] of [
    ["hard", HARD_ROWS],
    ["soft", SOFT_ROWS],
    ["pairs", PAIR_ROWS],
  ])
    for (const r of list)
      rows.push({
        tab,
        row: r.key,
        learned: rowLearned(st, tab, r.key),
        order: lessonIndex(ROW_LESSON[tab][r.key]),
      });
  rows.sort((a, b) => b.learned - a.learned || a.order - b.order);
  return rows.flatMap((r) => UPS.map((up) => `${KIND[r.tab]}${r.row}|${up}`));
}

function cardsInfo(st, now = Date.now()) {
  const cards = st.srs.cards;
  const deck = deckFor(st);
  const due = deck
    .filter((k) => cards[k] && cards[k].due <= now)
    .sort((a, b) => cards[a].due - cards[b].due);
  const newLeft = Math.max(
    0,
    NEW_PER_DAY - (st.srs.newDay === dayKey() ? st.srs.newToday : 0),
  );
  const fresh = deck.filter((k) => !cards[k]);
  const mastered = deck.filter(
    (k) => cards[k] && cards[k].box >= MASTERED_BOX,
  ).length;
  const upcoming = deck
    .filter((k) => cards[k] && cards[k].due > now)
    .map((k) => cards[k].due);
  return {
    deck,
    due,
    fresh: fresh.slice(0, newLeft),
    freshTotal: fresh.length,
    mastered,
    seen: deck.length - fresh.length,
    total: deck.length,
    next: upcoming.length ? Math.min(...upcoming) : null,
  };
}

// Las tarjetas de la tanda: primero las que vencieron, después nuevas (hasta 10 por día).
function cardsQueue(st) {
  const info = cardsInfo(st);
  const due = info.due.slice(0, MAX_QUEUE);
  const fresh = info.fresh.slice(0, Math.max(0, MAX_QUEUE - due.length));
  const shuffled = [...due, ...fresh];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function whenText(t) {
  const days = Math.round((t - Date.now()) / 86400000);
  if (days <= 0) return "Las próximas vuelven en unas horas.";
  if (days === 1) return "Las próximas vuelven mañana.";
  return `Las próximas vuelven en ${days} días.`;
}

// Tarjeta para Entrenar.
function ChartCards({ st, nav }) {
  const info = useMemo(() => cardsInfo(st), [st.srs, st.lessons]);
  const ready = info.due.length + info.fresh.length;
  const firstTime = !info.seen;
  return (
    <button
      type="button"
      className="card list-item srs-card"
      disabled={!ready}
      onClick={() =>
        nav.push("trainSession", { mode: "cards", confirmExit: true })
      }
    >
      <span className="srs-deck" aria-hidden="true">
        <i />
        <i />
        <span className="srs-deck-n num">
          {ready ? Math.min(ready, MAX_QUEUE) : <Icon name="check" size={20} />}
        </span>
      </span>
      <span className="li-text">
        <span className="li-title">Tarjetas de la tabla</span>
        <span className="li-sub" style={{ display: "block" }}>
          {firstTime
            ? "Memorizá la tabla casilla por casilla: cada una vuelve justo antes de que te la olvides."
            : ready
              ? `${info.due.length ? `${info.due.length} para repasar` : "Nada vencido"}${info.fresh.length ? ` · ${info.fresh.length} nuevas` : ""}`
              : `Al día. ${info.next ? whenText(info.next) : ""}`}
        </span>
        {info.seen ? (
          <span className="srs-progress">
            <ProgressBar value={info.mastered / info.total} tone="good" />
            <span className="tiny muted num">
              {info.mastered} de {info.total} de memoria
            </span>
          </span>
        ) : null}
      </span>
      {ready ? <Icon name="chev" className="li-chev" /> : null}
    </button>
  );
}

export { ChartCards, MASTERED_BOX, cardsInfo, cardsQueue };
