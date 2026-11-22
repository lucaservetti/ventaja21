// El portugués tiene todos los textos del inglés, con los mismos {0}, {1}… y el mismo formato (**).
import fs from "node:fs";
const en = JSON.parse(fs.readFileSync("src/i18n/en.json", "utf8"));
const pt = JSON.parse(fs.readFileSync("src/i18n/pt.json", "utf8"));
const marcas = (s) => [(s.match(/\{\d+\}/g) || []).sort().join(), (s.match(/\*\*/g) || []).length].join("|");
const mal = [];
for (const k of Object.keys(en)) {
  if (!(k in pt)) mal.push(`falta: ${k}`);
  else if (marcas(k) !== marcas(pt[k])) mal.push(`marcas distintas: ${k} → ${pt[k]}`);
}
if (mal.length) {
  console.error(mal.slice(0, 20).join("\n"));
  process.exit(1);
}
console.log(`portugués: ${Object.keys(pt).length} textos ok`);
