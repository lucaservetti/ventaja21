// Arma los datos de la tabla (con el "por qué" de cada casilla) en español y en inglés, con el
// mismo motor y las mismas traducciones que la app. Uso: node tools/guias/datos.mjs > archivo.json
import * as esbuild from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { transform } from "../../scripts/i18n-core.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/en.json"), "utf8"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "guias-"));
await esbuild.build({
  entryPoints: [path.join(ROOT, "tools/guias/entrada.js")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: path.join(tmp, "datos.mjs"),
  jsx: "automatic",
  logLevel: "error",
  inject: [path.join(ROOT, "src/i18n/inject.js")],
  plugins: [
    {
      name: "i18n",
      setup(build) {
        build.onLoad({ filter: /[\\/]src[\\/].*\.jsx?$/ }, (args) => {
          if (/[\\/]i18n[\\/]/.test(args.path)) return undefined;
          let code = fs.readFileSync(args.path, "utf8");
          code = transform(code, EN) ?? code;
          code = code.replaceAll('"es-UY"', "__LOCALE").replaceAll('.replace(".", ",")', '.replace(".", __DEC)');
          return { contents: code, loader: "jsx" };
        });
      },
    },
  ],
});
const VARIANTES = { s17: { h17: false, das: true, surrender: false }, h17: { h17: true, das: true, surrender: false } };
fs.writeFileSync(path.join(tmp, "en.json"), JSON.stringify(EN));
fs.writeFileSync(
  path.join(tmp, "correr.mjs"),
  `import fs from "node:fs";
const lang = process.argv[2];
const EN = fs.readFileSync(new URL("./en.json", import.meta.url), "utf8");
globalThis.localStorage = { getItem: (k) => (k === "edge21.lang" ? lang : null), setItem() {}, removeItem() {} };
globalThis.document = { getElementById: () => ({ textContent: EN }), documentElement: {}, addEventListener() {}, removeEventListener() {} };
globalThis.window = globalThis; globalThis.addEventListener = () => {};
const { tabla } = await import("./datos.mjs");
const v = ${JSON.stringify(VARIANTES)};
process.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(v).map(([k, r]) => [k, tabla(r)]))));`,
);
const out = {};
for (const lang of ["es", "en"])
  out[lang] = JSON.parse(execFileSync(process.execPath, [path.join(tmp, "correr.mjs"), lang], { maxBuffer: 64e6 }).toString());
fs.rmSync(tmp, { recursive: true, force: true });
process.stdout.write(JSON.stringify(out));
