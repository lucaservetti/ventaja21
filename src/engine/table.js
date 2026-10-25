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
function newHand(a, e = {}) {
  return {
    id: handSeq++,
    cards: [],
    bet: a,
    doubled: false,
    fromSplit: false,
    splitAces: false,
    done: false,
    surrendered: false,
    result: null,
    payout: 0,
    ...e,
  };
}
const Table = class {
  constructor(e = {}) {
    this.listeners = new Set();
    this.version = 0;
    this.toasts = [];
    this.toastSeq = 1;
    this.lifetime = { hands: 0, net: 0 };
    this.configure(e, true);
  }
  configure(e = {}, t = false) {
    let s = this.rules;
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
      ...(this.opts || {}),
      ...e,
    };
    this.rules = withRules(e.rules || (this.rules ? this.rules : {}));
    this.sys = systemFor(this.opts.system);
    let n = !s || s.decks !== this.rules.decks || s.pen !== this.rules.pen;
    if (t || ((n || e.reshuffle) && !this.running)) {
      this.newShoe();
      this.pendingShuffle = false;
    } else {
      if (n || e.reshuffle) {
        this.pendingShuffle = true;
        this.recount();
      } else {
        this.recount();
      }
    }
    if (t) {
      this.bankroll = e.bankroll ?? this.opts.startBankroll;
      this.phase = "bet";
      this.dealer = { cards: [], hidden: true };
      this.hands = [];
      this.botSeats = [];
      this.bet = 0;
      this.lastBet = this.opts.unit;
      this.active = 0;
      this.session = this.emptySession();
    }
    if (!this.running) {
      this.setupBots();
    }
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
    };
  }
  setupBots() {
    let e = Math.max(0, Math.min(4, this.opts.bots | 0));
    if (!this.botSeats || this.botSeats.length !== e) {
      this.botSeats = Array.from({ length: e }, (t, s) => ({
        name: BOT_NAMES[s],
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
    this.shoeStats = {
      hands: 0,
      checks: 0,
      checksOk: 0,
      decisions: 0,
      decisionsOk: 0,
      net: 0,
    };
    this.needsBurn = this.rules.pen > 0;
  }
  recount() {
    this.rcSys = initialCount(this.sys, this.rules.decks);
    this.rcHilo = 0;
    for (let e of this.seen || []) {
      this.rcSys += countValue(e, this.sys);
      this.rcHilo += hiloValue(e);
    }
  }
  subscribe(e) {
    this.listeners.add(e);
    return () => this.listeners.delete(e);
  }
  emit() {
    this.version++;
    for (let e of this.listeners) {
      e();
    }
  }
  sleep(e = 1) {
    if (this.opts.instant) return Promise.resolve();
    let t = (TABLE_SPEEDS[this.opts.speed] || TABLE_SPEEDS.normal).ms * e;
    return new Promise((s) => setTimeout(s, t));
  }
  toast(e, t = "info", s = 2600) {
    let n = { id: this.toastSeq++, msg: e, kind: t };
    this.toasts = [...this.toasts, n].slice(-3);
    this.emit();
    if (!this.opts.instant) {
      setTimeout(() => {
        this.toasts = this.toasts.filter((l) => l.id !== n.id);
        this.emit();
      }, s);
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
  get useCountCoach() {
    return this.opts.system === "hilo";
  }
  get minBet() {
    return 1;
  }
  get maxBet() {
    return this.opts.unit * 100;
  }
  composition() {
    let e = 0,
      t = 0,
      s = 0;
    for (let n = this.shoe.pos; n < this.shoe.cards.length; n++) {
      let l = hiloValue(this.shoe.cards[n]);
      if (l > 0) {
        e++;
      } else {
        if (l < 0) {
          s++;
        } else {
          t++;
        }
      }
    }
    if (this.dealer.hidden && this.dealer.cards[1]) {
      let n = hiloValue(this.dealer.cards[1]);
      if (n > 0) {
        e++;
      } else {
        if (n < 0) {
          s++;
        } else {
          t++;
        }
      }
    }
    return { low: e, mid: t, high: s, total: e + t + s };
  }
  see(e) {
    this.seen.push(e);
    this.rcSys += countValue(e, this.sys);
    this.rcHilo += hiloValue(e);
  }
  addChip(e) {
    if (this.phase !== "bet" && this.phase !== "settle") return;
    if (this.phase === "settle") {
      this.clearTable();
    }
    let t = Math.min(this.bet + e, this.maxBet, this.bankroll);
    if (t === this.bet) {
      if (this.bet + e > this.bankroll) {
        this.toast("No te alcanzan las fichas.", "warn");
      }
      return;
    }
    this.chipStack = [...(this.chipStack || []), t - this.bet];
    this.bet = t;
    this.emit();
  }
  undoChip() {
    if (this.phase !== "bet" || !this.chipStack || !this.chipStack.length)
      return;
    let e = this.chipStack[this.chipStack.length - 1];
    this.chipStack = this.chipStack.slice(0, -1);
    this.bet = Math.max(0, this.bet - e);
    this.emit();
  }
  clearBet() {
    if (this.phase === "bet") {
      this.bet = 0;
      this.chipStack = [];
      this.emit();
    }
  }
  rebet(e = 1) {
    if ((this.phase === "settle" && this.clearTable(), this.phase !== "bet"))
      return false;
    let t = Math.min(this.lastBet * e, this.maxBet);
    return t > this.bankroll
      ? (this.toast("No te alcanzan las fichas para esa apuesta.", "warn"),
        false)
      : ((this.bet = t), (this.chipStack = [t]), this.emit(), true);
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
    for (let e of this.botSeats) {
      e.hands = [];
    }
    this.phase = "bet";
    this.result = null;
    this.feedback = null;
  }
  async deal() {
    if (
      !this.running &&
      (this.phase === "settle" && this.clearTable(), this.phase === "bet")
    ) {
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
  }
  async playRound() {
    let e = this.rules;
    if (this.shoe.needsShuffle) {
      this.phase = "shuffle";
      this.emit();
      let r = e.pen <= 0;
      this.shoe.shuffleNow();
      this.seen = [];
      this.recount();
      this.roundsThisShoe = 0;
      this.shoeStats = {
        hands: 0,
        checks: 0,
        checksOk: 0,
        decisions: 0,
        decisionsOk: 0,
        net: 0,
      };
      if (!r) {
        this.session.shoes++;
        await this.sleep(2.2);
        this.needsBurn = true;
      }
    }
    if (this.needsBurn) {
      this.burned = this.shoe.draw();
      this.needsBurn = false;
    }
    let t = this.tc;
    if (
      ((this.betFeedback = null),
      this.opts.betCoach && this.useCountCoach && e.pen > 0)
    ) {
      let r = betUnits(t),
        u = r * this.opts.unit,
        d = this.bet === u;
      this.session.bets++;
      if (d) {
        this.session.betsOk++;
      }
      this.betFeedback = {
        ok: d,
        ideal: u,
        units: r,
        tc: floorTC(t),
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
    for (let r of this.botSeats) {
      r.hands = [newHand(this.opts.unit)];
    }
    if (
      ((this.chipStack = []),
      this.emit(),
      this.betFeedback && !this.betFeedback.ok)
    ) {
      let r = this.betFeedback;
      this.toast(
        `Con conteo real ${r.tc >= 0 ? "+" : ""}${r.tc} la apuesta ideal era ${r.units} ${r.units === 1 ? "unidad" : "unidades"} ($${r.ideal}).`,
        "warn",
        3200,
      );
    }
    let s = [...this.botSeats.map((r) => r.hands[0]), this.hands[0]];
    for (let r of s) {
      await this.dealTo(r);
    }
    await this.dealDealer(true);
    for (let r of s) {
      await this.dealTo(r);
    }
    await this.dealDealer(false);
    let n = this.dealer.cards[0],
      l = rankKey(n.r),
      i = isBlackjack(this.hands[0].cards);
    if (l === "A") {
      this.phase = "insurance";
      this.emit();
      let r = await new Promise((d) => (this.insuranceResolver = d));
      this.insuranceResolver = null;
      let u =
        this.useCountCoach && this.opts.deviations
          ? takeInsurance(this.tc, e)
          : false;
      if (
        (this.opts.coach &&
          (this.session.insurance++,
          r === u && this.session.insuranceOk++,
          r !== u &&
            (this.feedback = {
              ok: false,
              id: Date.now(),
              best: u ? "I" : "N",
              chosen: r ? "I" : "N",
              title: u ? "Acá convenía el seguro" : "El seguro no conviene",
              note: u
                ? `Con conteo real ${this.fmtTC()} (+3 o más) el seguro gana plata.`
                : this.opts.deviations && this.useCountCoach
                  ? `Con conteo real ${this.fmtTC()} el seguro pierde. Se toma recién con +3 o más.`
                  : "El seguro es una apuesta aparte que pierde alrededor de 7 % a la larga. Sin contar, nunca lo tomes.",
            })),
        r)
      ) {
        let d = this.hands[0].bet / 2;
        if (d > this.bankroll) {
          this.toast("No te alcanzan las fichas para el seguro.", "warn");
        } else {
          this.insuranceBet = d;
          this.bankroll -= d;
        }
      }
      this.phase = "deal";
      this.emit();
      await this.sleep(0.6);
    }
    let o = false;
    if (
      ((l === "A" || l === "T") &&
        ((o = isBlackjack(this.dealer.cards)),
        o
          ? (await this.revealHole(),
            this.toast("El crupier tiene blackjack.", "bad"))
          : (l === "A" || l === "T") &&
            this.insuranceBet &&
            this.toast(
              "El crupier no tiene blackjack: perdés el seguro.",
              "info",
            )),
      o)
    ) {
      for (let r of this.botSeats)
        for (let u of r.hands) {
          u.done = true;
        }
      for (let r of this.hands) {
        r.done = true;
      }
      await this.settle(true);
      return;
    }
    if (i) {
      this.hands[0].done = true;
      this.toast("¡Blackjack!", "good");
    }
    for (let r of this.botSeats) {
      this.phase = "bots";
      this.emit();
      await this.playBot(r);
    }
    if (
      (i ||
        ((this.phase = "player"),
        (this.active = 0),
        this.emit(),
        await this.playerTurn()),
      (this.phase = "dealer"),
      this.emit(),
      await this.revealHole(),
      [...this.hands, ...this.botSeats.flatMap((r) => r.hands)].some(
        (r) =>
          !r.surrendered &&
          !handValue(r.cards).bust &&
          !(isBlackjack(r.cards, r.fromSplit) && r.cards.length === 2),
      ))
    )
      for (; this.dealerShouldHit();) {
        await this.dealDealer(true);
      }
    await this.settle(false);
  }
  dealerShouldHit() {
    let e = handValue(this.dealer.cards);
    return e.bust
      ? false
      : !!(e.total < 17 || (e.total === 17 && e.soft && this.rules.h17));
  }
  async dealTo(e, { face: t = true } = {}) {
    let s = this.shoe.draw();
    e.cards = [...e.cards, { ...s, faceUp: t }];
    if (t) {
      this.see(s);
    }
    this.emit();
    await this.sleep();
    return s;
  }
  async dealDealer(e) {
    let t = this.shoe.draw();
    this.dealer.cards = [...this.dealer.cards, { ...t, faceUp: e }];
    if (e) {
      this.see(t);
    } else {
      this.dealer.hidden = true;
    }
    this.emit();
    await this.sleep();
    return t;
  }
  async revealHole() {
    if (!this.dealer.hidden) return;
    this.dealer.hidden = false;
    let e = this.dealer.cards[1];
    if (e) {
      this.dealer.cards = this.dealer.cards.map((t, s) =>
        s === 1 ? { ...t, faceUp: true } : t,
      );
      this.see(e);
    }
    this.emit();
    await this.sleep(1.1);
  }
  async playBot(e) {
    let t = this.dealer.cards[0];
    for (let s = 0; s < e.hands.length; s++) {
      let n = e.hands[s];
      if (
        (n.cards.length === 1 && (await this.dealTo(n)),
        isBlackjack(n.cards, n.fromSplit))
      ) {
        n.done = true;
        continue;
      }
      let l = 0;
      for (; !n.done && l++ < 15;) {
        let i = handValue(n.cards);
        if (i.bust || i.total >= 21) {
          n.done = true;
          break;
        }
        let o = allowedActions(n, this.rules, {
          maxHandsReached: e.hands.length >= this.rules.maxHands,
        });
        if (n.splitAces && !this.rules.hitSplitAces && !o.P) {
          n.done = true;
          break;
        }
        let c = basicPlay(n, t.r, this.rules, o).action;
        if (c === "P") {
          await this.splitHand(e.hands, s);
          n = e.hands[s];
          continue;
        }
        if (c === "R") {
          n.surrendered = true;
          n.done = true;
          break;
        }
        if (c === "D") {
          n.bet *= 2;
          n.doubled = true;
          await this.dealTo(n);
          n.done = true;
          break;
        }
        if (c === "S") {
          n.done = true;
          break;
        }
        await this.dealTo(n);
      }
      this.emit();
      await this.sleep(0.35);
    }
  }
  async splitHand(e, t) {
    let s = e[t],
      [n, l] = s.cards,
      i = rankKey(n.r) === "A",
      o = newHand(s.bet, { fromSplit: true, splitAces: i || s.splitAces }),
      c = newHand(s.bet, { fromSplit: true, splitAces: i || s.splitAces });
    o.cards = [n];
    c.cards = [l];
    e.splice(t, 1, o, c);
    this.emit();
    await this.sleep(0.7);
    await this.dealTo(o);
    if (i && !this.rules.hitSplitAces) {
      await this.dealTo(c);
    }
    return [o, c];
  }
  activeHand() {
    return this.hands[this.active];
  }
  allowed() {
    let e = this.activeHand();
    if (!e || this.phase !== "player")
      return { H: false, S: false, D: false, P: false, R: false };
    let t = allowedActions(e, this.rules, {
      maxHandsReached: this.hands.length >= this.rules.maxHands,
    });
    if (e.cards.length === 2 && t.D && e.bet > this.bankroll) {
      t.D = false;
    }
    if (t.P && e.bet > this.bankroll) {
      t.P = false;
    }
    return t;
  }
  async playerTurn() {
    let e = this.dealer.cards[0];
    for (this.active = 0; this.active < this.hands.length; this.active++) {
      let t = this.hands[this.active];
      for (t.cards.length === 1 && (await this.dealTo(t)); !t.done;) {
        let s = handValue(t.cards);
        if (s.bust) {
          t.done = true;
          this.toast(
            this.hands.length > 1
              ? `Mano ${this.active + 1}: te pasaste.`
              : "Te pasaste.",
            "bad",
            1800,
          );
          break;
        }
        if (s.total === 21) {
          t.done = true;
          break;
        }
        let n = this.allowed();
        if (t.splitAces && !this.rules.hitSplitAces && !n.P) {
          t.done = true;
          break;
        }
        this.emit();
        this.decisionStart = Date.now();
        let l = await new Promise((i) => (this.actionResolver = i));
        if (
          ((this.actionResolver = null),
          this.evaluateDecision(t, e, n, l),
          l === "S")
        ) {
          t.done = true;
        } else if (l === "H") {
          await this.dealTo(t);
        } else if (l === "D") {
          this.bankroll -= t.bet;
          t.bet *= 2;
          t.doubled = true;
          await this.dealTo(t);
          t.done = true;
          if (handValue(t.cards).bust) {
            this.toast("Te pasaste.", "bad", 1800);
          }
        } else if (l === "P") {
          this.bankroll -= t.bet;
          await this.splitHand(this.hands, this.active);
          let i = this.hands[this.active];
          this.emit();
          if (i.splitAces && !this.rules.hitSplitAces) {
            if (!this.allowed().P) {
              i.done = true;
            }
          }
          this.active--;
          break;
        } else {
          if (l === "R") {
            t.surrendered = true;
            t.done = true;
          }
        }
      }
      this.emit();
    }
    this.active = -1;
  }
  act(e) {
    if (this.phase !== "player" || !this.actionResolver || !this.allowed()[e])
      return false;
    let s = this.actionResolver;
    this.actionResolver = null;
    s(e);
    return true;
  }
  insure(e) {
    if (this.phase !== "insurance" || !this.insuranceResolver) return;
    let t = this.insuranceResolver;
    this.insuranceResolver = null;
    t(!!e);
  }
  evaluateDecision(e, t, s, n) {
    if (!this.opts.coach) return;
    let l =
        this.useCountCoach && this.opts.deviations
          ? countPlay(e, t.r, this.rules, this.tc, s)
          : null,
      i = basicPlay(e, t.r, this.rules, s),
      o = l ? l.action : i.action,
      c = o === n;
    this.session.decisions++;
    this.shoeStats.decisions++;
    if (c) {
      this.session.decisionsOk++;
      this.shoeStats.decisionsOk++;
    }
    if (
      this.opts.pressure &&
      this.decisionStart &&
      Date.now() - this.decisionStart > 5000
    ) {
      this.session.slow++;
    }
    let r = handValue(e.cards),
      u = {
        kind: isPair(e.cards) && s.P ? "pair" : r.soft ? "soft" : "hard",
        total: r.total,
        g: isPair(e.cards) ? rankKey(e.cards[0].r) : null,
        upRank: t.r,
        nCards: e.cards.length,
      },
      d = "";
    if (c) {
      if (l && l.source === "dev" && l.dev) {
        d = explainDeviation(l.dev, o, this.rules, this.tc);
      }
    } else {
      let p = explainMistake(u, n, o, this.rules),
        f =
          l && l.dev
            ? explainDeviation(l.dev, o, this.rules, this.tc)
            : explainBest(u, o, i.code, this.rules);
      d = [p, f].filter(Boolean).join(" ");
      this.session.mistakes = [
        ...this.session.mistakes,
        {
          spot: `${u.kind === "pair" ? u.g + "," + u.g : (u.kind === "soft" ? "Blando " : "Duro ") + u.total} vs ${upLabel(t.r)}`,
          chosen: n,
          best: o,
        },
      ].slice(-30);
    }
    this.feedback = {
      ok: c,
      chosen: n,
      best: o,
      note: d,
      dev: !!(l && l.source === "dev"),
      id: Date.now(),
    };
    this.emit();
  }
  async settle(e) {
    let t = this.rules,
      s = handValue(this.dealer.cards),
      n = s.total,
      l = s.bust,
      i = -this.insuranceBet,
      o = 0;
    if (this.insuranceBet && e) {
      o += this.insuranceBet * 3;
      i += this.insuranceBet * 3;
    }
    let c = (u, d) => {
      let p = handValue(u.cards),
        f = isBlackjack(u.cards, u.fromSplit),
        y = 0,
        C;
      if (u.surrendered) {
        y = u.bet / 2;
        C = "surrender";
      } else {
        if (e) {
          if (f) {
            y = u.bet;
            C = "push";
          } else {
            y = 0;
            C = "lose";
          }
        } else {
          if (f) {
            y = u.bet + u.bet * t.bjPays;
            C = "bj";
          } else {
            if (p.bust) {
              y = 0;
              C = "bust";
            } else {
              if (l || p.total > n) {
                y = u.bet * 2;
                C = "win";
              } else {
                if (p.total === n) {
                  y = u.bet;
                  C = "push";
                } else {
                  y = 0;
                  C = "lose";
                }
              }
            }
          }
        }
      }
      u.result = C;
      u.payout = y;
      if (d) {
        o += y;
        i += y - u.bet;
      }
    };
    for (let u of this.botSeats)
      for (let d of u.hands) {
        c(d, false);
      }
    for (let u of this.hands) {
      c(u, true);
    }
    this.bankroll += o;
    let r = this.session;
    r.hands++;
    this.shoeStats.hands++;
    this.roundsThisShoe++;
    r.net += i;
    this.shoeStats.net += i;
    if (i > 0) {
      r.won++;
    } else {
      if (i < 0) {
        r.lost++;
      } else {
        r.push++;
      }
    }
    if (this.hands.some((u) => u.result === "bj")) {
      r.bj++;
    }
    r.biggestWin = Math.max(r.biggestWin, i);
    this.lifetime.hands++;
    this.lifetime.net += i;
    this.result = { net: i, dealerTotal: n, dealerBust: l, dealerBJ: e };
    this.phase = "settle";
    this.emit();
    if (i > 0) {
      this.toast(`Ganaste $${money(i)}`, "good", 2000);
    } else {
      if (i < 0) {
        this.toast(`Perdiste $${money(-i)}`, "bad", 2000);
      } else {
        this.toast("Empate", "info", 1600);
      }
    }
    this.countCheckDue = this.shouldCheck();
    this.shoeEnded = this.shoe.needsShuffle && t.pen > 0;
    if (this.shoeEnded) {
      this.countCheckDue = this.opts.countCheck !== "off" ? "final" : false;
    }
    if (this.onRoundEnd) {
      this.onRoundEnd(this.result, this);
    }
    this.emit();
  }
  shouldCheck() {
    let e = this.opts.countCheck;
    if (e === "off" || e === "shoe" || this.rules.pen <= 0) return false;
    let t = e === "often" ? 2 : 4;
    return this.opts.pressure
      ? Math.random() < 0.3
      : this.roundsThisShoe > 0 &&
          this.roundsThisShoe % t === 0 &&
          Math.random() < 0.85;
  }
  submitCountCheck(e) {
    let t = this.rcSys,
      s = Math.abs(e - t) < 0.01;
    this.session.checks++;
    this.shoeStats.checks++;
    if (s) {
      this.session.checksOk++;
      this.shoeStats.checksOk++;
    }
    let n = this.countCheckDue === "final";
    this.countCheckDue = false;
    this.lastCheck = { ok: s, value: e, correct: t, final: n };
    this.emit();
    return { ok: s, correct: t, final: n };
  }
  skipCountCheck() {
    this.countCheckDue = false;
    this.emit();
  }
  fmtTC() {
    let e = this.tc,
      t = Math.round(e * 10) / 10;
    return (
      (t > 0 ? "+" : t < 0 ? "−" : "") +
      Math.abs(t).toFixed(1).replace(".", ",")
    );
  }
  randomChatter() {
    return CHATTER[Math.floor(Math.random() * CHATTER.length)];
  }
};
function money(a) {
  let e = Math.round(a * 100) / 100,
    t = Math.abs(e - Math.round(e)) < 1e-9;
  return Math.abs(e).toLocaleString("es-UY", {
    minimumFractionDigits: t ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
export { TABLE_SPEEDS, Table, money };
