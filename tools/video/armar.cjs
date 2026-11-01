// Arma los videos finales a 60 FPS con ffmpeg (ver README.md).
// Uso: node tools/video/armar.cjs <es|en> [vertical|tienda]
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const L = process.argv[2] || "es";
const que = process.argv[3] || "todo";
const S = path.join(__dirname, "salida");
const TIKTOK = process.env.TIKTOK === "1";
const P = path.join(S, `piezas-${L}${TIKTOK ? "-tiktok" : ""}`);
const FPS = 60;
const ROOT = path.resolve(__dirname, "../..");
const frames = (k) => path.join(S, `${L}-${k}`, "f%05d.png");
const dur = (k) => fs.readdirSync(path.join(S, `${L}-${k}`)).filter((f) => f.endsWith(".png")).length / FPS;
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const enc = ["-r", String(FPS), "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
// Entrada suave (ease-out): de "desde" a 0 en "d" segundos.
const slide = (from, d, delay = 0) => `${from}*pow(1-min(max(t-${delay},0)/${d},1),3)`;

// ---- Verticales para TikTok, Reels y Shorts (1080x1920) ----
function vertical(k, { cuenta = null } = {}) {
  const d = dur(k);
  const total = +(d + 1.0).toFixed(3);
  const out = path.join(ROOT, "store/video/redes", `edge21-${k}-${L}${TIKTOK ? "-tiktok" : ""}.mp4`);
  const inputs = [
    "-loop", "1", "-framerate", String(FPS), "-i", path.join(P, "v-fondo.png"),
    "-loop", "1", "-framerate", String(FPS), "-i", path.join(P, `v-titulo-${k}.png`),
    "-loop", "1", "-framerate", String(FPS), "-i", path.join(P, "v-marco.png"),
    "-framerate", String(FPS), "-i", frames(k),
    "-loop", "1", "-framerate", String(FPS), "-i", path.join(P, "v-mascara.png"),
  ];
  let f =
    `[3:v]scale=578:1250:flags=lanczos,format=rgba,tpad=stop_mode=clone:stop_duration=1.0[app];` +
    `[4:v]format=gray[m];[app][m]alphamerge[appm];` +
    `[1:v]format=rgba,fade=t=in:st=0:d=0.6:alpha=1[ti];` +
    `[2:v]format=rgba,fade=t=in:st=0.1:d=0.6:alpha=1[mk];` +
    `[appm]fade=t=in:st=0.1:d=0.6:alpha=1[ap];` +
    `[0:v][ti]overlay=x=0:y='120+${slide(40, 0.7)}':eval=frame[a];` +
    `[a][mk]overlay=x=163:y='390+${slide(90, 0.8, 0.1)}':eval=frame[b];` +
    `[b][ap]overlay=x=251:y='478+${slide(90, 0.8, 0.1)}':eval=frame[c]`;
  let last = "c";
  if (cuenta) {
    inputs.push("-itsoffset", String(cuenta), "-framerate", String(FPS), "-i", path.join(P, "cuenta", "c%04d.png"));
    const cd = fs.readdirSync(path.join(P, "cuenta")).length / FPS;
    f += `;[5:v]format=rgba,fade=t=in:st=${cuenta}:d=0.25:alpha=1,fade=t=out:st=${(cuenta + cd - 0.3).toFixed(3)}:d=0.3:alpha=1[cd];` +
      `[c][cd]overlay=x=230:y='308+${slide(30, 0.35, cuenta)}':eval=frame:eof_action=pass[e]`;
    last = "e";
  }
  f += `;[${last}]fade=t=out:st=${(total - 0.5).toFixed(3)}:d=0.5,format=yuv420p[out]`;
  ff([...inputs, "-filter_complex", f, "-map", "[out]", "-t", String(total), ...enc, out]);
  console.log(path.relative(ROOT, out), total.toFixed(2) + " s");
}

// ---- Video de la tienda (1920x1080): escenas con fundido cruzado y cierre ----
function tienda() {
  const order = [["learn", 5.6], ["train", 5.4], ["count", 7.6], ["table", 6.6], ["progress", 5.6]];
  const X = 0.4;
  const inputs = [];
  let f = "";
  order.forEach(([k, cap], i) => {
    const d = Math.min(dur(k), cap);
    inputs.push("-loop", "1", "-framerate", String(FPS), "-t", String(d), "-i", path.join(P, `h-${k}.png`));
    inputs.push("-framerate", String(FPS), "-t", String(d), "-i", frames(k));
    f += `[${2 * i + 1}:v]scale=444:960:flags=lanczos,format=rgba[a${i}];[m${i}]format=gray[mm${i}];[a${i}][mm${i}]alphamerge[am${i}];[${2 * i}:v][am${i}]overlay=1332:60,format=yuv420p,setsar=1[s${i}];`;
    order[i].push(d);
  });
  const n = order.length;
  inputs.push("-loop", "1", "-framerate", String(FPS), "-t", "3.5", "-i", path.join(P, "h-fin.png"));
  f += `[${2 * n}:v]format=yuv420p,setsar=1[s${n}];`;
  inputs.push("-loop", "1", "-i", path.join(P, "h-mascara.png"));
  // la máscara se reparte a todas las escenas
  f = `[${2 * n + 1}:v]split=${n}${order.map((_, i) => `[m${i}]`).join("")};` + f;
  let acc = "s0";
  let t = order[0][2];
  for (let i = 1; i <= n; i++) {
    const off = (t - X).toFixed(3);
    f += `[${acc}][s${i}]xfade=transition=fade:duration=${X}:offset=${off}[x${i}];`;
    acc = `x${i}`;
    t = t - X + (i < n ? order[i][2] : 3.5);
  }
  f += `[${acc}]fade=t=in:st=0:d=0.4,fade=t=out:st=${(t - 0.6).toFixed(3)}:d=0.6[out]`;
  const out = path.join(ROOT, "store/video", `edge21-video-${L}.mp4`);
  ff([...inputs, "-filter_complex", f, "-map", "[out]", "-t", t.toFixed(3), ...enc, out]);
  console.log(path.relative(ROOT, out), t.toFixed(2) + " s");
}

if (TIKTOK) {
  // En TikTok, solo los videos sin plata ni fichas en pantalla.
  vertical("quiz", { cuenta: 1.3 });
  vertical("count");
} else if (que === "todo" || que === "vertical") {
  vertical("quiz", { cuenta: 1.3 });
  vertical("count");
  vertical("table");
  vertical("learn");
}
if (!TIKTOK && (que === "todo" || que === "tienda")) tienda();
