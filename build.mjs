// Builds the single-file app: src/ -> index.html (+ sw.js with a fresh cache name).
// Usage: npm run build
import * as esbuild from "esbuild";
import fs from "node:fs";
import crypto from "node:crypto";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = pkg.version;

const js = await esbuild.build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  format: "iife",
  minify: true,
  write: false,
  jsx: "automatic",
  target: "es2020",
  legalComments: "none",
  charset: "utf8",
  define: {
    "process.env.NODE_ENV": '"production"',
    __APP_VERSION__: JSON.stringify(version),
    // Anuncio intersticial de AdMob para Android. Sin la variable, se usa el anuncio de prueba de Google.
    __ADMOB_INTERSTITIAL__: JSON.stringify(process.env.ADMOB_INTERSTITIAL_ID || "ca-app-pub-3940256099942544/1033173712"),
  },
});
const css = await esbuild.transform(fs.readFileSync("fonts/fonts.css", "utf8") + fs.readFileSync("src/styles.css", "utf8"), { loader: "css", minify: true, target: "safari15" });

const script = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = fs
  .readFileSync("src/index.html", "utf8")
  .replace("/*STYLES*/", () => css.code.trim())
  .replace("/*SCRIPT*/", () => script.trim());
fs.writeFileSync("index.html", html);

const hash = crypto.createHash("sha256").update(html).digest("hex").slice(0, 10);
const fontFiles = fs.readdirSync("fonts").filter((f) => f.endsWith(".woff2")).map((f) => `  "./fonts/${f}",`).join("\n");
fs.writeFileSync(
  "sw.js",
  fs.readFileSync("src/sw.js", "utf8").replaceAll("__VERSION__", version).replaceAll("__HASH__", hash).replace("  /*FONTS*/", fontFiles),
);

// Carpeta www/: la misma app para el proyecto Android (Capacitor). No va al repositorio.
fs.rmSync("www", { recursive: true, force: true });
fs.mkdirSync("www");
for (const f of ["index.html", "manifest.webmanifest", "favicon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "privacidad.html"])
  if (fs.existsSync(f)) fs.copyFileSync(f, `www/${f}`);
fs.cpSync("fonts", "www/fonts", { recursive: true });

console.log(`index.html ${(html.length / 1024).toFixed(0)} KB · versión ${version} · caché ${hash}`);
