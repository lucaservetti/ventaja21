// Motor del simulador: un zapato, el crupier, otros jugadores (bots) y tus manos.
// La UI lo lee con subscribe()/version y lo maneja con addChip(), deal(), act(), insure()…
import { withRules } from "../state.js";
import {
  Shoe,
  handValue,
  isBlackjack,
  isPair,
  rankKey,
  upLabel,
} from "./cards.js";
import {
  allowedActions,
  basicPlay,
  countPlay,
  takeInsurance,
} from "./strategy.js";
import { explainBest, explainDeviation, explainMistake } from "./explain.js";
import {
  betUnits,
  countValue,
  floorTC,
  fmtSigned,
  hiloValue,
  initialCount,
  systemFor,
  trueCount,
} from "./systems.js";

const TABLE_SPEEDS = {
  learning: { label: "Aprendiz", ms: 1000 },
  relaxed: { label: "Relajado", ms: 700 },
  normal: { label: "Normal", ms: 480 },
  fast: { label: "Rápido", ms: 300 },
  pro: { label: "Pro", ms: 170 },
};
const BOT_NAMES = ["Ana", "Bruno", "Caro", "Diego"];
const CHATTER = [
  "¿Me cambiás estos billetes?",
  "¡Vamos, que sale un diez!",
  "Mozo, ¿me trae un café?",
  "¿Cuánto paga el seguro?",
  "Esta mesa está fría hoy…",
  "¡Uh, otra vez 16!",
  "¿Me pasás las fichas verdes?",
  "Dale, dale, que viene el As.",
];

let handSeq = 1;
function newHand(bet, extra = {}) {
  return {
    id: handSeq++,
    cards: [],
    bet,
    doubled: false,
    fromSplit: false,
    splitAces: false,
    done: false,
    surrendered: false,
    result: null,
    payout: 0,
    ...extra,
  };
}

function emptyShoeStats() {
  return {
    hands: 0,
    checks: 0,
    checksOk: 0,
    decisions: 0,
    decisionsOk: 0,
    bets: 0,
    betsOk: 0,
    net: 0,
  };
}

function spotLabel(spot) {
  if (spot.kind === "pair")
    return `${spot.g === "T" ? "10" : spot.g},${spot.g === "T" ? "10" : spot.g}`;
  return `${spot.kind === "soft" ? "Blando" : "Duro"} ${spot.total}`;
}

class Table {
  constructor(options = {}) {
    this.listeners = new Set();
    this.version = 0;
    this.toasts = [];
    this.toastSeq = 1;
    this.lifetime = { hands: 0, net: 0 };
    this.configure(options, true);
  }

  // Opciones: system, bots, unit, startBankroll, speed, coach (avisos de jugadas), betCoach (se evalúan
  // las apuestas), deviations (el coach usa el Illustrious 18), countCheck (off|shoe|sometimes|often|exam),
  // pressure, silent (sin avisos durante el juego), quietResults (sin aviso de ganaste/perdiste),
  // lenient (acepta la jugada básica aunque el conteo pida una desviación), rules.
  configure(options = {}, initial = false) {
    const prevRules = this.rules;
    this.opts = {
      system: "hilo",
      bots: 0,
      unit: 10,
      startBankroll: 1000,
      speed: "normal",
      coach: true,
      betCoach: true,
      deviations: false,
      countCheck: "sometimes",
      pressure: false,
      lenient: false,
      ...(this.opts || {}),
      ...options,
    };
    this.rules = withRules(options.rules || this.rules || {});
    this.sys = systemFor(this.opts.system);
    const shoeChanged =
      !prevRules ||
      prevRules.decks !== this.rules.decks ||
      prevRules.pen !== this.rules.pen;
    if (initial || ((shoeChanged || options.reshuffle) && !this.running)) {
      this.newShoe();
      this.pendingShuffle = false;
    } else {
      if (shoeChanged || options.reshuffle) this.pendingShuffle = true;
      this.recount();
    }
    if (initial) {
      this.bankroll = options.bankroll ?? this.opts.startBankroll;
      this.phase = "bet";
      this.dealer = { cards: [], hidden: true };
      this.hands = [];
      this.botSeats = [];
      this.bet = 0;
      this.chipStack = [];
      this.lastBet = this.opts.unit;
      this.active = 0;
      this.session = this.emptySession();
    }
    if (!this.running) this.setupBots();
    this.emit();
  }

