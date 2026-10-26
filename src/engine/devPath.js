// Ruta de desviaciones: 10 niveles para aprender las jugadas que cambian con el conteo (Illustrious 18 y Fab 4),
// de a pocas por vez, hasta un examen donde calculás vos el conteo real.
import { FAB_4, ILLUSTRIOUS_18 } from "./strategy.js";
import { floorTC, fmtSigned } from "./systems.js";
import { makeSpot } from "./trainer.js";

const ALL_DEVS = [...ILLUSTRIOUS_18, ...FAB_4];
const I18_HARD = ILLUSTRIOUS_18.filter((d) => d.type !== "ins").map(
  (d) => d.id,
);

const DEV_LEVELS = [
  {
    n: 1,
    id: "d1",
    title: "El seguro",
    sub: "La desviación que más plata vale",
    ids: ["ins"],
    size: 10,
  },
  {
    n: 2,
    id: "d2",
    title: "16 contra 10",
    sub: "La segunda más importante",
    ids: ["16v10"],
    size: 10,
  },
  {
    n: 3,
    id: "d3",
    title: "15 y 16 contra 10 y 9",
    sub: "Plantarse cuando el mazo viene alto",
    ids: ["16v10", "15v10", "16v9"],
    size: 12,
  },
  {
    n: 4,
    id: "d4",
    title: "Dieces y el 12 contra 2 y 3",
    sub: "Separar 10,10 y plantar el 12 con conteo alto",
    ids: ["TTv5", "TTv6", "12v3", "12v2"],
    size: 10,
  },
  {
    n: 5,
    id: "d5",
    title: "Doblar con conteo alto",
    sub: "10, 11 y 9 que se doblan",
    ids: ["10v10", "10vA", "11vA", "9v2", "9v7"],
    size: 12,
  },
  {
    n: 6,
    id: "d6",
    title: "Con conteo bajo, pedí",
    sub: "12 y 13 contra cartas débiles",
    ids: ["12v4", "12v5", "12v6", "13v2", "13v3"],
    size: 12,
  },
  {
    n: 7,
    id: "d7",
    title: "Los 18 mezclados",
    sub: "Todos los Illustrious 18",
    ids: ["ins", ...I18_HARD],
    size: 15,
  },
  {
    n: 8,
    id: "d8",
    title: "Fab 4: rendirse",
    sub: "Cuándo rendirse si tu mesa lo permite",
    ids: FAB_4.map((d) => d.id),
    size: 10,
  },
  {
    n: 9,
    id: "d9",
    title: "Calculá vos el conteo real",
    sub: "Te damos el corrido y los mazos",
    ids: ["ins", ...I18_HARD],
    size: 15,
    rc: true,
  },
  {
    n: 10,
    id: "d10",
    title: "Examen de desviaciones",
    sub: "Todo junto, calculando vos",
    ids: ALL_DEVS.map((d) => d.id),
    size: 20,
    rc: true,
    need: 0.9,
  },
].map((l) => ({ need: 0.8, ...l }));

const VERB = {
  H: "pedí",
  S: "plantate",
  D: "doblá",
  R: "rendite",
  P: "separá",
};

function devById(id) {
  return ALL_DEVS.find((d) => d.id === id);
}
function devIndex(dev, rules) {
  return rules.h17 ? dev.h17 : dev.s17;
}
function idxText(i) {
  return i === 0 ? "0" : fmtSigned(i).replace("-", "−");
}
function devLabel(dev) {
  return dev.type === "ins" ? "Seguro (el crupier muestra As)" : dev.label;
}
function ruleText(dev, rules) {
  const i = idxText(devIndex(dev, rules));
  if (dev.type === "ins")
    return `Tomá el seguro con conteo real ${i} o más; con menos, nunca.`;
  return `Con conteo real ${i} o más, ${VERB[dev.at]}; con menos, ${VERB[dev.below]}.`;
}

function rand(n) {
  return Math.floor(Math.random() * n);
}
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Preguntas del nivel: cada desviación aparece parejo, con conteos arriba y abajo del índice.
function devQuestions(level, rules) {
  const ids = level.ids.filter((id) => devById(id));
  const order = [];
  while (order.length < level.size) order.push(...shuffle(ids));
  const offsets = shuffle(
    Array.from({ length: level.size }, (_, k) =>
      k % 2 ? [0, 1, 2, 3][rand(4)] : [-1, -2, -3][rand(3)],
    ),
  );
  return order.slice(0, level.size).map((id, k) => {
    const dev = devById(id);
    const idx = devIndex(dev, rules);
    let tc = idx + offsets[k];
    let rc = null;
    let decks = null;
    if (level.rc) {
      // Mazos que dejan un conteo corrido creíble (con conteo real alto quedan pocos mazos).
      const fits = [1, 1.5, 2, 2.5, 3, 4, 5].filter(
        (d) => d === 1 || Math.abs(tc) * d <= 14,
      );
      decks = fits[rand(fits.length)];
      rc = Math.ceil(tc * decks - 1e-9) + rand(Math.max(1, Math.floor(decks)));
      tc = floorTC(rc / decks);
    }
    const up = dev.up === "10" ? "T" : dev.up;
    const key =
      dev.type === "ins"
        ? `H${[12, 13, 14, 15, 16, 17, 18, 19][rand(8)]}|A`
        : dev.type === "pair"
          ? `P${dev.g}|${up}`
          : `H${dev.total}|${up}`;
    const spot = makeSpot(key, { nCards: 2, tc });
    const best =
      dev.type === "ins"
        ? tc >= idx
          ? "I"
          : "N"
        : tc >= idx
          ? dev.at
          : dev.below;
    return { dev, idx, tc, rc, decks, spot, best };
  });
}

function devPassed(st, level) {
  return !!(st.devPath && st.devPath.passed[level.id]);
}
function devUnlocked(st, level) {
  if (level.n === 1 || st.settings.unlockAll) return true;
  return devPassed(st, DEV_LEVELS[level.n - 2]);
}
function devCurrent(st) {
  return DEV_LEVELS.find((l) => !devPassed(st, l)) || null;
}
function devPassedCount(st) {
  return DEV_LEVELS.filter((l) => devPassed(st, l)).length;
}

export {
  DEV_LEVELS,
  devCurrent,
  devLabel,
  devPassed,
  devPassedCount,
  devQuestions,
  devUnlocked,
  devById,
  idxText,
  ruleText,
};
