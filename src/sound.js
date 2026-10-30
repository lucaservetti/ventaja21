// Sonidos de la app, sintetizados con Web Audio (no hay archivos de sonido).
// Todo pasa por un bus con compresor y un poco de reverberación de salón, para que suene a mesa de casino.
import { Capacitor } from "@capacitor/core";
import { Haptics } from "@capacitor/haptics";
import { getState } from "./state.js";

let audioCtx = null;
let bus = null;
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
// Respuesta de salón: ruido estéreo que se apaga en ~1 segundo.
function roomImpulse(ctx, secs = 1.1, decay = 3.2) {
  const n = Math.floor(ctx.sampleRate * secs);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < n; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  return buf;
}
function getBus(ctx) {
  if (bus) return bus;
  const input = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 4;
  const room = ctx.createConvolver();
  room.buffer = roomImpulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.14;
  input.connect(comp);
  input.connect(room);
  room.connect(wet).connect(comp);
  comp.connect(ctx.destination);
  bus = input;
  return bus;
}
const vary = (x, amt = 0.08) => x * (1 + (Math.random() * 2 - 1) * amt);

function playTone(
  a,
  e,
  {
    type: t = "sine",
    vol: s = 0.12,
    delay: n = 0,
    slide: l = 0,
    attack = 0.008,
  } = {},
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
  r.gain.exponentialRampToValueAtTime(s, o + attack);
  r.gain.exponentialRampToValueAtTime(1e-4, o + e);
  c.connect(r).connect(getBus(i));
  c.start(o);
  c.stop(o + e + 0.02);
}
function playNoise(
  a,
  {
    vol: e = 0.08,
    delay: t = 0,
    hp: s = 1800,
    bp = 0,
    q = 0.9,
    attack = 0.002,
  } = {},
) {
  let n = getAudio();
  if (!n) return;
  let l = n.currentTime + t,
    i = Math.floor(n.sampleRate * a),
    o = n.createBuffer(1, i, n.sampleRate),
    c = o.getChannelData(0);
  for (let p = 0; p < i; p++) {
    c[p] = Math.random() * 2 - 1;
  }
  let r = n.createBufferSource();
  r.buffer = o;
  let u = n.createBiquadFilter();
  if (bp) {
    u.type = "bandpass";
    u.frequency.value = bp;
    u.Q.value = q;
  } else {
    u.type = "highpass";
    u.frequency.value = s;
  }
  let d = n.createGain();
  d.gain.setValueAtTime(1e-4, l);
  d.gain.exponentialRampToValueAtTime(e, l + attack);
  d.gain.exponentialRampToValueAtTime(1e-4, l + a);
  r.connect(u).connect(d).connect(getBus(n));
  r.start(l);
}
// Una ficha de cerámica: parciales agudos que se apagan rápido, más el clic del golpe.
function clink(delay = 0, vol = 1) {
  const r = vary(1, 0.06);
  playTone(2750 * r, 0.11, { vol: 0.055 * vol, delay, attack: 0.002 });
  playTone(4320 * r, 0.07, { vol: 0.03 * vol, delay, attack: 0.002 });
  playTone(6150 * r, 0.045, { vol: 0.018 * vol, delay, attack: 0.001 });
  playNoise(0.012, { vol: 0.05 * vol, delay, hp: 5000 });
}
// Nota de marimba: seno con ataque corto y un armónico que se apaga antes.
function mallet(freq, delay = 0, vol = 0.08) {
  playTone(freq, 0.32, { vol, delay, attack: 0.003 });
  playTone(freq * 4, 0.06, { vol: vol * 0.25, delay, attack: 0.002 });
}
const sfx = {
  card() {
    playNoise(0.055, { vol: 0.2, bp: vary(3400, 0.15), q: 0.8 });
    playNoise(0.016, { vol: 0.08, hp: 6000, delay: 0.035 });
  },
  chip() {
    clink(0, 1);
    clink(0.055, 0.6);
  },
  good() {
    mallet(880);
    mallet(1320, 0.08, 0.07);
  },
  bad() {
    playTone(196, 0.26, { type: "triangle", vol: 0.08, slide: -40 });
    playTone(147, 0.3, { type: "sine", vol: 0.06, delay: 0.06 });
  },
  tap() {
    playTone(1500, 0.025, { vol: 0.025, attack: 0.002 });
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => mallet(f, i * 0.085, 0.07));
    for (let i = 0; i < 4; i++) clink(0.3 + i * 0.07, 0.7 - i * 0.12);
  },
  shuffle() {
    // Riffle: muchos golpecitos de cartas que se aceleran y se apagan.
    const n = 26;
    for (let i = 0; i < n; i++) {
      const t = 0.6 * Math.pow(i / n, 0.8);
      const v = 0.04 + 0.05 * Math.sin((Math.PI * i) / n);
      playNoise(0.02, { vol: v, bp: vary(3000, 0.2), q: 1.2, delay: t });
    }
  },
};

// Ambiente de casino (opcional): murmullo de salón y fichas a lo lejos. Solo en la mesa.
let amb = null;
function startAmbience() {
  const st = getState().settings;
  if (amb || !st.ambience) return;
  const ctx = getAudio();
  if (!ctx) return;
  const n = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // ruido marrón
    d[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 420;
  band.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 1.5);
  // El murmullo sube y baja despacio, como la gente en un salón.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain).connect(gain.gain);
  src.connect(band).connect(gain).connect(getBus(ctx));
  src.start();
  lfo.start();
  const me = { src, lfo, gain, timer: 0, ctx };
  const far = () => {
    if (amb !== me) return;
    clink(0, 0.25);
    if (Math.random() < 0.4) clink(0.08, 0.18);
    me.timer = setTimeout(far, 1500 + Math.random() * 4000);
  };
  me.timer = setTimeout(far, 1200);
  amb = me;
}
function stopAmbience() {
  if (!amb) return;
  const { src, lfo, gain, timer, ctx } = amb;
  amb = null;
  clearTimeout(timer);
  try {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
    src.stop(ctx.currentTime + 1.2);
    lfo.stop(ctx.currentTime + 1.2);
  } catch {
    // Ya estaba parado.
  }
}
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAmbience();
  });

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
export { sfx, startAmbience, stopAmbience, vibrate };
