// Prueba de invariantes del motor del simulador: juega miles de manos con decisiones al azar
// y revisa pagos, banca, crupier y conteo en cada una. Se corre con `npm test`.
import { Table } from "../src/engine/table.js";
import { handValue, isBlackjack } from "../src/engine/cards.js";
import { hiloValue } from "../src/engine/systems.js";

let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
Math.random = rnd;

const failures = [];
function check(cond, msg) {
  if (!cond) failures.push(msg);
}

async function playMany(rules, rounds, label) {
  const t = new Table({
    rules,
    unit: 10,
    startBankroll: 1e9,
    bankroll: 1e9,
    instant: true,
    coach: true,
    betCoach: true,
    deviations: true,
    countCheck: "often",
    bots: 2,
  });
  let splits = 0,
    doubles = 0,
    surrenders = 0,
    insurances = 0,
    dealerBJ = 0;
  for (let r = 0; r < rounds; r++) {
    if (t.countCheckDue) t.submitCountCheck(t.rcSys);
    t.setBet(10 * (1 + Math.floor(rnd() * 8)));
    const before = t.bankroll;
    const done = t.deal();
    // responder a seguro y jugadas mientras la ronda corre
    for (let guard = 0; guard < 200; guard++) {
      await Promise.resolve();
      await new Promise((res) => setImmediate(res));
      if (t.phase === "insurance") {
        const take = rnd() < 0.4;
        if (take) insurances++;
        t.insure(take);
      } else if (t.phase === "player" && t.actionResolver) {
        const allowed = t.allowed();
        const opts = Object.keys(allowed).filter((k) => allowed[k]);
        const pick = opts[Math.floor(rnd() * opts.length)];
        if (pick === "P") splits++;
        if (pick === "D") doubles++;
        if (pick === "R") surrenders++;
        t.act(pick);
      } else if (!t.running) break;
    }
    await done;
    check(t.phase === "settle", `${label} r${r}: fase ${t.phase}`);
    const res = t.result;
    if (res.dealerBJ) dealerBJ++;
    check(
      Math.abs(t.bankroll - before - res.net) < 1e-9,
      `${label} r${r}: banca ${before}→${t.bankroll} pero net ${res.net}`,
    );
    // pago independiente
    const d = handValue(t.dealer.cards);
    let expected =
      -t.insuranceBet +
      (t.insuranceBet && res.dealerBJ ? t.insuranceBet * 3 : 0);
    for (const h of t.hands) {
      const v = handValue(h.cards);
      const bj = isBlackjack(h.cards, h.fromSplit);
      let pay;
      if (h.surrendered) pay = h.bet / 2;
      else if (res.dealerBJ) pay = bj ? h.bet : 0;
      else if (bj) pay = h.bet * 2.5;
      else if (v.bust) pay = 0;
      else if (d.bust || v.total > d.total) pay = h.bet * 2;
      else if (v.total === d.total) pay = h.bet;
      else pay = 0;
      expected += pay - h.bet;
      check(
        !(h.fromSplit && bj),
        `${label} r${r}: blackjack después de separar`,
      );
      check(
        h.cards.length >= 2 || h.surrendered,
        `${label} r${r}: mano con ${h.cards.length} cartas`,
      );
      if (h.doubled)
        check(
          h.cards.length === (h.splitAces ? 2 : 3) || h.cards.length === 3,
          `${label} r${r}: doblada con ${h.cards.length} cartas`,
        );
    }
    check(
      Math.abs(expected - res.net) < 1e-9,
      `${label} r${r}: net ${res.net} esperado ${expected}`,
    );
    // crupier: si alguien seguía vivo, terminó en 17+ (o pidió con 17 blando en H17)
    const alive = [...t.hands, ...t.botSeats.flatMap((s) => s.hands)].some(
      (h) =>
        !h.surrendered &&
        !handValue(h.cards).bust &&
        !(isBlackjack(h.cards, h.fromSplit) && h.cards.length === 2),
    );
    if (!res.dealerBJ && alive) {
      check(
        d.bust || d.total > 17 || (d.total === 17 && !(d.soft && rules.h17)),
        `${label} r${r}: crupier se quedó en ${d.total}${d.soft ? " blando" : ""}`,
      );
    }
    // conteo: todas las cartas vistas (menos la quemada) entran en el conteo
    const rc = t.seen.reduce((s, c) => s + hiloValue(c), 0);
    check(rc === t.rcHilo, `${label} r${r}: rcHilo ${t.rcHilo} vs ${rc}`);
    const visible =
      t.dealer.cards.length +
      t.hands.reduce((s, h) => s + h.cards.length, 0) +
      t.botSeats.reduce(
        (s, b) => s + b.hands.reduce((m, h) => m + h.cards.length, 0),
        0,
      );
    check(
      t.dealer.cards.every((c) => c.faceUp),
      `${label} r${r}: carta del crupier sin dar vuelta`,
    );
    check(
      t.seen.length >= visible,
      `${label} r${r}: vistas ${t.seen.length} < en la mesa ${visible}`,
    );
  }
  return {
    splits,
    doubles,
    surrenders,
    insurances,
    dealerBJ,
    hands: t.session.hands,
    shoes: t.session.shoes,
    checks: t.session.checks,
  };
}

const base = {
  decks: 6,
  pen: 0.75,
  h17: false,
  das: true,
  surrender: true,
  bjPays: 1.5,
  doubleOn: "any",
  rsa: false,
  maxHands: 4,
};
const r1 = await playMany(base, 3000, "S17");
const r2 = await playMany(
  { ...base, h17: true, das: false, decks: 2, pen: 0.8 },
  3000,
  "H17",
);
const r3 = await playMany({ ...base, pen: 0, surrender: false }, 800, "RNG");
console.log(JSON.stringify({ r1, r2, r3 }));
console.log(failures.length ? failures.slice(0, 20).join("\n") : "sin fallas");
console.log("fallas:", failures.length);
if (failures.length) process.exit(1);