  emptySession() {
    return {
      hands: 0,
      won: 0,
      lost: 0,
      push: 0,
      bj: 0,
      net: 0,
      decisions: 0,
      decisionsOk: 0,
      bets: 0,
      betsOk: 0,
      checks: 0,
      checksOk: 0,
      insurance: 0,
      insuranceOk: 0,
      shoes: 0,
      biggestWin: 0,
      slow: 0,
      mistakes: [],
      betMistakes: [],
      checkLog: [],
    };
  }

  setupBots() {
    const n = Math.max(0, Math.min(4, this.opts.bots | 0));
    if (!this.botSeats || this.botSeats.length !== n) {
      this.botSeats = Array.from({ length: n }, (_, i) => ({
        name: BOT_NAMES[i],
        hands: [],
      }));
    }
  }

  newShoe() {
    this.shoe = new Shoe({ decks: this.rules.decks, pen: this.rules.pen });
    this.seen = [];
    this.burned = null;
    this.rcSys = initialCount(this.sys, this.rules.decks);
    this.rcHilo = 0;
    this.roundsThisShoe = 0;
    this.roundsSinceCheck = 0;
    this.shoeStats = emptyShoeStats();
    this.needsBurn = this.rules.pen > 0;
  }

  recount() {
    this.rcSys = initialCount(this.sys, this.rules.decks);
    this.rcHilo = 0;
    for (const card of this.seen || []) {
      this.rcSys += countValue(card, this.sys);
      this.rcHilo += hiloValue(card);
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  sleep(beats = 1) {
    if (this.opts.instant) return Promise.resolve();
    const ms =
      (TABLE_SPEEDS[this.opts.speed] || TABLE_SPEEDS.normal).ms * beats;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  toast(msg, kind = "info", ms = 2600) {
    const item = { id: this.toastSeq++, msg, kind };
    this.toasts = [...this.toasts, item].slice(-3);
    this.emit();
    if (!this.opts.instant) {
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== item.id);
        this.emit();
      }, ms);
    }
  }

  get decksRemaining() {
    return this.shoe.remaining / 52;
  }
  get tc() {
    return trueCount(this.rcHilo, this.decksRemaining);
  }
  get tcSys() {
    return this.sys.balanced
      ? trueCount(this.rcSys, this.decksRemaining)
      : null;
  }
  // El coach de apuestas, las desviaciones y el seguro se calculan con Hi-Lo.
  get useCountCoach() {
    return this.opts.system === "hilo";
  }
  get maxBet() {
    return this.opts.unit * 100;
  }
  // Apuesta que corresponde al conteo real de ahora (1 unidad si se mezcla antes de la mano).
  get suggestedBet() {
    const units =
      this.shoe.needsShuffle || this.pendingShuffle ? 1 : betUnits(this.tc);
    return Math.min(units * this.opts.unit, this.maxBet);
  }

  // Qué queda en el zapato (para los rayos X). La carta tapada del crupier cuenta como "quedan".
  composition() {
    let low = 0,
      mid = 0,
      high = 0;
    const tally = (card) => {
      const v = hiloValue(card);
      if (v > 0) low++;
      else if (v < 0) high++;
      else mid++;
    };
    for (let i = this.shoe.pos; i < this.shoe.cards.length; i++)
      tally(this.shoe.cards[i]);
    if (this.dealer.hidden && this.dealer.cards[1]) tally(this.dealer.cards[1]);
    return { low, mid, high, total: low + mid + high };
  }

