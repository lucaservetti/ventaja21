import { rulesKey } from "../state.js";
import {
  SUITS,
  TEN_RANKS,
  handValue,
  makeCard,
  pick,
  randInt,
  randomCardOfRank,
  weightedIndex,
} from "./cards.js";
import {
  FAB_4,
  ILLUSTRIOUS_18,
  allowedActions,
  basicPlay,
  countPlay,
} from "./strategy.js";
import { actionEVs } from "./ev.js";
import {
  costText,
  explainBest,
  explainDeviation,
  explainMistake,
} from "./explain.js";

const UPS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "A"];
const SKILLS = [
  {
    id: "stiff",
    name: "Duras 12–16",
    sub: "Las manos con las que te podés pasar",
    icon: ["K", "6"],
  },
  {
    id: "soft",
    name: "Blandas",
    sub: "Manos con un As que vale 11",
    icon: ["A", "7"],
  },
  { id: "pairs", name: "Pares", sub: "Cuándo separar", icon: ["8", "8"] },
  { id: "doubles", name: "Dobles", sub: "9, 10 y 11", icon: ["6", "5"] },
  {
    id: "surrender",
    name: "Rendición",
    sub: "Cuándo devolver media apuesta",
    icon: ["10", "6"],
    needs: "surrender",
  },
  {
    id: "count",
    name: "Con conteo",
    sub: "Desviaciones del Illustrious 18",
    icon: ["10", "10"],
  },
];
function spotKey(a, e, t) {
  return `${a === "hard" ? "H" : a === "soft" ? "S" : "P"}${e}|${t}`;
}
function parseSpot(a) {
  let [e, t] = a.split("|"),
    s = e[0],
    n = e.slice(1);
  return s === "P"
    ? { kind: "pair", g: n, up: t }
    : { kind: s === "H" ? "hard" : "soft", total: +n, up: t };
}
const upRankFor = (a, e) => (a === "T" ? TEN_RANKS[randInt(4, e)] : a);
const randomSuit = (a) => SUITS[randInt(4, a)];
const rankFromNum = (a) => (a === 10 ? "10" : a === 1 ? "A" : String(a));
function hardCards(a, e, t) {
  if (e === 3 && a >= 7)
    for (let o = 0; o < 200; o++) {
      let c = 2 + randInt(Math.min(8, a - 4) - 1, t),
        r = 2 + randInt(Math.min(8, a - c - 2) - 1 || 1, t),
        u = a - c - r;
      if (u >= 2 && u <= 10 && c !== r)
        return [
          makeCard(
            c === 10 ? pick(TEN_RANKS, t) : rankFromNum(c),
            randomSuit(t),
          ),
          makeCard(rankFromNum(r), randomSuit(t)),
          makeCard(
            u === 10 ? pick(TEN_RANKS, t) : rankFromNum(u),
            randomSuit(t),
          ),
        ];
    }
  let s = [];
  for (let o = 2; o <= 10; o++) {
    let c = a - o;
    if (c >= o && c <= 10 && c !== o) {
      s.push([o, c]);
    }
  }
  if (!s.length) throw new Error("No hay cartas para duro " + a);
  let [n, l] = pick(s, t),
    i = [
      makeCard(rankFromNum(n), randomSuit(t)),
      makeCard(l === 10 ? pick(TEN_RANKS, t) : rankFromNum(l), randomSuit(t)),
    ];
  return randInt(2, t) ? i : i.reverse();
}
function softCards(a, e, t) {
  let s = a - 11;
  if (e === 3 && s >= 4) {
    let l = 2 + randInt(s - 3, t),
      i = s - l;
    if (i >= 2)
      return [
        makeCard("A", randomSuit(t)),
        makeCard(rankFromNum(l), randomSuit(t)),
        makeCard(rankFromNum(i), randomSuit(t)),
      ];
  }
  let n = [
    makeCard("A", randomSuit(t)),
    makeCard(rankFromNum(s), randomSuit(t)),
  ];
  return randInt(2, t) ? n : n.reverse();
}
function pairCards(a, e) {
  if (a === "T") {
    let t = pick(TEN_RANKS, e);
    return [makeCard(t, randomSuit(e)), makeCard(t, randomSuit(e))];
  }
  return [randomCardOfRank(a, e), randomCardOfRank(a, e)];
}
function makeSpot(a, { nCards: e = 2, rnd: t, tc: s = null } = {}) {
  let n = parseSpot(a),
    l = upRankFor(n.up, t),
    i;
  if (n.kind === "pair") {
    i = pairCards(n.g, t);
  } else {
    if (n.kind === "soft") {
      i = softCards(n.total, e, t);
    } else {
      i = hardCards(n.total, e, t);
    }
  }
  let o = handValue(i);
  return {
    key: a,
    kind: n.kind,
    total: o.total,
    g: n.kind === "pair" ? n.g : null,
    up: n.up,
    upRank: l,
    dealer: makeCard(l, randomSuit(t)),
    cards: i,
    nCards: i.length,
    tc: s,
  };
}
function spotHand(a) {
  return { cards: a.cards, fromSplit: false, splitAces: false };
}
function skillSpots(a, e) {
  let t = [],
    s = UPS;
  if (a === "stiff")
    for (let n = 12; n <= 16; n++)
      for (let l of s) {
        t.push(spotKey("hard", n, l));
      }
  if (a === "doubles")
    for (let n = 9; n <= 11; n++)
      for (let l of s) {
        t.push(spotKey("hard", n, l));
      }
  if (a === "easy")
    for (let n of [5, 6, 7, 8, 17, 18, 19])
      for (let l of s) {
        t.push(spotKey("hard", n, l));
      }
  if (a === "soft")
    for (let n = 13; n <= 20; n++)
      for (let l of s) {
        t.push(spotKey("soft", n, l));
      }
  if (a === "pairs")
    for (let n of ["A", "T", "9", "8", "7", "6", "5", "4", "3", "2"])
      for (let l of s) {
        t.push(spotKey("pair", n, l));
      }
  if (a === "surrender") {
    let n = [
      "H16|9",
      "H16|T",
      "H16|A",
      "H15|T",
      "H15|9",
      "H15|A",
      "H16|8",
      "H14|T",
      "H17|A",
      "P8|A",
      "P8|T",
      "H16|7",
      "H13|T",
      "H12|A",
    ];
    t.push(...n);
  }
  return t;
}
const difficultyCache = new Map();
function spotDifficulty(a, e) {
  let t = rulesKey(e) + "#" + a;
  if (difficultyCache.has(t)) return difficultyCache.get(t);
  let s = makeSpot(a, { rnd: () => 0.37 }),
    n = spotHand(s),
    l = allowedActions(n, e),
    i = basicPlay(n, s.upRank, e, l).action,
    o = actionEVs(s.cards, s.upRank, e, l),
    c = o[i],
    r = -1 / 0;
  for (let [f, y] of Object.entries(o)) {
    if (f !== i && y > r) {
      r = y;
    }
  }
  let u = Math.max(0, c - r),
    d;
  if (u >= 0.25) {
    d = 700;
  } else {
    if (u >= 0.12) {
      d = 880;
    } else {
      if (u >= 0.06) {
        d = 1030;
      } else {
        if (u >= 0.03) {
          d = 1170;
        } else {
          d = 1320;
        }
      }
    }
  }
  let p = s.up;
  if (s.kind === "soft" && i === "D") {
    d += 90;
  }
  if (s.kind === "soft" && s.total === 18 && (i === "H" || p === "2")) {
    d += 90;
  }
  if (
    s.kind === "pair" &&
    s.g === "9" &&
    (p === "7" || p === "T" || p === "A")
  ) {
    d += 80;
  }
  if (s.kind === "hard" && s.total === 12 && (p === "2" || p === "3")) {
    d += 80;
  }
  if (i === "R") {
    d += 60;
  }
  if (s.kind === "hard" && (s.total <= 8 || s.total >= 17) && i !== "R") {
    d = Math.min(d, 620);
  }
  if (s.kind === "pair" && (s.g === "A" || s.g === "T")) {
    d = Math.min(d, 650);
  }
  d = Math.min(1500, d);
  difficultyCache.set(t, d);
  return d;
}
function gradeSpot(a, e, t, { useCount: s = false } = {}) {
  let n = spotHand(a),
    l = allowedActions(n, t),
    i = basicPlay(n, a.upRank, t, l),
    o = i.action,
    c = null,
    r = null;
  if (s && a.tc !== null && a.tc !== undefined) {
    r = countPlay(n, a.upRank, t, a.tc, l);
    o = r.action;
    c = r.dev || null;
  }
  let u = e === o,
    d = actionEVs(a.cards, a.upRank, t, l),
    p = 0;
  if (!u && !c && d[e] !== undefined && d[o] !== undefined) {
    p = Math.max(0, d[o] - d[e]);
  }
  let f = [];
  if (!u) {
    let C = explainMistake(a, e, o, t);
    if (C) {
      f.push(C);
    }
  }
  if (c) {
    f.push(explainDeviation(c, o, t, a.tc));
  } else {
    f.push(explainBest(a, o, i.code, t));
  }
  let y = u ? "" : costText(p);
  return {
    correct: u,
    best: o,
    chosen: e,
    basic: i.action,
    code: i.code,
    dev: c,
    lines: f,
    cost: p,
    costText: y,
    allowed: l,
  };
}
function buildSession({
  mode: a = "mixed",
  focus: e = null,
  rules: t,
  stats: s = {},
  size: n = 10,
  rnd: l,
}) {
  let i = {},
    o = ["stiff", "soft", "pairs", "doubles", "easy"];
  for (let f of [...o, "surrender"]) {
    i[f] = skillSpots(f, t);
  }
  let c = [],
    r = (f) => {
      let y = s[f],
        C = 1;
      if (!y || !y.n) {
        C += 0.6;
      } else {
        let k = y.recent || [],
          v = k.filter((m) => !m).length;
        C += v * 2.2;
        if (k.length && !k[k.length - 1]) {
          C += 2;
        }
        if (y.ok / y.n > 0.95 && y.n >= 3) {
          C *= 0.6;
        }
      }
      return C;
    };
  if (a === "spot" && e) {
    let f = parseSpot(e),
      y = new Set(),
      C = UPS.indexOf(f.up);
    for (let m of [-1, 1]) {
      if (UPS[C + m]) {
        y.add(
          f.kind === "pair"
            ? spotKey("pair", f.g, UPS[C + m])
            : spotKey(f.kind, f.total, UPS[C + m]),
        );
      }
    }
    if (f.kind !== "pair")
      for (let m of [-1, 1]) {
        let b = f.total + m;
        if (
          (f.kind === "hard" && b >= 5 && b <= 19) ||
          (f.kind === "soft" && b >= 13 && b <= 20)
        ) {
          y.add(spotKey(f.kind, b, f.up));
        }
      }
    let k = [...y],
      v = [];
    for (let m = 0; m < n; m++) {
      v.push(m % 2 === 0 || !k.length ? e : k[randInt(k.length, l)]);
    }
    return shuffleInPlace(v, l);
  }
  if (a === "skill" && e) {
    c = i[e].map((y) => [y, r(y)]);
    let f = [];
    for (let y = 0; y < n; y++) {
      f.push(pickSpot(c, f, l));
    }
    return f;
  }
  let u = { stiff: 0.3, soft: 0.22, pairs: 0.2, doubles: 0.18, easy: 0.1 },
    d = Object.keys(u),
    p = [];
  for (let f = 0; f < n; f++) {
    let y;
    if (a === "level") {
      y = [
        "stiff",
        "soft",
        "pairs",
        "doubles",
        "stiff",
        "soft",
        "easy",
        "pairs",
        "doubles",
        "stiff",
      ][f % 10];
    } else {
      y =
        d[
          weightedIndex(
            d.map((k) => u[k]),
            l,
          )
        ];
    }
    let C = i[y].map((k) => [k, a === "level" ? 1 : r(k)]);
    p.push(pickSpot(C, p, l));
  }
  return p;
}
function pickSpot(a, e, t) {
  for (let s = 0; s < 30; s++) {
    let n = weightedIndex(
        a.map((o) => o[1]),
        t,
      ),
      l = a[n][0],
      i = e.filter((o) => o === l).length;
    if (i === 0 || (i < 2 && s > 10)) return l;
  }
  return a[randInt(a.length, t)][0];
}
function shuffleInPlace(a, e) {
  for (let t = a.length - 1; t > 0; t--) {
    let s = randInt(t + 1, e);
    [a[t], a[s]] = [a[s], a[t]];
  }
  return a;
}
function cardsForSpot(a, e) {
  let t = parseSpot(a);
  return t.kind === "pair"
    ? 2
    : (t.kind === "hard" &&
          t.total >= 12 &&
          t.total <= 16 &&
          randInt(5, e) === 0) ||
        (t.kind === "soft" &&
          t.total >= 15 &&
          t.total <= 19 &&
          randInt(5, e) === 0)
      ? 3
      : 2;
}
function deviationSpot(a, e) {
  let t = a.surrender ? ["16v10", "16v9", "15v10"] : [],
    s = ILLUSTRIOUS_18.filter(
      (u) => u.type !== "ins" && !t.includes(u.id),
    ).concat(a.surrender ? FAB_4 : []),
    n = s[randInt(s.length, e)],
    l = a.h17 ? n.h17 : n.s17,
    i = [-2, -1, 0, 0, 1, 2],
    o = l + i[randInt(i.length, e)],
    c;
  if (n.type === "pair") {
    c = spotKey("pair", "T", n.up === "10" ? "T" : n.up);
  } else {
    c = spotKey("hard", n.total, n.up === "10" ? "T" : n.up);
  }
  return { spot: makeSpot(c, { rnd: e, tc: o }), dev: n, idx: l };
}
export {
  SKILLS,
  UPS,
  buildSession,
  cardsForSpot,
  deviationSpot,
  gradeSpot,
  makeSpot,
  parseSpot,
  skillSpots,
  spotDifficulty,
};
