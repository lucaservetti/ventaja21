import { rulesKey } from "../state.js";
import { handValue, isPair, rankKey, upIndex } from "./cards.js";

const splitRow = (a) => a.trim().split(/\s+/);
const HARD_TABLE = {
  8: splitRow("H H H H H H H H H H"),
  9: splitRow("H D D D D H H H H H"),
  10: splitRow("D D D D D D D D H H"),
  11: splitRow("D D D D D D D D D H"),
  12: splitRow("H H S S S H H H H H"),
  13: splitRow("S S S S S H H H H H"),
  14: splitRow("S S S S S H H H H H"),
  15: splitRow("S S S S S H H H Rh H"),
  16: splitRow("S S S S S H H Rh Rh Rh"),
  17: splitRow("S S S S S S S S S S"),
};
const SOFT_TABLE = {
  12: splitRow("H H H H H H H H H H"),
  13: splitRow("H H H D D H H H H H"),
  14: splitRow("H H H D D H H H H H"),
  15: splitRow("H H D D D H H H H H"),
  16: splitRow("H H D D D H H H H H"),
  17: splitRow("H D D D D H H H H H"),
  18: splitRow("S Ds Ds Ds Ds S S H H H"),
  19: splitRow("S S S S S S S S S S"),
  20: splitRow("S S S S S S S S S S"),
  21: splitRow("S S S S S S S S S S"),
};
const PAIR_TABLE_DAS = {
  2: splitRow("P P P P P P H H H H"),
  3: splitRow("P P P P P P H H H H"),
  4: splitRow("H H H P P H H H H H"),
  5: splitRow("D D D D D D D D H H"),
  6: splitRow("P P P P P H H H H H"),
  7: splitRow("P P P P P P H H H H"),
  8: splitRow("P P P P P P P P P P"),
  9: splitRow("P P P P P S P P S S"),
  T: splitRow("S S S S S S S S S S"),
  A: splitRow("P P P P P P P P P P"),
};
const PAIR_TABLE_NDAS = {
  ...PAIR_TABLE_DAS,
  2: splitRow("H H P P P P H H H H"),
  3: splitRow("H H P P P P H H H H"),
  4: splitRow("H H H H H H H H H H"),
  6: splitRow("H P P P P H H H H H"),
};
function applyH17(a) {
  let e = { ...a.hard },
    t = { ...a.soft },
    s = { ...a.pairs };
  e[11] = splitRow("D D D D D D D D D D");
  e[15] = splitRow("S S S S S H H H Rh Rh");
  e[17] = splitRow("S S S S S S S S S Rs");
  t[18] = splitRow("Ds Ds Ds Ds Ds S S H H H");
  t[19] = splitRow("S S S S Ds S S S S S");
  s[8] = splitRow("P P P P P P P P P Rp");
  return { hard: e, soft: t, pairs: s };
}
const strategyCache = new Map();
function strategyFor(a) {
  let e = rulesKey(a);
  if (strategyCache.has(e)) return strategyCache.get(e);
  let t = {
    hard: HARD_TABLE,
    soft: SOFT_TABLE,
    pairs: a.das ? PAIR_TABLE_DAS : PAIR_TABLE_NDAS,
  };
  if (a.h17) {
    t = applyH17(t);
  }
  strategyCache.set(e, t);
  return t;
}
function tableCode(a, e, t, s) {
  if (e === "pair") return a.pairs[t][s];
  if (e === "soft") return a.soft[Math.min(21, Math.max(12, t))][s];
  let n = t;
  return n <= 8
    ? "H"
    : n >= 17
      ? n === 17
        ? a.hard[17][s]
        : "S"
      : a.hard[n][s];
}
function allowedActions(a, e, { maxHandsReached: t = false } = {}) {
  let s = a.cards,
    n = s.length === 2,
    l = handValue(s),
    i = { H: true, S: true, D: false, P: false, R: false };
  if (
    ((l.bust || l.total >= 21) && (i.H = false),
    a.splitAces && !e.hitSplitAces && (i.H = false),
    n && !l.bust)
  ) {
    let o = !a.fromSplit || e.das;
    if (
      (a.splitAces && !e.hitSplitAces && (o = false),
      e.doubleOn === "9-11" &&
        (o = o && !l.soft && l.total >= 9 && l.total <= 11),
      e.doubleOn === "10-11" &&
        (o = o && !l.soft && l.total >= 10 && l.total <= 11),
      (i.D = o && l.total < 21),
      isPair(s) && !t)
    ) {
      let c = rankKey(s[0].r);
      i.P = c === "A" && a.fromSplit ? !!e.rsa : true;
    }
    i.R = !!e.surrender && !a.fromSplit;
  }
  return i;
}
function resolveCode(a, e) {
  switch (a) {
    case "H":
      return "H";
    case "S":
      return "S";
    case "D":
      return e.D ? "D" : "H";
    case "Ds":
      return e.D ? "D" : "S";
    case "P":
      return e.P ? "P" : null;
    case "Rh":
      return e.R ? "R" : "H";
    case "Rs":
      return e.R ? "R" : "S";
    case "Rp":
      return e.R ? "R" : e.P ? "P" : null;
    default:
      return "H";
  }
}
function basicPlay(a, e, t, s) {
  let n = strategyFor(t),
    l = upIndex(e),
    i = a.cards,
    o = handValue(i),
    c = s || allowedActions(a, t);
  if (o.total >= 21 && !o.bust)
    return {
      action: "S",
      code: "S",
      kind: o.soft ? "soft" : "hard",
      key: o.total,
    };
  if (!c.H && c.S && !c.D && !c.P)
    return {
      action: "S",
      code: "S",
      kind: o.soft ? "soft" : "hard",
      key: o.total,
    };
  if (isPair(i) && c.P) {
    let u = rankKey(i[0].r),
      d = tableCode(n, "pair", u, l),
      p = resolveCode(d, c);
    if (p) return { action: p, code: d, kind: "pair", key: u };
  }
  if (o.soft) {
    let u = tableCode(n, "soft", o.total, l);
    return {
      action: resolveCode(u, c) || "H",
      code: u,
      kind: "soft",
      key: o.total,
    };
  }
  let r = tableCode(n, "hard", o.total, l);
  return {
    action: resolveCode(r, c) || "H",
    code: r,
    kind: "hard",
    key: o.total,
  };
}
const ACTION_NAMES = {
  H: "Pedir",
  S: "Plantarse",
  D: "Doblar",
  P: "Separar",
  R: "Rendirse",
  I: "Tomar seguro",
  N: "Sin seguro",
};
// Las letras de la tabla son las que se usan en todo el mundo (en inglés): H hit, S stand, D double, P split.
const ACTION_EN = {
  H: "hit",
  S: "stand",
  D: "double",
  P: "split",
  R: "surrender",
  I: "insurance",
  N: "no insurance",
};
const CHART_LETTERS = {
  H: "H",
  S: "S",
  D: "D",
  Ds: "D",
  P: "P",
  Rh: "R",
  Rs: "R",
  Rp: "R",
};
// Letra chica: qué hacer si la jugada no se permite (s = plantarse, h = pedir, p = separar).
const CHART_SUBS = { Ds: "s", Rh: "h", Rs: "s", Rp: "p" };
const CHART_CLASS = {
  H: "hit",
  S: "stand",
  D: "dbl",
  Ds: "dbl",
  P: "split",
  Rh: "surr",
  Rs: "surr",
  Rp: "surr",
};
const ILLUSTRIOUS_18 = [
  {
    id: "ins",
    rank: 1,
    type: "ins",
    up: "A",
    s17: 3,
    h17: 3,
    at: "I",
    below: "N",
    label: "Seguro",
  },
  {
    id: "16v10",
    rank: 2,
    type: "hard",
    total: 16,
    up: "10",
    s17: 0,
    h17: 0,
    at: "S",
    below: "H",
    label: "16 contra 10",
  },
  {
    id: "15v10",
    rank: 3,
    type: "hard",
    total: 15,
    up: "10",
    s17: 4,
    h17: 4,
    at: "S",
    below: "H",
    label: "15 contra 10",
  },
  {
    id: "TTv5",
    rank: 4,
    type: "pair",
    g: "T",
    up: "5",
    s17: 5,
    h17: 5,
    at: "P",
    below: "S",
    label: "10,10 contra 5",
  },
  {
    id: "TTv6",
    rank: 5,
    type: "pair",
    g: "T",
    up: "6",
    s17: 4,
    h17: 4,
    at: "P",
    below: "S",
    label: "10,10 contra 6",
  },
  {
    id: "10v10",
    rank: 6,
    type: "hard",
    total: 10,
    up: "10",
    s17: 4,
    h17: 4,
    at: "D",
    below: "H",
    label: "10 contra 10",
  },
  {
    id: "12v3",
    rank: 7,
    type: "hard",
    total: 12,
    up: "3",
    s17: 2,
    h17: 2,
    at: "S",
    below: "H",
    label: "12 contra 3",
  },
  {
    id: "12v2",
    rank: 8,
    type: "hard",
    total: 12,
    up: "2",
    s17: 3,
    h17: 3,
    at: "S",
    below: "H",
    label: "12 contra 2",
  },
  {
    id: "11vA",
    rank: 9,
    type: "hard",
    total: 11,
    up: "A",
    s17: 1,
    h17: -1,
    at: "D",
    below: "H",
    label: "11 contra As",
  },
  {
    id: "9v2",
    rank: 10,
    type: "hard",
    total: 9,
    up: "2",
    s17: 1,
    h17: 1,
    at: "D",
    below: "H",
    label: "9 contra 2",
  },
  {
    id: "10vA",
    rank: 11,
    type: "hard",
    total: 10,
    up: "A",
    s17: 4,
    h17: 3,
    at: "D",
    below: "H",
    label: "10 contra As",
  },
  {
    id: "9v7",
    rank: 12,
    type: "hard",
    total: 9,
    up: "7",
    s17: 3,
    h17: 3,
    at: "D",
    below: "H",
    label: "9 contra 7",
  },
  {
    id: "16v9",
    rank: 13,
    type: "hard",
    total: 16,
    up: "9",
    s17: 5,
    h17: 5,
    at: "S",
    below: "H",
    label: "16 contra 9",
  },
  {
    id: "13v2",
    rank: 14,
    type: "hard",
    total: 13,
    up: "2",
    s17: -1,
    h17: -1,
    at: "S",
    below: "H",
    label: "13 contra 2",
  },
  {
    id: "12v4",
    rank: 15,
    type: "hard",
    total: 12,
    up: "4",
    s17: 0,
    h17: 0,
    at: "S",
    below: "H",
    label: "12 contra 4",
  },
  {
    id: "12v5",
    rank: 16,
    type: "hard",
    total: 12,
    up: "5",
    s17: -2,
    h17: -2,
    at: "S",
    below: "H",
    label: "12 contra 5",
  },
  {
    id: "12v6",
    rank: 17,
    type: "hard",
    total: 12,
    up: "6",
    s17: -1,
    h17: -3,
    at: "S",
    below: "H",
    label: "12 contra 6",
  },
  {
    id: "13v3",
    rank: 18,
    type: "hard",
    total: 13,
    up: "3",
    s17: -2,
    h17: -2,
    at: "S",
    below: "H",
    label: "13 contra 3",
  },
];
const FAB_4 = [
  {
    id: "14v10R",
    rank: 1,
    type: "hard",
    total: 14,
    up: "10",
    s17: 3,
    h17: 3,
    at: "R",
    below: "H",
    label: "14 contra 10",
  },
  {
    id: "15v10R",
    rank: 2,
    type: "hard",
    total: 15,
    up: "10",
    s17: 0,
    h17: 0,
    at: "R",
    below: "H",
    label: "15 contra 10",
  },
  {
    id: "15v9R",
    rank: 3,
    type: "hard",
    total: 15,
    up: "9",
    s17: 2,
    h17: 2,
    at: "R",
    below: "H",
    label: "15 contra 9",
  },
  {
    id: "15vAR",
    rank: 4,
    type: "hard",
    total: 15,
    up: "A",
    s17: 1,
    h17: -1,
    at: "R",
    below: "H",
    label: "15 contra As",
  },
];
function indexFor(a, e) {
  return e.h17 ? a.h17 : a.s17;
}
function upMatches(a, e) {
  let t = upIndex(e);
  return upIndex(a === "10" ? "10" : a) === t;
}
function countPlay(a, e, t, s, n) {
  let l = n || allowedActions(a, t),
    i = basicPlay(a, e, t, l),
    o = a.cards,
    c = handValue(o);
  if (c.bust || c.total >= 21)
    return { action: i.action, source: "basic", basic: i };
  if (
    l.R &&
    !c.soft &&
    !(isPair(o) && l.P && i.kind === "pair" && i.action === "P")
  ) {
    let r = FAB_4.find((u) => u.total === c.total && upMatches(u.up, e));
    if (r) {
      let u = indexFor(r, t);
      if (s >= u) return devResult("R", r, u, i, true);
      let d = { ...l, R: false },
        p = countPlay(a, e, t, s, d);
      return {
        ...p,
        basic: i,
        dev: p.dev || r,
        idx: p.dev ? p.idx : u,
        source: "dev",
        above: false,
      };
    }
    if (i.action === "R") return { action: "R", source: "basic", basic: i };
  }
  if (isPair(o) && l.P && rankKey(o[0].r) === "T") {
    let r = ILLUSTRIOUS_18.find((u) => u.type === "pair" && upMatches(u.up, e));
    if (r) {
      let u = indexFor(r, t);
      return devResult(s >= u ? "P" : "S", r, u, i, s >= u);
    }
  }
  if (i.kind === "pair" && i.action === "P")
    return { action: "P", source: "basic", basic: i };
  if (!c.soft) {
    let r = ILLUSTRIOUS_18.find(
      (u) => u.type === "hard" && u.total === c.total && upMatches(u.up, e),
    );
    if (r) {
      let u = indexFor(r, t),
        d = s >= u ? r.at : r.below;
      if (d === "D" && !l.D) {
        d = "H";
      }
      return devResult(d, r, u, i, s >= u);
    }
  }
  return { action: i.action, source: "basic", basic: i };
}
function devResult(a, e, t, s, n) {
  return {
    action: a,
    source: a === s.action ? "basic" : "dev",
    dev: e,
    idx: t,
    basic: s,
    above: n,
  };
}
function takeInsurance(a, e) {
  let t = indexFor(ILLUSTRIOUS_18[0], e);
  return a >= t;
}
export {
  ACTION_EN,
  ACTION_NAMES,
  CHART_CLASS,
  CHART_LETTERS,
  CHART_SUBS,
  FAB_4,
  ILLUSTRIOUS_18,
  allowedActions,
  basicPlay,
  countPlay,
  indexFor,
  strategyFor,
  takeInsurance,
};