  see(card) {
    this.seen.push(card);
    this.rcSys += countValue(card, this.sys);
    this.rcHilo += hiloValue(card);
  }

  addChip(value) {
    if (this.countCheckDue) return false; // primero el chequeo de conteo
    if (this.phase !== "bet" && this.phase !== "settle") return;
    if (this.phase === "settle") this.newBet();
    const next = Math.min(this.bet + value, this.maxBet, this.bankroll);
    if (next === this.bet) {
      if (this.bet + value > this.bankroll)
        this.toast("No te alcanzan las fichas.", "warn");
      return;
    }
    this.chipStack = [...this.chipStack, next - this.bet];
    this.bet = next;
    this.emit();
  }

  undoChip() {
    if (this.phase !== "bet" || !this.chipStack.length) return;
    const last = this.chipStack[this.chipStack.length - 1];
    this.chipStack = this.chipStack.slice(0, -1);
    this.bet = Math.max(0, this.bet - last);
    this.emit();
  }

  clearBet() {
    if (this.phase !== "bet") return;
    this.bet = 0;
    this.chipStack = [];
    this.emit();
  }

  // "Nueva apuesta": limpia la mesa y deja la apuesta en cero.
  newBet() {
    if (this.countCheckDue) return false; // primero el chequeo de conteo
    if (this.running) return;
    this.clearTable();
    this.bet = 0;
    this.chipStack = [];
    this.emit();
  }

  // Pone la apuesta anterior (o el doble) y deja todo listo para repartir.
  rebet(mult = 1) {
    if (this.countCheckDue) return false; // primero el chequeo de conteo
    if (this.phase === "settle") this.clearTable();
    if (this.phase !== "bet") return false;
    const amount = Math.min(this.lastBet * mult, this.maxBet);
    if (amount > this.bankroll) {
      this.toast("No te alcanzan las fichas para esa apuesta.", "warn");
      return false;
    }
    this.bet = amount;
    this.chipStack = [amount];
    this.emit();
    return true;
  }

  setBet(amount) {
    if (this.countCheckDue) return false; // primero el chequeo de conteo
    if (this.phase === "settle") this.clearTable();
    if (this.phase !== "bet") return false;
    const bet = Math.min(amount, this.maxBet, this.bankroll);
    this.bet = bet;
    this.chipStack = bet ? [bet] : [];
    this.emit();
    return bet > 0;
  }

  refill() {
    this.bankroll = this.opts.startBankroll;
    this.toast(
      `Fichas recargadas a $${this.bankroll.toLocaleString("es-UY")}.`,
      "info",
    );
    this.emit();
  }

  clearTable() {
    this.dealer = { cards: [], hidden: true };
    this.hands = [];
    for (const seat of this.botSeats) seat.hands = [];
    this.phase = "bet";
    this.result = null;
    this.feedback = null;
    this.betFeedback = null;
  }

  async deal() {
    if (this.running || this.countCheckDue) return;
    if (this.phase === "settle") this.clearTable();
    if (this.phase !== "bet") return;
    if (this.bet <= 0) {
      this.toast("Poné una apuesta para repartir.", "warn");
      return;
    }
    if (this.bet > this.bankroll) {
      this.toast("No te alcanzan las fichas.", "warn");
      return;
    }
    this.running = true;
    this.countCheckDue = false;
    this.shoeEnded = false;
    try {
      if (this.pendingShuffle) {
        this.newShoe();
        this.pendingShuffle = false;
      }
      this.setupBots();
      await this.playRound();
    } finally {
      this.running = false;
      this.emit();
    }
  }

