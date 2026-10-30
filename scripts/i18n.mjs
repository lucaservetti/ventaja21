// Lista los textos de la app que todavía no tienen traducción al inglés.
// Uso: node scripts/i18n.mjs [--all]   (escribe scripts/i18n-faltan.json)
import fs from "node:fs";
import path from "node:path";
import { collect } from "./i18n-core.mjs";
const en = JSON.parse(fs.readFileSync("src/i18n/en.json", "utf8"));

const files = [];
(function scan(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) scan(p);
    else if (/\.(js|jsx)$/.test(f) && !p.includes("i18n")) files.push(p);
  }
})("src");
const human = (s) =>
  /[a-záéíóúñü]{2}/i.test(s) &&
  (/\s/.test(s) ||
    /[áéíóúñü¿¡]/i.test(s) ||
    /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+[.!?:]?$/.test(s));
const keyUse = new Set();
const seen = new Map();
for (const f of files) {
  if (f.endsWith("sw.js")) continue;
  for (const it of collect(fs.readFileSync(f, "utf8"))) {
    if (it.keyCtx) {
      keyUse.add(it.key);
      continue;
    }
    if (!human(it.key.replace(/\{\d+\}/g, ""))) continue;
    if (!seen.has(it.key)) seen.set(it.key, { file: f, kind: it.kind });
  }
}
const all = process.argv.includes("--all");
const out = [...seen]
  .filter(([k]) => all || !(k in en))
  .map(([k, v]) => ({ k, f: v.file.replace("src/", ""), kind: v.kind }));
const clash = [...seen.keys()].filter((k) => keyUse.has(k) && k in en);
fs.writeFileSync("scripts/i18n-faltan.json", JSON.stringify(out, null, 1));
console.log(
  `${seen.size} textos · ${out.length} sin traducir · ${Object.keys(en).length} en el diccionario`,
);
if (clash.length) console.log("Ojo, también se usan como clave:", clash);
