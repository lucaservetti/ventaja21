// Efectos de sonido de los videos, sintetizados (no hay archivos ni música con derechos):
// corre dentro de Chromium con OfflineAudioContext y devuelve un WAV en base64.
// Son los mismos sonidos de la app (src/sound.js: carta, fichas, acierto, error) más los de video:
// whoosh, tic, latido, sello, brillo, subida y el cierre.
// eslint-disable-next-line no-unused-vars
async function pistaDeSonido(cues, dur) {
  const SR = 48000;
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * dur), SR);
  let s = 12345;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const vary = (x, a = 0.08) => x * (1 + (rnd() * 2 - 1) * a);

  // Bus: compresor + un poco de salón.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -22;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.18;
  comp.connect(ctx.destination);
  const bus = ctx.createGain();
  bus.connect(comp);
  const room = ctx.createConvolver();
  {
    const n = Math.floor(SR * 1.3);
    const b = ctx.createBuffer(2, n, SR);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, 3.4);
    }
    room.buffer = b;
  }
  const wet = ctx.createGain();
  wet.gain.value = 0.16;
  bus.connect(room);
  room.connect(wet).connect(comp);

  const ruido = ctx.createBuffer(1, SR * 3, SR);
  {
    const d = ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
  }
  const salida = (pan = 0) => {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(bus);
    return p;
  };

  function tono(f, d, { t, type = "sine", vol = 0.1, slide = 0, attack = 0.006, pan = 0 }) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(1e-4, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(1e-4, t + d);
    o.connect(g).connect(salida(pan));
    o.start(t);
    o.stop(t + d + 0.05);
  }
  // Ruido filtrado. sweep: [f0, f1, f2] mueve el filtro pasabanda; forma "subida" sube de a poco.
  function ruidoF(d, { t, vol = 0.1, hp = 0, lp = 0, bp = 0, q = 0.9, attack = 0.002, sweep = null, pan = 0, panA = null, forma = "golpe" }) {
    const src = ctx.createBufferSource();
    src.buffer = ruido;
    let nodo = src;
    const f = ctx.createBiquadFilter();
    if (sweep) {
      f.type = "bandpass";
      f.Q.value = q;
      f.frequency.setValueAtTime(sweep[0], t);
      f.frequency.exponentialRampToValueAtTime(sweep[1], t + d * (sweep.length > 2 ? 0.6 : 1));
      if (sweep.length > 2) f.frequency.exponentialRampToValueAtTime(sweep[2], t + d);
    } else if (bp) {
      f.type = "bandpass";
      f.frequency.value = bp;
      f.Q.value = q;
    } else if (lp) {
      f.type = "lowpass";
      f.frequency.value = lp;
    } else {
      f.type = "highpass";
      f.frequency.value = hp || 1500;
    }
    nodo = nodo.connect(f);
    const g = ctx.createGain();
    g.gain.setValueAtTime(1e-4, t);
    if (forma === "subida") {
      g.gain.exponentialRampToValueAtTime(vol, t + d * 0.96);
      g.gain.linearRampToValueAtTime(1e-4, t + d);
    } else if (forma === "ola") {
      g.gain.linearRampToValueAtTime(vol, t + d * 0.55);
      g.gain.exponentialRampToValueAtTime(1e-4, t + d);
    } else {
      g.gain.exponentialRampToValueAtTime(vol, t + attack);
      g.gain.exponentialRampToValueAtTime(1e-4, t + d);
    }
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(panA ? panA[0] : pan, t);
    if (panA) p.pan.linearRampToValueAtTime(panA[1], t + d);
    p.connect(bus);
    nodo.connect(g).connect(p);
    src.start(t, rnd() * 2, d + 0.05);
  }
  const mazo = (f, t, vol = 0.08, pan = 0) => {
    tono(f, 0.36, { t, vol, attack: 0.003, pan });
    tono(f * 4, 0.07, { t, vol: vol * 0.25, attack: 0.002, pan });
  };
  const clink = (t, vol = 1) => {
    const r = vary(1, 0.06);
    tono(2750 * r, 0.11, { t, vol: 0.06 * vol, attack: 0.002 });
    tono(4320 * r, 0.07, { t, vol: 0.035 * vol, attack: 0.002 });
    tono(6150 * r, 0.045, { t, vol: 0.02 * vol, attack: 0.001 });
    ruidoF(0.012, { t, vol: 0.05 * vol, hp: 5000 });
  };

  const SFX = {
    carta(t, v) {
      ruidoF(0.07, { t, vol: 0.32 * v, bp: vary(3200, 0.15), q: 0.8, pan: 0.25 });
      ruidoF(0.02, { t: t + 0.05, vol: 0.14 * v, hp: 5500 });
      tono(vary(170, 0.1), 0.06, { t: t + 0.055, vol: 0.12 * v, slide: -60, attack: 0.002 });
    },
    flip(t, v) {
      ruidoF(0.05, { t, vol: 0.22 * v, bp: 2600, q: 1 });
      ruidoF(0.06, { t: t + 0.08, vol: 0.2 * v, bp: 4200, q: 1 });
    },
    swish(t, v) {
      ruidoF(0.22, { t, vol: 0.14 * v, sweep: [700, 3200], q: 1.2, forma: "ola" });
    },
    whoosh(t, v) {
      ruidoF(0.5, { t: t - 0.12, vol: 0.3 * v, sweep: [320, 2600, 700], q: 1.1, forma: "ola", panA: [-0.5, 0.5] });
    },
    pop(t, v) {
      tono(vary(880, 0.05), 0.1, { t, vol: 0.2 * v, slide: -480, attack: 0.002 });
      ruidoF(0.012, { t, vol: 0.05 * v, hp: 4000 });
    },
    blip(t, v, p = 1) {
      tono(660 * p, 0.07, { t, vol: 0.11 * v, type: "triangle", attack: 0.003 });
      tono(990 * p, 0.09, { t: t + 0.05, vol: 0.09 * v, type: "triangle", attack: 0.003 });
    },
    tick(t, v, p = 1) {
      tono(1900 * p, 0.045, { t, vol: 0.2 * v, attack: 0.001 });
      tono(3800 * p, 0.025, { t, vol: 0.06 * v, attack: 0.001 });
      ruidoF(0.006, { t, vol: 0.05 * v, hp: 5000 });
    },
    latido(t, v) {
      tono(85, 0.17, { t, vol: 0.55 * v, slide: -35, attack: 0.004 });
      tono(170, 0.1, { t, vol: 0.12 * v, slide: -60, attack: 0.004 });
      tono(75, 0.15, { t: t + 0.2, vol: 0.38 * v, slide: -30, attack: 0.004 });
    },
    bien(t, v) {
      mazo(880, t, 0.1 * v);
      mazo(1320, t + 0.08, 0.09 * v);
    },
    ding(t, v) {
      mazo(1047, t, 0.11 * v, -0.15);
      mazo(1568, t + 0.09, 0.1 * v, 0.15);
      tono(1047 * 2.76, 0.6, { t, vol: 0.025 * v, attack: 0.002 });
      tono(2093, 1.2, { t: t + 0.09, vol: 0.03 * v, attack: 0.004 });
    },
    error(t, v) {
      tono(196, 0.28, { t, vol: 0.16 * v, type: "triangle", slide: -40 });
      tono(147, 0.32, { t: t + 0.07, vol: 0.13 * v, type: "triangle" });
    },
    sello(t, v) {
      tono(150, 0.34, { t, vol: 0.36 * v, slide: -100, attack: 0.002 });
      tono(300, 0.12, { t, vol: 0.1 * v, slide: -180, attack: 0.002 });
      ruidoF(0.12, { t, vol: 0.26 * v, lp: 1200, attack: 0.001 });
      ruidoF(0.04, { t, vol: 0.16 * v, hp: 2500, attack: 0.001 });
    },
    subida(t, v, p = 1, d = 1.4) {
      ruidoF(d, { t, vol: 0.2 * v, sweep: [300, 6000], q: 1.6, forma: "subida" });
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(440, t + d);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      g.gain.setValueAtTime(1e-4, t);
      g.gain.exponentialRampToValueAtTime(0.035 * v, t + d * 0.95);
      g.gain.linearRampToValueAtTime(1e-4, t + d);
      o.connect(lp).connect(g).connect(salida(0));
      o.start(t);
      o.stop(t + d + 0.02);
    },
    brillo(t, v) {
      for (let i = 0; i < 9; i++) {
        const f = 2400 + rnd() * 3600;
        tono(f, 0.22, { t: t + rnd() * 0.45, vol: 0.035 * v, attack: 0.002, pan: rnd() * 1.6 - 0.8 });
      }
    },
    fichas(t, v) {
      clink(t, v);
      clink(t + 0.06, 0.7 * v);
      clink(t + 0.11, 0.5 * v);
    },
    barajar(t, v) {
      const n = 26;
      for (let i = 0; i < n; i++) {
        const tt = t + 0.6 * Math.pow(i / n, 0.8);
        ruidoF(0.02, { t: tt, vol: (0.05 + 0.06 * Math.sin((Math.PI * i) / n)) * v, bp: vary(3000, 0.2), q: 1.2 });
      }
    },
    // Base musical original (sintetizada acá, sin derechos de autor): 100 BPM, La menor – Fa – Do – Sol.
    // Bombo, palmas, platillo cerrado, bajo y un acorde suave. Termina con el cierre.
    musica(t, v, p, d) {
      const bpm = 100;
      const b = 60 / bpm;
      const acordes = [
        [110, [220, 261.63, 329.63]],
        [87.31, [174.61, 220, 261.63]],
        [130.81, [261.63, 329.63, 392]],
        [98, [196, 246.94, 293.66]],
      ];
      const fin = t + d - 0.2;
      const bus2 = ctx.createGain();
      bus2.gain.setValueAtTime(1e-4, t);
      bus2.gain.linearRampToValueAtTime(0.9 * v, t + 0.25);
      bus2.gain.setValueAtTime(0.9 * v, fin - 1.2);
      bus2.gain.linearRampToValueAtTime(1e-4, fin);
      bus2.connect(bus);
      const nota = (f, tt, dur, vol, type = "sine", destino = bus2) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, tt);
        g.gain.setValueAtTime(1e-4, tt);
        g.gain.exponentialRampToValueAtTime(vol, tt + 0.01);
        g.gain.exponentialRampToValueAtTime(1e-4, tt + dur);
        o.connect(g).connect(destino);
        o.start(tt);
        o.stop(tt + dur + 0.05);
      };
      const lpBajo = ctx.createBiquadFilter();
      lpBajo.type = "lowpass";
      lpBajo.frequency.value = 700;
      lpBajo.connect(bus2);
      for (let k = 0, tt = t; tt < fin; k++, tt += b) {
        const beat = k % 4;
        const [raiz, triada] = acordes[Math.floor(k / 4) % 4];
        // Bombo en 1 y 3, y uno chico antes del 3.
        if (beat === 0 || beat === 2) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.setValueAtTime(130, tt);
          o.frequency.exponentialRampToValueAtTime(42, tt + 0.16);
          g.gain.setValueAtTime(1e-4, tt);
          g.gain.exponentialRampToValueAtTime(0.42, tt + 0.004);
          g.gain.exponentialRampToValueAtTime(1e-4, tt + 0.3);
          o.connect(g).connect(bus2);
          o.start(tt);
          o.stop(tt + 0.35);
        }
        if (beat === 1 && k % 8 === 5) nota(55, tt + b * 0.5, 0.18, 0.18);
        // Palmas en 2 y 4.
        if (beat === 1 || beat === 3) {
          for (const dt of [0, 0.012, 0.022]) {
            const src = ctx.createBufferSource();
            src.buffer = ruido;
            const f = ctx.createBiquadFilter();
            f.type = "bandpass";
            f.frequency.value = 1500;
            f.Q.value = 0.9;
            const g = ctx.createGain();
            g.gain.setValueAtTime(1e-4, tt + dt);
            g.gain.exponentialRampToValueAtTime(0.11, tt + dt + 0.002);
            g.gain.exponentialRampToValueAtTime(1e-4, tt + dt + 0.12);
            src.connect(f).connect(g).connect(bus2);
            src.start(tt + dt, rnd() * 2, 0.15);
          }
        }
        // Platillo cerrado en corcheas (el de contratiempo, más fuerte).
        for (const [dt, vol] of [[0, 0.025], [b / 2, 0.045]]) {
          const src = ctx.createBufferSource();
          src.buffer = ruido;
          const f = ctx.createBiquadFilter();
          f.type = "highpass";
          f.frequency.value = 7500;
          const g = ctx.createGain();
          g.gain.setValueAtTime(1e-4, tt + dt);
          g.gain.exponentialRampToValueAtTime(vol, tt + dt + 0.002);
          g.gain.exponentialRampToValueAtTime(1e-4, tt + dt + 0.045);
          src.connect(f).connect(g).connect(bus2);
          src.start(tt + dt, rnd() * 2, 0.06);
        }
        // Bajo: raíz en 1 y en el "y" del 2.
        if (beat === 0) nota(raiz, tt, b * 1.2, 0.2, "triangle", lpBajo);
        if (beat === 1) nota(raiz, tt + b / 2, b * 0.8, 0.14, "triangle", lpBajo);
        if (beat === 3 && k % 8 === 7) nota(raiz * 1.5, tt, b * 0.7, 0.12, "triangle", lpBajo);
        // Acorde suave al empezar cada compás, y una campanita arriba cada dos.
        if (beat === 0) for (const f of triada) nota(f, tt, b * 3.6, 0.022);
        if (beat === 0 && k % 8 === 0) nota(triada[2] * 2, tt + b * 1.5, 0.5, 0.018);
      }
    },
    // Murmullo de salón muy suave de fondo, para que no haya silencios muertos.
    ambiente(t, v, p, d) {
      const n = Math.floor(SR * d);
      const b = ctx.createBuffer(1, n, SR);
      const x = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        last = (last + 0.02 * (rnd() * 2 - 1)) / 1.02;
        x[i] = last * 3.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = b;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 420;
      band.Q.value = 0.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(1e-4, t);
      g.gain.linearRampToValueAtTime(0.014 * v, t + 0.8);
      g.gain.setValueAtTime(0.014 * v, t + d - 1);
      g.gain.linearRampToValueAtTime(1e-4, t + d);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.09;
      const lg = ctx.createGain();
      lg.gain.value = 0.005 * v;
      lfo.connect(lg).connect(g.gain);
      src.connect(band).connect(g).connect(comp);
      src.start(t);
      lfo.start(t);
      lfo.stop(t + d);
    },
    outro(t, v) {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => mazo(f, t + i * 0.09, 0.085 * v, (i - 1.5) * 0.2));
      for (let i = 0; i < 3; i++) clink(t + 0.42 + i * 0.07, (0.7 - i * 0.15) * v);
      // Acorde suave de fondo.
      [261.63, 329.63, 392].forEach((f) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(1e-4, t);
        g.gain.linearRampToValueAtTime(0.035 * v, t + 0.35);
        g.gain.exponentialRampToValueAtTime(1e-4, t + 2.4);
        o.connect(g).connect(salida(0));
        o.start(t);
        o.stop(t + 2.5);
      });
    },
  };
  for (const c of cues) {
    const f = SFX[c.n];
    if (!f) throw new Error(`Sonido desconocido: ${c.n}`);
    f(c.t, c.v ?? 1, c.p ?? 1, c.d);
  }
  const buf = await ctx.startRendering();
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  let pico = 1e-6;
  for (let i = 0; i < L.length; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
  const k = 0.89 / pico;
  // WAV de 16 bits estéreo.
  const n = L.length;
  const ab = new ArrayBuffer(44 + n * 4);
  const dv = new DataView(ab);
  const str = (o, x) => [...x].forEach((ch, i) => dv.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF");
  dv.setUint32(4, 36 + n * 4, true);
  str(8, "WAVEfmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 2, true);
  dv.setUint32(24, SR, true);
  dv.setUint32(28, SR * 4, true);
  dv.setUint16(32, 4, true);
  dv.setUint16(34, 16, true);
  str(36, "data");
  dv.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * k)) * 32767, true);
    dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i] * k)) * 32767, true);
  }
  const bytes = new Uint8Array(ab);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