  async playRound() {
    const rules = this.rules;
    if (this.shoe.needsShuffle) {
      this.phase = "shuffle";
      this.emit();
      const rng = rules.pen <= 0;
      this.shoe.shuffleNow();
      this.seen = [];
      this.recount();
      this.roundsThisShoe = 0;
      this.roundsSinceCheck = 0;
      this.shoeStats = emptyShoeStats();
      if (!rng) {
        this.session.shoes++;
        await this.sleep(2.2);
        this.needsBurn = true;
      }
    }
    if (this.needsBurn) {
      this.burned = this.shoe.draw();
      this.needsBurn = false;
    }

    // ¿La apuesta va con el conteo? Se evalúa antes de repartir, con el conteo real redondeado hacia abajo.
    const tcBefore = this.tc;
    this.betFeedback = null;
    if (this.opts.betCoach && this.useCountCoach && rules.pen > 0) {
      const units = betUnits(tcBefore);
      const ideal = Math.min(
        units * this.opts.unit,
        this.maxBet,
        this.bankroll,
      );
      const ok = this.bet === ideal;
      this.session.bets++;
      this.shoeStats.bets++;
      if (ok) {
        this.session.betsOk++;
        this.shoeStats.betsOk++;
      } else {
        this.session.betMistakes = [
          ...this.session.betMistakes,
          { tc: floorTC(tcBefore), bet: this.bet, ideal, units },
        ].slice(-30);
      }
      this.betFeedback = {
        ok,
        ideal,
        units,
        tc: floorTC(tcBefore),
        bet: this.bet,
      };
    }

    this.lastBet = this.bet;
    this.bankroll -= this.bet;
    this.phase = "deal";
    this.result = null;
    this.feedback = null;
    this.insuranceBet = 0;
    this.dealer = { cards: [], hidden: true };
    this.hands = [newHand(this.bet)];
    this.active = 0;
    for (const seat of this.botSeats) seat.hands = [newHand(this.opts.unit)];
    this.chipStack = [];
    this.emit();
    if (this.betFeedback && !this.betFeedback.ok && !this.opts.silent) {
      const f = this.betFeedback;
      this.toast(
        `Con conteo real ${fmtSigned(f.tc)} la apuesta ideal era ${f.units} ${f.units === 1 ? "unidad" : "unidades"} ($${f.ideal}).`,
        "warn",
        3400,
      );
    }

    // Dos cartas para cada uno; la segunda del crupier, tapada.
    const firstHands = [...this.botSeats.map((s) => s.hands[0]), this.hands[0]];
    for (const hand of firstHands) await this.dealTo(hand);
    await this.dealDealer(true);
    for (const hand of firstHands) await this.dealTo(hand);
    await this.dealDealer(false);

    const up = this.dealer.cards[0];
    const upKey = rankKey(up.r);
    const playerBJ = isBlackjack(this.hands[0].cards);

    if (upKey === "A") {
      this.phase = "insurance";
      this.emit();
      const took = await new Promise(
        (resolve) => (this.insuranceResolver = resolve),
      );
      this.insuranceResolver = null;
      const shouldTake =
        this.useCountCoach && this.opts.deviations
          ? takeInsurance(this.tc, rules)
          : false;
      const ok = took === shouldTake || (this.opts.lenient && !took);
      this.session.insurance++;
      if (ok) this.session.insuranceOk++;
      if (!ok && this.opts.coach && !this.opts.silent) {
        this.feedback = {
          ok: false,
          id: Date.now(),
          best: shouldTake ? "I" : "N",
          chosen: took ? "I" : "N",
          title: shouldTake
            ? "Acá convenía el seguro"
            : "El seguro no conviene",
          note: shouldTake
            ? `Con conteo real ${this.fmtTC()} (+3 o más) el seguro gana plata.`
            : this.opts.deviations && this.useCountCoach
              ? `Con conteo real ${this.fmtTC()} el seguro pierde. Se toma recién con +3 o más.`
              : "El seguro es una apuesta aparte que pierde alrededor de 7 % a la larga. Sin contar, nunca lo tomes.",
        };
      }
      if (took) {
        const cost = this.hands[0].bet / 2;
        if (cost > this.bankroll)
          this.toast("No te alcanzan las fichas para el seguro.", "warn");
        else {
          this.insuranceBet = cost;
          this.bankroll -= cost;
        }
      }
      this.phase = "deal";
      this.emit();
      await this.sleep(0.6);
    }

    // El crupier revisa si tiene blackjack cuando muestra As o 10.
    let dealerBJ = false;
    if (upKey === "A" || upKey === "T") {
      dealerBJ = isBlackjack(this.dealer.cards);
      if (dealerBJ) await this.revealHole();
      else if (this.insuranceBet)
        this.toast("El crupier no tiene blackjack: perdés el seguro.", "info");
    }
    if (dealerBJ) {
      for (const seat of this.botSeats)
        for (const hand of seat.hands) hand.done = true;
      for (const hand of this.hands) hand.done = true;
      await this.settle(true);
      return;
    }
    if (playerBJ) this.hands[0].done = true;

    for (const seat of this.botSeats) {
      this.phase = "bots";
      this.emit();
      await this.playBot(seat);
    }
    if (!playerBJ) {
      this.phase = "player";
      this.active = 0;
      this.emit();
      await this.playerTurn();
    }
    this.phase = "dealer";
    this.emit();
    await this.revealHole();
    const someoneAlive = [
      ...this.hands,
      ...this.botSeats.flatMap((s) => s.hands),
    ].some(
      (h) =>
        !h.surrendered &&
        !handValue(h.cards).bust &&
        !(isBlackjack(h.cards, h.fromSplit) && h.cards.length === 2),
    );
    if (someoneAlive)
      while (this.dealerShouldHit()) await this.dealDealer(true);
    await this.settle(false);
  }

