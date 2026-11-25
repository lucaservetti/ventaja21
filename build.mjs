// Builds the single-file app: src/ -> index.html (+ sw.js with a fresh cache name).
// Usage: npm run build
import * as esbuild from "esbuild";
import fs from "node:fs";
import crypto from "node:crypto";
import { transform } from "./scripts/i18n-core.mjs";

// Textos en inglés: la compilación envuelve en __t()/__tf() los textos que están en el diccionario,
// y cambia el formato de números y fechas según el idioma (ver src/i18n/).
const EN = JSON.parse(fs.readFileSync("src/i18n/en.json", "utf8"));
// Portugués (Brasil): mismas claves que el inglés.
const PT = JSON.parse(fs.readFileSync("src/i18n/pt.json", "utf8"));
const i18nPlugin = {
  name: "i18n",
  setup(build) {
    build.onLoad({ filter: /[\\/]src[\\/].*\.jsx?$/ }, (args) => {
      if (/[\\/]i18n[\\/]/.test(args.path) || args.path.endsWith("sw.js")) return undefined;
      let code = fs.readFileSync(args.path, "utf8");
      code = transform(code, EN) ?? code;
      code = code.replaceAll('"es-UY"', "__LOCALE").replaceAll('.replace(".", ",")', ".replace(\".\", __DEC)");
      return { contents: code, loader: "jsx" };
    });
  },
};

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
// Firebase (cuenta de Google opcional, ranking y errores). Vacío = apagado. Ver CUENTA_GOOGLE.md.
const fbFile = JSON.parse(fs.readFileSync("firebase.config.json", "utf8"));
const firebase = {
  apiKey: process.env.FIREBASE_API_KEY || fbFile.apiKey || "",
  projectId: process.env.FIREBASE_PROJECT_ID || fbFile.projectId || "",
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID || fbFile.webClientId || "",
  // Servidor de premios (servidor/): da los días de Premium de regalo.
  api: process.env.PREMIOS_API || fbFile.api || "https://api.edge21.app",
  // Cuentas que ven el panel de la medición (el servidor lo controla igual: DUENOS en wrangler.toml).
  duenos: fbFile.duenos || [],
  // Solo para pruebas locales con los emuladores de Firebase.
  ...(process.env.FIREBASE_EMULATOR ? { emulator: process.env.FIREBASE_EMULATOR } : {}),
};
const version = pkg.version;
// Pagos de Premium en la web (Paddle). Ver PAGOS_WEB.md.
const pagos = JSON.parse(fs.readFileSync("pagos.config.json", "utf8"));
// Anuncios en la web (AdSense). Vacío = sin anuncios. Ver ANUNCIOS_WEB.md.
// ADSENSE_CLIENTE reemplaza al del archivo (lo usan las pruebas: tests/e2e/anuncios.mjs).
const anuncios = { ...(JSON.parse(fs.readFileSync("anuncios.config.json", "utf8")).adsense || {}), ...(process.env.ADSENSE_CLIENTE ? { cliente: process.env.ADSENSE_CLIENTE } : {}) };
const ADSENSE = anuncios.cliente ? { cliente: anuncios.cliente, prueba: !!anuncios.prueba } : null;
if (ADSENSE && !/^ca-pub-\d{10,20}$/.test(ADSENSE.cliente)) throw new Error(`anuncios.config.json: el cliente de AdSense tiene que ser "ca-pub-" y números (está "${ADSENSE.cliente}")`);

// Los diccionarios van en archivos aparte, con su huella en el nombre (app/i18n/en-<huella>.json): la
// app trae solo el de su idioma (src/i18n/arranque.js) y el service worker los guarda entre versiones.
const DICS = Object.fromEntries(
  [["en", EN], ["pt", PT]].map(([l, d]) => {
    const json = JSON.stringify(d);
    return [l, { json, ruta: `i18n/${l}-${crypto.createHash("sha256").update(json).digest("hex").slice(0, 10)}.json` }];
  }),
);
const I18N = Object.fromEntries(Object.entries(DICS).map(([l, d]) => [l, d.ruta]));

