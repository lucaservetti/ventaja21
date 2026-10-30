import { Capacitor } from "@capacitor/core";
import { Haptics } from "@capacitor/haptics";
import { getState } from "./state.js";

let audioCtx = null;
function getAudio() {
  if (!getState().settings.sound) return null;
  try {
    if (!audioCtx) {
      let a = window.AudioContext || window.webkitAudioContext;
      if (!a) return null;
      audioCtx = new a();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}
function playTone(
  a,
  e,
  { type: t = "sine", vol: s = 0.12, delay: n = 0, slide: l = 0 } = {},
) {
  let i = getAudio();
  if (!i) return;
  let o = i.currentTime + n,
    c = i.createOscillator(),
    r = i.createGain();
  c.type = t;
  c.frequency.setValueAtTime(a, o);
  if (l) {
    c.frequency.exponentialRampToValueAtTime(Math.max(40, a + l), o + e);
  }
  r.gain.setValueAtTime(1e-4, o);
  r.gain.exponentialRampToValueAtTime(s, o + 0.01);
  r.gain.exponentialRampToValueAtTime(1e-4, o + e);
  c.connect(r).connect(i.destination);
  c.start(o);
  c.stop(o + e + 0.02);
}
function playNoise(a, { vol: e = 0.08, delay: t = 0, hp: s = 1800 } = {}) {
  let n = getAudio();
  if (!n) return;
  let l = n.currentTime + t,
    i = Math.floor(n.sampleRate * a),
    o = n.createBuffer(1, i, n.sampleRate),
    c = o.getChannelData(0);
  for (let p = 0; p < i; p++) {
    c[p] = (Math.random() * 2 - 1) * (1 - p / i);
  }
  let r = n.createBufferSource();
  r.buffer = o;
  let u = n.createBiquadFilter();
  u.type = "highpass";
  u.frequency.value = s;
  let d = n.createGain();
  d.gain.value = e;
  r.connect(u).connect(d).connect(n.destination);
  r.start(l);
}
const sfx = {
  card() {
    playNoise(0.07, { vol: 0.09, hp: 2200 });
  },
  chip() {
    playTone(2400, 0.06, { type: "triangle", vol: 0.05 });
    playTone(3100, 0.05, { type: "triangle", vol: 0.04, delay: 0.03 });
  },
  good() {
    playTone(660, 0.12, { vol: 0.09 });
    playTone(990, 0.16, { vol: 0.08, delay: 0.09 });
  },
  bad() {
    playTone(220, 0.22, { type: "triangle", vol: 0.09, slide: -60 });
  },
  tap() {
    playTone(1200, 0.03, { type: "sine", vol: 0.03 });
  },
  win() {
    playTone(523, 0.12, { vol: 0.08 });
    playTone(659, 0.12, { vol: 0.08, delay: 0.1 });
    playTone(784, 0.2, { vol: 0.08, delay: 0.2 });
  },
  shuffle() {
    for (let a = 0; a < 6; a++) {
      playNoise(0.05, { vol: 0.06, delay: a * 0.06, hp: 1500 });
    }
  },
};
function vibrate(a = 10) {
  if (getState().settings.haptics)
    try {
      // En la app de Android el WebView no vibra: se usa el motor del celular.
      if (Capacitor.isNativePlatform()) {
        const ms = Array.isArray(a) ? a.reduce((t, x) => t + x, 0) : a;
        Haptics.vibrate({ duration: Math.max(5, ms) }).catch(() => {});
      } else if (navigator.vibrate) {
        navigator.vibrate(a);
      }
    } catch {}
}
export { sfx, vibrate };