  dealerShouldHit() {
    const v = handValue(this.dealer.cards);
    if (v.bust) return false;
    return v.total < 17 || (v.total === 17 && v.soft && this.rules.h17);
  }

  async dealTo(hand, { face = true } = {}) {
    const card = this.shoe.draw();
    hand.cards = [...hand.cards, { ...card, faceUp: face }];
    if (face) this.see(card);
    this.emit();
    await this.sleep();
    return card;
  }

  async dealDealer(faceUp) {
    const card = this.shoe.draw();
    this.dealer.cards = [...this.dealer.cards, { ...card, faceUp }];
    if (faceUp) this.see(card);
    else this.dealer.hidden = true;
    this.emit();
    await this.sleep();
    return card;
  }

  async revealHole() {
    if (!this.dealer.hidden) return;
    this.dealer.hidden = false;
    const hole = this.dealer.cards[1];
    if (hole) {
      this.dealer.cards = this.dealer.cards.map((c, i) =>
        i === 1 ? { ...c, faceUp: true } : c,
      );
      this.see(hole);
    }
    this.emit();
    await this.sleep(1.1);
  }

  // Los otros jugadores juegan estrategia básica perfecta.
  async playBot(seat) {
    const up = this.dealer.cards[0];
    for (let i = 0; i < seat.hands.length; i++) {
      let hand = seat.hands[i];
      if (hand.cards.length === 1) await this.dealTo(hand);
      if (isBlackjack(hand.cards, hand.fromSplit)) {
        hand.done = true;
        continue;
      }
      let guard = 0;
      while (!hand.done && guard++ < 15) {
        const v = handValue(hand.cards);
        if (v.bust || v.total >= 21) {
          hand.done = true;
          break;
        }
        const allowed = allowedActions(hand, this.rules, {
          maxHandsReached: seat.hands.length >= this.rules.maxHands,
        });
        if (hand.splitAces && !this.rules.hitSplitAces && !allowed.P) {
          hand.done = true;
          break;
        }
        const action = basicPlay(hand, up.r, this.rules, allowed).action;
        if (action === "P") {
          await this.splitHand(seat.hands, i);
          hand = seat.hands[i];
          continue;
        }
        if (action === "R") {
          hand.surrendered = true;
          hand.done = true;
          break;
        }
        if (action === "D") {
          hand.bet *= 2;
          hand.doubled = true;
          await this.dealTo(hand);
          hand.done = true;
          break;
        }
        if (action === "S") {
          hand.done = true;
          break;
        }
        await this.dealTo(hand);
      }
      this.emit();
      await this.sleep(0.35);
    }
  }

