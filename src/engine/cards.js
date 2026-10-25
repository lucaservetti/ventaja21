function secureRandomInt(a) {
  if (a <= 1) return 0;
  let e = globalThis.crypto;
  if (e && e.getRandomValues) {
    let t = new Uint32Array(1),
      s = Math.floor(4294967296 / a) * a,
      n;
    do {
      e.getRandomValues(t);
      n = t[0];
    } while (n >= s);
    return n % a;
  }
  return Math.floor(Math.random() * a);
}
function seededRandom(a) {
  let e = a >>> 0;
  return function () {
    e = (e + 1831565813) >>> 0;
    let t = e;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(a) {
  let e = 2166136261;
  for (let t = 0; t < a.length; t++) {
    e ^= a.charCodeAt(t);
    e = Math.imul(e, 16777619) >>> 0;
  }
  return e >>> 0;
}
function randInt(a, e) {
  return e ? Math.floor(e() * a) : secureRandomInt(a);
}
function shuffle(a, e) {
  for (let t = a.length - 1; t > 0; t--) {
    let s = randInt(t + 1, e),
      n = a[t];
    a[t] = a[s];
    a[s] = n;
  }
  return a;
}
function pick(a, e) {
  return a[randInt(a.length, e)];
}
function weightedIndex(a, e) {
  let t = 0;
  for (let n of a) {
    t += Math.max(0, n);
  }
  if (t <= 0) return randInt(a.length, e);
  let s = (e ? e() : secureRandomInt(1000000000) / 1000000000) * t;
  for (let n = 0; n < a.length; n++)
    if (((s -= Math.max(0, a[n])), s < 0)) return n;
  return a.length - 1;
}
const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const SUITS = ["s", "h", "d", "c"];
const TEN_RANKS = ["10", "J", "Q", "K"];
const SUIT_NAMES = {
  s: "picas",
  h: "corazones",
  d: "diamantes",
  c: "tréboles",
};
const isRedSuit = (a) => a === "h" || a === "d";
const isTenRank = (a) => a === "10" || a === "J" || a === "Q" || a === "K";
function cardValue(a) {
  return a === "A" ? 1 : isTenRank(a) ? 10 : +a;
}
function rankKey(a) {
  return a === "A" ? "A" : isTenRank(a) ? "T" : a;
}
const UP_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
function upIndex(a) {
  return a === "A" ? 9 : isTenRank(a) ? 8 : +a - 2;
}
function upLabel(a) {
  return UP_RANKS[upIndex(a)];
}
let cardSeq = 1;
function makeCard(a, e) {
  return { r: a, s: e || pick(SUITS), id: cardSeq++ };
}
function parseCard(a) {
  let e = /^(10|[2-9AJQKT])([shdc])?$/.exec(a);
  if (!e) throw new Error("Carta inválida: " + a);
  let t = e[1];
  if (t === "T") {
    t = pick(TEN_RANKS);
  }
  return makeCard(t, e[2]);
}
function randomCardOfRank(a, e) {
  let t = a === "T" ? TEN_RANKS[randInt(4, e)] : a;
  return makeCard(t, SUITS[randInt(4, e)]);
}
function buildDecks(a = 1) {
  let e = [];
  for (let t = 0; t < a; t++)
    for (let s of SUITS)
      for (let n of RANKS) {
        e.push(makeCard(n, s));
      }
  return e;
}
const Shoe = class {
  constructor({ decks: e = 6, pen: t = 0.75, rnd: s } = {}) {
    this.decks = e;
    this.pen = t;
    this.rnd = s;
    this.shuffleNow();
  }
  shuffleNow() {
    this.cards = shuffle(buildDecks(this.decks), this.rnd);
    this.pos = 0;
    this.cut = this.pen > 0 ? Math.floor(this.cards.length * this.pen) : 0;
    this.shuffles = (this.shuffles || 0) + 1;
  }
  draw() {
    if (this.pos >= this.cards.length) {
      this.shuffleNow();
    }
    return this.cards[this.pos++];
  }
  get total() {
    return this.cards.length;
  }
  get remaining() {
    return this.cards.length - this.pos;
  }
  get dealt() {
    return this.pos;
  }
  get decksRemaining() {
    return this.remaining / 52;
  }
  get needsShuffle() {
    return this.pen <= 0 ? this.pos > 0 : this.pos >= this.cut;
  }
};
function handValue(a) {
  let e = 0,
    t = 0;
  for (let n of a) {
    e += cardValue(n.r);
    if (n.r === "A") {
      t++;
    }
  }
  let s = t > 0 && e + 10 <= 21;
  return { total: s ? e + 10 : e, soft: s, hard: e, aces: t, bust: e > 21 };
}
function isBlackjack(a, e = false) {
  return !e && a.length === 2 && handValue(a).total === 21;
}
function isPair(a) {
  return a.length === 2 && cardValue(a[0].r) === cardValue(a[1].r);
}
function pairKey(a) {
  return rankKey(a[0].r);
}
const PAIR_NAMES = {
  A: "Par de ases",
  T: "Par de dieces",
  2: "Par de 2",
  3: "Par de 3",
  4: "Par de 4",
  5: "Par de 5",
  6: "Par de 6",
  7: "Par de 7",
  8: "Par de 8",
  9: "Par de 9",
};
function handLabel(a, { fromSplit: e = false, showPair: t = true } = {}) {
  if (!a.length) return "";
  let s = handValue(a);
  return s.bust
    ? `Te pasaste (${s.hard})`
    : isBlackjack(a, e)
      ? "Blackjack"
      : t && isPair(a)
        ? PAIR_NAMES[pairKey(a)]
        : s.soft
          ? `Blando ${s.total}`
          : `Duro ${s.total}`;
}
function handTotalText(a) {
  if (!a.length) return "";
  let e = handValue(a);
  return e.bust
    ? String(e.hard)
    : e.soft && e.total !== 21
      ? `${e.total - 10}/${e.total}`
      : String(e.total);
}
export {
  RANKS,
  SUITS,
  SUIT_NAMES,
  Shoe,
  TEN_RANKS,
  buildDecks,
  handLabel,
  handTotalText,
  handValue,
  hashString,
  isBlackjack,
  isPair,
  isRedSuit,
  makeCard,
  parseCard,
  pick,
  randInt,
  randomCardOfRank,
  rankKey,
  seededRandom,
  shuffle,
  upIndex,
  upLabel,
  weightedIndex,
};
