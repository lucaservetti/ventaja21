// Datos de la tabla de estrategia básica para las guías de la web (ver tools/guias/armar.mjs): la
// jugada de cada casilla y el "por qué", sacados del mismo motor y los mismos textos que la app.
import { allowedActions, basicPlay } from "../../src/engine/strategy.js";
import { UPS, makeSpot } from "../../src/engine/trainer.js";
import { explainBest } from "../../src/engine/explain.js";
import { cellCode } from "../../src/lessons/chartMap.js";
import { withRules } from "../../src/state.js";

const KIND = { hard: "H", soft: "S", pairs: "P" };
const FILAS = {
  hard: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
  soft: [20, 19, 18, 17, 16, 15, 14, 13],
  pairs: ["A", "T", "9", "8", "7", "6", "5", "4", "3", "2"],
};
const LETRA = { H: "H", S: "S", D: "D", Ds: "D", P: "P", Rh: "R", Rs: "R", Rp: "R" };
const CHICA = { Ds: "s", Rh: "h", Rs: "s", Rp: "p" };

export function tabla(variante) {
  const rules = withRules(variante);
  const out = {};
  for (const [tab, filas] of Object.entries(FILAS)) {
    out[tab] = filas.map((row) =>
      UPS.map((_, col) => {
        const code = cellCode(tab, row, col, rules);
        const spot = makeSpot(`${KIND[tab]}${row}|${UPS[col]}`, { rnd: () => 0.37 });
        const hand = { cards: spot.cards, fromSplit: false };
        const play = basicPlay(hand, spot.upRank, rules, allowedActions(hand, rules));
        return { l: LETRA[code], s: CHICA[code] || "", w: explainBest(spot, play.action, play.code, rules) };
      }),
    );
  }
  return out;
}
