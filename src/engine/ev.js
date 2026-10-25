const RANK_PROBS = [
  0, 0.07692307692307693, 0.07692307692307693, 0.07692307692307693,
  0.07692307692307693, 0.07692307692307693, 0.07692307692307693,
  0.07692307692307693, 0.07692307692307693, 0.07692307692307693,
  0.3076923076923077,
];
function dealerDist(a, e, { conditionNoBJ: t = true } = {}) {
  let s = new Map();
  function n(c, r) {
    let u = c * 2 + (r ? 1 : 0),
      d = s.get(u);
    if (d) return d;
    let p = new Float64Array(6),
      f = r && c + 10 <= 21,
      y = f ? c + 10 : c;
    if (c > 21) {
      p[5] = 1;
    } else if (y > 17 || (y === 17 && !(f && e))) {
      p[y - 17] = 1;
    } else
      for (let C = 1; C <= 10; C++) {
        let k = n(c + C, r || C === 1);
        for (let v = 0; v < 6; v++) {
          p[v] += RANK_PROBS[C] * k[v];
        }
      }
    s.set(u, p);
    return p;
  }
  let l = new Float64Array(6),
    i = 0,
    o = (c) => t && ((a === 1 && c === 10) || (a === 10 && c === 1));
  for (let c = 1; c <= 10; c++) {
    if (!o(c)) {
      i += RANK_PROBS[c];
    }
  }
  for (let c = 1; c <= 10; c++) {
    if (o(c)) continue;
    let r = n(a + c, a === 1 || c === 1);
    for (let u = 0; u < 6; u++) {
      l[u] += (RANK_PROBS[c] / i) * r[u];
    }
  }
  return l;
}
function bustChances(a) {
  let e = {};
  for (let t = 1; t <= 10; t++) {
    let s = dealerDist(t, a, { conditionNoBJ: false });
    e[t] = s[5];
  }
  return e;
}
function buildEV(a) {
  let e = new Map();
  function t(l) {
    if (e.has(l)) return e.get(l);
    let i = dealerDist(l, a.h17),
      o = new Float64Array(22);
    for (let D = 0; D <= 21; D++) {
      let _ = i[5],
        M = 0;
      for (let R = 17; R <= 21; R++) {
        let V = i[R - 17];
        if (R < D) {
          _ += V;
        } else {
          if (R > D) {
            M += V;
          }
        }
      }
      o[D] = _ - M;
    }
    let c = (D, _) => (_ && D + 10 <= 21 ? D + 10 : D),
      r = new Map(),
      u = (D, _) => (D > 21 ? -1 : o[c(D, _)]);
    function d(D, _) {
      let M = D * 2 + (_ ? 1 : 0),
        R = r.get(M);
      if (R !== undefined) return R;
      let V = 0;
      for (let B = 1; B <= 10; B++) {
        let Z = D + B;
        V += RANK_PROBS[B] * (Z > 21 ? -1 : p(Z, _ || B === 1));
      }
      r.set(M, V);
      return V;
    }
    function p(D, _) {
      return c(D, _) === 21 ? u(D, _) : Math.max(u(D, _), d(D, _));
    }
    function f(D, _) {
      let M = 0;
      for (let R = 1; R <= 10; R++) {
        let V = D + R;
        M += RANK_PROBS[R] * (V > 21 ? -1 : o[c(V, _ || R === 1)]);
      }
      return 2 * M;
    }
    function y(D, _) {
      let M = c(D, _),
        R = _ && D + 10 <= 21;
      return a.doubleOn === "9-11"
        ? !R && M >= 9 && M <= 11
        : a.doubleOn === "10-11"
          ? !R && M >= 10 && M <= 11
          : M < 21;
    }
    let C = new Map();
    function k(D) {
      if (C.has(D)) return C.get(D);
      let _ = D === 1,
        M = RANK_PROBS[D],
        R = _ ? (a.rsa ? a.maxHands : 2) : a.maxHands,
        V = (ca) => {
          let ha = D + ca,
            Ia = _ || ca === 1;
          if (_ && !a.hitSplitAces) return u(ha, Ia);
          let X = p(ha, Ia);
          if (a.das && y(ha, Ia)) {
            X = Math.max(X, f(ha, Ia));
          }
          return X;
        },
        B = 0;
      for (let ca = 1; ca <= 10; ca++) {
        if (ca !== D) {
          B += RANK_PROBS[ca] * V(ca);
        }
      }
      B /= 1 - M;
      let Z = V(D),
        ta = new Map();
      function Ba(ca, ha) {
        if (ca === 0) return 0;
        let Ia = ca * 16 + ha;
        if (ta.has(Ia)) return ta.get(Ia);
        let X =
          M * (ha < R ? Ba(ca + 1, ha + 1) : Z + Ba(ca - 1, ha)) +
          (1 - M) * (B + Ba(ca - 1, ha));
        ta.set(Ia, X);
        return X;
      }
      let Ma = Ba(2, 2);
      C.set(D, Ma);
      return Ma;
    }
    let v = (D, _) => {
        if (D > 21) return { w: 0, t: 0, l: 1 };
        let M = c(D, _),
          R = i[5],
          V = 0,
          B = 0;
        for (let Z = 17; Z <= 21; Z++) {
          let ta = i[Z - 17];
          if (Z < M) {
            R += ta;
          } else {
            if (Z === M) {
              V += ta;
            } else {
              B += ta;
            }
          }
        }
        return { w: R, t: V, l: B };
      },
      m = new Map();
    function b(D, _) {
      let M = D * 2 + (_ ? 1 : 0);
      if (m.has(M)) return m.get(M);
      let R = { w: 0, t: 0, l: 0 };
      for (let V = 1; V <= 10; V++) {
        let B = D + V,
          Z = _ || V === 1,
          ta;
        if (B > 21) {
          ta = { w: 0, t: 0, l: 1 };
        } else {
          if (c(B, Z) === 21 || u(B, Z) >= d(B, Z)) {
            ta = v(B, Z);
          } else {
            ta = b(B, Z);
          }
        }
        R.w += RANK_PROBS[V] * ta.w;
        R.t += RANK_PROBS[V] * ta.t;
        R.l += RANK_PROBS[V] * ta.l;
      }
      m.set(M, R);
      return R;
    }
    let S = {
      dist: i,
      standEV: o,
      stand: u,
      hit: d,
      best: p,
      dbl: f,
      split: k,
      canDoubleTotal: y,
      totalOf: c,
      standOut: v,
      hitOut: b,
    };
    e.set(l, S);
    return S;
  }
  function s({
    hard: l,
    hasAce: i,
    nCards: o,
    pairValue: c,
    upValue: r,
    allowDouble: u = true,
    allowSplit: d = true,
    allowSurrender: p = true,
  }) {
    let f = t(r),
      y = {};
    y.S = f.stand(l, i);
    if (f.totalOf(l, i) < 21) {
      y.H = f.hit(l, i);
    }
    if (o === 2 && u && f.canDoubleTotal(l, i)) {
      y.D = f.dbl(l, i);
    }
    if (o === 2 && d && c) {
      y.P = f.split(c);
    }
    if (o === 2 && p && a.surrender) {
      y.R = -0.5;
    }
    return y;
  }
  function n() {
    let l = 0;
    for (let i = 1; i <= 10; i++) {
      let o = i === 1 ? RANK_PROBS[10] : i === 10 ? RANK_PROBS[1] : 0,
        c = 0,
        r = 0;
      for (let u = 1; u <= 10; u++)
        for (let d = 1; d <= 10; d++) {
          let p = RANK_PROBS[u] * RANK_PROBS[d];
          if ((u === 1 && d === 10) || (u === 10 && d === 1)) {
            c += p * a.bjPays;
          } else {
            let y = s({
              hard: u + d,
              hasAce: u === 1 || d === 1,
              nCards: 2,
              pairValue: u === d ? u : 0,
              upValue: i,
            });
            c += p * Math.max(...Object.values(y));
            r += p * -1;
          }
        }
      l += RANK_PROBS[i] * (o * r + (1 - o) * c);
    }
    return l;
  }
  return { forUp: t, actions: s, gameEV: n };
}
const evCache = new Map();
function evFor(a) {
  let e = [
    a.h17,
    a.das,
    a.surrender,
    a.doubleOn,
    a.rsa,
    a.maxHands,
    a.bjPays,
  ].join("|");
  if (!evCache.has(e)) {
    evCache.set(e, buildEV(a));
  }
  return evCache.get(e);
}
function rankNum(a) {
  return a === "A"
    ? 1
    : a === "10" || a === "J" || a === "Q" || a === "K" || a === "T"
      ? 10
      : +a;
}
function actionEVs(a, e, t, s) {
  let n = 0,
    l = false;
  for (let r of a) {
    let u = rankNum(r.r);
    n += u;
    if (u === 1) {
      l = true;
    }
  }
  let i =
    a.length === 2 && rankNum(a[0].r) === rankNum(a[1].r) ? rankNum(a[0].r) : 0;
  return evFor(t).actions({
    hard: n,
    hasAce: l,
    nCards: a.length,
    pairValue: i,
    upValue: rankNum(e),
    allowDouble: s ? s.D : true,
    allowSplit: s ? s.P : true,
    allowSurrender: s ? s.R : true,
  });
}
export { actionEVs, bustChances, dealerDist, evFor, rankNum };