  async splitHand(hands, index) {
    const hand = hands[index];
    const [first, second] = hand.cards;
    const aces = rankKey(first.r) === "A";
    const a = newHand(hand.bet, {
      fromSplit: true,
      splitAces: aces || hand.splitAces,
    });
    const b = newHand(hand.bet, {
      fromSplit: true,
      splitAces: aces || hand.splitAces,
    });
    a.cards = [first];
    b.cards = [second];
    hands.splice(index, 1, a, b);
    this.emit();
    await this.sleep(0.7);
    await this.dealTo(a);
    // Con ases separados se reparte una carta a cada mano de una vez (no se puede pedir).
    if (aces && !this.rules.hitSplitAces) await this.dealTo(b);
    return [a, b];
  }

  activeHand() {
    return this.hands[this.active];
  }

  allowed() {
    const hand = this.activeHand();
    if (!hand || this.phase !== "player")
      return { H: false, S: false, D: false, P: false, R: false };
    const allowed = allowedActions(hand, this.rules, {
      maxHandsReached: this.hands.length >= this.rules.maxHands,
    });
    if (hand.cards.length === 2 && allowed.D && hand.bet > this.bankroll)
      allowed.D = false;
    if (allowed.P && hand.bet > this.bankroll) allowed.P = false;
    return allowed;
  }

  async playerTurn() {
    const up = this.dealer.cards[0];
    for (this.active = 0; this.active < this.hands.length; this.active++) {
      const hand = this.hands[this.active];
      if (hand.cards.length === 1) await this.dealTo(hand);
      while (!hand.done) {
        const v = handValue(hand.cards);
        if (v.bust) {
          hand.done = true;
          break;
        }
        if (v.total === 21) {
          hand.done = true;
          break;
        }
        const allowed = this.allowed();
        if (hand.splitAces && !this.rules.hitSplitAces && !allowed.P) {
          hand.done = true;
          break;
        }
        this.emit();
        this.decisionStart = Date.now();
        const action = await new Promise(
          (resolve) => (this.actionResolver = resolve),
        );
        this.actionResolver = null;
        this.evaluateDecision(hand, up, allowed, action);
        if (action === "S") hand.done = true;
        else if (action === "H") await this.dealTo(hand);
        else if (action === "D") {
          this.bankroll -= hand.bet;
          hand.bet *= 2;
          hand.doubled = true;
          await this.dealTo(hand);
          hand.done = true;
        } else if (action === "P") {
          this.bankroll -= hand.bet;
          await this.splitHand(this.hands, this.active);
          const firstOfSplit = this.hands[this.active];
          this.emit();
          if (
            firstOfSplit.splitAces &&
            !this.rules.hitSplitAces &&
            !this.allowed().P
          )
            firstOfSplit.done = true;
          this.active--; // vuelve a jugar la primera mano del par separado
          break;
        } else if (action === "R") {
          hand.surrendered = true;
          hand.done = true;
        }
      }
      this.emit();
    }
    this.active = -1;
  }

  act(action) {
    if (
      this.phase !== "player" ||
      !this.actionResolver ||
      !this.allowed()[action]
    )
      return false;
    const resolve = this.actionResolver;
    this.actionResolver = null;
    resolve(action);
    return true;
  }

  insure(take) {
    if (this.phase !== "insurance" || !this.insuranceResolver) return;
    const resolve = this.insuranceResolver;
    this.insuranceResolver = null;
    resolve(!!take);
  }

