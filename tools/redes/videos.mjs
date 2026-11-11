// Videos cortos para TikTok, Reels y Shorts: 1080×1920 a 60 FPS, con efectos de sonido propios.
// Las piezas animadas están en motor.mjs y los guiones en guiones-<semana>.mjs. Cada cuadro se dibuja con
// todas las animaciones congeladas en su tiempo exacto, así sale perfecto aunque la compu sea lenta.
// El sonido se sintetiza en Chromium (sonidos.js) con los tiempos que anotó cada pieza.
//
// Uso:
//   node tools/redes/videos.mjs semana-2                        → todos los videos
//   node tools/redes/videos.mjs semana-2 2-desafio-memoria      → uno (o varios, separados por espacio)
//   node tools/redes/videos.mjs semana-2 2-desafio-memoria --solo-sonido  → rehace solo el sonido
//   node tools/redes/videos.mjs semana-2 2-desafio-memoria --cuadros=1,4.5,9 --salida=/tmp/x
//     → solo saca esos cuadros en PNG (para revisar sin grabar todo)
// Resultado: store/redes/<semana>/<video>/<video>.mp4 y portada.png
// Hace falta Playwright (con Chromium) y ffmpeg.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CSS, construir, suit } from "./motor.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, "../..");
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => { const [k, ...v] = a.slice(2).split("="); return [k, v.length ? v.join("=") : "1"]; }));
const [SEMANA = "semana-2", ...SOLO] = args.filter((a) => !a.startsWith("--"));
const FPS = Number(opt.fps || 60);
// Se dibuja al doble (2160×3840) y se achica a 1080×1920: bordes y letras más nítidos.
const ESCALA = Number(opt.escala || 2);
const { VIDEOS } = await import(`./guiones-${SEMANA}.mjs`);
const W = 1080;
const H = 1920;

const types = { ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp" };
let pagina = "";
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/video.html") return res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(pagina);
  fs.readFile(path.join(ROOT, p), (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }).end(d)));
});
await new Promise((ok) => srv.listen(0, ok));
const base = `http://localhost:${srv.address().port}`;

// Fondo vivo: luz que se mueve y palos que suben despacio.
function fondo(dur, seed) {
  let s = seed;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  let palos = "";
  for (let i = 0; i < 9; i++) {
    const tam = 90 + r() * 150;
    const r0 = r() * 360;
    palos += `<div class="palo" style="left:${(r() * 980 - 60).toFixed(0)}px;top:${(r() * 1900 - 50).toFixed(0)}px;opacity:${(0.035 + r() * 0.04).toFixed(3)};--r0:${r0.toFixed(0)}deg;--r1:${(r0 + (r() * 2 - 1) * 60).toFixed(0)}deg;animation:flota ${dur}s linear 0s both">${suit("shdc"[i % 4], tam)}</div>`;
  }
  return `<div class="fondo"></div><div class="luz" style="animation:deriva ${dur}s ease-in-out 0s both"></div>${palos}<div class="vineta"></div><div class="borde"></div>`;
}

function armarPagina(v, hecho) {
  const sac = hecho.shakes.map((t) => `sacude .5s linear ${t.toFixed(3)}s`).join(",");
  const fl = hecho.flashes.map((t) => `flash .55s ease-out ${t.toFixed(3)}s`).join(",");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}\n${hecho.css}</style></head><body>
