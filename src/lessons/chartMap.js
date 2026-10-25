// La tabla de estrategia en Aprender: qué lección enseña cada fila y cómo se dice cada fila en palabras.
import { basicPlay, strategyFor } from "../engine/strategy.js";
import { upIndex } from "../engine/cards.js";

// Lección que enseña cada fila. La lección "La tabla completa" (lt) enciende todas.
const ROW_LESSON = {
  hard: {
    17: "l8",
    16: "l7",
    15: "l8",
    14: "l8",
    13: "l8",
    12: "l8",
    11: "l10",
    10: "l10",
    9: "l10",
    8: "l8",
  },
  soft: {
    20: "l9",
    19: "l9",
    18: "l9",
    17: "l10",
    16: "l10",
    15: "l10",
    14: "l10",
    13: "l10",
  },
  pairs: {
    A: "l11",
    8: "l11",
    T: "l12",
    9: "l12",
    7: "l12",
    6: "l12",
    5: "l12",
    4: "l12",
    3: "l12",
    2: "l12",
  },
};
const CHART_LESSON = "lt";

function rowLearned(st, tab, row) {
  const done = (id) => !!(st.lessons[id] && st.lessons[id].done);
  return done(CHART_LESSON) || done(ROW_LESSON[tab][row]);
}

// Código de la tabla para una casilla (sin rendición en la mesa, la casilla de rendirse muestra el reemplazo).
function cellCode(tab, row, col, rules) {
  const t = strategyFor(rules);
  const code =
    tab === "pairs"
      ? t.pairs[row][col]
      : tab === "soft"
        ? t.soft[row][col]
        : row <= 8
          ? "H"
          : t.hard[row][col];
  if (!rules.surrender && code[0] === "R")
    return { Rh: "H", Rs: "S", Rp: "P" }[code] || code;
  return code;
}

const COLS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
const VERB = {
  H: "pedí",
  S: "plantate",
  D: "doblá",
  Ds: "doblá",
  P: "separá",
  Rh: "rendite",
  Rs: "rendite",
  Rp: "rendite",
};
const FALLBACK = {
  D: "si no podés doblar, pedí",
  Ds: "si no podés doblar, plantate",
  Rh: "si no te podés rendir, pedí",
  Rs: "si no te podés rendir, plantate",
  Rp: "si no te podés rendir, separá",
};

// "Plantate contra 2–6; pedí contra 7–A."
function rowWords(codes) {
  const runs = [];
  codes.forEach((code, i) => {
    const last = runs[runs.length - 1];
    if (last && last.code === code) last.to = i;
    else runs.push({ code, from: i, to: i });
  });
  if (runs.length === 1) return capitalize(`${VERB[runs[0].code]} siempre.`);
  const parts = runs.map(
    (r) =>
      `${VERB[r.code]} contra ${r.from === r.to ? COLS[r.from] : `${COLS[r.from]}–${COLS[r.to]}`}`,
  );
  return capitalize(parts.join("; ") + ".");
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function rowCodes(tab, row, rules) {
  return COLS.map((_, c) => cellCode(tab, row, c, rules));
}
function rowFallbacks(codes) {
  return [...new Set(codes.filter((c) => FALLBACK[c]))].map((c) => FALLBACK[c]);
}

// Agrupa filas seguidas que se juegan igual: "13 a 16: plantate contra 2–6; pedí contra 7–A."
function chartRules(tab, rows, rules) {
  const groups = [];
  for (const r of rows) {
    const codes = rowCodes(tab, r.key, rules);
    const sig = codes.join(",");
    const last = groups[groups.length - 1];
    if (last && last.sig === sig) last.rows.push(r);
    else groups.push({ sig, codes, rows: [r] });
  }
  return groups.map((g) => ({
    label:
      g.rows.length === 1
        ? g.rows[0].label
        : g.rows.length === 2
          ? `${g.rows[0].label} y ${g.rows[1].label}`
          : `${g.rows[g.rows.length - 1].label} a ${g.rows[0].label}`,
    text: rowWords(g.codes),
    notes: rowFallbacks(g.codes),
  }));
}

// En qué casilla de la tabla cae una mano: pestaña, fila y columna.
function chartSpot(cards, upRank, rules) {
  const play = basicPlay({ cards, fromSplit: false }, upRank, rules);
  const tab = play.kind === "pair" ? "pairs" : play.kind;
  let row = play.key;
  if (tab === "soft") row = Math.min(20, Math.max(13, row));
  if (tab === "hard") row = row >= 17 ? 17 : row <= 8 ? 8 : row;
  return { tab, row, col: upIndex(upRank) };
}

export {
  CHART_LESSON,
  chartSpot,
  ROW_LESSON,
  cellCode,
  chartRules,
  rowCodes,
  rowFallbacks,
  rowLearned,
  rowWords,
};
