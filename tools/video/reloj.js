// Reloj virtual para grabar la app cuadro por cuadro (se inyecta antes de que cargue la página).
// El tiempo no corre solo: avanza 1/60 de segundo por cuadro cuando el grabador lo pide, así
// cada cuadro sale perfecto aunque la compu tarde en sacar la captura. Mueve setTimeout,
// setInterval, requestAnimationFrame, Date, performance.now, las animaciones de CSS
// (transiciones incluidas) y el scroll suave.
(() => {
  const T0 = Number(window.__V_EPOCH || Date.now());
  const RealDate = Date;
  let vt = 0;
  let seq = 0;
  const timers = new Map();
  const rafs = new Map();
  window.setTimeout = (fn, ms = 0, ...args) => {
    const id = ++seq;
    timers.set(id, { at: vt + Math.max(0, Number(ms) || 0), fn, args, iv: 0 });
    return id;
  };
  window.setInterval = (fn, ms = 0, ...args) => {
    const id = ++seq;
    const iv = Math.max(1, Number(ms) || 0);
    timers.set(id, { at: vt + iv, fn, args, iv });
    return id;
  };
  window.clearTimeout = window.clearInterval = (id) => timers.delete(id);
  window.requestAnimationFrame = (fn) => {
    const id = ++seq;
    rafs.set(id, fn);
    return id;
  };
  window.cancelAnimationFrame = (id) => rafs.delete(id);
  window.requestIdleCallback = (fn) => window.setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 10 }), 50);
  window.cancelIdleCallback = (id) => timers.delete(id);
  performance.now = () => vt;
  class VDate extends RealDate {
    constructor(...a) {
      if (a.length === 0) super(T0 + vt);
      else super(...a);
    }
    static now() {
      return T0 + vt;
    }
  }
  window.Date = VDate;

  // Scroll suave movido por el reloj virtual (el del navegador usa el reloj real).
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function glide(el, top, ms = 450) {
    const from = el.scrollTop;
    const t0 = vt;
    const step = () => {
      const k = Math.min(1, (vt - t0) / ms);
      el.scrollTop = from + (top - from) * ease(k);
      if (k < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
  const realScrollTo = Element.prototype.scrollTo;
  Element.prototype.scrollTo = function (a, b) {
    if (a && typeof a === "object" && a.behavior === "smooth") return glide(this, a.top ?? this.scrollTop);
    return realScrollTo.call(this, a, b);
  };
  const realIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (o) {
    if (!(o && typeof o === "object" && o.behavior === "smooth")) return realIntoView.call(this, o);
    let p = this.parentElement;
    while (p && !(p.scrollHeight > p.clientHeight && /(auto|scroll)/.test(getComputedStyle(p).overflowY))) p = p.parentElement;
    if (!p) return;
    const r = this.getBoundingClientRect();
    const pr = p.getBoundingClientRect();
    let d = 0;
    if (o.block === "nearest") {
      if (r.bottom > pr.bottom) d = r.bottom - pr.bottom + 12;
      else if (r.top < pr.top) d = r.top - pr.top - 12;
    } else d = r.top - pr.top;
    if (d) glide(p, p.scrollTop + d);
  };

  // Avanza el reloj: corre los timers que vencen, los cuadros de animación y pone cada
  // animación de CSS en el punto exacto.
  function syncAnimations() {
    for (const a of document.getAnimations()) {
      if (a.__v0 === undefined) {
        a.__v0 = vt - (Number(a.currentTime) || 0);
        a.pause();
      }
      a.currentTime = Math.max(0, vt - a.__v0);
    }
  }
  function advance(ms) {
    const end = vt + ms;
    for (;;) {
      let next = null;
      for (const [id, t] of timers) if (t.at <= end && (!next || t.at < next[1].at)) next = [id, t];
      if (!next) break;
      const [id, t] = next;
      vt = Math.max(vt, t.at);
      if (t.iv) t.at += t.iv;
      else timers.delete(id);
      try {
        t.fn(...t.args);
      } catch (e) {
        console.error(e);
      }
    }
    vt = end;
    const list = [...rafs.values()];
    rafs.clear();
    for (const fn of list)
      try {
        fn(vt);
      } catch (e) {
        console.error(e);
      }
    syncAnimations();
  }
  window.__clock = { advance, sync: syncAnimations, get t() { return vt; } };
})();
