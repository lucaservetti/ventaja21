import { parseSpot, skillSpots } from "./trainer.js";

function skillStats(a, e, t) {
  let s =
      e === "count"
        ? Object.keys(a).filter((u) => u.startsWith("C:"))
        : skillSpots(e, t),
    n = 0,
    l = 0,
    i = 0,
    o = 0,
    c = 0;
  for (let u of s) {
    let d = a[u];
    if (d) {
      c++;
      n += d.n;
      l += d.ok;
      for (let p of d.recent || []) {
        i++;
        o += p;
      }
    }
  }
  let r = e === "count" ? 18 : s.length;
  return { n, ok: l, acc: i ? o / i : null, coverage: Math.min(1, c / r) };
}
function skillGrade(a) {
  return a == null
    ? { label: "Sin empezar", tone: "" }
    : a >= 0.9
      ? { label: "Fuerte", tone: "good" }
      : a >= 0.7
        ? { label: "Bien", tone: "mid" }
        : { label: "A mejorar", tone: "bad" };
}
function weakSpots(a, { min: e = 2, limit: t = 5 } = {}) {
  let s = [];
  for (let [n, l] of Object.entries(a)) {
    if (n.startsWith("C:")) continue;
    let i = l.recent || [];
    if (i.length < e) continue;
    let o = i.reduce((c, r) => c + r, 0) / i.length;
    if (o < 0.75) {
      s.push({ key: n, acc: o, n: l.n });
    }
  }
  s.sort((n, l) => n.acc - l.acc || l.n - n.n);
  return s.slice(0, t);
}
function strongSpots(a, { min: e = 3, limit: t = 5 } = {}) {
  let s = [];
  for (let [n, l] of Object.entries(a)) {
    if (n.startsWith("C:")) continue;
    let i = l.recent || [];
    if (i.length < e) continue;
    let o = i.reduce((r, u) => r + u, 0) / i.length,
      c = parseSpot(n);
    if (!(c.kind === "hard" && (c.total <= 8 || c.total >= 17))) {
      if (o >= 0.95) {
        s.push({ key: n, acc: o, n: l.n });
      }
    }
  }
  s.sort((n, l) => l.n - n.n);
  return s.slice(0, t);
}
function spotsAccuracy(a, e) {
  let t = 0,
    s = 0;
  for (let n of e) {
    let l = a[n];
    if (l) {
      t += l.n;
      s += l.ok;
    }
  }
  return { n: t, ok: s, acc: t ? s / t : null };
}
export { skillGrade, skillStats, spotsAccuracy, strongSpots, weakSpots };
