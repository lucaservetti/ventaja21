import { useSyncExternalStore } from "react";

const DEFAULT_RULES = {
  decks: 6,
  h17: false,
  das: true,
  surrender: false,
  bjPays: 1.5,
  doubleOn: "any",
  rsa: false,
  maxHands: 4,
  pen: 0.75,
};
const TABLE_PRESETS = [
  {
    id: "casino",
    name: "Casino clásico",
    desc: "6 mazos, el crupier se planta con 17 blando, corte al 75 %.",
    rules: {
      decks: 6,
      h17: false,
      das: true,
      surrender: false,
      bjPays: 1.5,
      pen: 0.75,
    },
  },
  {
    id: "casino8",
    name: "Casino 8 mazos",
    desc: "8 mazos, el crupier pide con 17 blando, corte al 75 %.",
    rules: {
      decks: 8,
      h17: true,
      das: true,
      surrender: false,
      bjPays: 1.5,
      pen: 0.75,
    },
  },
  {
    id: "vegas",
    name: "Vegas con rendición",
    desc: "6 mazos, pide con 17 blando, rendición tardía, corte al 80 %.",
    rules: {
      decks: 6,
      h17: true,
      das: true,
      surrender: true,
      bjPays: 1.5,
      pen: 0.8,
    },
  },
  {
    id: "live",
    name: "Online en vivo",
    desc: "8 mazos con crupier real. Cortan cerca de la mitad del zapato.",
    rules: {
      decks: 8,
      h17: false,
      das: true,
      surrender: false,
      bjPays: 1.5,
      pen: 0.5,
    },
  },
  {
    id: "rng",
    name: "Online automático (RNG)",
    desc: "Se mezcla después de cada mano. Contar no sirve: probalo.",
    rules: {
      decks: 6,
      h17: false,
      das: true,
      surrender: false,
      bjPays: 1.5,
      pen: 0,
    },
  },
  {
    id: "trap",
    name: "Mesa 6:5 (trampa)",
    desc: "Paga 6:5 el blackjack y pide con 17 blando. Para ver cuánto cuesta.",
    rules: {
      decks: 6,
      h17: true,
      das: true,
      surrender: false,
      bjPays: 1.2,
      pen: 0.75,
    },
  },
];
function withRules(a) {
  return { ...DEFAULT_RULES, ...(a || {}) };
}
function rulesKey(a) {
  return [
    a.h17 ? "H17" : "S17",
    a.das ? "DAS" : "NDAS",
    a.surrender ? "LS" : "NS",
    a.doubleOn,
  ].join("|");
}
function describeRules(a) {
  let e = [];
  e.push(`${a.decks} mazos`);
  e.push(a.h17 ? "Pide con 17 blando (H17)" : "Se planta con 17 blando (S17)");
  e.push(a.bjPays === 1.5 ? "Blackjack paga 3:2" : "Blackjack paga 6:5");
  e.push(a.das ? "Doblar después de separar" : "Sin doblar tras separar");
  if (a.surrender) {
    e.push("Rendición tardía");
  }
  if (a.doubleOn !== "any") {
    e.push(a.doubleOn === "9-11" ? "Doblar solo 9–11" : "Doblar solo 10–11");
  }
  e.push(
    a.pen > 0 ? `Corte al ${Math.round(a.pen * 100)} %` : "Mezcla cada mano",
  );
  return e;
}
function eloExpected(a, e) {
  return 1 / (1 + Math.pow(10, (e - a) / 400));
}
function eloDelta(a, e, t, s = 40) {
  let n = eloExpected(a, e),
    l = t ? s * (1 - n) : -s * n,
    i = Math.round(l);
  return i === 0 ? (t ? 1 : -1) : i;
}
const LEVELS = [
  {
    min: 0,
    name: "Ficha blanca",
    chip: "#ece6d6",
    note: "Estás aprendiendo las bases.",
  },
  {
    min: 950,
    name: "Ficha roja",
    chip: "#d23b3b",
    note: "Ya jugás la mayoría de las manos bien.",
  },
  {
    min: 1100,
    name: "Ficha verde",
    chip: "#2f9e5b",
    note: "Dominás la estrategia básica.",
  },
  {
    min: 1250,
    name: "Ficha negra",
    chip: "#1b1b1b",
    note: "Casi no cometés errores.",
  },
  {
    min: 1400,
    name: "Ficha dorada",
    chip: "#e9b949",
    note: "Nivel de jugador profesional.",
  },
];
function levelFor(a) {
  let e = LEVELS[0];
  for (let t of LEVELS) {
    if (a >= t.min) {
      e = t;
    }
  }
  return e;
}
function nextLevel(a) {
  return LEVELS.find((e) => e.min > a) || null;
}
const STORAGE_KEY = "ventaja21.state.v1";
const DEFAULT_STATE = {
  v: 1,
  profile: {
    onboarded: false,
    experience: null,
    goal: null,
    startSection: 1,
    createdAt: null,
    placement: null,
  },
  settings: {
    system: "hilo",
    sound: true,
    ambience: false,
    theme: "dark",
    bigText: false,
    haptics: true,
    rules: { ...DEFAULT_RULES },
    unlockAll: false,
    showCost: true,
  },
  table: {
    bankroll: 1000,
    startBankroll: 1000,
    unit: 10,
    bots: 0,
    spots: 1,
    speed: "normal",
    coach: true,
    betCoach: true,
    deviations: false,
    countCheck: "sometimes",
    pressure: false,
    showCount: true,
    xray: false,
    preset: "casino",
  },
  rating: { value: 1000, peak: 1000, history: [] },
  train: {
    cells: {},
    sessions: [],
    longestStreak: 0,
    bestSession: null,
    exams: [],
    totalHands: 0,
    totalOk: 0,
    // Manos que fallaste, tal cual te tocaron: { key, cards, up, chosen, best, src, t, misses, streak }.
    mistakes: [],
    blitz: { best: 0, plays: 0, last: [] },
  },
  weekly: { done: {} },
  drills: {
    values: { sessions: [], ranks: {}, bestStreak: 0 },
    running: { sessions: [], bestPerfectTime: null },
    true: { sessions: [] },
    decks: { sessions: [] },
    bet: { sessions: [] },
    deck: { sessions: [] },
    count: { sessions: [] },
  },
  path: { done: {} },
  // Ruta de conteo de 10 niveles: niveles superados (con su mejor puntaje) e intentos.
  countPath: { passed: {}, tries: {}, practiced: {} },
  // Meta diaria: minutos por día y segundos practicados cada día ({ s, g }: segundos y meta de ese día).
  dailyGoal: { minutes: 10, chosen: false, days: {}, celebrated: null },
  // Repaso: preguntas de lecciones que fallaste ({ [lessonId:step]: { misses, ok, due, at } }).
  review: { items: {} },
  // Examen final (zapato completo jugando, contando y apostando).
  finalExam: { attempts: [], passed: null },
  lessons: {},
  daily: { last: null, streak: 0, best: 0, results: {} },
  play: {
    hands: 0,
    net: 0,
    decisions: 0,
    decisionsOk: 0,
    checks: 0,
    checksOk: 0,
    shoes: 0,
    bets: 0,
    betsOk: 0,
  },
  activity: {},
  // Tarjetas de la tabla (repaso espaciado): { [spotKey]: { box, due, n, ok } } y cuántas nuevas hoy.
  srs: { cards: {}, newDay: null, newToday: 0 },
  // Modo casino real: lo último que elegiste y tus visitas al casino.
  casino: {
    setup: {
      wallet: 1000,
      buyIn: 300,
      minBet: 10,
      maxBet: 500,
      decisionTime: 6,
      bots: 3,
      heat: true,
    },
    trips: [],
  },
  // Ruta de desviaciones: niveles aprobados (con su mejor puntaje) e intentos.
  devPath: { passed: {}, tries: {} },
  // Diario de casino real: sesiones jugadas de verdad ({ id, date, place, hours, result }).
  journal: { entries: [] },
  // Logros: { [id]: fecha }. "init" evita festejar de golpe los que ya tenías.
  achievements: { got: {}, init: false },
  lastTab: "aprender",
};
function deepMerge(a, e) {
  if (!e || typeof e != "object" || Array.isArray(e))
    return e === undefined ? a : e;
  let t = Array.isArray(a) ? [...a] : { ...a };
  for (let s of Object.keys(e)) {
    let n = a ? a[s] : undefined,
      l = e[s];
    if (
      n &&
      typeof n == "object" &&
      !Array.isArray(n) &&
      l &&
      typeof l == "object" &&
      !Array.isArray(l)
    ) {
      t[s] = deepMerge(n, l);
    } else {
      t[s] = l;
    }
  }
  return t;
}
let storageBroken = false;
function loadState() {
  try {
    let a = localStorage.getItem(STORAGE_KEY);
    return a
      ? migrate(deepMerge(clone(DEFAULT_STATE), JSON.parse(a)))
      : clone(DEFAULT_STATE);
  } catch {
    storageBroken = true;
    return clone(DEFAULT_STATE);
  }
}
// Datos guardados por versiones anteriores.
function migrate(st) {
  if (st.path.done.values && !st.countPath.passed.values) {
    st.countPath = {
      ...st.countPath,
      passed: { ...st.countPath.passed, values: { at: Date.now(), score: 1 } },
    };
  }
  return st;
}
function clone(a) {
  return JSON.parse(JSON.stringify(a));
}
let currentState = loadState();
const listeners = new Set();
let saveTimer = null;
function saveNow() {
  if (!storageBroken)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch {
      storageBroken = true;
    }
}
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 250);
}
if (typeof document < "u") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveNow();
    }
  });
  window.addEventListener("pagehide", saveNow);
}
function getState() {
  return currentState;
}
function setState(a) {
  let e = typeof a == "function" ? a(currentState) : { ...currentState, ...a };
  if (e !== currentState) {
    currentState = e;
    scheduleSave();
    for (let t of listeners) {
      t();
    }
  }
}
function subscribe(a) {
  listeners.add(a);
  return () => listeners.delete(a);
}
function useStore() {
  return useSyncExternalStore(subscribe, getState, getState);
}
function canPersist() {
  return !storageBroken;
}
function dayKey(a = new Date()) {
  let e = a.getFullYear(),
    t = String(a.getMonth() + 1).padStart(2, "0"),
    s = String(a.getDate()).padStart(2, "0");
  return `${e}-${t}-${s}`;
}
function addDays(a, e) {
  let [t, s, n] = a.split("-").map(Number),
    l = new Date(t, s - 1, n);
  l.setDate(l.getDate() + e);
  return dayKey(l);
}
function activityStreak(a) {
  let e = dayKey(),
    t = a[e] ? e : a[addDays(e, -1)] ? addDays(e, -1) : null;
  if (!t) return 0;
  let s = 0,
    n = t;
  for (; a[n]; ) {
    s++;
    n = addDays(n, -1);
  }
  return s;
}
function markActive(a) {
  let e = dayKey();
  return a.activity[e] ? a : { ...a, activity: { ...a.activity, [e]: true } };
}
function setSettings(a) {
  setState((e) => ({ ...e, settings: { ...e.settings, ...a } }));
}
function setRules(a) {
  setState((e) => ({
    ...e,
    settings: { ...e.settings, rules: { ...e.settings.rules, ...a } },
  }));
}
function setTable(a) {
  setState((e) => ({ ...e, table: { ...e.table, ...a } }));
}
function applyRating(a, e) {
  let t = Math.max(100, a.rating.value + e),
    s = Math.max(a.rating.peak, t);
  return { ...a, rating: { ...a.rating, value: t, peak: s } };
}
function recordSpot(a, e) {
  setState((t) => {
    let s = { ...t.train.cells },
      n = s[a] ? { ...s[a] } : { n: 0, ok: 0, recent: [] };
    n.n += 1;
    if (e) {
      n.ok += 1;
    }
    n.recent = [...(n.recent || []), e ? 1 : 0].slice(-6);
    n.last = Date.now();
    s[a] = n;
    return markActive({
      ...t,
      train: {
        ...t.train,
        cells: s,
        totalHands: t.train.totalHands + 1,
        totalOk: t.train.totalOk + (e ? 1 : 0),
      },
    });
  });
}
function recordTrainSession(a) {
  setState((e) => {
    let t = [...e.train.sessions, a].slice(-120),
      s = [...e.rating.history, { t: Date.now(), v: a.after }].slice(-200),
      n = e.train.bestSession;
    if (
      a.kind !== "exam" &&
      (!n ||
        a.ok / a.n > n.ok / n.n ||
        (a.ok / a.n === n.ok / n.n && a.n > n.n))
    ) {
      n = { ok: a.ok, n: a.n, t: a.t };
    }
    let l = Math.max(e.train.longestStreak, a.bestStreak || 0),
      i =
        a.kind === "exam"
          ? [...e.train.exams, { t: a.t, ok: a.ok, n: a.n }].slice(-50)
          : e.train.exams;
    return markActive({
      ...e,
      train: {
        ...e.train,
        sessions: t,
        bestSession: n,
        longestStreak: l,
        exams: i,
      },
      rating: { ...e.rating, history: s },
    });
  });
}
function recordDrill(a, e, t) {
  setState((s) => {
    let n = { ...(s.drills[a] || { sessions: [] }) };
    n.sessions = [...(n.sessions || []), e].slice(-100);
    if (t) {
      Object.assign(n, t(n));
    }
    return markActive({ ...s, drills: { ...s.drills, [a]: n } });
  });
}
function completeLesson(a, e) {
  setState((t) => {
    let s = t.lessons[a] || {},
      n = Math.max(s.best || 0, e);
    return markActive({
      ...t,
      lessons: {
        ...t.lessons,
        [a]: { done: true, best: n, at: Date.now(), viaTest: false },
      },
    });
  });
}
function markPathDone(a) {
  setState((e) =>
    markActive({
      ...e,
      path: { ...e.path, done: { ...e.path.done, [a]: true } },
    }),
  );
}
function recordLevel(id, ok, score) {
  setState((st) => {
    const cp = st.countPath;
    const prev = cp.passed[id];
    const passed =
      ok && (!prev || score > prev.score)
        ? { ...cp.passed, [id]: { at: Date.now(), score } }
        : cp.passed;
    return markActive({
      ...st,
      countPath: {
        ...cp,
        passed,
        tries: { ...cp.tries, [id]: (cp.tries[id] || 0) + 1 },
      },
    });
  });
}
// Errores para repetir: una mano fallada entra a la lista (o suma un fallo si ya estaba);
// sale cuando la acertás dos veces seguidas, en cualquier lado.
const MAX_MISTAKES = 40;
function recordHandResult(hand, ok) {
  setState((st) => {
    const list = st.train.mistakes || [];
    const i = list.findIndex((m) => m.key === hand.key);
    let next;
    if (ok) {
      if (i < 0) return st;
      const streak = (list[i].streak || 0) + 1;
      if (streak >= 2) {
        return {
          ...st,
          train: {
            ...st.train,
            mistakes: list.filter((_, k) => k !== i),
            fixed: (st.train.fixed || 0) + 1,
          },
        };
      }
      next = list.map((m, k) => (k === i ? { ...m, streak } : m));
    } else {
      const prev = i >= 0 ? list[i] : null;
      const item = {
        key: hand.key,
        cards: hand.cards,
        up: hand.up,
        chosen: hand.chosen,
        best: hand.best,
        src: hand.src || "train",
        t: Date.now(),
        misses: (prev ? prev.misses : 0) + 1,
        streak: 0,
      };
      next = [...list.filter((_, k) => k !== i), item]
        .sort((a, b) => a.t - b.t)
        .slice(-MAX_MISTAKES);
    }
    return { ...st, train: { ...st.train, mistakes: next } };
  });
}
// Tarjetas de la tabla: cada casilla sube de caja cuando la acertás y vuelve a la primera si fallás.
const SRS_DAYS = [0, 1, 3, 7, 14, 30, 60];
function recordSrs(key, ok) {
  setState((st) => {
    const prev = st.srs.cards[key];
    const box = ok
      ? Math.min(SRS_DAYS.length - 1, (prev ? prev.box : 0) + 1)
      : 1;
    const due = ok
      ? Date.now() + SRS_DAYS[box] * DAY_MS - 3 * 3600e3
      : Date.now();
    const today = dayKey();
    const isNew = !prev;
    return {
      ...st,
      srs: {
        ...st.srs,
        cards: {
          ...st.srs.cards,
          [key]: {
            box,
            due,
            n: (prev ? prev.n : 0) + 1,
            ok: (prev ? prev.ok : 0) + (ok ? 1 : 0),
          },
        },
        newDay: today,
        newToday:
          (st.srs.newDay === today ? st.srs.newToday : 0) + (isNew ? 1 : 0),
      },
    };
  });
}
function recordDevLevel(id, passed, score) {
  setState((st) => {
    const prev = st.devPath.passed[id];
    return markActive({
      ...st,
      devPath: {
        passed:
          passed && (!prev || score > prev.score)
            ? {
                ...st.devPath.passed,
                [id]: { at: prev ? prev.at : Date.now(), score },
              }
            : st.devPath.passed,
        tries: { ...st.devPath.tries, [id]: (st.devPath.tries[id] || 0) + 1 },
      },
    });
  });
}
function recordCasinoTrip(trip) {
  setState((st) =>
    markActive({
      ...st,
      casino: { ...st.casino, trips: [...st.casino.trips, trip].slice(-40) },
    }),
  );
}
// Práctica con ayuda de un nivel de la ruta de conteo (no cuenta como intento).
function recordLevelPractice(id) {
  setState((st) => {
    const cp = st.countPath;
    const practiced = cp.practiced || {};
    return markActive({
      ...st,
      countPath: {
        ...cp,
        practiced: { ...practiced, [id]: (practiced[id] || 0) + 1 },
      },
    });
  });
}
// Meta diaria
function goalSeconds(st) {
  return st.dailyGoal.minutes * 60;
}
function goalDay(st, day = dayKey()) {
  const d = st.dailyGoal.days[day];
  return { s: d ? d.s : 0, g: d ? d.g : goalSeconds(st) };
}
function goalMet(st, day = dayKey()) {
  const d = goalDay(st, day);
  return d.s >= d.g;
}
// Días seguidos cumpliendo la meta (si hoy todavía no la cumpliste, cuenta hasta ayer).
function goalStreak(st) {
  let day = dayKey();
  if (!goalMet(st, day)) day = addDays(day, -1);
  let n = 0;
  while (goalMet(st, day) && st.dailyGoal.days[day]) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}
