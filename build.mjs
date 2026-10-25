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
  define: { "process.env.NODE_ENV": '"production"', __APP_VERSION__: JSON.stringify(version) },
});
const css = await esbuild.transform(fs.readFileSync("src/styles.css", "utf8"), { loader: "css", minify: true, target: "safari15" });

const script = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = fs
  .readFileSync("src/index.html", "utf8")
  .replace("/*STYLES*/", () => css.code.trim())
  .replace("/*SCRIPT*/", () => script.trim());
fs.writeFileSync("index.html", html);

const hash = crypto.createHash("sha256").update(html).digest("hex").slice(0, 10);
fs.writeFileSync("sw.js", fs.readFileSync("src/sw.js", "utf8").replaceAll("__VERSION__", version).replaceAll("__HASH__", hash));

console.log(`index.html ${(html.length / 1024).toFixed(0)} KB · versión ${version} · caché ${hash}`);
