import { rankKey } from "./cards.js";

const SYSTEMS = {
  hilo: {
    id: "hilo",
    name: "Hi-Lo",
    level: "Principiante",
    balanced: true,
    values: { A: -1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 0, 8: 0, 9: 0, T: -1 },
    blurb:
      "Bajas (2–6) +1, altas (10–A) −1, 7–9 neutras. El más usado: fácil y muy efectivo.",
  },
  ko: {
    id: "ko",
    name: "KO (Knock-Out)",
    short: "KO",
    level: "Principiante",
    balanced: false,
    values: { A: -1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 0, 9: 0, T: -1 },
    irc: (a) => 4 - 4 * a,
    pivot: 4,
    blurb:
      "Como Hi-Lo pero el 7 suma. No se divide por los mazos: arrancás en 4 − 4 × mazos.",
  },
  hiopt1: {
    id: "hiopt1",
    name: "Hi-Opt I",
    level: "Intermedio",
    balanced: true,
    values: { A: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 1, 7: 0, 8: 0, 9: 0, T: -1 },
    blurb: "Solo 3–6 suman y solo los dieces restan. El As y el 2 son neutros.",
  },
  hiopt2: {
    id: "hiopt2",
    name: "Hi-Opt II",
    level: "Avanzado",
    balanced: true,
    values: { A: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0, T: -2 },
    blurb:
      "De dos niveles: 4 y 5 valen +2, los dieces −2. Más preciso, más trabajo.",
  },
  zen: {
    id: "zen",
    name: "Zen Count",
    short: "Zen",
    level: "Avanzado",
    balanced: true,
    values: { A: -1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 1, 8: 0, 9: 0, T: -2 },
    blurb: "Dos niveles con el As en −1. Muy bueno para apostar.",
  },
  omega2: {
    id: "omega2",
    name: "Omega II",
    level: "Avanzado",
    balanced: true,
    values: { A: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 1, 8: 0, 9: -1, T: -2 },
    blurb:
      "Cartas de +2 a −2 y el As neutro. Preciso, pero cuesta sostenerlo en una mesa rápida.",
  },
  halves: {
    id: "halves",
    name: "Wong Halves",
    short: "Halves",
    level: "Experto",
    balanced: true,
    values: {
      A: -1,
      2: 0.5,
      3: 1,
      4: 1,
      5: 1.5,
      6: 1,
      7: 0.5,
      8: 0,
      9: -0.5,
      T: -1,
    },
    blurb:
      "Usa medios puntos (el 5 vale +1½). Uno de los más precisos que existen.",
  },
};
const SYSTEM_IDS = [
  "hilo",
  "ko",
  "hiopt1",
  "hiopt2",
  "zen",
  "omega2",
  "halves",
];
function systemFor(a) {
  return SYSTEMS[a] || SYSTEMS.hilo;
}
function countValue(a, e = SYSTEMS.hilo) {
  return e.values[rankKey(a.r)];
}
function hiloValue(a) {
  return SYSTEMS.hilo.values[rankKey(a.r)];
}
function initialCount(a, e) {
  return a.balanced ? 0 : a.irc(e);
}
function systemTags(a) {
  let e = new Set(Object.values(a.values));
  e.add(0);
  return [...e].sort((t, s) => t - s);
}
function fmtTag(a) {
  if (a === 0) return "0";
  let e = a > 0 ? "+" : "−",
    t = Math.abs(a),
    s = Math.floor(t);
  return t - s >= 0.5 ? e + (s ? String(s) : "") + "½" : e + s;
}
function fmtSigned(a, e = 0) {
  if (a == null || Number.isNaN(a)) return "—";
  let t = e ? Number(a.toFixed(e)) : Math.round(a * 2) / 2;
  if (Object.is(t, -0) || t === 0) return "0";
  let s = t > 0 ? "+" : "−",
    n = Math.abs(t).toFixed(e || (Math.abs(t) % 1 ? 1 : 0));
  n = n.replace(".", ",");
  return s + n;
}
function trueCount(a, e) {
  return a / Math.max(0.5, e);
}
function floorTC(a) {
  return Math.floor(a + 1e-9);
}
const BET_RAMP = [
  { tc: "≤ +1", units: 1 },
  { tc: "+2", units: 2 },
  { tc: "+3", units: 4 },
  { tc: "+4", units: 6 },
  { tc: "≥ +5", units: 8 },
];
function betUnits(a) {
  let e = floorTC(a);
  return e <= 1 ? 1 : e === 2 ? 2 : e === 3 ? 4 : e === 4 ? 6 : 8;
}
export {
  BET_RAMP,
  SYSTEMS,
  SYSTEM_IDS,
  betUnits,
  countValue,
  floorTC,
  fmtSigned,
  fmtTag,
  hiloValue,
  initialCount,
  systemFor,
  systemTags,
  trueCount,
};