const js = await esbuild.build({
  entryPoints: ["src/i18n/arranque.js"],
  bundle: true,
  format: "iife",
  minify: true,
  write: false,
  jsx: "automatic",
  target: "es2020",
  legalComments: "none",
  plugins: [i18nPlugin],
  inject: ["src/i18n/inject.js"],
  charset: "utf8",
  define: {
    "process.env.NODE_ENV": '"production"',
    __APP_VERSION__: JSON.stringify(version),
    __I18N__: JSON.stringify(I18N),
    __FIREBASE__: JSON.stringify(firebase.apiKey && firebase.projectId ? firebase : null),
    __PAGOS__: JSON.stringify({ paddle: pagos.paddle, mostrar: pagos.mostrar }),
    __ADSENSE__: JSON.stringify(ADSENSE),
    // Anuncio intersticial de AdMob para Android. Sin la variable, se usa el anuncio de prueba de Google.
    __ADMOB_INTERSTITIAL__: JSON.stringify(process.env.ADMOB_INTERSTITIAL_ID || "ca-app-pub-3940256099942544/1033173712"),
    __ADMOB_REWARDED__: JSON.stringify(process.env.ADMOB_REWARDED_ID || "ca-app-pub-3940256099942544/5224354917"),
  },
});
const css = await esbuild.transform(fs.readFileSync("app/fonts/fonts.css", "utf8") + fs.readFileSync("src/styles.css", "utf8"), { loader: "css", minify: true, target: "safari15" });

const script = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = fs
  .readFileSync("src/index.html", "utf8")
  .replace("/*STYLES*/", () => css.code.trim())
  .replace("/*SCRIPT*/", () => script.trim());
// Política de seguridad de la web: el navegador solo corre el código de la app (por su huella) y el
// de Google para entrar con la cuenta, y solo habla con Firebase y con el servidor de Edge 21. Si
// alguien lograra meter código en la página, no corre. Solo en la web: en Android, Capacitor agrega
// su propio código a la página y esta política lo frenaría.
const huella = crypto.createHash("sha256").update(script.trim()).digest("base64");
const local = firebase.emulator || /^http:/.test(firebase.api) ? " http://127.0.0.1:* http://localhost:*" : "";
// Con anuncios en la web: el código de AdSense, sus marcos y el mensaje de consentimiento de Google.
const ads = ADSENSE
  ? {
      script: " https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.adtrafficquality.google https://fundingchoicesmessages.google.com https://www.google.com https://www.gstatic.com",
      connect: " https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://fundingchoicesmessages.google.com https://www.google.com",
      frame: " https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://fundingchoicesmessages.google.com https://www.google.com",
    }
  : { script: "", connect: "", frame: "" };
const csp = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${huella}' https://accounts.google.com/gsi/client https://cdn.paddle.com${ads.script}`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com ${firebase.api} https://accounts.google.com/gsi/ https://*.paddle.com${ads.connect}${local}`,
  `frame-src https://accounts.google.com/gsi/ https://buy.paddle.com https://sandbox-buy.paddle.com${ads.frame}`,
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
const htmlWeb = html.replace('<meta charset="utf-8">', () => `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);
// La app vive en app/ (edge21.app/app); en el inicio está la página de presentación.
fs.writeFileSync("app/index.html", htmlWeb);
// ads.txt (en la raíz del sitio): le dice a Google qué cuenta de AdSense puede vender anuncios aquí.
if (ADSENSE) fs.writeFileSync("ads.txt", `google.com, ${ADSENSE.cliente.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`);
else fs.rmSync("ads.txt", { force: true });
fs.rmSync("app/i18n", { recursive: true, force: true });
fs.mkdirSync("app/i18n");
for (const d of Object.values(DICS)) fs.writeFileSync(`app/${d.ruta}`, d.json);

const hash = crypto.createHash("sha256").update(htmlWeb + JSON.stringify(I18N)).digest("hex").slice(0, 10);
const fontFiles = fs.readdirSync("app/fonts").filter((f) => f.endsWith(".woff2")).map((f) => `  "./fonts/${f}",`).join("\n");
fs.writeFileSync(
  "app/sw.js",
  fs.readFileSync("src/sw.js", "utf8").replaceAll("__VERSION__", version).replaceAll("__HASH__", hash).replace("  /*FONTS*/", fontFiles).replace("__I18N__", JSON.stringify(I18N)),
);

// Carpeta www/: la misma app para el proyecto Android (Capacitor). No va al repositorio.
fs.rmSync("www", { recursive: true, force: true });
fs.mkdirSync("www");
fs.writeFileSync("www/index.html", html);
for (const f of ["manifest.webmanifest", "favicon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"])
  fs.copyFileSync(`app/${f}`, `www/${f}`);
fs.copyFileSync("privacidad.html", "www/privacidad.html");
fs.cpSync("app/fonts", "www/fonts", { recursive: true });
fs.cpSync("app/i18n", "www/i18n", { recursive: true });

console.log(`index.html ${(html.length / 1024).toFixed(0)} KB · versión ${version} · caché ${hash}`);