function addPracticeTime(seconds) {
  setState((st) => {
    const day = dayKey();
    const cur = goalDay(st, day);
    return {
      ...st,
      dailyGoal: {
        ...st.dailyGoal,
        days: { ...st.dailyGoal.days, [day]: { s: cur.s + seconds, g: cur.g } },
      },
    };
  });
}
function setGoalMinutes(minutes) {
  setState((st) => {
    const day = dayKey();
    const cur = goalDay(st, day);
    return {
      ...st,
      dailyGoal: {
        ...st.dailyGoal,
        minutes,
        chosen: true,
        days: { ...st.dailyGoal.days, [day]: { s: cur.s, g: minutes * 60 } },
      },
    };
  });
}
// Repaso: una pregunta fallada entra a la lista; sale cuando la acertás dos veces en el repaso.
const DAY_MS = 86400000;
function recordReviewAnswer(lessonId, step, ok, sig, fromReview = false) {
  setState((st) => {
    const key = `${lessonId}:${step}`;
    const prev = st.review.items[key];
    const items = { ...st.review.items };
    if (ok) {
      if (!prev) return st;
      if (!fromReview) return st; // acertarla dentro de la lección no la saca del repaso
      const streak = (prev.streak || 0) + 1;
      if (streak >= 2) delete items[key];
      else items[key] = { ...prev, streak, due: Date.now() + 2 * DAY_MS };
    } else {
      items[key] = {
        lesson: lessonId,
        step,
        sig,
        misses: (prev ? prev.misses : 0) + 1,
        streak: 0,
        due: Date.now() + (fromReview ? 0 : 3600000),
        at: Date.now(),
      };
    }
    return { ...st, review: { ...st.review, items } };
  });
}
function dropReviewItem(key) {
  setState((st) => {
    if (!st.review.items[key]) return st;
    const items = { ...st.review.items };
    delete items[key];
    return { ...st, review: { ...st.review, items } };
  });
}
function resetAll() {
  currentState = clone(DEFAULT_STATE);
  saveNow();
  for (let a of listeners) {
    a();
  }
}
function exportBackup() {
  let a = JSON.stringify(currentState);
  return "V21:" + btoa(unescape(encodeURIComponent(a)));
}
// Lee un respaldo sin aplicarlo (para mostrar qué tiene antes de restaurar).
function readBackup(a) {
  let e = String(a || "").trim();
  if (!e.startsWith("V21:"))
    throw new Error("El código no es un respaldo de Edge 21.");
  let s;
  try {
    s = JSON.parse(
      decodeURIComponent(escape(atob(e.slice(4).replace(/\s+/g, "")))),
    );
  } catch {
    throw new Error("El código está incompleto o dañado.");
  }
  if (!s || s.v !== 1)
    throw new Error("El respaldo no tiene un formato válido.");
  return migrate(deepMerge(clone(DEFAULT_STATE), s));
}
function importBackup(a) {
  currentState = readBackup(a);
  saveNow();
  for (let n of listeners) {
    n();
  }
}
export {
  TABLE_PRESETS,
  dropReviewItem,
  recordReviewAnswer,
  addPracticeTime,
  goalDay,
  goalMet,
  goalSeconds,
  goalStreak,
  recordHandResult,
  recordCasinoTrip,
  recordDevLevel,
  recordSrs,
  SRS_DAYS,
  recordLevel,
  recordLevelPractice,
  setGoalMinutes,
  activityStreak,
  addDays,
  applyRating,
  canPersist,
  completeLesson,
  dayKey,
  describeRules,
  eloDelta,
  exportBackup,
  readBackup,
  getState,
  importBackup,
  levelFor,
  markActive,
  markPathDone,
  nextLevel,
  recordDrill,
  recordSpot,
  recordTrainSession,
  resetAll,
  rulesKey,
  setRules,
  setSettings,
  setState,
  setTable,
  useStore,
  withRules,
};