${fondo(v.dur, v.semilla || 3)}
<div class="marca"><img src="/img/ficha.svg">@edge21.app<span class="serie">${v.serie || ""}</span></div>
<div class="prog"><i style="animation:crece ${v.dur}s linear 0s both"></i></div>
<div id="cam" style="${sac ? `animation:${sac}` : ""}">${hecho.html}</div>
<div class="pie">Edge 21 · contenido educativo, sin dinero</div>
<div class="flash" style="${fl ? `animation:${fl}` : ""}"></div>
</body></html>`;
}

async function congelar(page, seg) {
  await page.evaluate((ms) => {
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = ms;
    }
  }, seg * 1000);
}

const SONIDO = fs.readFileSync(path.join(AQUI, "sonidos.js"), "utf8");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: ESCALA });
const lista = Object.entries(VIDEOS).filter(([k]) => !SOLO.length || SOLO.includes(k));
if (!lista.length) throw new Error(`No hay videos con ese nombre. Hay: ${Object.keys(VIDEOS).join(", ")}`);

for (const [nombre, v] of lista) {
  const hecho = construir(v);
  pagina = armarPagina(v, hecho);
  await page.goto(`${base}/video.html`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  if (opt.cuadros) {
    const dir = opt.salida || path.join(ROOT, "tools/video/salida", `red-${nombre}`);
    fs.mkdirSync(dir, { recursive: true });
    for (const t of opt.cuadros.split(",").map(Number)) {
      await congelar(page, t);
      await page.screenshot({ path: path.join(dir, `${nombre}-${t.toFixed(2)}.png`) });
    }
    console.log(`✓ cuadros de ${nombre} → ${dir}`);
    continue;
  }

  const dir = path.join(ROOT, "store/redes", SEMANA, nombre);
  const tmp = path.join(ROOT, "tools/video/salida", `red-${nombre}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(tmp, { recursive: true });

  // 1) Sonido, con el volumen parejo de las redes (-16 LUFS, picos de -1,5 dB).
  await page.addScriptTag({ content: SONIDO });
  const cues = [{ t: 0, n: "ambiente", d: v.dur }, ...(v.musica ? [{ t: 0, n: "musica", d: v.dur, v: v.musica === true ? 1 : v.musica }] : []), ...hecho.cues];
  const wav64 = await page.evaluate(([c, d]) => window.pistaDeSonido(c, d), [cues, v.dur]);
  const crudo = path.join(tmp, "sonido-crudo.wav");
  fs.writeFileSync(crudo, Buffer.from(wav64, "base64"));
  const lufs = Number((execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${crudo}" -af ebur128=framelog=quiet -f null - 2>&1 | grep -E "^ +I:" | tail -1`], { encoding: "utf8" }).match(/-?[\d.]+/) || [-24])[0]);
  const wav = path.join(tmp, "sonido.wav");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", crudo, "-af", `volume=${(-16 - lufs).toFixed(1)}dB,alimiter=limit=0.84:attack=2:release=60:level=disabled`, "-ar", "48000", wav]);

  const mp4 = path.join(dir, `${nombre}.mp4`);
  if (opt["solo-sonido"] !== undefined) {
    const viejo = path.join(tmp, "video-sin-sonido.mp4");
    fs.renameSync(mp4, viejo);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", viejo, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", mp4]);
    fs.rmSync(viejo);
    console.log(`✓ sonido de ${nombre} (${lufs} LUFS → -16)`);
    continue;
  }

  // 2) Cuadros, directo a ffmpeg (sin llenar el disco de imágenes).
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-i", wav,
    "-vf", `scale=${W}:${H}:flags=lanczos`,
    "-c:v", "libx264", "-preset", "slow", "-tune", "animation", "-crf", "14", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-profile:v", "high", "-level", "4.2", "-g", String(FPS),
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-shortest", "-movflags", "+faststart", mp4,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const terminado = new Promise((ok, mal) => ff.on("close", (c) => (c ? mal(new Error(`ffmpeg salió con ${c}`)) : ok())));
  const total = Math.round(v.dur * FPS);
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await congelar(page, f / FPS);
    const jpg = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(jpg)) await new Promise((ok) => ff.stdin.once("drain", ok));
    if (f % (FPS * 5) === 0) process.stdout.write(`  ${nombre}: ${Math.round((f / total) * 100)}% (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
  }
  ff.stdin.end();
  await terminado;

  // 3) Portada: el cuadro del gancho.
  await congelar(page, v.portada ?? 1.5);
  await page.screenshot({ path: path.join(dir, "portada.png"), scale: "css" });
  console.log(`✓ ${nombre} · ${v.dur} s a ${FPS} FPS → ${path.relative(ROOT, mp4)}`);
}
await browser.close();
srv.close();
