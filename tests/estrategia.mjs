// Compara la estrategia básica de la tabla contra el valor esperado que calcula la app (mazo infinito).
// La tabla sigue la estrategia publicada para 6 mazos. En dos manos blandas esa tabla dobla aunque
// con mazo infinito convenga pedir por muy poco: con 6 mazos reales doblar es lo correcto, porque
// las cartas que ya están en la mesa cambian la composición del zapato. Esas dos se aceptan.
import { basicPlay, allowedActions } from "../src/engine/strategy.js";
import { actionEVs } from "../src/engine/ev.js";
import { makeCard } from "../src/engine/cards.js";
import { withRules } from "../src/state.js";

const UPS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
const KNOWN = ["blando 13 vs 5", "blando 15 vs 4"];
const out = [];
const unexpected = [];
for (const variant of [
  { h17: false, das: true, surrender: false },
  { h17: true, das: true, surrender: false },
  { h17: false, das: true, surrender: true },
  { h17: true, das: false, surrender: true },
]) {
  const rules = withRules(variant);
  const tag = `${rules.h17 ? "H17" : "S17"} ${rules.das ? "DAS" : "NDAS"} ${rules.surrender ? "LS" : "NS"}`;
  const hands = [];
  for (let t = 5; t <= 20; t++) {
    const a = t <= 11 ? 2 : t - 10 >= 2 ? Math.min(10, t - 2) : 2;
    const b = t - a;
    if (a === b || b < 2 || b > 10) continue;
    hands.push({
      label: `duro ${t}`,
      cards: [String(a === 10 ? "10" : a), String(b === 10 ? "10" : b)],
    });
  }
  for (let s = 13; s <= 20; s++)
    hands.push({ label: `blando ${s}`, cards: ["A", String(s - 11)] });
  for (const p of ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"])
    hands.push({ label: `par ${p}`, cards: [p, p] });
  for (const h of hands) {
    for (const up of UPS) {
      const hand = {
        cards: h.cards.map((r) => makeCard(r, "s")),
        fromSplit: false,
      };
      const allowed = allowedActions(hand, rules);
      const basic = basicPlay(hand, up, rules, allowed).action;
      const evs = actionEVs(hand.cards, up, rules, allowed);
      let best = null;
      for (const [k, v] of Object.entries(evs))
        if (best === null || v > evs[best]) best = k;
      if (best !== basic) {
        const gap = evs[best] - evs[basic];
        const line = `${tag} · ${h.label} vs ${up}: tabla ${basic}, EV ${best} (diferencia ${(gap * 100).toFixed(2)} %)`;
        out.push(line);
        if (!KNOWN.includes(`${h.label} vs ${up}`)) unexpected.push(line);
      }
    }
  }
}
console.log(out.length ? out.join("\n") : "sin diferencias");
if (unexpected.length) {
  console.log(
    `\n${unexpected.length} diferencias nuevas:\n${unexpected.join("\n")}`,
  );
  process.exit(1);
}
console.log("solo las diferencias conocidas de 6 mazos");