  // Compara tu jugada con la correcta. Las estadísticas se llevan siempre; el aviso solo si el coach está prendido.
  evaluateDecision(hand, up, allowed, chosen) {
    const devPlay =
      this.useCountCoach && this.opts.deviations
        ? countPlay(hand, up.r, this.rules, this.tc, allowed)
        : null;
    const basic = basicPlay(hand, up.r, this.rules, allowed);
    const best = devPlay ? devPlay.action : basic.action;
    const ok =
      chosen === best || (this.opts.lenient && chosen === basic.action);
    this.session.decisions++;
    this.shoeStats.decisions++;
    if (ok) {
      this.session.decisionsOk++;
      this.shoeStats.decisionsOk++;
    }
    if (
      this.opts.pressure &&
      this.decisionStart &&
      Date.now() - this.decisionStart > 5000
    )
      this.session.slow++;

    const v = handValue(hand.cards);
    const spot = {
      kind: isPair(hand.cards) && allowed.P ? "pair" : v.soft ? "soft" : "hard",
      total: v.total,
      g: isPair(hand.cards) ? rankKey(hand.cards[0].r) : null,
      upRank: up.r,
      nCards: hand.cards.length,
    };
    let note = "";
    if (ok) {
      if (devPlay && devPlay.source === "dev" && devPlay.dev && chosen === best)
        note = explainDeviation(devPlay.dev, best, this.rules, this.tc);
    } else {
      const why =
        devPlay && devPlay.dev
          ? explainDeviation(devPlay.dev, best, this.rules, this.tc)
          : explainBest(spot, best, basic.code, this.rules);
      note = [explainMistake(spot, chosen, best, this.rules), why]
        .filter(Boolean)
        .join(" ");
      this.session.mistakeSeq = (this.session.mistakeSeq || 0) + 1;
      this.session.mistakes = [
        ...this.session.mistakes,
        {
          spot: `${spotLabel(spot)} vs ${upLabel(up.r)}`,
          chosen,
          best,
          tc: devPlay ? floorTC(this.tc) : null,
          note,
          seq: this.session.mistakeSeq,
          // La mano exacta, para repetirla en Entrenar (solo errores de estrategia básica).
          hand:
            devPlay && devPlay.dev
              ? null
              : {
                  key: `${spot.kind === "pair" ? "P" + spot.g : (spot.kind === "soft" ? "S" : "H") + Math.min(spot.total, 21)}|${rankKey(up.r)}`,
                  cards: hand.cards.map((c) => c.r),
                  up: up.r,
                  chosen,
                  best,
                },
        },
      ].slice(-30);
    }
    if (this.opts.coach && !this.opts.silent)
      this.feedback = {
        ok,
        chosen,
        best,
        note,
        dev: !!(devPlay && devPlay.source === "dev"),
        id: Date.now(),
      };
    this.emit();
  }

  async settle(dealerBJ) {
    const rules = this.rules;
    const dealer = handValue(this.dealer.cards);
    const dealerTotal = dealer.total;
    const dealerBust = dealer.bust;
    let net = -this.insuranceBet;
    let paid = 0;
    if (this.insuranceBet && dealerBJ) {
      paid += this.insuranceBet * 3;
      net += this.insuranceBet * 3;
    }
    const settleHand = (hand, mine) => {
      const v = handValue(hand.cards);
      const bj = isBlackjack(hand.cards, hand.fromSplit);
      let payout = 0;
      let result;
      if (hand.surrendered) {
        payout = hand.bet / 2;
        result = "surrender";
      } else if (dealerBJ) {
        payout = bj ? hand.bet : 0;
        result = bj ? "push" : "lose";
      } else if (bj) {
        payout = hand.bet + hand.bet * rules.bjPays;
        result = "bj";
      } else if (v.bust) {
        result = "bust";
      } else if (dealerBust || v.total > dealerTotal) {
        payout = hand.bet * 2;
        result = "win";
      } else if (v.total === dealerTotal) {
        payout = hand.bet;
        result = "push";
      } else {
        result = "lose";
      }
      hand.result = result;
      hand.payout = payout;
      if (mine) {
        paid += payout;
        net += payout - hand.bet;
      }
    };
    for (const seat of this.botSeats)
      for (const hand of seat.hands) settleHand(hand, false);
    for (const hand of this.hands) settleHand(hand, true);
    this.bankroll += paid;

    const s = this.session;
    s.hands++;
    this.shoeStats.hands++;
    this.roundsThisShoe++;
    this.roundsSinceCheck++;
    s.net += net;
    this.shoeStats.net += net;
    if (net > 0) s.won++;
    else if (net < 0) s.lost++;
    else s.push++;
    if (this.hands.some((h) => h.result === "bj")) s.bj++;
    s.biggestWin = Math.max(s.biggestWin, net);
    this.lifetime.hands++;
    this.lifetime.net += net;
    this.result = { net, dealerTotal, dealerBust, dealerBJ };
    this.phase = "settle";
    this.emit();
    if (!this.opts.quietResults) {
      if (net > 0) this.toast(`Ganaste $${money(net)}`, "good", 2000);
      else if (net < 0) this.toast(`Perdiste $${money(-net)}`, "bad", 2000);
      else this.toast("Empate", "info", 1600);
    }
    this.countCheckDue = this.shouldCheck();
    this.shoeEnded = this.shoe.needsShuffle && rules.pen > 0;
    if (this.shoeEnded)
      this.countCheckDue = this.opts.countCheck !== "off" ? "final" : false;
    if (this.countCheckDue) this.roundsSinceCheck = 0;
    if (this.onRoundEnd) this.onRoundEnd(this.result, this);
    this.emit();
  }

  shouldCheck() {
    const mode = this.opts.countCheck;
    if (mode === "off" || mode === "shoe" || this.rules.pen <= 0) return false;
    if (mode === "exam") {
      // Al azar, pero nunca dos seguidos ni más de 6 manos sin chequeo.
      if (this.roundsSinceCheck < 2) return false;
      return this.roundsSinceCheck >= 6 || Math.random() < 0.3;
    }
    if (this.opts.pressure) return Math.random() < 0.3;
    const every = mode === "often" ? 2 : 4;
    return (
      this.roundsThisShoe > 0 &&
      this.roundsThisShoe % every === 0 &&
      Math.random() < 0.85
    );
  }

  submitCountCheck(value) {
    const correct = this.rcSys;
    const ok = Math.abs(value - correct) < 0.01;
    this.session.checks++;
    this.shoeStats.checks++;
    if (ok) {
      this.session.checksOk++;
      this.shoeStats.checksOk++;
    }
    const final = this.countCheckDue === "final";
    this.session.checkLog = [
      ...this.session.checkLog,
      { value, correct, ok, final },
    ].slice(-40);
    this.countCheckDue = false;
    this.lastCheck = { ok, value, correct, final };
    this.emit();
    return { ok, correct, final };
  }

  skipCountCheck() {
    this.countCheckDue = false;
    this.emit();
  }

  fmtTC() {
    const t = Math.round(this.tc * 10) / 10;
    return (
      (t > 0 ? "+" : t < 0 ? "−" : "") +
      Math.abs(t).toFixed(1).replace(".", ",")
    );
  }

  randomChatter() {
    return CHATTER[Math.floor(Math.random() * CHATTER.length)];
  }
}

function money(amount) {
  const rounded = Math.round(amount * 100) / 100;
  const whole = Math.abs(rounded - Math.round(rounded)) < 1e-9;
  return Math.abs(rounded).toLocaleString("es-UY", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export { TABLE_SPEEDS, Table, money };
